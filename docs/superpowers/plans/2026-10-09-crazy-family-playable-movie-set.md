# Crazy Family Playable Movie Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the living-room slice of `crazy-family.html` with a real Three.js playable movie set where Libi and Dad move, collide, hide, chase, jump, interact, and cast shadows inside the same 3D family-home space while preserving the existing game systems and approved character designs.

**Architecture:** Keep the existing route and UI, add an ES-module Three.js runtime for the ground-floor living-room vertical slice, and retain the old 2D runtime behind an explicit `?legacy=1` escape hatch until the 3D slice passes regression and acceptance checks. Pure movement, navigation, interaction, and camera-policy logic lives in dependency-free modules tested with Node; Three.js rendering lives in browser-only modules; existing lives/stamina/shield/dizziness/audio/inventory/Dad systems are reached through a narrow legacy adapter instead of being reimplemented all at once.

**Tech Stack:** Static HTML/CSS/JavaScript, ES modules, Three.js via a pinned import map (`three@0.180.0`), browser WebGL, Node built-in test runner (`node --test`), existing Python regression scripts, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-09-crazy-family-playable-movie-set-design.md`

## Global Constraints

- Keep the game on the existing `crazy-family.html` route.
- The new living-room slice uses real 3D world coordinates: X = lateral, Z = room depth, Y = vertical jump/height.
- Camera is automatic third-person 3/4; no manual camera control in this slice.
- Libi’s approved visual design must not be redesigned or automatically replaced.
- Dad’s approved visual design must not be redesigned or automatically replaced.
- Until separately approved 3D character models exist, use the existing approved Libi/Dad art only as temporary camera-facing 3D cards/billboards.
- Preserve existing lives, stamina, shield, dizziness, Dad voice/song logic, inventory, Dad attack definitions, and canonical story behavior.
- Do not silently fall back to the floating 2D implementation when WebGL is unavailable; show an explicit unsupported-browser message.
- Keep `?legacy=1` as an explicit rollback path during this migration.
- First release scope is one living-room vertical slice only; do not rebuild the full house.

## Review Focus

1. **Diagonal movement input:** normalized movement must not be faster than cardinal movement; covered in Task 2 movement tests.
2. **Camera trapped by walls/large furniture:** camera must shorten its boom or reframe rather than clip through geometry; covered in Task 4 camera-policy tests.
3. **WebGL/Three.js startup failure:** page must show a clear unsupported/startup message and must not silently launch legacy mode; covered in Task 1 bootstrap tests.
4. **Autoplay/audio rejection:** gameplay must continue when browser audio playback rejects; covered in Task 7 audio-adapter tests.
5. **Foreground obstruction:** only the blocking object may fade; characters must not become visible through unrelated walls; covered in Task 4 occlusion tests.

---

## File Structure

Create the following focused runtime files:

```text
crazy-family.html
crazy-family/
  bootstrap.js
  game.js
  legacy-adapter.js
  input.js
  movement.js
  world.js
  scene.js
  characters.js
  camera.js
  interaction.js
  navigation.js
  dad.js
  attacks.js
  audio.js
  reactive-props.js

tests/crazy-family/
  bootstrap.test.mjs
  movement.test.mjs
  camera.test.mjs
  interaction.test.mjs
  navigation.test.mjs
  dad.test.mjs
  attacks.test.mjs
  audio.test.mjs

scripts/
  test-crazy-family-movie-set.py

.github/workflows/
  crazy-family-movie-set-test.yml
