# Libi Professional Home — Milestone A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in true-3D playable graybox of Libi’s canonical living room with professional third-person movement, camera orbit/collision, world-space characters, and stable furniture collision, while keeping the current v0.44 cinematic renderer as the default fallback.

**Architecture:** Add a second renderer behind `?renderer=3d` rather than replacing the live cinematic path. Keep `world.js`, `movement.js`, `camera.js`, Dad/gameplay state, and scenario data authoritative; the new `scene-3d.js` consumes the same world coordinates and renders them with a `PerspectiveCamera` and real world-space geometry. `game.js` selects the renderer and uses a shared scene contract so gameplay code does not fork into two separate games.

**Tech Stack:** Browser JavaScript ES modules, Three.js `0.180.0`, Node `node:test`, Playwright browser smoke tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-14-libi-professional-home-design.md`

## Global Constraints

- The current v0.44 cinematic renderer remains the default during Milestone A; true 3D is opt-in with `?renderer=3d`.
- Libi must continue using `assets/libi-sprites-v025.png`; Dad must continue using `assets/crazy-family/dad-sprites-v028.png`.
- Do not redesign Dad abilities, song/exposure rules, lives, stamina, item inventory, or scenario spawning in this milestone.
- The authoritative gameplay coordinate system remains the existing `x/y/z` living-room world from `crazy-family/world.js`.
- Perspective in 3D mode comes from `THREE.PerspectiveCamera`; do not reuse `cinematic-projection.js` for world3d actors or props.
- Character collision remains capsule-style gameplay collision independent from visual meshes.
- Smooth input/camera movement takes priority over decorative effects.
- No new production dependency is required for Milestone A.
- The default cinematic browser smoke test must continue passing unchanged.

## Review Focus

- Unknown or malformed renderer query values must fall back to cinematic mode, never a blank game.
- Camera collision near walls/furniture must never produce NaN positions or place the camera inside a blocker.
- Diagonal movement into furniture corners must not tunnel through the sofa, coffee table, side table, or room bounds.
- Zero input and very small/large frame deltas must keep heading/camera state finite and stable.
- Resize from desktop to narrow mobile aspect ratios must preserve a valid perspective projection and a visible player.

---

### Task 1: Safe renderer-mode gate

**Files:**
- Create: `crazy-family/renderer-mode.js`
- Create: `tests/crazy-family/renderer-mode.test.mjs`

**Interfaces:**
- Produces: `resolveRendererMode(search = '') -> 'cinematic' | 'world3d'`
- Rule: only `renderer=3d` returns `world3d`; all other values return `cinematic`.

- [ ] **Step 1: Write the failing renderer-mode tests**

Add tests named:
- `renderer=3d opts into world3d`
- `missing renderer stays cinematic`
- `unknown renderer value stays cinematic`

Assert exact return values from `resolveRendererMode()`.

- [ ] **Step 2: Run the test to verify RED**

Run: `node --test tests/crazy-family/renderer-mode.test.mjs`
Expected: FAIL because `crazy-family/renderer-mode.js` does not exist.

- [ ] **Step 3: Implement the minimal renderer resolver**

Create `resolveRendererMode(search = '')` using `URLSearchParams`. Do not inspect browser globals inside the function; callers pass `location.search`.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `node --test tests/crazy-family/renderer-mode.test.mjs`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/renderer-mode.js tests/crazy-family/renderer-mode.test.mjs
git commit -m "feat: add Crazy Family renderer mode gate"
```

### Task 2: Make the living-room world usable by a real 3D camera

**Files:**
- Modify: `crazy-family/world.js`
- Modify: `tests/crazy-family/world.test.mjs`

**Interfaces:**
- Existing: `createLivingRoomWorld()` remains the public factory.
- Produces on returned world: `roomShell`, `cameraBlockers`, `renderables`.
- Modify: `traceCameraSegment(start, end, blockers = cameraBlockers, padding = 0.12)`; preserve existing call compatibility.

- [ ] **Step 1: Write failing world-shell and collision tests**

Add tests that assert:
- `world.roomShell` includes four room-edge wall blockers with finite `x/y/z/width/depth/height`.
- `world.renderables` includes the existing sofa, coffee table, rug, side table, doorway and room shell.
- `traceCameraSegment()` detects the nearest wall when tracing from room center through a room boundary.
- a larger `padding` produces a collision fraction no later than the default padding.
- `resolveCharacterMove()` keeps a capsule inside room bounds and outside the sofa when approaching diagonally.

