-- ============================================================
-- Leaderboard migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── 1. profiles table ─────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url   text,
  updated_at   timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles (needed for the leaderboard)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Only the owner can insert / update their own row
create policy "profiles_upsert_own"
  on public.profiles for all
  to authenticated
  using      ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── 2. get_leaderboard() ──────────────────────────────────────
-- Returns top N users ranked by points.
-- SECURITY DEFINER so it can read all user_progress rows
-- regardless of per-user RLS.
create or replace function public.get_leaderboard(p_limit int default 50)
returns table (
  user_id              uuid,
  display_name         text,
  avatar_url           text,
  total_cards_reviewed int,
  streak               int,
  points               bigint
)
security definer
set search_path = public
language sql
as $$
  select
    up.user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Learner') as display_name,
    p.avatar_url,
    up.total_cards_reviewed,
    up.streak,
    (up.total_cards_reviewed * 10 + up.streak * 50)::bigint as points
  from user_progress up
  left join profiles p on p.id = up.user_id
  where up.total_cards_reviewed > 0
  order by points desc
  limit p_limit;
$$;

-- ── 3. get_my_rank() ──────────────────────────────────────────
-- Returns the calling user's rank and total points.
create or replace function public.get_my_rank()
returns table (rank int, points bigint)
security definer
set search_path = public
language sql
as $$
  with my_score as (
    select (total_cards_reviewed * 10 + streak * 50)::bigint as pts
    from user_progress
    where user_id = auth.uid()
    limit 1
  )
  select
    (
      select count(*)::int + 1
      from user_progress
      where (total_cards_reviewed * 10 + streak * 50) > coalesce((select pts from my_score), 0)
    ) as rank,
    coalesce((select pts from my_score), 0) as points;
$$;
