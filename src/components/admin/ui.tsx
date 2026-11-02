import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E7DCD2] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-[#9A7C74]">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 font-display text-[1.9rem] leading-tight text-[#3B2730] sm:text-[2.2rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[0.86rem] leading-relaxed text-[#7A6565]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx('rounded-[14px] border border-[#E7DCD2] bg-white/80 p-5 shadow-[0_18px_50px_-42px_rgba(58,39,48,0.55)] sm:p-6', className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-[1.24rem] leading-tight text-[#3B2730]">{title}</h2>}
            {description && <p className="mt-1 text-[0.8rem] leading-relaxed text-[#7A6565]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[13px] border p-4 transition',
        accent
          ? 'border-[#D9B9B0] bg-gradient-to-br from-[#FBF1EC] to-[#F6E4DE]'
          : 'border-[#E9DED4] bg-white/75',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[#9A7C74]">{label}</p>
        {icon && <span className="text-[#B08A7C]">{icon}</span>}
      </div>
      <div className="mt-2 font-display text-[1.28rem] leading-snug text-[#3B2730]">{value}</div>
      {hint && <p className="mt-1 text-[0.74rem] leading-relaxed text-[#8B7570]">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dashed border-[#DCCEC4] bg-[#FBF7F2] px-6 py-10 text-center">
      <p className="font-display text-[1.12rem] text-[#5A444A]">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-[0.82rem] leading-relaxed text-[#8B7570]">{children}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'rose' | 'green' | 'amber' | 'red';
}) {
  const tones: Record<string, string> = {
    neutral: 'border-[#E0D5CB] bg-[#F7F2EC] text-[#75605F]',
    rose: 'border-[#DFC2C3] bg-[#FBEFEF] text-[#8C4655]',
    green: 'border-[#C9D8C1] bg-[#F1F6EE] text-[#4F6547]',
    amber: 'border-[#E4D6B8] bg-[#FBF5E7] text-[#7E6733]',
    red: 'border-[#E6C4C1] bg-[#FBEEEC] text-[#8E3F3F]',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em]',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function DetailRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-[#EFE6DD] py-3 last:border-0">
      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-[#9A7C74]">{label}</dt>
      <dd
        className={clsx(
          'mt-1 text-[0.92rem] leading-relaxed text-[#3B2730]',
          mono && 'font-mono text-[0.82rem]',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

export function Divider() {
  return <div className="my-6 h-px bg-[#EDE3DA]" aria-hidden />;
}
