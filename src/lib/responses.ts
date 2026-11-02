import { getServiceClient } from './supabase';

export type MediaRow = {
  id: string;
  response_id: string;
  media_type: 'photo' | 'voice';
  storage_path: string;
  mime_type: string;
  byte_size: number;
  content_hash: string;
  duration_seconds: number | string | null;
  sort_order: number;
  consent: boolean;
  created_at: string;
  deleted_at: string | null;
};

export type ResponseRow = {
  id: string;
  public_token: string;
  proposal_answer: string;
  selected_date: string;
  selected_time: string;
  time_mode: 'preset' | 'custom';
  selected_activity: string;
  custom_activity: string | null;
  personal_message: string | null;
  status: string;
  response_version: number;
  created_at: string;
  updated_at: string;
};

export type LocationRow = {
  id: string;
  response_id: string;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  source: 'manual' | 'device';
  created_at: string;
  updated_at: string;
};

export type PublicLocation = {
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  source: 'manual' | 'device';
  updatedAt: string;
};

export type PublicMediaItem = {
  id: string;
  type: 'photo' | 'voice';
  sortOrder: number;
  durationSeconds: number | null;
  mimeType: string;
  createdAt: string;
  url: string;
};

export type PublicDateResponse = {
  token: string;
  selectedDate: string;
  selectedTime: string;
  timeMode: 'preset' | 'custom';
  activity: string;
  customActivity: string | null;
  personalMessage: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  location: PublicLocation | null;
  media: PublicMediaItem[];
};

function num(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapPublicResponse(
  row: ResponseRow,
  media: MediaRow[],
  location: LocationRow | null,
): PublicDateResponse {
  return {
    token: row.public_token,
    selectedDate: row.selected_date,
    selectedTime: row.selected_time,
    timeMode: row.time_mode,
    activity: row.selected_activity,
    customActivity: row.custom_activity,
    personalMessage: row.personal_message,
    status: row.status,
    version: row.response_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    location: location
      ? {
          placeName: location.place_name,
          latitude: num(location.latitude),
          longitude: num(location.longitude),
          accuracyMeters: num(location.accuracy_meters),
          source: location.source,
          updatedAt: location.updated_at,
        }
      : null,
    media: media
      .filter((item) => !item.deleted_at)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        type: item.media_type,
        sortOrder: item.sort_order,
        durationSeconds: num(item.duration_seconds),
        mimeType: item.mime_type,
        createdAt: item.created_at,
        url: `/api/date-response/media/${item.id}?token=${row.public_token}`,
      })),
  };
}

export async function fetchResponseByToken(token: string): Promise<PublicDateResponse | null> {
  const supabase = getServiceClient();
  const { data: row, error } = await supabase
    .from('date_responses')
    .select('*')
    .eq('public_token', token)
    .maybeSingle();
  if (error || !row) return null;

  const [{ data: media }, { data: location }] = await Promise.all([
    supabase
      .from('media_records')
      .select('*')
      .eq('response_id', row.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true }),
    supabase.from('date_locations').select('*').eq('response_id', row.id).maybeSingle(),
  ]);

  return mapPublicResponse(row as ResponseRow, (media ?? []) as MediaRow[], (location ?? null) as LocationRow | null);
}
