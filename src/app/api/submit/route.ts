/**
 * POST /api/submit — the only public write path.
 *
 * Everything is validated server-side before it reaches Supabase, the record is
 * written with the service role key, and the visitor receives a signed,
 * HTTP-only pointer to *their own* selection so the countdown can be restored.
 * The response never contains the note or any internal error detail.
 */
import { NextResponse } from 'next/server';
import { RATE_LIMIT } from '@/lib/constants';
import { detectTimeZone } from '@/lib/datetime';
import { submissionSchema, fieldErrorsFrom } from '@/lib/validation';
import { jsonError, jsonOk, readJsonBody, hasOnlyKeys, TOO_MANY_REQUESTS } from '@/lib/server/http';
import { consumeRateLimit, getClientIp, hashIp } from '@/lib/server/rate-limit';
import { insertVaultEntry } from '@/lib/server/vault';
import { notifyNewSubmission } from '@/lib/server/notifications';
import {
  newSessionId,
  readSessionId,
  selectionCookieOptions,
  sessionCookieOptions,
  signSelection,
} from '@/lib/server/session';
import type { PublicSelection } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request.headers);
  const ipHash = hashIp(ip);

  const limit = await consumeRateLimit(
    `submit:${ipHash}`,
    RATE_LIMIT.submitMaxAttempts,
    RATE_LIMIT.submitWindowMinutes,
  );
  if (!limit.allowed) return TOO_MANY_REQUESTS(limit.retryAfterSeconds);

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  if (!hasOnlyKeys(body.data, ['date', 'time', 'activity', 'note', 'timezone'])) {
    return jsonError('That request contained unexpected fields.', 400);
  }

  const parsed = submissionSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonError('Please check the details and try again.', 422, {
      code: 'invalid_input',
      fieldErrors: fieldErrorsFrom(parsed.error),
    });
  }

  const { date, time, activity, note } = parsed.data;
  const timezone = parsed.data.timezone || detectTimeZone();

  let created: { id: string; createdAt: string };
  try {
    created = await insertVaultEntry({
      chosenDate: date,
      chosenTime: time,
      activity,
      note,
      timezone,
      userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
      ipHash,
    });
  } catch (error) {
    // Log the failure class only — never the payload.
    console.error('[submit] database insert failed:', (error as Error).message);
    return jsonError('We could not save your answer just now. Please try again.', 500, {
      code: 'storage_error',
    });
  }

  // Notifications never block a successful submission; notifyNewSubmission
  // swallows provider errors and is bounded by its own timeouts.
  await notifyNewSubmission({
    chosenDate: date,
    chosenTime: time,
    activity,
    timezone,
    note,
  });

  const selection: PublicSelection = {
    date,
    time,
    activity,
    timezone,
    createdAt: created.createdAt,
  };

  const sessionId = readSessionId() ?? newSessionId();
  const token = await signSelection(sessionId, selection);

  const response = jsonOk({ ok: true, selection });
  // The opaque session id and the signed selection token are separate cookies:
  // the token is only ever valid together with this exact session.
  response.cookies.set({ ...sessionCookieOptions(), value: sessionId });
  response.cookies.set({ ...selectionCookieOptions(), value: token });

  return response;
}
