import { isBackendConfigured } from '@/lib/env';
import { getClientIp, jsonError, noStore, readJson } from '@/lib/http';
import { checkRateLimit, hashClientIp } from '@/lib/rate-limit';
import { getServiceClient } from '@/lib/supabase';
import { proposalSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Records her answer only when she actually presses one of the two buttons. */
export async function POST(request: Request) {
  if (!isBackendConfigured()) {
    return jsonError('The backend is not configured on this deployment.', 503, {
      code: 'not_configured',
    });
  }

  const allowed = await checkRateLimit(
    `proposal:${hashClientIp(getClientIp(request))}`,
    40,
    600,
  );
  if (!allowed) return jsonError('Please wait a moment and try again.', 429);

  const body = await readJson(request);
  const parsed = proposalSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid answer.', 400);

  const supabase = getServiceClient();
  const { error } = await supabase.from('proposal_answers').insert({ answer: parsed.data.answer });
  if (error) {
    console.error('[proposal] insert failed', error.message);
    return jsonError('Your answer could not be saved just now.', 500);
  }

  await supabase.from('response_events').insert({
    response_id: null,
    event_type: parsed.data.answer === 'yes' ? 'proposal_yes' : 'proposal_no',
    detail: {},
  });

  return noStore({ ok: true });
}
