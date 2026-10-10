# Raishin Legacy — Premium Playable Inazuma Dojo v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current dark, flat-feeling Inazuma Dojo free-roam prototype into a bright, spatial, interactive 2.5D premium dojo room while preserving Raika’s locked visual identity and the standalone `/raishin-legacy/` architecture.

**Architecture:** Keep the current Canvas/vanilla-JS game and split room responsibilities into pure testable spatial logic (`dojo-world.js`) and visual/camera effects (`dojo-effects.js`). `game.js` remains the orchestrator, while movement keeps its existing public API for backward compatibility and gains smooth velocity/collision integration. The approved current dojo and Raika assets remain the source visuals for this milestone; no binary visual is replaced without separate approval.

**Tech Stack:** Static HTML/CSS, Canvas 2D, vanilla JavaScript, Node `fs`/`assert` tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-10-raishin-dojo-premium-v1-design.md`

## Global Constraints

- Scope is the Inazuma Dojo main hall only; no wider world, village, forest, river, enemy AI, combat, save system, inventory economy, or full courtyard gameplay.
- Preserve the standalone `/raishin-legacy/` page and do not depend on `raika.html`, `raika-*.js`, `raika-*.css`, Libi, or Crazy Family files.
- Preserve Raika Visual Lock exactly: two rabbit ears, no human ears, no tail, no redesign of face, hair, outfit, emblem, or body proportions.
- Keep the approved current Raika walk sprite and approved current Inazuma dojo art unless the user separately approves a replacement visual asset.
- Maintain a 16:9 game presentation, keyboard input, focusable game frame, visible asset-load error state, and screen-reader HUD labels.
- Desktop current browsers are the quality target; mobile remains responsive.
- Target near-60fps animation on a normal modern desktop; cap device-pixel-ratio cost and particle counts.
- Reduced-motion preference must reduce or disable non-essential ambient motion.
- No merge or publication to `main` without explicit user approval after implementation review.

## Review Focus

- **Geometry mismatch:** points near the visible floor edge or large props must not let Raika cross walls, columns, racks, or the punching bag; Task 2 tests polygon edges, obstacle overlap, and axis fallback.
- **Frame-time spikes:** a large `dt` after tab switching must not launch Raika through collision zones or make camera easing jump; Tasks 3 and 5 clamp/test large `dt`.
- **Interaction ambiguity:** overlapping trigger radii must consistently select the closest valid interactable and clear the prompt when leaving range; Task 2 and Task 4 test this.
- **Performance / motion preference:** atmosphere must remain capped and reduced-motion must materially reduce or disable particles/camera ambience; Task 6 tests caps and reduced-motion behavior.
- **Regression / isolation:** existing v0.1 and free-roam contracts must keep passing and no unrelated site dependencies may be introduced; Task 7 runs legacy Raishin tests and source-isolation checks.

---

### Task 1: Premium Dojo Contract and Render-Quality Baseline

**Files:**
- Create: `tests/raishin-dojo-premium.test.js`
- Modify: `raishin-legacy/index.html`
- Modify: `raishin-legacy/styles.css`
- Modify: `raishin-legacy/game.js`

**Interfaces:**
- Consumes: current 16:9 Canvas shell, approved `inazuma-main-hall-clean.png`, approved `raika-walk-4dir-8f.png`.
- Produces: DOM/render contract for premium-dojo modules, contextual UI containers, dynamic minimap marker, and high-DPI canvas setup.

- [ ] **Step 1: Write the failing premium-dojo contract test**

Create `tests/raishin-dojo-premium.test.js` asserting:
- `dojo-world.js` and `dojo-effects.js` are referenced by `index.html` before `game.js`.
- `#interactionPrompt`, `#interactionPanel`, `#objectiveText`, `#minimapPlayer`, and `#seikaOverlay` exist.
- game frame still declares `16:9` and remains independent of unrelated site apps.
- `game.js` contains a capped device-pixel-ratio path (`Math.min(..., 2)` or equivalent) and does not apply a per-frame CSS/canvas brightness filter to the full background.
- CSS contains a reduced-motion rule covering ambient effects.

- [ ] **Step 2: Run the test to verify RED**

Run: `node tests/raishin-dojo-premium.test.js`

