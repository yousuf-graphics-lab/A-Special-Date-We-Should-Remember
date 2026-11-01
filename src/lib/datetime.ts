/**
 * Framework-agnostic date & time helpers.
 *
 * Every calendar decision is made in the *visitor's* local timezone so that a
 * phone in Chittagong and a laptop in London both see "today" correctly. Wall
 * clock conversions against an arbitrary IANA zone are done with the Intl API
 * only — no date library needed, which keeps the bundle small.
 */

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** `YYYY-MM-DD` for the *local* calendar day of the given instant. */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` into a Date pinned to local midnight (never UTC midnight). */
export function parseLocalISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** Days in a month, leap years included. `monthIndex` is zero-based. */
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Local "today" as `YYYY-MM-DD`. */
export function todayISODate(now: Date = new Date()): string {
  return toLocalISODate(now);
}

/** Strictly after today (past dates *and* today are disabled). */
export function isFutureISODate(value: string, now: Date = new Date()): boolean {
  const parsed = parseLocalISODate(value);
  if (!parsed) return false;
  return value > todayISODate(now);
}

/** Valid `HH:mm` (24h) string check. */
export function isValidTime(value: string): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  return true;
}

/**
 * Builds the month grid used by the custom calendar (Monday-first, 6 rows max).
 * Cells outside the month are `null` so the UI can render empty slots.
 */
export function buildMonthGrid(
  year: number,
  monthIndex: number,
): { date: string | null; day: number | null }[] {
  const firstDay = new Date(year, monthIndex, 1);
  // getDay(): 0 = Sunday … 6 = Saturday → shift so Monday = 0
  const leading = (firstDay.getDay() + 6) % 7;
  const total = daysInMonth(year, monthIndex);
  const cells: { date: string | null; day: number | null }[] = [];

  for (let i = 0; i < leading; i += 1) cells.push({ date: null, day: null });
  for (let day = 1; day <= total; day += 1) {
    const iso = `${year}-${`${monthIndex + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    cells.push({ date: iso, day });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex] ?? ''} ${year}`;
}

/** `Friday, 14 February 2027` — interpreted as a local calendar day. */
export function formatLongDate(dateISO: string): string {
  const date = parseLocalISODate(dateISO);
  if (!date) return dateISO;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** `Fri, 14 Feb` — compact calendar/UI form. */
export function formatShortDate(dateISO: string): string {
  const date = parseLocalISODate(dateISO);
  if (!date) return dateISO;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/** `19:30` → `7:30 PM` */
export function formatTime12h(time: string): string {
  if (!isValidTime(time)) return time;
  const [hourRaw, minuteRaw] = time.split(':');
  const hour24 = Number(hourRaw);
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minuteRaw} ${suffix}`;
}

/** Milliseconds that `timeZone` is offset from UTC at the given instant. */
export function timeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(utcMs));
  const pick = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  const asUtc = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour') % 24,
    pick('minute'),
    pick('second'),
  );
  return asUtc - utcMs;
}

/** `true` when the IANA zone name is understood by this runtime. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a wall-clock date/time **in `timeZone`** into an absolute instant.
 * Handles DST edges by refining the offset once.
 */
export function zonedWallClockToUtc(dateISO: string, time: string, timeZone: string): Date {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const [yearRaw, monthRaw, dayRaw] = dateISO.split('-');
  const [hourRaw, minuteRaw] = time.split(':');
  const asIfUtc = Date.UTC(
    Number(yearRaw),
    Number(monthRaw) - 1,
    Number(dayRaw),
    Number(hourRaw),
    Number(minuteRaw),
  );

  const offsetA = timeZoneOffsetMs(asIfUtc, zone);
  let instant = asIfUtc - offsetA;
  const offsetB = timeZoneOffsetMs(instant, zone);
  if (offsetB !== offsetA) instant = asIfUtc - offsetB;
  return new Date(instant);
}

/** Absolute instant of the chosen date + time, in the visitor's zone. */
export function resolveDateInstant(dateISO: string, time: string, timeZone: string): Date {
  return zonedWallClockToUtc(dateISO, time, timeZone);
}

export interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

/** Breaks the gap between now and `target` into safe, non-negative parts. */
export function getRemainingTime(target: Date, now: Date = new Date()): RemainingTime {
  const totalMs = target.getTime() - now.getTime();
  if (!Number.isFinite(totalMs) || totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: Math.max(totalMs || 0, 0), isPast: true };
  }
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
    isPast: false,
  };
}

/** Two-digit left-padded string for the countdown blocks. */
export function pad2(value: number): string {
  return `${Math.max(0, value)}`.padStart(2, '0');
}

/** `Asia/Dhaka` → `Dhaka, Bangladesh` style label, with a safe fallback. */
export function timeZoneLabel(timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longGeneric',
    });
    return formatter
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** Best-effort IANA zone for the current browser, with a UTC fallback. */
export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
