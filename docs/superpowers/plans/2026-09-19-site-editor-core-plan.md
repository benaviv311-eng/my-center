# Site Editor Core Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated, approval-gated backend that turns a chat edit request into a validated GitHub branch commit without exposing repository credentials to the browser.

**Architecture:** Add private Site Editor persistence in Supabase, a dedicated `site-editor` Edge Function, and focused shared modules for owner authorization, GitHub App authentication, edit validation, and deterministic risk classification. The first milestone stops after creating a tested edit branch; production merge/preview belongs to the later publish plan.

**Tech Stack:** Supabase Postgres/RLS, Supabase Edge Functions (Deno), OpenAI Responses API through existing server-side credentials, GitHub REST/Git Data APIs, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-19-site-editor-through-chat-design.md`

## Global Constraints

- The browser never receives GitHub or Supabase management credentials.
- Every source edit uses a dedicated `site-edit/**` branch.
- The model proposes operations; the server validates and executes them.
- Exact-match edits carry `expected_sha` and stale plans must stop instead of overwriting newer code.
- Only users present in `public.app_owners` may create or approve source edits.
- All new public tables have RLS enabled; browser roles may read their own rows but may not directly mutate edit state.
- No arbitrary shell commands, arbitrary SQL endpoint, force-push, secret editing, repository deletion, or project deletion.
- Sensitive paths such as `.env*`, private keys, credentials, and secret exports are blocked from model context and edits.

## Review Focus

- An approved plan whose file SHA changed before execution must become `needs_replan`, not overwrite the file.
- A non-owner with a valid Supabase session must receive 403 for every Site Editor mutation.
- A model plan containing a blocked path or unknown operation must be rejected before GitHub mutation.
- A request with more than 10 modified files or a sensitive path must be promoted to high risk even if the model labels it low risk.
- A GitHub App installation-token failure must leave the request unmodified or failed with a safe user-facing code, never leak provider details.

---

### Task 1: Persist Site Editor requests with read-only client RLS

**Files:**
- Create: `supabase/migrations/20260919_site_editor_core.sql`
- Modify: `tests/site-chat.test.js`

**Interfaces:**
- Consumes: existing `auth.users`, `site_chat_threads`, and `app_owners`.
- Produces: tables `site_edit_requests`, `site_edit_operations`, `site_edit_approvals`, `site_edit_runs`, `site_edit_events`.

- [ ] **Step 1: Write the failing schema test**

Append:

```js
test('site editor schema is owner-readable and client-write-closed', () => {
  const sql = read('supabase/migrations/20260919_site_editor_core.sql');
  for (const table of ['site_edit_requests','site_edit_operations','site_edit_approvals','site_edit_runs','site_edit_events']) {
    assert.match(sql, new RegExp('create table if not exists public\\.' + table, 'i'));
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security', 'i'));
  }
  assert.match(sql, /for select\s+to authenticated/i);
  assert.doesNotMatch(sql, /for all\s+to authenticated/i);
  assert.match(sql, /risk_level text not null check \(risk_level in \('low','medium','high'\)\)/i);
  assert.match(sql, /status text not null/i);
  assert.match(sql, /approved_head_sha/i);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-chat.test.js`  
Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Create the migration**

Create UUID-keyed tables with:
- `site_edit_requests(user_id, thread_id, prompt, area, page_context, selected_element, summary, risk_level, status, base_sha, branch_name, head_sha, pr_number, merge_commit_sha, deploy_status, undo_of_request_id, created_at, updated_at, published_at)`.
- `site_edit_operations(request_id, sequence, operation_type, path, expected_sha, payload, diff_summary, status)`.
- `site_edit_approvals(request_id, user_id, stage, decision, approved_head_sha, created_at)`.
- `site_edit_runs(request_id, kind, provider_run_id, status, url, details, started_at, finished_at)`.
- `site_edit_events(request_id, user_id, event_type, details, created_at)`.

Use status checks exactly from the spec lifecycle and risk check `low|medium|high`. Add FK indexes. Enable RLS. Add only SELECT policies for authenticated users using `(select auth.uid()) = user_id` directly on requests and via request ownership subqueries on child tables.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-chat.test.js`  
Expected: PASS.

- [ ] **Step 5: Apply migration to the project and verify**

Run through the Supabase migration tool, then query `pg_policies` and `pg_class.relrowsecurity`.  
Expected: all five tables have RLS; only SELECT policies exist for authenticated browser users.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260919_site_editor_core.sql tests/site-chat.test.js
git commit -m "feat: add site editor request schema"
```

---

### Task 2: Add shared owner authorization and safe error contracts

**Files:**
- Create: `supabase/functions/_shared/site-editor/auth.ts`
- Create: `supabase/functions/_shared/site-editor/errors.ts`
- Create: `tests/site-editor-core.test.js`

**Interfaces:**
- Consumes: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, bearer access token.
- Produces: `requireOwner(req): Promise<{id:string}>`, `EditorError(code,status,message)`, `safeEditorError(error)`.

- [ ] **Step 1: Write failing source-contract tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p,'utf8');

test('site editor authenticates with auth.getUser and checks app_owners', () => {
  const src = read('supabase/functions/_shared/site-editor/auth.ts');
  assert.match(src,/auth\.getUser/);
  assert.match(src,/from\("app_owners"\)/);
  assert.match(src,/owner_required/);
});

test('site editor errors expose stable codes but not provider messages', () => {
  const src = read('supabase/functions/_shared/site-editor/errors.ts');
  assert.match(src,/editor_unavailable/);
  assert.match(src,/owner_required/);
  assert.match(src,/stale_plan/);
  assert.match(src,/unsafe_plan/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-core.test.js`  
Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement minimal modules**

`requireOwner` must:
1. parse bearer token;
2. create anon Supabase client with Authorization header;
3. call `auth.getUser(token)`;
4. query `app_owners` using the service-role client for that `user.id`;
5. throw `EditorError('owner_required',403,'אין הרשאת עריכת אתר.')` if absent.

`safeEditorError` returns only stable `{code,error}` pairs; raw exceptions are logged server-side only.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-core.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/site-editor tests/site-editor-core.test.js
git commit -m "feat: guard site editor with owner auth"
```

---

### Task 3: Build GitHub App client and atomic branch commit helper

**Files:**
- Create: `supabase/functions/_shared/site-editor/github.ts`
- Modify: `tests/site-editor-core.test.js`

**Interfaces:**
- Consumes: `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`.
- Produces:
  - `githubReadFile(path, ref): Promise<{path,sha,content}>`
  - `githubTree(ref): Promise<Array<{path,type,sha}>>`
  - `githubCreateEditBranch(name, baseSha): Promise<void>`
  - `githubCommitFiles(branch, parentSha, message, files): Promise<{commitSha:string}>`
  - `githubBranchHead(branch): Promise<string>`

- [ ] **Step 1: Add failing tests**

```js
test('github helper uses GitHub App installation tokens and atomic git commits', () => {
  const src = read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(src,/GITHUB_APP_PRIVATE_KEY/);
  assert.match(src,/\/app\/installations\/.*\/access_tokens/);
  assert.match(src,/\/git\/blobs/);
  assert.match(src,/\/git\/trees/);
  assert.match(src,/\/git\/commits/);
  assert.match(src,/refs\/heads/);
  assert.doesNotMatch(src,/force\s*:\s*true/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-core.test.js`  
Expected: FAIL on missing GitHub helper.

- [ ] **Step 3: Implement GitHub App auth**

Create a short-lived RS256 app JWT with WebCrypto, exchange it for an installation token, cache the token in memory until 60 seconds before expiry, and send requests with `Accept: application/vnd.github+json` and a fixed GitHub API version header.

Normalize `GITHUB_APP_PRIVATE_KEY` by replacing literal `\\n` with newline before importing PKCS#8.

- [ ] **Step 4: Implement atomic Git Data commit**

For `githubCommitFiles`:
1. verify current branch head equals `parentSha`;
2. fetch parent commit/tree;
3. create blobs for all changed file contents;
4. create one tree using the parent tree as base;
5. create one commit with `parentSha`;
6. update the branch ref without force.

If branch head moved, throw `stale_plan`.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-core.test.js`  
Expected: PASS.

- [ ] **Step 6: Configure the GitHub App integration**

Create/install a GitHub App scoped only to `benaviv311-eng/my-center`. Its required capabilities are repository contents read/write, pull requests read/write, Actions/checks read, and metadata read. Add `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_REPO_OWNER=benaviv311-eng`, and `GITHUB_REPO_NAME=my-center` as server-side Supabase Edge Function secrets. Never paste the private key into source files or chat messages. If the available connector cannot set secrets, stop and have the user enter them in Supabase Dashboard before end-to-end verification.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/site-editor/github.ts tests/site-editor-core.test.js
git commit -m "feat: add GitHub App edit client"
```

---

### Task 4: Validate edit plans and compute deterministic risk

**Files:**
- Create: `supabase/functions/_shared/site-editor/policy.ts`
- Create: `supabase/functions/_shared/site-editor/operations.ts`
- Modify: `tests/site-editor-core.test.js`

**Interfaces:**
- Produces:
  - `validateEditPlan(plan, repoFiles): ValidatedPlan`
  - `classifyRisk(operations): 'low'|'medium'|'high'`
  - `applyOperations(filesByPath, operations): Map<string,string|null>`
- Supported operation types: `replace_text`, `replace_file`, `create_file`, `delete_file`, `publish_asset`.

- [ ] **Step 1: Add failing policy tests**

```js
test('risk classifier promotes sensitive paths and broad edits', () => {
  const src = read('supabase/functions/_shared/site-editor/policy.ts');
  for (const marker of ['supabase/migrations/','supabase/functions/','.github/workflows/','sw.js']) assert.ok(src.includes(marker));
  assert.match(src,/operations\.length\s*>\s*10/);
  assert.match(src,/unknown_operation/);
  assert.match(src,/blocked_path/);
});

test('replace_text requires exact text count and expected sha', () => {
  const src = read('supabase/functions/_shared/site-editor/operations.ts');
  assert.match(src,/expected_occurrences/);
  assert.match(src,/expected_sha/);
  assert.match(src,/stale_plan/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-core.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement path policy**

Block:
- absolute paths;
- `..`;
- `.env`, `.env.*`;
- `*.pem`, `*.key`, `id_rsa*`;
- credential/secret export files;
- `.git/**`.

Promote the spec's high- and medium-risk paths exactly. The server-computed risk is `max(modelRisk, deterministicRisk)`.

- [ ] **Step 4: Implement exact edit operations**

`replace_text` must check SHA and exact occurrence count before replacement. `create_file` fails if path exists. `delete_file` always returns high risk. `publish_asset` may only target `assets/uploads/<request-id>/...`.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-core.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/site-editor/policy.ts supabase/functions/_shared/site-editor/operations.ts tests/site-editor-core.test.js
git commit -m "feat: validate site edit operations"
```

---

### Task 5: Create the `site-editor` proposal and plan-approval API

**Files:**
- Create: `supabase/functions/site-editor/index.ts`
- Modify: `supabase/functions/site-chat/index.ts`
- Modify: `tests/site-editor-core.test.js`
- Modify: `tests/site-chat.test.js`

**Interfaces:**
- `POST site-editor {action:'propose', thread_id, prompt, area, page_context, selected_element, attachment_ids}`
- `POST site-editor {action:'get', request_id}`
- `POST site-editor {action:'approve_plan', request_id}`
- `POST site-editor {action:'cancel', request_id}`

- [ ] **Step 1: Add failing endpoint tests**

Assert source contains owner guard, actions above, storage inserts for requests/operations/events, strict model schema markers, `SITE_EDITOR_MODEL_STRONG`, `SITE_EDITOR_MODEL_FAST`, branch prefix `site-edit/`, and that `site-chat` routes source-code intent to `site-editor` instead of saying source edits are forbidden.

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-core.test.js tests/site-chat.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement proposal flow**

`propose`:
1. require owner;
2. inspect repository tree and current-page linked files;
3. fetch only relevant source files;
4. call the model named by `SITE_EDITOR_MODEL_STRONG` with a strict JSON schema; use `SITE_EDITOR_MODEL_FAST` only for non-code summarization/classification; fail with safe code `editor_model_missing` if either required configuration is absent;
5. validate operations;
6. compute deterministic risk;
7. save request + operations + event;
8. return a user-facing change-card model.

Do not mutate GitHub during `propose`.

- [ ] **Step 4: Implement approval flow**

`approve_plan`:
1. re-read request and operations;
2. verify request owner and status `awaiting_plan_approval`;
3. re-check every `expected_sha` against current main;
4. if any mismatch, set `needs_replan` and return `stale_plan`;
5. append approval row with current base SHA;
6. create `site-edit/<id-short>/<slug>` branch;
7. apply operations in memory;
8. create one atomic commit;
9. store `head_sha`;
10. set status `testing`.

No merge occurs in this task.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-core.test.js tests/site-chat.test.js`  
Expected: PASS.

- [ ] **Step 6: Deploy `site-editor` and verify authorization manually**

Call `get` unauthenticated → 401.  
Call with authenticated non-owner test session if available → 403.  
Call as owner on a harmless proposal → request reaches `awaiting_plan_approval` and GitHub remains unchanged before approval.

- [ ] **Step 7: Full suite**

Run: `node --test tests/*.test.js`  
Expected: PASS with zero failures.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/site-editor/index.ts supabase/functions/site-chat/index.ts tests/site-editor-core.test.js tests/site-chat.test.js
git commit -m "feat: add approval-gated site edit proposals"
```
