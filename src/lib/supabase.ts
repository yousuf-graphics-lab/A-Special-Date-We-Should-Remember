import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv, isBackendConfigured, isLocalMode } from './env';
import { createLocalClient } from './local-store';

/**
 * Service-role client. Server only. RLS is bypassed by this key, which is why it
 * must never reach the browser bundle.
 */
let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (!isBackendConfigured()) {
    throw new Error(
      'Backend not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required, or set DATA_MODE=local for the preview store.',
    );
  }
  if (isLocalMode()) {
    if (!cached) {
      // Same shape as the Supabase client for the calls this app makes.
      cached = createLocalClient() as unknown as SupabaseClient;
    }
    return cached;
  }
  if (cached) return cached;
  const env = getServerEnv();
  cached = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'for-samiya-server' } },
  });
  return cached;
}

export function maybeServiceClient(): SupabaseClient | null {
  try {
    return getServiceClient();
  } catch {
    return null;
  }
}
