# HTMX + Supabase Data Entry MVP

Static HTMX frontend for browsing sequencing metadata and technician-facing project sample tracking. Supabase Edge Functions return HTML fragments for HTMX swaps.

## Data fields

Samplesheet metadata (container):

- pi_name
- date
- submitter_name
- submitter_email
- project_id
- project_title
- experiment_type
- project_description
- filename

Samplesheet entry fields:

- run_id
- samplesheet_id (required link to `samplesheets.id`)
- smart_id
- data_type
- species
- sample_type
- source_id
- is_paired_end
- read_end
- replicate_num
- test_or_control
- location_id
- disease_id
- treatment_id
- genetic_factors
- sequencing_instrument
- batch_date
- description

Project sample tracking fields:

- Projects (`public.projects`): code, title, description
- Project samples (`public.project_samples`): name, tissue_type, library_type, source
- Sample status updates (`public.sample_status_updates`): status values are `not started`, `in progress`, `data generated`, `failed`
- User profile access gate (`public.user_profiles`): boolean `is_internal` controls who can add status updates

## Structure

- `frontend/` static site (`index.html`, `projects.html`, `styles.css`, `app.js`)
- `supabase/migrations/` DB schema and RLS policy migrations
- `supabase/functions/` HTML fragment edge endpoints

## Database objects

- `public.samplesheets` table stores top-level samplesheet metadata.
- `public.samplesheet_entries` remains in place and now includes required `samplesheet_id`.
- `public.projects` stores sequencing cohorts for technician tracking.
- `public.project_samples` stores sample-level constants for each project.
- `public.sample_status_updates` stores append-only status history for samples.
- `public.project_samples_latest_status` view returns one row per sample with latest status.

## Local setup

1. Install Supabase CLI.
2. Start local Supabase services:
   - `supabase start`
3. Apply migrations:
   - `supabase db reset`
4. Set edge function secrets:
   - `supabase secrets set SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=<anon_key>`
5. Serve static site from `frontend/` (example):
   - `cd frontend && python3 -m http.server 8080`
6. Open:
   - `http://127.0.0.1:8080/index.html` for samplesheets
   - `http://127.0.0.1:8080/projects.html` for project sample tracking

## Edge functions

Deploy locally after editing:

- `supabase functions serve`

These functions use the caller's bearer token plus the anon key to create a scoped Supabase client. They do not use the service role key.

Endpoints:

- `list-samplesheets`
- `get-samplesheet`
- `list-projects`
- `list-project-samples`
- `get-sample-status-modal`
- `add-sample-status-update`

## Production notes

- Auth model is invite-only using Supabase Auth. Self-signup is disabled.
- All authenticated users can read all records.
- Updates are owner-locked by `created_by = auth.uid()`.
- Keep function responses as `text/html` for HTMX compatibility.

## Project tracking page behavior

- Left nav lists `All` plus each project.
- Selecting a project shows only that cohort's samples.
- Selecting `All` shows samples across all projects.
- Each sample row displays the sample name and latest status.
- Status history already exists in `sample_status_updates` and can power a future pop-up/timeline view.

## Internal access model

- `public.user_profiles` stores per-user fields: `display_name`, `is_internal`.
- Only users with `is_internal = true` can insert rows into `sample_status_updates`.
- Status timeline modal endpoint is restricted to internal users.
- For local testing, each user should create/update their own profile row after sign-in.

Example SQL (run as admin):

```sql
insert into public.user_profiles (id, display_name, is_internal)
values ('<auth_user_uuid>', 'Lab Tech', true)
on conflict (id) do update
set display_name = excluded.display_name,
    is_internal = excluded.is_internal,
    updated_at = now();
```

## Auth rollout notes

- Run edge functions with JWT verification enabled:
   - `supabase functions serve`
- The browser still sends the publishable key in the `apikey` header because the local gateway requires it, but row-level access is enforced by the signed-in user's JWT.
- To create new users, use Supabase invite flow from dashboard or admin APIs.
- Existing seed rows with null ownership are read-only to normal users by design.
