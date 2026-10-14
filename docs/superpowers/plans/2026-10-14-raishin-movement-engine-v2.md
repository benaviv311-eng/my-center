# Raishin Movement Engine v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile screen-pixel grounding model with a tested Phaser 4.2.1 2.5D movement engine in which Raika moves in logical World Space and every visual element is derived from one Ground Point.

**Architecture:** Build the new engine beside the current live engine first. The v2 prototype uses pure testable UMD/CommonJS modules for projection, controller, collision, animation metadata and view calculation, while Phaser owns scene rendering/input/camera. Only after visual QA proves that UP/DOWN/LEFT/RIGHT are grounded and spatially correct do we switch `/raishin-legacy/` to v2 and retire the old alpha-scanning hacks.

**Tech Stack:** Phaser 4.2.1 via pinned CDN, static HTML/CSS/JavaScript, GitHub Pages, CommonJS-compatible pure modules, Node 24 + `assert` / `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-14-raishin-movement-engine-v2-design.md`

## Global Constraints

- The live `/raishin-legacy/` engine must remain unchanged until the isolated v2 preview passes manual visual QA.
- Prototype URL is `/raishin-legacy/v2.html`; it reuses the approved dojo background, HUD and existing Raika assets. No image generation or image editing is authorized by this plan.
- Raika Visual Lock remains canonical: exactly two rabbit ears, zero human ears, cream/white fur, green eyes, pale hair, side ponytail with dark-green ribbon, canonical cream/green training outfit, brown forearm wraps, bare rabbit feet, no tail.
- World Space, Screen Space and Sprite Space must be separate. No gameplay system may use sprite alpha pixels as world geometry.
- No `getImageData()` or runtime foot/alpha scanning is allowed in v2.
- Ground Point is the single source of truth for player position, shadow, scale and depth.
- All four movement directions must use one rendering contract. Direction-specific grounding hacks are forbidden.
- Walk frame progression is distance-driven from actual resolved world displacement.
- Collisions and interactions are defined in World Space using small ground footprints, never full character art bounds.
- Keep the approved DOM HUD; Phaser renders the dojo/world, not the HUD.
- Use Phaser `4.2.1` pinned exactly. Prototype script source: `https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js`.
- There is no package.json in this repo; do not introduce a bundler just for this migration. Modules must remain directly loadable by GitHub Pages and require-able by Node tests.
- Before implementation starts, use a fresh implementation branch based on current `main` so unrelated changes that landed after this design branch are preserved.

## Review Focus

The implementation review must explicitly check these failure modes:

1. **Fake depth:** pressing UP changes only screen Y instead of logical world Y + projection + scale. Owned by Tasks 2, 3 and 6 tests.
2. **Floating/sliding:** sprite art moves independently from the Ground Point or shadow. Owned by Task 5 view tests and Task 6 visual gate.
3. **Architecture regression:** runtime alpha scanning, manual per-direction offsets or lower-body mirroring reappear. Owned by Tasks 5, 6 and 8 source-contract tests.
4. **Scenery climbing:** world collision permits Raika to enter the rear wall/weapon shelf zone. Owned by Task 4 world-system tests and Task 6 visual gate.
5. **Unsafe migration:** old live game is replaced before the prototype is visually approved, or legacy tests are deleted too early. Owned by Tasks 1 and 8 migration tests.

---

### Task 1: Add the v2 test lane and isolated preview shell

**Files:**
- Create: `.github/workflows/raishin-legacy-test.yml`
- Create: `tests/raishin-v2-shell.test.js`
- Create: `raishin-legacy/v2.html`
- Create: `raishin-legacy/v2-game.js`
- Reuse: `raishin-legacy/styles.css`
- Do not modify yet: `raishin-legacy/index.html`, `raishin-legacy/game.js`

**Interfaces:**
- Browser global: `window.Phaser` from the pinned CDN.
- Preview container: `#phaserGame` inside the existing 16:9 `.game-frame` shell.
- Existing HUD IDs remain available: `objectiveText`, `minimapPlayer`, `interactionPrompt`, `interactionPanel`, `seikaOverlay`.

- [ ] **Step 1: Write the failing shell test**

