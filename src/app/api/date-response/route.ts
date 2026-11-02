import { randomUUID } from 'node:crypto';
import { ACTIVITY_LABELS, type ActivityId } from '@/lib/content';
import { isBackendConfigured } from '@/lib/env';
import { getClientIp, isUuid, jsonError, noStore, readJson } from '@/lib/http';
import { checkRateLimit, hashClientIp } from '@/lib/rate-limit';
import { fetchResponseByToken } from '@/lib/responses';
import { getServiceClient } from '@/lib/supabase';
import { todayInDhaka } from '@/lib/time';
import { dateResponseSchema } from '@/lib/validation';
import { pathBelongsToToken, removeObjects, sweepUnattached, verifyUploadedObject } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExistingResponse = {
  id: string;
  public_token: string;
  response_version: number;
  selected_date: string;
  selected_time: string;
  selected_activity: string;
  custom_activity: string | null;
  personal_message: string | null;
};

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const;

/* -------------------------------------------------------------------------- */
/* POST — create or update her confirmed plan                                  */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  if (!isBackendConfigured()) {
    return jsonError(
      'Saving is not set up yet on this deployment. Nothing was lost — please try again once the backend is configured.',
      503,
      { code: 'not_configured' },
    );
  }

  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`submit:${hashClientIp(ip)}`, 25, 600);
  if (!allowed) {
    return jsonError('That is a lot of tries at once. Please wait a moment and try again.', 429, {
      code: 'rate_limited',
    });
  }

  const body = await readJson(request);
  const parsed = dateResponseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Some details are missing or not quite right.', 422, {
      code: 'invalid',
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  const data = parsed.data;

  const today = todayInDhaka();
  if (data.selectedDate < today) {
    return jsonError('That day has already passed — choose one ahead of us.', 422, {
      code: 'past_date',
    });
  }

  const activity = data.activity as ActivityId;
  if (!ACTIVITY_LABELS[activity]) {
    return jsonError('Please choose the kind of date you would like.', 422, { code: 'invalid' });
  }

  const customActivity = data.customActivity?.trim() || null;
  if (activity === 'elsewhere' && !customActivity) {
    return jsonError('Tell me where you have in mind.', 422, { code: 'custom_required' });
  }

  const personalMessage = data.personalMessage?.trim() || null;
  const token = data.token ?? randomUUID();

  const supabase = getServiceClient();

  const { data: existing, error: findError } = await supabase
    .from('date_responses')
    .select('id, public_token, response_version, selected_date, selected_time, selected_activity, custom_activity, personal_message')
    .eq('public_token', token)
    .maybeSingle<ExistingResponse>();

  if (findError) {
    console.error('[date-response] lookup failed', findError.message);
    return jsonError('Something went wrong while saving. Please try once more.', 500);
  }

  /* ---- optional location ------------------------------------------------- */
  let locationPayload: {
    place_name: string | null;
    latitude: number | null;
    longitude: number | null;
    accuracy_meters: number | null;
    source: 'manual' | 'device';
  } | null = null;

  if (data.location) {
    const place = data.location.placeName?.trim() || null;
    const latitude = typeof data.location.latitude === 'number' ? data.location.latitude : null;
    const longitude = typeof data.location.longitude === 'number' ? data.location.longitude : null;
    const hasCoords = latitude !== null && longitude !== null;
    if (place || hasCoords) {
      locationPayload = {
        place_name: place,
        latitude: hasCoords ? latitude : null,
        longitude: hasCoords ? longitude : null,
        accuracy_meters:
          hasCoords && typeof data.location.accuracyMeters === 'number'
            ? data.location.accuracyMeters
            : null,
        source: data.location.source === 'device' && hasCoords ? 'device' : 'manual',
      };
    }
  }

  /* ---- verify every uploaded file ---------------------------------------- */
  const photoRefs = data.media.filter((item) => item.kind === 'photo');
  const voiceRefs = data.media.filter((item) => item.kind === 'voice');
  if (photoRefs.length > 5) {
    return jsonError('Up to five photos, and no more.', 422, { code: 'too_many_photos' });
  }
  if (voiceRefs.length > 1) {
    return jsonError('Only one voice message can be shared.', 422, { code: 'too_many_voices' });
  }

  const verified: {
    path: string;
    kind: 'photo' | 'voice';
    mimeType: string;
    byteSize: number;
    contentHash: string;
    durationSeconds: number | null;
    sortOrder: number;
  }[] = [];

  for (const [index, ref] of data.media.entries()) {
    if (!pathBelongsToToken(ref.path, token)) {
      return jsonError('One of those files does not belong to this response.', 422, {
        code: 'bad_path',
      });
    }
    const result = await verifyUploadedObject(ref.path, ref.kind);
    if (!result.ok) {
      return jsonError(
        `${result.error} Nothing has been confirmed yet — your choices are still here.`,
        422,
        { code: 'unverified_media' },
      );
    }
    const duration =
      ref.kind === 'voice' && typeof ref.durationSeconds === 'number'
        ? Math.min(3600, Math.max(0, ref.durationSeconds))
        : null;
    verified.push({ ...result.media, durationSeconds: duration, sortOrder: index });
  }

  const dedupedMedia = verified.filter(
    (item, index, list) =>
      list.findIndex((other) => other.contentHash === item.contentHash) === index,
  );

  /* ---- remove media she asked to delete ---------------------------------- */
  const removedPaths: string[] = [];
  if (existing && data.removeMediaIds.length) {
    const { data: rows } = await supabase
      .from('media_records')
      .select('id, storage_path, media_type')
      .eq('response_id', existing.id)
      .in('id', data.removeMediaIds)
      .is('deleted_at', null);

    if (rows?.length) {
      await supabase
        .from('media_records')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', rows.map((row) => row.id));
      removedPaths.push(...rows.map((row) => row.storage_path));
      await supabase.from('response_events').insert(
        rows.map((row) => ({
          response_id: existing.id,
          event_type: row.media_type === 'voice' ? 'voice_deleted' : 'photo_deleted',
          detail: { by: 'samiya' },
        })),
      );
    }
  }

  /* ---- write the response ------------------------------------------------ */
  const now = new Date().toISOString();
  let responseId: string;
  let version: number;

  if (existing) {
    version = existing.response_version + 1;
    const { error: updateError } = await supabase
      .from('date_responses')
      .update({
        selected_date: data.selectedDate,
        selected_time: data.selectedTime,
        time_mode: data.timeMode,
        selected_activity: activity,
        custom_activity: customActivity,
        personal_message: personalMessage,
        response_version: version,
        updated_at: now,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('[date-response] update failed', updateError.message);
      return jsonError('Our plan could not be saved just now. Please try once more.', 500);
    }
    responseId = existing.id;

    await supabase.from('response_versions').insert({
      response_id: responseId,
      version,
      snapshot: {
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        timeMode: data.timeMode,
        activity,
        customActivity,
        personalMessage,
        savedAt: now,
        note: 'Updated plan',
      },
    });

    await supabase.from('response_events').insert({
      response_id: responseId,
      event_type: 'date_updated',
      detail: {
        version,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        activity,
      },
    });
  } else {
    version = 1;
    const { data: inserted, error: insertError } = await supabase
      .from('date_responses')
      .insert({
        public_token: token,
        selected_date: data.selectedDate,
        selected_time: data.selectedTime,
        time_mode: data.timeMode,
        selected_activity: activity,
        custom_activity: customActivity,
        personal_message: personalMessage,
        response_version: 1,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('[date-response] insert failed', insertError?.message);
      const conflict = insertError?.code === '23505';
      return jsonError(
        conflict
          ? 'A plan already exists for this link. Please refresh the page and try again.'
          : 'Our plan could not be saved just now. Please try once more.',
        500,
      );
    }
    responseId = inserted.id;

    await supabase.from('response_versions').insert({
      response_id: responseId,
      version: 1,
      snapshot: {
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        timeMode: data.timeMode,
        activity,
        customActivity,
        personalMessage,
        savedAt: now,
        note: 'First confirmed plan',
      },
    });

    await supabase.from('response_events').insert({
      response_id: responseId,
      event_type: 'date_confirmed',
      detail: { selectedDate: data.selectedDate, selectedTime: data.selectedTime, activity },
    });
  }

  /* ---- attach media ------------------------------------------------------ */
  if (dedupedMedia.length) {
    const { data: existingMedia } = await supabase
      .from('media_records')
      .select('id, sort_order, content_hash, media_type, storage_path')
      .eq('response_id', responseId)
      .is('deleted_at', null);

    const takenHashes = new Set((existingMedia ?? []).map((row) => row.content_hash));
    const existingPhotos = (existingMedia ?? []).filter((row) => row.media_type === 'photo');
    const existingVoices = (existingMedia ?? []).filter((row) => row.media_type === 'voice');
    const maxOrder = (existingMedia ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0);

    // A new recording replaces the previous one rather than piling up.
    const hasIncomingVoice = dedupedMedia.some((item) => item.kind === 'voice');
    let photoSlots = Math.max(0, 5 - existingPhotos.length);
    const replacedVoicePaths: string[] = [];

    if (hasIncomingVoice && existingVoices.length) {
      const voiceIds = existingVoices.map((row) => row.id);
      await supabase
        .from('media_records')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', voiceIds);
      replacedVoicePaths.push(...existingVoices.map((row) => row.storage_path));
      await supabase.from('response_events').insert({
        response_id: responseId,
        event_type: 'voice_deleted',
        detail: { by: 'replaced' },
      });
    }

    let order = maxOrder;
    const insertedKinds = new Set<'photo' | 'voice'>();
    for (const item of dedupedMedia) {
      if (takenHashes.has(item.contentHash)) continue; // never store the same file twice
      if (item.kind === 'photo' && photoSlots <= 0) continue; // five little moments, no more
      order += 1;
      const { error: mediaError } = await supabase.from('media_records').insert({
        response_id: responseId,
        media_type: item.kind,
        storage_path: item.path,
        mime_type: item.mimeType,
        byte_size: item.byteSize,
        content_hash: item.contentHash,
        duration_seconds: item.durationSeconds,
        sort_order: order,
        consent: true,
      });
      if (mediaError && mediaError.code !== '23505') {
        console.error('[date-response] media insert failed', mediaError.message);
        return jsonError(
          'Your plan was saved, but one of the files could not be attached. Please try again.',
          500,
        );
      }
      if (!mediaError) {
        insertedKinds.add(item.kind);
        takenHashes.add(item.contentHash);
        if (item.kind === 'photo') photoSlots -= 1;
      }
    }

    if (replacedVoicePaths.length) await removeObjects(replacedVoicePaths);

    const events = Array.from(insertedKinds).map((kind) => ({
      response_id: responseId,
      event_type: kind === 'voice' ? 'voice_submitted' : 'photos_submitted',
      detail: { count: dedupedMedia.filter((m) => m.kind === kind).length },
    }));
    if (events.length) await supabase.from('response_events').insert(events);
  }

  /* ---- location ---------------------------------------------------------- */
  if (locationPayload) {
    const { error: locationError } = await supabase
      .from('date_locations')
      .upsert({ response_id: responseId, ...locationPayload }, { onConflict: 'response_id' });

    if (locationError) {
      console.error('[date-response] location upsert failed', locationError.message);
    } else {
      await supabase.from('response_events').insert({
        response_id: responseId,
        event_type: 'location_submitted',
        detail: { source: locationPayload.source },
      });
    }
  }

  if (removedPaths.length) await removeObjects(removedPaths);

  /* ---- tidy any files that were uploaded but not attached ---------------- */
  const { data: keptMedia } = await supabase
    .from('media_records')
    .select('storage_path')
    .eq('response_id', responseId)
    .is('deleted_at', null);
  await sweepUnattached(
    token,
    (keptMedia ?? []).map((row) => row.storage_path),
  );

  const full = await fetchResponseByToken(token);
  return noStore({ ok: true, response: full }, { headers: NO_STORE_HEADERS });
}

/* -------------------------------------------------------------------------- */
/* GET — resume her saved plan (needs the private token)                       */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  if (!isBackendConfigured()) {
    return jsonError('The backend is not configured on this deployment.', 503, {
      code: 'not_configured',
    });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!isUuid(token)) return jsonError('Missing or invalid token.', 400);

  const allowed = await checkRateLimit(
    `read:${hashClientIp(getClientIp(request))}`,
    120,
    600,
  );
  if (!allowed) return jsonError('Please wait a moment and try again.', 429);

  try {
    const response = await fetchResponseByToken(token);
    if (!response) return jsonError('No plan has been saved for this link yet.', 404);
    return noStore({ ok: true, response }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[date-response] read failed', error);
    return jsonError('Something went wrong while loading your plan.', 500);
  }
}

/* -------------------------------------------------------------------------- */
/* PATCH — remove a voice note, a photo or the shared location                 */
/* -------------------------------------------------------------------------- */

export async function PATCH(request: Request) {
  if (!isBackendConfigured()) {
    return jsonError('The backend is not configured on this deployment.', 503, {
      code: 'not_configured',
    });
  }

  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`patch:${hashClientIp(ip)}`, 30, 600);
  if (!allowed) return jsonError('Please wait a moment and try again.', 429);

  const body = await readJson<{ token?: string; action?: string; mediaId?: string }>(request);
  if (!body || !isUuid(body.token) || typeof body.action !== 'string') {
    return jsonError('Invalid request.', 400);
  }

  const supabase = getServiceClient();
  const { data: responseRow } = await supabase
    .from('date_responses')
    .select('id, public_token')
    .eq('public_token', body.token)
    .maybeSingle();

  if (!responseRow) return jsonError('No plan has been saved for this link.', 404);

  if (body.action === 'remove-media') {
    if (!isUuid(body.mediaId)) return jsonError('Invalid media reference.', 400);
    const { data: mediaRow } = await supabase
      .from('media_records')
      .select('id, media_type, storage_path')
      .eq('id', body.mediaId)
      .eq('response_id', responseRow.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!mediaRow) return jsonError('That file is no longer there.', 404);

    await supabase
      .from('media_records')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mediaRow.id);
    await removeObjects([mediaRow.storage_path]);
    await supabase.from('response_events').insert({
      response_id: responseRow.id,
      event_type: mediaRow.media_type === 'voice' ? 'voice_deleted' : 'photo_deleted',
      detail: { by: 'samiya' },
    });
  } else if (body.action === 'remove-location') {
    const { error } = await supabase
      .from('date_locations')
      .delete()
      .eq('response_id', responseRow.id);
    if (error) return jsonError('The location could not be removed.', 500);
    await supabase.from('response_events').insert({
      response_id: responseRow.id,
      event_type: 'location_removed',
      detail: { by: 'samiya' },
    });
  } else {
    return jsonError('Unknown action.', 400);
  }

  const updated = await fetchResponseByToken(responseRow.public_token);
  return noStore({ ok: true, response: updated }, { headers: NO_STORE_HEADERS });
}
