# Score Counter Time Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one authoritative, accessible timing HUD in the existing Score Counter that delegates to Timed Rounds, Game Suite timed modes, or Time Center without introducing a new timer engine.

**Architecture:** Add a presentation-only `score-time-hub.js` adapter layer that selects the highest-priority active timing provider and normalizes its snapshot/actions. Existing engines remain authoritative; provider files expose only the minimum read/control hooks needed by the hub. The hub owns UI state only (visibility/position), derives every displayed clock value from provider wall-clock/deadline state, and suppresses duplicate legacy timing surfaces when ready.

**Tech Stack:** Vanilla JavaScript, CSS, browser CustomEvent/localStorage APIs, Node-based regression tests, GitHub Pages loader in `score-counter/index.html`.

**Spec:** `docs/superpowers/specs/2026-10-14-score-counter-time-hub-design.md`

## Global Constraints

- Keep the feature on the existing `score-counter/` site; do not create a second app or route.
- Provider priority is exactly: active Timed Rounds → active supported Game Suite timed mode → Time Center → idle fallback.
- The hub must not persist or own authoritative timer fields such as `running`, `baseMs`, `deadline`, elapsed time, or countdown state.
- Do not change Timed Rounds rules, scoring rules, existing localStorage formats, or timer semantics.
- Supported Game Suite modes for the first release are `timed-game`, `timed-overtime`, time-limited `target-chase`, and `countdown-target`; `timed-rounds` remains owned by its dedicated provider.
- The full Time Center remains available for standalone setup/advanced controls; the compact hub becomes the canonical visible timing surface.
- Cache-bust modified timing assets in `index.html` and update their regression expectations in the same task.

## Review Focus

- Provider disappears or session mode changes while the HUD is open: hub must reselect immediately without resetting any source state. Covered in Task 4.
- Browser returns from background after time elapsed: displayed value must be recomputed from the provider, never from hub ticks. Covered in Task 4.
- Timed Rounds transition/turn/golden/finished phases: only legal controls appear and active team/round context stays correct. Covered in Tasks 2 and 4.
- Early page load before provider globals exist: hub renders idle safely and retries instead of throwing. Covered in Task 4.
- Duplicate timing UI: legacy compact timer is hidden only after the hub is ready; the full Time Center panel must remain usable. Covered in Task 5.

---

### Task 1: Expose Time Center read events without changing semantics

**Files:**
- Modify: `score-counter/score-time-center.js`
- Modify: `score-counter/score-time-center-regression.test.js`

**Interfaces:**
- Produces: `TeamScoreTimeCenter.getTimingSnapshot(at = Date.now()) -> {mode,running,ended,valueMs,sign,phase,interval,overtimeActive}`
- Produces: browser event `teamscore:timechange` after meaningful Time Center state mutations.
- Existing public methods (`start`, `pause`, `reset`, `lap`, `split`, `skip`, `overtime`, `open`) remain unchanged.

- [ ] **Step 1: Write the failing regression assertions**

Add assertions that `score-time-center.js` contains `getTimingSnapshot`, `teamscore:timechange`, and keeps `displayValue(at)`/`Date.now()` as the source of displayed time. Do not change loader version assertions yet.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node score-counter/score-time-center-regression.test.js`

Expected: FAIL because `getTimingSnapshot` / event hook are missing.

- [ ] **Step 3: Implement `getTimingSnapshot(at = Date.now())` and one event helper**

Return current values by calling existing Time Center computations; do not duplicate timer arithmetic. Emit `teamscore:timechange` from existing mutation points after state is persisted or a phase changes.

- [ ] **Step 4: Run focused checks and verify GREEN**

Run:
`node score-counter/score-time-center-regression.test.js && node --check score-counter/score-time-center.js`

Expected: both PASS.

- [ ] **Step 5: Commit**

`git add score-counter/score-time-center.js score-counter/score-time-center-regression.test.js && git commit -m "feat: expose time center timing snapshot"`

---

### Task 2: Expose Timed Rounds snapshot/action surface

**Files:**
- Modify: `score-counter/score-timed-rounds.js`
- Modify: `score-counter/score-timed-rounds-regression.test.js`

**Interfaces:**
- Produces: `TeamScoreTimedRounds.getTimingSnapshot(at = Date.now()) -> null | {phase,running,remainingMs,activeTeam,activeTeamName,round,rounds,tiebreak,golden,finished}`
- Existing actions remain canonical: `startNow()`, `addBreak()`, `pause()`, `skip()`.
- Emits `teamscore:timechange` whenever saved runtime meaningfully changes.

- [ ] **Step 1: Add failing assertions for the dedicated provider contract**

Test for `getTimingSnapshot`, `activeTeamName`, `remainingMs`, `teamscore:timechange`, and retention of the existing public actions.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node score-counter/score-timed-rounds-regression.test.js`

