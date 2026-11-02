import { createHash, randomUUID } from 'node:crypto';
import { STORAGE_BUCKET, isLocalMode } from './env';
import { localContentHash, readLocalUploadHead } from './local-store';
import { getServiceClient } from './supabase';
import {
  MAX_PHOTO_BYTES,
  MAX_VOICE_BYTES,
  extensionForMime,
  kindForMime,
  normaliseContentType,
  sniffMime,
  type MediaKind,
} from './validation';

export type VerifiedMedia = {
  path: string;
  kind: MediaKind;
  mimeType: string;
  byteSize: number;
  contentHash: string;
};

function maximumFor(kind: MediaKind) {
  return kind === 'photo' ? MAX_PHOTO_BYTES : MAX_VOICE_BYTES;
}

export function allowedKindMime(kind: MediaKind, mime: string): boolean {
  return kindForMime(mime) === kind;
}

/** Creates a short-lived signed upload URL. Files land in a private bucket. */
export async function createUploadTarget(params: {
  token: string;
  kind: MediaKind;
  contentType: string;
  size: number;
}) {
  const mime = normaliseContentType(params.contentType);
  if (!allowedKindMime(params.kind, mime)) {
    return { ok: false as const, error: 'That file type is not supported here.' };
  }
  if (params.size <= 0 || params.size > maximumFor(params.kind)) {
    return { ok: false as const, error: 'That file is too large.' };
  }

  const supabase = getServiceClient();
  const path = `${params.token}/${params.kind}/${randomUUID()}.${extensionForMime(mime)}`;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    console.error('[storage] signed upload failed', error?.message);
    return { ok: false as const, error: 'Storage is not available right now.' };
  }

  return {
    ok: true as const,
    path: data.path ?? path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export function pathBelongsToToken(path: string, token: string): boolean {
  return path.startsWith(`${token}/`) && !path.includes('..');
}

/**
 * Reads the first bytes of an uploaded object with a range request, sniffs the
 * real file type and confirms its size. Extensions and client headers are never
 * trusted on their own.
 */
export async function verifyUploadedObject(
  path: string,
  kind: MediaKind,
): Promise<{ ok: true; media: VerifiedMedia } | { ok: false; error: string }> {
  if (isLocalMode()) {
    const file = await readLocalUploadHead(path);
    if (!file) return { ok: false, error: 'That file could not be found.' };
    const mime = sniffMime(file.head);
    if (!mime) return { ok: false, error: 'That file is not a supported photo or recording.' };
    if (kindForMime(mime) !== kind) {
      return { ok: false, error: 'That file does not match what was shared.' };
    }
    if (file.size <= 0 || file.size > maximumFor(kind)) {
      return { ok: false, error: 'That file is too large.' };
    }
    return {
      ok: true,
      media: {
        path,
        kind,
        mimeType: mime,
        byteSize: file.size,
        contentHash: localContentHash(file.head, file.size),
      },
    };
  }

  const supabase = getServiceClient();

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 120);

  if (signError || !signed?.signedUrl) {
    return { ok: false, error: 'That file could not be found.' };
  }

  let response: Response;
  try {
    response = await fetch(signed.signedUrl, { headers: { Range: 'bytes=0-8191' } });
  } catch {
    return { ok: false, error: 'That file could not be read.' };
  }

  if (!response.ok) return { ok: false, error: 'That file could not be read.' };

  const range = response.headers.get('content-range');
  const total = range ? Number(range.split('/').pop()) : Number(response.headers.get('content-length'));
  const bytes = new Uint8Array(await response.arrayBuffer());
  const mime = sniffMime(bytes);

  if (!mime) return { ok: false, error: 'That file is not a supported photo or recording.' };
  if (kindForMime(mime) !== kind) {
    return { ok: false, error: 'That file does not match what was shared.' };
  }
  if (!Number.isFinite(total) || total <= 0 || total > maximumFor(kind)) {
    return { ok: false, error: 'That file is too large.' };
  }

  const contentHash = createHash('sha256')
    .update(Buffer.from(bytes))
    .update(String(total))
    .digest('hex')
    .slice(0, 48);

  return {
    ok: true,
    media: { path, kind, mimeType: mime, byteSize: total, contentHash },
  };
}

export async function removeObjects(paths: string[]): Promise<void> {
  if (!paths.length) return;
  try {
    await getServiceClient().storage.from(STORAGE_BUCKET).remove(paths);
  } catch (error) {
    console.error('[storage] remove failed', error);
  }
}

export async function downloadObject(
  path: string,
): Promise<{ data: Blob; mimeType: string } | null> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
    if (error || !data) return null;
    return { data, mimeType: data.type || 'application/octet-stream' };
  } catch {
    return null;
  }
}

/** Best-effort removal of uploaded-but-never-attached files for a response. */
export async function sweepUnattached(token: string, keepPaths: string[]): Promise<void> {
  try {
    const supabase = getServiceClient();
    const keep = new Set(keepPaths);
    for (const folder of ['photo', 'voice']) {
      const prefix = `${token}/${folder}/`;
      const { data } = await supabase.storage.from(STORAGE_BUCKET).list(prefix, { limit: 100 });
      const stale = (data ?? [])
        .map((item) => `${prefix}${item.name}`)
        .filter((path) => !keep.has(path));
      if (stale.length) await supabase.storage.from(STORAGE_BUCKET).remove(stale);
    }
  } catch (error) {
    console.error('[storage] sweep failed', error);
  }
}
