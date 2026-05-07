-- Block 3: matching scoring + recompute RPC functions.
-- Run this once in Supabase Dashboard -> SQL Editor.

-- 1. status column on matches (pending | assigned | done)
alter table public.matches
  add column if not exists status text not null default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'matches_status_check'
  ) then
    alter table public.matches
      add constraint matches_status_check
      check (status in ('pending','assigned','done'));
  end if;
end $$;

-- 2. (senior_id, job_id) unique pair so upsert is well-defined
create unique index if not exists matches_senior_job_uniq
  on public.matches(senior_id, job_id);

-- 3. Recompute matches for a single senior across all jobs.
--    Scoring (max 6):
--      region match     -> +3
--      job_type match   -> +2
--      career_years >=  required_career -> +1
--    Only positive scores are stored. Existing rows keep their status.
create or replace function public.recompute_matches_for_senior(p_senior_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_senior public.seniors%rowtype;
begin
  select * into v_senior from public.seniors where id = p_senior_id;
  if not found then
    return;
  end if;

  insert into public.matches (senior_id, job_id, score, status)
  select
    p_senior_id,
    j.id,
    (case when j.region   = v_senior.region      then 3 else 0 end)
    + (case when j.job_type = v_senior.desired_job then 2 else 0 end)
    + (case when v_senior.career_years >= j.required_career then 1 else 0 end),
    'pending'
  from public.jobs j
  where (
    (case when j.region   = v_senior.region      then 3 else 0 end)
    + (case when j.job_type = v_senior.desired_job then 2 else 0 end)
    + (case when v_senior.career_years >= j.required_career then 1 else 0 end)
  ) > 0
  on conflict (senior_id, job_id)
  do update set score = excluded.score;

  delete from public.matches m
  where m.senior_id = p_senior_id
    and not exists (
      select 1 from public.jobs j
      where j.id = m.job_id
        and (
          (case when j.region   = v_senior.region      then 3 else 0 end)
          + (case when j.job_type = v_senior.desired_job then 2 else 0 end)
          + (case when v_senior.career_years >= j.required_career then 1 else 0 end)
        ) > 0
    );
end;
$$;

-- 4. Recompute matches for a single job across all seniors.
create or replace function public.recompute_matches_for_job(p_job_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_job public.jobs%rowtype;
begin
  select * into v_job from public.jobs where id = p_job_id;
  if not found then
    return;
  end if;

  insert into public.matches (senior_id, job_id, score, status)
  select
    s.id,
    p_job_id,
    (case when v_job.region   = s.region      then 3 else 0 end)
    + (case when v_job.job_type = s.desired_job then 2 else 0 end)
    + (case when s.career_years >= v_job.required_career then 1 else 0 end),
    'pending'
  from public.seniors s
  where (
    (case when v_job.region   = s.region      then 3 else 0 end)
    + (case when v_job.job_type = s.desired_job then 2 else 0 end)
    + (case when s.career_years >= v_job.required_career then 1 else 0 end)
  ) > 0
  on conflict (senior_id, job_id)
  do update set score = excluded.score;

  delete from public.matches m
  where m.job_id = p_job_id
    and not exists (
      select 1 from public.seniors s
      where s.id = m.senior_id
        and (
          (case when v_job.region   = s.region      then 3 else 0 end)
          + (case when v_job.job_type = s.desired_job then 2 else 0 end)
          + (case when s.career_years >= v_job.required_career then 1 else 0 end)
        ) > 0
    );
end;
$$;

-- 5. Allow the public/anon API to call these.
grant execute on function public.recompute_matches_for_senior(uuid) to anon, authenticated;
grant execute on function public.recompute_matches_for_job(uuid)    to anon, authenticated;
