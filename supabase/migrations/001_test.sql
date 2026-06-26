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

drop trigger if exists samplesheets_touch_updated_at on public.samplesheets;
create trigger samplesheets_touch_updated_at
before update on public.samplesheets
for each row
execute procedure public.touch_updated_at();

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

create table if not exists public.samplesheet_entries (
  id uuid primary key default gen_random_uuid(),
  samplesheet_id uuid not null references public.samplesheets(id) on delete restrict,
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

drop trigger if exists samplesheet_entries_touch_updated_at on public.samplesheet_entries;
create trigger samplesheet_entries_touch_updated_at
before update on public.samplesheet_entries
for each row
execute procedure public.touch_updated_at();

alter table public.samplesheets enable row level security;
alter table public.samplesheet_entries enable row level security;

drop policy if exists samplesheets_anon_all on public.samplesheets;
create policy samplesheets_anon_all
on public.samplesheets
for all
to anon
using (true)
with check (true);

drop policy if exists samplesheet_entries_anon_all on public.samplesheet_entries;
create policy samplesheet_entries_anon_all
on public.samplesheet_entries
for all
to anon
using (true)
with check (true);

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.samplesheets to anon, authenticated, service_role;
grant select, insert, update, delete on table public.samplesheet_entries to anon, authenticated, service_role;
