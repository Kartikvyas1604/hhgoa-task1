-- FrameInGoa — run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Everything here is only ever touched by the server (service_role key), never
-- the browser, so RLS stays on with no public policies.

create sequence if not exists public.builder_number_seq start 1;

create table if not exists public.cards (
  id text primary key,
  name text not null default '',
  role text not null default '',
  socials jsonb not null default '{}'::jsonb,
  builder_number integer not null default nextval('public.builder_number_seq'),
  portrait_url text not null,
  portrait_back_url text,
  landscape_url text not null,
  created_at timestamptz not null default now()
);

-- safe to re-run: adds the column if this table was created before it existed
alter table public.cards add column if not exists portrait_back_url text;

alter table public.cards enable row level security;