Expected: FAIL on the new snapshot/event assertions.

- [ ] **Step 3: Implement the snapshot using existing `runtime`, `remaining()`, `teamCards()`, and session state**

Return `null` when Timed Rounds is not the active Game Suite mode. Do not move or rewrite transition, tiebreak, golden-point, or winner logic.

- [ ] **Step 4: Emit `teamscore:timechange` through the existing runtime-save path**

Use one helper so start/pause/transition/turn/finish changes all notify the hub without duplicating event code.

- [ ] **Step 5: Run checks and commit**

Run: `node score-counter/score-timed-rounds-regression.test.js && node --check score-counter/score-timed-rounds.js`

Expected: PASS.

Commit: `git add score-counter/score-timed-rounds.js score-counter/score-timed-rounds-regression.test.js && git commit -m "feat: expose timed rounds timing snapshot"`

---

### Task 3: Expose the minimal Game Suite timing API

**Files:**
- Modify: `score-counter/score-game-suite.js`
- Modify: `score-counter/score-game-suite.test.js`

**Interfaces:**
- Produces: `TeamScoreGameSuite.timing.getSnapshot(at = Date.now()) -> null | {mode,running,valueMs,overtime,session}` for `timed-game`, `timed-overtime`, time-limited `target-chase`, and `countdown-target` only.
- Produces: `TeamScoreGameSuite.timing.perform(actionId) -> boolean` supporting `start`, `pause`, `reset`, `add-10`, `add-30`, and `sub-10` by delegating to existing private timer functions.
- Emits `teamscore:timechange` from existing timer/session persistence paths.

- [ ] **Step 1: Extend `score-game-suite.test.js` with failing API assertions**

Assert the `timing` object, supported mode identifiers, `getSnapshot`, `perform`, and the shared event name exist; assert `timed-rounds` is not in the Game Suite hub timing-provider allowlist.

- [ ] **Step 2: Run the test and verify RED**

Run: `node score-counter/score-game-suite.test.js`

Expected: FAIL because the public timing API is absent.

- [ ] **Step 3: Implement the timing API as wrappers around existing `timerCurrent`, `timerStart`, `timerPause`, `timerReset`, and `timerAdjust`**

Do not create parallel timer state. `getSnapshot()` returns `null` for non-supported/non-active modes.

- [ ] **Step 4: Add shared time-change emission to existing persistence points**

Notify after timer mutations and session changes so the hub reacts immediately to mode changes.

- [ ] **Step 5: Run checks and commit**

Run: `node score-counter/score-game-suite.test.js && node --check score-counter/score-game-suite.js`

Expected: PASS.

Commit: `git add score-counter/score-game-suite.js score-counter/score-game-suite.test.js && git commit -m "feat: expose game suite timing api"`

---

### Task 4: Build the Time Hub adapter and provider-selection logic

**Files:**
- Create: `score-counter/score-time-hub.js`
- Create: `score-counter/score-time-hub-regression.test.js`

**Interfaces:**
- Produces: `TeamScoreTimeHub.getSnapshot() -> normalized provider snapshot`
- Produces: `TeamScoreTimeHub.perform(actionId) -> boolean`
- Produces: `TeamScoreTimeHub.refresh() -> void`
- Produces normalized snapshot shape from the spec: `{id,label,kind,status,valueMs,sign,phase,context,primaryAction,actions}`.
- Consumes provider APIs from Tasks 1–3.

- [ ] **Step 1: Create a failing regression test for provider priority and delegation**

The test must assert these behaviors with stub providers/test hooks rather than only searching text:
1. active Timed Rounds wins over Game Suite and Time Center;
2. Game Suite wins over Time Center when no dedicated provider is active;
3. Time Center is fallback;
4. no providers returns idle;
5. `perform('pause')` calls the selected provider action and does not mutate a hub timer object.

Also add structural assertions that the hub does not declare authoritative fields named `baseMs`, `deadline`, `anchorWall`, or its own `running` state object.

