drop policy if exists samplesheets_anon_all on public.samplesheets;
drop policy if exists samplesheet_entries_anon_all on public.samplesheet_entries;

create policy samplesheets_authenticated_read
on public.samplesheets
for select
to authenticated
using (true);

create policy samplesheets_authenticated_insert
on public.samplesheets
for insert
to authenticated
with check (created_by = auth.uid());

create policy samplesheets_authenticated_update
on public.samplesheets
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy samplesheets_authenticated_delete
on public.samplesheets
for delete
to authenticated
using (created_by = auth.uid());

create policy samplesheet_entries_authenticated_read
on public.samplesheet_entries
for select
to authenticated
using (true);

create policy samplesheet_entries_authenticated_insert
on public.samplesheet_entries
for insert
to authenticated
with check (created_by = auth.uid());

create policy samplesheet_entries_authenticated_update
on public.samplesheet_entries
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy samplesheet_entries_authenticated_delete
on public.samplesheet_entries
for delete
to authenticated
using (created_by = auth.uid());

revoke all on table public.samplesheets from anon;
revoke all on table public.samplesheet_entries from anon;

grant select, insert, update, delete on table public.samplesheets to authenticated, service_role;
grant select, insert, update, delete on table public.samplesheet_entries to authenticated, service_role;
