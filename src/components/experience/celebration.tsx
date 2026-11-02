'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { BloomBurst, FlowerMark } from './bloom';

function seeded(index: number, salt = 1) {
  const value = Math.sin(index * 12.9898 * salt) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * The moment she says yes: light swelling from the middle of the screen, petals
 * drifting down, and blossoms opening all around her words.
 */
export function Celebration({ show }: { show: boolean }) {
  const reduce = useReducedMotion();

  const petals = useMemo(
    () =>
      Array.from({ length: reduce ? 8 : 30 }, (_, index) => ({
        id: index,
        left: seeded(index + 1, 1.7) * 100,
        delay: seeded(index + 1, 2.9) * 0.9,
        duration: 2.4 + seeded(index + 1, 3.7) * 1.8,
        width: 9 + seeded(index + 1, 5.1) * 14,
        drift: (seeded(index + 1, 6.3) - 0.5) * 180,
        spin: seeded(index + 1, 7.7) * 320,
        warm: index % 4 === 0,
      })),
    [reduce],
  );

  const blossoms = useMemo(
    () =>
      Array.from({ length: reduce ? 3 : 6 }, (_, index) => ({
        id: index,
        left: 12 + seeded(index + 20, 1.3) * 76,
        top: 16 + seeded(index + 20, 2.1) * 60,
        size: 46 + seeded(index + 20, 3.3) * 62,
        delay: 0.15 + index * 0.12,
        tone: (['rose', 'blush', 'ivory'] as const)[index % 3],
        rotate: seeded(index + 20, 4.9) * 80 - 40,
      })),
    [reduce],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(58% 46% at 50% 46%, rgba(255,214,206,0.22), rgba(36,19,27,0) 74%)',
            }}
          />

          {/* light swelling outward from the centre */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, rgba(255,240,230,0.85), rgba(255,214,206,0.28) 55%, rgba(255,214,206,0) 78%)',
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.15, 1.5], opacity: [0, 0.95, 0] }}
            transition={{ duration: 2.2, times: [0, 0.45, 1], ease: 'easeOut' }}
          />

          {/* a ring of quiet gold that follows the light */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[26vmin] w-[26vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#F2D7BE]/50"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.7], opacity: [0, 0.7, 0] }}
            transition={{ duration: 2.1, ease: 'easeOut' }}
          />

          <BloomBurst count={10} className="left-1/2 top-1/2 h-0 w-0" tone="dusk" />

          {blossoms.map((blossom) => (
            <motion.span
              key={blossom.id}
              className="absolute"
              style={{
                left: `${blossom.left}%`,
                top: `${blossom.top}%`,
                width: blossom.size,
                height: blossom.size,
                rotate: blossom.rotate,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.06, 0.98], opacity: [0, 0.92, 0] }}
              transition={{ duration: 2.3, delay: blossom.delay, times: [0, 0.45, 1], ease: 'easeOut' }}
            >
              <FlowerMark tone={blossom.tone} className="h-full w-full" />
            </motion.span>
          ))}

          {petals.map((petal) => (
            <motion.span
              key={petal.id}
              initial={{ opacity: 0, y: '-12vh', x: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: '112vh', x: petal.drift, rotate: petal.spin }}
              transition={{ duration: petal.duration, delay: petal.delay, ease: 'easeIn' }}
              className="absolute top-0"
              style={{ left: `${petal.left}%` }}
            >
              <span
                className="block"
                style={{
                  width: petal.width,
                  height: petal.width * 0.68,
                  background: petal.warm
                    ? 'linear-gradient(140deg, rgba(255,246,236,0.95), rgba(233,205,178,0.85))'
                    : 'linear-gradient(140deg, rgba(247,214,208,0.95), rgba(214,138,152,0.8))',
                  borderRadius: '60% 40% 55% 45% / 55% 55% 45% 45%',
                  boxShadow: '0 2px 8px rgba(120,60,78,0.18)',
                }}
              />
            </motion.span>
          ))}

          <motion.div
            className="absolute inset-x-0 top-[40%] flex flex-col items-center px-6 text-center"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: [0, 1, 1], scale: 1, y: 0 }}
            transition={{ duration: 1.6, times: [0, 0.35, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="script text-[2.7rem] leading-none text-[#FFF1EA] drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:text-[3.6rem]">
              She said yes.
            </p>
            <p className="hand mt-3 flex items-center gap-2 text-[1.05rem] text-[#F6D9D1]/85 sm:text-[1.2rem]">
              <Heart className="h-3.5 w-3.5" strokeWidth={1.4} fill="currentColor" />
              and my whole heart is smiling
              <Heart className="h-3.5 w-3.5" strokeWidth={1.4} fill="currentColor" />
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
