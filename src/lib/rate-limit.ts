import { createHash } from 'node:crypto';
import { getServerEnv } from './env';
import { maybeServiceClient } from './supabase';

/** Hash an IP so raw addresses are never written to the database. */
export function hashClientIp(ip: string): string {
  const env = getServerEnv();
  return createHash('sha256')
    .update(`${ip}|${env.sessionSecret || 'for-samiya'}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Fixed-window rate limit. Fails open only when the database itself is
 * unavailable — never silently for a configured backend.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = maybeServiceClient();
  if (!supabase) return true;
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error('[rate-limit]', error.message);
    return true;
  }
  return data === true;
}
