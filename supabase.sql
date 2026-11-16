-- Ladder Master — Supabase kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run

-- Herkese açık profil + puan (leaderboard)
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  points      int  not null default 0 check (points between 0 and 900),
  updated_at  timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));
create index if not exists profiles_points on public.profiles (points desc, updated_at asc);

-- Oyuncunun kayıtlı çözümleri (yalnızca kendisi görür)
create table if not exists public.progress (
  id          uuid primary key references auth.users on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

drop policy if exists "profiles herkes okur"     on public.profiles;
drop policy if exists "profiles kendini ekler"    on public.profiles;
drop policy if exists "profiles kendini gunceller" on public.profiles;
create policy "profiles herkes okur"      on public.profiles for select using (true);
create policy "profiles kendini ekler"     on public.profiles for insert with check (auth.uid() = id);
create policy "profiles kendini gunceller" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "progress sahibi okur"     on public.progress;
drop policy if exists "progress sahibi ekler"    on public.progress;
drop policy if exists "progress sahibi gunceller" on public.progress;
create policy "progress sahibi okur"      on public.progress for select using (auth.uid() = id);
create policy "progress sahibi ekler"     on public.progress for insert with check (auth.uid() = id);
create policy "progress sahibi gunceller" on public.progress for update using (auth.uid() = id) with check (auth.uid() = id);
