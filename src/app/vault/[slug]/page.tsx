/**
 * The private dashboard.
 *
 * Authorization happens here, on the server, before a single row is read — the
 * middleware redirect is only a convenience on top. Any slug other than the
 * configured one is a 404, and an unauthenticated visitor is redirected to the
 * login screen.
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerConfig } from '@/lib/config';
import { getAdminSession, normalizeVaultSlug } from '@/lib/server/auth';
import { listVaultEntries } from '@/lib/server/vault';
import { VaultDashboard } from '@/components/admin/VaultDashboard';
import type { VaultEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Private vault' },
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

interface PageProps {
  params: { slug: string };
}

export default async function VaultPage({ params }: PageProps): Promise<JSX.Element> {
  let slug = '';
  try {
    slug = getServerConfig().ADMIN_SLUG;
  } catch {
    notFound();
  }

  if (normalizeVaultSlug(params.slug) !== slug) notFound();

  const session = await getAdminSession();
  if (!session) redirect(`/vault-${slug}/login`);

  let entries: VaultEntry[] = [];
  let loadError = false;
  try {
    entries = await listVaultEntries(50);
  } catch (error) {
    console.error('[vault] could not load entries:', (error as Error).message);
    loadError = true;
  }

  return <VaultDashboard slug={slug} initialEntries={entries} loadError={loadError} />;
}
