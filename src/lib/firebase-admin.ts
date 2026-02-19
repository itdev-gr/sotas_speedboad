import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

function ensureApp(): boolean {
	if (getApps().length > 0) return true;
	const projectId = import.meta.env.FIREBASE_PROJECT_ID;
	const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY;
	if (!projectId || !clientEmail || !privateKey) {
		if (import.meta.env.DEV) {
			const missing = [
				!projectId && 'FIREBASE_PROJECT_ID',
				!clientEmail && 'FIREBASE_CLIENT_EMAIL',
				!privateKey && 'FIREBASE_PRIVATE_KEY',
			].filter(Boolean);
			console.warn('[firebase-admin] Not configured. Add to .env:', missing.join(', '));
		}
		return false;
	}
	const key = (privateKey as string).replace(/\\n/g, '\n');
	initializeApp({
		credential: cert({ projectId, clientEmail, privateKey: key }),
	});
	return true;
}

export function getDb(): Firestore | null {
	if (db) return db;
	if (!ensureApp()) return null;
	db = getFirestore();
	return db;
}

export function getAdminAuth(): ReturnType<typeof getAuth> | null {
	if (!ensureApp()) return null;
	return getAuth();
}
