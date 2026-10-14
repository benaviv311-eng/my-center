# Raishin Movement Engine v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragile screen-pixel grounding model with a tested Phaser 4.2.1 2.5D movement engine in which Raika moves in logical World Space and every visual element is derived from one Ground Point.

**Architecture:** Build v2 beside the live engine first. Pure UMD/CommonJS modules own projection, movement, collision, animation state and view math; Phaser owns scene rendering, keyboard input and camera. The preview is deployed at `/raishin-legacy/v2.html` while the current `/raishin-legacy/` remains untouched; only after the user visually approves the preview do we switch the default route and retire legacy grounding hacks.

**Tech Stack:** Phaser 4.2.1 via pinned CDN, static HTML/CSS/JavaScript, GitHub Pages, CommonJS-compatible pure modules, Node 24 + `assert` / `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-14-raishin-movement-engine-v2-design.md`

## Global Constraints

- Start implementation from fresh current `main`, not from the older design-branch base, so unrelated repository changes are preserved.
- Live `/raishin-legacy/` must remain on the old engine until the v2 preview is visually approved.
- Preview route is `/raishin-legacy/v2.html`. Because GitHub Pages publishes `main`, preview-only milestones may be merged to `main` **only when they do not modify the default `index.html`/live bootstrap**; this makes the preview testable without replacing the live game.
- Reuse the approved dojo background, DOM HUD and existing Raika assets. No image generation/editing is authorized by this plan.
- The existing four-direction sheet may be used as a **mechanics prototype asset only**. It is not automatically re-approved visually. If it shows a human ear or any identity/canon defect, live migration is blocked until the user separately approves a corrected visual asset/workflow.
- Raika Visual Lock remains canonical: exactly two rabbit ears, zero human ears, cream/white fur, green eyes, pale hair, side ponytail with dark-green ribbon, canonical cream/green training outfit, brown forearm wraps, bare rabbit feet, no tail.
- World Space, Screen Space and Sprite Space stay separate. Sprite pixels are never world geometry.
- No `getImageData()` or runtime foot/alpha scanning in v2.
- Ground Point is the single source of truth for player position, shadow, scale and render depth.
- All four directions use one rendering contract; direction-specific grounding hacks are forbidden.
- Walk frames advance from actual resolved world distance, not a free-running timer.
- Collisions/interactions use World-Space footprints, never full character-art bounds.
- Keep HUD as DOM; Phaser renders the dojo/world.
- Pin Phaser exactly to `https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js`.
- Do not add a bundler/package manager solely for this migration. Browser-loadable modules must also be require-able by Node tests.

## Review Focus

1. **Fake depth:** held UP must change logical `worldY`, projection and scale together — pinned by Tasks 2, 3 and 6.
2. **Floating/sliding:** sprite and shadow must derive from the same projected Ground Point for every frame — pinned by Tasks 5 and 6.
3. **Architecture regression:** runtime alpha scans, manual direction offsets or lower-body mirroring must not reappear — pinned by Tasks 5, 6 and 8.
4. **Scenery climbing:** sustained UP must stop before rear wall/weapon racks in World Space — pinned by Tasks 4 and 6.
5. **Unsafe release:** preview must not replace live early, and non-canonical art must not silently become final — pinned by Tasks 1, 6 and 8.

---

### Task 1: Create the isolated v2 preview and Raishin CI lane

**Files:**
- Create: `.github/workflows/raishin-legacy-test.yml`
- Create: `tests/raishin-v2-shell.test.js`
- Create: `raishin-legacy/v2.html`
- Create: `raishin-legacy/v2-game.js`
- Reuse: `raishin-legacy/styles.css`
- Do not modify: `raishin-legacy/index.html`, `raishin-legacy/game.js`

**Interfaces:**
- Browser global `window.Phaser` from the pinned CDN.
- Preview mount `#phaserGame` inside the 16:9 `.game-frame`.
- Existing HUD IDs: `objectiveText`, `minimapPlayer`, `interactionPrompt`, `interactionPanel`, `seikaOverlay`, `loadError`.

- [ ] **Step 1: Write failing `tests/raishin-v2-shell.test.js`**

