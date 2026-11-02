'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        try {
          await fetch('/api/admin/logout', { method: 'POST' });
        } finally {
          router.replace('/admin/login');
          router.refresh();
          setBusy(false);
        }
      }}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-[#DDCEC4] bg-white/70 px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#6D575B] transition hover:bg-white disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />}
      {busy ? 'Signing out…' : 'Log out securely'}
    </button>
  );
}
