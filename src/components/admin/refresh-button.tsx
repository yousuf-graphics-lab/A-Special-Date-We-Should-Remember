'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function RefreshButton({
  autoRefreshSeconds = 0,
  label = 'Refresh',
}: {
  autoRefreshSeconds?: number;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!autoRefreshSeconds) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, autoRefreshSeconds * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshSeconds, router]);

  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        router.refresh();
        setTimeout(() => setBusy(false), 700);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-[#DDCEC4] bg-white/70 px-3.5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#6D575B] transition hover:bg-white"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} strokeWidth={1.6} />
      {label}
    </button>
  );
}