Assert `v2.html`/`v2-game.js` exist; Phaser 4.2.1 loads before v2 code; approved HUD/background/player paths are reused; and current live `index.html` still points at the legacy modules/bootstrap.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-shell.test.js`
Expected: FAIL because preview files do not exist.

- [ ] **Step 3: Implement preview shell/bootstrap**

`v2.html` copies only necessary frame/HUD markup, mounts Phaser into `#phaserGame`, then loads v2 modules. `v2-game.js` starts Phaser or exposes `#loadError`; it must never fall back to legacy canvas code.

- [ ] **Step 4: Add dedicated CI**

`.github/workflows/raishin-legacy-test.yml`: Node 24; trigger for `raishin-legacy/**`, `tests/raishin-*.test.js`, and the workflow; run `node --test tests/raishin-*.test.js`. Keep all legacy Raishin tests active during preview development.

- [ ] **Step 5: Run GREEN/regression**

Run:
- `node tests/raishin-v2-shell.test.js`
- `node --test tests/raishin-*.test.js`

Expected: no live-engine changes and no new Raishin failures.

- [ ] **Step 6: Commit**

Commit: `test: scaffold isolated Raishin movement v2 preview`

---

### Task 2: Build `WorldPlane` and dojo perspective calibration

**Files:**
- Create: `raishin-legacy/src/world/WorldPlane.js`
- Create: `raishin-legacy/src/world/dojo-layout.js`
- Create: `tests/raishin-v2-world-plane.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**

Initial logical world and screen calibration:

```js
WORLD_WIDTH = 1000
WORLD_HEIGHT = 600
farLeft   = { x: 430,  y: 585 }
farRight  = { x: 1170, y: 585 }
nearLeft  = { x: 165,  y: 835 }
nearRight = { x: 1435, y: 835 }
farScale = 0.72
nearScale = 1.06
```

Convention: `worldY=0` is rear/far; `worldY=600` is near/bottom; UP decreases world Y.

`WorldPlane.create(config)` produces:
- `project({x,y}) -> {x,y,scale,depth}`
- `unproject({x,y}) -> {x,y}`
- `contains({x,y}, radius=0) -> boolean`

Projection uses `t=worldY/WORLD_HEIGHT`, interpolates left/right edges, screen Y and scale, and sets `depth=screenY`.

- [ ] **Step 1: Write failing projection tests**

Assert exact four corners, center, monotonic scale/Y, project→unproject round trip, radius-aware bounds, CommonJS export and browser global. Add Review Focus test: decreasing world Y decreases projected screen Y and scale together.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-world-plane.test.js`

- [ ] **Step 3: Implement pure projection math**

No Phaser, DOM, image/pixel reads or sprite dimensions in this module.

- [ ] **Step 4: Run GREEN + Raishin lane**

Run `node tests/raishin-v2-world-plane.test.js` then `node --test tests/raishin-*.test.js`.

- [ ] **Step 5: Commit**

Commit: `feat: add Raishin perspective world plane`

---

### Task 3: Move player simulation into World Space

**Files:**
- Create: `raishin-legacy/src/player/PlayerController.js`
- Create: `tests/raishin-v2-player-controller.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**
- `inputFromKeys(keys)`
- `normalizeInput({x,y})`
- `createPlayerController(options)`
- `controller.step({input,dt,resolveMotion}) -> {worldX,worldY,vx,vy,facing,moving,movedDistance,totalDistance}`

Defaults:
`spawn={x:500,y:420}`, `maxSpeed=300`, `acceleration=1000`, `deceleration=1300`, `radius=24`, `maxDt=0.05`.

- [ ] **Step 1: Write failing controller tests**

Cover WASD/arrows, opposite cancellation, diagonal vector length ≤1, acceleration/deceleration, dt clamp, speed cap, idle-facing stability and UP decreasing `worldY`. Simulate held UP for many frames and assert logical world displacement, not merely render state.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-player-controller.test.js`

- [ ] **Step 3: Implement one direction-agnostic movement path**

Compute `movedDistance` only after `resolveMotion` returns the legal position. Controller must not know screen coordinates, sprite size or scale.

- [ ] **Step 4: Run GREEN + regressions**

Run the task test then `node --test tests/raishin-*.test.js`.

- [ ] **Step 5: Commit**

Commit: `feat: move Raika simulation into world space`

---

### Task 4: Add World-Space collisions and interactions

