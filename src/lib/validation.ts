/**
 * Zod schemas shared by client forms and server endpoints. The server always
 * re-validates — client validation is only there for a pleasant UX.
 */
import { z } from 'zod';
import { ACTIVITY_VALUES, NOTE_MAX_LENGTH, OWNER_NOTES_MAX_LENGTH } from './constants';
import { isValidTime, isValidTimeZone, isFutureISODate } from './datetime';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date')
  .refine((value) => isFutureISODate(value), 'Please choose a day in the future');

const timeString = z.string().refine(isValidTime, 'Pick a valid time');

const timeZoneString = z
  .string()
  .min(1)
  .max(64)
  .refine(isValidTimeZone, 'Unknown timezone')
  .default('UTC');

export const submissionSchema = z
  .object({
    date: dateString,
    time: timeString,
    activity: z.enum(ACTIVITY_VALUES),
    note: z
      .string()
      .max(NOTE_MAX_LENGTH, `Keep it under ${NOTE_MAX_LENGTH} characters`)
      .optional()
      .transform((value) => {
        const trimmed = value?.trim();
        return trimmed && trimmed.length > 0 ? trimmed : null;
      }),
    timezone: timeZoneString,
  })
  .strict();

export type SubmissionInput = z.infer<typeof submissionSchema>;

export const loginSchema = z
  .object({
    password: z.string().min(1, 'Enter your password').max(200),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const ownerNotesSchema = z
  .object({
    entryId: z.string().uuid('Unknown entry'),
    ownerNotes: z.string().max(OWNER_NOTES_MAX_LENGTH, 'That is a little too long'),
  })
  .strict();

export type OwnerNotesInput = z.infer<typeof ownerNotesSchema>;

/** Flattens a ZodError into `{ field: message }` for inline form errors. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
