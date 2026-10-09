# SeasonDesign Exercise Library & Sheets Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved Google Sheet into a versioned runtime exercise library while preserving separate content types from the legacy additional bank.

**Architecture:** PostgreSQL stores normalized exercises and immutable versions. A server-only sync adapter reads Google Sheets, normalizes core tabs and the additional bank, and applies idempotent upserts. The Library UI reads only PostgreSQL and combines shared canonical items with the signed-in coach's personal items.

**Tech Stack:** Next.js + TypeScript, Supabase/PostgreSQL, Google Sheets API adapter, Zod, Vitest, Playwright.

**Spec:** `season-design/docs/superpowers/specs/2026-10-09-seasondesign-design.md`

## Global Constraints

- Google Sheets remains the editorial source for canonical exercises, not the runtime database.
- Source tab mapping is exact: `משחקי חימום` → warm-up game, `תחתית` → forearm pass, `עילית` → overhead setting, `הנחתה` → attack, `חסימה` → block, `הגשה` → serve, `מאגר נוסף` → additional-bank parser.
- Core progression values are `isolated`, `fixed`, `complex`, `game-situation`.
- Additional-bank content remains separately typed rather than being merged blindly into technical tabs.
- Source values are `sheets`, `user`, `generated`.
- Updating Sheets must not rewrite historical exercise snapshots used by completed practices.
- Personal exercises belong only to their coach; canonical Sheets content is shared read-only in the app.
- A failed live sync never deletes or hides the last successful library.

## Review Focus

- Running the same sync twice must not create duplicates.
- A changed Sheet row must create/update the current exercise version without mutating old versions.
- Empty spacer rows/columns and merged-cell layout must not become fake exercises.
- Hebrew titles and descriptions must round-trip without corruption.
- If Sheets is unavailable, the existing synchronized library must remain readable.

---

### Task 1: Exercise and version schema

**Files:**
- Create: `season-design/supabase/migrations/202610090002_exercise_library.sql`
- Create: `season-design/supabase/tests/exercise_library.sql`
- Create: `season-design/features/library/types.ts`
- Create: `season-design/features/library/schema.ts`

**Interfaces:**
- Produces tables `exercises`, `exercise_versions`, `exercise_tags`, `exercise_tag_links`, `sheet_sync_runs`.
- Produces types `ExerciseSource`, `ExerciseKind`, `ProgressionStage`, `Exercise`, `ExerciseVersion`.
- Canonical exercise identity records latest source tab/row plus a normalized title/stage signature; sync may reconcile a moved row only when the fallback signature has one unique existing match.

- [ ] **Step 1: Write failing database tests** for canonical read access, personal-item ownership, immutable version rows, and allowed source/stage values.
- [ ] **Step 2: Run `supabase test db`**; expected FAIL.
- [ ] **Step 3: Implement migration** with source metadata fields for spreadsheet, tab, source row/key/hash, normalized signature, and synchronized timestamp.
- [ ] **Step 4: Add policies** allowing authenticated reads of canonical content and owner-only access to personal/generated content not promoted to shared content.
- [ ] **Step 5: Run database tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: add versioned exercise library schema`.

### Task 2: Core Sheet parsers and tab configuration

**Files:**
- Create: `season-design/features/library/sync/config.ts`
- Create: `season-design/features/library/sync/sheet-row.ts`
- Create: `season-design/features/library/sync/core-parser.ts`
- Create: `season-design/features/library/sync/fixtures/core-tabs.ts`
- Test: `season-design/features/library/sync/core-parser.test.ts`

**Interfaces:**
- `SHEET_TAB_CONFIG` contains the exact Hebrew tab mappings in Global Constraints.
- Produces `parseCoreTab(input: CoreTabInput): NormalizedExercise[]`.
- `CoreTabInput` identifies one configured core tab and includes original 1-based source row numbers.

- [ ] **Step 1: Write failing configuration/parser tests** covering all six core tab names, all four progression columns, game-situation merged cells, blank spacer columns, Hebrew text, and an empty row.
- [ ] **Step 2: Run parser tests**; expected FAIL.
- [ ] **Step 3: Implement `parseCoreTab`** so each real exercise gets source metadata/signature and no blank layout cells produce records.
- [ ] **Step 4: Run parser tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: parse canonical exercise tabs`.

### Task 3: Additional-bank normalization