Create `tests/raishin-v2-shell.test.js` asserting:
- `v2.html` and `v2-game.js` exist.
- `v2.html` loads Phaser 4.2.1 from the exact pinned CDN before v2 modules/bootstrap.
- preview keeps `data-game-aspect="16:9"`, the approved HUD markers and local `styles.css`.
- preview references `inazuma-main-hall-clean.png` and `raika-walk-4dir-8f.png` only as existing assets; it does not create a new visual asset.
- current live `index.html` still loads `movement.js`, `dojo-world.js`, `dojo-effects.js`, `game.js`; this test is the guard that prevents premature migration.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node tests/raishin-v2-shell.test.js`

Expected: FAIL because the v2 preview files do not exist.

- [ ] **Step 3: Implement the isolated preview shell**

`v2.html` should copy only the necessary shell/HUD markup from `index.html`, replace the gameplay canvas with `<div id="phaserGame"></div>`, load the pinned Phaser script, then load the v2 modules and `v2-game.js` in dependency order.

`v2-game.js` should only validate dependencies and start the Phaser game. If `window.Phaser` or a required v2 module is missing, show `#loadError`; do not silently fall back to the legacy canvas engine.

- [ ] **Step 4: Add dedicated CI**

Create `.github/workflows/raishin-legacy-test.yml`:
- trigger on `pull_request` paths `raishin-legacy/**`, `tests/raishin-*.test.js`, this workflow;
- trigger on pushes to `main` touching the same paths where supported by the workflow pattern;
- Node 24;
- run `node --test tests/raishin-*.test.js`.

Keep legacy Raishin tests active during prototype development.

- [ ] **Step 5: Verify GREEN**

Run: `node tests/raishin-v2-shell.test.js`

Then: `node --test tests/raishin-*.test.js`

Expected: all currently passing Raishin tests remain passing; no live engine files changed.

- [ ] **Step 6: Commit**

Commit: `test: scaffold isolated Raishin movement v2 preview`

---

### Task 2: Build `WorldPlane` and calibrated dojo projection

**Files:**
- Create: `raishin-legacy/src/world/WorldPlane.js`
- Create: `raishin-legacy/src/world/dojo-layout.js`
- Create: `tests/raishin-v2-world-plane.test.js`
- Update: `raishin-legacy/v2.html` to load the modules

**Interfaces:**

`dojo-layout.js` exports/browser-registers a frozen layout with initial calibration:

```js
WORLD_WIDTH = 1000
WORLD_HEIGHT = 600
floor = {
  farLeft:  { x: 430, y: 585 },
  farRight: { x: 1170, y: 585 },
  nearLeft: { x: 165, y: 835 },
  nearRight:{ x: 1435, y: 835 },
  farScale: 0.72,
  nearScale: 1.06
}
```

World convention:
- `worldY = 0` is the far/rear edge.
- `worldY = 600` is the near/bottom edge.
- decreasing world Y means moving UP/deeper into the dojo.

`WorldPlane.create(config)` returns:
- `project({x,y}) -> {x,y,scale,depth}`
- `unproject({x,y}) -> {x,y}`
- `contains({x,y}, radius=0) -> boolean`

Projection contract for `t = worldY / WORLD_HEIGHT`:
- interpolate left/right visible floor edges from far to near;
- interpolate screen Y from 585 to 835;
- interpolate scale from 0.72 to 1.06;
- `screenX` is the world-X ratio between interpolated left/right edges;
- `depth = screenY`.

- [ ] **Step 1: Write the failing projection test**

Test exact far/near corners, center projection, monotonic Y/scale, project→unproject round trip within small epsilon, and `contains` with radius.

Also assert the module is CommonJS require-able and exposes a browser global without depending on Phaser.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-world-plane.test.js`

Expected: FAIL because `WorldPlane.js` does not exist.

- [ ] **Step 3: Implement the smallest deterministic projection**

Use pure math only. Do not read the background image, DOM, canvas pixels or player sprite.

- [ ] **Step 4: Run GREEN**

Run: `node tests/raishin-v2-world-plane.test.js`

Expected: PASS.

- [ ] **Step 5: Run regression lane**

Run: `node --test tests/raishin-*.test.js`

Expected: no new failures.

- [ ] **Step 6: Commit**

Commit: `feat: add Raishin perspective world plane`

---

### Task 3: Move player simulation into World Space

**Files:**
- Create: `raishin-legacy/src/player/PlayerController.js`
- Create: `tests/raishin-v2-player-controller.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**

