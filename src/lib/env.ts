/**
 * Server configuration. Secrets are read on the server only — nothing here is
 * imported by a client component.
 */

export type EnvStatus = {
  supabaseUrl: boolean;
  supabaseServiceRole: boolean;
  supabasePublishableKey: boolean;
  adminUsername: boolean;
  adminPasswordSeed: boolean;
  sessionSecret: boolean;
  storageBucket: string;
  dataMode: 'local' | 'supabase' | 'unconfigured';
};

const raw = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  adminUsername: process.env.ADMIN_USERNAME ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? '',
};

export const STORAGE_BUCKET = 'samiya-private';

/**
 * Data mode:
 *  - 'local'    → a persistent on-disk preview store (no internet needed)
 *  - 'supabase' → the real remote backend
 *  - 'unconfigured' → neither is available; saving is disabled and explained
 */
export function isLocalMode(): boolean {
  return (process.env.DATA_MODE ?? '').trim().toLowerCase() === 'local';
}

export function getDataMode(): 'local' | 'supabase' | 'unconfigured' {
  if (isLocalMode()) return 'local';
  const env = getServerEnv();
  return env.supabaseUrl && env.serviceRoleKey ? 'supabase' : 'unconfigured';
}

export function getServerEnv() {
  return {
    supabaseUrl: raw.supabaseUrl.trim(),
    serviceRoleKey: raw.serviceRole.trim(),
    publishableKey: raw.publishableKey.trim(),
    adminUsername: (raw.adminUsername.trim() || 'yousuf').toLowerCase(),
    adminPasswordSeed: raw.adminPassword,
    sessionSecret: raw.sessionSecret.trim(),
  };
}

export function isBackendConfigured(): boolean {
  return getDataMode() !== 'unconfigured';
}

export function getEnvStatus(): EnvStatus {
  return {
    supabaseUrl: Boolean(raw.supabaseUrl),
    supabaseServiceRole: Boolean(raw.serviceRole),
    supabasePublishableKey: Boolean(raw.publishableKey),
    adminUsername: Boolean(raw.adminUsername),
    adminPasswordSeed: Boolean(raw.adminPassword),
    sessionSecret: Boolean(raw.sessionSecret),
    storageBucket: STORAGE_BUCKET,
    dataMode: getDataMode(),
  };
}

/** Public values that are safe to hand to the browser. */
export function getPublicBackend() {
  return {
    url: raw.supabaseUrl.trim(),
    publishableKey: raw.publishableKey.trim(),
    bucket: STORAGE_BUCKET,
    configured: Boolean(raw.supabaseUrl && raw.publishableKey),
  };
}
