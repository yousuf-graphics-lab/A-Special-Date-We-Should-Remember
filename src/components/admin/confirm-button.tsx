'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Trash2, X } from 'lucide-react';

export function ConfirmButton({
  label,
  title,
  description,
  endpoint,
  method = 'DELETE',
  payload,
  redirectTo,
  compact = false,
}: {
  label: string;
  title: string;
  description: string;
  endpoint: string;
  method?: 'DELETE' | 'POST';
  payload?: unknown;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || 'That action could not be completed.');
        setBusy(false);
        return;
      }
      setOpen(false);
      setBusy(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError('The connection failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 rounded-full border border-[#E3C7C3] bg-white/70 px-2.5 py-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-[#8E3F3F] transition hover:bg-[#FBEEEC]'
            : 'inline-flex items-center gap-2 rounded-full border border-[#E3C7C3] bg-white/70 px-3.5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#8E3F3F] transition hover:bg-[#FBEEEC]'
        }
      >
        <Trash2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={1.6} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1A20]/45 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-[26rem] rounded-[16px] border border-[#E7DCD2] bg-[#FCF8F3] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="confirm-title" className="font-display text-[1.28rem] leading-tight text-[#3B2730]">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#9A8580] transition hover:text-[#5A444A]"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-[#7A6565]">{description}</p>

            {error && (
              <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-[#E6C4C1] bg-[#FBEEEC] p-3 text-[0.78rem] leading-relaxed text-[#8E3F3F]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#DDCEC4] px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#6D575B] transition hover:bg-white"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={run}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-[#8E3F3F] px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-[#FDF4EF] transition hover:bg-[#7A3232] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {busy ? 'Working…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
