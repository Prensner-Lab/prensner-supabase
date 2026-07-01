# HTMX + Supabase Data Entry MVP

Single-page static HTMX app for browsing, creating, updating, and filtering sequencing run metadata, plus additive samplesheet containers. Supabase Edge Functions return HTML fragments for HTMX swaps.

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

## Structure

- `public/` static site (`index.html`, `styles.css`, `app.js`)
- `supabase/migrations/` DB schema and RLS policy migrations
- `supabase/functions/` HTML fragment edge endpoints

## Database objects

- `public.samplesheets` table stores top-level samplesheet metadata.
- `public.samplesheet_entries` remains in place and now includes required `samplesheet_id`.

## Local setup

1. Install Supabase CLI.
2. Start local Supabase services:
   - `supabase start`
3. Apply migrations:
   - `supabase db reset`
4. Set edge function secrets:
   - `supabase secrets set SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<service_role_key>`
5. Serve static site from `public/` (example):
   - `cd public && python3 -m http.server 8080`
6. Open:
   - `http://127.0.0.1:8080`

## Edge functions

Deploy locally after editing:

- `supabase functions serve --no-verify-jwt`

Endpoints:

- `list-samplesheets`
- `get-samplesheet`
- `row-fragment`
- `update-samplesheet-entry`

## Production notes

- Auth model is invite-only using Supabase Auth. Self-signup is disabled.
- All authenticated users can read all records.
- Updates are owner-locked by `created_by = auth.uid()`.
- Keep function responses as `text/html` for HTMX compatibility.

## Auth rollout notes

- Run edge functions with JWT verification enabled:
   - `supabase functions serve`
- To create new users, use Supabase invite flow from dashboard or admin APIs.
- Existing seed rows with null ownership are read-only to normal users by design.
