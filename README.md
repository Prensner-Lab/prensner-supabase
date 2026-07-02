# HTMX + Supabase Data Entry MVP

Static HTMX frontend for unified dashboard access to sequencing metadata and technician-facing project sample tracking. Supabase Edge Functions return HTML fragments for HTMX swaps.

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

- `frontend/` static site (`index.html`, `styles.css`, `app.js`)
- `supabase/migrations/` DB schema and RLS policy migrations
- `supabase/migrations_legacy/` archived pre-baseline migration chain (kept for history)
- `supabase/seed.sql` dev-only sample/demo data loaded by `supabase db reset`
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
   - This applies `supabase/migrations/001_baseline.sql` and then loads `supabase/seed.sql`.
4. Set edge function secrets:
   - `supabase secrets set SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=<anon_key>`
5. Serve static site from `frontend/` (example):
   - `cd frontend && python3 -m http.server 8080`
6. Open:
   - `http://127.0.0.1:8080/index.html` for the dashboard

## Edge functions

Deploy locally after editing:

- `supabase functions serve`

These functions use the caller's bearer token plus the anon key to create a scoped Supabase client. They do not use the service role key.

Endpoints:

- `list-samplesheets`
- `get-samplesheet`
- `list-projects`
- `list-project-samples`
- `get-dashboard`
- `get-sample-status-modal`
- `add-sample-status-update`

## Production notes

- Production schema is managed by the baseline migration only.
- Demo/sample data is intentionally not stored in migration files, so `supabase db push` does not insert seed data.
- Keep `supabase/seed.sql` for local/dev reset workflows only.
- Before first production cutover, deploy to a separate dry-run Supabase project and validate auth + RLS behavior.

- Auth model is invite-only using Supabase Auth. Self-signup is disabled.
- Internal users can read all projects, samples, and samplesheets.
- External users are read-only and can see only granted projects and their samples.
- Samplesheets are internal-only. External samplesheet list requests return empty results and samplesheet detail requests return 404.
- Status updates remain internal-only for writes.
- Keep function responses as `text/html` for HTMX compatibility.

## GitHub Pages deployment

Frontend hosting is automated by `.github/workflows/deploy-pages.yml`.

Required repository variables:

- `SUPABASE_URL`: your cloud project URL, e.g. `https://<project-ref>.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: cloud anon/publishable key
- `FUNCTIONS_BASE` (optional): override edge base URL. If omitted, workflow uses `${SUPABASE_URL}/functions/v1`.

Workflow behavior:

1. On push to `main`, build runtime `frontend/config.js` from repo variables.
2. Publish the `frontend/` directory to GitHub Pages.

Necessary server configurations:

- Enable GitHub Pages source as GitHub Actions in repository settings.
- Add `https://prensner-lab.github.io` to allowed origins/CORS in Supabase.

To run a gated rollout: create a backup, run `supabase db push --dry-run`, then apply `supabase db push`.

For a full first-deploy checklist (dry-run and production), see `DEPLOYMENT.md`.

## Unified dashboard behavior

- Successful auth auto-loads dashboard cards.
- Dashboard cards include projects for all signed-in users (subject to access policy) and samplesheets for internal users.
- Left nav is in-session recent history and can contain both projects and samplesheets.
- Selecting a project shows that cohort's samples; selecting `All` shows accessible samples across projects.
- Each sample row displays sample name and latest status.

## Internal access model

- `public.user_profiles` stores per-user fields: `display_name`, `is_internal`.
- Only users with `is_internal = true` can insert rows into `sample_status_updates`.
- Status timeline modal is visible to users with access to the sample's project; only internal users can submit updates.
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