**Files:**
- Create: `raishin-legacy/src/world/CollisionMap.js`
- Create: `raishin-legacy/src/systems/InteractionSystem.js`
- Update: `raishin-legacy/src/world/dojo-layout.js`
- Create: `tests/raishin-v2-world-systems.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**

Initial legal bounds: `{minX:35,maxX:965,minY:45,maxY:575}`.

Initial obstacle footprints:
- training bag `{x:150,y:220,radius:42}`
- left column `{x:90,y:330,radius:34}`
- right column `{x:910,y:330,radius:34}`

Initial interactions:
- `training-bag {x:150,y:220,radius:110}`
- `weapons-wall {x:780,y:70,radius:130}`
- `training-center {x:500,y:270,radius:120}`
- `courtyard-exit {x:900,y:230,radius:130}`
- `seika-point {x:160,y:455,radius:115}`

`CollisionMap.create(layout)` exposes `isWalkable(point,radius)` and `resolveMotion(current,proposed,radius)` with axis sliding.

`InteractionSystem.create(layout,worldPlane)` exposes `nearest(point,maxDistance)` and `projectPrompt(item)`.

- [ ] **Step 1: Write failing world-system tests**

Test bounds/radius, obstacle blocks, diagonal slide, all five interaction IDs, deterministic nearest interaction and prompt projection. Simulate sustained UP and prove player stops before `minY`/rear wall.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-world-systems.test.js`

- [ ] **Step 3: Implement pure World-Space systems**

No screen collision constants outside the projection calibration; no sprite dimensions in collision code.

- [ ] **Step 4: Run GREEN + regressions**

Run task test then `node --test tests/raishin-*.test.js`.

- [ ] **Step 5: Commit**

Commit: `feat: add world-space dojo collision and interactions`

---

### Task 5: Add static animation metadata, distance-driven animator and PlayerView

**Files:**
- Create: `raishin-legacy/src/player/raika-animation-data.js`
- Create: `raishin-legacy/src/player/PlayerAnimator.js`
- Create: `raishin-legacy/src/player/PlayerView.js`
- Create: `tests/raishin-v2-player-view.test.js`
- Update: `raishin-legacy/v2.html`

**Interfaces:**

Mechanics prototype uses existing `raika-walk-4dir-8f.png` for all directions; no new image. Row mapping: `down=0`, `up=1`, `left=2`, `right=3`, 8 frames each.

`raika-animation-data.js` stores explicit normalized static pivot metadata (`0..1`) and stable idle frame per direction. No runtime detection.

`PlayerAnimator.create(data,{stride:24}).update({facing,moving,movedDistance}) -> {key,row,frameIndex,pivot}`.

`PlayerView.compute({projection,pivot}) -> {x,y,originX,originY,scale,depth,shadowX,shadowY,shadowDepth}`.

Contract: sprite pivot lands on projected Ground Point; shadow X/Y equal Ground Point; player depth `projection.depth+1`; shadow depth `projection.depth-1`.

- [ ] **Step 1: Write failing animator/view tests**

Assert 8 frames/direction; static pivot count/ranges; stride boundaries; stable idle; direction switch does not move Ground Point; every frame/direction keeps shadow at Ground Point. Source assertions reject `getImageData`, `findDenseFootContact`, `buildUpGroundingMetrics`, `buildLeftGroundingMetrics`, `upFootContactOffsets` and lower-body mirroring in new `src/` code.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-player-view.test.js`

- [ ] **Step 3: Implement metadata/animator/view**

Pivot tuning is static data calibration only. Never solve a bad frame with runtime pixel analysis.

- [ ] **Step 4: Run GREEN + regressions**

Run task test then `node --test tests/raishin-*.test.js`.

- [ ] **Step 5: Commit**

Commit: `feat: anchor Raika animations to one ground point`

---

### Task 6: Build, deploy and visually prove the Phaser `DojoScene` prototype

**Files:**
- Create: `raishin-legacy/src/scenes/DojoScene.js`
- Update: `raishin-legacy/v2-game.js`
- Update: `raishin-legacy/v2.html`
- Create: `tests/raishin-v2-scene-contract.test.js`

**Interfaces:**
`createDojoScene(Phaser,deps) -> class DojoScene extends Phaser.Scene`.

`preload()` loads approved clean dojo background and existing four-direction sheet as a plain image.

`create()` displays background, divides loaded image dimensions into the known 8×4 grid using Phaser texture frames, creates Sprite + ground shadow, registers keyboard input and instantiates WorldPlane/controller/collision/animator/view.

`update()` order is fixed:
`input -> controller/world collision -> project Ground Point -> animator from moved distance -> PlayerView -> sprite/shadow`.

Camera stays static in this task to isolate grounding.

- [ ] **Step 1: Write failing scene-contract test**

Assert Phaser Scene + v2 dependencies + 8×4 texture frames and the update-order contract. Reject raw-canvas `requestAnimationFrame`, alpha scanning, direction foot offsets and lower-body mirroring in v2 scene/bootstrap.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-scene-contract.test.js`

