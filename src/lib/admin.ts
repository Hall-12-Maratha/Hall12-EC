import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import firebaseKeyEnv, { requireServiceAccount } from './firebase_key_env';

// Initialize the Admin SDK once (server-side only)
if (!admin.apps.length) {
  try {
    // If running with the Firestore emulator, the Admin SDK can connect without explicit credentials.
    const localKeyPath = path.join(process.cwd(), 'src', 'lib', 'firebase_key.json');

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      // Emulator: initialize with project id only
      admin.initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT });
    } else if (firebaseKeyEnv && (firebaseKeyEnv.client_email && firebaseKeyEnv.private_key)) {
      // Prefer explicit service account provided via environment variables
      admin.initializeApp({ credential: admin.credential.cert(firebaseKeyEnv as any) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // If a credentials file path is provided, load it and initialize
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const credsJson = JSON.parse(readFileSync(credsPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(credsJson) });
    } else if (existsSync(localKeyPath)) {
      // If user placed a local firebase_key.json in src/lib, use it
      const credsJson = JSON.parse(readFileSync(localKeyPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(credsJson) });
    } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT) {
      // Try to initialize with project id from env; this will use ADC if available
      admin.initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT });
    } else {
      // Last resort: initialize default app and let Admin SDK try application default credentials.
      admin.initializeApp();
    }
  } catch (e: any) {
    // Rethrow a clearer error so the server logs guide the developer
    throw new Error(
      `Failed to initialize firebase-admin: ${e.message || e}.\n` +
      `Ensure GOOGLE_APPLICATION_CREDENTIALS is set or the Firestore emulator is running. See https://cloud.google.com/docs/authentication/getting-started`
    );
  }
}

export const adminDb = admin.firestore();
