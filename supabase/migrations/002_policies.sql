alter table public.samplesheet_entries enable row level security;

-- Temporary MVP policy for internal anonymous usage.
-- Replace with authenticated user/team-scoped policies before broader deployment.
drop policy if exists samplesheet_entries_anon_all on public.samplesheet_entries;
create policy samplesheet_entries_anon_all
on public.samplesheet_entries
for all
to anon
using (true)
with check (true);
