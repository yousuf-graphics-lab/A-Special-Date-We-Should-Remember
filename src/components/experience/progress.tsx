'use client';

import { clsx } from 'clsx';
import { STAGES, type StageId } from '@/lib/content';

export function Progress({
  current,
  visited,
  onNavigate,
  tone = 'day',
}: {
  current: StageId;
  visited: StageId[];
  onNavigate: (stage: StageId) => void;
  tone?: 'day' | 'dusk';
}) {
  const dusk = tone === 'dusk';
  const activeIndex = Math.max(0, STAGES.findIndex((stage) => stage.id === current));
  const furthest = visited.reduce(
    (max, id) => Math.max(max, STAGES.findIndex((stage) => stage.id === id)),
    0,
  );

  return (
    <div className="no-print relative z-40 flex flex-col items-center gap-2.5" aria-label="Your journey so far">
      <div className="flex items-center gap-0">
        {STAGES.map((stage, index) => {
          const isCurrent = stage.id === current;
          const isVisited = visited.includes(stage.id);
          const canReturn = isVisited && !isCurrent && index <= furthest;

          const dot = (
            <>
              <span
                className={clsx(
                  'block rounded-full transition-all duration-500',
                  isCurrent ? 'h-[7px] w-[7px]' : 'h-[5px] w-[5px]',
                  isCurrent && (dusk ? 'bg-[#FBEDE9]' : 'bg-wine'),
                  !isCurrent && isVisited && (dusk ? 'bg-[#FBEDE9]/60' : 'bg-rose-deep/60'),
                  !isCurrent && !isVisited && (dusk ? 'bg-white/20' : 'bg-wine/15'),
                )}
              />
              {isCurrent && (
                <span
                  className={clsx(
                    'absolute -inset-[5px] rounded-full border',
                    dusk ? 'border-[#FBEDE9]/45' : 'border-wine/35',
                  )}
                  aria-hidden
                />
              )}
            </>
          );

          return (
            <div key={stage.id} className="flex items-center">
              {canReturn ? (
                <button
                  type="button"
                  onClick={() => onNavigate(stage.id)}
                  className="relative flex h-4 w-4 items-center justify-center"
                  aria-label={`Go back to ${stage.label}`}
                  title={stage.label}
                >
                  {dot}
                </button>
              ) : (
                <span
                  className="relative flex h-4 w-4 items-center justify-center"
                  title={stage.label}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {dot}
                </span>
              )}
              {index < STAGES.length - 1 && (
                <span
                  className={clsx(
                    'h-px w-4 sm:w-6',
                    index < furthest
                      ? dusk
                        ? 'bg-[#FBEDE9]/35'
                        : 'bg-rose-deep/35'
                      : dusk
                        ? 'bg-white/12'
                        : 'bg-wine/10',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p
        className={clsx(
          'text-[0.6rem] uppercase tracking-[0.32em]',
          dusk ? 'text-[#F7DDD8]/55' : 'text-ink-soft/70',
        )}
      >
        {STAGES[activeIndex].label}
      </p>
    </div>
  );
}
