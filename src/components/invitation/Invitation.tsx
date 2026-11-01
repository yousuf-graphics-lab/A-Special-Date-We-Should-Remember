'use client';

/**
 * Step one — the invitation.
 *
 * The "No" button politely refuses to be caught: it hops to a random spot
 * inside its arena, shrinks slightly and cycles through seven labels before
 * disappearing entirely. Targets are rejection-sampled so it can never land on
 * top of "Yes", it never leaves the arena (so no horizontal scrolling), and it
 * stays a real <button> so keyboard and screen-reader users are unaffected.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { Typewriter } from './Typewriter';

const NO_LABELS = [
  'No',
  'Are you sure?',
  'Really sure?',
  'Think again',
  'Last chance!',
  "You can't catch me",
  'Okay fine, just say yes',
] as const;

const FINAL_INDEX = NO_LABELS.length - 1;
const VANISH_AT = NO_LABELS.length + 1; // one extra tap after the last label

interface InvitationProps {
  onAccept: () => void;
}

export function Invitation({ onAccept }: InvitationProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const arenaRef = useRef<HTMLDivElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const lastHoverRef = useRef(0);

  const [typed, setTyped] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [floating, setFloating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [vanished, setVanished] = useState(false);

  const label = NO_LABELS[Math.min(dodges, FINAL_INDEX)] ?? NO_LABELS[0];

  const pickTarget = useCallback((): { x: number; y: number } => {
    const arena = arenaRef.current;
    const noButton = noRef.current;
    const yesButton = yesRef.current;
    if (!arena) return { x: 0, y: 0 };

    const arenaRect = arena.getBoundingClientRect();
    const width = noButton?.offsetWidth ?? 96;
    const height = noButton?.offsetHeight ?? 44;
    const maxX = Math.max(0, arenaRect.width - width);
    const maxY = Math.max(0, arenaRect.height - height);

    // Keep a comfortable margin around "Yes" so it can always be clicked.
    const padding = 18;
    const yesRect = yesButton?.getBoundingClientRect();
    const avoid = yesRect
      ? {
          left: yesRect.left - arenaRect.left - padding,
          top: yesRect.top - arenaRect.top - padding,
          right: yesRect.right - arenaRect.left + padding,
          bottom: yesRect.bottom - arenaRect.top + padding,
        }
      : null;

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
      if (!avoid) return { x, y };
      const overlaps =
        x < avoid.right && x + width > avoid.left && y < avoid.bottom && y + height > avoid.top;
      if (!overlaps) return { x, y };
    }

    // Deterministic fallback: bottom of the arena, far from "Yes".
    return { x: maxX, y: maxY };
  }, []);

  const dodge = useCallback(() => {
    if (vanished) return;

    if (!floating) {
      const arena = arenaRef.current;
      const noButton = noRef.current;
      if (arena && noButton) {
        // Pin the button exactly where it is so nothing "jumps".
        const arenaRect = arena.getBoundingClientRect();
        const rect = noButton.getBoundingClientRect();
        setFloating(true);
        setPosition({ x: rect.left - arenaRect.left, y: rect.top - arenaRect.top });
        window.requestAnimationFrame(() => {
          setPosition(pickTarget());
          setDodges((count) => count + 1);
        });
        return;
      }
    }

    if (dodges + 1 >= VANISH_AT) {
      setVanished(true);
      return;
    }

    setPosition(pickTarget());
    setDodges((count) => count + 1);
  }, [dodges, floating, pickTarget, vanished]);

  // Optional: after the final message the button gives up on its own.
  useEffect(() => {
    if (vanished || dodges < FINAL_INDEX) return;
    const timer = window.setTimeout(() => setVanished(true), 6500);
    return () => window.clearTimeout(timer);
  }, [dodges, vanished]);

  const scale = vanished ? 1 : Math.max(0.52, 1 - dodges * 0.075);
  const yesScale = reducedMotion ? 1 : Math.min(1.28, 1 + dodges * 0.045);

  return (
    <div className="mx-auto w-full max-w-xl px-1 text-center">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[0.66rem] font-medium uppercase tracking-[0.28em] text-gold/80"
      >
        <Sparkles size={12} aria-hidden="true" />
        A letter for you
      </motion.p>

      <h1 className="font-display text-[clamp(2.1rem,10vw,4rem)] font-medium leading-[1.08] tracking-tight text-white">
        <Typewriter
          text="Hey Samiya..."
          speed={92}
          onComplete={() => setTyped(true)}
          className="block"
        />
      </h1>

      <AnimatePresence>
        {typed && (
          <motion.div
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="mt-6"
          >
            <p className="mx-auto max-w-md font-display text-[clamp(1.15rem,5.4vw,1.9rem)] italic leading-snug text-rose-soft/95">
              Will you go on a date with me?
            </p>

            <div
              ref={arenaRef}
              className="relative mx-auto mt-8 min-h-[220px] w-full max-w-sm sm:min-h-[200px]"
            >
              <div className="flex justify-center pt-1">
                <motion.button
                  ref={yesRef}
                  type="button"
                  onClick={onAccept}
                  animate={{ scale: yesScale }}
                  whileHover={{ scale: yesScale * 1.04 }}
                  whileTap={{ scale: yesScale * 0.96 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="btn-primary min-w-[124px] px-9 py-3.5 text-base font-semibold shadow-[0_14px_44px_-12px_rgba(255,77,141,0.95)]"
                >
                  <Heart size={17} aria-hidden="true" className="fill-white/90" />
                  Yes
                </motion.button>
              </div>

              {!vanished && (
                <motion.button
                  ref={noRef}
                  type="button"
                  aria-label={`${label} — this button will move away`}
                  className={
                    floating
                      ? 'absolute left-0 top-0 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm text-white/70 backdrop-blur-sm'
                      : 'relative mx-auto mt-5 block rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm text-white/70 backdrop-blur-sm'
                  }
                  animate={{ x: position.x, y: position.y, scale }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 260, damping: 20, mass: 0.7 }
                  }
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'mouse') return;
                    lastHoverRef.current = Date.now();
                    dodge();
                  }}
                  onClick={() => {
                    // A mouse click follows pointerenter; don't dodge twice.
                    if (Date.now() - lastHoverRef.current < 450) return;
                    dodge();
                  }}
                  onFocus={() => {
                    // Keyboard users get the same playful reaction — the button
                    // moves, but focus is never trapped or lost.
                    if (Date.now() - lastHoverRef.current > 450) dodge();
                  }}
                >
                  {label}
                </motion.button>
              )}
            </div>

            <div aria-live="polite" className="sr-only">
              {vanished
                ? 'The No button has disappeared. Only Yes remains.'
                : dodges > 0
                  ? `No button now says: ${label}`
                  : ''}
            </div>

            <AnimatePresence>
              {dodges > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-1 text-[0.72rem] tracking-wide text-white/35"
                >
                  {vanished
                    ? 'Well. That settles it, then.'
                    : 'Hmm. That button seems a little shy.'}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
