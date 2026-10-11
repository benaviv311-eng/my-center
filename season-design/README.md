# SeasonDesign

SeasonDesign is a standalone volleyball coaching application for planning practices and seasons. It lives inside the `my-center` repository, but it is deployed and operated as an independent Next.js application.

## Stack

- Next.js + TypeScript
- Supabase Auth + PostgreSQL
- Google sign-in
- Supabase Row Level Security
- Serwist PWA shell
- Vitest + Playwright

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Configure a Supabase project and add the public URL/key plus the server service-role key.
3. Set `SEASON_DESIGN_ALLOWED_EMAILS` to a comma-separated invite list for V1 private access.
4. Enable Google as an OAuth provider in Supabase and add the local callback URL `/auth/callback`.
5. Install dependencies with `npm install`.
6. Run `supabase start` and `supabase db reset` for the local database.
7. Run `npm run dev`.

## Validation

- `supabase test db`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`

## Deployment

Create a Vercel project whose Root Directory is `season-design`. Add the four environment variables from `.env.example`, configure the production Supabase Google OAuth redirect to the deployed `/auth/callback`, and keep the Supabase service-role key server-only.

## Foundation scope

The foundation slice includes the installable RTL shell, Google authentication, invite gating, RLS-protected coach data, saved groups, and approved skill levels per group. Later plans add the synchronized exercise library, practice generator, adaptive programs/feedback, and Coach Draft.
