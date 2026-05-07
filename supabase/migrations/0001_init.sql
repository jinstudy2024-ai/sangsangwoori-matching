-- Sangsangwoori senior-job matching: initial schema
-- Run this once in Supabase Dashboard -> SQL Editor.
-- Learning environment only: RLS is disabled on all tables.

create extension if not exists "pgcrypto";

create table if not exists public.seniors (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  region        text not null,
  desired_job   text not null,
  career_years  int  not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  region          text not null,
  job_type        text not null,
  required_career int  not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  senior_id  uuid not null references public.seniors(id) on delete cascade,
  job_id     uuid not null references public.jobs(id)    on delete cascade,
  score      numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists matches_senior_id_idx on public.matches(senior_id);
create index if not exists matches_job_id_idx    on public.matches(job_id);

-- Learning environment: disable RLS so anon key can read/write.
alter table public.seniors disable row level security;
alter table public.jobs    disable row level security;
alter table public.matches disable row level security;
