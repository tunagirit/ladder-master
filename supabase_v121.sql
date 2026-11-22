-- Ladder Master v1.2.1 — puan güvenliği
-- Puanı artık istemci yazamaz. Puan, kayıtlı ilerlemeden (progress.data.done) sunucuda hesaplanır:
--   * yalnızca 0–9999 arası bölüm numaraları sayılır (en fazla 10.000 puan)
--   * hız sınırı: puan son güncellemeden bu yana en fazla 30 + dakika × 2 artabilir
--   * ilerleme verisi en fazla 6 MB olabilir

-- 1) puan zamanı (hız sınırı için)
alter table public.profiles add column if not exists points_at timestamptz not null default now();

-- 2) sütun yetkileri: istemci yalnızca id + kullanıcı adını yazabilir, puanı asla
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, username) on public.profiles to authenticated;
grant update (username) on public.profiles to authenticated;
revoke insert, update, delete on public.progress from anon;
grant select, insert, update on public.progress to authenticated;

-- 3) ikinci kilit: profiles satırında puan/puan zamanı yalnızca sunucu fonksiyonu tarafından değişebilir
create or replace function public.lm_guard_points() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('lm.srv', true), '') = '1' then return new; end if;
  if tg_op = 'INSERT' then new.points := 0; new.points_at := now();
  else new.points := old.points; new.points_at := old.points_at; end if;
  return new;
end $$;
drop trigger if exists lm_guard_points on public.profiles;
create trigger lm_guard_points before insert or update on public.profiles
  for each row execute function public.lm_guard_points();

-- 4) ilerleme kaydedilince puanı sunucu hesaplar
create or replace function public.lm_score_from_progress() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; p0 int; t0 timestamptz; allowed int;
begin
  if octet_length(new.data::text) > 6000000 then raise exception 'progress too large'; end if;
  select count(*) into n from jsonb_object_keys(coalesce(new.data->'done','{}'::jsonb)) k
    where k ~ '^[0-9]{1,4}$';
  n := least(n, 10000);
  select points, points_at into p0, t0 from public.profiles where id = new.id;
  if not found then return new; end if;
  allowed := p0 + 30 + floor(extract(epoch from (now() - t0)) / 60.0 * 2)::int;   -- en fazla 30 + dakikada 2 bölüm
  perform set_config('lm.srv', '1', true);
  update public.profiles set points = least(n, allowed), points_at = now(), updated_at = now()
    where id = new.id and points is distinct from least(n, allowed);
  perform set_config('lm.srv', '0', true);
  return new;
end $$;
drop trigger if exists lm_score_from_progress on public.progress;
create trigger lm_score_from_progress after insert or update on public.progress
  for each row execute function public.lm_score_from_progress();
revoke execute on function public.lm_score_from_progress() from public, anon, authenticated;
revoke execute on function public.lm_guard_points() from public, anon, authenticated;

-- 5) mevcut puanları kayıtlı ilerlemeye göre yeniden hesapla (sahte puanlar düşer)
do $$ begin
  perform set_config('lm.srv', '1', true);
  update public.profiles p set points = least(coalesce((
      select count(*) from public.progress g, jsonb_object_keys(coalesce(g.data->'done','{}'::jsonb)) k
      where g.id = p.id and k ~ '^[0-9]{1,4}$'), 0), 10000), points_at = now();
end $$;
alter table public.profiles drop constraint if exists profiles_points_check;
alter table public.profiles add constraint profiles_points_check check (points between 0 and 10000);
