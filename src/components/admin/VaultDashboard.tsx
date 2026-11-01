'use client';

/**
 * Private dashboard: what she chose, her note, the countdown, and my own plan
 * text. Every write goes through an authenticated endpoint; nothing here is
 * trusted by the server.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Loader2,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Countdown } from '../countdown/Countdown';
import { activityLabel, OWNER_NOTES_MAX_LENGTH } from '@/lib/constants';
import { formatLongDate, formatTime12h, timeZoneLabel } from '@/lib/datetime';
import type { VaultEntry } from '@/lib/types';

interface VaultDashboardProps {
  slug: string;
  initialEntries: VaultEntry[];
  loadError: boolean;
}

function submittedLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function VaultDashboard({
  slug,
  initialEntries,
  loadError,
}: VaultDashboardProps): JSX.Element {
  const router = useRouter();
  const [entries, setEntries] = useState<VaultEntry[]>(initialEntries);
  const [activeId, setActiveId] = useState<string | null>(initialEntries[0]?.id ?? null);
  const [plan, setPlan] = useState(initialEntries[0]?.ownerNotes ?? '');
  const [planState, setPlanState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const active = useMemo(
    () => entries.find((entry) => entry.id === activeId) ?? entries[0] ?? null,
    [activeId, entries],
  );

  // Reload the plan only when a *different* entry becomes active — saving must
  // not wipe the "Saved" confirmation.
  const loadedEntryRef = useRef<string | null>(null);
  useEffect(() => {
    const nextId = active?.id ?? null;
    if (nextId === loadedEntryRef.current) return;
    loadedEntryRef.current = nextId;
    setPlan(active?.ownerNotes ?? '');
    setPlanState('idle');
    setConfirmDelete(false);
  }, [active]);

  const savePlan = useCallback(async () => {
    if (!active || planState === 'saving') return;
    setPlanState('saving');
    try {
      const response = await fetch('/api/admin/entries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: active.id, ownerNotes: plan }),
      });
      if (!response.ok) throw new Error('save failed');
      const payload = (await response.json()) as { ok: boolean; entry?: VaultEntry };
      if (payload.entry) {
        setEntries((current) =>
          current.map((entry) => (entry.id === payload.entry!.id ? payload.entry! : entry)),
        );
      }
      setPlanState('saved');
      window.setTimeout(() => setPlanState('idle'), 2500);
    } catch {
      setPlanState('error');
    }
  }, [active, plan, planState]);

  const copyDateTime = useCallback(async () => {
    if (!active) return;
    const text = `${formatLongDate(active.chosenDate)} · ${formatTime12h(active.chosenTime)} (${timeZoneLabel(active.timezone)})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice('Copy failed — your browser blocked clipboard access.');
    }
  }, [active]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace(`/vault-${slug}/login`);
      router.refresh();
    }
  }, [router, slug]);

  const removeEntry = useCallback(async () => {
    if (!active || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/entries?id=${active.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete failed');
      setEntries((current) => current.filter((entry) => entry.id !== active.id));
      setActiveId(null);
      setNotice('Entry removed.');
    } catch {
      setNotice('Could not remove that entry.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [active, deleting]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.32em] text-white/30">Private vault</p>
          <h1 className="mt-1 font-display text-3xl text-white">Her answer</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.66rem] font-medium ${
              entries.length > 0
                ? 'border-rose/40 bg-rose/10 text-rose-soft'
                : 'border-white/15 bg-white/[0.04] text-white/45'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${entries.length > 0 ? 'bg-rose' : 'bg-white/30'}`}
            />
            {entries.length > 0 ? 'Date received' : 'Waiting'}
          </span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[0.7rem] text-white/60 transition hover:border-white/30 hover:text-white"
          >
            <LogOut size={13} aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>

      {notice && (
        <p role="status" className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
          {notice}
        </p>
      )}

      {loadError && (
        <p role="alert" className="mb-4 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose-soft">
          The vault could not be read. Check the Supabase credentials, then refresh.
        </p>
      )}

      {!active ? (
        <div className="glass px-6 py-12 text-center">
          <ShieldCheck size={26} className="mx-auto mb-3 text-white/25" aria-hidden="true" />
          <p className="font-display text-xl text-white/80">Nothing in the vault yet.</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/40">
            When Samiya sends her answer it will appear here, and you will be notified if email or
            Telegram is configured.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass px-5 py-6 sm:px-7"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[0.62rem] uppercase tracking-[0.26em] text-white/35">
                She said yes
              </p>
              <p className="text-[0.66rem] text-white/30">
                Received {submittedLabel(active.createdAt)}
              </p>
            </div>

            <p className="mt-3 font-display text-[clamp(1.15rem,4.4vw,1.6rem)] leading-snug text-white">
              {formatLongDate(active.chosenDate)}
              <span className="mx-1.5 text-rose/60">·</span>
              {formatTime12h(active.chosenTime)}
              <span className="mx-1.5 text-rose/60">·</span>
              <span className="text-gold">{activityLabel(active.activity)}</span>
            </p>

            <p className="mt-1.5 text-[0.7rem] text-white/35">
              {timeZoneLabel(active.timezone)} time · {active.timezone}
            </p>

            <div className="mt-5">
              <Countdown
                dateISO={active.chosenDate}
                time={active.chosenTime}
                timezone={active.timezone}
              />
            </div>

            {active.note && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-midnight-deep/50 px-4 py-3">
                <p className="text-[0.6rem] uppercase tracking-[0.24em] text-white/30">Her note</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                  {active.note}
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyDateTime}
                className="btn-ghost px-4 py-2 text-[0.72rem]"
              >
                {copied ? (
                  <>
                    <Check size={13} aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} aria-hidden="true" /> Copy date &amp; time
                  </>
                )}
              </button>

              {confirmDelete ? (
                <span className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={removeEntry}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose/50 bg-rose/15 px-4 py-2 text-[0.72rem] text-white"
                  >
                    {deleting ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
                    Yes, delete it
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full px-3 py-2 text-[0.72rem] text-white/50 hover:text-white"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-[0.72rem] text-white/50 transition hover:border-rose/40 hover:text-white"
                >
                  <Trash2 size={13} aria-hidden="true" /> Delete entry
                </button>
              )}
            </div>
          </motion.section>

          <section className="glass px-5 py-6 sm:px-7">
            <label htmlFor="owner-plan" className="field-label">
              My plan
            </label>
            <textarea
              id="owner-plan"
              value={plan}
              onChange={(event) => setPlan(event.target.value.slice(0, OWNER_NOTES_MAX_LENGTH))}
              rows={5}
              maxLength={OWNER_NOTES_MAX_LENGTH}
              placeholder="Where we'll go, what I'll bring, what I want to say…"
              className="text-input resize-none leading-relaxed"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[0.66rem] text-white/30">
                Private. Only visible here. {plan.length}/{OWNER_NOTES_MAX_LENGTH}
              </span>
              <button
                type="button"
                onClick={savePlan}
                disabled={planState === 'saving'}
                className="btn-gold px-4 py-2 text-[0.72rem] disabled:opacity-60"
              >
                {planState === 'saving' ? (
                  <>
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" /> Saving…
                  </>
                ) : planState === 'saved' ? (
                  <>
                    <Check size={13} aria-hidden="true" /> Saved
                  </>
                ) : (
                  <>
                    <Save size={13} aria-hidden="true" /> Save plan
                  </>
                )}
              </button>
            </div>
            {planState === 'error' && (
              <p role="alert" className="mt-2 text-xs text-rose-soft">
                That did not save. Try again in a moment.
              </p>
            )}
          </section>

          {entries.length > 1 && (
            <section className="glass px-5 py-5 sm:px-7">
              <h2 className="mb-3 text-[0.62rem] uppercase tracking-[0.26em] text-white/35">
                Earlier answers
              </h2>
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(entry.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        entry.id === active.id
                          ? 'border-rose/40 bg-rose/10 text-white'
                          : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {formatLongDate(entry.chosenDate)} · {formatTime12h(entry.chosenTime)} ·{' '}
                      {activityLabel(entry.activity)}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <footer className="mt-8 text-center text-[0.62rem] uppercase tracking-[0.28em] text-white/15">
        for samiya · private
      </footer>
    </main>
  );
}
