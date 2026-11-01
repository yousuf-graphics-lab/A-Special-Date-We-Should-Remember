/**
 * Shared, framework-agnostic constants. Safe to import from client and server.
 */

export const ACTIVITIES = [
  {
    value: 'Dinner',
    label: 'Dinner',
    blurb: 'Somewhere warm, with candlelight.',
  },
  {
    value: 'Coffee and a long conversation',
    label: 'Coffee & a long conversation',
    blurb: 'No clock, no rush.',
  },
  {
    value: 'Movie night',
    label: 'Movie night',
    blurb: 'Blankets, snacks, your pick.',
  },
  {
    value: 'A long drive',
    label: 'A long drive',
    blurb: 'Windows down, playlist on.',
  },
  {
    value: 'A beach visit or evening walk',
    label: 'Beach walk',
    blurb: 'Salt air and slow steps.',
  },
  {
    value: 'Ice cream together',
    label: 'Ice cream together',
    blurb: 'Simple, sweet, ours.',
  },
  {
    value: 'A surprise date',
    label: 'A surprise date',
    blurb: 'You just show up. I handle the rest.',
  },
] as const;

export type ActivityValue = (typeof ACTIVITIES)[number]['value'];

export const ACTIVITY_VALUES = ACTIVITIES.map((activity) => activity.value) as [
  ActivityValue,
  ...ActivityValue[],
];

/** Human labels for the stored activity values. */
export const ACTIVITY_LABELS: Record<ActivityValue, string> = ACTIVITIES.reduce(
  (accumulator, activity) => {
    accumulator[activity.value] = activity.label;
    return accumulator;
  },
  {} as Record<ActivityValue, string>,
);

export function activityLabel(value: string): string {
  return ACTIVITY_LABELS[value as ActivityValue] ?? value;
}

export const TIME_PRESETS = [
  { value: 'morning', label: 'Morning', time: '09:00', hint: '9:00 AM' },
  { value: 'afternoon', label: 'Afternoon', time: '14:00', hint: '2:00 PM' },
  { value: 'evening', label: 'Evening', time: '19:30', hint: '7:30 PM' },
  { value: 'night', label: 'Night', time: '22:00', hint: '10:00 PM' },
] as const;

export type TimePresetValue = (typeof TIME_PRESETS)[number]['value'];

/** Personal note limits — enforced in the browser *and* on the server. */
export const NOTE_MAX_LENGTH = 500;
export const OWNER_NOTES_MAX_LENGTH = 2000;

export const SESSION_COOKIE = 'samiya_session';
export const ADMIN_COOKIE = 'samiya_admin';

export const COUNTDOWN_TARGET_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const RATE_LIMIT = {
  loginMaxAttempts: 5,
  loginWindowMinutes: 15,
  submitMaxAttempts: 6,
  submitWindowMinutes: 10,
} as const;
