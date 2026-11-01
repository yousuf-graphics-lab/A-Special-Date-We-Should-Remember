/**
 * /api/admin/entries — authenticated vault operations.
 *
 * Every handler verifies the admin JWT *before* touching the database. The
 * response shapes below are the only place the note / owner notes ever leave
 * the server, and they are unreachable without a valid cookie (401 otherwise).
 */
import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/server/auth';
import { jsonError, jsonOk, readJsonBody, hasOnlyKeys, UNAUTHORIZED } from '@/lib/server/http';
import { deleteVaultEntry, listVaultEntries, updateOwnerNotes } from '@/lib/server/vault';
import { ownerNotesSchema, fieldErrorsFrom } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  if (!(await isAdminRequest())) return UNAUTHORIZED();

  try {
    const entries = await listVaultEntries(50);
    return jsonOk({ ok: true, entries });
  } catch (error) {
    console.error('[admin] read failed:', (error as Error).message);
    return jsonError('Could not load the vault right now.', 500, { code: 'storage_error' });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  if (!(await isAdminRequest())) return UNAUTHORIZED();

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  if (!hasOnlyKeys(body.data, ['entryId', 'ownerNotes'])) {
    return jsonError('Unexpected fields in request.', 400);
  }

  const parsed = ownerNotesSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonError('Please check that plan text.', 422, {
      fieldErrors: fieldErrorsFrom(parsed.error),
    });
  }

  try {
    const entry = await updateOwnerNotes(parsed.data.entryId, parsed.data.ownerNotes);
    if (!entry) return jsonError('That entry no longer exists.', 404);
    return jsonOk({ ok: true, entry });
  } catch (error) {
    console.error('[admin] update failed:', (error as Error).message);
    return jsonError('Could not save your plan right now.', 500, { code: 'storage_error' });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  if (!(await isAdminRequest())) return UNAUTHORIZED();

  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return jsonError('Provide a valid entry id.', 400);
  }

  try {
    const removed = await deleteVaultEntry(id);
    if (!removed) return jsonError('That entry no longer exists.', 404);
    return jsonOk({ ok: true, id });
  } catch (error) {
    console.error('[admin] delete failed:', (error as Error).message);
    return jsonError('Could not delete that entry right now.', 500, { code: 'storage_error' });
  }
}
