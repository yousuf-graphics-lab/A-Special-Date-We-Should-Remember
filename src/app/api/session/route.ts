/**
 * GET /api/session
 *
 * Returns the countdown data for *this browser session only*. The selection is
 * read from a signed, HTTP-only cookie whose signature is bound to the opaque
 * session id — knowing the public URL reveals nothing. No note is ever returned.
 */
import { NextResponse } from 'next/server';
import { jsonOk } from '@/lib/server/http';
import { getCurrentSelection } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const selection = await getCurrentSelection();
  return jsonOk({ ok: true, hasSelection: selection !== null, selection });
}