Expected: FAIL because the new modules/containers do not exist yet.

- [ ] **Step 3: Add premium shell containers and high-DPI canvas sizing**

Modify `index.html`, `styles.css`, and `game.js` so the logical world remains `1600x900`, the backing canvas scales with `devicePixelRatio` capped at `2`, and the DOM includes the new interaction/Seika/minimap elements without changing Raika assets.

- [ ] **Step 4: Brighten the presentation without changing the canonical art asset**

Use a one-time pre-rendered/offscreen background treatment or lightweight overlay gradients in Canvas/CSS that lift shadow readability and preserve warm golden-hour highlights. Do not run a full-image filter every frame.

- [ ] **Step 5: Run the contract test**

Run: `node tests/raishin-dojo-premium.test.js`

Expected: PASS for Task 1 assertions; later module-behavior tests may still fail until their tasks are implemented.

- [ ] **Step 6: Commit**

Commit: `feat: establish premium dojo render shell`

### Task 2: Spatial Dojo World Model, Walkable Floor, Collisions, and Interactions

**Files:**
- Create: `raishin-legacy/dojo-world.js`
- Create: `tests/raishin-dojo-world.test.js`

**Interfaces:**
- Consumes: logical world coordinates `1600x900`.
- Produces: `WORLD_WIDTH`, `WORLD_HEIGHT`, `WALKABLE_POLYGON`, `COLLISIONS`, `INTERACTIONS`, `pointInPolygon(point, polygon)`, `isInsideCollision(point, radius, collision)`, `isWalkable(point, radius = 24)`, `resolvePlayerMotion(current, proposed, radius = 24)`, `nearestInteraction(point, maxDistance)`, and `worldToMinimap(point)`.

- [ ] **Step 1: Write failing geometry tests**

Assert:
- representative center-floor points are walkable and wall/exterior points are not.
- punching bag, weapon-rack/rear-wall areas, structural columns, and rear furniture block the player radius.
- a diagonal move into an obstacle resolves by preserving the valid axis when possible rather than freezing both axes.
- the five interaction IDs are exactly `training-bag`, `weapons-wall`, `training-center`, `courtyard-exit`, and `seika-point`.
- nearest interaction chooses the closest zone and returns `null` outside range.
- minimap coordinates are normalized/clamped to `[0,1]`.

- [ ] **Step 2: Run the world test to verify RED**

Run: `node tests/raishin-dojo-world.test.js`

Expected: FAIL because `dojo-world.js` does not exist.

- [ ] **Step 3: Implement the world data and pure spatial helpers**

Use a UMD/CommonJS-compatible module matching `movement.js`. Tune `WALKABLE_POLYGON` and collision shapes to the visible main-hall floor and props in the approved current background. Keep all five interactables data-driven with `id`, `label`, `x`, `y`, `radius`, `prompt`, and response type metadata.

- [ ] **Step 4: Run the world test**

Run: `node tests/raishin-dojo-world.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: model Inazuma dojo geometry and interactables`

### Task 3: Smooth Movement and Collision Integration

**Files:**
- Modify: `raishin-legacy/movement.js`
- Modify: `raishin-legacy/game.js`
- Create: `tests/raishin-dojo-movement.test.js`

**Interfaces:**
- Consumes: existing movement helpers and `RaishinDojoWorld.resolvePlayerMotion`.
- Produces: `smoothVelocity(currentVelocity, inputVector, dt, acceleration, deceleration, maxSpeed)` while preserving all existing movement exports.

- [ ] **Step 1: Write failing movement-polish tests**

Assert:
- acceleration increases velocity toward the requested direction without exceeding max speed.
- releasing input decelerates toward zero rather than stopping instantly.
- opposite keys yield a stable zero input vector.
- a large `dt` is safely clamped by the integration path.
- old functions `inputVector`, `directionFromVector`, `stepPlayer`, `frameAt`, and `scaleForDepth` still exist and retain current behavior.

- [ ] **Step 2: Run the movement test to verify RED**

Run: `node tests/raishin-dojo-movement.test.js`

Expected: FAIL because `smoothVelocity` is not yet exported.

- [ ] **Step 3: Implement smooth velocity**