```

Responsibilities:
- `bootstrap.js`: mode selection, WebGL/startup failure handling, launch the new runtime.
- `game.js`: frame loop and wiring only.
- `legacy-adapter.js`: narrow bridge to retained state/actions from the existing game.
- `input.js`: browser input to camera-relative intent.
- `movement.js`: dependency-free character movement/jump state.
- `world.js`: semantic room data, colliders, interactables, surfaces, nav blockers.
- `scene.js`: Three.js renderer, room meshes, lights, floor, shadows.
- `characters.js`: temporary approved-art billboards and future model swap boundary.
- `camera.js`: automatic 3/4 modes, collision-safe boom, occlusion fade policy.
- `interaction.js`: nearest valid contextual action resolver.
- `navigation.js`: dependency-free A* grid/path helpers.
- `dad.js`: Dad state machine and heavy chase motion.
- `attacks.js`: convert retained Dad attacks to world-space attack entities.
- `audio.js`: spatial volume/pan/muffling adapter around existing clips.
- `reactive-props.js`: authored toy/cushion/paper/curtain reactions.

---

### Task 1: Add the 3D runtime shell and regression-safe mode switch

**Files:**
- Modify: `crazy-family.html`
- Create: `crazy-family/bootstrap.js`
- Create: `crazy-family/game.js`
- Create: `crazy-family/legacy-adapter.js`
- Create: `scripts/test-crazy-family-movie-set.py`
- Create: `tests/crazy-family/bootstrap.test.mjs`
- Create: `.github/workflows/crazy-family-movie-set-test.yml`

**Interfaces:**
- Produces: `bootCrazyFamily({ root, legacyAdapter }) -> Promise<GameHandle>`, `shouldUseLegacy(search) -> boolean`, `createLegacyAdapter(windowRef) -> LegacyAdapter`.
- `LegacyAdapter` must expose `getSnapshot()`, `setWorldPose({player,dad})`, `collectItem(id)`, `useItem(id)`, `damagePlayer(amount,source)`, `setDadWorldDistance(distance)`, and `tickRetainedSystems(dt)`.

- [ ] **Step 1: Write failing bootstrap/static tests**

Add assertions that:
- `crazy-family.html` contains an import map pinning `three` to `https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js`.
- the new runtime is the default ground-floor path and `?legacy=1` is the only explicit legacy opt-in.
- `bootstrap.js` exports `shouldUseLegacy` and `bootCrazyFamily`.
- startup failure renders a visible message containing `WebGL` and does not call the legacy launcher automatically.
- the approved asset strings `assets/libi-sprites-v025.png` and `assets/crazy-family/dad-sprites-v028.png` remain present.

- [ ] **Step 2: Run tests to verify RED**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
node --test tests/crazy-family/bootstrap.test.mjs
```
Expected: FAIL because the modular runtime/import map does not exist yet.

- [ ] **Step 3: Implement the minimum runtime shell and adapter boundary**

Modify `crazy-family.html` so the existing HUD/controls remain, the ground-floor stage can host the new renderer, and an explicit `?legacy=1` keeps the old implementation available during migration. Add the pinned import map and module bootstrap. Do not delete existing retained systems yet.

Implement:
```js
export function shouldUseLegacy(search) -> boolean
export async function bootCrazyFamily({ root, legacyAdapter }) -> GameHandle
export function renderUnsupported(root, error) -> void
```

Expose only the listed `LegacyAdapter` methods from the old runtime; do not leak the whole monolith.

- [ ] **Step 4: Run bootstrap and existing regressions**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
node --test tests/crazy-family/bootstrap.test.mjs
python scripts/test-crazy-family-v028.py
python scripts/test-crazy-family-v030.py
python scripts/test-crazy-family-v031.py
python scripts/test-crazy-family-v032-ground-contact.py
python scripts/test-crazy-family-v034.py
```
Expected: all relevant Crazy Family tests PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family.html crazy-family/ scripts/test-crazy-family-movie-set.py tests/crazy-family/bootstrap.test.mjs .github/workflows/crazy-family-movie-set-test.yml
git commit -m "feat: add crazy family 3d runtime shell"
```

---

### Task 2: Implement camera-relative 360° character movement and jumping

**Files:**
- Create: `crazy-family/input.js`
- Create: `crazy-family/movement.js`
- Create: `tests/crazy-family/movement.test.mjs`
- Modify: `crazy-family/game.js`

**Interfaces:**
- Consumes: `LegacyAdapter.getSnapshot()` from Task 1.
- Produces:
```js
createCharacterState({ position, maxSpeed, acceleration, braking, radius, height }) -> CharacterState
cameraRelativeIntent(input, cameraForward, cameraRight) -> {x,z}
stepCharacter(state, intent, dt, world) -> CharacterState
jumpCharacter(state, impulse) -> CharacterState
```
- `CharacterState.position` is `{x,y,z}`; `velocity` is `{x,y,z}`; `grounded` is boolean.
- `world.resolveCharacterMove(from, to, capsule)` and `world.groundHeightAt(x,z)` are the only world dependencies.

