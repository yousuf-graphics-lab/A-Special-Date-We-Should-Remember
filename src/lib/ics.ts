/**
 * Minimal, dependency-free ICS (iCalendar) builder.
 * Times are emitted in UTC so every calendar app agrees on the instant,
 * while the description carries the visitor's local time in words.
 */
import { formatLongDate, formatTime12h, resolveDateInstant, timeZoneLabel } from './datetime';

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds long lines for RFC 5545 (75 octets per line).
 * We fold on characters rather than bytes — that can only make a line *shorter*
 * than the limit for ASCII, and it can never split a multi-byte character.
 */
function foldLine(line: string): string {
  if (line.length <= 70) return line;
  const chunks: string[] = [line.slice(0, 70)];
  let rest = line.slice(70);
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, 69)}`);
    rest = rest.slice(69);
  }
  return chunks.join('\r\n');
}

function toUtcStamp(date: Date): string {
  const pad = (value: number): string => `${value}`.padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export interface DateEventInput {
  uid: string;
  dateISO: string;
  time: string;
  timezone: string;
  activity: string;
}

/** Deterministic, RFC-compliant calendar file for the chosen date. */
export function buildIcsFile({ uid, dateISO, time, timezone, activity }: DateEventInput): string {
  const start = resolveDateInstant(dateISO, time, timezone);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const localSummary = `${formatLongDate(dateISO)} · ${formatTime12h(time)}`;
  const zoneLabel = timeZoneLabel(timezone);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//For Samiya//Date//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Our date',
    `X-WR-TIMEZONE:${timezone}`,
    'BEGIN:VEVENT',
    `UID:${uid}@for-samiya`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(`Date night — ${activity}`)}`,
    `DESCRIPTION:${escapeText(
      `Reserved for Samiya.\n\nWhen: ${localSummary} (${zoneLabel})\nWhat: ${activity}\n\nI'll be there. Will you?`,
    )}`,
    'LOCATION:Somewhere lovely',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT3H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Our date is in three hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/** Triggers a download in the browser without touching the server. */
export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
