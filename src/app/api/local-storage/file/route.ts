import path from 'node:path';
import { isLocalMode } from '@/lib/env';
import { jsonError } from '@/lib/http';
import { readLocalFile, verifyLocalPathToken } from '@/lib/local-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
};

/** Serves a private preview file only via a signed, expiring link. */
export async function GET(request: Request) {
  if (!isLocalMode()) return jsonError('Not found.', 404);

  const { searchParams } = new URL(request.url);
  const relative = searchParams.get('path');
  const token = searchParams.get('token');
  if (!relative || !verifyLocalPathToken(relative, token) || relative.includes('..')) {
    return jsonError('Not found.', 404);
  }

  const file = await readLocalFile(relative);
  if (!file) return jsonError('Not found.', 404);

  const ext = path.extname(relative).slice(1).toLowerCase();
  return new Response(file.data, {
    status: 200,
    headers: {
      'Content-Type': MIME_BY_EXT[ext] ?? 'application/octet-stream',
      'Content-Length': String(file.size),
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
