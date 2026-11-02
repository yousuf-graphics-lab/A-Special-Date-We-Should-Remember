'use client';

import type { StageId } from './content';

const KEY = 'for-samiya.v1';

export type PersistedExperience = {
  token: string;
  unlocked: boolean;
  stage: StageId;
  visited: StageId[];
  updatedAt: string;
};

const DEFAULT: PersistedExperience = {
  token: '',
  unlocked: false,
  stage: 'lock',
  visited: ['lock'],
  updatedAt: '',
};

export function newToken(): string {
  const cryptoObject = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoObject?.randomUUID) {
    return cryptoObject.randomUUID();
  }
  if (!cryptoObject) {
    return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  // Extremely old browsers: random 128-bit hex formatted as a UUID v4.
  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function loadExperience(): PersistedExperience | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedExperience>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      token: typeof parsed.token === 'string' ? parsed.token : '',
      unlocked: Boolean(parsed.unlocked),
      stage: (parsed.stage ?? 'lock') as StageId,
      visited: Array.isArray(parsed.visited) ? (parsed.visited as StageId[]) : ['lock'],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function saveExperience(patch: Partial<PersistedExperience>): void {
  if (typeof window === 'undefined') return;
  const current = loadExperience() ?? DEFAULT;
  const next: PersistedExperience = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage might be unavailable in private mode — the experience still works */
  }
}

export function resetExperience(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
