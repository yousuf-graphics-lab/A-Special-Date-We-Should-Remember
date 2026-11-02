import { NextResponse } from 'next/server';

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function noStore<T>(body: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      ...(init?.headers ?? {}),
    },
  });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return noStore({ ok: false, error: message, ...extra }, { status });
}

export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') return null;
    return body as T;
  } catch {
    return null;
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
