# For Samiya

A private love letter, rendered as a website.

Samiya opens a page, reads a question, says yes, chooses the evening she wants,
and the site turns that answer into a countdown. Every submission lands in a
Supabase table that nobody but the owner can reach, behind a secret URL and a
password. A small private dashboard holds the answer, her note, the countdown,
and a place to plan.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion and
Supabase. Deployed on Vercel.

---

## Table of contents

1. [The experience](#1-the-experience)
2. [Tech stack](#2-tech-stack)
3. [Quick start](#3-quick-start)
4. [Supabase setup](#4-supabase-setup)
5. [Environment variables](#5-environment-variables)
6. [The private vault](#6-the-private-vault)
7. [Optional notifications](#7-optional-notifications)
8. [Optional background music](#8-optional-background-music)
9. [Scripts](#9-scripts)
10. [Deploying to Vercel](#10-deploying-to-vercel)
11. [Testing checklist](#11-testing-checklist)
12. [Sharing it with Samiya (without sharing the vault)](#12-sharing-it-with-samiya-without-sharing-the-vault)
13. [Security model](#13-security-model)
14. [Accessibility & performance](#14-accessibility--performance)
15. [Project structure](#15-project-structure)
16. [Troubleshooting](#16-troubleshooting)
17. [Optional integrations & known limits](#17-optional-integrations--known-limits)

---

## 1. The experience

One page, three stages, no reloads.

**Step one — the invitation.**
A typewriter writes *Hey Samiya…*, then the question appears. **Yes** and **No**
sit beneath it. The No button is shy: on hover, tap, or keyboard activation it
hops to a random spot inside its arena, shrinks a little, and changes what it
says — *No → Are you sure? → Really sure? → Think again → Last chance! → You
can't catch me → Okay fine, just say yes* — before vanishing. It can never land
on top of Yes (targets are rejection-sampled against the Yes button's rectangle)
and never leaves its arena, so nothing scrolls sideways. Yes grows with every
dodge.

Yes triggers a full-screen heart-and-gold confetti burst, an optional soft chime,
and a cross-fade into step two.

**Step two — choosing the moment.**
A hand-built calendar (no calendar library) where today and every past day are
disabled, month lengths and leap years come from the Date API, and arrow keys /
PageUp / PageDown work. Four time presets (morning, afternoon, evening, night)
fill an editable exact-time field. Seven activities as single-select cards. An
optional note. **Lock it in** stays disabled until a future date, a valid time
and an activity all exist; the server then re-validates everything before it
touches the database. On success the screen seals itself — *Sealed in the vault.*
— and moves to the countdown. On failure her choices stay exactly where they
were and a friendly retry appears.

**Step three — the countdown.**
Days : hours : minutes : seconds, ticking once a second, computed from the
absolute instant of her chosen date and time *in her own timezone*, so it is
never negative and never off by an hour across DST. The summary card reads
*Friday, 14 February 2027 · 7:30 PM · Dinner*, with **Add to Calendar** (a real
ICS file) and **Create Our Date Card** (a downloadable PNG rendered in-browser
with html-to-image, loaded only when pressed). When the date arrives, the
countdown is replaced by a warm message instead of negative numbers.

Returning to the site later restores her countdown from a signed, HTTP-only
cookie — no re-entry of anything.

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router, React Server Components) |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS with a fully custom theme (no UI kit) |
| Animation | Framer Motion |
| Confetti | `canvas-confetti` (lazy) |
| Image export | `html-to-image` (lazy) |
| Database | Supabase / PostgreSQL with Row Level Security |
| Validation | Zod |
| Auth | bcryptjs + signed JWT (`jose`) in an HTTP-only cookie |
| Icons | Lucide React |
| Email (optional) | Resend |
| Telegram (optional) | Telegram Bot API |
| Fonts | Playfair Display + Inter, self-hosted (variable WOFF2) |
| Hosting | Vercel |

No calendar library, no date library, no ORM, no component kit.

---

## 3. Quick start

```bash
# 1. install
npm install

# 2. environment
cp .env.example .env.local
#    …then fill in the values (see sections 4 and 5)

# 3. generate a password hash, a slug and a JWT secret
npm run hash-password -- "a long password you will remember"
node -e "console.log(require('crypto').randomBytes(16).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g,''))"   # ADMIN_SLUG
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"                                           # JWT_SECRET

# 4. run
npm run dev            # http://localhost:3000
```

Then open:

| URL | What it is |
| --- | --- |
| `http://localhost:3000` | The letter |
| `http://localhost:3000/vault-<ADMIN_SLUG>` | The private vault (login first) |

Sanity checks before you deploy:

```bash
npm run typecheck      # zero errors
npm run lint           # zero errors
npm run build          # production build
npm run start          # serve the build
npm run smoke-test     # 47 end-to-end HTTP assertions (see §9)
```

---

## 4. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of [`supabase.sql`](./supabase.sql)
   and run it. It creates:

   - `vault_entries` — the answer (date, time, activity, her note, timestamp,
     timezone, user agent, hashed IP, and `owner_notes` for your private plan);
   - `rate_limit_attempts` — durable counters for login and submission throttling;
   - constraints, indexes, comments and a housekeeping function.

3. Go to **Project Settings → API** and copy:

   - *Project URL* → `NEXT_PUBLIC_SUPABASE_URL`
   - *anon public* key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *service_role* key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**)

Verify the security setup (RLS on, no grants for anon):

```sql
select relname, relrowsecurity, relforcerowsecurity, relacl
from pg_class
where relname in ('vault_entries', 'rate_limit_attempts');
```

Both rows must show `true / true`. Then confirm anonymous access is denied —
this call must return nothing (an error like `permission denied` is expected and
correct):

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/vault_entries?select=*" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

That is the whole database story: RLS is enabled, *no policy grants anything to
`anon` or `authenticated`*, and the grants are revoked too. Only the Next.js
server, using the service role key, can read or write. Submissions reach the
database through a validated server endpoint, never from the browser.

---

## 5. Environment variables

Copy `.env.example` → `.env.local`. Full list:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public key. Never used to read/write the vault. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server only.** Bypasses RLS. |
| `ADMIN_PASSWORD_BASE64` | ✅* | base64 of the bcrypt hash — recommended. |
| `ADMIN_PASSWORD_HASH` | ✅* | Alternative form; every `$` must be escaped as `\$`. |
| `ADMIN_SLUG` | ✅ | Lowercase letters/numbers/dashes, 8+ chars. |
| `JWT_SECRET` | ✅ | 32+ random characters. |
| `NEXT_PUBLIC_SITE_URL` | ✅ (prod) | Used for Open Graph absolute URLs. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `NOTIFICATION_EMAIL_TO` | — | Email notifications. |
| `NOTIFY_INCLUDE_NOTE` | — | `true` to include her note in notifications. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | Telegram notifications. |
| `NEXT_PUBLIC_MUSIC_URL` | — | A file under `/public`. |
| `ALLOWED_EMBED_ORIGIN` | — | Extra origin allowed to iframe the page. |

\* one of the two password variables.

Required values are validated on first use of the server config; if something is
missing you get a single readable error listing exactly what to fix — not a
`undefined` three frames deep.

### The bcrypt `$` trap (read this)

`.env` files go through variable expansion, and a bcrypt hash is full of `$`.
`$2b$12$AbCd…` silently becomes `…` and every login fails. Two safe options:

```bash
# Recommended: base64 (no $ characters at all)
npm run hash-password -- "your password"
#   ADMIN_PASSWORD_BASE64=JDJiJDEyJEFiQ2Q...

# Or escape each $ with a backslash
#   ADMIN_PASSWORD_HASH=\$2b\$12\$AbCd...
```

`npm run hash-password` prints both forms ready to paste.

---

## 6. The private vault

The dashboard lives at **`/vault-<ADMIN_SLUG>`**. There is no link to it anywhere
on the public site, `robots.txt` disallows it, and the page carries
`noindex, nofollow, noarchive`. Those measures are politeness — the real
protection is authentication:

- the login form posts to `POST /api/admin/login`;
- the password is compared with your bcrypt hash **on the server**;
- failures return one generic message and are limited to **5 per IP per 15
  minutes**, counted in Postgres so serverless instances share the limit;
- success signs a 7-day JWT (`HS256`, issuer + audience + role claims) and puts
  it in an **HTTP-only, Secure (in production), SameSite=Strict, Path=/** cookie;
- the middleware redirects unauthenticated visitors to the login screen, and
  **every page and every admin route re-verifies the token** before touching
  data — discovering the URL or calling the API directly gets you a `401`.

Inside, for the most recent submission (and any older ones), you get:

- her chosen date, time, activity and timezone, plus when it arrived;
- her optional note (server-rendered for you only);
- a live countdown;
- a status badge — *Date received* / *Waiting*;
- **Copy date & time**;
- **My plan** — a private textarea saved through `PATCH /api/admin/entries`,
  which updates only that record's `owner_notes`;
- **Delete entry** (two-step) for clearing test records;
- **Sign out**, which clears the cookie server-side.

`owner_notes` is never written or returned by any anonymous path, and never
appears in notifications.

---

## 7. Optional notifications

Both integrations are skipped entirely when unconfigured, and wrapped so that a
provider outage can never break a successful submission (the row is already
saved; failures are logged without her note).

**Resend (email)**

1. Create an API key at [resend.com](https://resend.com).
2. Verify a sending domain (or use their test sender).
3. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL_TO`.

**Telegram**

1. Message [@BotFather](https://t.me/botfather) → `/newbot` → copy the token.
2. Message your new bot once (so it may DM you), then get your numeric chat id
   from [@userinfobot](https://t.me/userinfobot).
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

Her note is left out of notifications unless you set
`NOTIFY_INCLUDE_NOTE=true`.

---

## 8. Optional background music

Put a file in `public/music/` (see `public/music/README.md`) and set
`NEXT_PUBLIC_MUSIC_URL=/music/your-song.mp3`. The control in the top-right stays
off until it is pressed, honours the browser's autoplay rules, and remembers the
choice in `localStorage`. With no file configured the button still works — it
just controls the little celebration chimes instead.

---

## 9. Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` with strict settings |
| `npm run lint` | Next.js ESLint |
| `npm run hash-password -- "pw"` | Prints bcrypt hash (base64 + escaped forms) |
| `npm run smoke-test` | End-to-end HTTP checks against a running instance |

### What `smoke-test` verifies

With the server running (`npm run start`), and skipping nothing:

- the public page renders, is titled *For Samiya*, and leaks nothing;
- `/api/session` is empty for a new visitor;
- past dates, unknown activities and unexpected fields are rejected;
- a valid submission is accepted, sets an HttpOnly cookie, never echoes the note,
  and is restored afterwards **without** the note;
- every admin endpoint returns `401` without a cookie;
- the vault redirects anonymous visitors and 404s a guessed slug;
- a forged admin cookie and a forged selection cookie are both rejected;
- wrong passwords are throttled after five attempts;
- login sets an HttpOnly, SameSite=Strict, 7-day cookie;
- the dashboard renders her note (admin only) and the entry's timezone;
- the private plan saves, over-long values are rejected, and the entry deletes;
- logout revokes access;
- `robots.txt` hides the vault and `/api/`; the OG image is served as PNG.

It exits non-zero if anything fails.

```bash
BASE_URL=https://your-project.vercel.app ADMIN_TEST_PASSWORD="your password" npm run smoke-test
```

`BASE_URL` defaults to `http://127.0.0.1:3000` and the password defaults to the
development one; override both when testing a deployment. The run leaves no
records behind — it deletes what it creates.

---

## 10. Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repo (framework auto-detected).
3. Add every required environment variable from §5 to **Production** (and
   Preview if you like). Set `NEXT_PUBLIC_SITE_URL` to the real domain —
   `https://your-project.vercel.app` or a custom domain.
4. Deploy. Then:

   - open `/` on desktop and on a phone;
   - open `/opengraph-image` to see the share preview;
   - send yourself the link in WhatsApp and check the preview card;
   - open `/vault-<ADMIN_SLUG>`, log in, and confirm it redirects to the login
     screen when signed out.

5. Nothing else is needed — Supabase is already reachable from Vercel, and the
   optional integrations start working the moment their keys are added.

> The service role key, password hash, JWT secret and notification credentials
> must only ever exist as server-side environment variables. Never prefix them
> with `NEXT_PUBLIC_`.

---

## 11. Testing checklist

Run through this once locally and once on the deployed site, on a phone.

**The letter**

- [ ] 390 px wide (iPhone 12/13/14): no horizontal scrolling, text comfortable.
- [ ] Tablet and desktop: centred, not stretched.
- [ ] Typewriter finishes, question appears.
- [ ] Hovering / tapping / tabbing to **No**: it moves, shrinks, changes label,
      never covers **Yes**, and disappears after the last message.
- [ ] Arrow keys and Tab still reach both buttons; focus ring visible.
- [ ] **Yes** → confetti, chime (if enabled), smooth transition.
- [ ] `prefers-reduced-motion: reduce` → fades only, no drifting hearts, no
      confetti, background static.

**Choosing**

- [ ] Past days and today are disabled (struck through, `aria-disabled`).
- [ ] Month arrows stop at the current month and 24 months ahead.
- [ ] Leap years and short months render correctly (try February 2028).
- [ ] Presets fill the time field; editing the time updates the summary.
- [ ] One activity at a time; **Lock it in** enables only when everything is set.
- [ ] Note is optional and capped at 500 characters.
- [ ] Submitting shows a spinner and cannot be double-submitted.
- [ ] Kill your connection mid-submit → friendly error, choices preserved, retry.
- [ ] Success → *Sealed in the vault.* → countdown.

**The vault**

- [ ] The row exists in Supabase: `select * from vault_entries order by created_at desc;`
- [ ] Anonymous read fails (curl test in §4).
- [ ] `/vault-<slug>` signed out → login screen; wrong password → generic error;
      six wrong passwords → 429.
- [ ] Login → dashboard shows date, time, activity, note, timestamp, timezone,
      countdown, badge.
- [ ] **My plan** saves and survives a refresh.
- [ ] **Copy date & time** works; **Delete entry** removes the row; **Sign out**
      returns you to the login screen and `/api/admin/entries` gives `401`.
- [ ] Remove any test record when you are done (in the dashboard, or with
      `delete from vault_entries where note like 'test%';`).

---

## 12. Sharing it with Samiya (without sharing the vault)

- Send **only** the root URL — `https://your-project.vercel.app`. Nothing else
  on the site links to the vault, and there is no index of pages.
- Never paste the vault URL into the same chat, a screenshot, a repository
  README, an issue, or a screen recording. Keep it in your password manager.
- `robots.txt` disallows the vault, and every vault response is
  `noindex, nofollow` and `Cache-Control: no-store`.
- If the URL ever leaks, rotate it: pick a new `ADMIN_SLUG` in Vercel and
  redeploy — the old path becomes a 404 immediately. Rotate `JWT_SECRET` at the
  same time to invalidate existing sessions, and change the password if needed.
- The shared link preview contains only the title, description and the generated
  OG image. No date, note or name of the plan appears anywhere public.

---

## 13. Security model

| Threat | Mitigation |
| --- | --- |
| Reading the vault with the public key | RLS enabled *and forced*, zero policies, grants revoked for `anon`/`authenticated` |
| Writing arbitrary rows | Only `POST /api/submit`, Zod-validated, field allow-list, service role on the server |
| Setting `owner_notes` from the browser | The field is not in any public schema; unknown fields are rejected (400) |
| Reading someone's answer from the public site | The countdown comes from a signed, HTTP-only cookie bound to an opaque session id; no public endpoint returns stored rows |
| Guessing the admin URL | Random slug, 404 for any other path, plus password + JWT |
| Brute force | bcrypt (slow by design) + 5 attempts / 15 min / IP in Postgres + generic errors |
| Session theft / tampering | JWT signature, `exp`, `iss`, `aud`, `role`; HTTP-only, Secure, SameSite=Strict, 7-day cap |
| CSRF against admin endpoints | SameSite=Strict cookie, JSON-only bodies, origin-bound fetches |
| Secrets in the client bundle | `getServerConfig()` throws if imported in the browser; only `NEXT_PUBLIC_*` values are inlined |
| Leaking notes in logs | Only error classes are logged, never payloads |
| Note leaking into email | Excluded unless `NOTIFY_INCLUDE_NOTE=true` |
| Duplicate submissions | Rate limiting per hashed IP + the UI disables while in flight; the vault lists every entry explicitly if several exist |
| IP privacy | Only `sha256(salt + ip)` is stored, never the address |

Passwords and hashes live only in server environment variables. The service role
key never reaches the browser. No API returns the note without a valid admin JWT.

---

## 14. Accessibility & performance

- Semantic landmarks (`main`, `header`, `footer`, `fieldset`/`legend`), real
  `<button>` elements, native radio inputs for the time and activity pickers.
- Skip link, visible focus rings on every interactive element, `aria-live`
  regions for the typewriter result, the No-button label changes, validation
  errors and the countdown.
- Selection is never signalled by colour alone: selected days carry a ring and a
  dot, selected activity cards a dot and aria state.
- The calendar is keyboard-navigable (arrows, Home/End, PageUp/PageDown) with a
  roving tab index.
- `prefers-reduced-motion` replaces animation with simple fades and stops the
  decorative loops, the parallax, the cursor trail and the confetti.
- The background is decorative (`aria-hidden`), pointer-events free, and reduced
  on mobile; cursor effects and parallax are desktop-only.
- Confetti and html-to-image are dynamic imports — neither is in the initial
  bundle. Fonts are self-hosted WOFF2 with `font-display: swap`. The page is
  server-rendered, so the first paint already contains the letter.
- First load JS is ~159 kB for the page, ~87 kB shared.

---

## 15. Project structure

```
src/
├── app/
│   ├── layout.tsx              # metadata, fonts, skip link
│   ├── page.tsx                # public page (server) → session → Experience
│   ├── globals.css             # theme tokens, @font-face, reduced motion
│   ├── error.tsx               # friendly error boundary
│   ├── not-found.tsx
│   ├── icon.svg                # letter/heart favicon
│   ├── opengraph-image.tsx     # generated share image (next/og)
│   ├── robots.ts
│   ├── api/
│   │   ├── submit/route.ts     # the only public write path
│   │   ├── session/route.ts    # "what did this browser choose?"
│   │   └── admin/
│   │       ├── login/route.ts  # bcrypt + rate limit + JWT cookie
│   │       ├── logout/route.ts
│   │       └── entries/route.ts# authenticated GET / PATCH / DELETE
│   └── vault/[slug]/
│       ├── page.tsx            # server-authorized dashboard
│       ├── loading.tsx         # skeleton
│       └── login/page.tsx      # login screen
├── components/
│   ├── admin/                  # LoginForm, VaultDashboard
│   ├── atmosphere/             # Atmosphere, HeartTrail
│   ├── date/                   # Calendar, TimeSelector, ActivityPicker, DateForm
│   ├── invitation/             # Invitation, Typewriter
│   ├── countdown/              # Countdown, CountdownScreen, DateCard
│   ├── experience/             # Experience (stage orchestration)
│   └── ui/                     # MusicControl
├── fonts/                      # self-hosted WOFF2 + OG-image TTF instances
├── lib/
│   ├── config.ts               # server env validation (server-only)
│   ├── constants.ts            # activities, presets, limits, cookie names
│   ├── datetime.ts             # timezone-safe date math
│   ├── ics.ts                  # RFC 5545 calendar file
│   ├── types.ts, validation.ts # shared types + Zod schemas
│   ├── client/                 # sound, celebration, date-card generation
│   └── server/                 # supabase, auth, session, rate-limit, vault, notifications, http
└── middleware.ts               # vault path rewrite + API guard
supabase.sql                    # schema, constraints, RLS
scripts/                        # hash-password, smoke-test
```

---

## 16. Troubleshooting

**`Invalid or missing environment variables: …`**
The message lists exactly which variable is wrong. Copy `.env.example` again and
fill in the missing value.

**Login always fails, hash looks mangled**
The `$` expansion problem — see §5. Use `ADMIN_PASSWORD_BASE64`.

**`/vault-<slug>` returns 404**
`ADMIN_SLUG` in the environment does not match the URL. Slugs are lowercase
letters, numbers and dashes. Changing the slug changes the URL.

**Login says too many attempts (429)**
Five failures per IP per 15 minutes. Wait, or clear the counters:

```sql
delete from rate_limit_attempts where bucket like 'login:%';
```

**Submission shows a friendly error**
Check the server log — it records the failure class only. Usually it is a wrong
`SUPABASE_SERVICE_ROLE_KEY`, or `supabase.sql` has not been run yet.

**Dates look off by a day or a few hours**
Everything is computed from the visitor's own IANA timezone; the entry stores it
so the dashboard and the calendar file agree with what she saw.

**The countdown shows dashes**
It fills in after mount — the server clock and the phone clock are different
clocks, and guessing would flash the wrong number.

**Music will not start**
Browsers block audio until a real tap. The control shows a hint and retries on
the next press.

---

## 17. Optional integrations & known limits

- **Email (Resend)** and **Telegram** are optional; the submission flow is fully
  functional without them.
- **Background music** is optional; without it the sound button still governs the
  celebration chimes.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** is configured for completeness (it is part
  of the standard Supabase setup) but the app deliberately never uses it for data
  access. All reads and writes happen server-side with the service role key.
- The dashboard is intentionally single-owner: one password, one session type.
  If you want multiple admins, this is the place to extend.
- Rate limiting counts by IP; a shared NAT will share a budget. For a site with
  one visitor, that is exactly what you want.
- The vault lists every entry if more than one exists, newest first — nothing is
  overwritten or hidden.

---

Made for one person, with a lock on the door.
