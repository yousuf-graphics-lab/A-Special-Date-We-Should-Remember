'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const PETALS = 16;

function seeded(index: number) {
  const value = Math.sin(index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * A soft curtain of petals that drifts across the screen whenever one chapter
 * becomes the next. Decorative only: it never blocks a click and it disappears
 * on its own after a moment.
 */
export function StageVeil({ trigger, tone = 'day' }: { trigger: number; tone?: 'day' | 'dusk' }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, [trigger, reduce]);

  const petals = useMemo(
    () =>
      Array.from({ length: PETALS }, (_, index) => {
        const width = 10 + seeded(index + 1) * 16;
        return {
          id: index,
          left: seeded(index + 2) * 100,
          width,
          height: width * (0.62 + seeded(index + 3) * 0.18),
          x: `${(seeded(index + 4) - 0.5) * 26}vw`,
          spin: `${120 + seeded(index + 5) * 260}deg`,
          duration: `${0.85 + seeded(index + 6) * 0.5}s`,
          delay: `${seeded(index + 7) * 0.32}s`,
          opacity: 0.35 + seeded(index + 8) * 0.5,
        };
      }),
    [],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="no-print pointer-events-none fixed inset-0 z-[45] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          aria-hidden
        >
          <div className="veil-glow" />
          {petals.map((petal) => (
            <span
              key={petal.id}
              className="veil-petal"
              style={
                {
                  left: `${petal.left}%`,
                  width: petal.width,
                  height: petal.height,
                  opacity: tone === 'dusk' ? petal.opacity * 0.75 : petal.opacity,
                  '--veil-x': petal.x,
                  '--veil-spin': petal.spin,
                  '--veil-duration': petal.duration,
                  animationDelay: petal.delay,
                  background:
                    tone === 'dusk'
                      ? 'linear-gradient(140deg, rgba(255, 236, 228, 0.9), rgba(196, 128, 142, 0.75))'
                      : undefined,
                } as React.CSSProperties
              }
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
