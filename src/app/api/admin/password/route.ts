import { changeAdminPassword, getAdminSession, logAdminActivity } from '@/lib/auth';
import { jsonError, noStore, readJson } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return jsonError('You are not signed in.', 401);

  const body = await readJson<{ currentPassword?: string; newPassword?: string }>(request);
  if (!body || typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') {
    return jsonError('Enter your current and new password.', 400);
  }

  const result = await changeAdminPassword(body.currentPassword, body.newPassword);
  if (!result.ok) {
    await logAdminActivity('password_change', 'failed');
    return jsonError(result.error, 400);
  }

  return noStore({ ok: true });
}
