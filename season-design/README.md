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

Deploy through the repository-root `render.yaml` Blueprint on `main` (service branch: `feature/season-design-library-sync`, root directory: `season-design`). Build with `npm install --global npm@11.19.1 && npm --version && npm install --no-audit --no-fund && npm run build` to avoid the npm 10 `edgesOut` peer-resolution crash observed in Render; `npm ci` cannot work until `season-design/package-lock.json` is committed. In Render, securely enter `SEASON_DESIGN_ALLOWED_EMAILS` and `SUPABASE_SERVICE_ROLE_KEY` (never in GitHub/chat), sync the Blueprint and check the deployed `/api/health` endpoint. Enable Google Auth and allow `https://seasondesign.onrender.com/auth/callback` in Supabase Authentication URL Configuration. Do not call the site live until Render reports a healthy deploy.

## Foundation scope

The foundation slice includes the installable RTL shell, Google authentication, invite gating, RLS-protected coach data, saved groups, and approved skill levels per group. Later plans add the synchronized exercise library, practice generator, adaptive programs/feedback, and Coach Draft.
