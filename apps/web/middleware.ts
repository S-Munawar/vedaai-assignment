import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'vedaai_auth_token';
const AUTH_PAGE_PREFIXES = ['/login', '/register', '/complete-registration'] as const;

function isAuthPage(pathname: string) {
  return AUTH_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const authPage = isAuthPage(pathname);

  if (!hasAuthCookie && !authPage) {
    const loginUrl = new URL('/login', request.url);
    const destination = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('redirect', destination);
    return NextResponse.redirect(loginUrl);
  }

  if (hasAuthCookie && authPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
