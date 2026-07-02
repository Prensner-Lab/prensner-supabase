create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.samplesheets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  pi_name text,
  date date,
  submitter_name text,
  submitter_email text,
  project_id text,
  project_title text not null,
  experiment_type text,
  project_description text,
  filename text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists samplesheets_project_title_idx on public.samplesheets (project_title);
create index if not exists samplesheets_project_id_idx on public.samplesheets (project_id);
create index if not exists samplesheets_date_idx on public.samplesheets (date);
create index if not exists samplesheets_created_at_idx on public.samplesheets (created_at);
create index if not exists samplesheets_created_by_idx on public.samplesheets (created_by);

create table if not exists public.samplesheet_entries (
  id uuid primary key default gen_random_uuid(),
  samplesheet_id uuid not null references public.samplesheets(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  run_id text not null,
  smart_id text,
  data_type text,
  species text,
  sample_type text,
  source_id text,
  is_paired_end boolean not null default false,
  read_end text,
  replicate_num integer,
  test_or_control text,
  location_id text,
  disease_id text,
  treatment_id text,
  genetic_factors text,
  sequencing_instrument text,
  batch_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint samplesheet_entries_toc_check check (
    test_or_control is null or test_or_control in ('test', 'control')
  ),
  constraint samplesheet_entries_read_end_check check (
    read_end is null or read_end in ('R1', 'R2')
  )
);

create index if not exists samplesheet_entries_run_id_idx on public.samplesheet_entries (run_id);
create index if not exists samplesheet_entries_samplesheet_id_idx on public.samplesheet_entries (samplesheet_id);
create index if not exists samplesheet_entries_smart_id_idx on public.samplesheet_entries (smart_id);
create index if not exists samplesheet_entries_species_idx on public.samplesheet_entries (species);
create index if not exists samplesheet_entries_data_type_idx on public.samplesheet_entries (data_type);
create index if not exists samplesheet_entries_batch_date_idx on public.samplesheet_entries (batch_date);
create index if not exists samplesheet_entries_created_by_idx on public.samplesheet_entries (created_by);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_code_idx on public.projects (code);
create index if not exists projects_title_idx on public.projects (title);
create index if not exists projects_created_by_idx on public.projects (created_by);

create table if not exists public.project_samples (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  name text not null,
  tissue_type text,
  library_type text,
  source text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_samples_project_name_unique unique (project_id, name)
);

create index if not exists project_samples_project_id_idx on public.project_samples (project_id);
create index if not exists project_samples_name_idx on public.project_samples (name);
create index if not exists project_samples_created_by_idx on public.project_samples (created_by);

create table if not exists public.sample_status_updates (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references public.project_samples(id) on delete restrict,
  status text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint sample_status_updates_status_check check (
    status in ('not started', 'in progress', 'data generated', 'failed')
  )
);

create index if not exists sample_status_updates_sample_id_idx on public.sample_status_updates (sample_id);
create index if not exists sample_status_updates_created_at_idx on public.sample_status_updates (created_at desc);
create index if not exists sample_status_updates_status_idx on public.sample_status_updates (status);
create index if not exists sample_status_updates_created_by_idx on public.sample_status_updates (created_by);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_is_internal_idx on public.user_profiles (is_internal);

create table if not exists public.project_access_grants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint project_access_grants_unique unique (project_id, user_id)
);

create index if not exists project_access_grants_user_id_idx on public.project_access_grants (user_id);
create index if not exists project_access_grants_project_id_idx on public.project_access_grants (project_id);

create or replace view public.project_samples_latest_status as
select
  s.id,
  s.project_id,
  p.code as project_code,
  p.title as project_title,
  s.name as sample_name,
  s.tissue_type,
  s.library_type,
  s.source,
  s.created_at,
  s.updated_at,
  coalesce(latest.status, 'not started') as latest_status,
  latest.created_at as latest_status_at
from public.project_samples s
join public.projects p on p.id = s.project_id
left join lateral (
  select
    u.status,
    u.created_at
  from public.sample_status_updates u
  where u.sample_id = s.id
  order by u.created_at desc
  limit 1
) latest on true;

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

drop trigger if exists samplesheets_touch_updated_at on public.samplesheets;
create trigger samplesheets_touch_updated_at
before update on public.samplesheets
for each row
execute procedure public.touch_updated_at();

drop trigger if exists samplesheet_entries_touch_updated_at on public.samplesheet_entries;
create trigger samplesheet_entries_touch_updated_at
before update on public.samplesheet_entries
for each row
execute procedure public.touch_updated_at();

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
before update on public.projects
for each row
execute procedure public.touch_updated_at();

drop trigger if exists project_samples_touch_updated_at on public.project_samples;
create trigger project_samples_touch_updated_at
before update on public.project_samples
for each row
execute procedure public.touch_updated_at();

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row
execute procedure public.touch_updated_at();

alter table public.samplesheets enable row level security;
alter table public.samplesheet_entries enable row level security;
alter table public.projects enable row level security;
alter table public.project_samples enable row level security;
alter table public.sample_status_updates enable row level security;
alter table public.user_profiles enable row level security;
alter table public.project_access_grants enable row level security;