- [ ] **Step 2: Run the world test to verify RED**

Run: `node --test tests/crazy-family/world.test.mjs`
Expected: FAIL on missing `roomShell`/`renderables` or new padding behavior.

- [ ] **Step 3: Extend `createLivingRoomWorld()` without changing canonical furniture positions**

Create thin wall/camera blockers from `ROOM_BOUNDS` with wall height `3.2` and wall thickness `0.18`. Keep gameplay furniture coordinates unchanged. `renderables` is the stable list used by the graybox renderer; it must not include duplicate IDs.

Update `traceCameraSegment()` to use the caller-supplied padding while preserving its existing nearest-hit return shape `{ id, fraction, point }`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/crazy-family/world.test.mjs tests/crazy-family/attacks.test.mjs`
Expected: all tests PASS; attack collision behavior remains intact.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/world.js tests/crazy-family/world.test.mjs
git commit -m "feat: add 3d room shell collision contract"
```

### Task 3: Add professional locomotion state and smooth heading

**Files:**
- Modify: `crazy-family/movement.js`
- Modify: `tests/crazy-family/movement.test.mjs`

**Interfaces:**
- Extend `createCharacterState(...)` with state fields `heading`, `turnRate`, and `locomotionState` while keeping all current arguments valid.
- Extend: `stepCharacter(state, intent, dt, world, options = {})`.
- `options`: `{ crouching?: boolean, sprinting?: boolean }`.
- `locomotionState` values for Milestone A: `idle`, `walk`, `run`, `sprint`, `crouch`, `airborne`, `landing`.

- [ ] **Step 1: Write failing locomotion tests**

Add tests that assert:
- a 90° input change rotates `heading` toward the new travel direction but not instantly.
- heading remains finite when input is zero.
- `locomotionState` becomes `idle` at rest, `run` while moving, `sprint` with `{sprinting:true}`, `crouch` with `{crouching:true}`, and `airborne` after `jumpCharacter()`.
- the existing acceleration/braking, gravity, jump, and blocker tests still pass.

- [ ] **Step 2: Run movement tests to verify RED**

Run: `node --test tests/crazy-family/movement.test.mjs`
Expected: FAIL on missing heading/locomotion fields.

- [ ] **Step 3: Implement smooth heading and state derivation**

Use shortest-angle interpolation capped by `turnRate * dt`. Default `turnRate` is `8.5` radians/second. Do not rotate velocity to follow heading; velocity remains the authoritative movement vector for Milestone A.

- [ ] **Step 4: Run movement tests to verify GREEN**

Run: `node --test tests/crazy-family/movement.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/movement.js tests/crazy-family/movement.test.mjs
git commit -m "feat: add smooth Libi locomotion state"
```

### Task 4: Upgrade the camera to a real orbiting third-person rig

**Files:**
- Modify: `crazy-family/camera.js`
- Modify: `tests/crazy-family/camera.test.mjs`

**Interfaces:**
- Keep: `createCameraController(config = {})`.
- Add: `orbitCamera(controller, { yawDelta = 0, pitchDelta = 0 }) -> controller`.
- Extend: `stepCamera(controller, { player, dad = null, world, mode = 'explore', dt = 0.016, visualEnvelope = null, speed = 0 })`.
- In `world3d` usage, do not pass `visualEnvelope`; the camera is constrained by collision, not cinematic frame bounds.

- [ ] **Step 1: Write failing camera-rig tests**

Add tests that assert:
- `orbitCamera()` changes yaw and clamps pitch between `-0.55` and `0.32` radians.
- explore camera position changes around the player after a yaw orbit while target height remains stable.
- higher `speed` increases desired follow distance within configured limits.
- a blocker hit shortens camera distance but keeps camera farther than `0.45` from the target.
- repeated small `dt` steps converge smoothly rather than teleporting.
- camera position/target/fov remain finite with `dt=0`.

- [ ] **Step 2: Run camera tests to verify RED**

Run: `node --test tests/crazy-family/camera.test.mjs`
Expected: FAIL on missing orbit API/new speed behavior.

- [ ] **Step 3: Implement orbit + perspective-friendly follow math**

Store `yaw` and `pitch` on the controller. Build desired camera position from target + spherical/orbit offset; retain named camera modes (`explore`, `chase`, `interaction`, `cinematic`) and existing damping. Use `world.traceCameraSegment(target, desired, world.cameraBlockers, config.collisionRadius)` for collision. Set default `collisionRadius` to `0.22`.