- [ ] **Step 1: Write failing movement tests**

Test that:
- cardinal and diagonal input have equal maximum magnitude,
- movement is relative to camera forward/right,
- acceleration and braking are gradual,
- gravity returns the character to `groundHeightAt`,
- jump changes world Y only and does not alter floor height,
- a collision response from `world.resolveCharacterMove` prevents crossing a blocker.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
node --test tests/crazy-family/movement.test.mjs
```
Expected: FAIL with missing movement exports.

- [ ] **Step 3: Implement movement/input modules**

Use dependency-free vector math so Node can test the controller without Three.js. Set Libi defaults to responsive/agile values and keep Dad values out of this module.

- [ ] **Step 4: Integrate into `game.js` and verify GREEN**

Run:
```bash
node --test tests/crazy-family/movement.test.mjs
python scripts/test-crazy-family-movie-set.py
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/input.js crazy-family/movement.js crazy-family/game.js tests/crazy-family/movement.test.mjs
git commit -m "feat: add 3d character movement controller"
```

---

### Task 3: Build the living-room world, colliders, lighting, and shared grounding

**Files:**
- Create: `crazy-family/world.js`
- Create: `crazy-family/scene.js`
- Create: `crazy-family/characters.js`
- Modify: `crazy-family/game.js`
- Modify: `scripts/test-crazy-family-movie-set.py`

**Interfaces:**
- Produces:
```js
createLivingRoomWorld() -> WorldModel
createLivingRoomScene({ canvas, world }) -> SceneHandle
createCharacterVisual({ scene, kind, approvedAssetUrl }) -> CharacterVisual
```
- `WorldModel` exposes `groundHeightAt(x,z)`, `resolveCharacterMove(from,to,capsule)`, `colliders`, `interactables`, `surfaces`, `navBlockers`.
- `SceneHandle` exposes `render(camera)`, `resize(width,height)`, `setObjectOpacity(id,value)`, `dispose()`.
- `CharacterVisual` exposes `setPose({position,facing,jumpHeight,state})`, `setVisible(boolean)`, `dispose()`.

- [ ] **Step 1: Extend failing structural tests**

Assert the living room includes semantic IDs for `floor`, `sofa`, `coffee-table`, `rug`, `toy-ball`, `doorway`, and `headphones`; lighting includes one warm directional/window source and one warm practical source; shadow mapping is enabled; characters use the existing approved asset URLs as temporary 3D cards rather than new generated designs.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
```
Expected: FAIL on missing world/scene markers.

- [ ] **Step 3: Implement world semantics and stylized Three.js scene**

Build only the living-room vertical slice with real floor geometry, sofa/table/rug/toys/doorway, simple family-home dressing, warm stylized materials, shared lights, real perspective, and cast/receive shadows. Use controlled authored geometry, not an uncontrolled rigid-body simulation.

Use the locked Libi and Dad art as temporary camera-facing 3D cards; do not generate or reinterpret their appearance.

- [ ] **Step 4: Verify code and regression tests**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
node --check crazy-family/world.js
node --check crazy-family/characters.js
```
For `scene.js`, verify syntax through the browser-module smoke check in the Python test because its bare `three` import is resolved by the browser import map.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/world.js crazy-family/scene.js crazy-family/characters.js crazy-family/game.js scripts/test-crazy-family-movie-set.py
git commit -m "feat: build 3d living room vertical slice"
```

---

### Task 4: Add automatic 3/4 cinematic camera, collision, and occlusion policy

**Files:**
- Create: `crazy-family/camera.js`
- Create: `tests/crazy-family/camera.test.mjs`
- Modify: `crazy-family/game.js`
- Modify: `crazy-family/scene.js`

**Interfaces:**
- Produces:
```js
createCameraController(config) -> CameraController
stepCamera(controller, { player, dad, world, mode, dt }) -> CameraPose
chooseOccluders({ camera, target, occluders }) -> string[]
```
- `mode` is one of `explore | chase | interaction | cinematic`.
- `CameraPose` is `{position:{x,y,z}, target:{x,y,z}, fov:number}`.

- [ ] **Step 1: Write failing camera tests**

