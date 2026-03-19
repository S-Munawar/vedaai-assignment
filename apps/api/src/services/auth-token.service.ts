import { jwtVerify, SignJWT } from 'jose';
import { env } from '@/config/env';
import { type AuthTokenPayload, isValidSchoolName } from '@/models/auth.model';

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

    if (typeof payload.sub !== 'string' || typeof payload.schoolName !== 'string') {
      return null;
    }

    if (!isValidSchoolName(payload.schoolName)) {
      return null;
    }

    return {
      sub: payload.sub,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      schoolName: payload.schoolName,
      provider: payload.provider === 'google' ? 'google' : 'credentials',
    };
  } catch {
    return null;
  }
}
