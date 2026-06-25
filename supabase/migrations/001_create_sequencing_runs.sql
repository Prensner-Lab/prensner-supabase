create extension if not exists pgcrypto;

create table if not exists public.samplesheet_entries (
  id uuid primary key default gen_random_uuid(),
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
create index if not exists samplesheet_entries_smart_id_idx on public.samplesheet_entries (smart_id);
create index if not exists samplesheet_entries_species_idx on public.samplesheet_entries (species);
create index if not exists samplesheet_entries_data_type_idx on public.samplesheet_entries (data_type);
create index if not exists samplesheet_entries_batch_date_idx on public.samplesheet_entries (batch_date);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists samplesheet_entries_touch_updated_at on public.samplesheet_entries;
create trigger samplesheet_entries_touch_updated_at
before update on public.samplesheet_entries
for each row
execute procedure public.touch_updated_at();