Add `smoothVelocity(...)` to `movement.js`; preserve backward-compatible exports. In `game.js`, keep a velocity vector in state, clamp simulation `dt`, calculate the proposed position, then pass it through `dojoWorld.resolvePlayerMotion` before committing position.

- [ ] **Step 4: Add stable direction switching**

Change visual direction only when the velocity/input has a meaningful dominant axis so tiny diagonal changes do not rapidly flip animation rows.

- [ ] **Step 5: Run movement and existing walk tests**

Run:
- `node tests/raishin-dojo-movement.test.js`
- `node tests/raishin-legacy-walk.test.js`

Expected: both PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add smooth collision-aware dojo movement`

### Task 4: Contextual Interaction System and Dojo Responses

**Files:**
- Modify: `raishin-legacy/index.html`
- Modify: `raishin-legacy/styles.css`
- Modify: `raishin-legacy/game.js`
- Create: `tests/raishin-dojo-interactions.test.js`

**Interfaces:**
- Consumes: `dojoWorld.nearestInteraction(state)` and the five data-driven room interactions.
- Produces: contextual prompt state, visible response panel/state, objective updates, and Seika focus state.

- [ ] **Step 1: Write failing interaction contract tests**

Assert source/DOM contracts for:
- `E` and `Enter` as interaction keys.
- prompt clears when no interaction is in range.
- `training-bag` response updates objective to a practice instruction.
- `weapons-wall` response opens a compact examine panel.
- `training-center` updates tutorial/objective guidance.
- `courtyard-exit` returns a visible locked/preview response rather than navigating away.
- `seika-point` toggles a focus state and `#seikaOverlay`.
- closing an overlay restores normal movement/input without trapping focus.

- [ ] **Step 2: Run the interaction test to verify RED**

Run: `node tests/raishin-dojo-interactions.test.js`

Expected: FAIL because interaction behavior is not implemented.

- [ ] **Step 3: Implement proximity prompt and input**

Each frame, use `nearestInteraction` to update `#interactionPrompt`. Handle `KeyE` and `Enter` only on keydown edge so one press produces one action.

- [ ] **Step 4: Implement the five visible responses**

Keep responses lightweight and in-world: objective/status update for the bag and center, compact equipment overlay for weapons, locked courtyard preview, and Seika focus overlay/dimming. Do not add inventory, combat, or a new scene.

- [ ] **Step 5: Run the interaction and premium contract tests**

Run:
- `node tests/raishin-dojo-interactions.test.js`
- `node tests/raishin-dojo-premium.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add usable dojo interaction points`

### Task 5: Soft Camera and Dynamic Minimap

**Files:**
- Create: `raishin-legacy/dojo-effects.js`
- Modify: `raishin-legacy/game.js`
- Modify: `raishin-legacy/styles.css`
- Create: `tests/raishin-dojo-effects.test.js`

**Interfaces:**
- Consumes: player world position and normalized minimap coordinates.
- Produces: `updateCamera(camera, player, dt, options)`, `interactionFramingOffset(camera, interaction, strength)`, and camera/minimap state used by `game.js`.

- [ ] **Step 1: Write failing camera/effects tests**

Assert:
- player movement inside the dead-zone does not move the camera.
- leaving the dead-zone moves camera monotonically toward the target without overshoot.
- large `dt` remains stable.
- camera output respects configured world/frame clamps.
- interaction framing never exceeds `4%` of frame width/height.

- [ ] **Step 2: Run the effects test to verify RED**

Run: `node tests/raishin-dojo-effects.test.js`

Expected: FAIL because `dojo-effects.js` does not exist.

- [ ] **Step 3: Implement restrained camera helpers**

Use a UMD/CommonJS-compatible pure helper module. Configure a soft dead-zone and eased offsets; do not hard-lock Raika to screen center and do not add normal-walk zoom.

- [ ] **Step 4: Bind world rendering and minimap to player state**

Apply camera offset consistently to world/background/player/interactable visuals. Update `#minimapPlayer` from `dojoWorld.worldToMinimap(state)` every frame.

- [ ] **Step 5: Run effects and world tests**

Run:
- `node tests/raishin-dojo-effects.test.js`
- `node tests/raishin-dojo-world.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add cinematic dojo camera and live minimap`

