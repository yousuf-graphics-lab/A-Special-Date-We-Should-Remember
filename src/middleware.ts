/**
 * Edge middleware — the public face of the secret vault path.
 *
 * The real routes live at `/vault/[slug]`, but the URL the owner bookmarks is
 * `/vault-<ADMIN_SLUG>`. This middleware:
 *
 *   1. rejects any `/vault-*` guess that is not the configured slug (404),
 *   2. redirects unauthenticated visitors to the login screen,
 *   3. rewrites the pretty URL onto the internal route without changing what
 *      the browser shows,
 *   4. blocks `/api/admin/*` without a valid cookie (401).
 *
 * It is a convenience, never the only defence: every vault page and admin route
 * handler re-verifies the JWT server-side before touching data.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ISSUER = 'for-samiya';
const AUDIENCE = 'samiya-admin';
const ADMIN_COOKIE = 'samiya_admin';
const VAULT_PREFIX = '/vault-';

async function isAuthorised(request: NextRequest, secret: string): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || secret.length < 32) return false;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    return (
      payload.role === 'admin' &&
      payload.sub === 'owner' &&
      typeof payload.exp === 'number' &&
      payload.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const slug = (process.env.ADMIN_SLUG ?? '').trim();
  const secret = process.env.JWT_SECRET ?? '';
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login';

  if (isAdminApi) {
    if (!(await isAuthorised(request, secret))) {
      return NextResponse.json(
        { ok: false, error: 'Not authorized.', code: 'unauthorized' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith(VAULT_PREFIX)) return NextResponse.next();

  // /vault-<something>[/rest]
  const remainder = pathname.slice(VAULT_PREFIX.length);
  const slashIndex = remainder.indexOf('/');
  const suppliedSlug = slashIndex === -1 ? remainder : remainder.slice(0, slashIndex);
  const subPath = slashIndex === -1 ? '' : remainder.slice(slashIndex);

  // No slug configured, or an unknown slug → nothing to see here.
  if (!slug || suppliedSlug !== slug) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const basePath = `${VAULT_PREFIX}${slug}`;
  const isLoginPath = subPath === '/login';
  const authorised = await isAuthorised(request, secret);

  if (!authorised && !isLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = `${basePath}/login`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (authorised && isLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = basePath;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Rewrite to the internal route; the address bar keeps the secret URL.
  const url = request.nextUrl.clone();
  url.pathname = `/vault/${slug}${subPath}`;
  return noStore(NextResponse.rewrite(url));
}

export const config = {
  matcher: ['/vault-:slug', '/vault-:slug/:path*', '/api/admin/:path*'],
};
