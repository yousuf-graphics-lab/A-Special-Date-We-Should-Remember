/**
 * Data access for `vault_entries`. Server-only; always called after the caller
 * has been authorized (public submit endpoint validates input, admin endpoints
 * verify the JWT). Row Level Security blocks every other path.
 */
import { getServiceClient } from './supabase';
import type { VaultEntry } from '../types';

interface VaultRow {
  id: string;
  answer: string;
  chosen_date: string;
  chosen_time: string;
  activity: string;
  note: string | null;
  created_at: string;
  user_agent: string | null;
  timezone: string | null;
  owner_notes: string | null;
}

const COLUMNS =
  'id, answer, chosen_date, chosen_time, activity, note, created_at, user_agent, timezone, owner_notes';

function mapRow(row: VaultRow): VaultEntry {
  return {
    id: row.id,
    answer: row.answer,
    chosenDate: row.chosen_date,
    // Postgres returns `HH:MM:SS`; the UI only needs `HH:MM`.
    chosenTime: row.chosen_time.slice(0, 5),
    activity: row.activity,
    note: row.note,
    createdAt: row.created_at,
    timezone: row.timezone ?? 'UTC',
    ownerNotes: row.owner_notes,
  };
}

export interface NewEntryInput {
  chosenDate: string;
  chosenTime: string;
  activity: string;
  note: string | null;
  timezone: string;
  userAgent: string | null;
  ipHash: string | null;
}

export async function insertVaultEntry(input: NewEntryInput): Promise<{ id: string; createdAt: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('vault_entries')
    .insert({
      answer: 'yes',
      chosen_date: input.chosenDate,
      chosen_time: input.chosenTime,
      activity: input.activity,
      note: input.note,
      timezone: input.timezone,
      user_agent: input.userAgent,
      ip_hash: input.ipHash,
    })
    .select('id, created_at')
    .single<{ id: string; created_at: string }>();

  if (error || !data) {
    throw new Error(`vault insert failed: ${error?.message ?? 'no row returned'}`);
  }
  return { id: data.id, createdAt: data.created_at };
}

/** Most recent submission first — used by the dashboard. */
export async function listVaultEntries(limit = 25): Promise<VaultEntry[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('vault_entries')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`vault read failed: ${error.message}`);
  return ((data ?? []) as VaultRow[]).map(mapRow);
}

export async function getVaultEntry(id: string): Promise<VaultEntry | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('vault_entries')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle<VaultRow>();

  if (error) throw new Error(`vault read failed: ${error.message}`);
  return data ? mapRow(data) : null;
}

/** Updates only the private planning field of a single entry. */
export async function updateOwnerNotes(id: string, ownerNotes: string): Promise<VaultEntry | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('vault_entries')
    .update({ owner_notes: ownerNotes.trim().length > 0 ? ownerNotes.trim() : null })
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle<VaultRow>();

  if (error) throw new Error(`vault update failed: ${error.message}`);
  return data ? mapRow(data) : null;
}

/** Deletes an entry — only exposed to the authenticated dashboard. */
export async function deleteVaultEntry(id: string): Promise<boolean> {
  const supabase = getServiceClient();
  const { error, count } = await supabase
    .from('vault_entries')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw new Error(`vault delete failed: ${error.message}`);
  return (count ?? 0) > 0;
}
