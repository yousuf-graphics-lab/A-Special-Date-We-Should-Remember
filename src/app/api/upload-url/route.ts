import { isBackendConfigured } from '@/lib/env';
import { isUuid } from '@/lib/http';
import { getClientIp, jsonError, noStore, readJson } from '@/lib/http';
import { checkRateLimit, hashClientIp } from '@/lib/rate-limit';
import { getServiceClient } from '@/lib/supabase';
import { createUploadTarget, removeObjects } from '@/lib/storage';
import { uploadIntentSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Issues a short-lived signed upload URL. The file itself goes straight to a
 * private bucket; nothing becomes visible until it is verified and attached to
 * her response on confirmation.
 */
export async function POST(request: Request) {
  if (!isBackendConfigured()) {
    return jsonError('Uploads are not set up on this deployment yet.', 503, {
      code: 'not_configured',
    });
  }

  const allowed = await checkRateLimit(`upload:${hashClientIp(getClientIp(request))}`, 60, 900);
  if (!allowed) {
    return jsonError('That is a lot of uploads at once. Please try again shortly.', 429, {
      code: 'rate_limited',
    });
  }

  const body = await readJson(request);
  const parsed = uploadIntentSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid upload request.', 400);

  try {
    const target = await createUploadTarget(parsed.data);
    if (!target.ok) return jsonError(target.error, 422);
    return noStore({
      ok: true,
      path: target.path,
      token: target.token,
      signedUrl: target.signedUrl,
    });
  } catch (error) {
    console.error('[upload-url] failed', error);
    return jsonError('Uploads are unavailable right now.', 500);
  }
}

/**
 * Removes an upload that was never attached (for example a recording she chose
 * to delete before confirming). Only paths inside her own token folder are
 * accepted, and attached files are never removed here.
 */
export async function DELETE(request: Request) {
  if (!isBackendConfigured()) return jsonError('Not available on this deployment.', 503);

  const body = await readJson<{ token?: string; path?: string }>(request);
  if (!body || !isUuid(body.token) || typeof body.path !== 'string') {
    return jsonError('Invalid request.', 400);
  }
  if (!body.path.startsWith(`${body.token}/`) || body.path.includes('..')) {
    return jsonError('Invalid path.', 400);
  }

  const allowed = await checkRateLimit(`upload-del:${hashClientIp(getClientIp(request))}`, 60, 900);
  if (!allowed) return jsonError('Please wait a moment and try again.', 429);

  const supabase = getServiceClient();
  const { data: attached } = await supabase
    .from('media_records')
    .select('id')
    .eq('storage_path', body.path)
    .is('deleted_at', null)
    .maybeSingle();

  if (attached) {
    return jsonError('That file is already attached to a saved plan.', 409);
  }

  await removeObjects([body.path]);
  return noStore({ ok: true });
}
