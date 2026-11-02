# For Samiya

A private, hand-built love story: a birthday lock, a letter, a bouquet and a poem, a date
proposal, a date planner, and a thank-you letter — with a completely separate admin panel so
Yousuf can see her real answer.

Written for **Samiya**, by **Yousuf**, with all his heart.

---

## The experience

| Screen | What happens |
| --- | --- |
| **The Secret** | A heart-shaped lock. She unlocks it with her birthday (`14.11.2007`, `14112007` or `14-11-2007`). The wrong answer gently says *“Hmm, not quite, my love. Try once more.”* |
| **My Letter** | A sealed envelope with her name and a wax seal. Tapping the seal opens the letter, exactly as written. |
| **Flowers and Poetry** | The bouquet blooms in, the poem appears stanza by stanza, in Banglish, verbatim. |
| **The Question** | Evening sky, moonlight, two silhouettes on a bench. The **Yes** button breathes; the **No** button wanders anywhere on the screen for three playful hops, then stays put so she can always decline. |
| **Our Date** | Calendar (future days only), time slots plus a custom time, date preferences, an optional note, an optional voice message, up to five optional photos, and an optional location. |
| **A Little Thank You** | The second letter, then a card with exactly what she submitted — empty sections are simply omitted. |

A quiet gold progress indicator lets her step back to anything she has already seen. Music starts
after her first tap and keeps playing across screens.

Every touch leaves a small hand-drawn blossom behind, each chapter turns under a soft curtain of
petals, and **Yes** opens a full-screen bloom before the next screen arrives. All of it disappears
under `prefers-reduced-motion`, and none of it ever sits between her and a button.

### Optional sharing — never required

* **Voice message** — microphone permission is only requested when she presses *Record*. She can
  listen, delete, or record again before submitting.
* **Photos** — 0 to 5. Preview, replace, reorder, remove, and confirm consent before uploading.
* **Location** — a typed place, or her current position only after she presses the button.
  Whatever she submits is shown back to her before confirmation.

She can confirm the date without using any of them.

---

## The private admin panel

`/admin` — never linked from the romantic website, no registration, protected by a password and a
signed, `HttpOnly`, `SameSite=Strict` session cookie. Unauthenticated requests are redirected to
`/admin/login` by `src/middleware.ts`, and every admin API route independently re-checks the
session server-side.

Sections: **Dashboard · Date Response · Voice Message · Photo Gallery · Shared Location ·
Submission History · Settings**.

* Default administrator: `yousuf`. The initial password comes from `ADMIN_PASSWORD`; it is hashed
  with bcrypt on first sign-in (never stored in plain text) and can then be changed in
  **Settings → Administrator account**.
* Private media is streamed through `/api/admin/media/[id]`, so file URLs never leak. In Supabase
  mode the bucket is private and only short-lived signed URLs are ever created.
* Deleting a response removes the row, its versions, media and location; the timeline keeps a
  record that it was deleted.

---

## Running it

```bash
npm install
cp .env.example .env.local     # fill in the values
npm run dev                    # http://localhost:3000
npm run build && npm start     # production
```

### Storage modes

The app reads `DATA_MODE`:

| `DATA_MODE` | Behaviour |
| --- | --- |
| *(unset)* | **Supabase** — the real backend (database, private storage). Recommended for the live site. |
| `local` | **Local preview store** — a persistent JSON store plus private files in `.data/`. No internet needed; ideal for previews and for this sandbox. The admin panel labels it clearly. Not for serverless hosting. |

If neither is configured, the site still opens and she can read everything, but saving fails with a
clear message instead of pretending it worked.

---

## Connecting Supabase (for the real deployment)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_initial_schema.sql` in the SQL editor. It creates:
   `date_responses`, `proposal_answers`, `response_versions`, `response_events`, `media_records`,
   `date_locations`, `admin_credentials`, `admin_activity`, `request_rate_limits`, the
   `check_rate_limit()` function, and the **private** `samiya-private` storage bucket.
   Row-level security is enabled with *no* policies and table privileges are revoked for `anon`
   and `authenticated`, so only the service role (server-side) can touch the data.
