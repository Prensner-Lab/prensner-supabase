alter table public.samplesheets
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.samplesheet_entries
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.samplesheets
  alter column created_by set default auth.uid();

alter table public.samplesheet_entries
  alter column created_by set default auth.uid();

create index if not exists samplesheets_created_by_idx
  on public.samplesheets (created_by);

create index if not exists samplesheet_entries_created_by_idx
  on public.samplesheet_entries (created_by);
