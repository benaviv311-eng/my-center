# SeasonDesign Practice Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, explain, save, and edit coherent volleyball practices from structured inputs, group context, the synchronized library, and optional free-text intent.

**Architecture:** A deterministic engine owns duration, eligibility, focus priority, stage distribution, repetition, and source policy. A server-side AI composer receives only vetted context and ranked candidates to choose/sequence blocks and interpret free text. A final validator rejects invalid output before it can be saved.

**Tech Stack:** Next.js + TypeScript, Supabase/PostgreSQL, Zod, Vercel AI SDK with a server-side provider adapter, Vitest, Playwright.

**Spec:** `season-design/docs/superpowers/specs/2026-10-09-seasondesign-design.md`

## Global Constraints

- Practice durations offer 45, 60, 75, 90, and custom minutes.
- Styles are `regular`, `technical`, `game-based`, `advanced`, `custom`.
- Topics are reception, serve, attack, coverage, transitions, block, defense, attack-to-defense transition.
- A practice has 1–3 ordered focuses; focus 1 is primary, focus 2 secondary, focus 3 tertiary.
- Warm-up modes are existing fixed, topic-based, warm-up game, generator chooses, and saved custom warm-up.
- Coaches can save multiple named custom warm-ups.
- Source policies are `library-only`, `prefer-library` (default), `free-generation`.
- Detail levels are `short`, `normal`, `detailed`; every block still offers an explicit explanation action.
- AI-created exercises are visibly marked, never enter the canonical bank automatically, and may only enter the coach's personal library through an explicit save action.
- Saved practices preserve exercise snapshots.

## Review Focus

- Generated block minutes must equal requested duration exactly.
- `library-only` must never leak a generated exercise.
- A temporary group with no history must still generate safely from explicit inputs.
- Sparse candidate sets must produce an explicit insufficiency result rather than a low-quality hidden fallback.
- Editing/replacing one block must not silently regenerate or reorder unrelated blocks.

---

### Task 1: Practice, warm-up, and snapshot schema

**Files:**
- Create: `season-design/supabase/migrations/202610090003_practices.sql`
- Create: `season-design/supabase/tests/practices.sql`
- Create: `season-design/features/practices/types.ts`
- Create: `season-design/features/practices/schema.ts`

**Interfaces:**
- Produces tables `warmups`, `warmup_blocks`, `practices`, `practice_focuses`, `practice_blocks`, `practice_templates`.
- `practice_blocks.exercise_snapshot` stores JSON content used at generation/save time.
- Produces `PracticeRequest`, `PracticeDraft`, `PracticeBlock`, `PracticeStyle`, `SourcePolicy`, `DetailLevel`, `WarmupMode`.

- [ ] **Step 1: Write failing database/type tests** for ownership, ordered focuses 1–3, valid enums, multiple named warm-ups, and immutable saved snapshot content.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement migration and Zod/domain types**.
- [ ] **Step 4: Run tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: add practice and warmup data model`.

### Task 2: Deterministic structure allocator

**Files:**
- Create: `season-design/features/generator/config.ts`
- Create: `season-design/features/generator/allocate.ts`
- Test: `season-design/features/generator/allocate.test.ts`

**Interfaces:**
- Produces `allocatePractice(request: PracticeRequest): PracticeAllocation`.
- Default warm-up allocation: `clamp(round(duration * 0.15), 8, 15)` minutes unless a saved/custom warm-up supplies an explicit duration.
- Focus shares of non-warm-up time: one focus `100%`; two focuses `65/35`; three focuses `55/30/15`.
- Stage profiles: regular `20/25/30/25`, technical `35/35/20/10`, game-based `5/15/35/45`, advanced `5/10/35/50` for isolated/fixed/complex/game-situation respectively; custom supplies its own profile.
- Focus 2 may use isolated work only when needed and at most 15% of its allocation; focus 3 defaults to complex/game-situation only.

- [ ] **Step 1: Write failing table-driven tests** for 45/60/75/90 minutes, 1/2/3 focuses, all four automatic styles, and an explicitly timed saved warm-up.
- [ ] **Step 2: Run allocator tests**; expected FAIL.
- [ ] **Step 3: Implement integer-minute allocation with largest-remainder rounding** so totals always equal requested duration.
- [ ] **Step 4: Run allocator tests**; expected PASS with exact totals.
- [ ] **Step 5: Commit** `feat: allocate practice structure`.

### Task 3: Generation context and candidate ranking

**Files:**
- Create: `season-design/features/generator/context.ts`
- Create: `season-design/features/generator/rank.ts`
- Test: `season-design/features/generator/rank.test.ts`

**Interfaces:**
- Produces `buildGenerationContext(request): Promise<GenerationContext>`.
- Produces `rankCandidates(context, slot): RankedExercise[]`.
- Ranking uses hard eligibility first (source policy, focus/skill, stage, known player limits), then score: exact skill +5, topic/game-context +4, stage fit +3, level fit +3, player-count fit +2, useful related focus +2; subtract 4 if used in either of the last two practices and 2 if used in practices 3–4 back.

- [ ] **Step 1: Write failing tests** for a new group, known group levels, repetition penalty, incompatible player count, and source policies.
- [ ] **Step 2: Run ranking tests**; expected FAIL.
- [ ] **Step 3: Implement context loading** from group profile/history when groupId exists, otherwise only explicit temporary-group data.
- [ ] **Step 4: Implement eligibility and deterministic scoring**.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: rank practice candidates`.

