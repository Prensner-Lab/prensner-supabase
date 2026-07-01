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

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
before update on public.projects
for each row
execute procedure public.touch_updated_at();

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

drop trigger if exists project_samples_touch_updated_at on public.project_samples;
create trigger project_samples_touch_updated_at
before update on public.project_samples
for each row
execute procedure public.touch_updated_at();

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

alter table public.projects enable row level security;
alter table public.project_samples enable row level security;
alter table public.sample_status_updates enable row level security;

drop policy if exists projects_authenticated_read on public.projects;
create policy projects_authenticated_read
on public.projects
for select
to authenticated
using (true);

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
using (true);

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
using (true);

drop policy if exists sample_status_updates_authenticated_insert on public.sample_status_updates;
create policy sample_status_updates_authenticated_insert
on public.sample_status_updates
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists sample_status_updates_authenticated_update on public.sample_status_updates;
create policy sample_status_updates_authenticated_update
on public.sample_status_updates
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

revoke all on table public.projects from anon;
revoke all on table public.project_samples from anon;
revoke all on table public.sample_status_updates from anon;

grant select, insert, update on table public.projects to authenticated, service_role;
grant select, insert, update on table public.project_samples to authenticated, service_role;
grant select, insert, update on table public.sample_status_updates to authenticated, service_role;
grant select on table public.project_samples_latest_status to authenticated, service_role;

revoke delete on table public.projects from anon, authenticated, service_role;
revoke delete on table public.project_samples from anon, authenticated, service_role;
revoke delete on table public.sample_status_updates from anon, authenticated, service_role;
