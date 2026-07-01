.PHONY: frontend functions

functions:
	supabase functions serve

frontend:
	cd frontend && python3 -m http.server 8080
