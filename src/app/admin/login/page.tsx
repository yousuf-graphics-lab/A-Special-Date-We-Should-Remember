import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { isBackendConfigured } from '@/lib/env';
import { LoginForm } from '@/components/admin/login-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Private Access · For Samiya',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  const configured = isBackendConfigured() && Boolean(process.env.ADMIN_SESSION_SECRET);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#F8F3ED] px-4 py-12">
      <div className="w-full max-w-[26rem]">
        <div className="mb-6 text-center">
          <p className="font-display text-[1.4rem] leading-none text-[#3B2730]">For Samiya</p>
          <p className="mt-2 text-[0.58rem] uppercase tracking-[0.28em] text-[#A0877C]">private admin</p>
        </div>

        <div className="rounded-[16px] border border-[#E7DCD2] bg-white/85 p-6 shadow-[0_30px_80px_-60px_rgba(58,39,48,0.8)] sm:p-7">
          <h1 className="font-display text-[1.5rem] text-[#3B2730]">Sign in</h1>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-[#7A6565]">
            This space is for Yousuf only. There is no public sign-up.
          </p>

          <LoginForm configured={configured} />
        </div>

        <p className="mt-5 text-center text-[0.7rem] leading-relaxed text-[#9A8580]">
          Her romantic website never links here. Access is protected by a private password and a signed
          session.
        </p>
      </div>
    </div>
  );
}
