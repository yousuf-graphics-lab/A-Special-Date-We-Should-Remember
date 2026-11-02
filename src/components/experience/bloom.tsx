'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';

/* -------------------------------------------------------------------------- */
/* A single hand-drawn blossom                                                */
/* -------------------------------------------------------------------------- */

const PALETTES = {
  rose: { petal: 'url(#petalA)', edge: 'rgba(150,74,92,0.4)', centre: '#C68C97' },
  blush: { petal: 'url(#petalB)', edge: 'rgba(178,108,124,0.35)', centre: '#D9A6B1' },
  ivory: { petal: 'url(#petalC)', edge: 'rgba(196,168,132,0.4)', centre: '#E3C79A' },
} as const;

export type BloomTone = keyof typeof PALETTES;

export function FlowerMark({ tone = 'rose', className }: { tone?: BloomTone; className?: string }) {
  const palette = PALETTES[tone];
  const petals = [0, 72, 144, 216, 288];

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="27"
          rx="14.5"
          ry="21"
          transform={`rotate(${angle} 50 50)`}
          fill={palette.petal}
          stroke={palette.edge}
          strokeWidth="0.7"
        />
      ))}
      {petals.map((angle) => (
        <ellipse
          key={`inner-${angle}`}
          cx="50"
          cy="38"
          rx="8.4"
          ry="12"
          transform={`rotate(${angle + 36} 50 50)`}
          fill="rgba(255,255,255,0.24)"
        />
      ))}
      <circle cx="50" cy="50" r="9.5" fill={palette.centre} />
      <circle cx="50" cy="50" r="4.6" fill="rgba(255,248,238,0.65)" />
    </svg>
  );
}

