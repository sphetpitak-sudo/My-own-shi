create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean default false,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_at timestamptz default now()
);

alter table public.todos enable row level security;

create policy "Users can view own todos"
  on public.todos for select using (auth.uid() = user_id);

create policy "Users can insert own todos"
  on public.todos for insert with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on public.todos for update using (auth.uid() = user_id);

create policy "Users can delete own todos"
  on public.todos for delete using (auth.uid() = user_id);

create index idx_todos_user on public.todos (user_id, created_at desc);