- [ ] **Step 4: Run camera tests to verify GREEN**

Run: `node --test tests/crazy-family/camera.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/camera.js tests/crazy-family/camera.test.mjs
git commit -m "feat: add professional third-person camera rig"
```

### Task 5: Build the true-3D graybox scene

**Files:**
- Create: `crazy-family/scene-3d.js`
- Modify: `crazy-family/scene.js`
- Create: `tests/crazy-family/scene-3d.test.mjs`

**Interfaces:**
- Add cinematic alias in `scene.js`: `renderPosition(position) -> projected cinematic position`.
- Create: `createLivingRoom3DScene({ canvas, world }) -> Promise<SceneHandle>`.
- `SceneHandle` shared fields/methods used by `game.js`: `scene`, `renderer`, `camera`, `objectsById`, `contactEffects`, `screenStage`, `visualMode`, `renderPosition`, `render()`, `resize(width,height)`, `applyCameraPose(pose, shake?, now?)`, `setObjectOpacity(id,value)`, `applyReactiveTransforms(controller)`, `dispose()`.
- For 3D mode: `screenStage=false`, `visualMode='world3d'`, `renderPosition(position)` returns an unprojected `{x,y,z}` copy.
- Export pure helper: `buildGrayboxDescriptors(world) -> descriptor[]` for unit testing without WebGL.

- [ ] **Step 1: Write failing graybox scene-contract tests**

Test `buildGrayboxDescriptors(world)` and source contract to assert:
- descriptors include floor, four room walls, sofa, coffee table, rug, side table and doorway.
- every descriptor has finite world-space position and dimensions.
- `scene-3d.js` declares a `THREE.PerspectiveCamera` and never imports `cinematic-projection.js`.
- `scene.js` exposes `renderPosition` for the cinematic path.

- [ ] **Step 2: Run scene tests to verify RED**

Run: `node --test tests/crazy-family/scene-3d.test.mjs`
Expected: FAIL because `scene-3d.js` does not exist and `scene.js` lacks the alias.

- [ ] **Step 3: Implement the graybox renderer**

Use a `THREE.PerspectiveCamera(50, aspect, 0.08, 60)`. Render the room shell and furniture with simple warm neutral `MeshStandardMaterial` values, with real world `x/y/z` coordinates. Floor and large furniture receive shadows; Libi/Dad/props can cast shadows. Use one hemisphere light plus one shadow-casting key directional light; no decorative lighting system in Milestone A.

`resize()` updates `camera.aspect` and `camera.updateProjectionMatrix()`. `applyCameraPose()` copies pose position, calls `camera.lookAt(target.x,target.y,target.z)`, and applies pose FOV.

- [ ] **Step 4: Run scene tests and cinematic regression tests**

Run: `node --test tests/crazy-family/scene-3d.test.mjs tests/crazy-family/cinematic-projection.test.mjs tests/crazy-family/cinematic-set.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/scene-3d.js crazy-family/scene.js tests/crazy-family/scene-3d.test.mjs
git commit -m "feat: add true 3d living room graybox renderer"
```

### Task 6: Wire world3d into the existing game without forking gameplay

**Files:**
- Modify: `crazy-family/game.js`
- Modify: `crazy-family/input.js`
- Modify: `tests/crazy-family/movement.test.mjs`
- Create: `tests/crazy-family/world3d-game-contract.test.mjs`

**Interfaces:**
- `game.js` imports `resolveRendererMode`, `createLivingRoom3DScene`, and `orbitCamera`.
- Scene choice: `world3d` uses `createLivingRoom3DScene`; `cinematic` uses existing `createLivingRoomScene`.
- Add input helper: `cameraLookDelta({dx,dy}, sensitivity = {yaw:0.004,pitch:0.003}) -> {yawDelta,pitchDelta}`.
- In world3d actor presentation, character mesh position uses logical world position directly, visual scale remains `1`, and `visual.faceCamera(sceneHandle.camera.position)` is called after camera pose is applied.
- Cinematic mode retains projection/scaling behavior.

- [ ] **Step 1: Write failing input and game-contract tests**

Add tests that assert:
- `cameraLookDelta({dx:10,dy:-5})` returns finite deltas with the exact default sensitivities.
- `game.js` resolves renderer mode instead of hard-coding `visualMode:'cinematic'`.
- world3d character presentation does not call `projectWorldToCinematicStage` or apply cinematic scale.
- attack visual system receives `screenStage: sceneHandle.screenStage` and `projectPosition: sceneHandle.renderPosition`.
- default cinematic imports/path remain present.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `node --test tests/crazy-family/movement.test.mjs tests/crazy-family/world3d-game-contract.test.mjs`
Expected: FAIL on missing look helper/world3d integration.

