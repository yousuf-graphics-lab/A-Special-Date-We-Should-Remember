/**
 * Server-only Supabase client.
 *
 * This client uses the **service role key**, which bypasses Row Level Security.
 * It must only ever be constructed inside server code (route handlers / server
 * components) and never handed to the browser.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerConfig } from '../config';

let serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getServiceClient() was called in the browser.');
  }
  if (serviceClient) return serviceClient;

  const config = getServerConfig();
  serviceClient = createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'X-Client-Info': 'for-samiya-server' } },
  });
  return serviceClient;
}
