import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/session-token';

const LOGIN_PATH = '/admin/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = await verifySessionToken(token, secret);

  if (pathname === LOGIN_PATH) {
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = '';
    if (pathname !== '/admin') url.searchParams.set('next', pathname);
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
