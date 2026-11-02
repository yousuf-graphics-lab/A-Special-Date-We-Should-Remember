-- ============================================================================
--  For Samiya — private experience backend
--  All application data lives in `public` with RLS enabled and no policies,
--  which means only the service role (server-side) can read or write.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Date responses (the current, confirmed plan)
-- ----------------------------------------------------------------------------
create table if not exists public.date_responses (
  id                 uuid primary key default gen_random_uuid(),
  public_token       uuid not null default gen_random_uuid(),
  proposal_answer    text not null default 'yes' check (proposal_answer = 'yes'),
  selected_date      date not null,
  selected_time      text not null check (selected_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  time_mode          text not null default 'preset' check (time_mode in ('preset', 'custom')),
  selected_activity  text not null,
  custom_activity    text,
  personal_message   text,
  status             text not null default 'confirmed' check (status in ('confirmed')),
  response_version   integer not null default 1 check (response_version > 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint date_responses_public_token_key unique (public_token)
);

comment on table public.date_responses is
  'Samiya''s confirmed date plan. selected_date/selected_time are her preferred schedule, not a real-world booking.';

-- Only one active response record is expected; enforce a single row.
create unique index if not exists date_responses_single_row
  on public.date_responses ((true));

-- ----------------------------------------------------------------------------
-- Proposal answers (recorded only when an option is explicitly chosen)
-- ----------------------------------------------------------------------------
create table if not exists public.proposal_answers (
  id         uuid primary key default gen_random_uuid(),
  answer     text not null check (answer in ('yes', 'no')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Snapshot history of confirmed response versions
-- ----------------------------------------------------------------------------
create table if not exists public.response_versions (
  id          uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.date_responses (id) on delete cascade,
  version     integer not null,
  snapshot    jsonb not null,
  created_at  timestamptz not null default now(),
  unique (response_id, version)
);

-- ----------------------------------------------------------------------------
-- Timeline of events that actually happened
-- ----------------------------------------------------------------------------
create table if not exists public.response_events (
  id          uuid primary key default gen_random_uuid(),
  response_id uuid references public.date_responses (id) on delete set null,
  event_type  text not null check (event_type in (
    'proposal_yes',
    'proposal_no',
    'date_confirmed',
    'date_updated',
    'voice_submitted',
    'voice_deleted',
    'photos_submitted',
    'photo_deleted',
    'location_submitted',
    'location_removed',
    'response_deleted'
  )),
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists response_events_created_at_idx
  on public.response_events (created_at desc);

-- ----------------------------------------------------------------------------
-- Media records (private storage references only — never raw files)
-- ----------------------------------------------------------------------------
create table if not exists public.media_records (
  id               uuid primary key default gen_random_uuid(),
  response_id      uuid not null references public.date_responses (id) on delete cascade,
  media_type       text not null check (media_type in ('voice', 'photo')),
  storage_path     text not null,
  mime_type        text not null,
  byte_size        integer not null check (byte_size > 0),
  content_hash     text not null,
  duration_seconds numeric(7, 2),
  sort_order       integer not null default 0,
  consent          boolean not null default true,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint media_records_storage_path_key unique (storage_path)
);

create index if not exists media_records_response_idx
  on public.media_records (response_id, media_type, sort_order);

-- No duplicate files for the same response, and only one voice message.
create unique index if not exists media_records_unique_hash
  on public.media_records (response_id, content_hash)
  where deleted_at is null;
create unique index if not exists media_records_single_voice
  on public.media_records (response_id)
  where media_type = 'voice' and deleted_at is null;
create index if not exists media_records_path_idx
  on public.media_records (storage_path);

-- ----------------------------------------------------------------------------
-- Optional shared location
-- ----------------------------------------------------------------------------
create table if not exists public.date_locations (
  id               uuid primary key default gen_random_uuid(),
  response_id      uuid not null references public.date_responses (id) on delete cascade,
  place_name       text,
  latitude         double precision check (latitude between -90 and 90),
  longitude        double precision check (longitude between -180 and 180),
  accuracy_meters  double precision check (accuracy_meters >= 0),
  source           text not null check (source in ('manual', 'device')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint date_locations_response_key unique (response_id),
  constraint date_locations_has_value check (
    (place_name is not null and length(btrim(place_name)) > 0)
    or (latitude is not null and longitude is not null)
  )
);

-- ----------------------------------------------------------------------------
-- Administrator credentials (bcrypt hash only, maintained server-side)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_credentials (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.admin_activity (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  outcome    text not null,
  detail     text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Simple fixed-window rate limiting, keyed by hashed IP + action
-- ----------------------------------------------------------------------------
create table if not exists public.request_rate_limits (
  bucket_key        text primary key,
  window_started_at timestamptz not null default now(),
  hits              integer not null default 0
);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
begin
  insert into public.request_rate_limits (bucket_key, window_started_at, hits)
  values (p_key, now(), 1)
  on conflict (bucket_key) do update
    set hits = case
                 when request_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
                   then 1
                 else request_rate_limits.hits + 1
               end,
        window_started_at = case
                 when request_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
                   then now()
                 else request_rate_limits.window_started_at
               end
  returning hits into current_hits;

  return current_hits <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
revoke all on function public.check_rate_limit(text, integer, integer) from anon;
revoke all on function public.check_rate_limit(text, integer, integer) from authenticated;

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists date_responses_touch on public.date_responses;
create trigger date_responses_touch
  before update on public.date_responses
  for each row execute function public.touch_updated_at();

drop trigger if exists date_locations_touch on public.date_locations;
create trigger date_locations_touch
  before update on public.date_locations
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Row level security: deny by default, server (service role) only
-- ----------------------------------------------------------------------------
alter table public.date_responses    enable row level security;
alter table public.proposal_answers  enable row level security;
alter table public.response_versions enable row level security;
alter table public.response_events   enable row level security;
alter table public.media_records     enable row level security;
alter table public.date_locations    enable row level security;
alter table public.admin_credentials enable row level security;
alter table public.admin_activity    enable row level security;
alter table public.request_rate_limits enable row level security;

revoke all on table public.date_responses    from anon, authenticated;
revoke all on table public.proposal_answers  from anon, authenticated;
revoke all on table public.response_versions from anon, authenticated;
revoke all on table public.response_events   from anon, authenticated;
revoke all on table public.media_records     from anon, authenticated;
revoke all on table public.date_locations    from anon, authenticated;
revoke all on table public.admin_credentials from anon, authenticated;
revoke all on table public.admin_activity    from anon, authenticated;
revoke all on table public.request_rate_limits from anon, authenticated;

-- ----------------------------------------------------------------------------
-- Private storage bucket for voice notes and photos
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'samiya-private',
  'samiya-private',
  false,
  15728640, -- 15 MB hard ceiling at the storage layer
  array['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No storage policies are created for anon/authenticated: only the service role
-- and short-lived signed upload URLs can touch this bucket.
