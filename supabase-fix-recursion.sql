-- ============================================================
-- D.CRITICK 24/7 — исправление бесконечной рекурсии в RLS
-- Выполнить в Supabase → SQL Editor → New query → Run
-- ============================================================

-- Функция проверяет роль в обход RLS (SECURITY DEFINER),
-- поэтому больше не вызывает сама себя рекурсивно
create or replace function public.is_jury()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'jury'
  );
$$;

-- Пересоздаём политики для profiles через функцию вместо прямого подзапроса
drop policy if exists "profile_select_jury" on public.profiles;
create policy "profile_select_jury"
  on public.profiles for select
  using ( public.is_jury() );

-- Пересоздаём политики для results
drop policy if exists "results_select_jury" on public.results;
create policy "results_select_jury"
  on public.results for select
  using ( public.is_jury() );

drop policy if exists "results_write_jury" on public.results;
create policy "results_write_jury"
  on public.results for all
  using ( public.is_jury() );

-- Пересоздаём политики для reviews
-- (если таблица reviews ещё не создана — сначала выполните supabase-reviews.sql,
--  а затем этот блок ниже)
drop policy if exists "reviews_select_jury" on public.reviews;
create policy "reviews_select_jury"
  on public.reviews for select
  using ( public.is_jury() );

drop policy if exists "reviews_update_jury" on public.reviews;
create policy "reviews_update_jury"
  on public.reviews for update
  using ( public.is_jury() );
