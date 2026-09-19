# Site Editor Through Chat — Design

Date: 2026-09-19  
Project: `benaviv311-eng/my-center`  
Status: Approved design, pending implementation plan

## 1. Purpose

The goal is to turn the existing site-wide chat into a safe, full site editor.

The user should be able to write natural-language requests such as:

- "תפזר את הכותרות יותר"
- "תוסיף כפתור חדש"
- "תשנה את הפריסה בעמוד הכדורעף"
- "תשתמש בתמונה ששלחתי כאן"
- "תחזיר למה שהיה קודם"

The chat should be able to modify content, layout, styling, HTML, CSS, JavaScript, assets, Supabase schema/functions, and site features, while preserving human approval, tests, preview, audit history, and rollback.

The system must never silently claim a change was made when it was not actually committed, tested, merged, and deployed.

## 2. Existing foundation

The current site already has:

- a site-wide chat drawer;
- Supabase email authentication;
- global and area-scoped chat modes;
- page context;
- chat history;
- long-term memory;
- approval-gated structured actions;
- private image attachments;
- OpenAI-backed responses through a Supabase Edge Function;
- GitHub Pages deployment from the repository;
- automated tests in GitHub Actions.

The current live chat intentionally does not modify source code. This design adds that capability without putting repository credentials in the browser.

## 3. Product behavior

The editor uses a smart approval model.

### Low-risk changes

Examples:

- text changes in static files;
- spacing, typography, colors;
- small HTML/CSS adjustments;
- replacing an existing public image;
- simple content-order changes that do not alter logic.

User flow:

`request → proposed change → approval → branch → tests → automatic merge → deploy`

The user gives one approval. The implementation still uses a branch internally; the editor never writes directly to `main`.

### Medium-risk changes

Examples:

- JavaScript behavior;
- navigation changes;
- new UI components;
- multiple-file changes;
- new client-side features;
- significant layout restructuring.

User flow:

`request → proposed change → approval → branch → tests → preview → second approval → merge → deploy`

### High-risk changes

Examples:

- Supabase migrations;
- Auth;
- RLS;
- Edge Functions;
- GitHub Actions workflows;
- service worker/PWA behavior;
- dependency or infrastructure changes;
- broad deletion/renaming;
- large multi-area refactors.

User flow:

`request → technical plan → approval → branch → validation → preview → explicit publish approval → merge/deploy → post-deploy checks`

High-risk changes are never automatically merged.

## 4. Core principle: the AI is not trusted to execute

The model may propose edits, but the server validates and executes them.

The AI must not:

- receive a GitHub credential;
- call GitHub directly;
- execute arbitrary shell commands;
- decide by itself that a production change is safe;
- bypass tests;
- change secrets;
- force-push;
- delete the repository or Supabase project;
- disable authentication or RLS protections.

The backend owns authorization, path validation, risk classification, concurrency checks, GitHub writes, tests, merge decisions, audit records, and rollback.

## 5. Architecture

The design separates chat, editing, preview, and deployment.

### 5.1 Browser

The browser keeps the existing chat UI and adds:

- edit mode;
- change-request cards;
- selected-element mode;
- preview links;
- test/deploy status;
- publish/cancel/request-fix actions;
- edit history;
- undo.

The browser never receives GitHub or Supabase management credentials.

### 5.2 `site-chat` Edge Function

Responsibilities:

- normal conversation;
- chat context;
- memory;
- image input;
- recognizing edit intent;
- routing a code/site edit request to `site-editor`;
- returning a change card to the browser.

It should not hold repository write credentials.

### 5.3 `site-editor` Edge Function

This is the privileged editor service.

Responsibilities:

- authenticate the user;
- verify owner/editor authorization;
- inspect repository state;
- gather relevant files;
- ask the model for a structured edit plan;
- validate the plan;
- calculate risk;
- save the change request;
- wait for required approval;
- create/update a GitHub branch;
- create commits;
- create/update a pull request;
- monitor checks;
- request preview;
- merge only when policy allows;
- monitor deployment;
- create rollback requests.

