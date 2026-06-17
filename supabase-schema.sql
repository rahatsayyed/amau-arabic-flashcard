-- Run this in your Supabase project SQL editor:
-- https://supabase.com/dashboard/project/lsbysflgoqkoewwmvsvk/sql

create table if not exists public.decks (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text default '',
  icon         text default 'book_2',
  is_public    boolean default true,
  cards        jsonb default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.decks enable row level security;

-- Select: own decks
create policy "users can view own decks"
  on public.decks for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Select: public decks from others
create policy "anyone can view public decks"
  on public.decks for select
  using (is_public = true);

-- Insert: own decks only
create policy "users can insert own decks"
  on public.decks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Update: own decks only
create policy "users can update own decks"
  on public.decks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Delete: own decks only
create policy "users can delete own decks"
  on public.decks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- User progress (streak, card states, activity)
create table if not exists public.user_progress (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  streak               int default 0,
  last_study_date      text default '',
  total_cards_reviewed int default 0,
  card_states          jsonb default '{}'::jsonb,
  exam_scores          jsonb default '[]'::jsonb,
  activity_by_day      jsonb default '{}'::jsonb,
  updated_at           timestamptz default now()
);

alter table public.user_progress enable row level security;

create policy "users can view own progress"
  on public.user_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can upsert own progress"
  on public.user_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can update own progress"
  on public.user_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
