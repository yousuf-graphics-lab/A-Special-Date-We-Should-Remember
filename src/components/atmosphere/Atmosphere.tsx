'use client';

/**
 * The room around the letter: a slow aurora, blurred orbs, drifting hearts and
 * a handful of sparkles. Everything is decorative, `aria-hidden`, and layered
 * behind the content.
 *
 * Performance notes
 *  • Only blur-heavy layers are animated, via CSS transforms (GPU friendly).
 *  • Cursor parallax runs only for fine pointers (desktop) and is skipped when
 *    reduced motion is requested.
 *  • Mobile keeps a reduced set of hearts and sparkles.
 */
import { useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Heart } from 'lucide-react';

interface DriftingHeart {
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  desktopOnly?: boolean;
}

const HEARTS: readonly DriftingHeart[] = [
  { left: '8%', size: 14, duration: 26, delay: 0, opacity: 0.28 },
  { left: '22%', size: 20, duration: 34, delay: 6, opacity: 0.2, desktopOnly: true },
  { left: '38%', size: 11, duration: 22, delay: 12, opacity: 0.3 },
  { left: '54%', size: 24, duration: 38, delay: 3, opacity: 0.16, desktopOnly: true },
  { left: '68%', size: 13, duration: 28, delay: 16, opacity: 0.26 },
  { left: '82%', size: 18, duration: 31, delay: 9, opacity: 0.22, desktopOnly: true },
  { left: '92%', size: 10, duration: 24, delay: 20, opacity: 0.3 },
];

const SPARKLES = [
  { top: '18%', left: '12%', delay: 0, size: 2 },
  { top: '30%', left: '78%', delay: 1.4, size: 3 },
  { top: '62%', left: '8%', delay: 2.6, size: 2 },
  { top: '72%', left: '86%', delay: 0.8, size: 2 },
  { top: '46%', left: '50%', delay: 3.4, size: 2 },
  { top: '12%', left: '58%', delay: 2.1, size: 3 },
  { top: '84%', left: '34%', delay: 4.2, size: 2 },
  { top: '38%', left: '28%', delay: 1.1, size: 2 },
  { top: '56%', left: '66%', delay: 2.9, size: 3 },
  { top: '88%', left: '70%', delay: 3.7, size: 2 },
] as const;

export function Atmosphere(): JSX.Element {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const parallaxX = useSpring(rawX, { stiffness: 42, damping: 22, mass: 0.6 });
  const parallaxY = useSpring(rawY, { stiffness: 42, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const handleMove = (event: PointerEvent): void => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      rawX.set(x * 18);
      rawY.set(y * 14);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [rawX, rawY, reducedMotion]);

  const hearts = useMemo(
    () =>
      HEARTS.map((heart, index) => (
        <span
          key={`heart-${index}`}
          className={
            heart.desktopOnly
              ? 'absolute bottom-0 hidden animate-heart md:block'
              : 'absolute bottom-0 animate-heart'
          }
          style={{
            left: heart.left,
            animationDuration: `${heart.duration}s`,
            animationDelay: `-${heart.delay}s`,
            opacity: heart.opacity,
            animationPlayState: reducedMotion ? 'paused' : 'running',
          }}
        >
          <Heart size={heart.size} className="fill-rose/40 text-rose/50" strokeWidth={1} />
        </span>
      )),
    [reducedMotion],
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-midnight"
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#1B0F2E_0%,#0B0713_55%,#070410_100%)]" />

      {/* Aurora sheets (the only layers that follow the cursor) */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute -inset-[22%] will-change-transform"
      >
        <div className="absolute left-[8%] top-[6%] h-[52vmax] w-[52vmax] animate-aurora rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(168,85,247,0.34),rgba(124,58,237,0)_62%)] blur-3xl" />
        <div className="absolute right-[2%] top-[24%] h-[44vmax] w-[44vmax] animate-aurora-slow rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(255,77,141,0.26),rgba(255,77,141,0)_64%)] blur-3xl" />
        <div className="absolute bottom-[-12%] left-[26%] h-[40vmax] w-[46vmax] animate-aurora rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,217,160,0.14),rgba(255,217,160,0)_66%)] blur-3xl" />
      </motion.div>

      {/* Soft floating orbs */}
      <div className="absolute left-[12%] top-[30%] h-40 w-40 animate-orb rounded-full bg-violet/20 blur-2xl" />
      <div className="absolute right-[16%] top-[58%] h-52 w-52 animate-orb-slow rounded-full bg-rose/15 blur-3xl" />
      <div className="absolute left-[42%] top-[74%] hidden h-36 w-36 animate-orb rounded-full bg-gold/10 blur-3xl sm:block" />

      {/* Sparkles */}
      {SPARKLES.map((sparkle, index) => (
        <span
          key={`sparkle-${index}`}
          className="absolute animate-soft-pulse rounded-full bg-gold/70"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${5 + (index % 4)}s`,
            boxShadow: '0 0 8px rgba(255,217,160,0.8)',
            animationPlayState: reducedMotion ? 'paused' : 'running',
          }}
        />
      ))}

      {/* Drifting hearts */}
      {hearts}

      {/* Vignette keeps text contrast high at the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_40%,transparent_38%,rgba(7,4,16,0.72)_100%)]" />
    </div>
  );
}
