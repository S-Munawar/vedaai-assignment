import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  authCookieName: 'vedaai_auth_token',
};