Expose:
- `inputFromKeys(keys)` for WASD + arrows;
- `normalizeInput({x,y})`;
- `createPlayerController(options)`.

Initial controller defaults:

```js
spawn = { x: 500, y: 420 }
maxSpeed = 300
acceleration = 1000
deceleration = 1300
radius = 24
maxDt = 0.05
```

Controller method:

```js
controller.step({ input, dt, resolveMotion })
```

Snapshot shape:

```js
{
  worldX, worldY,
  vx, vy,
  facing, moving,
  movedDistance,
  totalDistance
}
```

The controller must never know screen coordinates, sprite dimensions or scale.

- [ ] **Step 1: Write the failing controller test**

Cover W/A/S/D and arrows, opposite-key cancellation, diagonal normalization to length ≤ 1, acceleration/deceleration, dt clamping, max speed, stable facing while idle, and that UP produces decreasing `worldY`.

Add the Review Focus regression: a held-UP simulation for many steps must change logical `worldY` substantially; it cannot be a render-only effect.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-player-controller.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement controller**

Use one movement path for every direction. Compute `movedDistance` only after `resolveMotion` returns the legal position.

- [ ] **Step 4: Run GREEN + regressions**

Run:
- `node tests/raishin-v2-player-controller.test.js`
- `node --test tests/raishin-*.test.js`

- [ ] **Step 5: Commit**

Commit: `feat: move Raika simulation into world space`

---

### Task 4: Add World-Space collision and interaction systems

**Files:**
- Create: `raishin-legacy/src/world/CollisionMap.js`
- Create: `raishin-legacy/src/systems/InteractionSystem.js`
- Update: `raishin-legacy/src/world/dojo-layout.js`
- Create: `tests/raishin-v2-world-systems.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**

Initial playable bounds in logical world units:

```js
bounds = { minX: 35, maxX: 965, minY: 45, maxY: 575 }
```

Initial obstacle footprints; these are calibration values, not art bounds:

```js
trainingBag = { x: 150, y: 220, radius: 42 }
leftColumn  = { x: 90,  y: 330, radius: 34 }
rightColumn = { x: 910, y: 330, radius: 34 }
```

Initial interaction anchors:

```js
training-bag  { x:150, y:220, radius:110 }
weapons-wall  { x:780, y:70,  radius:130 }
training-center { x:500, y:270, radius:120 }
courtyard-exit  { x:900, y:230, radius:130 }
seika-point     { x:160, y:455, radius:115 }
```

`CollisionMap.create(layout)` exposes:
- `isWalkable(point, radius)`
- `resolveMotion(current, proposed, radius)` with legal axis sliding.

`InteractionSystem.create(layout, worldPlane)` exposes:
- `nearest(point, maxDistance)`
- `projectPrompt(item)`
- the same five canonical interaction IDs used by the existing dojo.

- [ ] **Step 1: Write failing tests**

Assert player footprint cannot cross world bounds, especially `minY` rear-wall margin; obstacle circles block correctly; diagonal collision can slide along a valid axis; all five interactions exist; nearest selection is deterministic; prompt projection equals `WorldPlane.project(anchor)`.

Add a repeated-UP test that resolves motion for enough steps and proves the player stops before the rear wall.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-world-systems.test.js`

- [ ] **Step 3: Implement pure systems**

No screen-coordinate collision constants outside `WorldPlane` calibration. No sprite dimensions in collision code.

- [ ] **Step 4: Run GREEN + regressions**

Run:
- `node tests/raishin-v2-world-systems.test.js`
- `node --test tests/raishin-*.test.js`

- [ ] **Step 5: Commit**

Commit: `feat: add world-space dojo collision and interactions`

---

### Task 5: Add static animation metadata, distance-driven animator and Ground-Point view

