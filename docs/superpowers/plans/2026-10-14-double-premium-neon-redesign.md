# DOUBLE Premium Neon Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Premium Neon Arcade design system across DOUBLE landing, lobby, gameplay, daily challenge, statistics, finish states, motion, music, and FX without changing game rules or wiping user progress.

**Architecture:** Keep existing gameplay/state modules intact and add a shared presentation layer: `premium-theme.css`, `premium-motion.css`, `premium-effects.js`, and `premium-fx.js`. Existing pages opt into the shared layer via classes/data hooks, while audio keeps the existing `window.DoubleMusic` contract and localStorage keys. Presentation changes are isolated from game logic; daily/statistics data contracts remain unchanged.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser Web Audio / HTML Audio, CSS custom properties, MutationObserver where already used, Node built-in `assert` tests.

**Spec:** `docs/superpowers/specs/2026-10-14-double-premium-neon-redesign-design.md`

## Global Constraints

- Preserve every existing game mode and direct-launch query parameter.
- Preserve `double-difficulty-v1`, `double-music-enabled-v1`, `double-effects-enabled-v1`, announcer preference, icon-pack selection, stats store, daily challenge record/streak store, versus controls, and avatars.
- No framework migration.
- No autoplay video background.
- Prefer transforms/opacity for animation; decorative particles must be bounded and removed.
- `prefers-reduced-motion: reduce` must disable parallax, shimmer loops, floating loops, and particle bursts.
- Music and FX remain independently controllable.
- Audio failures must never block gameplay.
- Mobile and desktop layouts must remain playable and legible.

## Review Focus

- Browser blocks audio before user gesture: gameplay still starts and audio becomes available after a valid gesture.
- Low-motion users: no continuous float/parallax/shimmer/particle loops when reduced motion is enabled.
- Narrow mobile viewport: cards, HUD, CTA, daily header, and finish actions do not overlap.
- Existing localStorage data from current production: premium layer reads it without migration or reset.
- Repeated gameplay: particle/effect DOM nodes and observers do not grow without bound.

---

### Task 1: Shared Premium Theme and Motion Foundation

**Files:**
- Create: `double/premium-theme.css`
- Create: `double/premium-motion.css`
- Create: `double/premium-effects.js`
- Create: `double/premium-effects.test.js`

**Interfaces:**
- Consumes: existing DOM classes such as `.landing`, `.card`, `.sym`, `.hud`, `.dropdown`, `.end-overlay`, `.double-stats-modal`.
- Produces: CSS tokens on `:root`; visual utility classes; `window.DoublePremiumEffects` with `burst(anchor, kind)`, `pulse(element, kind)`, `setScene(scene)`, `cleanup()`, and `isReducedMotion()`.

- [ ] **Step 1: Write the failing test**

Create `double/premium-effects.test.js` using Node `assert` to require/export the pure helpers from `premium-effects.js` and assert:
- `normalizeKind('success') === 'success'`
- unknown kind falls back to `neutral`
- particle cap is `24`
- reduced-motion mode makes `shouldAnimate(true) === false`
- normal mode makes `shouldAnimate(false) === true`

- [ ] **Step 2: Run test to verify it fails**

Run: `node double/premium-effects.test.js`
Expected: FAIL because `premium-effects.js` does not exist yet.

- [ ] **Step 3: Implement the shared foundation**

Create `premium-theme.css` with the approved palette, glass surfaces, premium cards, HUD chips, buttons, modal surfaces, focus states, mobile breakpoints, and opaque fallbacks for unsupported `backdrop-filter`.

Create `premium-motion.css` with named animations for menu enter/exit, card float, correct pulse/ring, wrong shake, CTA press, daily shimmer, countdown, trophy/result entrance, and stats number entrance. Add a full `@media (prefers-reduced-motion: reduce)` override.

Create `premium-effects.js` as a UMD/browser-safe module. Cap active decorative nodes at 24 and auto-remove them after animation. The module must be safe when `document` is absent so Node tests can require it.

- [ ] **Step 4: Run test to verify it passes**