- [ ] **Step 3: Implement minimal Phaser movement scene**

No atmosphere/camera flourish. Add an optional `?debugGround=1` preview overlay showing the projected Ground Point and player world coordinates; debug overlay must not alter simulation/render math.

- [ ] **Step 4: Run automated GREEN**

Run task test then `node --test tests/raishin-*.test.js`.

- [ ] **Step 5: Publish the preview without replacing live**

Open a **preview-only implementation PR** whose changes are limited to `v2.html`, v2 source/modules/tests/CI and shared non-live-safe additions. Verify it does not modify live `index.html`/legacy `game.js`. Merge that preview PR to `main`, wait for the Pages run for that merge SHA to succeed, then use:

`https://benaviv311-eng.github.io/my-center/raishin-legacy/v2.html?v=movement-v2-preview`

This merge is allowed before gameplay approval because the default live route remains unchanged.

- [ ] **Step 6: Mandatory user visual QA gate**

Test sustained UP/DOWN, LEFT/RIGHT at near/far depth, diagonals and stop/restart. Required mechanics acceptance: UP reads as travel into depth; shadow stays at Ground Point; render math does not detach feet; scale is continuous; rear wall cannot be entered; direction changes do not move Ground Point.

If mechanics fail, adjust only projection calibration or static pivot metadata on a follow-up preview branch, deploy preview again, and repeat. Do not reintroduce legacy hacks.

Visual-canon check is separate but mandatory before live migration: if any frame shows a human ear or identity defect, record the asset as non-final. **Do not create/edit an image automatically.** A corrected asset requires the user's separate explicit image approval.

- [ ] **Step 7: Gate result**

Proceed to Task 7 only after mechanics preview is approved. Commit/finalize preview corrections as: `feat: prove Phaser ground-anchored dojo movement`.

---

### Task 7: Add depth objects, restrained camera and HUD/interactions bridge

**Files:**
- Create: `raishin-legacy/src/systems/CameraController.js`
- Create: `raishin-legacy/src/ui/HudBridge.js`
- Update: `raishin-legacy/src/scenes/DojoScene.js`
- Update: `raishin-legacy/v2.html`
- Create: `tests/raishin-v2-integration.test.js`

**Interfaces:**
`CameraController.configure(camera,target,options)` uses Phaser camera with initial dead zone about `360×180`, lerp about `0.08`, and bounds that never expose empty space. No independent player/background camera offsets.

Depth derives from projected Ground Y. `HudBridge` exposes `updateMinimap`, `showInteraction`, `hideInteraction`, `setObjective`, `setSeika`, and panel-open state that blocks movement.

- [ ] **Step 1: Write failing integration tests**

Test minimap clamp, projected prompt position, five interaction responses, modal movement block, larger projected Ground Y drawing in front, and one camera transform path.

- [ ] **Step 2: Run RED**

Run: `node tests/raishin-v2-integration.test.js`

- [ ] **Step 3: Implement camera/depth/HUD bridge**

Preserve existing Training Bag, Weapons Wall, Training Center, Courtyard Exit and Seika behavior/copy. Atmosphere is non-blocking for this architecture milestone.

- [ ] **Step 4: Run GREEN + full Raishin lane**

Run task test then `node --test tests/raishin-*.test.js`.

- [ ] **Step 5: Deploy updated preview**

Use another preview-only PR to `main`; default route remains untouched. Wait for Pages success and ask the user to re-check movement, camera, prompts and before/behind depth ordering on `v2.html`.