Only this service gets the GitHub App credentials.

### 5.4 `site-preview` Edge Function

A read-only preview proxy.

It serves files from the edit branch under a preview URL such as:

`/functions/v1/site-preview/<preview-token>/index.html`

The function maps the requested path to the matching file in the branch and returns the correct MIME type.

For preview safety:

- service worker registration is disabled;
- preview responses are `no-store`;
- preview pages are marked `noindex`;
- the preview token is unguessable;
- expired/cancelled requests stop serving previews.

### 5.5 GitHub

GitHub remains the source of truth for source-code history.

All source edits follow:

`branch → commit → checks → PR → merge`

There is no direct browser-to-GitHub write path.

### 5.6 GitHub Pages

Production publishing remains tied to `main`.

The editor monitors the Pages workflow after merge and does not mark a request as deployed until the deployment run succeeds.

## 6. GitHub authentication

Use a GitHub App rather than a browser token or long-lived token embedded in code.

The app is installed only on `benaviv311-eng/my-center`.

The exact permission labels must be verified against current GitHub documentation during implementation, but the required capabilities are:

- repository contents: read/write;
- pull requests: read/write;
- checks/actions: read;
- workflow dispatch or workflow modification only where explicitly needed;
- metadata: read.

Server-side secrets:

- `GITHUB_APP_ID`
- `GITHUB_APP_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_REPO_OWNER`
- `GITHUB_REPO_NAME`

These values never appear in chat messages, client JavaScript, logs returned to the browser, or database payloads.

## 7. Authorization

Only an authorized owner/editor may execute source changes.

The existing `app_owners` table should be the primary source of authorization instead of creating a second owner list.

Every `site-editor` request must:

1. validate the Supabase access token with `auth.getUser()`;
2. verify the user exists in `app_owners`;
3. verify the edit request belongs to that user;
4. verify approval belongs to the current authenticated user;
5. verify the branch/head SHA still matches the approved state.

RLS is enabled for every new public table.

## 8. Chat modes

The chat exposes three user-facing modes.

### Consult only

The chat can explain and suggest but cannot create a change request.

### Edit mode

Default mode.

Editing language such as "שנה", "תוסיף", "תזיז", "תמחק", "תעצב", "תקן" can become a formal change request.

### Work mode

Designed for a sequence of edits during one working session.

It keeps the active edit request in context and supports follow-ups such as:

- "עוד קצת"
- "תחזיר את הצבע"
- "תשאיר את הכפתור אבל תקטין אותו"

Work mode does not remove approval requirements.

## 9. Selected-element editing

Add a "בחר מהעמוד" action.

When activated:

1. the page enters inspect mode;
2. hover/tap highlights an element;
3. the next click selects it instead of activating it;
4. the chat receives structured element context.

Captured context:

- tag name;
- id;
- classes;
- relevant `data-*` attributes;
- visible text;
- stable DOM path;
- nearest semantic container;
- bounding rectangle;
- selected computed style values;
- current page URL/path.

The user can then say:

"את זה תזיז למעלה"

without describing the element manually.

The selection overlay must be removable and must not persist into normal page use.

## 10. Image-assisted editing

Existing chat images become an editing input.

Examples:

- screenshot of the current site with instructions;
- a reference design;
- an image to publish into the site.

Images uploaded to chat remain private by default.

If the user asks to publish an uploaded image into the public site, the approval card must explicitly state that the selected file will become publicly accessible.

Published assets should be versioned as repository assets, for example:

`assets/uploads/<request-id>/<safe-file-name>`

This keeps site code and public assets reversible through Git history.

## 11. Edit intent routing

Not every site change needs a source-code edit.

The router uses the safest persistence layer:

- database-backed content change → existing structured content action;
- memory change → existing memory action;
- CSS/HTML/JS/layout/feature change → Site Editor;
- database schema / Edge Function / infrastructure change → high-risk Site Editor flow.

