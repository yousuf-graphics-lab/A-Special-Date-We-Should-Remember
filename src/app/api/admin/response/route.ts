import { getAdminSession, logAdminActivity } from '@/lib/auth';
import { jsonError, noStore } from '@/lib/http';
import { removeObjects } from '@/lib/storage';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Deletes her response together with every private file, location and version
 * snapshot. The submission history keeps an entry for the deletion itself.
 */
export async function DELETE() {
  const session = await getAdminSession();
  if (!session) return jsonError('Not authorised.', 401);

  const supabase = getServiceClient();
  const { data: rows } = await supabase.from('date_responses').select('id');
  if (!rows?.length) return noStore({ ok: true, deleted: 0 });

  const ids = rows.map((row) => row.id);
  const { data: media } = await supabase
    .from('media_records')
    .select('storage_path')
    .in('response_id', ids);

  const { error } = await supabase.from('date_responses').delete().in('id', ids);
  if (error) return jsonError('The response could not be deleted.', 500);

  if (media?.length) await removeObjects(media.map((row) => row.storage_path));

  await supabase.from('response_events').insert({
    response_id: null,
    event_type: 'response_deleted',
    detail: { by: 'yousuf', responses: ids.length },
  });
  await logAdminActivity('response_deleted', 'success');

  return noStore({ ok: true, deleted: ids.length });
}
