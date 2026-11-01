/**
 * Durable, shared rate limiting.
 *
 * Serverless functions cannot rely on in-memory counters, so attempts are
 * written to the `rate_limit_attempts` table in Supabase and counted inside a
 * rolling window. Works across every instance and every cold start.
 */
import { createHash } from 'crypto';
import { getServiceClient } from './supabase';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const RETENTION_HOURS = 48;

export async function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  try {
    const supabase = getServiceClient();
    const { count, error } = await supabase
      .from('rate_limit_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', key)
      .gte('created_at', windowStart);

    if (error) throw error;

    const attempts = count ?? 0;
    if (attempts >= maxAttempts) {
      return { allowed: false, remaining: 0, retryAfterSeconds: windowMinutes * 60 };
    }

    const { error: insertError } = await supabase
      .from('rate_limit_attempts')
      .insert({ bucket: key });
    if (insertError) throw insertError;

    // Opportunistic cleanup; failures here are harmless.
    if (Math.random() < 0.05) {
      const cutoff = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();
      void supabase.from('rate_limit_attempts').delete().lt('created_at', cutoff);
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - attempts - 1),
      retryAfterSeconds: 0,
    };
  } catch (error) {
    // Fail *closed* for the admin login, open for the visitor-facing endpoint so
    // a storage blip can never lock Samiya out of sending her answer.
    console.error('[rate-limit] storage unavailable:', (error as Error).message);
    return key.startsWith('login:')
      ? { allowed: false, remaining: 0, retryAfterSeconds: 60 }
      : { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }
}

/** Hashes an IP so raw addresses are never persisted. */
export function hashIp(ip: string): string {
  const salt = process.env.JWT_SECRET ?? 'no-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || '0.0.0.0';
}
