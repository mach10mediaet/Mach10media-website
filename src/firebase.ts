import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the Firebase instances
const app = initializeApp(firebaseConfig);

// App Check only activates when VITE_APP_CHECK_SITE_KEY is set and the matching
// reCAPTCHA v3 key is registered under App Check in the Firebase console. Until
// then the app sends no app-check token and Firestore rules must not require one.
const appCheckSiteKey = import.meta.env.VITE_APP_CHECK_SITE_KEY as string | undefined;
if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
export const firebaseProjectId = firebaseConfig.projectId;
export const firestoreDatabaseLabel = ((firebaseConfig as any).firestoreDatabaseId as string | undefined) || '(default)';
export const firebaseStorageBucket = firebaseConfig.storageBucket;
export const firebaseRealtimeDatabaseUrl = firebaseConfig.databaseURL;

// Prefer an explicit named database only when provided; otherwise use the default Firestore database.
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Cache the access token in memory
let cachedAccessToken: string | null = null;

export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

export function setAccessToken(token: string | null) {
  cachedAccessToken = token;
}

// Standard login helper that prefers popups as per preview iframe constraints.
// Deliberately unscoped: the base session must not carry Drive access.
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    } else {
      console.warn('No access token returned in Google Auth credential');
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

// Drive access is requested only when the admin explicitly connects Drive
// (Media Lab), so a routine studio sign-in never holds Drive-scoped tokens.
export async function signInWithDriveScope() {
  const driveProvider = new GoogleAuthProvider();
  driveProvider.addScope('https://www.googleapis.com/auth/drive');
  const result = await signInWithPopup(auth, driveProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken ?? null;
  if (accessToken) {
    cachedAccessToken = accessToken;
  }
  return { user: result.user, accessToken };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