**Files:**
- Create: `raishin-legacy/src/player/raika-animation-data.js`
- Create: `raishin-legacy/src/player/PlayerAnimator.js`
- Create: `raishin-legacy/src/player/PlayerView.js`
- Create: `tests/raishin-v2-player-view.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**

For the first v2 prototype, use the existing `raika-walk-4dir-8f.png` for all four directions so the engine can be validated without trusting the visually suspect dedicated UP strip. Row mapping:

```js
down = 0
up = 1
left = 2
right = 3
framesPerDirection = 8
```

No new image is created. The dedicated UP assets remain untouched and are not required by the prototype.

`raika-animation-data.js` stores checked-in static metadata:
- texture key + source asset;
- row/frame count;
- frame pivots, normalized to `[0..1]`;
- initial pivots may start near bottom-center but must be explicit constants, not runtime detection;
- stable idle frame per direction.

`PlayerAnimator.create(data,{stride:24})` exposes:

```js
update({ facing, moving, movedDistance })
  -> { key, frameIndex, row, pivot }
```

Distance accumulator advances only by real resolved `movedDistance`.

`PlayerView.compute({projection,pivot})` returns:

```js
{
  x, y,
  originX, originY,
  scale,
  depth,
  shadowX, shadowY, shadowDepth
}
```

Rules:
- sprite pivot lands exactly on projected Ground Point;
- shadow X/Y equal the Ground Point regardless of frame;
- `depth = projection.depth + 1`;
- `shadowDepth = projection.depth - 1`.

- [ ] **Step 1: Write failing animator/view tests**

Assert 8 frames for each direction; pivot count/ranges are valid; distance frame transitions at stride boundaries; idle is stable; changing direction does not change Ground Point; shadow equals projected Ground Point for every frame and direction; deeper projection yields smaller scale and lower depth ordering consistently.

Source-contract assertions must reject `getImageData`, `findDenseFootContact`, `buildUpGroundingMetrics`, `buildLeftGroundingMetrics`, `upFootContactOffsets` and lower-body mirroring inside the new `src/` modules.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-player-view.test.js`

- [ ] **Step 3: Implement static metadata and pure animator/view**

Do not tune pivots by introducing runtime pixel analysis. Pivot tuning is a data calibration operation performed against preview QA.

- [ ] **Step 4: Run GREEN + regressions**

Run:
- `node tests/raishin-v2-player-view.test.js`
- `node --test tests/raishin-*.test.js`

- [ ] **Step 5: Commit**

Commit: `feat: anchor Raika animations to one ground point`

---

### Task 6: Build the Phaser `DojoScene` movement prototype

**Files:**
- Create: `raishin-legacy/src/scenes/DojoScene.js`
- Update: `raishin-legacy/v2-game.js`
- Update: `raishin-legacy/v2.html`
- Create: `tests/raishin-v2-scene-contract.test.js`

**Interfaces:**

Expose a testable scene factory:

```js
createDojoScene(Phaser, deps) -> class DojoScene extends Phaser.Scene
```

`preload()`:
- approved clean dojo background;
- existing `raika-walk-4dir-8f.png` as a plain image texture.

`create()`:
- display background at logical screen center;
- derive frame width/height from the loaded texture dimensions;
- define the 32 image frames using Phaser texture frames (`texture.add(...)`) from the 8×4 sheet grid;
- create Raika Sprite and a Phaser ellipse/image-based ground shadow;
- register keyboard cursors/WASD;
- instantiate WorldPlane, controller, collision map, animator and view.

Important: splitting the sheet into known 8×4 rectangles is allowed. Reading alpha/pixels is not.

`update(time,delta)` order is fixed:
1. collect input;
2. controller step in World Space through collision resolver;
3. project world Ground Point;
4. animator update from actual moved distance;
5. PlayerView compute;
6. set sprite frame/origin/position/scale/depth;
7. set shadow from the same Ground Point.

Keep the Phaser camera static in this task to isolate movement/grounding from camera effects.

- [ ] **Step 1: Write failing scene contract test**

Assert `DojoScene` exists, uses Phaser Scene, wires all pure v2 systems, derives frames from an 8×4 grid, and does not contain raw canvas `requestAnimationFrame`, `getImageData`, alpha scanning, direction-specific foot offsets or lower-body mirroring.

