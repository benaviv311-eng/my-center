# Site Editor Supabase and Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Safely support high-risk Supabase changes and reversible published edits without giving the live browser arbitrary SQL or destructive rollback powers.

**Architecture:** High-risk database/backend edits remain normal Git branches, but an explicitly approved GitHub Actions deployment applies additive migrations before code merge. Published source changes get rollback requests that reverse Git history only when safe; database rollback uses compensating migrations.

**Tech Stack:** GitHub Actions, Supabase CLI v2.117.0, Supabase migrations/Edge Functions, GitHub App API.

**Spec:** `docs/superpowers/specs/2026-09-19-site-editor-through-chat-design.md`

## Global Constraints

- Supabase migration/backend paths are always high risk.
- Production DB changes require explicit publish approval for the exact head SHA.
- No arbitrary SQL execution endpoint is exposed to the site.
- V1 only auto-deploys additive/backward-compatible migrations; destructive schema removal uses expand/contract in a later separate request.
- Database rollback is a compensating migration, never automatic reverse SQL.
- Source rollback never force-resets `main`.
- Supabase credentials live only in GitHub Secrets.

## Review Focus

- A migration containing DROP/TRUNCATE/destructive ALTER must be blocked from one-step deployment.
- DB deploy must verify the workflow input head SHA still matches the request branch.
- Migration failure must prevent merge of code that depends on it.
- Rollback after later edits touched the same file must propose a new patch instead of restoring an old blob blindly.
- Supabase secrets must stay in GitHub Secrets and never be echoed.

---

### Task 1: Classify and validate additive migrations

**Files:**
- Create: `scripts/site-editor-migration-check.mjs`
- Modify: `supabase/functions/_shared/site-editor/policy.ts`
- Create: `tests/site-editor-db.test.js`

**Interfaces:**
- Script reads changed migration files from `git diff --name-only origin/main...HEAD`.
- Exit 0 only for allowed additive SQL.

- [ ] **Step 1: Write failing tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('migration checker blocks destructive one-step SQL',()=>{
  const src=read('scripts/site-editor-migration-check.mjs');
  for(const marker of ['DROP TABLE','DROP COLUMN','TRUNCATE','ALTER COLUMN','DELETE FROM']) assert.ok(src.includes(marker));
  assert.match(src,/SET NOT NULL/);
  assert.match(src,/unsafe_migration/);
});