Run: `node double/premium-effects.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add double/premium-theme.css double/premium-motion.css double/premium-effects.js double/premium-effects.test.js
git commit -m "feat: add DOUBLE premium visual foundation"
```

---

### Task 2: Premium Landing and Lobby Control Center

**Files:**
- Modify: `double.html`
- Modify: `double/menu-lobby.css`
- Modify: `double/menu-lobby-v3.js`
- Modify: `double/landing-selection.js`
- Create: `double/premium-landing.test.js`

**Interfaces:**
- Consumes: Task 1 CSS/effects; current player → mode → difficulty flow; current icon-pack/stats/daily modules.
- Produces: premium landing hierarchy, premium preview stage, control-center lobby, and cache version for the new shared assets.

- [ ] **Step 1: Write the failing test**

Create `double/premium-landing.test.js` that reads `double.html` and `double/landing-selection.js` and asserts:
- both `premium-theme.css` and `premium-motion.css` are loaded
- `premium-effects.js` is loaded before lobby UI enhancement
- landing exposes a premium root hook such as `data-double-theme="premium-neon"`
- current mode flow still contains players, modes, and difficulty stages
- `double-effects-enabled-v1` and `double-music-enabled-v1` remain referenced by the enhanced menu path

- [ ] **Step 2: Run test to verify it fails**

Run: `node double/premium-landing.test.js`
Expected: FAIL on missing premium assets/theme hook.

- [ ] **Step 3: Implement landing and lobby redesign**

Update `double.html` to load shared premium styles, add layered aurora/grid/glow background hooks, preserve the live preview board, and update the hero/CTA hierarchy without changing launch logic.

Update `menu-lobby.css` to use shared tokens instead of standalone colors wherever possible.

Update `menu-lobby-v3.js` to keep the exact logical order but present the menu as a control center: gameplay selection first, then icon pack/audio/stats/help. Add selected-state classes only; do not rewrite the state machine.

Update `landing-selection.js` cache version once, and load `premium-effects.js` before modules that use it.

- [ ] **Step 4: Run test to verify it passes**

Run: `node double/premium-landing.test.js`
Expected: PASS.

- [ ] **Step 5: Manual responsive check**

Open `double.html` at desktop width and at ~390px width. Verify menu, preview cards, hero CTA, stats button, icon-pack picker, and daily card remain visible and clickable.

- [ ] **Step 6: Commit**

```bash
git add double.html double/menu-lobby.css double/menu-lobby-v3.js double/landing-selection.js double/premium-landing.test.js
git commit -m "feat: redesign DOUBLE landing and lobby"
```

---

### Task 3: Premium Gameplay, HUD, Reactions, and Finish State

**Files:**
- Modify: `double-game.html`
- Modify: `double-game-core.html`
- Modify: `double/game.js`
- Create: `double/premium-game.test.js`

**Interfaces:**
- Consumes: `window.DoublePremiumEffects`; existing game-mode logic in `double/game.js`.
- Produces: gameplay presentation hooks `data-premium-state`, reaction classes, countdown hook, tension hook, and premium finish overlay while preserving all mode rules.

- [ ] **Step 1: Write the failing test**

Create `double/premium-game.test.js` that reads the three gameplay files and asserts:
- main wrapper loads premium theme/motion assets
- core has premium theme hook
- `double/game.js` still contains all launch targets: classic, levels, knockout, survival, sprint, versus
- premium reactions reference success, wrong, combo, tension, and victory states
- existing replay and return actions still exist

- [ ] **Step 2: Run test to verify it fails**

Run: `node double/premium-game.test.js`
Expected: FAIL on missing premium hooks/reactions.

- [ ] **Step 3: Implement presentation hooks only**

Add premium classes/data attributes in `double-game-core.html` and `double/game.js` at the existing success/wrong/combo/countdown/timer/end points. Call `DoublePremiumEffects` where available, but guard every call so gameplay works without it.

Update HUD markup/classes for compact glass chips and player semantic colors. Under 10 seconds, apply a tension class only; do not change timing rules.

Redesign `double-game.html` finish overlay with premium trophy/result entrance, primary replay, secondary return, and new-record visual hook when the underlying mode already exposes a record result.

