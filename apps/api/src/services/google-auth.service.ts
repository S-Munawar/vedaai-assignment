import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '@/config/env';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export async function verifyGoogleIdToken(idToken: string) {
  if (!env.firebaseProjectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID');
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${env.firebaseProjectId}`,
    audience: env.firebaseProjectId,
  });

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
