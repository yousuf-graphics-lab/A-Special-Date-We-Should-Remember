'use client';

import { motion, useReducedMotion } from 'framer-motion';

const HEART_PATH =
  'M100 186C100 186 30 138 30 80C30 52 51 31 76 31C89 31 97.5 38 100 50C102.5 38 111 31 124 31C149 31 170 52 170 80C170 138 100 186 100 186Z';

export function HeartLockArt({ unlocked = false, className }: { unlocked?: boolean; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className={className}>
      <svg viewBox="0 0 200 210" className="h-full w-full heart-lock-glow" role="img" aria-label="A heart shaped lock">
        <defs>
          <radialGradient id="lockBody" cx="38%" cy="26%" r="82%">
            <stop offset="0%" stopColor="#EBB1BC" />
            <stop offset="42%" stopColor="#CE8495" />
            <stop offset="78%" stopColor="#A9536A" />
            <stop offset="100%" stopColor="#7D3043" />
          </radialGradient>
          <linearGradient id="lockGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0DDBB" />
            <stop offset="38%" stopColor="#D6B98C" />
            <stop offset="70%" stopColor="#B08F5F" />
            <stop offset="100%" stopColor="#E4CCA6" />
          </linearGradient>
          <radialGradient id="lockHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,248,240,0.95)" />
            <stop offset="55%" stopColor="rgba(246,221,225,0.55)" />
            <stop offset="100%" stopColor="rgba(246,221,225,0)" />
          </radialGradient>
          <filter id="lockSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#6E2A3A" floodOpacity="0.28" />
          </filter>
          <filter id="shackleGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F7E7CE" floodOpacity="0.55" />
          </filter>
        </defs>

        <circle cx="100" cy="106" r="92" fill="url(#lockHalo)" />
        <circle
          cx="100"
          cy="106"
          r="78"
          fill="none"
          stroke="rgba(199,169,123,0.42)"
          strokeWidth="0.8"
          strokeDasharray="1.5 5"
        />

        <motion.g
          initial={false}
          animate={
            unlocked && !reduce
              ? { y: -26, rotate: -7, opacity: 0.92 }
              : unlocked
                ? { y: -24, opacity: 0.92 }
                : { y: 0, rotate: 0, opacity: 1 }
          }
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          style={{ originX: '50%', originY: '70%' }}
          filter="url(#shackleGlow)"
        >
          <path
            d="M74 72V50C74 29.5 85.5 16 100 16C114.5 16 126 29.5 126 50V72"
            fill="none"
            stroke="url(#lockGold)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M74 72V50C74 29.5 85.5 16 100 16C114.5 16 126 29.5 126 50V72"
            fill="none"
            stroke="rgba(255,248,236,0.5)"
            strokeWidth="2.6"
            strokeLinecap="round"
            transform="translate(-2.6,-2.6)"
          />
        </motion.g>

        <g filter="url(#lockSoft)">
          <path d={HEART_PATH} fill="url(#lockBody)" />
          <path d={HEART_PATH} fill="none" stroke="url(#lockGold)" strokeWidth="3" strokeOpacity="0.95" />
          <path
            d={HEART_PATH}
            fill="none"
            stroke="rgba(255,241,235,0.22)"
            strokeWidth="1"
            transform="translate(100 107) scale(0.9) translate(-100 -107)"
          />
          <path
            d="M100 172C100 172 42 128 42 82C42 60 59 44 78 44C89 44 96.5 49.5 100 58C103.5 49.5 111 44 122 44C141 44 158 60 158 82C158 128 100 172 100 172Z"
            fill="rgba(255,246,240,0.07)"
          />
          <ellipse cx="64" cy="60" rx="20" ry="9" fill="rgba(255,255,255,0.16)" transform="rotate(-30 64 60)" />
        </g>

        {/* engraved keyhole — fades away as the lock opens */}
        <motion.g
          animate={unlocked ? { opacity: 0, scale: 0.7 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{ originX: '50%', originY: '50%', opacity: unlocked ? 0 : 1 }}
        >
          <circle cx="100" cy="96" r="17" fill="rgba(60,18,29,0.16)" />
          <circle cx="100" cy="96" r="11" fill="none" stroke="url(#lockGold)" strokeWidth="1.6" opacity="0.85" />
          <circle cx="100" cy="96" r="6.4" fill="#3E0F1B" />
          <path d="M100 101 96.4 118h7.2L100 101Z" fill="#3E0F1B" />
          <circle cx="100" cy="94.6" r="2.4" fill="rgba(255,240,234,0.35)" />
        </motion.g>

        {/* a small gold heart appears inside when it opens */}
        <motion.g
          initial={false}
          animate={unlocked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          style={{ originX: '50%', originY: '50%', opacity: unlocked ? 1 : 0 }}
        >
          <circle cx="100" cy="104" r="24" fill="rgba(255,242,234,0.12)" />
          <path
            d="M100 121c-7.6-5.2-13-9.4-13-15.4a6.6 6.6 0 0 1 13-3.2 6.6 6.6 0 0 1 13 3.2c0 6-5.4 10.2-13 15.4Z"
            fill="url(#lockGold)"
          />
        </motion.g>

        <g opacity="0.55" aria-hidden>
          <path d="M100 60v-5" stroke="rgba(255,244,236,0.45)" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M40 96h-6" stroke="rgba(255,244,236,0.3)" strokeWidth="1" strokeLinecap="round" />
          <path d="M160 96h6" stroke="rgba(255,244,236,0.3)" strokeWidth="1" strokeLinecap="round" />
          <path d="M100 150v-4" stroke="rgba(255,244,236,0.22)" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export function WaxSeal({ size = 74, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Heart shaped wax seal"
    >
      <defs>
        <radialGradient id="waxBody" cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#C7637A" />
          <stop offset="45%" stopColor="#A23F54" />
          <stop offset="80%" stopColor="#7C2133" />
          <stop offset="100%" stopColor="#5C1423" />
        </radialGradient>
        <radialGradient id="waxInner" cx="40%" cy="32%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id="waxShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#4E1B28" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter="url(#waxShadow)">
        <path
          d="M50 5c9 0 12 7 20 9s16-2 20 8-4 15-1 23 10 13 3 21-15 4-21 10-8 17-19 16-11-11-20-12-16 6-22-2 1-16-2-23S2 44 7 36s15-2 20-9 4-15 13-17 8-4 10-5Z"
          fill="url(#waxBody)"
        />
        <path
          d="M50 5c9 0 12 7 20 9s16-2 20 8-4 15-1 23 10 13 3 21-15 4-21 10-8 17-19 16-11-11-20-12-16 6-22-2 1-16-2-23S2 44 7 36s15-2 20-9 4-15 13-17 8-4 10-5Z"
          fill="url(#waxInner)"
        />
        <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(255,231,222,0.24)" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="24.5" fill="none" stroke="rgba(60,10,20,0.25)" strokeWidth="1" />
        <path
          d="M50 67c-9.2-6.3-16-11.4-16-18.7A8.2 8.2 0 0 1 50 43a8.2 8.2 0 0 1 16 5.3C66 55.6 59.2 60.7 50 67Z"
          fill="rgba(255,236,228,0.16)"
          stroke="rgba(255,226,216,0.5)"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}
