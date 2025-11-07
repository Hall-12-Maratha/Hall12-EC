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
from typing import Optional

try:
    import firebase_admin
    from firebase_admin import credentials, auth, firestore
except Exception as e:
    print("Missing firebase_admin. Install with: pip install firebase-admin" )
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
    """Create a Firebase Auth user or return existing user by email."""
    try:
        user = auth.create_user(email=email, password=password)
        created = True
        return user, created
    except Exception as e:
        # If user exists, fetch by email
        err_str = str(e).lower()
        if 'already exists' in err_str or 'email' in err_str and 'already' in err_str:
            try:
                user = auth.get_user_by_email(email)
                return user, False
            except Exception as ee:
                print(f"Failed to fetch existing user for {email}: {ee}")
                raise
        else:
            print(f"Failed to create user {email}: {e}")
            raise


def upsert_user_doc(db, user_record, role='admin'):
    uid = user_record.uid
    doc_ref = db.collection('users').document(uid)
    data = {
        'uid': uid,
        'email': user_record.email,
        'role': role,
        'hasVoted': False,
    }
    doc_ref.set(data, merge=True)
    return data


def process_csv(csv_path: str, key_path: Optional[str] = None, dry_run: bool = False):
    if not os.path.isfile(csv_path):
        print(f"CSV file not found: {csv_path}")
        sys.exit(1)

    init_firebase(key_path)
    db = firestore.client()

    created_count = 0
    updated_count = 0

    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        # Peek first row to detect header
        rows = list(reader)
        if not rows:
            print('CSV is empty')
            return

        # Detect header: if first row contains 'email' and/or 'password'
        header = None
        first = rows[0]
        if any(h.lower() in ('email', 'password') for h in first if isinstance(h, str)) and len(first) >= 2:
            header = [h.lower() for h in first]
            start_idx = 1
        else:
            start_idx = 0

        for i in range(start_idx, len(rows)):
            row = rows[i]
            if not row or len(row) < 2:
                print(f"Skipping malformed row {i+1}: {row}")
                continue

            if header:
                # Use header mapping
                row_map = dict(zip(header, row))
                email = row_map.get('email') or row[0]
                password = row_map.get('password') or row[1]
            else:
                email = row[0]
                password = row[1]

            email = email.strip()
            password = password.strip()

            if not email or not password:
                print(f"Skipping empty values on row {i+1}: {row}")
                continue

            print(f"Processing row {i+1}: {email}")
            try:
                user_record, created = create_or_get_user(email, password)
                if dry_run:
                    print(f"Dry run - would {'create' if created else 'use existing'} user: {email} (uid={user_record.uid})")
                    continue

                upsert_user_doc(db, user_record)
                if created:
                    created_count += 1
                    print(f"Created user {email} (uid={user_record.uid}) and added user doc.")
                else:
                    updated_count += 1
                    print(f"User {email} already existed (uid={user_record.uid}) - updated user doc.")
            except Exception as e:
                print(f"Error processing {email}: {e}")

    print(f"Finished. Created: {created_count}, Updated: {updated_count}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Create Firebase users from CSV and add Firestore user documents')
    parser.add_argument('csv', help='Path to CSV file (email,password)')
    parser.add_argument('--key', help='Path to service account JSON (optional)')
    parser.add_argument('--dry-run', action='store_true', help='Do not write to Firebase, just simulate')
    args = parser.parse_args()

    process_csv(args.csv, key_path=args.key, dry_run=args.dry_run)
