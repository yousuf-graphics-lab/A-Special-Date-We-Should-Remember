/**
 * Server-only configuration loader.
 *
 * Nothing in this file may ever be imported by a client component: it reads
 * private environment variables (service role key, JWT secret, password hash).
 * The `assertServer` guard below fails loudly during development if the module
 * ever ends up in a browser bundle.
 */

import { z } from 'zod';

function assertServer(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'src/lib/config.ts is server-only. A client component imported it by mistake.',
    );
  }
}

assertServer();

/**
 * `.env` files are expanded by Next.js, and a bcrypt hash is full of `$` — an
 * unescaped hash silently loses characters. Two supported forms:
 *   1. ADMIN_PASSWORD_BASE64  → base64 of the bcrypt hash (immune to expansion)
 *   2. ADMIN_PASSWORD_HASH    → the hash with every `$` escaped as `\$`
 */
function resolvePasswordHash(): string | undefined {
  const base64 = process.env.ADMIN_PASSWORD_BASE64?.trim();
  if (base64) {
    try {
      const decoded = Buffer.from(base64, 'base64').toString('utf8').trim();
      if (decoded.startsWith('$2')) return decoded;
    } catch {
      /* fall through to the plain variable */
    }
  }
  const raw = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return undefined;
  return raw.replace(/^['"]/, '').replace(/['"]$/, '');
}

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is missing'),
  ADMIN_PASSWORD_HASH: z
    .string()
    .startsWith('$2', 'ADMIN_PASSWORD_HASH must be a bcrypt hash (set ADMIN_PASSWORD_BASE64 or escape every $ as \\$)'),
  ADMIN_SLUG: z
    .string()
    .min(8, 'ADMIN_SLUG must be at least 8 characters')
    .regex(/^[a-z0-9-]+$/, 'ADMIN_SLUG may only contain lowercase letters, numbers and dashes'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters — generate a random one'),
});

export type ServerConfig = z.infer<typeof serverSchema> & {
  siteUrl: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  notificationEmailTo?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
};

let cached: ServerConfig | null = null;

/**
 * Reads and validates every required server environment variable.
 * Throws one readable error listing everything that is missing so local setup
 * never fails with a cryptic `undefined` further down the stack.
 */
export function getServerConfig(): ServerConfig {
  assertServer();
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_PASSWORD_HASH: resolvePasswordHash(),
    ADMIN_SLUG: process.env.ADMIN_SLUG,
    JWT_SECRET: process.env.JWT_SECRET,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\n` +
        'Copy .env.example to .env.local and fill in the missing values.',
    );
  }

  const optional = (value: string | undefined): string | undefined =>
    value && value.trim().length > 0 ? value.trim() : undefined;

  cached = {
    ...parsed.data,
    siteUrl: (
      optional(process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000'
    ).replace(/\/$/, ''),
    resendApiKey: optional(process.env.RESEND_API_KEY),
    resendFromEmail: optional(process.env.RESEND_FROM_EMAIL),
    notificationEmailTo: optional(process.env.NOTIFICATION_EMAIL_TO),
    telegramBotToken: optional(process.env.TELEGRAM_BOT_TOKEN),
    telegramChatId: optional(process.env.TELEGRAM_CHAT_ID),
  };
  return cached;
}

