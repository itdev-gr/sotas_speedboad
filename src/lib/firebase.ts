/**
 * Firebase client SDK – single place for config and lazy init.
 * Uses PUBLIC_* env vars (see .env.example).
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

function hasValidConfig(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

/**
 * Get or create the Firebase app. Returns null if env config is missing.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!hasValidConfig()) return null;
  app = initializeApp(firebaseConfig);
  return app;
}

/**
 * Get Firebase Auth. Initializes app if needed. Returns null if config missing.
 */
export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  auth = getAuth(firebaseApp);
  return auth;
}

/**
 * Get Firestore. Initializes app if needed. Returns null if config missing.
 */
export function getFirebaseFirestore(): Firestore | null {
  if (db) return db;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  db = getFirestore(firebaseApp);
  return db;
}

/**
 * Get Firebase Storage. Initializes app if needed. Returns null if config missing.
 */
export function getFirebaseStorage(): FirebaseStorage | null {
  if (storage) return storage;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  storage = getStorage(firebaseApp);
  return storage;
}

/**
 * Get Analytics (browser only). Call only in client context (e.g. after DOM load).
 * Returns null if config missing or in SSR.
 */
export function getFirebaseAnalytics(): Analytics | null {
  if (analytics) return analytics;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || typeof window === 'undefined') return null;
  analytics = getAnalytics(firebaseApp);
  return analytics;
}

export { firebaseConfig };