Test that:
- explore camera remains above/behind Libi at a 3/4 angle,
- chase mode increases camera distance/FOV within fixed limits,
- a wall hit shortens the camera boom rather than crossing the wall,
- `chooseOccluders` returns only geometry intersecting the camera-to-Libi sight line,
- unrelated walls are never made transparent.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
node --test tests/crazy-family/camera.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement camera and occlusion**

Use spring-damped transitions, ray/segment tests against world camera blockers, and fade only selected foreground objects to `0.75` opacity while obstructing Libi. Restore opacity when clear.

- [ ] **Step 4: Verify GREEN**

Run:
```bash
node --test tests/crazy-family/camera.test.mjs
python scripts/test-crazy-family-movie-set.py
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/camera.js crazy-family/scene.js crazy-family/game.js tests/crazy-family/camera.test.mjs
git commit -m "feat: add cinematic third person camera"
```

---

### Task 5: Implement contextual interaction and natural headphones pickup

**Files:**
- Create: `crazy-family/interaction.js`
- Create: `tests/crazy-family/interaction.test.mjs`
- Modify: `crazy-family/world.js`
- Modify: `crazy-family/game.js`
- Modify: `crazy-family.html`

**Interfaces:**
- Produces:
```js
resolveInteraction({ player, interactables, maxDistance }) -> InteractionCandidate | null
executeInteraction(candidate, context) -> InteractionResult
```
- `InteractionCandidate` is `{id, action, label, distance, priority}`.
- Actions required in this slice: `take`, `climb`, `push`, `open`, `talk`.

- [ ] **Step 1: Write failing interaction tests**

Test that:
- only objects inside `maxDistance` are candidates,
- highest priority then nearest distance wins,
- headphones resolve to `take`,
- taking headphones calls `LegacyAdapter.collectItem('headphones')` once and disables the world object,
- a distant headphone object never appears as interactable.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
node --test tests/crazy-family/interaction.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement contextual action resolver and UI prompt**

Place headphones on the sofa arm/side surface defined in `world.js`; remove floating pickup behavior from the new 3D slice. Reuse the existing Action button/keyboard action rather than adding another gameplay button.

- [ ] **Step 4: Verify GREEN and inventory regression**

Run:
```bash
node --test tests/crazy-family/interaction.test.mjs
python scripts/test-crazy-family-movie-set.py
python scripts/test-crazy-family-v028.py
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/interaction.js crazy-family/world.js crazy-family/game.js crazy-family.html tests/crazy-family/interaction.test.mjs
git commit -m "feat: add contextual home interactions"
```

---

### Task 6: Give Dad real room navigation and weighted chase motion

**Files:**
- Create: `crazy-family/navigation.js`
- Create: `crazy-family/dad.js`
- Create: `tests/crazy-family/navigation.test.mjs`
- Create: `tests/crazy-family/dad.test.mjs`
- Modify: `crazy-family/game.js`
- Modify: `crazy-family/world.js`

**Interfaces:**
- Produces:
```js
buildNavigationGrid({ bounds, blockers, cellSize }) -> NavigationGrid
findPath(grid, start, goal, options) -> Array<{x,z}>
createDadController(config) -> DadController
stepDad(controller, { player, world, retainedState, dt, now }) -> DadFrame
```
- `DadFrame` includes `{position, velocity, facing, state, cameraModeHint}`.
- Libi-only gaps are marked with clearance metadata smaller than Dad’s radius.

- [ ] **Step 1: Write failing navigation/Dad tests**

Test that:
- A* routes around the sofa blocker,
- no path node crosses a blocker,
- a Libi-sized gap is rejected for Dad clearance,
- Dad acceleration/braking are slower than Libi defaults,
- `pant`, `yawn`, and `sneeze` pause or interrupt chase without deleting the current goal,
- re-path occurs after a blocked route.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
node --test tests/crazy-family/navigation.test.mjs tests/crazy-family/dad.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement navigation grid and Dad controller**

Use a small authored navigation grid derived from living-room blockers; YAGNI: do not add a third-party navmesh library for one room. Preserve existing Dad speech/song/pant/yawn/sneeze state decisions through `LegacyAdapter`; this controller owns spatial movement/pathing only.

