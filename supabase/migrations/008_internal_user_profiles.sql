create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_is_internal_idx on public.user_profiles (is_internal);

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row
execute procedure public.touch_updated_at();

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select up.is_internal
    from public.user_profiles up
    where up.id = auth.uid()
  ), false);
$$;

alter table public.user_profiles enable row level security;

drop policy if exists user_profiles_authenticated_read on public.user_profiles;
create policy user_profiles_authenticated_read
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists user_profiles_authenticated_insert on public.user_profiles;
create policy user_profiles_authenticated_insert
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists user_profiles_authenticated_update on public.user_profiles;
create policy user_profiles_authenticated_update
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists sample_status_updates_authenticated_insert on public.sample_status_updates;
create policy sample_status_updates_authenticated_insert
on public.sample_status_updates
for insert
to authenticated
with check (created_by = auth.uid() and public.is_internal_user());

drop policy if exists sample_status_updates_authenticated_update on public.sample_status_updates;

revoke all on table public.user_profiles from anon;
grant select, insert, update on table public.user_profiles to authenticated, service_role;

revoke update on table public.sample_status_updates from authenticated;
grant execute on function public.is_internal_user() to authenticated, service_role;