Assert the update order contains world simulation before projection/render.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-scene-contract.test.js`

- [ ] **Step 3: Implement the scene**

No atmosphere, camera flourish or extra features yet. The point of this task is one thing: prove the Ground-Point architecture visually.

- [ ] **Step 4: Run automated GREEN**

Run:
- `node tests/raishin-v2-scene-contract.test.js`
- `node --test tests/raishin-*.test.js`

- [ ] **Step 5: Mandatory manual visual QA gate**

Open the branch preview at `/raishin-legacy/v2.html` and test:
- hold UP from spawn to rear boundary;
- hold DOWN back toward camera;
- LEFT/RIGHT at near and far depths;
- diagonals;
- stop and restart in every direction.

Required acceptance:
- UP reads as movement deeper into the room, not vertical floating;
- shadow remains under the Ground Point;
- feet do not detach from the floor because of render math;
- scale changes continuously with depth;
- Raika cannot enter the rear wall/weapon racks;
- direction changes do not snap the character to a different floor point.

If this gate fails, STOP. Adjust only WorldPlane calibration or static pivot metadata, add/adjust tests, and repeat. Do **not** reintroduce alpha scanning or per-direction grounding hacks.

- [ ] **Step 6: Commit after visual QA approval**

Commit: `feat: prove Phaser ground-anchored dojo movement`

---

### Task 7: Add depth objects, restrained camera and HUD/interactions bridge

**Files:**
- Create: `raishin-legacy/src/systems/CameraController.js`
- Create: `raishin-legacy/src/ui/HudBridge.js`
- Update: `raishin-legacy/src/scenes/DojoScene.js`
- Update: `raishin-legacy/v2.html`
- Create: `tests/raishin-v2-integration.test.js`

**Interfaces:**

`CameraController.configure(camera,target,options)` uses Phaser camera APIs with initial restrained values:
- dead zone approximately `360×180` screen units;
- lerp around `0.08` each axis;
- scene bounds calibrated so the single background never exposes empty space.

Do not compensate for camera movement by adding independent player/background offsets. Phaser camera transform is the camera transform.

Depth contract:
- dynamic/player depth derives from projected Ground Y;
- interaction/world objects receive a projected ground anchor and depth band;
- passing behind/in front of an object changes draw order solely from ground depth.

`HudBridge` exposes:
- `updateMinimap(worldPoint, worldSize)`
- `showInteraction(item, screenPoint)`
- `hideInteraction()`
- `setObjective(text)`
- `setSeika(active)`
- `setPanelOpen(active)` / query state so player movement stops while a modal panel is open.

- [ ] **Step 1: Write failing integration tests**

Assert minimap clamps to `[0,1]`; interaction prompt uses projected anchor; all five interaction responses remain present; opening a panel blocks movement input; Y-depth comparison puts the larger projected Ground Y in front; camera configuration uses one camera path rather than manual world offsets.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-integration.test.js`

- [ ] **Step 3: Implement bridge/depth/camera**

Preserve existing copy/behavior for Training Bag, Weapons Wall, Training Center, Courtyard Exit and Seika Point.

Atmosphere can stay CSS/legacy DOM during this milestone; do not make it a blocker for movement architecture.

- [ ] **Step 4: Run GREEN + full Raishin lane**

Run:
- `node tests/raishin-v2-integration.test.js`
- `node --test tests/raishin-*.test.js`

- [ ] **Step 5: Manual QA**

Re-run Task 6 movement checks with camera enabled, plus interaction prompts and passing before/behind depth objects. Camera motion must not make grounded feet appear to drift relative to the floor.

- [ ] **Step 6: Commit**

Commit: `feat: integrate dojo camera depth and HUD in movement v2`

---

### Task 8: Migrate the approved v2 prototype to the live game

**Prerequisite:** The user has visually approved the v2 preview from Tasks 6–7. Without that approval, do not perform this task.

**Files:**
- Modify: `raishin-legacy/index.html`
- Replace/simplify: `raishin-legacy/game.js` as Phaser bootstrap or load the v2 bootstrap/modules directly
- Preserve: `raishin-legacy/styles.css` and existing HUD markup/styles
- Create: `tests/raishin-v2-live-migration.test.js`
- Update or delete only now: legacy tests that require the rejected grounding architecture

Legacy hack-contract tests to retire/replace after the live switch:
- `tests/raishin-left-grounding-v1.test.js`
- `tests/raishin-up-grounding-v4.test.js`
- `tests/raishin-up-grounding-v5.test.js`
- `tests/raishin-professional-walk-up-v3.test.js`
- `tests/raishin-walk-up-grounding-v2.test.js`
- `tests/raishin-walk-up-v1.test.js`
- `tests/raishin-asset-load-fallback.test.js` if it only protects the dedicated legacy UP asset path.

