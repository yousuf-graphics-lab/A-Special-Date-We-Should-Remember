/**
 * Small helpers shared by the route handlers: JSON parsing with a hard size
 * limit, consistent error envelopes, and no-store responses.
 */
import { NextResponse } from 'next/server';

const MAX_BODY_BYTES = 8 * 1024;

export function jsonOk<T extends object>(body: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { 'Cache-Control': 'no-store, max-age=0', ...(init?.headers ?? {}) },
  });
}

export function jsonError(
  message: string,
  status = 400,
  extra?: { code?: string; fieldErrors?: Record<string, string> },
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export const UNAUTHORIZED = () =>
  jsonError('Not authorized.', 401, { code: 'unauthorized' });

export const TOO_MANY_REQUESTS = (retryAfterSeconds = 60) =>
  NextResponse.json(
    { ok: false, error: 'Too many attempts. Please try again later.', code: 'rate_limited' },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Retry-After': `${Math.max(1, retryAfterSeconds)}`,
      },
    },
  );

/** Parses a JSON body, rejecting oversized or malformed payloads. */
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { ok: false, response: jsonError('Expected a JSON request.', 415) };
  }

  const lengthHeader = request.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_BODY_BYTES) {
    return { ok: false, response: jsonError('That request was too large.', 413) };
  }

  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return { ok: false, response: jsonError('That request was too large.', 413) };
    }
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: jsonError('Could not read that request.', 400) };
  }
}

/** Rejects payloads containing keys we never expect (defence in depth). */
export function hasOnlyKeys(value: unknown, allowed: readonly string[]): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.keys(value as Record<string, unknown>).every((key) => allowed.includes(key));
}
