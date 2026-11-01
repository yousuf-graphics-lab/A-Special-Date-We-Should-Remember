/**
 * Admin authentication.
 *
 * Flow: password → bcrypt.compare against ADMIN_PASSWORD_HASH → signed JWT
 * (HS256, jose) stored in an HTTP-only, SameSite=Strict cookie. Every admin
 * page and admin API route re-verifies the token signature, `exp`, `iss`,
 * `aud` and the `role` claim. Middleware is only a redirect convenience —
 * authorization never relies on it.
 */
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getServerConfig } from '../config';
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from '../constants';

const ISSUER = 'for-samiya';
const AUDIENCE = 'samiya-admin';

export interface AdminTokenPayload {
  role: 'admin';
  sub: 'owner';
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getServerConfig().JWT_SECRET);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const { ADMIN_PASSWORD_HASH } = getServerConfig();
  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch {
    // A malformed hash must fail closed, never open.
    return false;
  }
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject('owner')
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${ADMIN_COOKIE_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string | undefined): Promise<AdminTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (payload.role !== 'admin' || payload.sub !== 'owner') return null;
    if (typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return { role: 'admin', sub: 'owner' };
  } catch {
    return null;
  }
}

/** Reads the admin cookie from the incoming request and validates it. */
export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token);
}

/** True when the current request is an authenticated admin request. */
export async function isAdminRequest(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/** Cookie options shared by login (set) and logout (clear). */
export function adminCookieOptions(maxAge: number = ADMIN_COOKIE_MAX_AGE) {
  return {
    name: ADMIN_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

/**
 * The dynamic route folder is `vault-[slug]`, so the segment value may arrive
 * with the literal prefix included. Normalise before comparing.
 */
export function normalizeVaultSlug(param: string | undefined): string {
  if (!param) return '';
  return param.startsWith('vault-') ? param.slice('vault-'.length) : param;
}

/** Full path of the secret vault route, e.g. `/vault-7f3k9q`. */
export function adminBasePath(): string {
  const { ADMIN_SLUG } = getServerConfig();
  return `/vault-${ADMIN_SLUG}`;
}