This avoids turning simple content edits into unnecessary Git commits.

## 12. Repository inspection

The editor should fetch only the code needed for the request.

The first pass builds a repository map:

- top-level pages;
- referenced scripts/styles;
- Supabase functions;
- migrations;
- workflows;
- tests.

For a page-specific request, it starts from the current page and follows its linked assets.

For broad requests, it can search the repository tree and source text.

The model should not receive the entire repository unless the task truly requires it.

## 13. Structured edit contract

The model does not return arbitrary shell commands or raw GitHub API calls.

It returns a strict edit plan composed of operations.

Supported operations:

### `replace_text`

Fields:

- `path`
- `expected_sha`
- `old_text`
- `new_text`
- `expected_occurrences`

The server refuses the operation if the exact old text does not match the expected count.

### `replace_file`

Fields:

- `path`
- `expected_sha`
- `new_content`

Used only when a whole-file replacement is appropriate.

### `create_file`

Fields:

- `path`
- `content`

Fails if the file already exists unless the approved plan explicitly allows replacement.

### `delete_file`

Fields:

- `path`
- `expected_sha`

Deletion is never low risk.

### `publish_asset`

Fields:

- source attachment id;
- target repository path;
- expected public MIME type.

The server validates the attachment belongs to the current user and request.

Raw regex edits are not allowed in v1. Exact-match operations are easier to validate and roll back.

## 14. Deterministic risk classifier

Risk is not chosen only by the model.

The backend computes the final risk from changed paths, operation type, file count, line count, and semantics.

### Always high risk

- `supabase/migrations/**`
- `supabase/functions/**`
- auth/RLS logic;
- `.github/workflows/**`
- `sw.js`
- dependency/configuration files;
- deletion of source files;
- more than 10 modified files;
- schema or credential-related code.

### At least medium risk

- JavaScript logic;
- navigation;
- cross-page components;
- new functionality;
- more than 3 files;
- large HTML/CSS restructuring.

### Eligible for low risk

Only small, localized, reversible static changes with no sensitive paths, typically text/HTML/CSS/assets.

The server may promote risk upward but never lower a deterministic high-risk result because the model says it is safe.

## 15. Change-request card

Before execution, the user sees:

- requested goal;
- what the system understood;
- affected files;
- short before/after description;
- risk level;
- whether preview is required;
- whether a private image will become public;
- tests that will run;
- explicit warnings for DB/Auth/workflow changes.

Actions:

- `מאשר`
- `שנה את ההצעה`
- `בטל`

For medium/high changes after successful checks:

- `פתח Preview`
- `פרסם באתר`
- `בקש תיקון`
- `בטל`

## 16. Branch and commit model

Every source edit uses a dedicated branch:

`site-edit/<request-id-short>/<slug>`

The request stores:

- planning base SHA;
- branch name;
- current branch head SHA;
- PR number;
- merge commit SHA if published.

The editor creates multi-file changes as one atomic commit whenever possible.

The commit message includes the request id, for example:

`site-edit: space volleyball headings [req abc123]`

## 17. Concurrency and stale plans

Every edit operation carries an `expected_sha`.

Before committing:

- if an affected file no longer matches its expected SHA, the plan is stale;
- the editor does not overwrite newer work;
- it marks the request `needs_replan`;
- it regenerates the plan against current `main`;
- material changes require renewed approval.

Before merge, the approved branch head SHA must still equal the current branch head.

This prevents a previously approved card from authorizing later unreviewed commits.

## 18. Automated verification

Create a dedicated Site Editor validation workflow for `site-edit/**` branches.

Minimum validation:

- JavaScript syntax;
- the complete Node test suite;
- existing area-specific tests;
- reference checks for changed HTML/CSS/JS assets;
- migration presence/format checks when applicable;
- forbidden-secret scan;
- changed-file policy validation.

The workflow reports status back to `site-editor`.

A red check blocks merge.

## 19. Repair loop

When tests fail, the editor may attempt up to two automated repair passes only when:

