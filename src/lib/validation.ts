import { z } from 'zod';
import { ACTIVITIES } from './content';

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VOICE_BYTES = 12 * 1024 * 1024; // 12 MB

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const VOICE_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
] as const;

export const ACTIVITY_IDS = ACTIVITIES.map((a) => a.id) as [string, ...string[]];

export const proposalSchema = z.object({
  answer: z.enum(['yes', 'no']),
});

const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const locationSchema = z.object({
  placeName: z.string().trim().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  accuracyMeters: z.number().min(0).max(1_000_000).optional().nullable(),
  source: z.enum(['manual', 'device']).optional(),
});

export const mediaRefSchema = z.object({
  path: z.string().min(3).max(300),
  kind: z.enum(['photo', 'voice']),
  durationSeconds: z.number().min(0).max(3600).optional().nullable(),
});

export const dateResponseSchema = z.object({
  token: z.string().uuid().optional(),
  selectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selectedTime: z.string().regex(timePattern),
  timeMode: z.enum(['preset', 'custom']).default('preset'),
  activity: z.enum(ACTIVITY_IDS),
  customActivity: z.string().trim().max(240).optional().nullable(),
  personalMessage: z.string().trim().max(2000).optional().nullable(),
  location: locationSchema.optional().nullable(),
  media: z.array(mediaRefSchema).max(MAX_PHOTOS + 1).optional().default([]),
  removeMediaIds: z.array(z.string().uuid()).max(MAX_PHOTOS + 1).optional().default([]),
});

export const uploadIntentSchema = z.object({
  token: z.string().uuid(),
  kind: z.enum(['photo', 'voice']),
  contentType: z.string().min(3).max(120),
  size: z.number().int().positive(),
});

export type MediaKind = 'photo' | 'voice';

/** Real content sniffing — file extensions and client headers are not trusted. */
export function sniffMime(head: Uint8Array): string | null {
  const starts = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  const ascii = (start: number, text: string) =>
    [...text].every((ch, i) => head[start + i] === ch.charCodeAt(0));

  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';

  if (starts(0x1a, 0x45, 0xdf, 0xa3)) return 'audio/webm';
  if (ascii(0, 'OggS')) return 'audio/ogg';
  if (ascii(4, 'ftyp')) {
    const brand = String.fromCharCode(head[8] ?? 0, head[9] ?? 0, head[10] ?? 0, head[11] ?? 0);
    if (brand.startsWith('M4A')) return 'audio/mp4';
    if (brand.startsWith('mp4')) return 'audio/mp4';
    return 'audio/mp4';
  }
  if (ascii(0, 'ID3')) return 'audio/mpeg';
  if (head[0] === 0xff && (head[1] === 0xfb || head[1] === 0xf3 || head[1] === 0xf2)) {
    return 'audio/mpeg';
  }
  return null;
}

export function kindForMime(mime: string): MediaKind | null {
  if ((PHOTO_TYPES as readonly string[]).includes(mime)) return 'photo';
  if (mime === 'audio/mpeg' || mime === 'audio/mp4' || mime === 'audio/ogg' || mime === 'audio/webm') {
    return 'voice';
  }
  return null;
}

export function normaliseContentType(value: string): string {
  return value.split(';')[0].trim().toLowerCase();
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'audio/webm':
      return 'webm';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/mp4':
      return 'm4a';
    case 'audio/mpeg':
      return 'mp3';
    default:
      return 'bin';
  }
}

export function isFutureOrToday(isoDate: string, todayIso: string): boolean {
  return isoDate >= todayIso;
}
