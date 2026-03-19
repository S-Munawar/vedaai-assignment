import { jwtVerify, SignJWT } from 'jose';
import { authTokenPayloadSchema, type AuthTokenPayload } from '@repo/shared/auth';
import { env } from '@/config/env';

const secretKey = new TextEncoder().encode(env.jwtSecret);

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
    const parsed = authTokenPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