- [ ] **Step 6: Final preview approval gate**

Do not start live migration until the user approves the complete preview mechanics and the Raika asset used for live release passes Visual Lock (or a separately approved corrected asset has been supplied).

- [ ] **Step 7: Commit**

Commit: `feat: integrate dojo camera depth and HUD in movement v2`

---

### Task 8: Migrate the approved preview to the default live game

**Prerequisite:** User has approved the complete v2 preview, and final Raika visual asset passes Visual Lock.

**Files:**
- Modify: `raishin-legacy/index.html`
- Replace/simplify: `raishin-legacy/game.js` as Phaser bootstrap or load v2 bootstrap/modules directly
- Preserve: `raishin-legacy/styles.css` + HUD
- Create: `tests/raishin-v2-live-migration.test.js`
- Retire/rewrite only now: legacy tests that require rejected grounding architecture

Legacy hack-contract tests to retire/replace at this stage include:
`raishin-left-grounding-v1`, `raishin-up-grounding-v4`, `raishin-up-grounding-v5`, `raishin-professional-walk-up-v3`, `raishin-walk-up-grounding-v2`, `raishin-walk-up-v1`, and `raishin-asset-load-fallback` if it only protects the legacy dedicated-UP path.

- [ ] **Step 1: Write failing live-migration test**

Assert default `index.html` loads Phaser/v2, preserves HUD/approved assets and live runtime has none of: `getImageData`, `findDenseFootContact`, `buildUpGroundingMetrics`, `buildLeftGroundingMetrics`, `upFootContactOffsets`, lower-body mirror grounding, or screen polygon as player world-state truth. Run it against legacy live and confirm RED.

- [ ] **Step 2: Switch default bootstrap to proven v2**

Copy the approved preview wiring without changing its accepted movement math. Keep `v2.html` temporarily for comparison/debug.

- [ ] **Step 3: Retire obsolete implementation-marker tests**

Delete/rewrite only tests requiring the rejected architecture. Preserve broad contracts: standalone isolation, 16:9/responsive shell, HUD, interactions and user-facing movement behavior.

- [ ] **Step 4: Run complete Raishin lane**

Run: `node --test tests/raishin-*.test.js`
Expected: all Raishin tests pass.

- [ ] **Step 5: Source audit**

Search runtime `raishin-legacy/` code for legacy grounding identifiers. Expected: zero runtime references. Old binaries may remain until separate cleanup, but live code must not load them unless separately approved as final assets.

- [ ] **Step 6: Manual live-candidate QA**

Repeat Task 6–7 movement checks, plus desktop resize and mobile landscape/portrait shell checks.

- [ ] **Step 7: Commit**

Commit: `refactor: migrate Raishin Legacy to movement engine v2`

---

### Task 9: Final review, merge and GitHub Pages verification

**Files:**
- Verify: all changed `raishin-legacy/**`
- Verify: all `tests/raishin-*.test.js`
- Verify: `.github/workflows/raishin-legacy-test.yml`

- [ ] **Step 1: Fresh verification**

Run: `node --test tests/raishin-*.test.js`
Expected: all Raishin tests pass.

- [ ] **Step 2: End-to-end code trace**

Trace held UP through exactly one path:
`keyboard -> PlayerController worldY -> CollisionMap -> movedDistance -> WorldPlane.project -> PlayerAnimator -> PlayerView -> Phaser sprite/shadow`.
No alternate positioning path is allowed.

- [ ] **Step 3: Final user approval before live merge**

Show final candidate/preview. Tests alone do not prove visual grounding.

- [ ] **Step 4: Merge live-migration PR**

Merge only after user approval + passing Raishin CI.

- [ ] **Step 5: Verify exact Pages deployment**

Find `pages build and deployment` whose `head_sha` equals merge SHA and wait for `status=completed`, `conclusion=success`. Do not claim live earlier.

- [ ] **Step 6: Final live check**

Open `https://benaviv311-eng.github.io/my-center/raishin-legacy/?v=movement-v2` and verify focus + all four directions, especially sustained UP to rear boundary.

- [ ] **Step 7: Report**

Report merge SHA, Pages success and cache-busted live link. A deployment discrepancy is a deploy/cache/debug problem, not permission to restore grounding hacks.
