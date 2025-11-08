#!/usr/bin/env python3
"""
add_users_from_csv.py

Usage:
  python add_users_from_csv.py users.csv --key src/lib/firebase_key.json

CSV format:
- Either with headers: email,password
- Or no headers: each row has two columns (email,password)

The script will:
- Initialize firebase-admin using the provided service account key (or GOOGLE_APPLICATION_CREDENTIALS env var or src/lib/firebase_key.json)
- For each row: create or lookup the user in Firebase Auth, then create/update a Firestore document at users/{uid} with fields: uid, email, role='user', hasVoted=False

Note: keep your service account JSON secure and do not commit it to source control.
"""

import csv
import argparse
import os
import sys
from typing import Optional, Tuple, List
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import firebase_admin
    from firebase_admin import credentials, auth, firestore
except Exception:
    print("Missing firebase_admin. Install with: pip install firebase-admin")
    raise


def init_firebase(key_path: Optional[str] = None):
    # Determine key file: explicit, env, or repo-local src/lib/firebase_key.json
    if key_path and os.path.isfile(key_path):
        cred_path = key_path
    elif os.getenv('GOOGLE_APPLICATION_CREDENTIALS') and os.path.isfile(os.getenv('GOOGLE_APPLICATION_CREDENTIALS')):
        cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    else:
        local = os.path.join(os.getcwd(), 'src', 'lib', 'firebase_key.json')
        cred_path = local if os.path.isfile(local) else None

    if cred_path is None:
        print('Could not find service account key. Provide --key / set GOOGLE_APPLICATION_CREDENTIALS / put src/lib/firebase_key.json')
        sys.exit(1)

    cred = credentials.Certificate(cred_path)
    try:
        app = firebase_admin.get_app()
    except ValueError:
        app = firebase_admin.initialize_app(cred)
    return app


def create_or_get_user(email: str, password: str):
    """Create a Firebase Auth user or return existing user by email.

    This faster version first attempts to fetch by email (avoids exceptions),
    and only creates the user when not found.
    """
    # Prefer the explicit exception class if available
    UserNotFound = getattr(auth, 'UserNotFoundError', None)
    try:
        user = auth.get_user_by_email(email)
        return user, False
    except Exception as e:
        # If get_user_by_email raised a specific UserNotFoundError, create the user.
        msg = str(e).lower()
        not_found = False
        if UserNotFound and isinstance(e, UserNotFound):
            not_found = True
        elif 'no user record' in msg or 'user-not-found' in msg or 'not found' in msg:
            not_found = True

        if not_found:
            try:
                user = auth.create_user(email=email, password=password)
                return user, True
            except Exception as ce:
                # Race: user might have been created concurrently; try fetching again
                try:
                    user = auth.get_user_by_email(email)
                    return user, False
                except Exception:
                    print(f"Failed to create or fetch user {email}: {ce}")
                    raise

        # Other errors are unexpected and should be raised
        print(f"Failed to fetch/create user {email}: {e}")
        raise


def upsert_user_doc_data(user_record, role='user'):
    """Return the document ref and data payload for later batched writes."""
    uid = user_record.uid
    data = {
        'uid': uid,
        'email': user_record.email,
        'role': role,
        'hasVoted': False,
    }
    return uid, data


def process_csv(csv_path: str, key_path: Optional[str] = None, dry_run: bool = False, workers: int = 8):
    if not os.path.isfile(csv_path):
        print(f"CSV file not found: {csv_path}")
        sys.exit(1)

    init_firebase(key_path)
    db = firestore.client()

    # Read CSV and collect entries
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            print('CSV is empty')
            return

        header = None
        first = rows[0]
        if any(isinstance(h, str) and h.lower() in ('email', 'password') for h in first) and len(first) >= 2:
            header = [h.lower() for h in first]
            start_idx = 1
        else:
            start_idx = 0

        entries: List[Tuple[str, str]] = []
        seen_emails = set()
        for i in range(start_idx, len(rows)):
            row = rows[i]
            if not row or len(row) < 2:
                print(f"Skipping malformed row {i+1}: {row}")
                continue

            if header:
                row_map = dict(zip(header, row))
                email = (row_map.get('email') or row[0]).strip()
                password = (row_map.get('password') or row[1]).strip()
            else:
                email = row[0].strip()
                password = row[1].strip()

            if not email or not password:
                print(f"Skipping empty values on row {i+1}: {row}")
                continue

            if email in seen_emails:
                print(f"Skipping duplicate email {email} (row {i+1})")
                continue
            seen_emails.add(email)
            entries.append((email, password))

    total = len(entries)
    if total == 0:
        print('No valid entries to process')
        return

    print(f"Processing {total} unique entries with {workers} workers...")

    results = []

    def worker(item: Tuple[str, str]):
        email, password = item
        try:
            user_record, created = create_or_get_user(email, password)
            return (email, True, user_record, created, None)
        except Exception as e:
            return (email, False, None, False, str(e))

    # Parallelize auth calls
    with ThreadPoolExecutor(max_workers=workers) as ex:
        future_to_entry = {ex.submit(worker, entry): entry for entry in entries}
        for idx, fut in enumerate(as_completed(future_to_entry), 1):
            email, success, user_record, created, error = fut.result()
            if not success:
                print(f"Error processing {email}: {error}")
            else:
                print(f"Processed {email} -> uid={user_record.uid} ({'created' if created else 'existing'})")
            results.append((email, success, user_record, created, error))

    if dry_run:
        created_count = sum(1 for r in results if r[1] and r[3])
        updated_count = sum(1 for r in results if r[1] and not r[3])
        print(f"Dry run complete. Would create: {created_count}, existing: {updated_count}")
        return

    # Batch Firestore writes (max 500 per batch)
    created_count = 0
    updated_count = 0
    batch = db.batch()
    ops = 0
    for email, success, user_record, created, error in results:
        if not success or user_record is None:
            continue
        uid, data = upsert_user_doc_data(user_record, role='user')
        doc_ref = db.collection('users').document(uid)
        batch.set(doc_ref, data, merge=True)
        ops += 1
        if created:
            created_count += 1
        else:
            updated_count += 1

        if ops >= 450:  # commit before hitting 500 to be safe
            batch.commit()
            batch = db.batch()
            ops = 0

    if ops > 0:
        batch.commit()

    print(f"Finished. Created: {created_count}, Updated: {updated_count}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Create Firebase users from CSV and add Firestore user documents')
    parser.add_argument('csv', help='Path to CSV file (email,password)')
    parser.add_argument('--key', help='Path to service account JSON (optional)')
    parser.add_argument('--dry-run', action='store_true', help='Do not write to Firebase, just simulate')
    parser.add_argument('--workers', type=int, default=8, help='Number of parallel workers for Auth operations')
    args = parser.parse_args()

    process_csv(args.csv, key_path=args.key, dry_run=args.dry_run, workers=args.workers)