/** Shared gradients, mounted once so every blossom can reference them. */
function BloomDefs() {
  return (
    <svg aria-hidden focusable="false" width="0" height="0" className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <radialGradient id="petalA" cx="42%" cy="30%" r="76%">
          <stop offset="0%" stopColor="#FBE2E6" />
          <stop offset="52%" stopColor="#EDBCC6" />
          <stop offset="100%" stopColor="#D69AA8" />
        </radialGradient>
        <radialGradient id="petalB" cx="42%" cy="30%" r="76%">
          <stop offset="0%" stopColor="#FFF6F2" />
          <stop offset="55%" stopColor="#F8DEE3" />
          <stop offset="100%" stopColor="#E8BCC6" />
        </radialGradient>
        <radialGradient id="petalC" cx="42%" cy="30%" r="76%">
          <stop offset="0%" stopColor="#FFFCF6" />
          <stop offset="58%" stopColor="#FAF0DF" />
          <stop offset="100%" stopColor="#EBD8B9" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Blooms wherever she touches                                                */
/* -------------------------------------------------------------------------- */

type Bloom = {
  id: number;
  x: number;
  y: number;
  tone: BloomTone;
  size: number;
  rotation: number;
  scale: number;
  petals: { dx: number; dy: number; spin: number; size: number; delay: number }[];
};

const TONES: BloomTone[] = ['rose', 'blush', 'ivory'];
const LIFETIME = 1500;
const MIN_GAP = 80;
const MAX_ON_SCREEN = 12;

function makeBloom(id: number, x: number, y: number, index: number): Bloom {
  const random = () => Math.random();
  return {
    id,
    x,
    y,
    tone: TONES[(id + index) % TONES.length],
    size: 26 + random() * 18,
    rotation: random() * 120 - 60,
    scale: 0.85 + random() * 0.35,
    petals: Array.from({ length: 4 }, (_, petalIndex) => {
      const angle = random() * Math.PI * 2;
      const distance = 26 + random() * 34;
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 12,
        spin: random() * 260 - 130,
        size: 7 + random() * 7,
        delay: petalIndex * 40,
      };
    }),
  };
}

/**
 * A soft floral ripple wherever the screen is touched or clicked. Purely
 * decorative: it never intercepts a tap, respects reduced-motion, and is capped
 * so it stays gentle rather than busy.
 */
export function TouchBloom() {
  const reduce = useReducedMotion();
  const [blooms, setBlooms] = useState<Bloom[]>([]);
  const lastAt = useRef(0);
  const nextId = useRef(1);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (reduce) return;

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const now = performance.now();
      if (now - lastAt.current < MIN_GAP) return;
      lastAt.current = now;

      const count = 1 + Math.floor(Math.random() * 2);
      const batch = Array.from({ length: count }, (_, index) =>
        makeBloom(
          nextId.current++,
          event.clientX + (index ? (Math.random() - 0.5) * 46 : 0),
          event.clientY + (index ? (Math.random() - 0.5) * 46 : 0),
          index,
        ),
      );

      setBlooms((current) => [...current, ...batch].slice(-MAX_ON_SCREEN));

      const timer = setTimeout(() => {
        const ids = new Set(batch.map((bloom) => bloom.id));
        setBlooms((current) => current.filter((bloom) => !ids.has(bloom.id)));
      }, LIFETIME);
      timeouts.current.push(timer);
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <>
      <BloomDefs />
      <div className="pointer-events-none fixed inset-0 z-[38] overflow-hidden" aria-hidden>
        {blooms.map((bloom) => (
          <span
            key={bloom.id}
            className="bloom-ripple absolute"
            style={
              {
                left: bloom.x,
                top: bloom.y,
                '--bloom-size': `${bloom.size}px`,
                '--bloom-scale': bloom.scale,
                '--bloom-rotation': `${bloom.rotation}deg`,
              } as React.CSSProperties
            }
          >
            <span className="bloom-halo" />
            <FlowerMark tone={bloom.tone} className="bloom-flower" />
            {bloom.petals.map((petal, index) => (
              <span
                key={index}
                className="bloom-petal"
                style={
                  {
                    '--petal-dx': `${petal.dx}px`,
                    '--petal-dy': `${petal.dy}px`,
                    '--petal-spin': `${petal.spin}deg`,
                    '--petal-size': `${petal.size}px`,
                    animationDelay: `${petal.delay}ms`,
                    background:
                      bloom.tone === 'ivory'
                        ? 'linear-gradient(140deg, #FFFAF0, #EBD8B9)'
                        : 'linear-gradient(140deg, #FBE4E8, #DCA3B1)',
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* A floral burst, for the moments that deserve one                           */
/* -------------------------------------------------------------------------- */

export function BloomBurst({
  count = 9,
  className,
  tone = 'mixed',
}: {
  count?: number;
  className?: string;
  tone?: 'mixed' | 'dusk';
}) {
  const reduce = useReducedMotion();
  const id = useId();
  const flowers = useMemo(
    () =>
      Array.from({ length: reduce ? 4 : count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + (index % 3) * 0.24;
        const distance = 90 + (index % 5) * 34;
        return {
          key: `${id}-${index}`,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.72,
          size: 34 + (index % 4) * 18,
          delay: (index % 5) * 0.08,
          rotation: (index * 47) % 180 - 90,
          flowerTone: TONES[index % TONES.length],
        };
      }),
    [count, id, reduce],
  );

  return (
    <div className={clsx('pointer-events-none absolute', className ?? 'inset-0')} aria-hidden>
      <BloomDefs />
      <span className="burst-halo" />
      {flowers.map((flower) => (
        <span
          key={flower.key}
          className="burst-flower"
          style={
            {
              '--bx': `${flower.x}px`,
              '--by': `${flower.y}px`,
              '--b-size': `${flower.size}px`,
              '--b-rot': `${flower.rotation}deg`,
              animationDelay: `${flower.delay}s`,
              opacity: tone === 'dusk' ? 0.9 : 1,
            } as React.CSSProperties
          }
        >
          <FlowerMark tone={flower.flowerTone} className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}
