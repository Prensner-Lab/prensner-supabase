alter table public.sequencing_runs enable row level security;

-- Temporary MVP policy for internal anonymous usage.
-- Replace with authenticated user/team-scoped policies before broader deployment.
drop policy if exists sequencing_runs_anon_all on public.sequencing_runs;
create policy sequencing_runs_anon_all
on public.sequencing_runs
for all
to anon
using (true)
with check (true);
