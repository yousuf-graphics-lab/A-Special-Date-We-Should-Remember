'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const TOP_RESERVED = 108; // keep clear of the chapter strip
const BOTTOM_RESERVED = 108; // keep clear of the music button and thumbs
const SIDE_RESERVED = 14;
const YES_CLEARANCE = 20;

type Spot = { left: number; top: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The playful "No, not today". It wanders anywhere on the screen, never covers
 * the Yes button, and after a few hops settles so her decision is always
 * possible. Taps are registered with a pointerdown handler on the window, so a
 * moving target can still be caught.
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
  const [spot, setSpot] = useState<Spot | null>(null);
  const spotRef = useRef<Spot | null>(null);
  const lastMove = useRef(0);
  const [caught, setCaught] = useState(false);

  useEffect(() => {
    spotRef.current = spot;
  }, [spot]);

  const place = useCallback(
    (next: Spot) => {
      spotRef.current = next;
      setSpot(next);
    },
    [],
  );

  /** Choose a spot somewhere on the whole screen that is not the Yes button. */
  const findHome = useCallback((): Spot => {
    const button = buttonRef.current;
    const width = button?.offsetWidth ?? 168;
    const height = button?.offsetHeight ?? 46;
    const maxLeft = Math.max(SIDE_RESERVED, window.innerWidth - width - SIDE_RESERVED);
    const maxTop = Math.max(TOP_RESERVED, window.innerHeight - height - BOTTOM_RESERVED);
    const yes = yesRef.current?.getBoundingClientRect();

    for (let attempt = 0; attempt < 24; attempt += 1) {
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

  /** Hop away from wherever it currently is, anywhere on the screen. */
  const hop = useCallback(() => {
    const button = buttonRef.current;
    const width = button?.offsetWidth ?? 168;
    const height = button?.offsetHeight ?? 46;
    const maxLeft = Math.max(SIDE_RESERVED, window.innerWidth - width - SIDE_RESERVED);
    const maxTop = Math.max(TOP_RESERVED, window.innerHeight - height - BOTTOM_RESERVED);
    const yes = yesRef.current?.getBoundingClientRect();
    const current = spotRef.current ?? { left: maxLeft, top: maxTop };

    let best: Spot | null = null;
    for (let attempt = 0; attempt < 26; attempt += 1) {
      const candidate = {
        left: clamp(current.left + (Math.random() * 2 - 1) * (window.innerWidth * 0.55), SIDE_RESERVED, maxLeft),
        top: clamp(current.top + (Math.random() * 2 - 1) * (window.innerHeight * 0.42), TOP_RESERVED, maxTop),
      };
      const travelled = Math.abs(candidate.left - current.left) + Math.abs(candidate.top - current.top);
      if (travelled < 140) continue;

      if (yes) {
        const overlaps =
          candidate.left + width > yes.left - YES_CLEARANCE &&
          candidate.left < yes.right + YES_CLEARANCE &&
          candidate.top + height > yes.top - YES_CLEARANCE &&
          candidate.top < yes.bottom + YES_CLEARANCE;
        if (overlaps) continue;
      }

      best = candidate;
      break;
    }

    const destination = best ?? findHome();
    place(destination);
    lastMove.current = Date.now();
    onWander();
  }, [findHome, onWander, place, yesRef]);

  // Start somewhere unexpected once the screen is settled.
  useEffect(() => {
    if (reduce) return;
    const timer = setTimeout(() => {
      if (!spotRef.current) place(findHome());
    }, 700);
    return () => clearTimeout(timer);
  }, [findHome, place, reduce]);

  // Keep it reachable when the window changes shape.
  useEffect(() => {
    if (reduce) return;
    function onResize() {
      const button = buttonRef.current;
      const width = button?.offsetWidth ?? 168;
      const height = button?.offsetHeight ?? 46;
      const maxLeft = Math.max(SIDE_RESERVED, window.innerWidth - width - SIDE_RESERVED);
      const maxTop = Math.max(TOP_RESERVED, window.innerHeight - height - BOTTOM_RESERVED);
      const current = spotRef.current;
      if (!current) return;
      if (current.left > maxLeft || current.top > maxTop) {
        place({ left: clamp(current.left, SIDE_RESERVED, maxLeft), top: clamp(current.top, TOP_RESERVED, maxTop) });
      }
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [place, reduce]);

  // Catch a touch anywhere on the button, even mid-flight.
  useEffect(() => {
    if (!wandering) return;
    function onPointerDown(event: PointerEvent) {
      const button = buttonRef.current;
      if (!button) return;
      const target = event.target as Node | null;
      if (target && button.contains(target)) {
        event.preventDefault();
        setCaught(true);
        setTimeout(() => setCaught(false), 420);
        onGiveUp();
      }
    }
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [onGiveUp, wandering]);

  // On a mouse, drifting a little when she reaches for it is enough.
  useEffect(() => {
    if (!wandering || reduce) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastMove.current < 2600) return;
      hop();
    }, 3300);
    return () => clearInterval(timer);
  }, [hop, reduce, wandering]);

  // Before it has ever moved, it belongs in the page beside the Yes.
  if (!wandering && !spot) {
    return (
      <button type="button" onClick={onDecline} className="btn btn-ghost-dusk px-6 py-3.5 text-[0.8rem] tracking-[0.1em]">
        {label}
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.button
        ref={buttonRef}
        type="button"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          left: spot?.left ?? -9999,
          top: spot?.top ?? 0,
          rotate: caught ? [0, -6, 5, 0] : 0,
          scale: caught ? [1, 0.94, 1.02, 1] : 1,
        }}
        exit={{ opacity: 0 }}
        transition={{
          left: { type: 'spring', stiffness: 190, damping: 20, mass: 0.7 },
          top: { type: 'spring', stiffness: 190, damping: 20, mass: 0.7 },
          rotate: { duration: 0.4 },
          scale: { duration: 0.4 },
          opacity: { duration: 0.3 },
        }}
        onClick={wandering ? onGiveUp : onDecline}
        className="btn btn-ghost-dusk fixed z-[46] px-6 py-3.5 text-[0.8rem] tracking-[0.1em] backdrop-blur-md"
        style={{ touchAction: 'manipulation' }}
        aria-label={
          wandering
            ? `${label} — this one likes to wander, but you can catch it`
            : `${label} — it has stopped running`
        }
      >
        {label}
      </motion.button>
    </AnimatePresence>
  );
}
