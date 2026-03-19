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
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${env.authCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearAuthCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${env.authCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
