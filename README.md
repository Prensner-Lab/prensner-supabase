# HTMX + Supabase Data Entry MVP

Single-page static HTMX app for browsing, creating, updating, deleting, and filtering sequencing run metadata. Supabase Edge Functions return HTML fragments for HTMX swaps.

## Data fields

- run_id
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

- `list-runs`
- `row-fragment`
- `create-run`
- `update-run`
- `delete-run`

## Production notes

- Current policy allows anonymous all-access for MVP internal use only.
- Replace with authenticated policies before wider release.
- Keep function responses as `text/html` for HTMX compatibility.
