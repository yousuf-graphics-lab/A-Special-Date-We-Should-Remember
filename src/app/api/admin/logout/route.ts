import { endAdminSession, logAdminActivity } from '@/lib/auth';
import { noStore } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  await logAdminActivity('logout', 'success');
  await endAdminSession();
  return noStore({ ok: true });
}
