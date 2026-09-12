# Raika Private Writers Room + AI Implementation Plan

> For agentic workers: implement task-by-task and verify each step.

**Goal:** Add private login, editable saved drafts with version history, and in-site AI consultation for Raika cards.

**Architecture:** GitHub Pages remains public. Supabase Auth protects private actions, Postgres stores overrides/versions/threads/messages, and a Supabase Edge Function calls OpenAI using a server-side secret. Public canon remains in `raika-data.js` and is never changed automatically.

**Tech Stack:** HTML/CSS/Vanilla JS, Supabase Auth/Postgres/Edge Functions, OpenAI Responses API.

**Spec:** `docs/superpowers/specs/2026-09-12-raika-private-writers-room-ai-design.md`

## Global Constraints
- Public reading remains available without login.
- Private edits, versions and AI require an authenticated authorized user.
- No secret or private allowlist value is stored in GitHub.
- AI output is always a proposal and never changes canon automatically.
- Promoting to canon requires explicit confirmation.

### Task 1: Database and RLS
- Create tables for active edits, version snapshots, AI threads and AI messages.
- Enable RLS and restrict all rows to `auth.uid()`.
- Add a private allowlist table used only by server-side authorization.
- Verify unauthenticated access is denied.

### Task 2: Private auth client
- Add `raika-private.js`.
- Initialize Supabase with public project URL and publishable key only.
- Add Magic Link sign-in, session state, sign-out and private-mode toggling.
- Load private overrides only when authenticated.

### Task 3: Editing and versions
- Add edit/save/cancel/status/version actions to writer cards.
- Save overrides to Supabase.
- Snapshot each prior saved state before replacement.
- Require explicit confirmation before status becomes `canon`.

### Task 4: AI consultation function
- Deploy `raika-consult` with JWT validation.
- Verify the caller against the private allowlist.
- Build a compact context from the current item, related characters, plotlines, nearby scenes and recent messages.
- Call OpenAI using a server-side `OPENAI_API_KEY` secret.
- Persist both user and assistant messages.

### Task 5: AI chat UI
- Add `raika-ai.js` and an in-card consultation drawer.
- Load saved threads/messages per item.
- Support: copy to draft, replace edited text, save as new idea, or keep as consultation only.

### Task 6: Verification and publish
- Verify public browsing still works without auth.
- Verify private write endpoints reject unauthenticated access.
- Verify saving creates restorable versions.
- Verify AI cannot run without auth and does not mutate canon automatically.
- Merge the feature branch only after checks pass.