- the repair stays within the approved goal;
- it stays inside the approved file set or a clearly dependent test file;
- it does not increase the risk category;
- it does not introduce a new sensitive path.

If a repair needs additional scope or changes the intent, the system pauses and asks for a new approval.

All repair commits are visible in the request history.

## 20. Preview

Medium/high changes require a working preview before publication whenever the change can be represented with the branch code.

The preview function reads branch files through the server-side GitHub integration.

Preview metadata includes:

- branch;
- head SHA;
- generated time;
- request id;
- expiration.

The preview must clearly show "גרסת ניסיון" so it cannot be confused with production.

Database-dependent changes that cannot be safely simulated must state this explicitly. The preview may show the frontend portion, but the publish card must warn that production database behavior has not yet been exercised.

## 21. Supabase and database changes

Schema and backend changes are high risk.

The Site Editor may create:

- migration files;
- Edge Function changes;
- RLS changes;
- tests;
- deployment workflow updates.

Production SQL should not be executed through a generic arbitrary-SQL RPC exposed to the site.

Preferred deployment path:

1. migration is committed to the edit branch;
2. tests/checks pass;
3. user reviews preview and migration summary;
4. explicit publish approval is recorded;
5. merge to `main`;
6. a dedicated GitHub Actions workflow applies the exact approved migration using protected GitHub Secrets;
7. post-deploy Supabase security/performance checks run;
8. the request is marked deployed only after success.

Required privileged Supabase deployment credentials belong in GitHub Secrets, not in browser JavaScript or database rows.

## 22. Secrets

The editor never reads, displays, modifies, or returns secret values.

It may tell the user:

- which secret name is required;
- where to configure it;
- whether it appears to be missing.

Secret values must never be included in:

- model prompts;
- chat messages;
- diffs;
- Git commits;
- database audit payloads;
- preview responses;
- user-visible error messages.

## 23. Data model

### `site_edit_requests`

Core request record.

Suggested fields:

- `id`
- `user_id`
- `thread_id`
- `prompt`
- `area`
- `page_context jsonb`
- `selected_element jsonb`
- `summary`
- `risk_level`
- `status`
- `base_sha`
- `branch_name`
- `head_sha`
- `pr_number`
- `merge_commit_sha`
- `deploy_status`
- `created_at`
- `updated_at`
- `published_at`
- `undo_of_request_id`

### `site_edit_operations`

Validated operations for one request.

Suggested fields:

- `id`
- `request_id`
- `sequence`
- `operation_type`
- `path`
- `expected_sha`
- `payload jsonb`
- `diff_summary`
- `status`

### `site_edit_approvals`

Append-only approval ledger.

Suggested fields:

- `id`
- `request_id`
- `user_id`
- `stage` — plan / publish / rollback;
- `decision`
- `approved_head_sha`
- `created_at`

### `site_edit_runs`

Test, preview, deploy, and verification runs.

Suggested fields:

- `id`
- `request_id`
- `kind`
- `provider_run_id`
- `status`
- `url`
- `details jsonb`
- `started_at`
- `finished_at`

### `site_edit_events`

Append-only audit timeline.

Suggested fields:

- `id`
- `request_id`
- `user_id`
- `event_type`
- `details jsonb`
- `created_at`

All tables use RLS and ownership checks.

Git remains the canonical before/after source history; the database does not need to duplicate full repository contents.

## 24. Request states

Expected lifecycle:

- `planning`
- `awaiting_plan_approval`
- `approved`
- `applying`
- `testing`
- `repairing`
- `preview_ready`
- `awaiting_publish_approval`
- `merging`
- `deploying`
- `deployed`
- `needs_replan`
- `failed`
- `cancelled`
- `rolled_back`

Transitions are server-controlled.

The browser cannot set a request directly to `deployed` or `approved`.

## 25. Undo / rollback

Every published Site Editor change must support an undo request.

Safe rollback rule:

