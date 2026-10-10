# Authentication boundary

`SEASON_DESIGN_ALLOWED_EMAILS` is server-only and accepts comma, semicolon, or newline-separated email addresses. Never expose it through a `NEXT_PUBLIC_` variable.

The browser receives only the Supabase project URL and publishable key. Profile activation uses the server-only service-role key after a successful Google OAuth callback and allowlist check.
