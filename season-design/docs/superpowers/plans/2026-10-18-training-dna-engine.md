# Training DNA Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build a deterministic, explainable volleyball practice generator, with group context, exact timing, feedback and next-practice suggestions.

**Architecture:** Separate pure planning logic from the Supabase repository, Next.js server actions, and Hebrew RTL interface. A normalized practice context enters an arc planner, exercise filter/ranker, composer and validator. Feedback produces proposals, never automatic changes to coach-approved group levels.

**Tech Stack:** Next.js 16, TypeScript 5.9, React 19, Zod 4, Vitest 4, Playwright, Supabase/PostgreSQL.

**Spec:** season-design/docs/superpowers/specs/2026-10-17-training-dna-engine-design.md

## Global Constraints

- Work on branch feature/season-design-library-sync under season-design/.
- One behavioral Primary Outcome; 1–3 ordered focuses, Focus 1 receives the largest dedicated development allocation.
- Arc roles: prepare, solve, stabilize, decide, compete. They can be skipped/combined. Keep progression taxonomy isolated, fixed, complex, game-situation.
- Styles: regular, technical, game-based, advanced, competitive, light.
- All durations are integer seconds. Exact total mandatory; coach-selected fixed warm-up remains fixed. Approved 90-minute warm-up: 24:15 = 1455 seconds.
- Policies: library-only, prefer-library, free-generation. Generated material is never silently promoted into the Sheet-sourced library.
- Deterministic defaults; explicit missing metadata is null, not invented data.
- Focus 1 has realistic game-transfer unless explicitly overridden with a warning.
- Version snapshots immutable; level changes require coach action.
- RLS isolates coaches; service-role key never reaches a browser.
- GitHub Pages HTML edition on main is distinct from the Next.js app; no claim of published parity before independent verification.
- For each task: RED test, observe expected failure, minimal implementation, GREEN test, commit.

## Review Focus

1. A 5400-second request with a locked 1455-second warm-up returns exactly 5400 and preserves the 1455 (Task 5).
2. Library-only with no eligible drill produces a typed failure, not generated content (Tasks 4 and 6).
3. A drill limited to 6 players rejects a group of 18; unknown capacity is warned about, not rejected (Task 4).
4. No feedback/history or AI outage still yields deterministic output without invented problems (Tasks 3 and 6).
5. Coach B cannot access or change coach A's practice, group or recommendation even by forged IDs (Task 8).

## File map

Pure core: features/training-dna/{types,schema,intent,group-state,arc,eligibility,ranker,load,composer,validator,generator,feedback}.ts and colocated .test.ts.
Adapters: features/training-dna/{library-adapter,repository,actions}.ts with tests.
Database: supabase/migrations/202610180001_training_dna.sql and supabase/tests/training_dna.sql.
UI: features/training-dna/{practice-form,practice-preview,feedback-form}.tsx, app/(app)/practices/new/page.tsx and app/(app)/practices/[practiceId]/page.tsx.
Acceptance: e2e/training-dna.spec.ts.

---

### Task 1 — Types and input contracts

**Files:** Create types.ts, schema.ts, schema.test.ts, fixtures.ts under features/training-dna/.
**Interfaces:** PracticeIntentInput {groupId:string|null,durationSeconds:number,primaryOutcome:string,focuses:SkillSlug[],style:PracticeStyle,warmup:{mode:"fixed"|"topic"|"game"|"auto",fixedBlocks?:PracticeBlock[]},sourcePolicy:"library-only"|"prefer-library"|"free-generation",allowNoGameTransfer?:boolean}; CandidateExercise {exerciseId:string,versionId:string,source:ExerciseSource,skillSlugs:SkillSlug[],stage:ProgressionStage|null,metadata:PlanningMetadata|null,title:string,description:string}; PlanningMetadata stores nullable player/duration bounds, 0..5 load/density/transfer, equipment, family, roles and variation links. GeneratedPractice stores blocks with role, focus, exact seconds, immutable exercise snapshot, rationale and warnings.
- [ ] Write tests: duplicate or four focuses, 0/fractional duration, empty outcome rejected; 5400 seconds and two ordered focuses accepted; unknown metadata remains null.
- [ ] Run npm test -- features/training-dna/schema.test.ts; expect missing export failure.
- [ ] Implement Zod schemas and types; no random IDs within deterministic generator output.
- [ ] Run focused test and npm run typecheck; expect pass.
- [ ] Commit: feat: add training DNA contracts.

### Task 2 — Versioned library metadata adapter

**Files:** Modify features/library/{types,schema}.ts; create library-adapter.ts and library-adapter.test.ts; extend migration and SQL test listed above.
**Interfaces:** toCandidateExercise(exercise:Exercise,version:ExerciseVersion):CandidateExercise. Store planning_metadata as additive, immutable exercise_versions JSONB field, default null; never modify source_snapshot or historical versions.
- [ ] RED SQL and unit tests for legacy row without metadata, unchanged Hebrew cues, canonical game-situation and exercise version IDs, RLS, immutable metadata.
- [ ] Run supabase test db and npm test -- features/training-dna/library-adapter.test.ts; expect failure.
- [ ] Add migration, typed metadata adapter, server-only loader with source/owner visibility.
- [ ] Re-run both focused tests; expect pass.
- [ ] Commit: feat: add exercise planning metadata adapter.

