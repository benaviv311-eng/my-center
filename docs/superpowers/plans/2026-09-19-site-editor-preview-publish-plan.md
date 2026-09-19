# Site Editor Preview and Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automated validation, safe branch previews, exact-SHA publish approvals, merge/deploy monitoring, and stale-plan protection.

**Architecture:** GitHub Actions validates every `site-edit/**` branch. A read-only `site-preview` Edge Function obtains branch files through a signed internal read route on `site-editor`. Publishing is controlled by risk level and exact approved branch SHA, then confirmed by GitHub Pages deployment status.

**Tech Stack:** GitHub Actions, GitHub REST API, Supabase Edge Functions, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-19-site-editor-through-chat-design.md`

## Global Constraints

- Red checks block merge.
- Low risk may auto-merge after plan approval and passing checks.
- Medium/high risk requires preview plus explicit publish approval.
- Approval records the exact branch head SHA; changed head invalidates approval.
- Preview has no GitHub write credential and never registers a service worker.
- Production is reported successful only after GitHub Pages deployment succeeds.

## Review Focus

- A new commit pushed after publish approval must invalidate that approval.
- Preview asset paths must stay inside preview instead of loading production JS/CSS accidentally.
- A failed Pages deployment after merge must show `deploying/failed`, not `deployed`.
- A cancelled/expired preview token must return 404/410 without leaking branch data.
- Validation workflow must reject committed secret-like files before merge.

---

### Task 1: Add Site Editor validation workflow

**Files:**
- Create: `.github/workflows/site-editor-validation.yml`
- Create: `scripts/site-editor-policy-check.mjs`
- Create: `tests/site-editor-publish.test.js`

**Interfaces:**
- Trigger: push on `site-edit/**`.
- Workflow name: `Site Editor Validation`.

- [ ] **Step 1: Write failing tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('site editor validation runs read-only checks on edit branches',()=>{
  const yml=read('.github/workflows/site-editor-validation.yml');
  assert.match(yml,/site-edit\/\*\*/);
  assert.match(yml,/permissions:\s*\n\s*contents:\s*read/);
  assert.match(yml,/node --test tests\/\*\.test\.js/);
  assert.match(yml,/site-editor-policy-check\.mjs/);
  assert.doesNotMatch(yml,/contents:\s*write/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: FAIL because workflow/script are missing.

- [ ] **Step 3: Implement workflow**

Use `actions/checkout@v4`, `actions/setup-node@v4` with Node 24, and `permissions: contents: read`. Fetch enough history to diff against `main`.

Run:
```bash
node scripts/site-editor-policy-check.mjs
node --check site-chat.js
node --check site-editor-ui.js
node --test tests/*.test.js
```

The policy script computes changed paths against `origin/main`, rejects blocked secret-like file names, and scans newly added text for private-key headers.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/site-editor-validation.yml scripts/site-editor-policy-check.mjs tests/site-editor-publish.test.js
git commit -m "ci: validate site editor branches"
```

---

### Task 2: Record checks and enforce exact branch head

**Files:**
- Modify: `supabase/functions/_shared/site-editor/github.ts`
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `tests/site-editor-publish.test.js`

**Interfaces:**
- Add `githubChecksForRef(sha): Promise<Array<{name,status,conclusion,url}>>`.
- Add Site Editor action `refresh_status`.

- [ ] **Step 1: Add failing tests**

```js
test('publish status is tied to the exact approved head sha',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(gh,/check-runs/);
  assert.match(fn,/refresh_status/);
  assert.match(fn,/approved_head_sha/);
  assert.match(fn,/stale_plan/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement check tracking**

`refresh_status`:
1. loads request;
2. verifies owner;
3. reads current branch head;
4. queries GitHub checks/workflow runs for that SHA;
5. upserts `site_edit_runs`;
6. transitions `testing → preview_ready` only when required checks are successful.

If a recorded approval SHA differs from current branch head, return `stale_plan` and remove publish eligibility.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/site-editor/github.ts supabase/functions/site-editor/index.ts tests/site-editor-publish.test.js
git commit -m "feat: track site editor validation checks"
```

---

### Task 3: Build read-only preview service

**Files:**
- Create: `supabase/functions/site-preview/index.ts`
- Modify: `supabase/functions/site-editor/index.ts`
- Create: `supabase/migrations/20260919_site_editor_preview.sql`
- Modify: `tests/site-editor-publish.test.js`

**Interfaces:**
- Preview token table stores `request_id, token_hash, expires_at, revoked_at`.
- `GET /functions/v1/site-preview/<token>/<path>`.
- Internal `site-editor` action `preview_read` requires header `x-site-editor-internal-secret`.

- [ ] **Step 1: Add failing tests**

```js
test('preview is tokenized read-only and cannot register a service worker',()=>{
  const preview=read('supabase/functions/site-preview/index.ts');
  const migration=read('supabase/migrations/20260919_site_editor_preview.sql');
  assert.match(migration,/token_hash/);
  assert.match(migration,/expires_at/);
  assert.match(preview,/Cache-Control/);
  assert.match(preview,/no-store/);
  assert.match(preview,/X-Robots-Tag/);
  assert.match(preview,/noindex/);
  assert.match(preview,/serviceWorker/);
  assert.match(preview,/x-site-editor-internal-secret/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement preview-token migration**

Create `site_edit_previews` with UUID id, request FK, token hash, expiry, revoke timestamp, created timestamp. Enable RLS. Client SELECT is allowed only through request ownership; client INSERT/UPDATE/DELETE is not allowed.

- [ ] **Step 4: Implement preview creation**

After checks are green, `create_preview` creates 32 random bytes, stores only SHA-256 hash, returns the raw token once in the preview URL, and stores branch/head in request/run metadata.

- [ ] **Step 5: Implement preview reads**

`site-preview` hashes token, validates active token, then calls the internal `site-editor preview_read` route with `SITE_EDITOR_INTERNAL_SECRET`. The internal route verifies request branch/head and reads only that repository file.

For HTML responses:
- inject a preview `<base>`;
- inject `noindex`;
- intercept `navigator.serviceWorker.register` so preview cannot register production SW;
- rewrite known `/my-center/` asset prefixes to preview-relative paths.

Use explicit MIME mappings for html/css/js/json/svg/png/jpg/jpeg/webp/gif/webmanifest.

- [ ] **Step 6: Run GREEN**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: PASS.

- [ ] **Step 7: Deploy and smoke-test**

Deploy both functions. Open a preview of a harmless branch and verify CSS/JS load from preview URLs and no service worker is registered.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/site-preview/index.ts supabase/functions/site-editor/index.ts supabase/migrations/20260919_site_editor_preview.sql tests/site-editor-publish.test.js
git commit -m "feat: add branch preview service"
```

---

### Task 4: Implement PR, publish approval, merge, and Pages monitoring

**Files:**
- Modify: `supabase/functions/_shared/site-editor/github.ts`
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `site-editor-ui.js`
- Modify: `tests/site-editor-publish.test.js`
- Modify: `tests/site-editor-ui.test.js`

**Interfaces:**
- GitHub helpers: `githubCreateOrUpdatePR`, `githubMergePR`, `githubPagesRunForSha`.
- API actions: `approve_publish`, `publish`, `refresh_status`.

- [ ] **Step 1: Add failing tests**

```js
test('medium and high risk require second approval while low risk can auto publish',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  assert.match(fn,/approve_publish/);
  assert.match(fn,/awaiting_publish_approval/);
  assert.match(fn,/risk_level\s*===\s*["']low["']/);
  assert.match(fn,/githubPagesRunForSha/);
  assert.match(fn,/deploying/);
  assert.match(fn,/deployed/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-publish.test.js tests/site-editor-ui.test.js`  
Expected: FAIL.

- [ ] **Step 3: Add PR audit trail**

After branch checks pass, create/update a PR targeting `main` for every request. Store `pr_number` in the request.

- [ ] **Step 4: Implement risk-based publication**

Low risk:
- plan approval SHA must equal branch head;
- validation green;
- merge without a second user click.

Medium/high:
- status `awaiting_publish_approval`;
- UI shows `פתח Preview`, `פרסם באתר`, `בקש תיקון`, `בטל`;
- `approve_publish` stores exact `approved_head_sha`;
- `publish` re-verifies head and checks before merge.

- [ ] **Step 5: Monitor production deployment**

After merge, store merge SHA and status `deploying`. Query GitHub Actions for the Pages run whose head SHA equals merge SHA. Only a completed/success run sets `deployed` and `published_at`. Failure leaves request failed/deploying with a safe message that production confirmation failed.

- [ ] **Step 6: Run GREEN**

Run: `node --test tests/site-editor-publish.test.js tests/site-editor-ui.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/site-editor/github.ts supabase/functions/site-editor/index.ts site-editor-ui.js tests/site-editor-publish.test.js tests/site-editor-ui.test.js
git commit -m "feat: publish validated site edits safely"
```

---

### Task 5: Add bounded automated repair loop

**Files:**
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `supabase/functions/_shared/site-editor/policy.ts`
- Modify: `tests/site-editor-publish.test.js`

**Interfaces:**
- Maximum automatic repair passes: 2.
- Repair may touch approved paths plus dependent test files only.
- Repair may not increase deterministic risk.

- [ ] **Step 1: Add failing tests**

```js
test('automatic repair is capped and cannot broaden risk silently',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  assert.match(fn,/repair_pass/);
  assert.match(fn,/>=\s*2/);
  assert.match(fn,/awaiting_plan_approval/);
  assert.match(fn,/risk/i);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-publish.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement repair**

On failed checks, pass only user goal, approved operations, changed files, and concise check failures to the strong editor model. Validate resulting operations normally.

If new operations touch unapproved non-test paths or promote risk, do not commit; create a revised proposal and return to `awaiting_plan_approval`.

- [ ] **Step 4: Run GREEN and full suite**

Run: `node --test tests/*.test.js`  
Expected: zero failures.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/site-editor/index.ts supabase/functions/_shared/site-editor/policy.ts tests/site-editor-publish.test.js
git commit -m "feat: add bounded site edit repair loop"
```
