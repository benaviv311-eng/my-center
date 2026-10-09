# SeasonDesign Programs, Feedback & Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build multi-practice programs that adapt through explicit coach feedback while preserving coach control over approved skill levels and future program changes.

**Architecture:** Programs store planned topic/focus intent separately from generated practice details. Closing a completed practice creates structured feedback and progress evidence. Deterministic rules produce bounded recommendations; AI may summarize free text and explain a proposal, but every lasting skill-level or program-plan change requires coach approval.

**Tech Stack:** Next.js + TypeScript, Supabase/PostgreSQL, existing practice generator, server-side AI summarizer, Vitest, Playwright.

**Spec:** `season-design/docs/superpowers/specs/2026-10-09-seasondesign-design.md`

## Global Constraints

- Program quick lengths are 8, 10, 12, 16, plus custom.
- Programs are organized by topics/development goals, not fixed drill lists.
- Adaptation covers both difficulty and future topic distribution.
- Feedback includes rating for each focus, overall difficulty, optional overall rating, free text, and completed/modified/skipped information.
- Current coach-approved level and system-suggested level are stored separately.
- The system proposes changes; the coach approves, rejects, or overrides them.
- Completed practices/program sessions are never rewritten by later adaptation.

## Review Focus

- One unusually good practice must not automatically raise a permanent skill level.
- Applying a program proposal must only alter future uncompleted sessions.
- Rejected recommendations must remain auditable and must not immediately reappear unchanged without new evidence.
- Feedback for a partially completed practice must not treat skipped blocks as successful evidence.
- Free-text AI summarization must not overwrite or contradict structured coach ratings.

---

### Task 1: Program, feedback, and recommendation schema

**Files:**
- Create: `season-design/supabase/migrations/202610090004_programs_feedback.sql`
- Create: `season-design/supabase/tests/programs_feedback.sql`
- Create: `season-design/features/programs/types.ts`
- Create: `season-design/features/feedback/types.ts`

**Interfaces:**
- Produces tables `programs`, `program_sessions`, `practice_feedback`, `focus_feedback`, `practice_block_outcomes`, `progress_events`, `recommendations`.
- Recommendation status: `pending`, `approved`, `rejected`, `superseded`.

- [ ] **Step 1: Write failing database tests** for ownership, session order, feedback tied to completed practice, and recommendation status transitions.
- [ ] **Step 2: Run `supabase test db`**; expected FAIL.
- [ ] **Step 3: Implement migration and domain types**; future session intent stores topic + ordered focuses independently of generated practice blocks.
- [ ] **Step 4: Add private-data policies** matching existing coach ownership.
- [ ] **Step 5: Run database tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: add programs and feedback data model`.

### Task 2: Program builder and distribution logic

**Files:**
- Create: `season-design/features/programs/schema.ts`
- Create: `season-design/features/programs/build-program.ts`
- Create: `season-design/features/programs/repository.ts`
- Test: `season-design/features/programs/build-program.test.ts`

**Interfaces:**
- Produces `buildProgram(input: ProgramInput): PlannedSession[]`.
- `ProgramInput` contains group, session count, topic targets, optional focus priorities, and progression goals.

- [ ] **Step 1: Write failing tests** for 8/10/12/16/custom counts, exact count preservation, requested topic emphasis, and no empty session intent.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement weighted session distribution** using largest-remainder allocation so topic counts always sum to requested session count.
- [ ] **Step 4: Spread repeated primary topics across the schedule when possible** instead of clustering them unintentionally.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: build topic-based training programs`.

### Task 3: Close-practice feedback workflow

**Files:**
- Create: `season-design/features/feedback/schema.ts`
- Create: `season-design/features/feedback/actions.ts`
- Create: `season-design/app/(app)/practices/[practiceId]/feedback/page.tsx`
- Create: `season-design/features/feedback/feedback-form.tsx`
- Test: `season-design/e2e/practice-feedback.spec.ts`

**Interfaces:**
- Produces `submitPracticeFeedback(input)` with focus rating `1..5`, difficulty `too-easy|appropriate|too-hard`, optional overall rating, notes, and per-block outcome `completed|modified|skipped`.

