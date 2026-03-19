import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '@/config/env';

function getFirebaseAdminApp(): App {
  const existing = getApps()[0];

  if (existing) {
    return existing;
  }

  if (!env.firebaseProjectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID');
  }

  if (!env.firebaseClientEmail) {
    throw new Error('Missing FIREBASE_CLIENT_EMAIL');
  }

  if (!env.firebasePrivateKey) {
    throw new Error('Missing FIREBASE_PRIVATE_KEY');
  }

  return initializeApp({
    credential: cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n'),
    }),
    projectId: env.firebaseProjectId,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
