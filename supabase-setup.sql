-- ============================================================
-- D.CRITICK 24/7 — схема базы данных
-- Выполнить целиком в Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Профиль участника (создаётся автоматически при регистрации)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  grade text,
  school text,
  city text,
  telegram text,
  role text not null default 'participant', -- 'participant' или 'jury'
  created_at timestamp with time zone default now()
);

-- 2. Результаты туров
create table public.results (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  round int not null,
  score int,
  status text not null default 'pending', -- pending / checked / appeal
  updated_at timestamp with time zone default now(),
  unique (user_id, round)
);

-- 3. Включаем защиту на уровне строк (без неё это сделать нельзя пропустить)
alter table public.profiles enable row level security;
alter table public.results  enable row level security;

-- 4. Участник видит и может редактировать только свой профиль
create policy "profile_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profile_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Жюри (role = 'jury') видит все профили и результаты
create policy "profile_select_jury"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'jury')
  );

create policy "results_select_own"
  on public.results for select
  using (auth.uid() = user_id);

create policy "results_select_jury"
  on public.results for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'jury')
  );

create policy "results_write_jury"
  on public.results for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'jury')
  );

-- 6. Автосоздание профиля сразу после регистрации
--    (данные берутся из формы регистрации — см. register.html)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, grade, school, city, telegram)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'grade',
    new.raw_user_meta_data ->> 'school',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'telegram'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