test('migration paths are always high risk',()=>{
  const policy=read('supabase/functions/_shared/site-editor/policy.ts');
  assert.match(policy,/supabase\/migrations/);
  assert.match(policy,/high/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-db.test.js`  
Expected: FAIL because the checker does not exist.

- [ ] **Step 3: Implement conservative SQL screening**

Strip line/block comments and normalize whitespace/case. Reject:
- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- `ALTER ... ALTER COLUMN ... TYPE`
- `ALTER ... SET NOT NULL`
- `DELETE FROM` without a `WHERE`
- `UPDATE` without a `WHERE` when used as a data migration
- `DROP POLICY` unless immediately paired with a replacement policy in the same migration and explicitly approved as high risk.

Allow additive forms such as:
- `CREATE TABLE IF NOT EXISTS`
- nullable `ADD COLUMN`
- `ADD COLUMN ... DEFAULT <constant>` when it is backward compatible
- `CREATE INDEX`
- policy creation/replacement
- additive functions/views that do not remove existing objects.

If uncertain, fail closed with `unsafe_migration`.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-db.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/site-editor-migration-check.mjs supabase/functions/_shared/site-editor/policy.ts tests/site-editor-db.test.js
git commit -m "feat: validate additive site editor migrations"
```

---

### Task 2: Add protected Supabase deployment workflow

**Files:**
- Create: `.github/workflows/site-editor-supabase-deploy.yml`
- Modify: `tests/site-editor-db.test.js`

**Interfaces:**
- Trigger: `workflow_dispatch` only.
- Inputs: `request_id`, `branch`, `head_sha`.
- Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.
- CLI pinned to `supabase@2.117.0`.

- [ ] **Step 1: Add failing workflow tests**

```js
test('supabase deployment is manual exact-sha and pinned',()=>{
  const yml=read('.github/workflows/site-editor-supabase-deploy.yml');
  assert.match(yml,/workflow_dispatch/);
  for(const input of ['request_id','branch','head_sha']) assert.ok(yml.includes(input));
  assert.match(yml,/supabase@2\.117\.0/);
  assert.match(yml,/site-editor-migration-check\.mjs/);
  assert.doesNotMatch(yml,/pull_request:/);
  assert.doesNotMatch(yml,/push:/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-db.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement workflow**

Use a read-only checkout of the requested branch. Before any Supabase command:

```bash
set -euo pipefail
test "$(git rev-parse HEAD)" = "${{ inputs.head_sha }}"
node scripts/site-editor-migration-check.mjs
```

Then run:

```bash
npx supabase@2.117.0 link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"
npx supabase@2.117.0 db push --linked -p "$SUPABASE_DB_PASSWORD"
```

Set the secrets through `env:`; never echo them. Set job permissions to `contents: read`.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-db.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/site-editor-supabase-deploy.yml tests/site-editor-db.test.js
git commit -m "ci: add approved Supabase edit deployment"
```

---

### Task 3: Gate high-risk publish on database deployment

**Files:**
- Modify: `supabase/functions/_shared/site-editor/github.ts`
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `tests/site-editor-db.test.js`

**Interfaces:**
- Add `githubDispatchWorkflow(workflowFile, inputs): Promise<number>`.
- Migration-bearing high-risk request creates a `db_deploy` run before PR merge.

- [ ] **Step 1: Add failing tests**

```js
test('migration requests cannot merge before db deploy succeeds',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  assert.match(fn,/site-editor-supabase-deploy\.yml/);
  assert.match(fn,/db_deploy/);
  assert.match(fn,/head_sha/);
  assert.match(fn,/success/);
  assert.match(fn,/githubMergePR/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-db.test.js`  
Expected: FAIL.

- [ ] **Step 3: Dispatch exact approved migration**

After explicit publish approval:
1. verify approved head SHA equals current branch head;
2. detect migration files;
3. dispatch `site-editor-supabase-deploy.yml` with request id, branch, and exact head SHA;
4. store workflow run metadata;
5. keep PR unmerged.

- [ ] **Step 4: Gate merge**

If DB workflow fails, set request `failed` with a safe message and leave PR unmerged.

If it succeeds, run a service-role health query such as `select now()` through Supabase client, record success, then continue normal PR merge and Pages monitoring.

When the connected Supabase management tooling is available during operator verification, run security/performance advisors after deployment and record any new Site Editor-specific findings before declaring the phase complete.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-db.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/site-editor/github.ts supabase/functions/site-editor/index.ts tests/site-editor-db.test.js
git commit -m "feat: gate site publish on database deployment"
```

---

### Task 4: Generate safe source rollback requests

**Files:**
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `supabase/functions/_shared/site-editor/github.ts`
- Modify: `site-editor-ui.js`
- Modify: `tests/site-editor-db.test.js`

**Interfaces:**
- API action: `create_rollback {request_id}`.
- New request stores `undo_of_request_id`.

- [ ] **Step 1: Add failing rollback tests**

```js
test('rollback creates a new request and never force resets main',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/create_rollback/);
  assert.match(fn,/undo_of_request_id/);
  assert.match(fn,/awaiting_plan_approval/);
  assert.doesNotMatch(gh,/force\s*:\s*true/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-db.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement safe rollback planning**

For a deployed request:
- load the merge commit diff;
- compare every affected production file with the result that request published;
- if unchanged, construct reverse exact-match operations;
- if changed later, ask the strong editor model to create a rollback proposal against current `main`, then validate it with the normal operation/risk engine;
- create a new request with `undo_of_request_id`;
- never mutate `main` directly.

UI shows `החזר שינוי` only for deployed requests.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-db.test.js tests/site-editor-ui.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/site-editor/index.ts supabase/functions/_shared/site-editor/github.ts site-editor-ui.js tests/site-editor-db.test.js
git commit -m "feat: add safe site edit rollback requests"
```

---

### Task 5: Require compensating migrations for database rollback

**Files:**
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `tests/site-editor-db.test.js`

**Interfaces:**
- Rollback of a request touching `supabase/migrations/**` always creates a new high-risk proposal.

- [ ] **Step 1: Add failing test**

```js
test('database rollback is compensating and never automatic reverse SQL',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  assert.match(fn,/compensating/i);
  assert.match(fn,/risk_level.*high/i);
  assert.match(fn,/awaiting_plan_approval/);
  assert.doesNotMatch(fn,/reverseSql|autoReverseMigration/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-db.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement compensating-migration proposal**

Summarize the original migration and current schema context for the strong editor model. Require a new additive migration file with a new timestamp/name, validate it with `site-editor-migration-check.mjs`, classify high risk, and stop at `awaiting_plan_approval`.

Do not apply or merge it automatically.

- [ ] **Step 4: Run GREEN and full suite**

Run: `node --test tests/*.test.js`  
Expected: zero failures.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/site-editor/index.ts tests/site-editor-db.test.js
git commit -m "feat: make database rollback compensating and approval gated"
```