### Task 4: Server-side AI composer with structured output

**Files:**
- Create: `season-design/lib/ai/provider.ts`
- Create: `season-design/features/generator/composer.ts`
- Create: `season-design/features/generator/composer-schema.ts`
- Test: `season-design/features/generator/composer.test.ts`

**Interfaces:**
- Produces `PracticeComposer.compose(input: ComposerInput): Promise<ComposedPractice>`.
- Composer input contains structured request, factual group context, allocation slots, and bounded ranked candidates; no direct database access.
- Composer output identifies chosen candidate IDs or explicit generated exercise objects plus rationale tagged as `fact` or `inference`.

- [ ] **Step 1: Write failing tests with a fake provider** proving free-text constraints affect selection, facts are not invented, and generated content is rejected under `library-only`.
- [ ] **Step 2: Run composer tests**; expected FAIL.
- [ ] **Step 3: Implement structured server-side composition** with schema validation and injectable provider.
- [ ] **Step 4: Add a production provider adapter** configured only on the server; keep tests provider-free.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: compose practices with server AI`.

### Task 5: Final validator and generation service

**Files:**
- Create: `season-design/features/generator/validate.ts`
- Create: `season-design/features/generator/generate.ts`
- Create: `season-design/app/api/practices/generate/route.ts`
- Test: `season-design/features/generator/generate.test.ts`

**Interfaces:**
- Produces `validatePractice(draft, request): ValidationResult`.
- Produces `generatePractice(request): Promise<GenerationResult>` where result is either `success` or an explicit `insufficient-library`/validation failure.

- [ ] **Step 1: Write failing tests** for wrong total time, duplicate unintended blocks, focus-order violation, generated exercise under library-only, and insufficient library.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement orchestration: allocation → context → ranking → composition → validation**.
- [ ] **Step 4: Do not silently relax hard constraints**; return a user-readable insufficiency result with suggested next action.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: validate and generate practices`.

### Task 6: Saved custom warm-up builder

**Files:**
- Create: `season-design/features/warmups/repository.ts`
- Create: `season-design/features/warmups/actions.ts`
- Create: `season-design/features/warmups/warmup-builder.tsx`
- Create: `season-design/app/(app)/warmups/page.tsx`
- Create: `season-design/app/(app)/warmups/new/page.tsx`
- Test: `season-design/e2e/warmups.spec.ts`

**Interfaces:**
- Produces `createWarmup(input)`, `updateWarmup(id,input)`, `duplicateWarmup(id)`, `listWarmups()`.
- A warm-up has a coach-owned name, ordered blocks, and total duration.

- [ ] **Step 1: Write failing E2E test** creating two differently named fixed warm-ups and editing one without changing the other.
- [ ] **Step 2: Run the test**; expected FAIL.
- [ ] **Step 3: Implement warm-up repository/actions and ordered-block builder** using canonical/personal exercises or free-text blocks.
- [ ] **Step 4: Verify a saved warm-up can be selected by the allocator and its explicit duration is honored**.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: add saved custom warmups`.

### Task 7: Create Practice UI and block-level editing

**Files:**
- Create: `season-design/app/(app)/practices/new/page.tsx`
- Create: `season-design/app/(app)/practices/[practiceId]/page.tsx`
- Create: `season-design/features/practices/practice-form.tsx`
- Create: `season-design/features/practices/practice-editor.tsx`
- Create: `season-design/features/practices/actions.ts`
- Test: `season-design/e2e/practice-generator.spec.ts`

**Interfaces:**
- Produces structured form controls + free-text instruction, generated-practice editor, save/duplicate/template actions.
- Block actions: replace, duration, explanation, delete, reorder, variation.
- Produces `saveGeneratedExerciseToPersonalLibrary(blockId)` for explicit promotion of generated content to the coach's personal library.

- [ ] **Step 1: Write failing E2E flow** selecting a saved group, 90 minutes, game-based, topic, two ordered focuses, a saved warm-up, detail level, and free text.
- [ ] **Step 2: Run E2E test**; expected FAIL.
- [ ] **Step 3: Implement generator form and render selection rationales** with visible fact/inference distinction; short/normal/detailed affects default visible copy, while `show explanation` is always available.
- [ ] **Step 4: Implement block replacement** by reranking candidates for that block's existing role without changing unrelated blocks.
- [ ] **Step 5: Implement save/duplicate/template using exercise snapshots** and explicit save-to-personal-library for generated blocks.
- [ ] **Step 6: Run `npm run lint && npm test && npm run test:e2e && npm run build`**; expected PASS.
- [ ] **Step 7: Commit** `feat: ship practice generator workflow`.
