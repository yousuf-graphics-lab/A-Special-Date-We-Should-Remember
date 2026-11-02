import { getAdminSession, logAdminActivity } from '@/lib/auth';
import { isUuid, jsonError, noStore } from '@/lib/http';
import { downloadObject, removeObjects } from '@/lib/storage';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Authenticated streaming of a private file. Only Yousuf's session can reach it. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const session = await getAdminSession();
  if (!session) return jsonError('Not authorised.', 401);

  const { mediaId } = await params;
  if (!isUuid(mediaId)) return jsonError('Not found.', 404);

  const supabase = getServiceClient();
  const { data: media } = await supabase
    .from('media_records')
    .select('storage_path, mime_type, media_type, deleted_at')
    .eq('id', mediaId)
    .maybeSingle();

  if (!media || media.deleted_at) return jsonError('Not found.', 404);

  const file = await downloadObject(media.storage_path);
  if (!file) return jsonError('The file could not be read.', 404);

  const headers = new Headers();
  headers.set('Content-Type', media.mime_type || file.mimeType);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('Content-Disposition', 'inline');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Length', String(file.data.size));

  return new Response(file.data.stream(), { status: 200, headers });
}

/** Removes a photo or voice recording, and its private file. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const session = await getAdminSession();
  if (!session) return jsonError('Not authorised.', 401);

  const { mediaId } = await params;
  if (!isUuid(mediaId)) return jsonError('Not found.', 404);

  const supabase = getServiceClient();
  const { data: media } = await supabase
    .from('media_records')
    .select('id, storage_path, media_type, response_id, deleted_at')
    .eq('id', mediaId)
    .maybeSingle();

  if (!media || media.deleted_at) return jsonError('Not found.', 404);

  const { error } = await supabase
    .from('media_records')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', media.id);

  if (error) return jsonError('The record could not be deleted.', 500);

  await removeObjects([media.storage_path]);
  await supabase.from('response_events').insert({
    response_id: media.response_id,
    event_type: media.media_type === 'voice' ? 'voice_deleted' : 'photo_deleted',
    detail: { by: 'yousuf' },
  });
  await logAdminActivity('media_deleted', 'success', media.media_type);

  return noStore({ ok: true });
}
