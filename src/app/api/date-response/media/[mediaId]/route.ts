import { isBackendConfigured } from '@/lib/env';
import { getClientIp, isUuid, jsonError } from '@/lib/http';
import { checkRateLimit, hashClientIp } from '@/lib/rate-limit';
import { downloadObject } from '@/lib/storage';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Streams one of her own files back to her, and only when the private response
 * token is presented. Files are never exposed through public URLs.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  if (!isBackendConfigured()) return jsonError('Not available.', 503);

  const { mediaId } = await params;
  if (!isUuid(mediaId)) return jsonError('Not found.', 404);

  const { searchParams } = new URL(request.url);
  const responseToken = searchParams.get('token');
  if (!isUuid(responseToken)) return jsonError('Not found.', 404);

  const allowed = await checkRateLimit(
    `media-read:${hashClientIp(getClientIp(request))}`,
    300,
    600,
  );
  if (!allowed) return jsonError('Please wait a moment.', 429);

  const supabase = getServiceClient();
  const { data: media } = await supabase
    .from('media_records')
    .select('storage_path, mime_type, response_id, deleted_at')
    .eq('id', mediaId)
    .maybeSingle();

  if (!media || media.deleted_at) return jsonError('Not found.', 404);

  const { data: responseRow } = await supabase
    .from('date_responses')
    .select('id, public_token')
    .eq('id', media.response_id)
    .maybeSingle();

  if (!responseRow || responseRow.public_token !== responseToken) {
    return jsonError('Not found.', 404);
  }

  const file = await downloadObject(media.storage_path);
  if (!file) return jsonError('Not found.', 404);

  const headers = new Headers();
  headers.set('Content-Type', media.mime_type || file.mimeType);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('Content-Disposition', 'inline');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Length', String(file.data.size));

  return new Response(file.data.stream(), { status: 200, headers });
}
