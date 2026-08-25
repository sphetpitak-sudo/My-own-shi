create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  note text default '',
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  skip_weekends boolean not null default false,
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.recurring_transactions enable row level security;

create policy "Users can view own recurring_transactions"
  on public.recurring_transactions for select using (auth.uid() = user_id);

create policy "Users can insert own recurring_transactions"
  on public.recurring_transactions for insert with check (auth.uid() = user_id);

create policy "Users can update own recurring_transactions"
  on public.recurring_transactions for update using (auth.uid() = user_id);

create policy "Users can delete own recurring_transactions"
  on public.recurring_transactions for delete using (auth.uid() = user_id);

create index idx_recurring_user on public.recurring_transactions (user_id, next_date);
