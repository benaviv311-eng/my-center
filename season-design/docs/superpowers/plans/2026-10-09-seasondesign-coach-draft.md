# SeasonDesign Coach Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Coach Draft, a mobile-capable visual volleyball drill editor whose drafts can be replayed step-by-step, saved as templates, and published to the coach's personal exercise library.

**Architecture:** Draft state is persisted as draft metadata, ordered frames, and editable objects. Canvas geometry uses normalized coordinates so full/half courts scale across devices. A pure reducer owns editing/history operations; React Konva renders the court and objects; persistence and publication remain separate from canvas internals.

**Tech Stack:** Next.js + TypeScript, Supabase/PostgreSQL, React Konva/Konva, Zod, Vitest, Testing Library, Playwright.

**Spec:** `season-design/docs/superpowers/specs/2026-10-09-seasondesign-design.md`

## Global Constraints

- Coach Draft is a dedicated SeasonDesign screen, not a separate app.
- Version 1 uses discrete frames/steps, not continuous animation.
- New frames copy the prior frame before edits.
- Draft states are `draft`, `template`, `personal-library`.
- Objects stay editable data, not flattened images.
- Mobile favors landscape/full-screen; toolbox/properties become drawers.
- Presentation mode hides editing controls.
- Publishing creates a personal `source = user` exercise; it never changes canonical Sheets content.

## Review Focus

- Reopening a saved draft must restore object positions and frame order exactly.
- Undo/redo must not corrupt frame history after branching edits.
- Zoom/pan must not change stored normalized object coordinates.
- A locked object must not move from mouse or touch drag.
- Publishing or creating a variation must preserve the original draft/exercise rather than mutate it.

---

### Task 1: Draft persistence model

**Files:**
- Create: `season-design/supabase/migrations/202610090005_coach_draft.sql`
- Create: `season-design/supabase/tests/coach_draft.sql`
- Create: `season-design/features/draft/types.ts`
- Create: `season-design/features/draft/schema.ts`

**Interfaces:**
- Produces tables `drafts`, `draft_frames`, `draft_objects`.
- `DraftObjectType`: `player|coach|ball|cone|hoop|bench|target|text|arrow|zone`.
- Shared object geometry: normalized `x`, `y`, optional `width`, `height`, `rotation`, plus `locked`.
- Arrow metadata distinguishes `player-movement|ball-path|generic` and `solid|dashed`.

- [ ] **Step 1: Write failing database/type tests** for ownership, ordered frames, normalized-coordinate bounds, state values, and supported object types.
- [ ] **Step 2: Run `supabase test db` and type tests**; expected FAIL.
- [ ] **Step 3: Implement migration, policies, and Zod/domain types**.
- [ ] **Step 4: Run tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: add Coach Draft data model`.

### Task 2: Pure editor state, frames, and undo/redo

**Files:**
- Create: `season-design/features/draft/editor-state.ts`
- Create: `season-design/features/draft/editor-reducer.ts`
- Create: `season-design/features/draft/history.ts`
- Test: `season-design/features/draft/editor-reducer.test.ts`

**Interfaces:**
- Produces `draftReducer(state, action): DraftEditorState`.
- Actions include add/update/delete/duplicate object; lock; multi-select; add-before/add-after/duplicate/delete/reorder frame; undo; redo; flip court.

- [ ] **Step 1: Write failing reducer tests** for each object action and frame-copy semantics.
- [ ] **Step 2: Add failing history tests** for undo, redo, edit-after-undo clearing redo, and locked-object movement rejection.
- [ ] **Step 3: Run reducer tests**; expected FAIL.
- [ ] **Step 4: Implement immutable reducer/history** with one history entry per user-visible edit.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: add Coach Draft editor state`.

### Task 3: Court renderer and object toolbox

**Files:**
- Create: `season-design/features/draft/court/court-canvas.tsx`
- Create: `season-design/features/draft/court/volleyball-court.tsx`
- Create: `season-design/features/draft/court/render-object.tsx`
- Create: `season-design/features/draft/toolbox.tsx`
- Create: `season-design/features/draft/properties-panel.tsx`
- Test: `season-design/features/draft/court/court-canvas.test.tsx`

