'use client';

import type { PublicDateResponse } from './responses';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

async function parse<T>(response: Response): Promise<ApiResult<T>> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const body = (payload ?? {}) as { ok?: boolean; error?: string; code?: string } & Record<string, unknown>;

  if (!response.ok || body.ok === false) {
    return {
      ok: false,
      error: body.error || 'Something went wrong. Please try again.',
      code: body.code,
    };
  }
  return { ok: true, data: body as T };
}

export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return parse<T>(response);
  } catch {
    return { ok: false, error: 'You seem to be offline. Please check your connection.' };
  }
}

export async function apiPost<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return parse<T>(response);
  } catch {
    return { ok: false, error: 'You seem to be offline. Please check your connection.' };
  }
}

export async function apiPatch<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return parse<T>(response);
  } catch {
    return { ok: false, error: 'You seem to be offline. Please check your connection.' };
  }
}

export type UploadIntent = { path: string; token: string; signedUrl: string };

/**
 * Uploads one file straight to private storage using a short-lived signed URL.
 * Nothing is attached until her plan is confirmed on the server.
 */
export async function uploadFile(
  responseToken: string,
  kind: 'photo' | 'voice',
  file: Blob,
  contentType: string,
  size: number,
): Promise<ApiResult<UploadIntent>> {
  const intent = await apiPost<UploadIntent>('/api/upload-url', {
    token: responseToken,
    kind,
    contentType,
    size,
  });
  if (!intent.ok) return intent;

  try {
    const upload = await fetch(intent.data.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
      body: file,
    });
    if (!upload.ok) {
      return { ok: false, error: 'That file could not be uploaded. Please try again.' };
    }
    return { ok: true, data: intent.data };
  } catch {
    return { ok: false, error: 'That file could not be uploaded. Please try again.' };
  }
}

export async function loadSavedResponse(token: string): Promise<PublicDateResponse | null> {
  if (!token) return null;
  const result = await apiGet<{ response: PublicDateResponse }>(
    `/api/date-response?token=${encodeURIComponent(token)}`,
  );
  return result.ok ? result.data.response : null;
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
