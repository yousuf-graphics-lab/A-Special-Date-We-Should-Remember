'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const TOP_RESERVED = 104; // keep clear of the chapter strip
const BOTTOM_RESERVED = 104; // keep clear of the music button
const SIDE_RESERVED = 14;
const YES_CLEARANCE = 18;
const DRIFT_EVERY = 3200;

type Spot = { left: number; top: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The playful "No, not today". It wanders anywhere on the screen, never covers
 * the Yes button, and after three taps it stays put so her decision is always
 * possible. Reduced motion keeps it politely still, right beside the Yes.
 */
export function WanderingNo({
  label,
  onGiveUp,
  onDecline,
  yesRef,
  wandering,
  onWander,
}: {
  label: string;
  onGiveUp: () => void;
  onDecline: () => void;
  yesRef: React.RefObject<HTMLButtonElement | null>;
  wandering: boolean;
  onWander: () => void;
}) {
  const reduce = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const spotRef = useRef<Spot | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [caught, setCaught] = useState(false);

  const place = useCallback((next: Spot) => {
    spotRef.current = next;
    setSpot(next);
  }, []);

  /** Somewhere on the whole screen that is not the Yes button. */
  const findHome = useCallback((): Spot => {
    const button = buttonRef.current;
    const width = button?.offsetWidth ?? 170;
    const height = button?.offsetHeight ?? 48;
    const maxLeft = Math.max(SIDE_RESERVED, window.innerWidth - width - SIDE_RESERVED);
    const maxTop = Math.max(TOP_RESERVED, window.innerHeight - height - BOTTOM_RESERVED);
    const yes = yesRef.current?.getBoundingClientRect();

    for (let attempt = 0; attempt < 26; attempt += 1) {
      const candidate = {
        left: SIDE_RESERVED + Math.random() * (maxLeft - SIDE_RESERVED),
        top: TOP_RESERVED + Math.random() * (maxTop - TOP_RESERVED),
      };
      if (yes) {
        const overlaps =
          candidate.left + width > yes.left - YES_CLEARANCE &&
          candidate.left < yes.right + YES_CLEARANCE &&
          candidate.top + height > yes.top - YES_CLEARANCE &&
          candidate.top < yes.bottom + YES_CLEARANCE;
        if (overlaps) continue;
      }
      return candidate;
    }
    return { left: SIDE_RESERVED, top: maxTop };
  }, [yesRef]);

  /** Hop somewhere new, anywhere on the screen, never onto the Yes. */
  const hop = useCallback(() => {
    const button = buttonRef.current;
    const width = button?.offsetWidth ?? 170;
    const height = button?.offsetHeight ?? 48;
    const maxLeft = Math.max(SIDE_RESERVED, window.innerWidth - width - SIDE_RESERVED);
    const maxTop = Math.max(TOP_RESERVED, window.innerHeight - height - BOTTOM_RESERVED);
    const yes = yesRef.current?.getBoundingClientRect();
    const current = spotRef.current ?? { left: SIDE_RESERVED, top: maxTop };

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const candidate = {
        left: clamp(
          current.left + (Math.random() * 2 - 1) * (window.innerWidth * 0.58),
          SIDE_RESERVED,
          maxLeft,
        ),
        top: clamp(
          current.top + (Math.random() * 2 - 1) * (window.innerHeight * 0.45),
          TOP_RESERVED,
          maxTop,
        ),
      };

      const travelled = Math.abs(candidate.left - current.left) + Math.abs(candidate.top - current.top);
      if (travelled < 150) continue;

      if (yes) {
        const overlaps =
          candidate.left + width > yes.left - YES_CLEARANCE &&
          candidate.left < yes.right + YES_CLEARANCE &&
          candidate.top + height > yes.top - YES_CLEARANCE &&
          candidate.top < yes.bottom + YES_CLEARANCE;
        if (overlaps) continue;
      }

      place(candidate);
      return candidate;
    }

    return place(findHome());
  }, [findHome, place, yesRef]);

  // Step out of the line-up as soon as the question has had a breath of air.
  useEffect(() => {
    if (!wandering || reduce) return;
    if (!spotRef.current) place(findHome());
  }, [findHome, place, reduce, wandering]);

  // Keep it reachable when the window changes shape.
  useEffect(() => {
    if (!wandering) return;
    function onResize() {
      const button = buttonRef.current;
      const width = button?.offsetWidth ?? 170;
      const height = button?.offsetHeight ?? 48;
      const maxLeft = Math.max(SIDE_RESERVED, window.innerWidth - width - SIDE_RESERVED);
      const maxTop = Math.max(TOP_RESERVED, window.innerHeight - height - BOTTOM_RESERVED);
      const current = spotRef.current;
      if (!current) return;
      if (current.left > maxLeft || current.top > maxTop) {
        place({
          left: clamp(current.left, SIDE_RESERVED, maxLeft),
          top: clamp(current.top, TOP_RESERVED, maxTop),
        });
      }
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [place, wandering]);

  // Now and then it drifts a little further, all on its own.
  useEffect(() => {
    if (!wandering || reduce) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      hop();
    }, DRIFT_EVERY);
    return () => clearInterval(timer);
  }, [hop, reduce, wandering]);

  // A tap is always honoured — the little flinch is only decoration.
  function handlePress() {
    setCaught(true);
    setTimeout(() => setCaught(false), 420);
    if (wandering) {
      onWander();
      hop();
      return;
    }
    onDecline();
  }

  if (!wandering && !spot) {
    return (
      <button
        type="button"
        onClick={onDecline}
        className="btn btn-ghost-dusk px-6 py-3.5 text-[0.8rem] tracking-[0.1em]"
      >
        {label}
      </button>
    );
  }

  // One invisible frame while its first home is chosen.
  if (!spot) return null;

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        left: spot.left,
        top: spot.top,
        rotate: caught ? [0, -6, 5, 0] : 0,
        scale: caught ? [1, 0.93, 1.03, 1] : 1,
      }}
      transition={{
        left: { type: 'spring', stiffness: 180, damping: 19, mass: 0.7 },
        top: { type: 'spring', stiffness: 180, damping: 19, mass: 0.7 },
        rotate: { duration: 0.42 },
        scale: { duration: 0.42 },
        opacity: { duration: 0.35 },
      }}
      onClick={handlePress}
      className="btn btn-ghost-dusk fixed z-[46] px-6 py-3.5 text-[0.8rem] tracking-[0.1em] backdrop-blur-md"
      style={{ touchAction: 'manipulation' }}
      aria-label={
        wandering
          ? `${label} — this one likes to wander, but you can catch it`
          : `${label} — it has stopped running`
      }
      aria-describedby="no-hint"
    >
      {label}
    </motion.button>
  );
}