- [ ] **Step 4: Verify GREEN**

Run:
```bash
node --test tests/crazy-family/navigation.test.mjs tests/crazy-family/dad.test.mjs
python scripts/test-crazy-family-movie-set.py
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/navigation.js crazy-family/dad.js crazy-family/world.js crazy-family/game.js tests/crazy-family/navigation.test.mjs tests/crazy-family/dad.test.mjs
git commit -m "feat: add dad room navigation"
```

---

### Task 7: Move Dad attacks and retained audio into 3D world space

**Files:**
- Create: `crazy-family/attacks.js`
- Create: `crazy-family/audio.js`
- Create: `tests/crazy-family/attacks.test.mjs`
- Create: `tests/crazy-family/audio.test.mjs`
- Modify: `crazy-family/game.js`
- Modify: `crazy-family/scene.js`
- Modify: `crazy-family/legacy-adapter.js`

**Interfaces:**
- Produces:
```js
createWorldAttack(definition, origin, forward, now) -> WorldAttack
stepWorldAttack(attack, dt, world) -> WorldAttack
attackHitsPlayer(attack, playerCapsule) -> boolean
createSpatialAudioAdapter({ retainedAudio }) -> SpatialAudioAdapter
```
- `SpatialAudioAdapter.update({ listener, dad, roomRelation }) -> void` and `safePlay(clip) -> Promise<boolean>`.

- [ ] **Step 1: Write failing attacks/audio tests**

Test that:
- low/high/mid attack definitions retain their canonical IDs/types from the adapter,
- attack origin is Dad’s world position and forward vector,
- jumping can clear low attacks when capsule height is above the attack volume,
- crouching can clear high attacks when capsule height is reduced,
- distance attenuates Dad audio,
- adjacent-room relation applies muffling,
- rejected `play()` promises resolve `safePlay` to `false` without throwing or stopping the frame loop.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
node --test tests/crazy-family/attacks.test.mjs tests/crazy-family/audio.test.mjs
```
Expected: FAIL.

- [ ] **Step 3: Implement world-space attacks and spatial audio adapter**

Render stylized attack meshes/effects in the Three scene but keep attack rules/data owned by retained canonical definitions. Use safe audio wrappers so autoplay restrictions are non-fatal.

- [ ] **Step 4: Verify GREEN and legacy audio definitions remain present**

Run:
```bash
node --test tests/crazy-family/attacks.test.mjs tests/crazy-family/audio.test.mjs
python scripts/test-crazy-family-movie-set.py
python scripts/test-crazy-family-v028.py
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/attacks.js crazy-family/audio.js crazy-family/game.js crazy-family/scene.js crazy-family/legacy-adapter.js tests/crazy-family/attacks.test.mjs tests/crazy-family/audio.test.mjs
git commit -m "feat: spatialize dad attacks and audio"
```

---

### Task 8: Add authored household reactions and surface feel

**Files:**
- Create: `crazy-family/reactive-props.js`
- Modify: `crazy-family/world.js`
- Modify: `crazy-family/scene.js`
- Modify: `crazy-family/audio.js`
- Modify: `crazy-family/game.js`
- Modify: `scripts/test-crazy-family-movie-set.py`

**Interfaces:**
- Produces:
```js
createReactivePropController(world) -> ReactivePropController
triggerRoomReaction(controller, event) -> void
stepRoomReactions(controller, dt) -> ReactivePropFrame[]
```
- Required event names: `toy-kick`, `sofa-compress`, `dad-pant-near-furniture`, `sneeze-small`, `sneeze-mega`.

- [ ] **Step 1: Extend failing structural tests**

Assert all five event names are defined and mapped to specific living-room object IDs; surface audio map contains `rug`, `wood`, `tile`, and `sofa` cues.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
```
Expected: FAIL on missing reaction/surface mappings.

- [ ] **Step 3: Implement restrained room reactions**

Use authored transforms/animations for toy movement, cushion compression, curtain/paper motion, and restrained camera shake. Do not convert the room into uncontrolled rigid-body physics.

