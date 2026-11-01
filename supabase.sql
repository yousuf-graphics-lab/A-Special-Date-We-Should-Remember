-- ===========================================================================
--  For Samiya — Supabase schema
--  Run this whole file once in the Supabase SQL editor.
--  It is idempotent: safe to run again after edits.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. The vault
-- ---------------------------------------------------------------------------
create table if not exists public.vault_entries (
  id          uuid primary key default gen_random_uuid(),
  answer      text not null default 'yes',
  chosen_date date not null,
  chosen_time time not null,
  activity    text not null,
  note        text,
  created_at  timestamptz not null default now(),
  user_agent  text,
  timezone    text,
  ip_hash     text,
  owner_notes text
);

-- Validation constraints (the server validates too; this is the last line of
-- defence if anything ever writes to the table directly).
alter table public.vault_entries
  drop constraint if exists vault_entries_answer_check;
alter table public.vault_entries
  add constraint vault_entries_answer_check check (answer = 'yes');

alter table public.vault_entries
  drop constraint if exists vault_entries_chosen_date_check;
alter table public.vault_entries
  add constraint vault_entries_chosen_date_check check (chosen_date >= date '2024-01-01');

alter table public.vault_entries
  drop constraint if exists vault_entries_activity_check;
alter table public.vault_entries
  add constraint vault_entries_activity_check check (
    activity in (
      'Dinner',
      'Coffee and a long conversation',
      'Movie night',
      'A long drive',
      'A beach visit or evening walk',
      'Ice cream together',
      'A surprise date'
    )
  );

alter table public.vault_entries
  drop constraint if exists vault_entries_note_check;
alter table public.vault_entries
  add constraint vault_entries_note_check check (note is null or char_length(note) <= 500);

alter table public.vault_entries
  drop constraint if exists vault_entries_owner_notes_check;
alter table public.vault_entries
  add constraint vault_entries_owner_notes_check check (
    owner_notes is null or char_length(owner_notes) <= 2000
  );

alter table public.vault_entries
  drop constraint if exists vault_entries_timezone_check;
alter table public.vault_entries
  add constraint vault_entries_timezone_check check (
    timezone is null or (char_length(timezone) between 1 and 64)
  );

alter table public.vault_entries
  drop constraint if exists vault_entries_user_agent_check;
alter table public.vault_entries
  add constraint vault_entries_user_agent_check check (
    user_agent is null or char_length(user_agent) <= 512
  );

comment on table  public.vault_entries is 'Private date invitations submitted by Samiya. Service-role access only.';
comment on column public.vault_entries.owner_notes is 'Private planning notes. Never exposed to anonymous visitors.';
comment on column public.vault_entries.ip_hash is 'SHA-256 of the visitor IP, salted with the app secret. Raw IPs are never stored.';

create index if not exists vault_entries_created_at_idx
  on public.vault_entries (created_at desc);

create index if not exists vault_entries_chosen_date_idx
  on public.vault_entries (chosen_date);

-- ---------------------------------------------------------------------------
-- 2. Durable rate limiting (shared across serverless instances)
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limit_attempts (
  id         bigserial primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);

comment on table public.rate_limit_attempts is
  'Rolling-window counters for admin login and submission throttling.';

create index if not exists rate_limit_attempts_bucket_idx
  on public.rate_limit_attempts (bucket, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--    RLS is enabled and *no policy grants access to anon/authenticated*.
--    The only writer/reader is the Next.js server using the service role key,
--    which bypasses RLS. This means:
--      • anonymous visitors cannot select, insert, update or delete anything
--      • the anon key cannot be used to read the note or owner_notes
--      • there is no public API surface backed by the database
-- ---------------------------------------------------------------------------
alter table public.vault_entries       enable row level security;
alter table public.vault_entries       force  row level security;
alter table public.rate_limit_attempts enable row level security;
alter table public.rate_limit_attempts force  row level security;

drop policy if exists "no anonymous access" on public.vault_entries;
drop policy if exists "no authenticated access" on public.vault_entries;
drop policy if exists "no public access" on public.rate_limit_attempts;

-- Belt and braces: remove the grants PostgREST relies on, so even a future
-- policy mistake cannot expose the table through the REST API.
revoke all on table public.vault_entries       from anon, authenticated;
revoke all on table public.rate_limit_attempts from anon, authenticated;
revoke all on sequence public.rate_limit_attempts_id_seq from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Housekeeping
--    Optional: purge rate-limit rows older than two days (pg_cron).
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_rate_limit_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_attempts
  where created_at < now() - interval '2 days';
$$;

revoke all on function public.purge_old_rate_limit_attempts() from anon, authenticated;

-- ===========================================================================
--  Verification (run manually after setup):
--
--    select * from public.vault_entries order by created_at desc;
--    select relname, relrowsecurity, relforcerowsecurity
--      from pg_class where relname in ('vault_entries','rate_limit_attempts');
--
--  And from a browser / curl with the *anon* key (must return nothing):
--    curl "$SUPABASE_URL/rest/v1/vault_entries?select=*" \
--         -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
-- ===========================================================================
