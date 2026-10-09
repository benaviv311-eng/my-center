# TeamScore Timer & Game Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing TeamScore score-counter with the approved advanced timer/stopwatch/interval controls, natural English announcements, and the complete game-mode launcher/state layer while preserving current scoring UI.

**Architecture:** Add a self-contained `score-game-suite` module that reads team names/scores from the current DOM, owns advanced game/session state in localStorage, and augments the existing timer rather than replacing it. Keep rendering and behavior isolated behind new CSS classes and DOM nodes so current score-card patches remain untouched. Add lightweight node regression checks and only modify `index.html` to load the new assets.

**Tech Stack:** Vanilla JavaScript, CSS, browser Web Audio/Speech APIs, localStorage, Wake Lock API, existing TeamScore DOM.

**Spec:** `docs/superpowers/specs/2026-10-09-score-timer-game-suite-design.md`

## Global Constraints
- Same existing `score-counter` site; no separate app.
- Preserve current score layout, drag/resize, backgrounds and audio.
- English countdowns and announcements.
- Voice profiles include Coach and Arena Announcer.
- No forced robotic fallback: if no suitable voice is available, use visual/beep fallback.
- All approved game modes must appear in the mode launcher.
- Core canonical modes (Timed Rounds, Pressure, Four-Team Rotation, Spiegel) get dedicated setup/state behavior.

## Review Focus
- Existing score buttons and two-column layout still work after loading new module.
- Timer keeps correct time after tab hiding/return and refresh restore.
- Missing/late SpeechSynthesis voices do not break game controls.
- Four-team rerank triggers exactly once when first team reaches 10 and does not reset scores.
- Spiegel elimination/undo cannot corrupt player rotation.

---

### Task 1: Regression guard for suite loading
**Files:** Create `score-counter/score-game-suite.test.js`; Modify `score-counter/score-live-regression.test.js` only if needed.
**Interfaces:** Produces static checks for required suite assets, mode IDs, canonical rules and index load order.
- [ ] Write failing checks for `score-game-suite.js`, `score-game-suite.css` and index asset references.
- [ ] Run node test and verify failure.
- [ ] Add minimal asset files and index references.
- [ ] Run tests and verify pass.
- [ ] Commit.

### Task 2: Advanced time controls
**Files:** Create/extend `score-counter/score-game-suite.js`, `score-counter/score-game-suite.css`.
**Interfaces:** Produces `window.TeamScoreGameSuite.timer` with mode/start/pause/reset/adjust/lap/interval APIs and persistent session snapshot.
- [ ] Add tests for Stopwatch/Timer/Intervals labels and persistence keys.
- [ ] Implement wall-clock based timer state, Wake Lock, quick adjustments, laps, interval phases, start delay and overtime.
- [ ] Augment existing `.score-live-timer` with advanced controls without replacing its existing buttons.
- [ ] Verify static regressions.
- [ ] Commit.

### Task 3: Natural announcement engine
**Files:** `score-counter/score-game-suite.js`, `score-counter/score-game-suite.css`.
**Interfaces:** Produces `announcer.say(text, priority)`, voice profile selection, countdown helpers and pronunciation aliases.
- [ ] Add tests for Coach/Arena profiles, English countdown strings and no forced robotic fallback.
- [ ] Implement preferred natural English voice selection, profile rate/pitch/volume, visual fallback, beeps and team aliases.
- [ ] Wire timer countdown/work/rest/final announcements.
- [ ] Verify.
- [ ] Commit.

### Task 4: Game launcher + persistence
**Files:** `score-counter/score-game-suite.js`, `score-counter/score-game-suite.css`.
**Interfaces:** Produces game catalog, launcher sheet, favorites/recent/history/presets storage, quick start and Surprise Me.
- [ ] Add tests asserting every approved mode ID is present.
- [ ] Implement Games button/sheet and mode cards.
- [ ] Add favorite/recent/preset persistence and Court Mode toggle.
- [ ] Verify.
- [ ] Commit.

### Task 5: Canonical game engines
**Files:** `score-counter/score-game-suite.js`.
**Interfaces:** Produces session engines for timed-rounds, pressure, four-team-rotation and spiegel.
- [ ] Add static behavior checks for canonical defaults and transition names.
- [ ] Implement setup forms/state transitions and undo/redo action log.
- [ ] Integrate with existing score values via DOM observation/click interception where safe.
- [ ] Add tiebreak/golden-point hooks.
- [ ] Verify.
- [ ] Commit.

### Task 6: Generic rules engine for remaining modes
**Files:** `score-counter/score-game-suite.js`.
**Interfaces:** Produces reusable target/time/streak/lives/rounds/custom-rule state for all remaining catalog entries.
- [ ] Add tests for rule schema keywords and mode metadata.
- [ ] Implement generic configurable session panel and scoring helpers.
- [ ] Add custom game save/duplicate and weighted drill scoring.
- [ ] Verify.
- [ ] Commit.

### Task 7: Rosters, players, stats and history
**Files:** `score-counter/score-game-suite.js`, `score-counter/score-game-suite.css`.
**Interfaces:** Produces roster CRUD, player session stats, game summary, CSV export and local history.
- [ ] Add tests for storage keys and Spiegel/player-tracking summary fields.
- [ ] Implement roster/player data, optional player tracking, stats aggregation and summary/export.
- [ ] Verify.
- [ ] Commit.

### Task 8: Final integration verification
**Files:** `score-counter/index.html`, tests.
**Interfaces:** Final load order and cache-busting versions.
- [ ] Run `node score-counter/score-live-regression.test.js`.
- [ ] Run `node score-counter/score-game-suite.test.js`.
- [ ] Run `node --check score-counter/score-game-suite.js`.
- [ ] Inspect final index load order and ensure suite loads after current score/audio modules.
- [ ] Commit final cache bump.
