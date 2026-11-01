/**
 * POST /api/admin/login
 *
 * bcrypt comparison + durable rate limiting (5 failures / 15 minutes / IP).
 * Responds with a generic message on every failure so the endpoint cannot be
 * used to probe configuration. On success a signed JWT is placed in an
 * HTTP-only, Secure, SameSite=Strict cookie.
 */
import { NextResponse } from 'next/server';
import { RATE_LIMIT } from '@/lib/constants';
import { loginSchema } from '@/lib/validation';
import {
  jsonError,
  jsonOk,
  readJsonBody,
  hasOnlyKeys,
  TOO_MANY_REQUESTS,
} from '@/lib/server/http';
import { consumeRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { adminCookieOptions, createAdminToken, verifyPassword } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request.headers);
  const limit = await consumeRateLimit(
    `login:${ip}`,
    RATE_LIMIT.loginMaxAttempts,
    RATE_LIMIT.loginWindowMinutes,
  );
  if (!limit.allowed) return TOO_MANY_REQUESTS(limit.retryAfterSeconds);

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  if (!hasOnlyKeys(body.data, ['password'])) {
    return jsonError('Invalid request.', 400);
  }

  const parsed = loginSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonError('Incorrect password.', 401, { code: 'invalid_credentials' });
  }

  const valid = await verifyPassword(parsed.data.password);
  if (!valid) {
    // Small constant delay blunts fast automated guessing without breaking UX.
    await new Promise((resolve) => setTimeout(resolve, 350));
    return jsonError('Incorrect password.', 401, { code: 'invalid_credentials' });
  }

  const token = await createAdminToken();
  const response = jsonOk({ ok: true });
  response.cookies.set({ ...adminCookieOptions(), value: token });
  return response;
}
