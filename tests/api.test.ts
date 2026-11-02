/**
 * Server-side guarantees: authentication, authorisation and validation.
 * Requires the app to be serving on TEST_APP_ORIGIN (default localhost:3000).
 */
import { describe, expect, it } from 'vitest';

const ORIGIN = process.env.TEST_APP_ORIGIN ?? 'http://localhost:3000';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Samee_mine';

/** Each test gets its own client IP so rate-limit buckets never interfere. */
function ip(): Record<string, string> {
  const octet = () => 1 + Math.floor(Math.random() * 240);
  return { 'X-Forwarded-For': `10.${octet()}.${octet()}.${octet()}` };
}

function cookieFrom(response: Response): string {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw.map((value) => value.split(';')[0]).join('; ');
}

describe('private admin access', () => {
  it('never exposes the dashboard without a session', async () => {
    const response = await fetch(`${ORIGIN}/admin`, { redirect: 'manual' });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/admin/login');

    const media = await fetch(`${ORIGIN}/api/admin/media/00000000-0000-4000-8000-000000000000`);
    expect(media.status).toBe(401);

    const deletion = await fetch(`${ORIGIN}/api/admin/response`, { method: 'DELETE' });
    expect(deletion.status).toBe(401);
  });

  it('throttles repeated login attempts', async () => {
    const headers = { 'Content-Type': 'application/json', ...ip() };
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch(`${ORIGIN}/api/admin/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: 'yousuf', password: `wrong-${attempt}` }),
      });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 6)).toEqual([401, 401, 401, 401, 401, 401]);
    expect(statuses.at(-1)).toBe(429);
  });

  it('rejects a forged session cookie', async () => {
    const response = await fetch(`${ORIGIN}/admin`, {
      redirect: 'manual',
      headers: { cookie: 'fs_admin_session=eyJ1IjoieW91c3VmIn0.forged' },
    });
    expect(response.status).toBe(307);
  });

  it('rejects a wrong password and accepts the right one', async () => {
    const bad = await fetch(`${ORIGIN}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip() },
      body: JSON.stringify({ username: 'yousuf', password: 'definitely-wrong' }),
    });
    expect(bad.status).toBe(401);

    const good = await fetch(`${ORIGIN}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip() },
      body: JSON.stringify({ username: 'yousuf', password: PASSWORD }),
    });
    expect(good.status).toBe(200);
    const cookie = cookieFrom(good);
    expect(cookie).toContain('fs_admin_session=');

    const dashboard = await fetch(`${ORIGIN}/admin`, { headers: { cookie } });
    expect(dashboard.status).toBe(200);

    const settings = await fetch(`${ORIGIN}/admin/settings`, { headers: { cookie } });
    expect(settings.status).toBe(200);
    expect(await settings.text()).not.toMatch(/sb_secret|service_role_key\":\s*\"/);
  });
});

describe('her submissions', () => {
  it('records a proposal answer only when asked to', async () => {
    const response = await fetch(`${ORIGIN}/api/proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip() },
      body: JSON.stringify({ answer: 'yes' }),
    });
    expect(response.status).toBe(200);
  });

  it('rejects malformed plans instead of writing them', async () => {
    const response = await fetch(`${ORIGIN}/api/date-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip() },
      body: JSON.stringify({
        token: crypto.randomUUID(),
        selectedDate: '2999-13-45',
        selectedTime: '99:99',
        activity: 'nonsense',
        media: [],
      }),
    });
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  it('refuses a plan dated in the past', async () => {
    const response = await fetch(`${ORIGIN}/api/date-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip() },
      body: JSON.stringify({
        token: crypto.randomUUID(),
        selectedDate: '2007-11-14',
        selectedTime: '18:00',
        timeMode: 'preset',
        activity: 'coffee',
        media: [],
      }),
    });
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe('past_date');
  });

  it('will not read a plan without the matching private token', async () => {
    const missing = await fetch(`${ORIGIN}/api/date-response?token=00000000-0000-4000-8000-000000000000`);
    expect(missing.status).toBe(404);

    const invalid = await fetch(`${ORIGIN}/api/date-response?token=not-a-token`);
    expect(invalid.status).toBe(400);
  });

  it('refuses unsupported upload types', async () => {
    const response = await fetch(`${ORIGIN}/api/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ip() },
      body: JSON.stringify({
        token: crypto.randomUUID(),
        kind: 'photo',
        contentType: 'application/x-php',
        size: 100,
      }),
    });
    expect(response.status).toBe(422);
  });
});
