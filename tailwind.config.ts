import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FCF8F3',
        cream: '#F7EDE3',
        parchment: '#F1E2D3',
        blush: {
          DEFAULT: '#F6DDE1',
          deep: '#EFC7CE',
          soft: '#FBEEF0',
        },
        rose: {
          DEFAULT: '#D293A0',
          deep: '#B66279',
          muted: '#C98F9C',
        },
        wine: {
          DEFAULT: '#6E2A3A',
          deep: '#4E1B28',
          soft: '#8C4453',
        },
        plum: '#3A1B27',
        dusk: '#24131B',
        ink: {
          DEFAULT: '#3A2A2D',
          soft: '#6F585E',
          faint: '#957F85',
        },
        gold: {
          DEFAULT: '#C7A97B',
          soft: '#E3D2B4',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Helvetica', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
        hand: ['var(--font-hand)', 'cursive'],
      },
      boxShadow: {
        soft: '0 18px 50px -24px rgba(110, 42, 58, 0.28), 0 6px 18px -12px rgba(58, 42, 45, 0.18)',
        paper:
          '0 1px 0 rgba(255,255,255,0.65) inset, 0 24px 60px -32px rgba(94, 46, 55, 0.35), 0 40px 80px -60px rgba(58, 27, 39, 0.4)',
        glow: '0 0 0 1px rgba(255,255,255,0.35) inset, 0 12px 34px -12px rgba(182, 98, 121, 0.55)',
        lift: '0 20px 45px -20px rgba(78, 27, 40, 0.45)',
      },
      backgroundImage: {
        'rose-gradient': 'linear-gradient(135deg, #E7A9B4 0%, #C97F90 45%, #A9536A 100%)',
        'gold-line': 'linear-gradient(90deg, transparent, rgba(199,169,123,0.75), transparent)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-12px,0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.045)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.03)' },
          '56%': { transform: 'scale(1)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-1.2deg)' },
          '50%': { transform: 'rotate(1.2deg)' },
        },
        drift: {
          '0%': { transform: 'translate3d(0,-8%,0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.9' },
          '100%': { transform: 'translate3d(6%,110vh,0) rotate(220deg)', opacity: '0' },
        },
      },
      animation: {
        floaty: 'floaty 7s ease-in-out infinite',
        breathe: 'breathe 6s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        heartbeat: 'heartbeat 2.6s ease-in-out infinite',
        sway: 'sway 9s ease-in-out infinite',
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
