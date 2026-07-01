create table if not exists public.project_access_grants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint project_access_grants_unique unique (project_id, user_id)
);

create index if not exists project_access_grants_user_id_idx
  on public.project_access_grants (user_id);

create index if not exists project_access_grants_project_id_idx
  on public.project_access_grants (project_id);

alter table public.project_access_grants enable row level security;

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

drop policy if exists samplesheets_authenticated_read on public.samplesheets;
create policy samplesheets_authenticated_read
on public.samplesheets
for select
to authenticated
using (public.is_internal_user());

drop policy if exists samplesheet_entries_authenticated_read on public.samplesheet_entries;
create policy samplesheet_entries_authenticated_read
on public.samplesheet_entries
for select
to authenticated
using (public.is_internal_user());

revoke all on table public.project_access_grants from anon;
grant select, insert, update, delete on table public.project_access_grants to authenticated, service_role;