- [ ] **Step 4: Run tests**

Run:
```bash
node double/premium-game.test.js
node double/competitive-rules.test.js
```
Expected: PASS for both.

- [ ] **Step 5: Smoke-test every launch target**

Verify direct launch for classic, levels, knockout, survival, sprint 5/10/15, and every versus variant still enters gameplay and returns correctly.

- [ ] **Step 6: Commit**

```bash
git add double-game.html double-game-core.html double/game.js double/premium-game.test.js
git commit -m "feat: add premium DOUBLE gameplay presentation"
```

---

### Task 4: Adaptive Music and Dedicated Premium FX

**Files:**
- Create: `double/premium-fx.js`
- Create: `double/premium-fx.test.js`
- Modify: `double/music-engine.js`
- Modify: `double/landing-music-bridge.js`
- Modify: `double/music-game-bridge.js`
- Modify: `double/menu-lobby-v3.js`

**Interfaces:**
- Consumes: existing `DoubleMusicState.sceneFor(state)` and `double-effects-enabled-v1`.
- Produces: unchanged public `window.DoubleMusic` API plus `window.DoublePremiumFx` with `unlock()`, `play(name)`, `setEnabled(bool)`, `isEnabled()`.

- [ ] **Step 1: Write the failing test**

Create `double/premium-fx.test.js` with Node `assert` for pure cue mapping and persistence helpers:
- known cues: `ui`, `whoosh`, `correct`, `combo`, `wrong`, `countdown`, `go`, `record`, `victory`
- unknown cue maps to `ui`
- FX key is exactly `double-effects-enabled-v1`
- disabled state prevents cue scheduling

- [ ] **Step 2: Run test to verify it fails**

Run: `node double/premium-fx.test.js`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement premium FX**

Create `premium-fx.js` using Web Audio oscillators/noise envelopes. No external media dependency. Make `unlock()` user-gesture safe and all playback calls fail silently.

- [ ] **Step 4: Enrich the existing music engine behind the same contract**

Keep `window.DoubleMusic={unlock,setScene,setStreak,updateState,setEnabled,isEnabled,preview,stinger,stop,currentScene,status}` unchanged. Enhance generated loop arrangement so lobby/play/tension differ audibly by playback density/tempo/volume or generated layers while preserving browser-native audio and current key `double-music-enabled-v1`.

Bridge scene changes to FX cues for countdown, correct, wrong, combo, record, and victory without duplicating existing success tings.

- [ ] **Step 5: Run tests**

Run:
```bash
node double/premium-fx.test.js
node --check double/music-engine.js
node --check double/premium-fx.js
```
Expected: PASS / no syntax errors.

- [ ] **Step 6: Manual browser audio check**

With music ON and FX ON after one pointer gesture: hear lobby music, play scene, tension change, and victory cue. Turn music OFF and verify FX still works; turn FX OFF and verify music still works.

- [ ] **Step 7: Commit**

```bash
git add double/premium-fx.js double/premium-fx.test.js double/music-engine.js double/landing-music-bridge.js double/music-game-bridge.js double/menu-lobby-v3.js
git commit -m "feat: add adaptive premium audio and FX"
```

---

### Task 5: Premium Daily Challenge and Statistics Dashboard

**Files:**
- Modify: `double-daily.html`
- Modify: `double/daily-challenge-game.js`
- Modify: `double/daily-challenge-ui.js`
- Modify: `double/stats-ui.js`
- Create: `double/premium-secondary-screens.test.js`

**Interfaces:**
- Consumes: existing deterministic daily core and stats store; Task 1 shared premium assets.
- Produces: gold/indigo daily identity and premium stats dashboard with no storage schema changes.

- [ ] **Step 1: Write the failing test**

Create `double/premium-secondary-screens.test.js` asserting:
- daily page loads premium theme/motion
- daily gameplay still references exactly 15 rounds and +2 second penalty
- daily UI still displays best, streak, and total completed days
- stats UI still renders total success, accuracy, fastest reaction, average reaction, combo, reaction history, and per-mode stats
- stats labels still include `daily:'🏆 אתגר יומי'`

