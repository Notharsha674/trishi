-- Trishi birthday submissions: owner-only records.
-- Run this ONCE in your own Supabase project's SQL Editor.
-- The website does not submit any records automatically.
create extension if not exists pgcrypto;

create table if not exists public.ash_dashboard_owners (
  owner_id uuid primary key,
  created_at timestamptz not null default now()
);
create table if not exists public.ash_birthday_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  submitted_at timestamptz not null default now(),
  response_data jsonb not null,
  email_sent boolean not null default false,
  constraint response_object check (jsonb_typeof(response_data)='object'),
  constraint response_limit check (pg_column_size(response_data) < 7000)
);
create index if not exists ash_birthday_responses_recent
  on public.ash_birthday_responses(submitted_at desc);

alter table public.ash_dashboard_owners enable row level security;
alter table public.ash_birthday_responses enable row level security;

-- Owner records are readable only by the signed-in Supabase Auth user with
-- the matching owner_id. No browser user can grant themselves ownership.
drop policy if exists "Owner can verify their access" on public.ash_dashboard_owners;
create policy "Owner can verify their access"
on public.ash_dashboard_owners for select to authenticated
using (owner_id = (select auth.uid()));

-- Only the owner can read Trishi's explicitly sent results. Public clients
-- have NO insert/update/delete policy. The Edge Function uses a server secret.
drop policy if exists "Only Ash can read sent submissions" on public.ash_birthday_responses;
create policy "Only Ash can read sent submissions"
on public.ash_birthday_responses for select to authenticated
using (
  exists(
    select 1 from public.ash_dashboard_owners owners
    where owners.owner_id = (select auth.uid())
  )
);

revoke all on table public.ash_dashboard_owners from anon, authenticated;
revoke all on table public.ash_birthday_responses from anon, authenticated;
grant select on public.ash_dashboard_owners to authenticated;
grant select on public.ash_birthday_responses to authenticated;

-- AFTER your FIRST dashboard magic-link login, find your user ID in
-- Supabase > Authentication > Users, then run in SQL Editor:
-- insert into public.ash_dashboard_owners(owner_id)
-- values ('YOUR-AUTH-USER-UUID')
-- on conflict (owner_id) do nothing;
-- Do not put your real email or user UUID into the public GitHub code.