Other old tests that assert raw-canvas implementation details (`requestAnimationFrame`, legacy module order, 1600×900 screen-as-world geometry) must be updated to assert the equivalent user-facing contract in v2, not preserved artificially.

- [ ] **Step 1: Write failing live-migration contract**

Before changing live files, create `tests/raishin-v2-live-migration.test.js` asserting live `index.html` loads Phaser 4.2.1 and v2 modules, HUD is preserved, approved assets are preserved, and live source contains none of:
- `getImageData`
- `findDenseFootContact`
- `buildUpGroundingMetrics`
- `buildLeftGroundingMetrics`
- `upFootContactOffsets`
- lower-body `ctx.clip()`/mirror grounding hack
- screen polygon as the player world-state source of truth.

Run it and verify it fails against the legacy live engine.

- [ ] **Step 2: Switch live bootstrap to v2**

Copy the proven preview wiring into `index.html`/`game.js` without changing the accepted movement architecture. Keep `v2.html` temporarily as a comparison/debug page until final release verification is complete.

- [ ] **Step 3: Retire obsolete hack tests**

Delete or rewrite only the tests that explicitly require the rejected architecture. Their replacement is the v2 suite from Tasks 2–8. Do not delete broad user-facing contracts such as standalone 16:9/HUD/isolation/responsiveness; update those if their implementation markers changed.

- [ ] **Step 4: Run the complete Raishin test lane**

Run: `node --test tests/raishin-*.test.js`

Expected: PASS for all Raishin tests.

If unrelated repository workflows fail, record them separately; do not weaken Raishin tests to obtain green CI.

- [ ] **Step 5: Source audit**

Search `raishin-legacy/` for the legacy grounding identifiers above. Expected: zero runtime references. Old binary assets may remain until a separate cleanup is approved; they must not be loaded by the live engine.

- [ ] **Step 6: Manual live-candidate QA**

Repeat the full Task 6–7 checklist against the live candidate branch, including desktop resize and mobile landscape/portrait shell behavior. No image generation or visual redesign is part of this migration.

- [ ] **Step 7: Commit**

Commit: `refactor: migrate Raishin Legacy to movement engine v2`

---

### Task 9: Final review, merge and GitHub Pages verification

**Files:**
- Verify all changed `raishin-legacy/**`
- Verify all `tests/raishin-*.test.js`
- Verify `.github/workflows/raishin-legacy-test.yml`
- Optionally remove `v2.html` only if the user no longer wants a debug/preview route; otherwise leave it clearly non-default.

- [ ] **Step 1: Fresh verification**

From the final implementation head run:

```bash
node --test tests/raishin-*.test.js
```

Expected: all Raishin tests pass.

- [ ] **Step 2: Code review focus**

Check against the five Review Focus items at the top of this plan. In particular, trace one held-UP update end-to-end:

`keyboard -> input vector -> PlayerController worldY -> CollisionMap -> movedDistance -> WorldPlane.project -> PlayerAnimator -> PlayerView -> Phaser sprite/shadow`.

There must be no alternate positioning path.

- [ ] **Step 3: User visual approval before merge**

Show the final preview/candidate. Do not merge solely because tests pass; visual grounding is an explicit acceptance criterion.

- [ ] **Step 4: Merge**

Merge the implementation PR only after approval and passing Raishin CI.

- [ ] **Step 5: Verify GitHub Pages exact deployment**

Find the `pages build and deployment` run whose `head_sha` equals the merge SHA. Wait until:
- `status = completed`
- `conclusion = success`.

Do not claim the release is live before both conditions are true.

- [ ] **Step 6: Final live check**

Open:

`https://benaviv311-eng.github.io/my-center/raishin-legacy/?v=movement-v2`

Verify keyboard focus and the four directions, especially sustained UP to the rear boundary.

- [ ] **Step 7: Report**

Report merge SHA, Pages success and the cache-busted live link. If visual behavior differs from the approved preview, treat it as a deployment/cache/debug issue, not as permission to reintroduce legacy grounding hacks.
