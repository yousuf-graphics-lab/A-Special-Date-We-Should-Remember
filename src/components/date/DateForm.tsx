'use client';

/**
 * Step two — choosing the moment.
 *
 * The form keeps every choice in local state so a failed request can be retried
 * without losing anything. The server is the authority on validity; this
 * component only decides when the button may be pressed.
 */
import { useCallback, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { Calendar } from './Calendar';
import { TimeSelector } from './TimeSelector';
import { ActivityPicker } from './ActivityPicker';
import { ACTIVITY_LABELS, NOTE_MAX_LENGTH, type ActivityValue } from '@/lib/constants';
import {
  detectTimeZone,
  formatLongDate,
  formatTime12h,
  isFutureISODate,
  isValidTime,
} from '@/lib/datetime';
import { celebrateSealed } from '@/lib/client/celebration';
import { playSoftTick } from '@/lib/client/sound';
import type { PublicSelection, SubmissionSuccess, ApiError } from '@/lib/types';

interface DateFormProps {
  onSealed: (selection: PublicSelection) => void;
}

type Status = 'idle' | 'saving' | 'sealed';

export function DateForm({ onSealed }: DateFormProps): JSX.Element {
  const ids = {
    date: useId(),
    time: useId(),
    activity: useId(),
    note: useId(),
    noteHelp: useId(),
    summary: useId(),
  };

  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState('19:30');
  const [activity, setActivity] = useState<ActivityValue | ''>('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const ready = Boolean(date && isFutureISODate(date) && isValidTime(time) && activity);

  const summary = useMemo(() => {
    if (!date) return null;
    const parts = [formatLongDate(date)];
    if (isValidTime(time)) parts.push(formatTime12h(time));
    if (activity) parts.push(ACTIVITY_LABELS[activity]);
    return parts.join(' · ');
  }, [date, time, activity]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!ready || status === 'saving') return;

      setStatus('saving');
      setErrorMessage(null);
      setFieldErrors({});

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            time,
            activity,
            note: note.trim() ? note.trim() : undefined,
            timezone: detectTimeZone(),
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | SubmissionSuccess
          | ApiError
          | null;

        if (!response.ok || !payload || payload.ok !== true) {
          const failure = payload as ApiError | null;
          setFieldErrors(failure?.fieldErrors ?? {});
          setErrorMessage(
            response.status === 429
              ? 'That was a few too many tries. Give it a moment, then try again — nothing you picked was lost.'
              : (failure?.error ??
                'Something interrupted us on the way to the vault. Your choices are still here — try again?'),
          );
          setStatus('idle');
          return;
        }

        // Success: celebrate, hold the message, then move to the countdown.
        setStatus('sealed');
        void celebrateSealed();
        playSoftTick();
        const selection = payload.selection;
        window.setTimeout(() => onSealed(selection), 2100);
      } catch {
        setErrorMessage(
          'We could not reach the vault — it might be your connection. Everything you picked is still here, try again?',
        );
        setStatus('idle');
      }
    },
    [activity, date, note, onSealed, ready, status, time],
  );

  const retry = useCallback(() => {
    setErrorMessage(null);
    if (status === 'idle') {
      document.getElementById('lock-it-in')?.focus();
    }
  }, [status]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-2xl"
      >
        <header className="mb-7 text-center">
          <h2 className="section-title">Yay! Now pick our moment.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
            Any evening that is yours. I will build the rest around it.
          </p>
        </header>

        <form onSubmit={submit} noValidate className="space-y-5">
          <section className="glass p-4 sm:p-6" aria-labelledby={ids.date}>
            <h3 id={ids.date} className="mb-1 font-display text-lg text-white/90">
              The day
            </h3>
            <p id={`${ids.date}-help`} className="mb-4 text-xs text-white/40">
              Only days ahead of today can be chosen. Times are shown in your own timezone.
            </p>
            <Calendar value={date} onChange={setDate} describedBy={`${ids.date}-help`} />
            {fieldErrors.date && (
              <p role="alert" className="mt-3 text-xs text-rose-soft">
                {fieldErrors.date}
              </p>
            )}
          </section>

          <section className="glass p-4 sm:p-6">
            <TimeSelector value={time} onChange={setTime} />
            {fieldErrors.time && (
              <p role="alert" className="mt-3 text-xs text-rose-soft">
                {fieldErrors.time}
              </p>
            )}
          </section>

          <section className="glass p-4 sm:p-6">
            <ActivityPicker value={activity} onChange={setActivity} />
            {fieldErrors.activity && (
              <p role="alert" className="mt-3 text-xs text-rose-soft">
                {fieldErrors.activity}
              </p>
            )}
          </section>

          <section className="glass p-4 sm:p-6">
            <label htmlFor={ids.note} className="field-label">
              A note, if you want to leave one
            </label>
            <textarea
              id={ids.note}
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
              rows={3}
              maxLength={NOTE_MAX_LENGTH}
              placeholder="Anything you want me to know?"
              aria-describedby={ids.noteHelp}
              className="text-input resize-none leading-relaxed"
            />
            <div id={ids.noteHelp} className="mt-2 flex items-center justify-between text-[0.68rem] text-white/35">
              <span>Optional. Only I can read this.</span>
              <span aria-live="polite">
                {note.length}/{NOTE_MAX_LENGTH}
              </span>
            </div>
            {fieldErrors.note && (
              <p role="alert" className="mt-2 text-xs text-rose-soft">
                {fieldErrors.note}
              </p>
            )}
          </section>

          <div className="space-y-3 pt-1">
            <p id={ids.summary} aria-live="polite" className="min-h-[1.25rem] text-center text-sm text-white/55">
              {summary ?? 'Pick a day, a time and something to do.'}
            </p>

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-center text-sm text-rose-soft"
                >
                  <p>{errorMessage}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose/40 px-3 py-1 text-xs text-white/90 transition hover:bg-rose/20"
                  >
                    <RefreshCw size={12} aria-hidden="true" />
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              id="lock-it-in"
              type="submit"
              disabled={!ready || status === 'saving'}
              className="btn-primary mx-auto flex w-full max-w-sm items-center justify-center gap-2 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {status === 'saving' ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  Sealing it…
                </>
              ) : (
                <>
                  <Lock size={17} aria-hidden="true" />
                  Lock it in
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[0.66rem] text-white/30">
              <ShieldCheck size={12} aria-hidden="true" />
              Sent privately. Only I can open it.
            </p>
          </div>
        </form>
      </motion.div>

      {/* Sealed overlay */}
      <AnimatePresence>
        {status === 'sealed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-midnight/85 backdrop-blur-xl"
            role="status"
            aria-live="assertive"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 190, damping: 16 }}
              className="relative flex h-24 w-24 items-center justify-center rounded-full border border-rose/40 bg-gradient-to-br from-rose/25 to-violet/20 shadow-[0_0_60px_-12px_rgba(255,77,141,0.8)]"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 14 }}
              >
                <Check size={38} className="text-white" aria-hidden="true" strokeWidth={2.2} />
              </motion.span>
              <motion.span
                className="absolute inset-0 rounded-full border border-rose/30"
                animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden="true"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mt-7 font-display text-[clamp(1.6rem,7vw,2.5rem)] text-white"
            >
              Sealed in the vault.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-2 text-sm text-white/45"
            >
              It is ours now.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
