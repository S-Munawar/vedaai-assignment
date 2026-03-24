import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  mongoUri: process.env.MONGODB_URI || '',
  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  authCookieName: 'vedaai_auth_token',
  authCookieDomain: process.env.AUTH_COOKIE_DOMAIN || '',
  adminApiKey: process.env.ADMIN_API_KEY || 'dev-admin-key',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
  llmApiBaseUrl: process.env.LLM_API_BASE_URL || 'https://api.openai.com/v1',
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS || 20000),
};
