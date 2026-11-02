import { clsx } from 'clsx';

type Tone = 'day' | 'dusk' | 'garden';

const HEARTS = [
  { left: '8%', top: '18%', size: 14, delay: 0, duration: 11, opacity: 0.35 },
  { left: '22%', top: '62%', size: 10, delay: 2.4, duration: 13, opacity: 0.28 },
  { left: '78%', top: '24%', size: 12, delay: 1.2, duration: 12, opacity: 0.32 },
  { left: '88%', top: '58%', size: 9, delay: 3.6, duration: 14, opacity: 0.24 },
  { left: '58%', top: '12%', size: 8, delay: 4.8, duration: 16, opacity: 0.22 },
  { left: '38%', top: '82%', size: 11, delay: 5.6, duration: 15, opacity: 0.2 },
];

const LIGHTS = [
  { left: '12%', top: '26%', size: 220, color: 'rgba(246,221,225,0.7)' },
  { left: '76%', top: '12%', size: 300, color: 'rgba(247,237,227,0.8)' },
  { left: '62%', top: '70%', size: 260, color: 'rgba(233,213,226,0.55)' },
  { left: '28%', top: '64%', size: 180, color: 'rgba(255,244,234,0.8)' },
];

const DUSK_LIGHTS = [
  { left: '16%', top: '18%', size: 260, color: 'rgba(143,74,92,0.35)' },
  { left: '78%', top: '26%', size: 320, color: 'rgba(199,169,123,0.18)' },
  { left: '52%', top: '64%', size: 300, color: 'rgba(110,42,58,0.3)' },
  { left: '86%', top: '78%', size: 200, color: 'rgba(199,169,123,0.12)' },
];

const STARS = [
  [6, 12, 1.6, 0.5], [14, 26, 1, 0.35], [21, 8, 1.3, 0.55], [29, 19, 0.9, 0.3],
  [36, 5, 1.7, 0.6], [44, 23, 1.1, 0.4], [52, 9, 1.4, 0.5], [59, 28, 0.8, 0.3],
  [66, 14, 1.6, 0.55], [73, 6, 1, 0.35], [81, 21, 1.3, 0.45], [88, 11, 1.8, 0.5],
  [93, 30, 1, 0.3], [12, 38, 0.9, 0.25], [47, 36, 1.2, 0.3], [69, 42, 0.8, 0.22],
];

const PETALS = [
  { left: '14%', delay: 0, duration: 17, size: 16, drift: 22 },
  { left: '32%', delay: 5, duration: 21, size: 12, drift: -16 },
  { left: '54%', delay: 9, duration: 19, size: 14, drift: 18 },
  { left: '71%', delay: 2, duration: 23, size: 10, drift: -22 },
  { left: '86%', delay: 12, duration: 18, size: 15, drift: 14 },
];

export function Ambience({
  tone = 'day',
  hearts = true,
  petals = false,
  className,
}: {
  tone?: Tone;
  hearts?: boolean;
  petals?: boolean;
  className?: string;
}) {
  const dusk = tone === 'dusk';
  const lights = dusk ? DUSK_LIGHTS : LIGHTS;

  return (
    <div className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {lights.map((light, index) => (
        <div
          key={index}
          className="absolute rounded-full blur-3xl animate-breathe"
          style={{
            left: light.left,
            top: light.top,
            width: light.size,
            height: light.size,
            background: `radial-gradient(circle, ${light.color} 0%, rgba(255,255,255,0) 68%)`,
            animationDelay: `${index * 1.7}s`,
            opacity: dusk ? 0.8 : 0.65,
          }}
        />
      ))}

      {dusk && (
        <div className="absolute inset-0">
          {STARS.map(([x, y, size, opacity], index) => (
            <span
              key={index}
              className="absolute rounded-full bg-[#fdf0e6] animate-breathe"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                opacity,
                animationDelay: `${(index % 7) * 0.9}s`,
                animationDuration: `${5 + (index % 5)}s`,
                boxShadow: '0 0 6px rgba(253,240,230,0.6)',
              }}
            />
          ))}
        </div>
      )}

      {petals && (
        <div className="absolute inset-0">
          {PETALS.map((petal, index) => (
            <span
              key={index}
              className="absolute top-[-6%] block animate-[drift_linear_infinite]"
              style={{
                left: petal.left,
                width: petal.size,
                height: petal.size * 0.72,
                background: dusk
                  ? 'linear-gradient(135deg, rgba(182,98,121,0.5), rgba(110,42,58,0.35))'
                  : 'linear-gradient(135deg, rgba(239,199,206,0.9), rgba(210,147,160,0.7))',
                borderRadius: '60% 40% 55% 45% / 55% 55% 45% 45%',
                animationDuration: `${petal.duration}s`,
                animationDelay: `${petal.delay}s`,
                filter: 'blur(0.2px)',
              }}
            />
          ))}
        </div>
      )}

      {hearts && (
        <div className="absolute inset-0">
          {HEARTS.map((heart, index) => (
            <svg
              key={index}
              viewBox="0 0 24 24"
              className="absolute animate-floaty"
              style={{
                left: heart.left,
                top: heart.top,
                width: heart.size,
                height: heart.size,
                opacity: dusk ? heart.opacity * 0.9 : heart.opacity,
                animationDelay: `${heart.delay}s`,
                animationDuration: `${heart.duration}s`,
                color: dusk ? 'rgba(251,233,230,0.55)' : 'rgba(182,98,121,0.55)',
              }}
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 20.4s-7.2-4.6-7.2-9.5A4.1 4.1 0 0 1 12 8.3a4.1 4.1 0 0 1 7.2 2.6c0 4.9-7.2 9.5-7.2 9.5Z" />
            </svg>
          ))}
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          background: dusk
            ? 'radial-gradient(120% 90% at 50% 50%, transparent 40%, rgba(20,10,15,0.55) 100%)'
            : 'radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(252,248,243,0.55) 100%)',
        }}
      />
    </div>
  );
}