- [ ] **Step 3: Implement renderer selection and pointer-look input**

On `pointerdown` inside the game canvas in world3d mode, capture the pointer. While captured, convert `movementX/movementY` through `cameraLookDelta()` and call `orbitCamera()`. Release on pointer up/cancel. Do not enable pointer-look behavior in cinematic mode.

Pass `{ crouching, sprinting }` into `stepCharacter()`, pass `speed: playerSpeed` into `stepCamera()`, and keep existing Dad/song/stamina/interaction systems running from the same logical world state.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `node --test tests/crazy-family/movement.test.mjs tests/crazy-family/camera.test.mjs tests/crazy-family/world3d-game-contract.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/game.js crazy-family/input.js tests/crazy-family/movement.test.mjs tests/crazy-family/world3d-game-contract.test.mjs
git commit -m "feat: wire Crazy Family world3d gameplay mode"
```

### Task 7: Browser acceptance for the playable graybox

**Files:**
- Create: `tests/crazy-family/browser-world3d-smoke.mjs`
- Modify only if required by the test: `crazy-family/game.js`, `crazy-family/scene-3d.js`, `crazy-family/camera.js`, `crazy-family/world.js`

**Interfaces:**
- Runtime test hook remains `globalThis.__crazyFamilyMovieSetGame`.
- Preview URL contract: `crazy-family.html?renderer=3d&cinematic-seed=1`.

- [ ] **Step 1: Write the failing browser smoke test**

Start from the existing `browser-smoke.mjs` harness and assert in world3d mode:
- `game.scene.visualMode === 'world3d'`.
- `game.scene.screenStage === false`.
- `game.scene.camera.isPerspectiveCamera === true`.
- the room contains floor/walls/sofa/coffee-table meshes at finite world coordinates.
- Libi moves in at least two camera-relative directions and remains inside room bounds.
- dragging the canvas changes camera position around Libi.
- moving Libi near a wall causes the camera to pull inward instead of crossing the wall.
- Libi can complete a scripted route around the sofa/coffee table without entering either collider.
- the canonical Libi and Dad approved asset URLs remain unchanged.
- no fatal page errors occur and the WebGL context remains valid.

- [ ] **Step 2: Run the world3d smoke test to verify RED**

Run setup server: `python -m http.server 8000`
Run test: `node tests/crazy-family/browser-world3d-smoke.mjs`
Expected: FAIL until the integrated 3D scene satisfies the runtime assertions.

- [ ] **Step 3: Make only the minimal integration corrections required by the smoke test**

Do not add Milestone B art polish, Dad navmesh work, new interactions, or reactive props here. Fix only graybox movement/camera/rendering correctness.

- [ ] **Step 4: Run both browser modes**

Run: `node tests/crazy-family/browser-world3d-smoke.mjs`
Expected: PASS.

Run: `node tests/crazy-family/browser-smoke.mjs`
Expected: PASS; default cinematic behavior is preserved.

- [ ] **Step 5: Run the Crazy Family unit suite**

Run: `node --test tests/crazy-family/*.test.mjs`
Expected: 0 failures.

- [ ] **Step 6: Commit Milestone A acceptance**

```bash
git add tests/crazy-family/browser-world3d-smoke.mjs crazy-family
git commit -m "test: verify playable Libi 3d graybox milestone"
```

## Milestone A Completion Gate

Milestone A is complete only when all of the following are demonstrated in `?renderer=3d` while the default page remains cinematic:

- Libi is rendered at her real world position inside a perspective room.
- Forward/back movement visibly travels through 3D depth with no cinematic projection scaling.
- The player can route around the sofa and coffee table without clipping.
- Camera orbit is controllable, smooth, and collision-safe near walls/furniture.
- Libi remains grounded by world collision and her approved visual identity is unchanged.
- Existing Dad/gameplay state still runs from the same world simulation.
- `browser-world3d-smoke.mjs`, existing `browser-smoke.mjs`, and `node --test tests/crazy-family/*.test.mjs` all pass.

## Deferred to Later Milestones

Milestone A deliberately does not include final room materials/models, Dad navigation/pathfinding upgrade, sofa climb animation, reactive props polish, spatial-audio overhaul, or switching world3d to the default renderer. Those belong to Milestones B–E from the approved design spec.