### Task 3 — Group evidence and Training Arc

**Files:** Create intent.ts, group-state.ts, arc.ts, and corresponding tests.
**Interfaces:** normalizeIntent(input:unknown):PracticeIntentInput; buildGroupState(group:Group|null,levels:GroupSkillLevel[],history:PracticeEvidence[],feedback:FocusEvidence[]):GroupPlanningSnapshot|null; buildTrainingArc(intent:PracticeIntentInput,group:GroupPlanningSnapshot|null,problems:ProblemEvidence[]):ArcSlot[].
**ArcSlot:** {role:ArcRole,focus:SkillSlug,targetSeconds:number,required:boolean}. Regular uses progressive challenge; technical favors solve/stabilize; game/advanced favors decide/compete; light avoids planning heavy consecutive loads. Assign at least 50% of post-warm-up development time to Focus 1.
- [ ] RED tests compare beginner reception 60m to advanced game-based transition 90m, preserve focus order, integer positive allocations and no invented history with empty evidence.
- [ ] Run npm test -- features/training-dna/arc.test.ts; expect failure.
- [ ] Implement pure context normalizer, problem provenance and arc allocation with stable integer rounding.
- [ ] Focused tests pass.
- [ ] Commit: feat: build group-aware training arcs.

### Task 4 — Eligibility and deterministic ranking

**Files:** Create eligibility.ts, ranker.ts, and tests.
**Interfaces:** filterEligible(slot:ArcSlot,context:PracticeContext):EligibleResult; rankExercises(slot:ArcSlot,context:PracticeContext,eligible:CandidateExercise[],selected:CandidateExercise[]):RankedExercise[].
**Scoring:** five dimensions scored 0..5: goal, progression, density, transfer, flow. Regular weights [5,4,3,4,3]; technical [5,5,5,2,3]; game-based [5,3,2,6,3]; advanced [5,4,2,6,3]; competitive [5,3,2,6,3]; light [5,4,3,3,4]. Exact repeat -15; same family -8; adjacent near-duplicate -10; adjacent high load -8. Ties resolved lexically by exerciseId then versionId. Missing metadata is neutral/uncertain, not a perfect score.
- [ ] RED tests: 18-player mismatch filtered, unknown capacity warned, missing equipment unknown allowed, library-only excludes generated, realistic game activity promoted by game-based style, repeated drills penalized, identical input identical ranking.
- [ ] Run npm test -- features/training-dna/eligibility.test.ts features/training-dna/ranker.test.ts; expect failure.
- [ ] Implement pure filter/ranker and score explanation.
- [ ] Focused tests pass.
- [ ] Commit: feat: add eligibility and transparent exercise ranking.

### Task 5 — Composition, load and exact duration

**Files:** Create composer.ts, load.ts and tests.
**Interfaces:** composePractice(context:PracticeContext,slots:ArcSlot[],rankedBySlot:RankedExercise[][]):GeneratedPractice|CompositionFailure; balanceLoad(blocks:PracticeBlock[],context:PracticeContext):BalancedPractice.
**Failure:** {ok:false,code:"NO_ELIGIBLE_EXERCISES"|"DURATION_IMPOSSIBLE",details:string[]}. Preserve locked blocks, drop optional low-priority slots first, shorten flexible blocks inside bounds, then merge compatible roles. Preserve game-transfer and ordered focuses. Load warnings estimate physical, cognitive and technical effort, never claim unknown is safe.
- [ ] RED tests: 5400 with fixed 1455 stays exact; 45/60/75/90 totals exact; all seconds positive integer; impossible bounds typed failure; high-load adjacency yields mitigation or warning.
- [ ] Run npm test -- features/training-dna/composer.test.ts features/training-dna/load.test.ts; expect failure.
- [ ] Implement deterministic selection and exact-time allocation, load balancing and why-now rationale.
- [ ] Focused tests pass.
- [ ] Commit: feat: compose exact-duration practice arcs.

### Task 6 — Validation and top-level generator

**Files:** Create validator.ts, generator.ts and tests.
**Interfaces:** validatePractice(practice:GeneratedPractice,context:PracticeContext):{errors:ValidationIssue[],warnings:ValidationWarning[]}; generatePractice(context:PracticeContext):GenerationResult.
- [ ] RED tests: exact total, valid focus sequence, source-policy violation, missing game transfer (error unless coach override and warning), no history/AI dependency, insufficient library typed failure, historical version reference preserved.
- [ ] Run npm test -- features/training-dna/validator.test.ts features/training-dna/generator.test.ts; expect failure.
- [ ] Implement deterministic pipeline: arc -> eligibility -> ranking -> composition -> load -> validation. Optional AI cannot bypass validator.
- [ ] Tests, lint and typecheck pass.
- [ ] Commit: feat: orchestrate and validate training DNA.

