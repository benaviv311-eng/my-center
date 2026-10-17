# Raishin v2 World Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Raishin v2 Inazuma dojo as a real Phaser/WebGL world-space scene where Raika is correctly scaled, grounded, depth-sorted, collision-bound, and followed by a scrolling camera.

**Architecture:** Preserve the existing pure v2 movement/animation modules, expand the logical dojo from a single-screen stage into a 2400×1500 world model, and separate world projection, collision, depth, camera, and Phaser scene composition. Legacy `game.js` and `open-world-presentation.js` remain untouched until visual acceptance.

**Tech Stack:** JavaScript, Phaser 4.2.1/WebGL, Node 24 assertion tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-17-raishin-v2-world-core-design.md`

## Global Constraints

- Build only behind `/raishin-legacy/v2.html` until visual acceptance; do not switch `/raishin-legacy/index.html` yet.
- Keep canonical Raika art unchanged: `./assets/player/raika-walk-4dir-8f.png`; no human ears, no tail, no redesign.
- `worldX/worldY` always represent the planted floor point beneath Raika.
- No `bobY`, fixed pixel lowering, runtime alpha-foot scanning, or direction-specific scale hacks in v2.
- Default spawn must render Raika at 28–36% of a 900px viewport height.
- Logical dojo target is 2400×1500 and must require real camera traversal.
- Collision and interactions stay in logical world coordinates; camera state never changes gameplay coordinates.
- First visual checkpoint includes only dojo world, Raika, shadow, camera, collisions, depth/occlusion, and existing interaction anchors; no jump, dodge, combat, enemies, quests, inventory, or save system.
- CI uses Node 24 and each Raishin test is executed with `node tests/<file>.test.js`.

## Review Focus

- Extreme camera positions: camera clamps without exposing empty space at all four world edges.
- Long diagonal movement into a corner: collision resolves deterministically and never tunnels outside the walkable floor.
- Direction changes during animation: all four direction pivots keep the same authoritative ground point without visual foot drift.
- Resize / 16:9 FIT scaling: world framing remains valid and gameplay coordinates are unaffected by viewport scaling.
- Interaction prompts while camera scrolls/zooms: nearest-item selection stays world-space while prompt render position tracks projection.

---

### Task 1: Replace the single-screen dojo layout with a real world model

**Files:**
- Create: `raishin-legacy/src/world/WorldModel.js`
- Modify: `raishin-legacy/src/world/dojo-layout.js`
- Modify: `raishin-legacy/v2.html`
- Test: `tests/raishin-v2-world-model.test.js`
- Modify: `.github/workflows/raishin-v2-test.yml`

**Interfaces:**
- Produces: `WorldModel.create(layout)` → frozen object exposing `width`, `height`, `spawn`, `walkablePolygons`, `solids`, `renderObjects`, `interactions`, and `renderBounds`.
- `dojo-layout.js` remains the data source and exports `WORLD_WIDTH=2400`, `WORLD_HEIGHT=1500`, `spawn`, `walkablePolygons`, `solids`, `renderObjects`, and `interactions`.

- [ ] **Step 1: Write the failing world-model contract test**

Assert that the logical world is exactly 2400×1500, spawn is inside the walkable area, the world has at least one walkable polygon, at least circle and rectangle collision primitives, semantic render objects for rear/floor/prop/foreground layers, and the existing interaction IDs `training-bag`, `weapons-wall`, `training-center`, `courtyard-exit`, `seika-point`.

- [ ] **Step 2: Run the new test and confirm it fails**

Run: `node tests/raishin-v2-world-model.test.js`
Expected: FAIL because `WorldModel.js` and the expanded layout do not exist yet.

- [ ] **Step 3: Implement the minimal world model and expanded layout**

Create `WorldModel.create(layout)` as pure data validation/normalization. Keep all coordinates in logical world units. Add `WorldModel.js` to `v2.html` before systems that consume it.

- [ ] **Step 4: Add the test to the Raishin v2 CI matrix and run it**

Run: `node tests/raishin-v2-world-model.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raishin-legacy/src/world/WorldModel.js raishin-legacy/src/world/dojo-layout.js raishin-legacy/v2.html tests/raishin-v2-world-model.test.js .github/workflows/raishin-v2-test.yml
git commit -m "feat(raishin): define explorable v2 dojo world"
```

### Task 2: Recalibrate projection and add one authoritative depth system

**Files:**
- Modify: `raishin-legacy/src/world/WorldPlane.js`
- Create: `raishin-legacy/src/systems/DepthSystem.js`
- Modify: `raishin-legacy/src/player/PlayerView.js`
- Modify: `raishin-legacy/v2.html`
- Modify: `tests/raishin-v2-world-plane.test.js`
- Modify: `tests/raishin-v2-player-view.test.js`
- Create: `tests/raishin-v2-depth-system.test.js`
- Modify: `.github/workflows/raishin-v2-test.yml`

**Interfaces:**
- `WorldPlane.create(config)` continues producing `{ project, unproject, contains, width, height }`.
- `project({x,y})` returns `{x,y,scale,depth}` and round-trips through `unproject`.
- `DepthSystem.depthFor(projection, depthBias=0)` returns `projection.y + depthBias`.
- `DepthSystem.fixedBand(name)` returns fixed bands for background/floor/foreground architecture.
- `PlayerView.compute({projection,pivot,motion})` keeps `x/y` exactly at the projected ground point and receives depth through the shared depth rule rather than private offsets.

- [ ] **Step 1: Rewrite projection tests for the 2400×1500 world**

Test round-trip at corners, center, and off-center points; require perspective scale to increase monotonically toward the near edge and keep pure-math independence from Phaser/canvas.

- [ ] **Step 2: Add a failing depth-system test**

Assert that two objects with the same bias sort by projected ground Y, bias changes ordering predictably, and background/floor/foreground fixed bands do not collide with dynamic player/prop depths.

- [ ] **Step 3: Run the projection/player/depth tests and confirm failure**

Run: `node tests/raishin-v2-world-plane.test.js && node tests/raishin-v2-player-view.test.js && node tests/raishin-v2-depth-system.test.js`
Expected: FAIL on old 1000×600 calibration and missing `DepthSystem`.

- [ ] **Step 4: Implement recalibrated `WorldPlane` and `DepthSystem`**

Keep projection formulas pure. Use one calibrated perspective mapping for the full world and expose enough render bounds for camera clamping; do not insert camera offsets into projection.

- [ ] **Step 5: Keep Raika’s Ground Point invariant**

Update `PlayerView` so each pivot is only an origin inside the frame; `view.x/view.y` and shadow ground position must remain exactly the projection of `worldX/worldY` for all four directions and all eight frames.

- [ ] **Step 6: Run tests and add the new depth test to CI**

Expected: all three tests PASS.

- [ ] **Step 7: Commit**

```bash
git add raishin-legacy/src/world/WorldPlane.js raishin-legacy/src/systems/DepthSystem.js raishin-legacy/src/player/PlayerView.js raishin-legacy/v2.html tests/raishin-v2-world-plane.test.js tests/raishin-v2-player-view.test.js tests/raishin-v2-depth-system.test.js .github/workflows/raishin-v2-test.yml
git commit -m "feat(raishin): project and depth-sort the full dojo world"
```

### Task 3: Upgrade collision from simple bounds/circles to world primitives

**Files:**
- Modify: `raishin-legacy/src/world/CollisionMap.js`
- Modify: `tests/raishin-v2-world-systems.test.js`
- Create: `tests/raishin-v2-collision-primitives.test.js`
- Modify: `.github/workflows/raishin-v2-test.yml`

**Interfaces:**
- `CollisionMap.create(worldModel)` → `{ isWalkable(point,radius), resolveMotion(current,proposed,radius) }`.
- Supported solid shapes: `{type:'circle',x,y,radius}`, `{type:'rect',x,y,width,height}`, and oriented rectangle `{type:'obox',x,y,width,height,rotation}`.
- Walkable floor is one or more polygons in world coordinates.

- [ ] **Step 1: Write failing primitive and boundary tests**

Cover polygon edge rejection, circle/rect/oriented-rect collision, legal axis sliding, all four outer boundaries, and repeated diagonal movement into a corner without tunneling.

- [ ] **Step 2: Run collision tests and confirm failure**

Run: `node tests/raishin-v2-world-systems.test.js && node tests/raishin-v2-collision-primitives.test.js`
Expected: FAIL because current collision supports only rectangular bounds plus circles.

- [ ] **Step 3: Implement the collision primitives**

Keep collision pure and deterministic. Continue the existing contract: proposed move first, then legal X-only slide, then legal Y-only slide, otherwise current position.

- [ ] **Step 4: Verify collision cannot alter camera/render state**

Add a source contract assertion forbidding Phaser, sprite, camera, screen, and canvas dependencies from `CollisionMap.js`.

- [ ] **Step 5: Run tests and add the primitive test to CI**

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add raishin-legacy/src/world/CollisionMap.js tests/raishin-v2-world-systems.test.js tests/raishin-v2-collision-primitives.test.js .github/workflows/raishin-v2-test.yml
git commit -m "feat(raishin): add world-space dojo collision primitives"
```

