import type { ActivityValue } from './constants';

/** An entry as returned by the admin API (server-authorized only). */
export interface VaultEntry {
  id: string;
  answer: string;
  chosenDate: string;
  chosenTime: string;
  activity: ActivityValue | string;
  note: string | null;
  createdAt: string;
  timezone: string;
  ownerNotes: string | null;
}

/**
 * The *public* payload attached to a visitor's own session.
 * It intentionally contains no note, no ip hash and no owner notes.
 */
export interface PublicSelection {
  date: string;
  time: string;
  activity: string;
  timezone: string;
  createdAt: string;
}

export interface SubmissionSuccess {
  ok: true;
  selection: PublicSelection;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export interface SessionState {
  hasSelection: boolean;
  selection: PublicSelection | null;
}
