import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'vedaai_auth_token';
const AUTH_PAGE_PREFIXES = ['/login', '/register', '/complete-registration'] as const;

function isAuthPage(pathname: string) {
  return AUTH_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || null;
}

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return true;
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/me`, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') || `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const raw = (await response.json()) as { authenticated?: boolean };
    return raw.authenticated === true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const hasValidAuth = await isAuthenticated(request);
  const authPage = isAuthPage(pathname);

  if (!hasValidAuth && !authPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasValidAuth && authPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
