import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromEdgeCookie } from './lib/edge-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect donor routes
  if (pathname.startsWith('/donor')) {
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromEdgeCookie(cookieHeader);

    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (session.role !== 'DONOR' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Protect receiver routes
  if (pathname.startsWith('/receiver')) {
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromEdgeCookie(cookieHeader);

    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (session.role !== 'RECEIVER' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Check if receiver is still pending admin approval
    if (session.role === 'RECEIVER' && session.status === 'PENDING') {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromEdgeCookie(cookieHeader);

    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/donor/:path*', '/receiver/:path*', '/admin/:path*'],
};
