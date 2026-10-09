# SeasonDesign Implementation Plan Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement these plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver SeasonDesign as a sequence of independently testable vertical slices.

**Architecture:** The approved product spec spans several independent subsystems, so implementation is split into five plans. Execute them in dependency order rather than as one oversized change.

**Tech Stack:** Next.js + TypeScript, Supabase/PostgreSQL, Google sign-in, PWA, Google Sheets synchronization, server-side AI.

**Spec:** `season-design/docs/superpowers/specs/2026-10-09-seasondesign-design.md`

## Global Constraints

- SeasonDesign remains isolated under `season-design/` and has its own runtime and URL.
- User data is stored in Supabase and scoped to its owning coach.
- Canonical exercise editing remains in Google Sheets; runtime reads use synchronized PostgreSQL data.
- AI runs server-side and never invents group history or silently changes approved levels.
- Historical practices keep snapshots so later exercise edits do not rewrite history.

## Review Focus

- Cross-user data isolation.
- Offline and weak-network behavior.
- Historical snapshot integrity after library changes.
- Generator duration and focus-priority correctness.
- Mobile usability, especially Coach Draft gestures.

---

## Execution order

1. `2026-10-09-seasondesign-foundation.md` — app shell, auth, PWA, groups, skill levels.
2. `2026-10-09-seasondesign-library-sync.md` — exercise model, Google Sheets sync, versioning, Library.
3. `2026-10-09-seasondesign-practice-generator.md` — hybrid generator, warm-ups, saved/editable practices.
4. `2026-10-09-seasondesign-programs-feedback.md` — programs, feedback, progress inference, adaptation, dashboard.
5. `2026-10-09-seasondesign-coach-draft.md` — visual drill editor, frames, presentation mode, publish to personal library.

Plans 1 and 2 establish contracts used by the generator. Plan 4 depends on saved practices from Plan 3. Plan 5 may begin after Plans 1 and 2, but its final publish-to-practice integration should be verified after Plan 3.