3. Put these in your environment:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=...            # server only, never exposed
   ADMIN_USERNAME=yousuf
   ADMIN_PASSWORD=your-private-password     # only used for the first sign-in
   ADMIN_SESSION_SECRET=$(openssl rand -hex 32)
   ```

4. Deploy to Vercel (or any Node host). Add the same environment variables there. `DATA_MODE` must
   stay unset so Supabase is used.

### Security notes

* The birthday lock is a romantic gesture, **not** authentication. Nothing about it is stored.
* No secret is ever sent to the browser: only `NEXT_PUBLIC_*` values are public.
* Uploads use short-lived signed URLs. On confirmation the server sniffs the real file signature
  (JPEG/PNG/WebP/WebM/Ogg/MP4/MP3), rejects mismatches, enforces size limits, and deduplicates by
  content hash — file extensions and browser headers are never trusted.
* Rate limits (Postgres fixed-window) apply to submissions, uploads, media reads and admin logins.
* Sessions live in an HMAC-signed cookie; middleware and every API route verify it independently.

---

## Project map

```
src/
  app/
    page.tsx                 the romantic experience (client-side stage machine)
    admin/login, admin/(panel)/…
    api/date-response        create / update / resume / delete her plan
    api/date-response/media  her own files, only with her private token
    api/upload-url           signed upload targets
    api/proposal             records "yes"/"no" only on an explicit press
    api/admin/…              login, logout, password, media, response, location
    api/health               minimal public status
  components/experience/     lock, letter, bouquet, poem, proposal, planner, thank-you
  components/admin/          shell, cards, gallery, forms
  lib/
    content.ts               every word she reads — edit here
    auth.ts, session-token.ts, middleware.ts
    supabase.ts, local-store.ts, storage.ts, validation.ts, rate-limit.ts
    time.ts                  Asia/Dhaka formatting
public/audio/                the original piano score + unlock chime
supabase/migrations/         database + storage schema
scripts/generate_music.py    regenerates the score (numpy + lameenc)
```

### Editing the content

Everything personal lives in `src/lib/content.ts`: the letters, the poem, the proposal copy, the
date options, the time slots and the small helper texts. The letters and the Banglish poem are
reproduced **exactly** as written — please keep them that way.

### The music

`public/audio/a-quiet-promise.mp3` is “A Quiet Promise”, an original piano piece composed and
synthesised for this project by `scripts/generate_music.py` (F major, 57 bpm, ~2:45). It is free of
third-party samples, so there are no licensing obligations. To use a different track, replace the
file and update `SITE.music.src` in `src/lib/content.ts`; if no track exists the music button says
so instead of pretending to play.

---

## Testing checklist (already exercised end to end)

* Birthday lock: correct/incorrect/empty input, all three accepted formats.
* Envelope → letter → flowers → poem → proposal → planner → thank-you, and back again.
* Yes (celebration → planner) and No (decline → retry or leave).
* Calendar: month navigation, past dates disabled, keyboard arrows, custom time.
* Submission: validation, duplicate prevention (disabled while saving), failed submissions keep
  every choice, version history on re-submission.
* Voice: permission denied and granted, listen/delete/re-record, optional.
* Photos: 0–5, replace, reorder, remove, consent, duplicate rejection, type/size validation.
* Location: typed place, device coordinates, denied permission, removal — all optional.
* `/admin` without a session redirects; admin APIs return 401; forged cookies are rejected.
* Private files are only served through authenticated or token-scoped routes.
* Password change, logout, rate limiting, response deletion.

---

Made for Samiya. Always.

---

## Licences & credits

* **Music** — “A Quiet Promise” (2:45, piano) was composed and synthesised for this project by
  `scripts/generate_music.py`. No third-party samples; no attribution needed.
* **Typefaces** — Cormorant Garamond, Lato, Great Vibes and Caveat, all SIL Open Font License,
  self-hosted through `@fontsource` (no external font requests at runtime).
* **Illustrations** — the bouquet, the heart lock, the wax seal and the evening scene are original
  SVG artwork written for this site, so they stay crisp at every size.
* **Icons** — [Lucide](https://lucide.dev), ISC licence.

## Tests

```bash
npm run build && npm start      # in one shell
npm test                        # in another (uses http://localhost:3000)
```

`tests/journey.test.tsx` walks the entire experience in a real DOM — wrong birthday, correct
birthday, envelope, letter, poem, proposal, calendar, confirmation — and checks the saved response
through the API. `tests/decline.test.tsx` covers the “No, not today” path. `tests/api.test.ts`
checks that `/admin` and every admin API refuse unauthenticated access, that forged cookies fail,
that logins are throttled, and that malformed or past-dated plans are never written.

Set `TEST_APP_ORIGIN` and `TEST_ADMIN_PASSWORD` to point the suite at another instance.
