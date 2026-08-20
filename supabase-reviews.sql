-- ============================================================
-- D.CRITICK 24/7 — отзывы участников + модерация жюри
-- Выполнить в Supabase → SQL Editor → New query → Run
-- (таблицы profiles и results уже должны существовать)
-- ============================================================

create table public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  status text not null default 'pending', -- pending / approved / rejected
  created_at timestamp with time zone default now()
);

alter table public.reviews enable row level security;

-- участник может оставить свой отзыв
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- участник видит статус своего отзыва
create policy "reviews_select_own"
  on public.reviews for select
  using (auth.uid() = user_id);

-- жюри видит все отзывы (в т.ч. на модерации)
create policy "reviews_select_jury"
  on public.reviews for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'jury')
  );

-- жюри может менять статус (одобрить/отклонить)
create policy "reviews_update_jury"
  on public.reviews for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'jury')
  );

-- одобренные отзывы видны всем на сайте, даже без входа
create policy "reviews_select_public_approved"
  on public.reviews for select
  using (status = 'approved');