**Interfaces:**
- Consumes normalized editor state from Task 2.
- Produces full/half court renderer, show/hide net, show/hide position numbers, object drag/select/resize/rotate controls, and toolbox insertion.

- [ ] **Step 1: Write failing component tests** for full/half court, adding player/ball/arrow/zone, selecting, locking, and property changes.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement React Konva court and object renderers**; screen pixels convert to/from normalized geometry only at the view boundary.
- [ ] **Step 4: Implement toolbox and context-sensitive properties panel** for player and arrow metadata.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: render Coach Draft court editor`.

### Task 4: Mobile gestures and responsive editor shell

**Files:**
- Create: `season-design/features/draft/mobile/gesture-controller.ts`
- Create: `season-design/features/draft/draft-editor.tsx`
- Create: `season-design/app/(app)/drafts/new/page.tsx`
- Create: `season-design/app/(app)/drafts/[draftId]/page.tsx`
- Test: `season-design/features/draft/mobile/gesture-controller.test.ts`
- Test: `season-design/e2e/draft-mobile.spec.ts`

**Interfaces:**
- Produces responsive editor: desktop side panels; mobile drawers; two-finger zoom/pan; long-press/drag object movement; landscape-first full-screen mode.

- [ ] **Step 1: Write failing gesture tests** proving pan/zoom affects viewport transform but not persisted object coordinates.
- [ ] **Step 2: Write failing mobile E2E** for opening toolbox drawer, adding/moving an object, changing frame, and reopening properties.
- [ ] **Step 3: Implement gesture controller and responsive editor shell**.
- [ ] **Step 4: Run tests**; expected PASS.
- [ ] **Step 5: Commit** `feat: add mobile Coach Draft editing`.

### Task 5: Draft save, templates, variations, and publication

**Files:**
- Create: `season-design/features/draft/repository.ts`
- Create: `season-design/features/draft/actions.ts`
- Create: `season-design/features/draft/publish.ts`
- Test: `season-design/features/draft/publish.test.ts`

**Interfaces:**
- Produces `saveDraft(input)`, `duplicateDraft(draftId)`, `createDraftVariation(draftId)`, `publishDraftExercise(draftId)`.
- Published exercise metadata includes title, objective, type, primary/secondary skill, level, player count, duration, equipment, explanation, cues, variations, and link to originating draft.

- [ ] **Step 1: Write failing tests** for save/reload, template state, duplicate independence, parent variation link, and publication to personal library.
- [ ] **Step 2: Run tests**; expected FAIL.
- [ ] **Step 3: Implement transactional save** for draft, ordered frames, and objects.
- [ ] **Step 4: Implement publish/variation** creating a new personal exercise/current version without modifying source draft/exercise.
- [ ] **Step 5: Run tests**; expected PASS.
- [ ] **Step 6: Commit** `feat: persist and publish Coach Draft exercises`.

### Task 6: Presentation mode, export, and practice integration

**Files:**
- Create: `season-design/app/(app)/drafts/[draftId]/present/page.tsx`
- Create: `season-design/features/draft/presentation.tsx`
- Create: `season-design/features/draft/export.ts`
- Modify: `season-design/features/practices/practice-editor.tsx`
- Modify: `season-design/app/(app)/library/[exerciseId]/page.tsx`
- Test: `season-design/e2e/draft-workflow.spec.ts`

**Interfaces:**
- Produces step-by-step presentation mode; PNG export of current frame; print-friendly full-draft view for browser PDF; actions `Open in Coach Draft` and `Add to Practice`.

- [ ] **Step 1: Write failing E2E scenario** build 3 frames, save, reopen, enter presentation, move next/previous, publish, find item in Library, and add it to a practice.
- [ ] **Step 2: Run E2E test**; expected FAIL.
- [ ] **Step 3: Implement presentation mode** with no editing controls and concise frame explanation.
- [ ] **Step 4: Implement export helpers** for current-frame PNG and print/PDF layout without mutating draft data.
- [ ] **Step 5: Wire Library and Practice integration** using existing personal-exercise/practice-block contracts.
- [ ] **Step 6: Run `npm run lint && npm test && npm run test:e2e && npm run build`**; expected PASS.
- [ ] **Step 7: Commit** `feat: ship Coach Draft workflow`.