drop policy if exists samplesheets_authenticated_read on public.samplesheets;
create policy samplesheets_authenticated_read
on public.samplesheets
for select
to authenticated
using (public.is_internal_user());

drop policy if exists samplesheets_authenticated_insert on public.samplesheets;
create policy samplesheets_authenticated_insert
on public.samplesheets
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists samplesheets_authenticated_update on public.samplesheets;
create policy samplesheets_authenticated_update
on public.samplesheets
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists samplesheet_entries_authenticated_read on public.samplesheet_entries;
create policy samplesheet_entries_authenticated_read
on public.samplesheet_entries
for select
to authenticated
using (public.is_internal_user());

drop policy if exists samplesheet_entries_authenticated_insert on public.samplesheet_entries;
create policy samplesheet_entries_authenticated_insert
on public.samplesheet_entries
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists samplesheet_entries_authenticated_update on public.samplesheet_entries;
create policy samplesheet_entries_authenticated_update
on public.samplesheet_entries
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists projects_authenticated_read on public.projects;
create policy projects_authenticated_read
on public.projects
for select
to authenticated
using (
  public.is_internal_user()
  or exists (
    select 1
    from public.project_access_grants pag
    where pag.project_id = projects.id
      and pag.user_id = auth.uid()
  )
);

drop policy if exists projects_authenticated_insert on public.projects;
create policy projects_authenticated_insert
on public.projects
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists projects_authenticated_update on public.projects;
create policy projects_authenticated_update
on public.projects
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists project_samples_authenticated_read on public.project_samples;
create policy project_samples_authenticated_read
on public.project_samples
for select
to authenticated
using (
  public.is_internal_user()
  or exists (
    select 1
    from public.project_access_grants pag
    where pag.project_id = project_samples.project_id
      and pag.user_id = auth.uid()
  )
);

drop policy if exists project_samples_authenticated_insert on public.project_samples;
create policy project_samples_authenticated_insert
on public.project_samples
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists project_samples_authenticated_update on public.project_samples;
create policy project_samples_authenticated_update
on public.project_samples
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists sample_status_updates_authenticated_read on public.sample_status_updates;
create policy sample_status_updates_authenticated_read
on public.sample_status_updates
for select
to authenticated
using (
  public.is_internal_user()
  or exists (
    select 1
    from public.project_samples ps
    join public.project_access_grants pag
      on pag.project_id = ps.project_id
    where ps.id = sample_status_updates.sample_id
      and pag.user_id = auth.uid()
  )
);

drop policy if exists sample_status_updates_authenticated_insert on public.sample_status_updates;
create policy sample_status_updates_authenticated_insert
on public.sample_status_updates
for insert
to authenticated
with check (created_by = auth.uid() and public.is_internal_user());

drop policy if exists project_access_grants_authenticated_read on public.project_access_grants;
create policy project_access_grants_authenticated_read
on public.project_access_grants
for select
to authenticated
using (public.is_internal_user() or user_id = auth.uid());

drop policy if exists project_access_grants_authenticated_insert on public.project_access_grants;
create policy project_access_grants_authenticated_insert
on public.project_access_grants
for insert
to authenticated
with check (public.is_internal_user());

drop policy if exists project_access_grants_authenticated_update on public.project_access_grants;
create policy project_access_grants_authenticated_update
on public.project_access_grants
for update
to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

drop policy if exists project_access_grants_authenticated_delete on public.project_access_grants;
create policy project_access_grants_authenticated_delete
on public.project_access_grants
for delete
to authenticated
using (public.is_internal_user());

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

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.samplesheets from anon;
revoke all on table public.samplesheet_entries from anon;
revoke all on table public.projects from anon;
revoke all on table public.project_samples from anon;
revoke all on table public.sample_status_updates from anon;
revoke all on table public.user_profiles from anon;
revoke all on table public.project_access_grants from anon;

grant select, insert, update on table public.samplesheets to authenticated, service_role;
grant select, insert, update on table public.samplesheet_entries to authenticated, service_role;
grant select, insert, update on table public.projects to authenticated, service_role;
grant select, insert, update on table public.project_samples to authenticated, service_role;
grant select, insert on table public.sample_status_updates to authenticated, service_role;
grant select, insert, update on table public.user_profiles to authenticated, service_role;
grant select, insert, update, delete on table public.project_access_grants to authenticated, service_role;
grant select on table public.project_samples_latest_status to authenticated, service_role;

grant execute on function public.is_internal_user() to authenticated, service_role;

revoke delete on table public.samplesheets from anon, authenticated, service_role;
revoke delete on table public.samplesheet_entries from anon, authenticated, service_role;
revoke delete on table public.projects from anon, authenticated, service_role;
revoke delete on table public.project_samples from anon, authenticated, service_role;
revoke delete on table public.sample_status_updates from anon, authenticated, service_role;

revoke update on table public.sample_status_updates from authenticated;

insert into public.samplesheets (
  pi_name,
  date,
  submitter_name,
  submitter_email,
  project_id,
  project_title,
  experiment_type,
  project_description,
  filename
)
values (
  null,
  null,
  'System',
  null,
  null,
  'Unassigned Samplesheet',
  null,
  'Seed row for first-time usage.',
  null
)
on conflict do nothing;
