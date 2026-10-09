# Score Timer Games V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an advanced, persistent timer/stopwatch/interval system and configurable game-mode engine to the existing TeamScore page while preserving the current simple score flow.

**Architecture:** Keep the existing compressed TeamScore app and score cards as the source of truth. Add two pure UMD cores (`score-timer-v2-core.js`, `score-games-core.js`) with node-runnable tests, then a single additive browser controller (`score-games-ui.js`) and CSS layer that bind to existing `.score-live-timer` and score cards.

**Tech Stack:** Vanilla JavaScript, browser DOM APIs, localStorage, Web Speech API (natural-voice allowlist only), Wake Lock API when available, Node.js assert tests.

**Spec:** `docs/superpowers/specs/2026-10-09-score-timer-games-v2-design.md`

## Global Constraints
- Do not replace or rewrite the compressed TeamScore app.
- Default score UI remains simple and current +/- controls keep working.
- English countdown/announcements only.
- No deliberately robotic TTS fallback; if a preferred natural voice is unavailable, use tones/visuals.
- All advanced state must persist locally and recover safely after refresh.
- V2 code must be additive and isolated under `score-counter/`.

## Review Focus
- Refresh while a countdown/interval is active must recover from timestamps rather than restart or drift.
- Score-card DOM changes from the existing app must not break mode tracking; controller must re-discover cards safely.
- Four-team halftime ranking must be stable on ties and must not reset individual scores.
- Spiegel undo must restore both bad-point total and categorized error data.
- Natural voice unavailability must not silently choose an arbitrary robotic system voice.

---

### Task 1: Timer core

**Files:**
- Create: `score-counter/score-timer-v2-core.js`
- Create: `score-counter/score-timer-v2-core.test.js`

**Interfaces:**
- Produces `ScoreTimerV2Core.createTimerState`, `transition`, `snapshot`, `formatClock`, `createIntervalPlan`, `restoreTimer`.

- [ ] Write tests for stopwatch elapsed time, countdown completion/overtime, interval work-rest-round transitions, and timestamp restore.
- [ ] Run `node score-counter/score-timer-v2-core.test.js` and verify RED because the module is absent.
- [ ] Implement the minimal pure state machine.
- [ ] Run the test and verify GREEN.

### Task 2: Game-mode core

**Files:**
- Create: `score-counter/score-games-core.js`
- Create: `score-counter/score-games-core.test.js`

**Interfaces:**
- Produces `ScoreGamesCore.catalog`, `createGame`, `applyScore`, `undo`, `redo`, `rankTeams`, `nextTimedRoundTurn`, `announcementFor`, `createCustomMode`.
- Consumes no browser DOM.

- [ ] Write tests for First-to-X/Win-by-2, Pressure Game score start, Timed Rounds turn order/totals, Four-Team 10-point regrouping, Spiegel bad points/categories/undo, elimination, target chase, streak and custom weighted scoring.
- [ ] Run `node score-counter/score-games-core.test.js` and verify RED.
- [ ] Implement the game catalog plus reducer-style state transitions.
- [ ] Run the test and verify GREEN.

### Task 3: Browser control center and voice

**Files:**
- Create: `score-counter/score-games-ui.js`
- Create: `score-counter/score-games.css`

**Interfaces:**
- Consumes both cores plus existing `#teams`, `.card`, `.score-board-value`, `.score-board-plus`, `.score-board-minus`, `.score-live-timer`.
- Produces `window.ScoreGamesUI` with `openGames`, `openTimer`, `startMode`, `stopMode`, `getState`.

- [ ] Add a browser-contract test fixture inside `score-games-core.test.js` for exported mode metadata required by the UI.
- [ ] Verify RED until metadata exists.
- [ ] Implement an additive floating control center: Games button, timer mode selector, interval editor, quick +/- time, lap/split, history/presets, game-mode chooser, roster/player entry, mode-specific config, current-game HUD, undo/redo.
- [ ] Implement localStorage persistence, keyboard shortcuts, Wake Lock request/release, and layout lock.
- [ ] Implement natural-voice selection allowlist with Coach/Arena profiles; if unavailable, suppress speech and keep tone/visual countdown.
- [ ] Verify node core suites remain GREEN.

### Task 4: Integrate V2 assets into TeamScore

**Files:**
- Modify: `score-counter/index.html`
- Modify: `score-counter/score-live-regression.test.js`

**Interfaces:**
- Index loads timer core, games core, UI and CSS after existing live/patch assets.

- [ ] Add regression assertions that all four V2 assets are injected after existing score-live assets and existing score scripts remain present.
- [ ] Run `node score-counter/score-live-regression.test.js` and verify RED.
- [ ] Update `index.html` injection strings with cache-busted V2 assets.
- [ ] Run regression test and both new core tests; verify GREEN.

### Task 5: Verification and branch readiness

**Files:**
- No production files unless a failing verification requires a fix.

- [ ] Run `node score-counter/score-timer-v2-core.test.js`.
- [ ] Run `node score-counter/score-games-core.test.js`.
- [ ] Run `node score-counter/score-live-regression.test.js`.
- [ ] Inspect the branch diff to confirm existing score source-of-truth code was not replaced.
- [ ] Record any unsupported browser-only capability as graceful degradation rather than silently changing behavior.