### Task 4: Replace the tiny camera offset with a real CameraRig

**Files:**
- Create: `raishin-legacy/src/systems/CameraRig.js`
- Remove v2 usage of: `raishin-legacy/src/systems/CameraFollow.js` (keep file temporarily only if legacy tests still import it)
- Modify: `raishin-legacy/v2.html`
- Modify: `tests/raishin-v2-professional-movement.test.js`
- Create: `tests/raishin-v2-camera-rig.test.js`
- Modify: `.github/workflows/raishin-v2-test.yml`

**Interfaces:**
- `CameraRig.create({viewportWidth,viewportHeight,worldBounds,zoom,deadZoneX,deadZoneY,smoothing,lookAheadX,lookAheadY})`.
- `update({groundProjection,velocity,dt})` → `{scrollX,scrollY,zoom,targetX,targetY}`.
- `reset(groundProjection)` and `snapshot()` return the same state shape.

- [ ] **Step 1: Write the failing CameraRig test**

Assert: idle stability; no movement while target stays inside a 5–8% viewport dead zone; sustained movement produces hundreds of pixels of scroll rather than an 18px offset; velocity produces bounded look-ahead; camera remains clamped at all four render bounds; invalid/large `dt` cannot cause a jump outside bounds.

- [ ] **Step 2: Update the old professional movement camera expectation**

