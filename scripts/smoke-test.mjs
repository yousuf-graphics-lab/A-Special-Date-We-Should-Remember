#!/usr/bin/env node
/**
 * End-to-end smoke test against a running instance.
 *
 *   npm run start            # or npm run dev, in another terminal
 *   npm run smoke-test       # reads .env.local for the slug + password
 *
 * Verifies, with real HTTP calls: the public page, submission validation,
 * the session/countdown restore, RLS-protected admin endpoints (401 without a
 * cookie), login + HttpOnly/SameSite cookies, reading the entry, saving the
 * private plan, deleting the test entry, robots.txt and the OG image.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'SamiyaLocalDev!2026';

function readEnvLocal() {
  const env = {};
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      env[match[1]] = match[2].replace(/\\\$/g, '$').replace(/^['"]|['"]$/g, '');
    }
  } catch {
    console.error('Could not read .env.local');
  }
  return env;
}

const env = readEnvLocal();
const slug = env.ADMIN_SLUG;
const vaultPath = `/vault-${slug}`;

let passed = 0;
let failed = 0;
const cookies = new Map();

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function rememberCookies(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  for (const cookie of raw) {
    const [pair] = cookie.split(';');
    const index = pair.indexOf('=');
    if (index > 0) cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
}

function cookieHeader() {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function call(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    redirect: 'manual',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Cookie: cookieHeader(),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { response, text, json };
}

function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const pad = (value) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function main() {
  console.log(`\nSmoke test → ${BASE}\n`);

  console.log('Public experience');
  const page = await call('/');
  check('GET / returns 200', page.response.status === 200);
  check('page title is "For Samiya"', page.text.includes('For Samiya'));
  check('invitation copy is server-rendered', page.text.includes('Hey Samiya'));
  check('no note field leaks into the HTML', !page.text.includes('owner_notes'));

  const session = await call('/api/session');
  check('GET /api/session works for a new visitor', session.json?.ok === true);
  check('new visitor has no selection', session.json?.hasSelection === false);

  console.log('\nSubmission validation');
  const past = await call('/api/submit', {
    method: 'POST',
    body: JSON.stringify({ date: '2020-01-01', time: '19:30', activity: 'Dinner', timezone: 'Asia/Dhaka' }),
  });
  check('past date rejected (422)', past.response.status === 422, `got ${past.response.status}`);

  const badActivity = await call('/api/submit', {
    method: 'POST',
    body: JSON.stringify({ date: futureDate(20), time: '19:30', activity: 'Skydiving', timezone: 'Asia/Dhaka' }),
  });
  check('unknown activity rejected (422)', badActivity.response.status === 422, `got ${badActivity.response.status}`);

  const extraField = await call('/api/submit', {
    method: 'POST',
    body: JSON.stringify({
      date: futureDate(20),
      time: '19:30',
      activity: 'Dinner',
      timezone: 'Asia/Dhaka',
      owner_notes: 'hack',
    }),
  });
  check('unexpected field rejected (400)', extraField.response.status === 400, `got ${extraField.response.status}`);

  console.log('\nSuccessful submission');
  const note = `smoke-test ${randomUUID().slice(0, 8)}`;
  const submitted = await call('/api/submit', {
    method: 'POST',
    body: JSON.stringify({
      date: futureDate(21),
      time: '19:45',
      activity: 'A long drive',
      note,
      timezone: 'Asia/Dhaka',
    }),
  });
  rememberCookies(submitted.response);
  check('valid submission accepted', submitted.response.status === 200, `got ${submitted.response.status}`);
  check('response carries the selection', submitted.json?.selection?.time === '19:45');
  check('response never echoes the note', !submitted.text.includes(note));
  check('session cookie is HttpOnly', (submitted.response.headers.getSetCookie?.() ?? []).some((c) => /HttpOnly/i.test(c)));

  const restored = await call('/api/session');
  check('selection restored from the session cookie', restored.json?.hasSelection === true);
  check('restored payload has no note', !restored.text.includes(note));
  check('restored date matches', restored.json?.selection?.date === futureDate(21));

  console.log('\nAdmin authorization (no cookie)');
  const anonEntries = await call('/api/admin/entries');
  check('GET /api/admin/entries → 401', anonEntries.response.status === 401, `got ${anonEntries.response.status}`);

  const anonPatch = await call('/api/admin/entries', {
    method: 'PATCH',
    body: JSON.stringify({ entryId: '00000000-0000-0000-0000-000000000000', ownerNotes: 'x' }),
  });
  check('PATCH /api/admin/entries → 401', anonPatch.response.status === 401, `got ${anonPatch.response.status}`);

  const anonDelete = await call('/api/admin/entries?id=00000000-0000-0000-0000-000000000000', {
    method: 'DELETE',
  });
  check('DELETE /api/admin/entries → 401', anonDelete.response.status === 401, `got ${anonDelete.response.status}`);

  const vaultAnon = await call(vaultPath);
  check('vault page redirects anonymous visitors', [302, 307].includes(vaultAnon.response.status), `got ${vaultAnon.response.status}`);
  check('vault redirect lands on the login screen', (vaultAnon.response.headers.get('location') ?? '').includes('/login'));

  const wrongSlug = await call('/vault-not-the-real-slug');
  check('a guessed vault slug is not served', wrongSlug.response.status === 404, `got ${wrongSlug.response.status}`);

  console.log('\nAdmin login');
  const wrong = await call('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'definitely-not-it' }),
  });
  check('wrong password → 401', wrong.response.status === 401, `got ${wrong.response.status}`);
  check('error message is generic', wrong.json?.error === 'Incorrect password.');

  const unknownField = await call('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: PASSWORD, role: 'admin' }),
  });
  check('unexpected login field rejected (400)', unknownField.response.status === 400, `got ${unknownField.response.status}`);

  const login = await call('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: PASSWORD }),
  });
  rememberCookies(login.response);
  check('correct password → 200', login.response.status === 200, `got ${login.response.status}`);
  const setCookies = login.response.headers.getSetCookie?.() ?? [];
  check('admin cookie is HttpOnly', setCookies.some((c) => /HttpOnly/i.test(c)));
  check('admin cookie is SameSite=Strict', setCookies.some((c) => /SameSite=Strict/i.test(c)));
  check('admin cookie lives ≤ 7 days', setCookies.some((c) => /Max-Age=604800/.test(c)));

  const vaultAuthed = await call(vaultPath);
  check('vault page renders when authenticated', vaultAuthed.response.status === 200, `got ${vaultAuthed.response.status}`);
  check('dashboard shows the submitted note (admin only)', vaultAuthed.text.includes(note));

  const entries = await call('/api/admin/entries');
  check('admin can read entries', entries.response.status === 200 && Array.isArray(entries.json?.entries));
  const entry = entries.json?.entries?.[0];
  check('the new entry is the most recent', Boolean(entry));
  check('entry exposes her note to the admin', entry?.note === note);
  check('entry records the timezone', entry?.timezone === 'Asia/Dhaka');
  check('ip_hash is never returned by the API', !entries.text.includes('ip_hash'));

  console.log('\nPrivate plan');
  const plan = `ring ordered — ${randomUUID().slice(0, 6)}`;
  const patch = await call('/api/admin/entries', {
    method: 'PATCH',
    body: JSON.stringify({ entryId: entry?.id, ownerNotes: plan }),
  });
  check('PATCH saves the owner plan', patch.response.status === 200 && patch.json?.entry?.ownerNotes === plan);

  const overlong = await call('/api/admin/entries', {
    method: 'PATCH',
    body: JSON.stringify({ entryId: entry?.id, ownerNotes: 'x'.repeat(2001) }),
  });
  check('over-long plan rejected (422)', overlong.response.status === 422, `got ${overlong.response.status}`);

  console.log('\nCleanup');
  const del = await call(`/api/admin/entries?id=${entry?.id}`, { method: 'DELETE' });
  check('DELETE removes the test entry', del.response.status === 200, `got ${del.response.status}`);

  const after = await call('/api/admin/entries');
  check('the test entry is gone', !(after.json?.entries ?? []).some((row) => row.id === entry?.id));

  const logout = await call('/api/admin/logout', { method: 'POST' });
  rememberCookies(logout.response);
  const afterLogout = await call('/api/admin/entries');
  check('logout clears access (401)', afterLogout.response.status === 401, `got ${afterLogout.response.status}`);

  console.log('\nTampering & rate limiting');
  const forgedAdmin = await fetch(`${BASE}/api/admin/entries`, {
    headers: { Cookie: `samiya_admin=${Buffer.from('{"role":"admin","sub":"owner"}').toString('base64url')}.forged.sig` },
  });
  check('a forged admin cookie → 401', forgedAdmin.status === 401, `got ${forgedAdmin.status}`);

  const forgedSelection = await fetch(`${BASE}/api/session`, {
    headers: { Cookie: 'samiya_session=11111111-1111-1111-1111-111111111111; samiya_selection=forged' },
  });
  const forgedBody = await forgedSelection.json();
  check('a forged selection cookie reveals nothing', forgedBody.hasSelection === false);

  // Six wrong passwords: the sixth must be throttled (5 per 15 minutes).
  let throttled = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: `wrong-${attempt}` }),
    });
    if (response.status === 429) throttled = true;
  }
  check('login is rate limited after five failures', throttled);

  console.log('\nMetadata');
  const robots = await call('/robots.txt');
  check('robots.txt disallows the vault path', robots.text.includes(vaultPath));
  check('robots.txt disallows /api/', robots.text.includes('/api/'));

  const og = await fetch(`${BASE}/opengraph-image`);
  check('OG image is served as PNG', og.status === 200 && og.headers.get('content-type')?.includes('image/png'));

  console.log(`\n${failed === 0 ? 'All checks passed' : 'Failures detected'} — ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error.message);
  process.exit(1);
});
