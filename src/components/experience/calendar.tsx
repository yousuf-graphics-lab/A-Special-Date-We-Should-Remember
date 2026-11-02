'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { formatCalendarDate, toIsoDate, todayInDhaka } from '@/lib/time';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function Calendar({
  value,
  onChange,
  minDate = todayInDhaka(),
}: {
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: string;
}) {
  const today = useMemo(() => parseISO(minDate), [minDate]);
  const selected = useMemo(() => (value ? parseISO(value) : null), [value]);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(selected ?? today));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    const list: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      list.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return list;
  }, [viewMonth]);

  const canGoPrev = !isBefore(endOfMonth(subMonths(viewMonth, 1)), startOfMonth(today));

  function moveFocus(from: Date, deltaDays: number) {
    const next = addDays(from, deltaDays);
    if (isBefore(next, today)) return;
    if (!isSameMonth(next, viewMonth)) {
      setViewMonth(startOfMonth(next));
    }
    const iso = toIsoDate(next);
    window.setTimeout(() => {
      const target = document.querySelector<HTMLButtonElement>(`[data-cal-date="${iso}"]`);
      target?.focus();
    }, 40);
  }

  return (
    <div className="soft-card rounded-[14px] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          disabled={!canGoPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-wine/15 text-wine transition hover:border-wine/35 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.6} />
        </button>

        <p className="font-display text-[1.16rem] tracking-wide text-wine-deep sm:text-[1.3rem]" aria-live="polite">
          {format(viewMonth, 'MMMM yyyy')}
        </p>

        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-wine/15 text-wine transition hover:border-wine/35 hover:bg-white/70"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="pb-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft/50"
            aria-hidden
          >
            {day}
          </span>
        ))}

        {days.map((day) => {
          const iso = toIsoDate(day);
          const disabled = isBefore(day, today);
          const inMonth = isSameMonth(day, viewMonth);
          const isSelected = Boolean(selected && isSameDay(day, selected));
          const isToday = isSameDay(day, today);

          return (
            <button
              key={iso}
              type="button"
              data-cal-date={iso}
              disabled={disabled}
              onClick={() => onChange(iso)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  moveFocus(day, 1);
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  moveFocus(day, -1);
                } else if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  moveFocus(day, 7);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  moveFocus(day, -7);
                }
              }}
              className={clsx('cal-day', !inMonth && 'opacity-40')}
              data-selected={isSelected}
              data-today={isToday}
              aria-pressed={isSelected}
              aria-label={`${format(day, 'EEEE d MMMM yyyy')}${disabled ? ' (already passed)' : ''}`}
              aria-current={isToday ? 'date' : undefined}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold/25 pt-4">
        <button
          type="button"
          onClick={() => {
            setViewMonth(startOfMonth(today));
            onChange(toIsoDate(today));
          }}
          className="text-[0.66rem] uppercase tracking-[0.22em] text-wine/70 transition hover:text-wine"
        >
          Choose today
        </button>
        <p className="font-display text-[0.92rem] italic text-ink-soft">
          {value ? formatCalendarDate(value) : 'Pick a day that feels right.'}
        </p>
      </div>
    </div>
  );
}
