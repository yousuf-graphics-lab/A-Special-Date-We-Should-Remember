/**
 * Visitor session handling for the public experience.
 *
 * A random, opaque session id (UUID v4) is issued in an HTTP-only cookie. The
 * server stores a *signed* copy of the visitor's selection as a JWT bound to
 * that session id, so the countdown can be restored on a return visit without
 * ever exposing the record — or its note — through a public URL or API.
 *
 * The cookie is a pointer, never proof of authorization: it can only reveal the
 * selection that was created by that same browser session.
 */
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { getServerConfig } from '../config';
import { SESSION_COOKIE, COUNTDOWN_TARGET_COOKIE_MAX_AGE } from '../constants';
import type { PublicSelection } from '../types';

const ISSUER = 'for-samiya';
const AUDIENCE = 'samiya-session';
export const SELECTION_COOKIE = 'samiya_selection';

function secretKey(): Uint8Array {
  // Derived so the visitor-token signing key is distinct from the admin key.
  return createHash('sha256').update(`visitor:${getServerConfig().JWT_SECRET}`).digest();
}

export function readSessionId(): string | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

export function newSessionId(): string {
  return randomUUID();
}

export async function signSelection(
  sessionId: string,
  selection: PublicSelection,
): Promise<string> {
  return new SignJWT({ sid: sessionId, selection })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${COUNTDOWN_TARGET_COOKIE_MAX_AGE}s`)
    .sign(secretKey());
}

/** Returns the selection only when the token belongs to this very session. */
export async function readSelectionToken(
  sessionId: string | null,
  token: string | undefined,
): Promise<PublicSelection | null> {
  if (!sessionId || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (payload.sid !== sessionId) return null;
    const selection = payload.selection as PublicSelection | undefined;
    if (!selection || typeof selection.date !== 'string' || typeof selection.time !== 'string') {
      return null;
    }
    return selection;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number = COUNTDOWN_TARGET_COOKIE_MAX_AGE) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function selectionCookieOptions(maxAge: number = COUNTDOWN_TARGET_COOKIE_MAX_AGE) {
  return {
    name: SELECTION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/** Convenience: the visitor's current selection for this request. */
export async function getCurrentSelection(): Promise<PublicSelection | null> {
  const sessionId = readSessionId();
  const token = cookies().get(SELECTION_COOKIE)?.value;
  return readSelectionToken(sessionId, token);
}
