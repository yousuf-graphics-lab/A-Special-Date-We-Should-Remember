import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getServerEnv, isBackendConfigured } from './env';
import { getServiceClient } from './supabase';
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
  type AdminSession,
} from './session-token';

const BCRYPT_ROUNDS = 12;

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function logAdminActivity(action: string, outcome: string, detail?: string) {
  try {
    const supabase = getServiceClient();
    await supabase.from('admin_activity').insert({ action, outcome, detail: detail ?? null });
  } catch (error) {
    console.error('[admin-activity]', error);
  }
}

export type CredentialResult =
  | { ok: true; username: string }
  | { ok: false; reason: 'invalid' | 'not_configured' | 'error' };

/**
 * Verifies an administrator login.
 *  - First sign-in seeds an bcrypt hash from ADMIN_PASSWORD (never stored raw).
 *  - Afterwards the database hash is authoritative, so the password can be
 *    changed from Admin → Settings.
 */
export async function verifyAdminCredentials(
  usernameInput: string,
  passwordInput: string,
): Promise<CredentialResult> {
  const env = getServerEnv();
  const username = usernameInput.trim().toLowerCase();

  if (!username || !passwordInput) return { ok: false, reason: 'invalid' };
  if (username !== env.adminUsername) {
    // Same cost for unknown usernames, to avoid user enumeration.
    await bcrypt.compare(passwordInput, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return { ok: false, reason: 'invalid' };
  }
  if (!isBackendConfigured()) return { ok: false, reason: 'not_configured' };

  try {
    const supabase = getServiceClient();
    const { data: existing, error } = await supabase
      .from('admin_credentials')
      .select('id, username, password_hash')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('[auth] credential lookup failed', error.message);
      return { ok: false, reason: 'error' };
    }

    if (existing?.password_hash) {
      const valid = await bcrypt.compare(passwordInput, existing.password_hash);
      return valid ? { ok: true, username } : { ok: false, reason: 'invalid' };
    }

    // No stored credential yet — seed from the environment.
    if (!env.adminPasswordSeed) return { ok: false, reason: 'not_configured' };
    if (!safeEqual(passwordInput, env.adminPasswordSeed)) return { ok: false, reason: 'invalid' };

    const passwordHash = await bcrypt.hash(passwordInput, BCRYPT_ROUNDS);
    const { error: insertError } = await supabase
      .from('admin_credentials')
      .insert({ username, password_hash: passwordHash });

    if (insertError) {
      // A concurrent request may have seeded it; re-check once.
      const { data: again } = await supabase
        .from('admin_credentials')
        .select('password_hash')
        .eq('username', username)
        .maybeSingle();
      if (again?.password_hash) {
        const valid = await bcrypt.compare(passwordInput, again.password_hash);
        return valid ? { ok: true, username } : { ok: false, reason: 'invalid' };
      }
      console.error('[auth] credential seed failed', insertError.message);
      return { ok: false, reason: 'error' };
    }

    await logAdminActivity('credential_seed', 'success', 'Initial administrator password hashed into the database.');
    return { ok: true, username };
  } catch (error) {
    console.error('[auth] unexpected error', error);
    return { ok: false, reason: 'error' };
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = getServerEnv();
  const session = await getAdminSession();
  if (!session) return { ok: false, error: 'You are not signed in.' };
  if (!isBackendConfigured()) return { ok: false, error: 'The backend is not configured yet.' };
  if (newPassword.length < 8) return { ok: false, error: 'Use at least 8 characters.' };
  if (newPassword.length > 200) return { ok: false, error: 'That password is too long.' };

  const supabase = getServiceClient();
  const { data: existing, error } = await supabase
    .from('admin_credentials')
    .select('password_hash')
    .eq('username', env.adminUsername)
    .maybeSingle();

  if (error) return { ok: false, error: 'Could not read the stored credential.' };

  const hash = existing?.password_hash ?? null;
  let currentValid = false;
  if (hash) {
    currentValid = await bcrypt.compare(currentPassword, hash);
  } else if (env.adminPasswordSeed) {
    currentValid = safeEqual(currentPassword, env.adminPasswordSeed);
  }
  if (!currentValid) return { ok: false, error: 'The current password is not correct.' };

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  if (hash) {
    const { error: updateError } = await supabase
      .from('admin_credentials')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('username', env.adminUsername);
    if (updateError) return { ok: false, error: 'Could not update the password.' };
  } else {
    const { error: insertError } = await supabase
      .from('admin_credentials')
      .insert({ username: env.adminUsername, password_hash: passwordHash });
    if (insertError) return { ok: false, error: 'Could not store the new password.' };
  }

  await logAdminActivity('password_changed', 'success');
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Session cookie helpers                                                      */
/* -------------------------------------------------------------------------- */

export async function startAdminSession(username: string) {
  const env = getServerEnv();
  if (!env.sessionSecret) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  const token = await createSessionToken(username, env.sessionSecret);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const env = getServerEnv();
  if (!env.sessionSecret) return null;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token, env.sessionSecret);
}

/** Throws for API routes: any caller must be a valid administrator. */
export async function requireAdminForApi(): Promise<AdminSession | null> {
  return getAdminSession();
}

export function authConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.sessionSecret && isBackendConfigured());
}
