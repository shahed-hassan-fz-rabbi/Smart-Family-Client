import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/family',
  '/assistant',
  '/chats',
  '/calls',
  '/tasks',
  '/calendar',
  '/reminders',
  '/notifications',
  '/updates',
  '/safety',
  '/health',
  '/profile',
  '/settings',
  '/help',
];

const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

/**
 * Cookie-presence gate only — real authorization happens in the backend on
 * every request. A forged cookie gets a page shell but every API call fails.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get('sf_token'));

  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && AUTH_PAGES.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/family/:path*',
    '/assistant/:path*',
    '/chats/:path*',
    '/calls/:path*',
    '/tasks/:path*',
    '/calendar/:path*',
    '/reminders/:path*',
    '/notifications/:path*',
    '/updates/:path*',
    '/safety/:path*',
    '/health/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/help/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
};
