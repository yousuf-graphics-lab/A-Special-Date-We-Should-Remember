import { isBackendConfigured } from './env';
import { maybeServiceClient } from './supabase';
import type { LocationRow, MediaRow, ResponseRow } from './responses';

export type ProposalAnswerRow = {
  id: string;
  answer: 'yes' | 'no';
  created_at: string;
};

export type EventRow = {
  id: string;
  response_id: string | null;
  event_type: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type VersionRow = {
  id: string;
  response_id: string;
  version: number;
  snapshot: Record<string, unknown>;
  created_at: string;
};

export type AdminSnapshot = {
  backendConfigured: boolean;
  databaseReachable: boolean;
  response: ResponseRow | null;
  media: MediaRow[];
  location: LocationRow | null;
  proposals: ProposalAnswerRow[];
  events: EventRow[];
  responseCount: number;
  error?: string;
};

export async function getAdminSnapshot(options?: { eventsLimit?: number }): Promise<AdminSnapshot> {
  const empty: AdminSnapshot = {
    backendConfigured: isBackendConfigured(),
    databaseReachable: false,
    response: null,
    media: [],
    location: null,
    proposals: [],
    events: [],
    responseCount: 0,
  };

  const supabase = maybeServiceClient();
  if (!supabase) return empty;

  try {
    const [
      { data: response, error: responseError },
      { data: media },
      { data: location },
      { data: proposals },
      { data: events },
      { count },
    ] = await Promise.all([
      supabase.from('date_responses').select('*').order('created_at', { ascending: false }).limit(1),
      supabase
        .from('media_records')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true }),
      supabase.from('date_locations').select('*').maybeSingle(),
      supabase.from('proposal_answers').select('*').order('created_at', { ascending: false }).limit(20),
      supabase
        .from('response_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.eventsLimit ?? 12),
      supabase.from('date_responses').select('id', { count: 'exact', head: true }),
    ]);

    if (responseError) {
      return { ...empty, databaseReachable: false, error: responseError.message };
    }

    const row = (response?.[0] ?? null) as ResponseRow | null;
    const allMedia = (media ?? []) as MediaRow[];

    return {
      backendConfigured: true,
      databaseReachable: true,
      response: row,
      media: row ? allMedia.filter((item) => item.response_id === row.id) : allMedia,
      location: (location ?? null) as LocationRow | null,
      proposals: (proposals ?? []) as ProposalAnswerRow[],
      events: (events ?? []) as EventRow[],
      responseCount: count ?? (row ? 1 : 0),
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getResponseVersions(responseId: string): Promise<VersionRow[]> {
  const supabase = maybeServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('response_versions')
    .select('*')
    .eq('response_id', responseId)
    .order('version', { ascending: false });
  return (data ?? []) as VersionRow[];
}

export async function getAllEvents(): Promise<EventRow[]> {
  const supabase = maybeServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('response_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  return (data ?? []) as EventRow[];
}

export async function getAdminActivity(): Promise<
  { id: string; action: string; outcome: string; detail: string | null; created_at: string }[]
> {
  const supabase = maybeServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('admin_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(25);
  return data ?? [];
}

export async function getStoredCredential(): Promise<{ updated_at: string } | null> {
  const supabase = maybeServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('admin_credentials')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}