### Task 6: Premium Atmosphere and Light Polish

**Files:**
- Modify: `raishin-legacy/dojo-effects.js`
- Modify: `raishin-legacy/game.js`
- Modify: `raishin-legacy/styles.css`
- Create: `tests/raishin-dojo-atmosphere.test.js`

**Interfaces:**
- Consumes: timestamp, camera, reduced-motion preference, and player position.
- Produces: capped dust/petal particles, subtle lantern/light modulation, floor-light/shadow response, and reduced-motion fallback.

- [ ] **Step 1: Write failing atmosphere tests**

Assert:
- normal mode particle pool never exceeds the configured cap.
- reduced-motion disables petals and materially lowers dust count.
- particle updates remove/recycle offscreen particles rather than growing arrays indefinitely.
- light-pulse helper remains inside a restrained alpha/intensity range.

- [ ] **Step 2: Run the atmosphere test to verify RED**

Run: `node tests/raishin-dojo-atmosphere.test.js`

Expected: FAIL because atmosphere helpers are not yet present.

- [ ] **Step 3: Implement lightweight atmosphere**

Add deterministic/testable update helpers to `dojo-effects.js`; render subtle dust motes and occasional petals on Canvas, plus restrained lantern/light modulation and a soft floor-contact light/shadow under Raika. No video overlays, heavy bloom, or neon treatment.

- [ ] **Step 4: Respect reduced-motion and performance limits**

Read `matchMedia('(prefers-reduced-motion: reduce)')`, reduce camera ambience, disable petals, and use lower particle counts. Do not re-process the full high-resolution background every frame.

- [ ] **Step 5: Run atmosphere/effects/premium tests**

Run:
- `node tests/raishin-dojo-atmosphere.test.js`
- `node tests/raishin-dojo-effects.test.js`
- `node tests/raishin-dojo-premium.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit: `feat: add premium Inazuma dojo atmosphere`

### Task 7: Final Integration, Regression Check, and Review Build

**Files:**
- Verify: all `raishin-legacy/` source files
- Verify: all `tests/raishin-*` tests
- Do not merge or publish in this task

**Interfaces:**
- Consumes: complete premium dojo branch.
- Produces: a review-ready branch/PR only.

- [ ] **Step 1: Run all Raishin-specific tests fresh**

Run:
- `node tests/raishin-legacy-v01.test.js`
- `node tests/raishin-legacy-walk.test.js`
- `node tests/raishin-dojo-premium.test.js`
- `node tests/raishin-dojo-world.test.js`
- `node tests/raishin-dojo-movement.test.js`
- `node tests/raishin-dojo-interactions.test.js`
- `node tests/raishin-dojo-effects.test.js`
- `node tests/raishin-dojo-atmosphere.test.js`

Expected: all PASS.

- [ ] **Step 2: Run the repository-wide JS suite and classify failures**

Run: `node --test tests/*.test.js`

Expected: no new failures attributable to `raishin-legacy/`. If unrelated legacy failures remain, record them explicitly rather than claiming the entire repository is green.

- [ ] **Step 3: Source-isolation check**

Search `raishin-legacy/` for `raika.html`, `raika-*.js`, `raika-*.css`, Crazy Family/Libi imports, external runtime dependencies, or accidental navigation outside the standalone game. Expected: none.

- [ ] **Step 4: Visual QA in the browser**

Verify manually:
- room reads clearly and is no longer too dark;
- Raika stays visually identical to the approved sprite;
- walkable-floor boundaries visually match the floor;
- bag/racks/columns/rear area block correctly;
- all five prompts appear at sensible distances;
- Bag, Weapons Wall, Training Center, and Seika give visible responses;
- Courtyard Exit feels usable but remains locked/preview-only;
- minimap marker follows movement;
- camera is smooth and restrained;
- dust/petals/light are subtle;
- reduced-motion meaningfully calms ambience;
- 16:9 layout and responsive behavior remain intact.

- [ ] **Step 5: Create a review PR**

Open a PR from `feat/raishin-dojo-premium-v1` to `main` summarizing behavior, test evidence, and any known unrelated repository failures.

- [ ] **Step 6: Stop before publication**

Do not merge the PR or publish to GitHub Pages until the user explicitly approves the review build.
