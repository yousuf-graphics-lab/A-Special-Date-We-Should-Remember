'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimation, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { LOCK_COPY, isBirthdayAnswer } from '@/lib/content';
import { Ambience } from './ambience';
import { HeartLockArt } from './heart-lock';
import { Ornament } from './ornaments';
import { useMusic } from './music';

export function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shakeControls = useAnimation();
  const reduce = useReducedMotion();
  const { playChime } = useMusic();

  useEffect(() => {
    // Only pull the keyboard up on devices with a real pointer.
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      const timer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!unlocking) return;
    const timer = setTimeout(onUnlocked, reduce ? 320 : 1250);
    return () => clearTimeout(timer);
  }, [unlocking, onUnlocked, reduce]);

  function nudge() {
    if (reduce) return;
    void shakeControls.start({
      x: [0, -7, 6, -4, 2, 0],
      transition: { duration: 0.42, ease: 'easeInOut' },
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (unlocking) return;

    if (!value.trim()) {
      setError(LOCK_COPY.emptyError);
      nudge();
      return;
    }

    if (!isBirthdayAnswer(value)) {
      setError(LOCK_COPY.unlockError);
      nudge();
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
      return;
    }

    setError(null);
    setUnlocking(true);
    playChime();
  }

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden day-bg">
      <Ambience tone="day" hearts />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col items-center text-center"
        >
          <p className="eyebrow">{LOCK_COPY.eyebrow}</p>

          <h1 className="display-hero mt-4 text-wine-deep text-balance">{LOCK_COPY.title}</h1>

          <div className="mt-3 flex items-center gap-2 text-rose-deep/80">
            <span className="h-px w-8 bg-rose-deep/30" />
            <Heart className="h-3 w-3" strokeWidth={1.2} fill="currentColor" />
            <span className="h-px w-8 bg-rose-deep/30" />
          </div>

          <p className="display-sub mt-4 max-w-md text-ink/80">{LOCK_COPY.subtitle}</p>

          <motion.div
            className="mt-7 sm:mt-9"
            animate={
              unlocking
                ? { scale: reduce ? 1 : 1.06, opacity: 0.96 }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.6 }}
          >
            <HeartLockArt
              unlocked={unlocking}
              className="h-[104px] w-[104px] sm:h-[126px] sm:w-[126px]"
            />
          </motion.div>

          <p className="prose-body mt-5 max-w-[27rem] text-balance text-[0.92rem] sm:text-[0.98rem]">
            {LOCK_COPY.hint}
          </p>

          <Ornament className="my-6" />

          <form onSubmit={handleSubmit} className="w-full max-w-[22rem] sm:max-w-[24rem]" noValidate>
            <label htmlFor="birthday" className="sr-only">
              {LOCK_COPY.passwordLabel}
            </label>
            <motion.div animate={shakeControls} className="relative">
              <input
                ref={inputRef}
                id="birthday"
                name="birthday"
                type="text"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError(null);
                }}
                placeholder={LOCK_COPY.passwordPlaceholder}
                inputMode="numeric"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby="birthday-hint birthday-error"
                disabled={unlocking}
                className="field h-[3.35rem] rounded-full border-wine/20 bg-white/70 pl-5 pr-12 text-center font-display text-[1rem] tracking-[0.24em] text-wine-deep shadow-[inset_0_1px_2px_rgba(110,42,58,0.06)] backdrop-blur-sm sm:pl-6 sm:pr-14 sm:text-[1.06rem] sm:tracking-[0.38em]"
              />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-rose-deep/50">
                <Heart className="h-4 w-4" strokeWidth={1.4} />
              </span>
            </motion.div>
            <p id="birthday-hint" className="sr-only">
              Enter the date written as day, month and year.
            </p>

            <div className="mt-3 min-h-[2.1rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.p
                    key={error}
                    id="birthday-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="font-display text-[0.98rem] italic text-wine"
                  >
                    {error}
                  </motion.p>
                ) : (
                  <span key="empty" className="block h-full" />
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={unlocking}
              className="btn btn-primary mt-1 w-full"
              aria-label="Unlock this little world"
            >
              {unlocking ? 'Opening…' : LOCK_COPY.button}
              {!unlocking && <Heart className="h-3.5 w-3.5" strokeWidth={1.6} fill="currentColor" />}
            </button>
          </form>

          <p className="mt-6 text-[0.68rem] uppercase tracking-[0.24em] text-ink-soft/55">
            {LOCK_COPY.footnote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
