import { logAdminActivity, startAdminSession, verifyAdminCredentials } from '@/lib/auth';
import { getClientIp, jsonError, noStore, readJson } from '@/lib/http';
import { checkRateLimit, hashClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`admin-login:${hashClientIp(ip)}`, 6, 900);
  if (!allowed) {
    await logAdminActivity('login_blocked', 'rate_limited');
    return jsonError('Too many attempts. Please wait a few minutes and try again.', 429, {
      code: 'rate_limited',
    });
  }

  const body = await readJson<{ username?: string; password?: string }>(request);
  if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
    return jsonError('Enter your name and password.', 400);
  }

  const result = await verifyAdminCredentials(body.username, body.password);

  if (!result.ok) {
    await logAdminActivity('login', result.reason);
    if (result.reason === 'not_configured') {
      return jsonError(
        'The administrator account is not configured yet. Set ADMIN_USERNAME, ADMIN_PASSWORD (first login) and ADMIN_SESSION_SECRET.',
        503,
        { code: 'not_configured' },
      );
    }
    return jsonError('Those details do not match.', 401, { code: 'invalid' });
  }

  try {
    await startAdminSession(result.username);
  } catch (error) {
    console.error('[admin-login] session failed', error);
    return jsonError('The session could not be started. Check ADMIN_SESSION_SECRET.', 500, {
      code: 'session_error',
    });
  }

  await logAdminActivity('login', 'success');
  return noStore({ ok: true });
}
