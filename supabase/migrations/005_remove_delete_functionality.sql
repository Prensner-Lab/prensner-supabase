drop policy if exists samplesheets_authenticated_delete on public.samplesheets;
drop policy if exists samplesheet_entries_authenticated_delete on public.samplesheet_entries;

revoke delete on table public.samplesheets from anon, authenticated, service_role;
revoke delete on table public.samplesheet_entries from anon, authenticated, service_role;