- [ ] **Step 4: Verify GREEN**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
node --test tests/crazy-family/*.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/reactive-props.js crazy-family/world.js crazy-family/scene.js crazy-family/audio.js crazy-family/game.js scripts/test-crazy-family-movie-set.py
git commit -m "feat: add lived in room reactions"
```

---

### Task 9: Integrate the vertical slice, switch default play path, and run acceptance checks

**Files:**
- Modify: `crazy-family.html`
- Modify: `crazy-family/game.js`
- Modify: `scripts/test-crazy-family-movie-set.py`
- Modify: `.github/workflows/crazy-family-movie-set-test.yml`
- Create: `docs/superpowers/verification/crazy-family-movie-set-acceptance.md`

**Interfaces:**
- Consumes all prior tasks.
- Produces the default playable 3D living-room slice at `crazy-family.html`; `?legacy=1` remains explicit rollback only.

- [ ] **Step 1: Add failing end-to-end structural acceptance checks**

Require the default page to boot the movie-set runtime, preserve the existing HUD/action controls, keep `?legacy=1`, retain the approved character asset references, and include the new runtime modules without duplicate ground-floor 2D drawing on the default path.

- [ ] **Step 2: Run to verify RED**

Run:
```bash
python scripts/test-crazy-family-movie-set.py
```
Expected: FAIL until default-path integration is complete.

- [ ] **Step 3: Complete integration and remove default-path conflicts**

Ensure the new runtime owns ground-floor rendering, movement, camera, collision, Dad spatial movement, attacks, interaction, and room audio. The old 2D ground-floor implementation must run only under explicit legacy mode, so it cannot draw over or fight the 3D scene.

- [ ] **Step 4: Run the complete automated Crazy Family suite**

Run:
```bash
node --test tests/crazy-family/*.test.mjs
python scripts/test-crazy-family-movie-set.py
python scripts/test-crazy-family-v028.py
python scripts/test-crazy-family-v030.py
python scripts/test-crazy-family-v031.py
python scripts/test-crazy-family-v032-ground-contact.py
python scripts/test-crazy-family-v034.py
```
Expected: all Crazy Family tests PASS. Do not claim unrelated repository workflows are green.

- [ ] **Step 5: Perform browser acceptance on the GitHub Pages build**

Record pass/fail for all twelve spec acceptance criteria in `docs/superpowers/verification/crazy-family-movie-set-acceptance.md`, including:
- 360° movement,
- automatic 3/4 camera,
- shared floor/contact shadows,
- front/behind furniture occlusion,
- jump with floor-anchored shadow,
- Dad pathing around sofa/table,
- different routes for Libi and Dad,
- natural headphone placement and contextual pickup,
- shared room/character lighting,
- retained Dad voice/song/attack behavior,
- no unapproved character redesign,
- paused screenshot reads as a character physically inside the room.

If character billboards prevent the final visual criterion from passing, record that criterion as blocked by the separate approved-3D-character-model gate rather than silently changing Libi or Dad.

- [ ] **Step 6: Commit**

```bash
git add crazy-family.html crazy-family/game.js scripts/test-crazy-family-movie-set.py .github/workflows/crazy-family-movie-set-test.yml docs/superpowers/verification/crazy-family-movie-set-acceptance.md
git commit -m "feat: ship crazy family playable movie set slice"
```

---

## Self-Review Notes

- **Spec coverage:** All living-room slice requirements are assigned: 3D world/lighting in Task 3, movement/physics in Task 2, camera/occlusion in Task 4, contextual interactions/headphones in Task 5, Dad navigation/weight/states in Task 6, attacks/audio in Task 7, lived-in reactions/surface feel in Task 8, migration/regression/acceptance in Task 9.
- **Character-model approval constraint:** The plan intentionally does not generate new Libi or Dad models. Approved existing art is used as a temporary 3D card boundary. Final 3D model replacement remains a separate explicit visual-approval task, as required by the spec.
- **Type/interface consistency:** World coordinates use `{x,y,z}` everywhere; `WorldModel`, `LegacyAdapter`, `CameraPose`, `CharacterState`, `DadFrame`, and interaction contracts are defined once and consumed consistently by later tasks.
- **Risk containment:** The explicit `?legacy=1` path protects the existing game during migration without silently falling back when WebGL fails.
- **YAGNI:** No physics engine, navmesh library, bundler, or full-house rebuild is introduced for the first room. Three.js is the only new browser dependency.
