create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  deadline date,
  color text not null default '#4F7CFF',
  created_at timestamptz default now()
);

alter table public.savings_goals enable row level security;

create policy "Users can view own savings_goals"
  on public.savings_goals for select using (auth.uid() = user_id);

create policy "Users can insert own savings_goals"
  on public.savings_goals for insert with check (auth.uid() = user_id);

create policy "Users can update own savings_goals"
  on public.savings_goals for update using (auth.uid() = user_id);

create policy "Users can delete own savings_goals"
  on public.savings_goals for delete using (auth.uid() = user_id);

create index idx_savings_goals_user on public.savings_goals (user_id, created_at desc);
