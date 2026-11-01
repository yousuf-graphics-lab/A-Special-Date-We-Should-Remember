import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0B0713',
          deep: '#070410',
          soft: '#140C24',
        },
        rose: {
          DEFAULT: '#FF4D8D',
          soft: '#FF7DA9',
          deep: '#E02F70',
        },
        violet: {
          DEFAULT: '#A855F7',
          deep: '#7C3AED',
          soft: '#C99BFF',
        },
        gold: {
          DEFAULT: '#FFD9A0',
          deep: '#E8B778',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(255, 77, 141, 0.32)',
        'glow-soft': '0 0 60px rgba(168, 85, 247, 0.22)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 24px 60px -24px rgba(0,0,0,0.85)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'aurora-shift': {
          '0%, 100%': { transform: 'translate3d(-6%, -4%, 0) scale(1.05) rotate(0deg)' },
          '50%': { transform: 'translate3d(6%, 5%, 0) scale(1.18) rotate(8deg)' },
        },
        'orb-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.5' },
          '50%': { transform: 'translate3d(0, -28px, 0) scale(1.08)', opacity: '0.75' },
        },
        'heart-drift': {
          '0%': { transform: 'translate3d(0, 12vh, 0) scale(0.6)', opacity: '0' },
          '12%': { opacity: '0.5' },
          '85%': { opacity: '0.32' },
          '100%': { transform: 'translate3d(0, -105vh, 0) scale(1)', opacity: '0' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        aurora: 'aurora-shift 28s ease-in-out infinite',
        'aurora-slow': 'aurora-shift 44s ease-in-out infinite',
        orb: 'orb-float 18s ease-in-out infinite',
        'orb-slow': 'orb-float 26s ease-in-out infinite',
        heart: 'heart-drift 22s linear infinite',
        'soft-pulse': 'soft-pulse 6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
