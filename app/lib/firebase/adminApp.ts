import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    // If running in development/testing without keys, return undefined to allow fallback/mock
    if (process.env.NODE_ENV === 'test') {
      return undefined;
    }
    console.warn(
      'Warning: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not defined. Firebase Admin may fail to initialize.'
    );
    return undefined;
  }

  try {
    // Parse stringified JSON service account key
    const parsed = JSON.parse(serviceAccountKey);
    console.log('Service account key parsed successfully, project:', parsed.project_id);

    // Fix the private key: replace literal \n with actual newlines
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    return parsed;
  } catch (error) {
    console.error('Make sure the environment variable is a valid JSON string with proper escaping for newlines in the private key.');
    throw new Error(
      `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string: ${(error as Error).message}`
    );
  }
}

const serviceAccount = getServiceAccount();

const adminConfig = serviceAccount
  ? { credential: cert(serviceAccount) }
  : {};

// Initialize Firebase Admin singleton
const adminApp = getApps().length === 0 ? initializeApp(adminConfig) : getApps()[0];
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