- if the affected production files still match the published change, the editor can generate a reverse branch automatically;
- if later edits touched the same files, the editor must create a rollback proposal against current `main` rather than blindly restoring old files.

Rollback follows the same branch/test/approval policy as normal editing.

Database rollback is never an automatic destructive reversal. A compensating migration is generated and treated as high risk.

## 26. Error handling

User-facing errors are concise and safe.

Examples:

- "השינוי לא פורסם כי בדיקה נכשלה."
- "הקובץ השתנה מאז שאישרת. צריך להכין את ההצעה מחדש."
- "ה־Preview מוכן, אבל שינוי בסיס הנתונים עדיין לא הופעל."
- "הפרסום נכשל. הגרסה הקודמת עדיין פעילה."

Raw provider errors, key fragments, credentials, stack traces, or secret-bearing URLs must not be rendered into chat.

Technical errors are logged server-side with a request id.

## 27. Status UX

While work runs, the change card shows the current stage:

`מנתח → מוצא קבצים → מכין שינוי → שומר Branch → מריץ בדיקות → מכין Preview → ממתין לאישור → מפרסם`

The user can close the drawer and return later. State comes from Supabase, not local browser memory.

## 28. Audit and history UI

Add a Site Changes view accessible from the chat.

Each record shows:

- original user request;
- summary;
- files;
- risk;
- approvals;
- test status;
- preview;
- PR/commit;
- deployment result;
- rollback availability.

A request can be reopened in chat to continue work.

## 29. Model configuration

Do not hardcode product-facing model names into the Site Editor.

Use server-side configuration such as:

- `SITE_EDITOR_MODEL_FAST`
- `SITE_EDITOR_MODEL_STRONG`

The strong model is used for code planning and patch generation.

Provider/model errors must be handled separately from edit execution errors.

Model output is validated against a strict server-side schema before any file mutation occurs.

## 30. Security boundaries

Always forbidden from the live editor:

- repository deletion;
- project deletion;
- force-push to `main`;
- modification of secret values;
- publishing an unapproved branch;
- disabling all RLS/auth protections;
- arbitrary shell execution supplied by the model;
- arbitrary SQL execution endpoint exposed to browser users;
- writing outside the configured repository;
- using a branch head different from the approved SHA.

Sensitive files such as private keys, `.env*`, credentials, and secret exports are blocked from read/write model context.

## 31. Acceptance criteria

The feature is complete when all of the following are true:

1. A signed-in authorized owner can request a source-code change from the site chat.
2. The chat can use current page context, selected-element context, and attached screenshots.
3. The system identifies relevant files and produces a concrete change card.
4. The user can approve or cancel before any repository mutation.
5. Every source edit is made on a dedicated GitHub branch.
6. Low-risk changes can complete with one user approval but still pass tests before merge.
7. Medium/high changes require a preview and a second publish approval.
8. Failed tests block publication.
9. The UI shows truthful branch/test/preview/deploy state.
10. Production deployment is confirmed before reporting success.
11. Every published edit has an audit trail and rollback path.
12. No GitHub, OpenAI, Supabase management, or other secret is exposed to the browser.
13. Existing chat, memory, image, library, Raika, language, home, coach, and volleyball tests remain green.
14. Supabase-related edits retain RLS/security protections and run post-deploy advisors.
15. A stale approved plan cannot overwrite code changed after approval.

## 32. Deliberate non-goals for the first implementation

The first implementation does not need:

- arbitrary terminal access;
- autonomous background redesign without a user request;
- multi-repository editing;
- collaboration between multiple human editors;
- automatic destructive database rollback;
- editing external SaaS systems unrelated to this site.

These can be added later without weakening the approval and audit model.

## 33. Final design decision

The approved user experience remains "C — smart":

- small change: one approval;
- medium change: approval, preview, publish approval;
- large/sensitive change: plan approval, validation, preview, explicit publish approval.

Internally, all source-code changes still use branches, checks, and Git history. This preserves the fast UX for small edits without giving the live chat direct write access to production.