- [ ] **Step 1: Write failing validation/E2E tests** for complete feedback, missing focus rating, partial practice, and skipped blocks.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement the close-practice form and persistence**.
- [ ] **Step 4: Mark the associated program session completed only after practice closure** when it originated from a program.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: add post-practice feedback`.

### Task 4: Progress inference and skill-level recommendations

**Files:**
- Create: `season-design/features/progress/infer.ts`
- Create: `season-design/features/progress/repository.ts`
- Test: `season-design/features/progress/infer.test.ts`

**Interfaces:**
- Produces `inferSkillRecommendations(groupId): Promise<SkillRecommendation[]>`.
- Progression recommendation requires at least 3 relevant completed-practice observations, median focus rating >= 4, and no `too-hard` result in the latest 2 relevant observations.
- Regression recommendation requires at least 2 of the latest 3 relevant ratings <= 2 or `too-hard` in at least 2 relevant observations.
- Recommendations move at most one level step and never mutate `approved_level` directly.

- [ ] **Step 1: Write failing tests** for one strong session (no change), three strong sessions (up recommendation), repeated difficulty (down recommendation), skipped focus (ignored), and boundary levels.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement inference over structured feedback evidence** and persist rationale/evidence references in `recommendations`.
- [ ] **Step 4: Add approve/reject actions**; approval writes `skill_level_history`, rejection records status without changing approved level.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: infer group skill progress`.

### Task 5: Program adaptation proposals

**Files:**
- Create: `season-design/features/programs/adapt.ts`
- Create: `season-design/features/programs/adaptation-actions.ts`
- Test: `season-design/features/programs/adapt.test.ts`

**Interfaces:**
- Produces `proposeProgramAdaptations(programId): Promise<ProgramAdaptation[]>`.
- Weakness evidence: at least 2 of the latest 3 relevant focus ratings <= 2; proposal may promote that topic from secondary to primary in a future session or add one additional future primary session by swapping weight from an overrepresented topic.
- No proposal modifies completed sessions; no proposal is applied without approval.

- [ ] **Step 1: Write failing tests** for reception weakness, already-balanced program, completed-session immutability, rejected duplicate proposal, and improvement after prior weakness.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement bounded proposal generation** from current program distribution + feedback evidence.
- [ ] **Step 4: Implement approve/reject** with an atomic future-session update and audit event.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: adapt future program sessions`.

### Task 6: Free-text feedback summary and coaching observations

**Files:**
- Create: `season-design/features/feedback/summarize.ts`
- Create: `season-design/features/progress/observations.ts`
- Test: `season-design/features/progress/observations.test.ts`

**Interfaces:**
- Produces `summarizeFeedback(feedback): Promise<FeedbackSummary>` and `getGroupObservations(groupId): Promise<GroupObservation[]>`.
- AI summary is descriptive evidence only; structured ratings remain authoritative for deterministic thresholds.

- [ ] **Step 1: Write failing tests with fake AI summary output** proving summaries cannot change numeric ratings or approved levels.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement server-side feedback summarization and 2–4 prioritized group observations**.
- [ ] **Step 4: Run tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: summarize coaching progress`.

### Task 7: Programs, group history, and Home dashboard UI

**Files:**
- Create: `season-design/app/(app)/programs/page.tsx`
- Create: `season-design/app/(app)/programs/new/page.tsx`
- Create: `season-design/app/(app)/programs/[programId]/page.tsx`
- Create: `season-design/features/programs/program-builder.tsx`
- Create: `season-design/features/programs/program-timeline.tsx`
- Modify: `season-design/app/(app)/groups/[groupId]/page.tsx`
- Create: `season-design/app/(app)/page.tsx`
- Test: `season-design/e2e/program-adaptation.spec.ts`

**Interfaces:**
- Consumes program, feedback, recommendation, and observation services.
- Produces active-program timeline, adaptation approval UI, group history/balance, and dashboard actions.

- [ ] **Step 1: Write failing E2E scenario**: create 8-session program, close practices with weak reception feedback, receive a reception-weight proposal, approve it, and verify only future sessions change.
- [ ] **Step 2: Run E2E test**; expected FAIL.
- [ ] **Step 3: Implement Programs screens and approval controls**.
- [ ] **Step 4: Extend Group screen** with recent work, topic balance, current skill recommendations, and 2–4 observations.
- [ ] **Step 5: Implement Home dashboard** for next session, pending feedback, recent groups, and active programs.
- [ ] **Step 6: Run `npm run lint && npm test && npm run test:e2e && npm run build`**; expected PASS.
- [ ] **Step 7: Commit** `feat: ship adaptive season planning workflow`.
