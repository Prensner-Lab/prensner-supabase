.PHONY: frontend functions db-reset-dev db-reset-prodlike db-migrations

functions:
	supabase functions serve

frontend:
	cd frontend && python3 -m http.server 8080

db-reset-dev:
	supabase db reset

db-reset-prodlike:
	supabase db reset --no-seed

db-migrations:
	supabase migration list