### Task 7 — Feedback evidence and future proposals

**Files:** Create feedback.ts and feedback.test.ts.
**Interfaces:** interpretFeedback(feedback:PracticeFeedback,practice:GeneratedPractice):{evidence:FocusEvidence[],recommendations:PracticeRecommendation[]}; feedback includes completed/skipped block IDs, 1..5 per-focus rating, difficulty, useful/problematic exercises, optional notes/problem categories. Recommendations have evidence IDs, confidence and proposed/accepted/rejected status.
- [ ] RED tests: reception 2/5 and short-serve problem propose reinforcement; repeated jump-load complaint proposes reduced load; skipped blocks are not completed; no approved level change and no invented category from blank notes.
- [ ] Run npm test -- features/training-dna/feedback.test.ts; expect failure.
- [ ] Implement provenance-preserving, future-only recommendations.
- [ ] Focused tests pass.
- [ ] Commit: feat: translate feedback into coaching recommendations.

### Task 8 — Save and isolate practices

**Files:** Add practice/feedback/recommendation tables and RLS to migration (or sequential 202610180002_training_dna_practices.sql); create repository.ts, repository.test.ts; extend supabase/tests/training_dna.sql.
**Interfaces:** createTrainingRepository(dataSource,actor) providing savePractice, getPractice, saveFeedback, listRecommendations, setRecommendationStatus. Tables have coach_id, group_id, practice block snapshots, revision integer and evidence references. Require owning coach/group in policy and repository; revision mismatch -> PRACTICE_CONFLICT.
- [ ] RED SQL tests: own access works; Coach B/anon cannot read, forge group ID or mutate other coach feedback/recommendations. Unit tests: optimistic conflict and unchanged historical exercise snapshots.
- [ ] Run supabase test db and npm test -- features/training-dna/repository.test.ts; expect failure.
- [ ] Implement additive tables/RLS and owner-scoped repository.
- [ ] SQL/unit tests pass.
- [ ] Commit: feat: persist protected coaching plans and feedback.

### Task 9 — Hebrew practice creation and coaching flow

**Files:** Create actions.ts, practice-form.tsx, practice-preview.tsx, feedback-form.tsx with tests. Modify app/(app)/practices/new/page.tsx, create app/(app)/practices/[practiceId]/page.tsx.
**Interfaces:** generatePracticeAction, savePracticeAction, submitPracticeFeedbackAction, setPracticeRecommendationStatusAction; each checks authenticated active coach, schema and ownership. UI: select saved group and primary outcome, order focuses, choose warm-up/style/policy; view role and rationale; replace/easier/harder/lock/reorder one block; save, live timer, skipped/completed, quick feedback, next proposal.
- [ ] RED RTL/component tests: Focus 1 order, fixed warm-up displayed as 24:15, total 90:00, why-now explanation, block edit preserving unrelated locked blocks; server action rejects unauthorized mutation.
- [ ] Run npm test -- features/training-dna/practice-form.test.tsx features/training-dna/practice-preview.test.tsx features/training-dna/actions.test.ts; expect failure.
- [ ] Implement server-only wiring, UI and fallback error messages.
- [ ] Unit tests, npm run lint, npm run typecheck and npm run build pass.
- [ ] Commit: feat: deliver coaching practice workflow.

### Task 10 — Acceptance and release verification

**Files:** Create e2e/training-dna.spec.ts and adjust CI only if necessary.
- [ ] RED E2E: group -> outcome -> arc -> explain block -> change difficulty -> fixed warm-up preserved -> save -> live mode -> feedback -> future proposal; verify approved skill level unchanged, absent history supported and no generated exercise under library-only.
- [ ] Run npm run test:e2e -- e2e/training-dna.spec.ts; expect failure.
- [ ] Fix only failed acceptance requirements.
- [ ] Run npm test && npm run lint && npm run typecheck && npm run build && npm run test:e2e, plus supabase test db. Confirm final GitHub Actions succeeds.
- [ ] Commit: test: verify full Training DNA coaching loop.

## Shipping boundary

This plan implements the full Next.js/Supabase edition. The public GitHub Pages path /my-center/season-design/ is currently a separate plain HTML/JavaScript edition. Porting/shared-bundling this engine to that URL requires a separate browser adapter/release gate or a verified full-stack deployment. Never claim the live URL has been upgraded just because feature-branch tests passed. No service-role secret goes to Pages.

## Self-review

Ten independently reviewable tasks, each with RED/GREEN checks; all specified subsystems covered: constraints/versions, arc, five quality dimensions, warm-up, game-transfer, load, coach ownership, feedback, editing/live UI and acceptance. All Review Focus conditions are exercised in owning tasks. No known placeholder requirements.
