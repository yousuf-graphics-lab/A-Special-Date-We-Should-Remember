/**
 * The vault's login screen. Server-rendered, noindex, and only reachable on the
 * exact secret slug — any other `vault-*` path is a 404.
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerConfig } from '@/lib/config';
import { getAdminSession, normalizeVaultSlug } from '@/lib/server/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Private vault' },
  robots: { index: false, follow: false, nocache: true },
};

interface PageProps {
  params: { slug: string };
}

export default async function VaultLoginPage({ params }: PageProps): Promise<JSX.Element> {
  let expectedSlug = '';
  try {
    expectedSlug = getServerConfig().ADMIN_SLUG;
  } catch {
    notFound();
  }

  if (normalizeVaultSlug(params.slug) !== expectedSlug) notFound();

  const session = await getAdminSession();
  if (session) redirect(`/vault-${expectedSlug}`);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/30">Private</p>
          <h1 className="mt-2 font-display text-3xl text-white">The vault</h1>
          <p className="mt-2 text-sm text-white/40">
            Only the two of you, and only you can open it.
          </p>
        </div>
        <LoginForm slug={expectedSlug} />
      </div>
    </main>
  );
}
