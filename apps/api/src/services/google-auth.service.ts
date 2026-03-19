import { getFirebaseAdminAuth } from '@/config/firebase-admin';
import { env } from '@/config/env';

export async function verifyGoogleIdToken(idToken: string) {
  if (!env.firebaseProjectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID');
  }

  const payload = await getFirebaseAdminAuth().verifyIdToken(idToken);

  if (payload.aud !== env.firebaseProjectId) {
    throw new Error('Invalid Firebase audience');
  }

  const email = typeof payload.email === 'string' ? payload.email : '';
  const name = typeof payload.name === 'string' ? payload.name : '';

  if (!email) {
    throw new Error('Google token did not include email');
  }

  return {
    email,
    name: name || email.split('@')[0] || 'Google User',
  };
}