- [ ] **Step 2: Run test to verify it fails**

Run: `node double/premium-secondary-screens.test.js`
Expected: FAIL on missing premium assets/classes.

- [ ] **Step 3: Redesign daily challenge**

Apply shared theme/motion, gold header identity, animated 0/15 progress rail, restrained penalty flash, premium countdown, and gold new-record burst. Do not change deterministic sequence generation, penalty value, record keys, or streak logic.

- [ ] **Step 4: Redesign statistics**

Rebuild `stats-ui.js` markup/classes into a premium dashboard while keeping the same store calls/calculations. Use CSS bars only; no chart dependency. Preserve reset semantics.

- [ ] **Step 5: Run tests**

Run:
```bash
node double/premium-secondary-screens.test.js
node double/daily-challenge-core.test.js
node double/stats-store.test.js
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add double-daily.html double/daily-challenge-game.js double/daily-challenge-ui.js double/stats-ui.js double/premium-secondary-screens.test.js
git commit -m "feat: redesign DOUBLE daily and statistics screens"
```

---

### Task 6: Cache, Accessibility, Performance, and Full Regression Pass

**Files:**
- Modify: `double/landing-selection.js`
- Modify: `double/success-ting.js`
- Modify: `double-game.html`
- Modify: `double-daily.html`
- Create: `double/premium-regression.test.js`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: one coherent cache version, reduced-motion guarantees, bounded effects, and verified legacy behavior.

- [ ] **Step 1: Write the failing regression test**

Create `double/premium-regression.test.js` that asserts:
- all premium assets use one current cache version across landing/wrapper/daily loaders
- every existing localStorage key from the spec still appears in its owner module
- `prefers-reduced-motion` exists in premium motion/theme CSS
- particle cap and cleanup paths exist
- all 14 current playable mode keys plus daily remain represented in UI/launch code

- [ ] **Step 2: Run test to verify it fails**

Run: `node double/premium-regression.test.js`
Expected: FAIL on stale cache references or missing regression hooks.

- [ ] **Step 3: Normalize cache and fallbacks**

Bump all touched DOUBLE presentation/audio assets to one cache version. Ensure missing premium JS/CSS leaves the current inline/fallback UI usable. Do not introduce new storage migrations.

- [ ] **Step 4: Run the full local test suite**

Run:
```bash
node double/premium-effects.test.js
node double/premium-landing.test.js
node double/premium-game.test.js
node double/premium-fx.test.js
node double/premium-secondary-screens.test.js
node double/premium-regression.test.js
node double/competitive-rules.test.js
node double/daily-challenge-core.test.js
node double/stats-store.test.js
```
Expected: all PASS.

- [ ] **Step 5: Syntax checks**

Run `node --check` on every modified/created `.js` file in this plan.
Expected: no syntax errors.

- [ ] **Step 6: Browser acceptance pass**

Check desktop and mobile for:
- landing + lobby
- classic
- levels
- knockout
- survival
- sprint 5/10/15
- versus duel/deck/knockout/race/combo/sudden/gold
- daily challenge
- statistics modal
- icon-pack switch
- music ON/OFF
- FX ON/OFF
- announcer switch
- replay/return
- reduced-motion emulation

Expected: all flows remain usable, premium visuals are coherent, no runaway DOM growth, and no gameplay rule changes.

- [ ] **Step 7: Commit**

```bash
git add double/landing-selection.js double/success-ting.js double-game.html double-daily.html double/premium-regression.test.js
git commit -m "test: verify DOUBLE premium redesign regression"
```

---

## Self-Review Notes

- Spec coverage: landing, lobby, gameplay, daily, stats, finish, motion, audio, performance, accessibility, cache, and compatibility are all assigned to tasks.
- Scope intentionally excludes the rest of `העולם שלי` for this pass, matching the approved DOUBLE-specific spec.
- No task changes gameplay rules; gameplay edits are limited to presentation hooks and guarded effect calls.
- Audio interfaces and storage keys are explicitly preserved.
- Tests use Node built-ins to avoid adding a framework dependency.
