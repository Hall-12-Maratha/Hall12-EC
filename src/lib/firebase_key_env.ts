// Builds a Firebase service account object from environment variables.
// Environment variables expected:
// FIREBASE_TYPE
// FIREBASE_PROJECT_ID
// FIREBASE_PRIVATE_KEY_ID
// FIREBASE_PRIVATE_KEY (may contain literal \n sequences)
// FIREBASE_CLIENT_EMAIL
// FIREBASE_CLIENT_ID
// FIREBASE_AUTH_URI
// FIREBASE_TOKEN_URI
// FIREBASE_AUTH_PROVIDER_X509_CERT_URL
// FIREBASE_CLIENT_X509_CERT_URL
// FIREBASE_UNIVERSE_DOMAIN

type ServiceAccount = {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
};

function getEnv(key: string): string | undefined {
  const v = process.env[key];
  return v === undefined || v === '' ? undefined : v;
}

function buildServiceAccountFromEnv(): ServiceAccount | null {
  // If no FIREBASE_PROJECT_ID and no FIREBASE_CLIENT_EMAIL, assume no env config
  const maybeProject = getEnv('FIREBASE_PROJECT_ID');
  const maybeClientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
  const maybePrivateKey = getEnv('FIREBASE_PRIVATE_KEY');

  if (!maybeProject && !maybeClientEmail && !maybePrivateKey) {
    return null;
  }

  // Handle escaped newlines in PRIVATE_KEY (many CI systems store key with literal \n)
  const privateKey = maybePrivateKey ? maybePrivateKey.replace(/\\n/g, '\n') : undefined;

  const sa: ServiceAccount = {
    type: getEnv('FIREBASE_TYPE') || 'service_account',
    project_id: maybeProject,
    private_key_id: getEnv('FIREBASE_PRIVATE_KEY_ID'),
    private_key: privateKey,
    client_email: maybeClientEmail,
    client_id: getEnv('FIREBASE_CLIENT_ID'),
    auth_uri: getEnv('FIREBASE_AUTH_URI') || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: getEnv('FIREBASE_TOKEN_URI') || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: getEnv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL') || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: getEnv('FIREBASE_CLIENT_X509_CERT_URL'),
    universe_domain: getEnv('FIREBASE_UNIVERSE_DOMAIN') || 'googleapis.com',
  };

  return sa;
}

export const firebaseServiceAccount = buildServiceAccountFromEnv();

export function requireServiceAccount(): ServiceAccount {
  const sa = firebaseServiceAccount;
  if (!sa) throw new Error('Firebase service account not found in environment variables');
  return sa;
}

export default firebaseServiceAccount;
