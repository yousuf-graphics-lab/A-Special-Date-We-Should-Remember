import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminShell } from '@/components/admin/shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'For Samiya · Private Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return <AdminShell username={session.u}>{children}</AdminShell>;
}
