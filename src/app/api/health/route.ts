import { isBackendConfigured } from '@/lib/env';
import { noStore } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Minimal public status — no configuration details are exposed. */
export async function GET() {
  return noStore({ ok: true, backendConfigured: isBackendConfigured() });
}