**Files:**
- Create: `season-design/features/library/sync/additional-parser.ts`
- Create: `season-design/features/library/sync/fixtures/additional-bank.ts`
- Test: `season-design/features/library/sync/additional-parser.test.ts`

**Interfaces:**
- Produces `parseAdditionalBank(rows: SheetRow[]): NormalizedLibraryItem[]` with kinds `group-game`, `competitive-game`, `game-flow-sequence`, `transition-idea`, `warmup-idea`, `coaching-tag`.

- [ ] **Step 1: Write failing tests** using examples such as שפיגל, משחק הקבלנים, תולעת דוחפת, קרב באוויר, מקבלת סרב, מחסימה, מהגנה, מחיפוי.
- [ ] **Step 2: Run parser tests**; expected FAIL.
- [ ] **Step 3: Implement normalization** retaining short title and optional explanation fields without forcing items into a technical progression stage.
- [ ] **Step 4: Run parser tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: normalize additional exercise bank`.

### Task 4: Server-only Sheets source and idempotent sync service

**Files:**
- Create: `season-design/lib/google-sheets/source.ts`
- Create: `season-design/features/library/sync/sync-service.ts`
- Create: `season-design/app/api/admin/sync-exercises/route.ts`
- Modify: `season-design/.env.example`
- Test: `season-design/features/library/sync/sync-service.test.ts`

**Interfaces:**
- Produces `SheetSource.readTab(tabName): Promise<SheetRow[]>`.
- Produces `syncExerciseLibrary(source: SheetSource): Promise<SyncResult>` where `SyncResult` reports created, updated, unchanged, failed.
- Identity matching order: exact stored source row/key; otherwise one unique normalized tab+stage+title signature; ambiguity is reported as failed instead of guessed.

- [ ] **Step 1: Write failing sync tests** for first import, identical repeat import, changed description, moved-but-uniquely-matched row, ambiguous fallback, removed/blank source row, and source failure.
- [ ] **Step 2: Run sync tests**; expected FAIL.
- [ ] **Step 3: Implement the server-only SheetSource adapter** using deployment configuration for spreadsheet identity/credentials.
- [ ] **Step 4: Implement hash-based sync** creating a new `exercise_versions` row only when normalized content changes; a failed run leaves the prior current library untouched.
- [ ] **Step 5: Implement the protected admin sync route** and record each attempt in `sheet_sync_runs`.
- [ ] **Step 6: Run sync tests**; expected PASS.
- [ ] **Step 7: Commit** `feat: sync exercise library from sheets`.

### Task 5: Library query service and filters

**Files:**
- Create: `season-design/features/library/repository.ts`
- Create: `season-design/features/library/search.ts`
- Test: `season-design/features/library/search.test.ts`

**Interfaces:**
- Produces `searchLibrary(query: LibraryQuery): Promise<LibrarySearchResult>`.
- Filters support text, skill, kind, progression stage, level, player-count compatibility, and source.

- [ ] **Step 1: Write failing search tests** for Hebrew text, multiple filters, personal+canonical visibility, and no-match results.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement repository/search** against current exercise versions only.
- [ ] **Step 4: Run tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: add exercise library search`.

### Task 6: Library UI and sync acceptance

**Files:**
- Create: `season-design/app/(app)/library/page.tsx`
- Create: `season-design/app/(app)/library/[exerciseId]/page.tsx`
- Create: `season-design/features/library/library-filters.tsx`
- Create: `season-design/features/library/exercise-card.tsx`
- Test: `season-design/e2e/library.spec.ts`

**Interfaces:**
- Consumes `searchLibrary()` and versioned exercise records.
- Produces browse/search/detail UI used later by generator and Coach Draft.

- [ ] **Step 1: Write failing E2E coverage** for searching a canonical exercise, filtering progression, opening optional full explanation, and seeing a personal exercise only for its owner.
- [ ] **Step 2: Run E2E test**; expected FAIL.
- [ ] **Step 3: Implement responsive Library pages** with source, kind, and progression labels.
- [ ] **Step 4: Verify a simulated Sheet change leaves an old `exercise_versions` record intact** while Library shows the newest version.
- [ ] **Step 5: In a configured staging environment, run one real sync** and verify successful `sheet_sync_runs` plus non-empty results from every expected tab; do not make this live credential check a CI requirement.
- [ ] **Step 6: Run `npm run lint && npm test && npm run test:e2e && npm run build`**; expected PASS.
- [ ] **Step 7: Commit** `test: verify exercise library sync`.