- [ ] **Step 2: Run the hub test and verify RED**

Run: `node score-counter/score-time-hub-regression.test.js`

Expected: FAIL because `score-time-hub.js` does not exist.

- [ ] **Step 3: Implement adapters and exact priority**

Implement three adapters in this order: Timed Rounds, Game Suite, Time Center. Derive Timed Rounds remaining time from its provider snapshot/deadline values; derive Time Center display from `getTimingSnapshot`; never increment a hub counter.

- [ ] **Step 4: Implement context-valid actions**

Timed Rounds: start now, pause/resume, add break only during transition, skip only during turn. Game Suite: start/pause/reset and safe adjust actions. Time Center: start/pause/reset plus lap/split/skip/overtime only when meaningful for the current Time Center mode.

- [ ] **Step 5: Handle re-selection and early-load failure**

Listen to `teamscore:timechange`; also use a presentation-only refresh cadence while visible/running. If a global/provider disappears or returns `null`, select the next provider on the same refresh. The refresh may repaint but must never mutate provider time state.

- [ ] **Step 6: Run checks and commit**

Run: `node score-counter/score-time-hub-regression.test.js && node --check score-counter/score-time-hub.js`

Expected: PASS.

Commit: `git add score-counter/score-time-hub.js score-counter/score-time-hub-regression.test.js && git commit -m "feat: add score counter time hub adapters"`

---

### Task 5: Add the accessible compact HUD and suppress duplicate timer surfaces

**Files:**
- Create: `score-counter/score-time-hub.css`
- Modify: `score-counter/score-time-hub.js`
- Modify: `score-counter/score-time-hub-regression.test.js`

**Interfaces:**
- Hub root: `.score-time-hub`
- Clock: `[data-time-hub-clock]`
- Mode/source: `[data-time-hub-label]`
- Context: `[data-time-hub-context]`
- Actions: `[data-time-hub-action]`
- Advanced/open-full control calls `TeamScoreTimeCenter.open()`.
- UI-only persistence key: `teamScoreTimeHub.ui.v1` containing position/collapsed preference only.

- [ ] **Step 1: Add failing UI regression assertions**

Assert one HUD root, one large clock, source/context labels, action buttons generated from snapshot actions, an advanced/open-full control, UI-only persistence key, and no stored timer value in hub localStorage payload.

Add a CSS assertion that legacy `.score-live-timer` is hidden only under `body.score-time-hub-ready`, while `.score-time-center-panel` is not hidden by hub CSS.

- [ ] **Step 2: Run test and verify RED**

Run: `node score-counter/score-time-hub-regression.test.js`

Expected: FAIL on HUD/CSS assertions.

- [ ] **Step 3: Render the compact HUD**

Show source/mode, large tabular clock, phase/context, one primary control, and only valid secondary controls. Use Hebrew-facing labels where the surrounding Score Counter UI is Hebrew; preserve game/team names as stored.

- [ ] **Step 4: Add drag/position accessibility without owning time**

Allow pointer drag from a dedicated handle/header, clamp the HUD to the viewport, and persist only `x`, `y`, and collapsed state in `teamScoreTimeHub.ui.v1`. Provide visible focus states and buttons at least 44px high on touch layouts.

- [ ] **Step 5: Suppress duplicate legacy compact timer after hub initialization**

On successful HUD mount add `body.score-time-hub-ready`; CSS hides the old compact timer surface under that class. Do not hide or disable the full `.score-time-center-panel`.

- [ ] **Step 6: Run checks and commit**

Run: `node score-counter/score-time-hub-regression.test.js && node --check score-counter/score-time-hub.js`

Expected: PASS.

Commit: `git add score-counter/score-time-hub.js score-counter/score-time-hub.css score-counter/score-time-hub-regression.test.js && git commit -m "feat: add accessible time hub hud"`

---

### Task 6: Wire loader versions and CI coverage

**Files:**
- Modify: `score-counter/index.html`
- Modify: `score-counter/score-time-center-regression.test.js`
- Modify: `score-counter/score-timed-rounds-regression.test.js`
- Modify: `score-counter/score-game-suite.test.js`
- Modify: `score-counter/score-time-hub-regression.test.js`
- Modify: `.github/workflows/score-counter-live-tools-test.yml`

