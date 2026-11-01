/**
 * POST /api/admin/logout — clears the admin cookie.
 * Safe to call when already signed out.
 */
import { NextResponse } from 'next/server';
import { jsonOk } from '@/lib/server/http';
import { adminCookieOptions } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  const response = jsonOk({ ok: true });
  response.cookies.set({ ...adminCookieOptions(0), value: '' });
  return response;
}
