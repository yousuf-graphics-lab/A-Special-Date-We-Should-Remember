import { getAdminSession, logAdminActivity } from '@/lib/auth';
import { jsonError, noStore } from '@/lib/http';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE() {
  const session = await getAdminSession();
  if (!session) return jsonError('Not authorised.', 401);

  const supabase = getServiceClient();
  const { data: rows } = await supabase.from('date_locations').select('id, response_id');
  if (!rows?.length) return noStore({ ok: true, deleted: 0 });

  const { error } = await supabase
    .from('date_locations')
    .delete()
    .in('id', rows.map((row) => row.id));

  if (error) return jsonError('The location could not be deleted.', 500);

  await supabase.from('response_events').insert(
    rows.map((row) => ({
      response_id: row.response_id,
      event_type: 'location_removed',
      detail: { by: 'yousuf' },
    })),
  );
  await logAdminActivity('location_deleted', 'success');

  return noStore({ ok: true, deleted: rows.length });
}
