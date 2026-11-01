'use client';

/**
 * A hand-built month calendar (no calendar library).
 *
 * • Only strictly future days are selectable; today and past days are disabled
 *   with distinct visual states and are never merely "faded but clickable".
 * • Keyboard: arrows move day by day, PageUp/PageDown switch months, Home/End
 *   jump to the edges of the month, Enter/Space selects. Tab enters the grid at
 *   the roving day instead of stepping through 31 buttons.
 * • Month lengths and leap years come from the Date API, never from a table.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  daysInMonth,
  parseLocalISODate,
  todayISODate,
  isFutureISODate,
  toLocalISODate,
} from '@/lib/datetime';

const MAX_MONTHS_AHEAD = 24;

interface CalendarProps {
  value: string | null;
  onChange: (isoDate: string) => void;
  /** Id of the element describing this calendar, for screen readers. */
  describedBy?: string;
}

interface MonthCursor {
  year: number;
  monthIndex: number;
}

function monthIndexOf(date: Date): MonthCursor {
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

function compareMonths(a: MonthCursor, b: MonthCursor): number {
  return a.year * 12 + a.monthIndex - (b.year * 12 + b.monthIndex);
}

function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const date = new Date(cursor.year, cursor.monthIndex + delta, 1);
  return monthIndexOf(date);
}

export function Calendar({ value, onChange, describedBy }: CalendarProps): JSX.Element {
  const today = useMemo(() => todayISODate(), []);
  const todayCursor = useMemo(() => monthIndexOf(new Date()), []);

  const [cursor, setCursor] = useState<MonthCursor>(() => {
    if (value) {
      const selected = parseLocalISODate(value);
      if (selected) return monthIndexOf(selected);
    }
    return todayCursor;
  });

  const [roving, setRoving] = useState<string>(() => {
    if (value) return value;
    // First selectable day: tomorrow if we are in the current month.
    const firstOfMonth = new Date(todayCursor.year, todayCursor.monthIndex, 1);
    return toLocalISODate(firstOfMonth) > today
      ? toLocalISODate(firstOfMonth)
      : toLocalISODate(new Date(todayCursor.year, todayCursor.monthIndex, new Date().getDate() + 1));
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const shouldRefocus = useRef(false);

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.monthIndex),
    [cursor.year, cursor.monthIndex],
  );

  const monthName = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
        new Date(cursor.year, cursor.monthIndex, 1),
      ),
    [cursor.year, cursor.monthIndex],
  );

  const canGoBack = compareMonths(cursor, todayCursor) > 0;
  const canGoForward =
    compareMonths(cursor, todayCursor) < MAX_MONTHS_AHEAD &&
    compareMonths(cursor, shiftMonth(todayCursor, MAX_MONTHS_AHEAD)) < 0;

  // Restore focus after a keyboard-driven month change.
  useEffect(() => {
    if (!shouldRefocus.current) return;
    shouldRefocus.current = false;
    const target = dayRefs.current.get(roving);
    target?.focus();
  }, [roving, cursor]);

  const goToMonth = useCallback((next: MonthCursor) => {
    const min = todayCursor;
    const max = shiftMonth(todayCursor, MAX_MONTHS_AHEAD);
    if (compareMonths(next, min) < 0 || compareMonths(next, max) > 0) return;
    setCursor(next);
  }, [todayCursor]);

  const handleSelect = useCallback(
    (iso: string) => {
      setRoving(iso);
      onChange(iso);
    },
    [onChange],
  );

  const moveRoving = useCallback(
    (deltaDays: number) => {
      const current = parseLocalISODate(roving) ?? new Date();
      let candidate = new Date(current);
      for (let step = 0; step < 60; step += 1) {
        candidate = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + deltaDays);
        const iso = toLocalISODate(candidate);
        if (isFutureISODate(iso)) {
          shouldRefocus.current = true;
          setRoving(iso);
          const nextCursor = monthIndexOf(candidate);
          if (compareMonths(nextCursor, cursor) !== 0) setCursor(nextCursor);
          return;
        }
        if (step > 0 && deltaDays > 0) break;
      }
    },
    [roving, cursor],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          moveRoving(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          moveRoving(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveRoving(7);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveRoving(-7);
          break;
        case 'Home': {
          event.preventDefault();
          const first = toLocalISODate(new Date(cursor.year, cursor.monthIndex, 1));
          if (isFutureISODate(first)) {
            shouldRefocus.current = true;
            setRoving(first);
          } else {
            moveRoving(1);
          }
          break;
        }
        case 'End': {
          event.preventDefault();
          const last = toLocalISODate(
            new Date(cursor.year, cursor.monthIndex, daysInMonth(cursor.year, cursor.monthIndex)),
          );
          shouldRefocus.current = true;
          setRoving(last);
          break;
        }
        case 'PageUp': {
          event.preventDefault();
          goToMonth(shiftMonth(cursor, -1));
          break;
        }
        case 'PageDown': {
          event.preventDefault();
          goToMonth(shiftMonth(cursor, 1));
          break;
        }
        default:
          break;
      }
    },
    [cursor, goToMonth, moveRoving],
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goToMonth(shiftMonth(cursor, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-rose/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <p aria-live="polite" className="font-display text-lg text-white/90">
          {monthName}
        </p>

        <button
          type="button"
          onClick={() => goToMonth(shiftMonth(cursor, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-rose/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label="Choose a date"
        aria-describedby={describedBy}
        onKeyDown={handleKeyDown}
        className="select-none"
      >
        <div role="row" className="mb-1 grid grid-cols-7">
          {WEEKDAY_LABELS.map((weekday) => (
            <div
              key={weekday}
              role="columnheader"
              aria-label={weekday}
              className="py-1 text-center text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/35"
            >
              <span aria-hidden="true">{weekday.slice(0, 1)}</span>
              <span className="sr-only">{weekday}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => {
            if (!cell.date || !cell.day) {
              return <div key={`empty-${index}`} aria-hidden="true" className="aspect-square" />;
            }

            const iso = cell.date;
            const isToday = iso === today;
            const selectable = isFutureISODate(iso);
            const isSelected = value === iso;
            const isRoving = roving === iso;

            return (
              <div
                key={iso}
                role="gridcell"
                aria-selected={isSelected}
                className="aspect-square"
              >
                <button
                  ref={(node) => {
                    if (node) dayRefs.current.set(iso, node);
                    else dayRefs.current.delete(iso);
                  }}
                  type="button"
                  aria-label={new Intl.DateTimeFormat('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(parseLocalISODate(iso) ?? new Date())}
                  aria-current={isToday ? 'date' : undefined}
                  aria-disabled={!selectable}
                  disabled={!selectable}
                  tabIndex={isRoving ? 0 : -1}
                  onClick={() => handleSelect(iso)}
                  onFocus={() => setRoving(iso)}
                  className={[
                    'relative flex h-full w-full items-center justify-center rounded-xl text-sm transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-midnight',
                    isSelected
                      ? 'bg-gradient-to-br from-rose to-violet font-semibold text-white shadow-[0_0_22px_rgba(255,77,141,0.55)] ring-1 ring-rose/70'
                      : selectable
                        ? 'text-white/80 hover:bg-white/10 hover:text-white'
                        : 'cursor-not-allowed text-white/18 line-through decoration-white/15',
                    isToday && !isSelected ? 'ring-1 ring-gold/45 text-gold/80' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {cell.day}
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/90"
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.66rem] text-white/40">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-rose to-violet" />
          Selected
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full ring-1 ring-gold/60" />
          Today
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-white/15" />
          Unavailable
        </li>
      </ul>
    </div>
  );
}