**Interfaces:**
- Load order must place provider scripts before `score-time-hub.js`.
- New assets: `score-time-hub.css?v=1`, `score-time-hub.js?v=1`.
- Cache-bump modified provider JS assets to `score-time-center.js?v=2`, `score-timed-rounds.js?v=2`, `score-game-suite.js?v=2`; update matching regression expectations.

- [ ] **Step 1: Add failing loader-order assertions**

In the hub regression test, assert hub CSS/JS are loaded and that the positions of `score-game-suite.js`, `score-time-center.js`, and `score-timed-rounds.js` in `index.html` precede `score-time-hub.js`.

- [ ] **Step 2: Run the timing regressions and verify RED**

Run:
`node score-counter/score-time-hub-regression.test.js && node score-counter/score-time-center-regression.test.js && node score-counter/score-timed-rounds-regression.test.js && node score-counter/score-game-suite.test.js`

Expected: loader/version assertions fail before wiring.

- [ ] **Step 3: Update `index.html` loader and cache versions**

Add hub CSS to the style chain and hub JS after all timing providers. Keep the existing Score Counter route and compressed-base bootstrap unchanged.

- [ ] **Step 4: Extend the existing Score Counter workflow**

Add hub/provider files and relevant tests to workflow path triggers. Add commands for `score-time-hub-regression.test.js`, `score-time-center-regression.test.js`, `score-timed-rounds-regression.test.js`, `score-game-suite.test.js`, and `node --check` on the four timing JS files.

- [ ] **Step 5: Run the complete timing verification locally**

Run:
`node score-counter/score-time-hub-regression.test.js && node score-counter/score-time-center-regression.test.js && node score-counter/score-timed-rounds-regression.test.js && node score-counter/score-game-suite.test.js && node --check score-counter/score-time-hub.js && node --check score-counter/score-time-center.js && node --check score-counter/score-timed-rounds.js && node --check score-counter/score-game-suite.js`

Expected: all PASS.

- [ ] **Step 6: Run existing Score Counter regression suites most likely to catch integration damage**

Run:
`node score-counter/score-live-regression.test.js && node score-counter/score-layout-menu-regression.test.js && node score-counter/score-timed-rounds-regression.test.js && node score-counter/score-game-suite.test.js`

Expected: all PASS. Any existing unrelated failure must be documented before claiming completion.

- [ ] **Step 7: Commit**

`git add score-counter/index.html score-counter/score-time-*.js score-counter/score-time-*.css score-counter/score-time-*-regression.test.js score-counter/score-timed-rounds* score-counter/score-game-suite* .github/workflows/score-counter-live-tools-test.yml && git commit -m "feat: wire score counter time hub"`

---

### Task 7: Browser verification and release gate

**Files:**
- No new product files unless verification reveals a defect; defects return to the owning task with a failing regression test first.

**Interfaces:**
- Verifies the shipped behavior against the design acceptance criteria.

- [ ] **Step 1: Verify standalone Time Center fallback**

Open the existing Score Counter page with no timed game active. Confirm exactly one compact timing HUD is visible; Start/Pause/Reset operate Time Center; opening advanced controls opens the full Time Center without revealing a second compact timer.

- [ ] **Step 2: Verify Game Suite timed mode takeover**

Start `Timed Game`, then `Timed + Overtime`, `Target Chase` with duration, and `Countdown Target`. Confirm the HUD source/context switches automatically and controls affect the Game Suite timer.

- [ ] **Step 3: Verify Timed Rounds priority and context**

Start Timed Rounds. Confirm it overrides the Game Suite/Time Center display and shows current team, round, transition/turn state, tiebreak/golden/finished state as applicable. Confirm illegal actions are absent.

- [ ] **Step 4: Verify background correctness**

With a running countdown, background the tab long enough for multiple seconds to elapse, return, and confirm the displayed time matches provider wall-clock/deadline state rather than a paused visual tick count.

- [ ] **Step 5: Verify provider fallback**

Exit the timed game/session and confirm the HUD falls back to Time Center without resetting either provider's stored state.

- [ ] **Step 6: Verify mobile/touch accessibility**

Confirm the HUD is draggable via its handle, remains clamped on-screen, action targets are touch-sized, and position persists after refresh without persisting clock state.

- [ ] **Step 7: Release gate**

Confirm the relevant GitHub Actions run is green and GitHub Pages deployment for the final commit is successful before reporting the Time Hub as live.
