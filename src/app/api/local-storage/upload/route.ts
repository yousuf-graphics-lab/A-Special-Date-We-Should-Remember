import { isLocalMode } from '@/lib/env';
import { jsonError, noStore } from '@/lib/http';
import { verifyLocalPathToken, writeLocalUpload } from '@/lib/local-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Receives files for the local preview store. Only active when DATA_MODE=local;
 * the signed token binds the upload to a path and an expiry.
 */
export async function PUT(request: Request) {
  if (!isLocalMode()) return jsonError('Not found.', 404);

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const token = searchParams.get('token');
  if (!path || !verifyLocalPathToken(path, token)) {
    return jsonError('This upload link has expired. Please try again.', 403);
  }
  if (path.includes('..')) return jsonError('Invalid path.', 400);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > 15 * 1024 * 1024) {
    return jsonError('That file is too large.', 413);
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0) return jsonError('The file was empty.', 400);
  if (body.byteLength > 15 * 1024 * 1024) return jsonError('That file is too large.', 413);

  const written = await writeLocalUpload(path, body);
  if (!written) return jsonError('The file could not be stored.', 500);

  return noStore({ ok: true, key: path, size: body.byteLength });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
