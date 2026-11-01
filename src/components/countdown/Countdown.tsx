'use client';

/**
 * The countdown.
 *
 * Only this component re-renders each second — the summary, card and buttons
 * next to it stay untouched. Values are derived from an absolute instant, so
 * they can never go negative or drift with timezone changes.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { pad2, resolveDateInstant, getRemainingTime, type RemainingTime } from '@/lib/datetime';

interface CountdownProps {
  dateISO: string;
  time: string;
  timezone: string;
  onArrive?: () => void;
}

const BLOCKS = [
  { key: 'days', label: 'days' },
  { key: 'hours', label: 'hours' },
  { key: 'minutes', label: 'minutes' },
  { key: 'seconds', label: 'seconds' },
] as const;

export function Countdown({ dateISO, time, timezone, onArrive }: CountdownProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const target = useMemo(
    () => resolveDateInstant(dateISO, time, timezone),
    [dateISO, time, timezone],
  );

  // `null` until mounted: the server clock and the phone clock are different
  // clocks, and a mismatch would flash the wrong number on first paint.
  const [remaining, setRemaining] = useState<RemainingTime | null>(null);
  const arrivedRef = useRef(false);

  useEffect(() => {
    arrivedRef.current = false;

    const tick = (): void => {
      const next = getRemainingTime(target);
      setRemaining(next);
      if (next.isPast && !arrivedRef.current) {
        arrivedRef.current = true;
        onArrive?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
    // `onArrive` is a stable-ish callback from the parent; re-running on it
    // would restart the interval unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const values = remaining
    ? [
        { key: 'days', value: `${remaining.days}`.padStart(2, '0'), label: 'days' },
        { key: 'hours', value: pad2(remaining.hours), label: 'hours' },
        { key: 'minutes', value: pad2(remaining.minutes), label: 'minutes' },
        { key: 'seconds', value: pad2(remaining.seconds), label: 'seconds' },
      ]
    : BLOCKS.map((block) => ({ key: block.key, value: '––', label: block.label }));

  const screenReaderText = remaining
    ? `${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes and ${remaining.seconds} seconds remaining`
    : 'Loading the countdown';

  return (
    <div className="w-full">
      <span className="sr-only" aria-live="polite">
        {screenReaderText}
      </span>

      <div
        className="flex items-start justify-center gap-1.5 sm:gap-3"
        role="timer"
        aria-label={screenReaderText}
      >
        {values.map((item, index) => (
          <div key={item.key} className="flex items-start gap-1.5 sm:gap-3">
            <div className="flex min-w-[3.4rem] flex-col items-center sm:min-w-[5rem]">
              <div className="relative flex h-[3.9rem] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:h-[5.6rem]">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={item.value}
                    initial={reducedMotion ? false : { y: '-60%', opacity: 0, scale: 0.94 }}
                    animate={{ y: '0%', opacity: 1, scale: 1 }}
                    exit={reducedMotion ? undefined : { y: '60%', opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-[clamp(1.75rem,8vw,2.9rem)] font-medium tabular-nums leading-none text-white"
                  >
                    {item.value}
                  </motion.span>
                </AnimatePresence>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_-20%,rgba(255,77,141,0.22),transparent_70%)]"
                />
              </div>
              <span className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/35 sm:text-[0.65rem]">
                {item.label}
              </span>
            </div>
            {index < values.length - 1 && (
              <span
                aria-hidden="true"
                className="mt-3 font-display text-xl text-rose/45 sm:mt-5 sm:text-2xl"
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
