'use client';

/**
 * A whisper of a cursor trail: tiny hearts that fade upward.
 * Desktop + fine pointer only, skipped for reduced motion, and capped at a
 * handful of nodes so it can never cost meaningful performance.
 */
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TrailHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  drift: number;
}

const MAX_HEARTS = 10;

export function HeartTrail(): JSX.Element | null {
  const reducedMotion = useReducedMotion();
  const [hearts, setHearts] = useState<TrailHeart[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    setEnabled(window.matchMedia('(pointer: fine)').matches);
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return;

    let last = 0;
    let counter = 0;

    const handleMove = (event: PointerEvent): void => {
      const now = performance.now();
      if (now - last < 110) return;
      last = now;
      counter += 1;
      const id = counter;

      setHearts((previous) => [
        ...previous.slice(-(MAX_HEARTS - 1)),
        {
          id,
          x: event.clientX,
          y: event.clientY,
          size: 8 + Math.random() * 8,
          drift: (Math.random() - 0.5) * 26,
        },
      ]);

      window.setTimeout(() => {
        setHearts((previous) => previous.filter((heart) => heart.id !== id));
      }, 1200);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [enabled]);

  if (!enabled || hearts.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="absolute text-rose/70"
          style={{
            left: heart.x - heart.size / 2,
            top: heart.y - heart.size / 2,
            fontSize: heart.size,
            lineHeight: 1,
            animation: 'heartTrailFade 1.15s ease-out forwards',
            // Small horizontal drift is expressed with a CSS variable.
            ['--drift' as string]: `${heart.drift}px`,
          }}
        >
          ♥
        </span>
      ))}
      <style jsx global>{`
        @keyframes heartTrailFade {
          0% {
            opacity: 0.75;
            transform: translate3d(0, 0, 0) scale(0.7) rotate(-8deg);
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--drift), -34px, 0) scale(1.15) rotate(10deg);
          }
        }
      `}</style>
    </div>
  );
}