Remove the old single-room `maxX:20/maxY:12` contract. Preserve movement acceleration/reversal/facing tests; move world-camera behavior to `raishin-v2-camera-rig.test.js`.

- [ ] **Step 3: Run tests and confirm failure**

Run: `node tests/raishin-v2-professional-movement.test.js && node tests/raishin-v2-camera-rig.test.js`
Expected: FAIL because `CameraRig` does not exist and the old test encodes tiny offset behavior.

- [ ] **Step 4: Implement CameraRig as pure math**

Use ground projection only, exponential/critically damped smoothing, explicit zoom, velocity look-ahead, and scroll clamping derived from `worldBounds` and viewport size.

- [ ] **Step 5: Run tests and add CameraRig to `v2.html` + CI**

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add raishin-legacy/src/systems/CameraRig.js raishin-legacy/v2.html tests/raishin-v2-professional-movement.test.js tests/raishin-v2-camera-rig.test.js .github/workflows/raishin-v2-test.yml
git commit -m "feat(raishin): add real scrolling camera rig"
```

### Task 5: Compose a layered, scrolling Inazuma scene instead of one screen-sized screenshot

**Files:**
- Modify: `raishin-legacy/src/scenes/DojoScene.js`
- Modify: `raishin-legacy/v2-game.js`
- Modify: `raishin-legacy/v2.html`
- Modify: `tests/raishin-v2-scene-contract.test.js`
- Create: `tests/raishin-v2-open-world-scene.test.js`
- Modify: `.github/workflows/raishin-v2-test.yml`

**Interfaces:**
- `DojoScene.createDojoScene(Phaser,deps)` consumes `WorldModel`, `WorldPlane`, `CollisionMap`, `PlayerController`, `PlayerAnimator`, `PlayerView`, `CameraRig`, `DepthSystem`, `InteractionSystem`, `RaikaAnimationData`, and `DojoLayout`.
- Scene update order stays: input → player world simulation → projection → animation → view/depth → interaction projection → camera.

- [ ] **Step 1: Rewrite the scene contract before implementation**

Require `WorldModel`, `CameraRig`, and `DepthSystem`; remove the obsolete assertion that the camera must remain static; forbid legacy adapters and forbid two full-screen duplicate `dojo-bg` images as the world representation.

- [ ] **Step 2: Add a failing open-world scene source contract**

Assert that scene setup creates separate environment groups/layers, configures Phaser camera bounds/zoom from the world model, uses world render objects with ground anchors, creates Raika + shadow at the projected spawn, and keeps canonical sprite sheet/frame metadata.

- [ ] **Step 3: Run the scene tests and confirm failure**

Run: `node tests/raishin-v2-scene-contract.test.js && node tests/raishin-v2-open-world-scene.test.js`
Expected: FAIL because current scene still draws the same 1600×900 background twice and scrolls only a few pixels.

- [ ] **Step 4: Build the minimal layered dojo**

Use the approved dojo art as source material where helpful, but instantiate rear/background, floor, rear props, dynamic player/props, and foreground architectural layers as separate Phaser objects/groups. Temporary geometry/masks are acceptable for this checkpoint; a single moving screenshot is not.

- [ ] **Step 5: Calibrate hero size and perspective**

Use one `heroScale`/base-height calibration so Raika at spawn occupies 28–36% of 900px viewport height. Do not add per-direction scales or pixel lowering. Shadow remains centered on projected Ground Point.

- [ ] **Step 6: Wire camera and depth**

Set Phaser scroll/zoom from `CameraRig`; update Raika and world props through `DepthSystem`; verify at least one prop can sort both in front of and behind Raika based on planted world Y.

- [ ] **Step 7: Run scene tests and add new test to CI**

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add raishin-legacy/src/scenes/DojoScene.js raishin-legacy/v2-game.js raishin-legacy/v2.html tests/raishin-v2-scene-contract.test.js tests/raishin-v2-open-world-scene.test.js .github/workflows/raishin-v2-test.yml
git commit -m "feat(raishin): compose scrolling layered Inazuma scene"
```

