export const EVENT_LABELS: Record<string, string> = {
  proposal_yes: 'She said yes',
  proposal_no: 'She said not today',
  date_confirmed: 'Date and time confirmed',
  date_updated: 'Date details updated',
  voice_submitted: 'Voice message submitted',
  voice_deleted: 'Voice message deleted',
  photos_submitted: 'Photos submitted',
  photo_deleted: 'A photo was deleted',
  location_submitted: 'Location submitted',
  location_removed: 'Location removed',
  response_deleted: 'Response deleted',
};

export function describeEvent(type: string, detail: Record<string, unknown> | null): string | null {
  if (!detail) return null;
  const parts: string[] = [];

  if (typeof detail.selectedDate === 'string') parts.push(`plan: ${detail.selectedDate}`);
  if (typeof detail.selectedTime === 'string') parts.push(`at ${detail.selectedTime}`);
  if (typeof detail.activity === 'string') parts.push(detail.activity);
  if (typeof detail.count === 'number') {
    parts.push(`${detail.count} file${detail.count === 1 ? '' : 's'}`);
  }
  if (typeof detail.source === 'string') parts.push(`source: ${detail.source}`);
  if (typeof detail.by === 'string') parts.push(`by ${detail.by}`);
  if (typeof detail.version === 'number') parts.push(`version ${detail.version}`);

  return parts.length ? parts.join(' · ') : null;
}

export const SOURCE_LABELS: Record<string, string> = {
  device: 'Shared from her device',
  manual: 'A place she selected',
};
