import { env } from '@/config/env';

export function parseCookie(cookieHeader: string | undefined, name = env.authCookieName) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((entry) => entry.trim());

  for (const entry of cookies) {
    if (entry.startsWith(`${name}=`)) {
      return decodeURIComponent(entry.slice(name.length + 1));
    }
  }

  return null;
}

export function buildAuthCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'None' : 'Lax';
  const secure = isProduction ? '; Secure' : '';

  return `${env.authCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearAuthCookie() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'None' : 'Lax';
  const secure = isProduction ? '; Secure' : '';

  return `${env.authCookieName}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`;
}
