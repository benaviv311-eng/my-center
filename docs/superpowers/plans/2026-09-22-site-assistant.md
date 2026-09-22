# Site Assistant Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: use superpowers:executing-plans task-by-task.

Goal: Make the existing in-site assistant operational across the main site and complete the approval-gated GitHub publish flow.

Architecture: Reuse the existing chat/editor frontend, Supabase tables, and Edge Function source. Add one global bootstrap through app.js, complete exact-SHA publication, deploy the three Edge Functions, then verify the live site.

Tech Stack: Static HTML/CSS/JavaScript, Node 24 tests, Supabase Auth/Postgres/Storage/Edge Functions, OpenAI Responses API, GitHub App + REST API, GitHub Actions, GitHub Pages.

Spec: docs/superpowers/specs/2026-09-22-site-assistant-design.md

## Global Constraints
- Never expose OpenAI, Supabase service-role, or GitHub App secrets to browser code.
- Never force-update main.
- Publication requires explicit user approval and an exact validated branch head.
- If main or the edit branch moved unexpectedly, return stale-plan.
- Reuse existing site_chat_* and site_edit_* tables.
- Preserve existing standalone direct includes.

## Review Focus
- Duplicate bootstrap must not create two FABs or duplicate editor controls.
- Unauthenticated users must see login, not privileged data.
- Stale branch/main SHAs must block publication.
- Failed or pending validation must never expose publish.
- GitHub Pages failure must not be reported as deployed.

### Task 1: Global bootstrap coverage
Files: tests/site-chat.test.js, app.js
- [ ] Add failing tests requiring app.js to load chat and editor assets idempotently.
- [ ] Run tests and confirm RED.
- [ ] Implement minimal loader.
- [ ] Run targeted tests and syntax checks.
- [ ] Commit.

### Task 2: Exact-SHA publish backend
Files: tests/site-editor-publish.test.js, supabase/functions/_shared/site-editor/github.ts, supabase/functions/site-editor/index.ts
- [ ] Add failing tests for approve_publish, exact branch/main checks, merge endpoint, and deploy transition.
- [ ] Run tests and confirm RED.
- [ ] Add GitHub helper for safe merge without force.
- [ ] Add approve_publish and deployment status handling.
- [ ] Run editor tests and syntax checks.
- [ ] Commit.

### Task 3: Publish controls in the drawer
Files: tests/site-editor-ui.test.js, site-editor-ui.js, site-editor-ui.css
- [ ] Add failing UI tests for publish button and deployed state.
- [ ] Run tests and confirm RED.
- [ ] Render "אשר פרסום" only after validation/preview readiness.
- [ ] Poll through merging/deploying and stop at deployed.
- [ ] Run UI/chat tests.
- [ ] Commit.

### Task 4: Deploy Edge Functions
- [ ] Deploy site-chat with JWT verification enabled.
- [ ] Deploy site-editor with JWT verification enabled.
- [ ] Deploy site-preview with JWT verification disabled because it performs its own expiring token validation.
- [ ] Confirm all are active and required DB/storage exists.

### Task 5: Verification and integration
- [ ] Run full Node suite through GitHub Actions.
- [ ] Verify specific checks.
- [ ] Review diff for secrets/unintended changes.
- [ ] Open PR to main and merge only after green checks.
- [ ] Verify GitHub Pages deployment and live assets.