### Task 6: Preserve world-space interactions and create the visual-acceptance build

**Files:**
- Modify: `raishin-legacy/src/systems/InteractionSystem.js` only if needed to separate gameplay lookup from prompt render projection
- Modify: `tests/raishin-v2-world-systems.test.js`
- Create: `tests/raishin-v2-world-core-integration.test.js`
- Modify: `tests/raishin-v2-shell.test.js`
- Modify: `.github/workflows/raishin-v2-test.yml`

**Interfaces:**
- `InteractionSystem.nearest(worldPoint,maxDistance)` remains independent of camera scroll/zoom.
- `InteractionSystem.projectPrompt(item)` returns the world projection; screen placement is camera/render responsibility.

- [ ] **Step 1: Write integration assertions before final calibration**

Simulate world-space traversal in all four directions; require collision-safe position, monotonic perspective scale, invariant ground point, depth crossing relative to a prop, and camera scroll large enough to prove the world is not one screen.

- [ ] **Step 2: Add interaction camera-independence assertions**

For identical player/item world coordinates, nearest interaction result must be unchanged across arbitrary camera scroll/zoom snapshots.

- [ ] **Step 3: Keep the shell migration guard**

`tests/raishin-v2-shell.test.js` must continue asserting that `/raishin-legacy/index.html` stays Legacy until the user visually accepts v2; only `/raishin-legacy/v2.html` receives this milestone.

- [ ] **Step 4: Run the focused v2 suite**

Run all v2 tests in the workflow matrix plus the newly added tests. Expected: PASS with no changes required to Legacy rendering tests.

- [ ] **Step 5: Run browser/Chromium smoke if the repository runner supports it**

Verify: v2 loads; Raika is visibly ~28–36% of viewport height at spawn; WASD/arrows traverse enough distance to scroll the dojo; no empty area is exposed; feet remain planted in four directions; collision stops at solids/boundaries; at least one occluder changes front/back ordering.

- [ ] **Step 6: Commit the acceptance checkpoint**

```bash
git add raishin-legacy/src/systems/InteractionSystem.js tests/raishin-v2-world-systems.test.js tests/raishin-v2-world-core-integration.test.js tests/raishin-v2-shell.test.js .github/workflows/raishin-v2-test.yml
git commit -m "test(raishin): lock v2 world-core acceptance checkpoint"
```

### Task 7: Verify exact commit and deploy only the v2 preview

**Files:**
- No planned product-code changes unless verification exposes a defect.

**Interfaces:**
- Public acceptance URL remains `/raishin-legacy/v2.html`.
- `/raishin-legacy/index.html` remains Legacy until explicit visual approval.

- [ ] **Step 1: Run every Raishin v2 CI test on the exact head commit**

Expected: all v2 jobs succeed.

- [ ] **Step 2: Verify GitHub Pages deployment for the exact same SHA**

Expected: Pages deployment conclusion `success` for that SHA.

- [ ] **Step 3: Open the cache-busted public v2 URL and perform final smoke**

Expected: the loaded build visibly scrolls through a world larger than one viewport and no longer looks like Raika moving over a single static stage.

- [ ] **Step 4: Stop for visual acceptance**

Ask only these acceptance questions: Is Raika correctly sized relative to the dojo? Do her feet feel physically planted in every direction? Does the camera/world now feel like a game space rather than a static image? Do not migrate the public index route before approval.
