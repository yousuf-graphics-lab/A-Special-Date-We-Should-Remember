import { clsx } from 'clsx';

/** A delicate divider: thin lines and a small diamond. */
export function Ornament({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dusk' }) {
  const line = tone === 'dusk' ? 'rgba(251,233,230,0.28)' : 'rgba(199,169,123,0.5)';
  const diamond = tone === 'dusk' ? 'rgba(251,233,230,0.6)' : 'rgba(182,98,121,0.65)';
  return (
    <div className={clsx('flex items-center justify-center gap-3', className)} aria-hidden>
      <span className="h-px w-12 sm:w-20" style={{ background: `linear-gradient(90deg, transparent, ${line})` }} />
      <span
        className="h-[5px] w-[5px] rotate-45"
        style={{ background: diamond, boxShadow: `0 0 0 3px ${tone === 'dusk' ? 'rgba(251,233,230,0.08)' : 'rgba(199,169,123,0.12)'}` }}
      />
      <span className="h-px w-12 sm:w-20" style={{ background: `linear-gradient(90deg, ${line}, transparent)` }} />
    </div>
  );
}

/** Small leaf flourish used beside headings. */
export function Flourish({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dusk' }) {
  const stroke = tone === 'dusk' ? 'rgba(251,233,230,0.45)' : 'rgba(182,98,121,0.5)';
  return (
    <svg viewBox="0 0 120 20" className={clsx('h-4 w-24', className)} fill="none" aria-hidden>
      <path d="M2 10h44" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      <path d="M74 10h44" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      <path d="M60 4.5 65.5 10 60 15.5 54.5 10Z" stroke={stroke} strokeWidth="1" />
      <circle cx="46" cy="10" r="1.4" fill={stroke} />
      <circle cx="74" cy="10" r="1.4" fill={stroke} />
    </svg>
  );
}

/** A quiet gold rule, used inside letters. */
export function GoldRule({ className }: { className?: string }) {
  return <div className={clsx('hairline', className)} aria-hidden />;
}

export function Quote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={clsx('script text-[1.5rem] leading-relaxed text-wine/80 sm:text-[1.75rem]', className)}>
      {children}
    </p>
  );
}
