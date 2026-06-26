.PHONY: frontend

functions:
	supabase functions serve --no-verify-jwt

frontend:
	cd app && python3 -m http.server 8080
