create table if not exists public.daily_sales_counter_ledgers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.daily_sales_counter_ledgers enable row level security;
revoke all on public.daily_sales_counter_ledgers from anon;
grant select, insert, update on public.daily_sales_counter_ledgers to authenticated;

drop policy if exists "Users can read their own counter data" on public.daily_sales_counter_ledgers;
create policy "Users can read their own counter data"
  on public.daily_sales_counter_ledgers for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own counter data" on public.daily_sales_counter_ledgers;
create policy "Users can create their own counter data"
  on public.daily_sales_counter_ledgers for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own counter data" on public.daily_sales_counter_ledgers;
create policy "Users can update their own counter data"
  on public.daily_sales_counter_ledgers for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

do $$
begin
  alter publication supabase_realtime add table public.daily_sales_counter_ledgers;
exception
  when duplicate_object then null;
end
$$;
