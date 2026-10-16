# Crazy Family True 3D Characters v0.47 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in `?renderer=3d` path that renders Libi and Dad as true volumetric 3D characters under a PerspectiveCamera while preserving the existing v0.46 gameplay systems and cinematic fallback.

**Architecture:** Keep the current gameplay loop authoritative and add a visual adapter boundary. The default `cinematic` renderer stays unchanged; `native3d` owns a world-space scene, perspective camera, and volumetric character handles that consume the same logical Libi/Dad positions directly. No gameplay rules are duplicated.

**Tech Stack:** Vanilla JavaScript ES modules, Three.js 0.180.0 via existing import map, Node assert-based tests already used in `tests/`.

**Spec:** `docs/superpowers/specs/2026-10-16-crazy-family-true-3d-characters-design.md`

## Global Constraints

- Default route remains the stable cinematic renderer during acceptance; only `?renderer=3d` selects native 3D.
- Existing v0.46 Libi contextual audio behavior must remain unchanged.
- Existing Dad AI, songs, attacks, stamina, damage, inventory, interactions, scenario spawning, and mobile controls remain authoritative.
- Native actors must not contain `THREE.PlaneGeometry`, billboards, camera-facing cards, or projected sprite geometry.
- Native actors consume logical world `x/y/z` directly and may not call `projectWorldToCinematicStage`.
- Native camera must be a `THREE.PerspectiveCamera`; cinematic mode may keep its existing orthographic screen-stage camera.
- Existing `characters.js`, `scene.js`, and `cinematic-projection.js` stay available until native 3D is visually accepted.
- v0.47 uses procedural low-poly volumetric proxies; final production sculpt/GLB replacement is outside this plan.

## Review Focus

- Unknown or malformed `renderer` query values must resolve to cinematic rather than breaking startup; covered in Task 1 selector tests.
- Native renderer startup failure after WebGL availability must fall back once to cinematic and must not leave an empty root; covered in Task 1 fallback tests.
- Zero/near-zero movement speed must keep the last facing without NaN rotations or jitter; covered in Task 2 transform tests.
- Resize with tiny/zero measured height must still produce a finite perspective aspect ratio and valid renderer size; covered in Task 3 resize tests.
- Switching to native 3D must not bypass retained v0.46 audio/gameplay calls in the frame loop; covered in Task 4 source-contract regression tests.

---

### Task 1: Renderer selection and safe bootstrap fallback

**Files:**
- Modify: `crazy-family/bootstrap.js`
- Create: `tests/crazy-family-v047-renderer-selection.test.mjs`

**Interfaces:**
- Produces: `resolveCrazyFamilyRenderer(search = '') -> 'cinematic' | 'native3d'`
- Produces: `bootCrazyFamily({ root, legacyAdapter })` selecting `game.js` for cinematic and `game-3d.js` for native3d, with native startup fallback to cinematic.

- [ ] **Step 1: Write failing selector and fallback tests**

Assert that empty search, `?renderer=cinematic`, and unknown values resolve to `cinematic`; `?renderer=3d` resolves to `native3d`. Assert bootstrap contains a native import path plus a guarded fallback to the existing cinematic `game.js` path without changing the WebGL unsupported behavior.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node tests/crazy-family-v047-renderer-selection.test.mjs`
Expected: FAIL because `resolveCrazyFamilyRenderer` and the native import/fallback path do not exist.

- [ ] **Step 3: Implement renderer resolution and fallback in `crazy-family/bootstrap.js`**

Keep `publishVersionLabel`, legacy/WebGL handling, and global game handle behavior. Native failure should clear/dispose any partial native handle if present, then instantiate the cinematic game once.

- [ ] **Step 4: Run the selector test and existing v0.44 test**

Run: `node tests/crazy-family-v047-renderer-selection.test.mjs && node tests/crazy-family-v044.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/bootstrap.js tests/crazy-family-v047-renderer-selection.test.mjs
git commit -m "feat(crazy-family): select native 3d renderer safely"
```

### Task 2: Volumetric Libi and Dad character module

**Files:**
- Create: `crazy-family/characters-3d.js`
- Create: `tests/crazy-family-v047-characters-3d.test.mjs`

**Interfaces:**
- Produces: `createCharacter3D({ scene, kind }) -> { root, setTransform, update, setVisible, dispose }`
- `setTransform({ position, facing, state, speed, grounded })` consumes logical world coordinates.
- `kind` accepts exactly `'libi'` or `'dad'`.

- [ ] **Step 1: Write failing character-structure tests**

Assert the returned `root` is a `THREE.Group`, all mesh geometries are volumetric and none have type `PlaneGeometry`, Dad's configured height/overall scale exceeds Libi's, and semantic child groups exist for torso/head/arms/legs/shoes. Assert Libi identity colors/accessories and Dad identity colors/silhouette cues are represented by named meshes/userData markers.

- [ ] **Step 2: Write failing transform/animation contract tests**

Assert `setTransform` writes root position directly from `{x,y,z}`, facing changes `rotation.y` without changing signed `scale.x`, zero-speed updates preserve a finite last facing, and `update(dt, now)` changes limb rotations for walk/run while keeping `idle` stable. Assert `jump`, `crouch`, `sing`, `pant`, `yawn`, and `sneeze` map to finite transforms.

- [ ] **Step 3: Run the character test and confirm RED**

Run: `node tests/crazy-family-v047-characters-3d.test.mjs`
Expected: FAIL because `characters-3d.js` does not exist.

- [ ] **Step 4: Implement `createCharacter3D` using only volumetric Three.js primitives**

Use a root `Group`, named articulated body groups, shared materials, cast-shadow meshes, character-specific proportions/colors, smooth Y-facing interpolation, and procedural limb/body animation. Do not import cinematic projection or sprite assets.

- [ ] **Step 5: Run the character test**

Run: `node tests/crazy-family-v047-characters-3d.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/characters-3d.js tests/crazy-family-v047-characters-3d.test.mjs
git commit -m "feat(crazy-family): add volumetric Libi and Dad"
```

### Task 3: Native 3D scene and perspective camera surface

**Files:**
- Create: `crazy-family/scene-3d.js`
- Create: `tests/crazy-family-v047-scene-3d.test.mjs`

**Interfaces:**
- Produces: `createLivingRoomScene3D({ canvas, world }) -> { scene, renderer, camera, characterLayer, resize, applyCameraPose, render, dispose }`
- `applyCameraPose({ position, target, fov })` writes true world-space camera pose.

- [ ] **Step 1: Write failing native-scene tests**

Assert scene creation uses `THREE.PerspectiveCamera`, has a horizontal floor receiving shadows, warm key plus ambient/hemisphere fill, and a dedicated `characterLayer`. Assert the source does not import `cinematic-projection.js` or create `OrthographicCamera`.

- [ ] **Step 2: Write failing resize/camera tests**

Assert resize clamps dimensions to at least 1 pixel, computes a finite positive aspect even for zero/tiny input height, updates the projection matrix, and `applyCameraPose` copies world-space position/target/fov without screen projection.

- [ ] **Step 3: Run the native-scene test and confirm RED**

Run: `node tests/crazy-family-v047-scene-3d.test.mjs`
Expected: FAIL because `scene-3d.js` does not exist.

- [ ] **Step 4: Implement `createLivingRoomScene3D`**

Use the existing renderer quality settings where sensible, a PerspectiveCamera, native lights/shadows, floor plus restrained simple room-envelope geometry only for grounding, and explicit resource disposal. Do not attempt final furniture reconstruction in this task.

- [ ] **Step 5: Run the native-scene test**

Run: `node tests/crazy-family-v047-scene-3d.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/scene-3d.js tests/crazy-family-v047-scene-3d.test.mjs
git commit -m "feat(crazy-family): add native perspective scene"
```

### Task 4: Native game-loop integration without gameplay forks

**Files:**
- Create: `crazy-family/game-3d.js`
- Modify: `crazy-family/camera.js`
- Create: `tests/crazy-family-v047-native-integration.test.mjs`

**Interfaces:**
- Consumes: `createCharacter3D`, `createLivingRoomScene3D`, existing `createLivingRoomWorld`, movement, Dad, attacks, interaction, audio, scenario, retained adapter interfaces.
- Produces: `createCrazyFamilyGame3D({ root, legacyAdapter })` with the same lifecycle shape used by bootstrap: `{ start, stop, dispose, ...diagnostic handles }`.
- Produces: existing `stepCamera(...)` behavior retained, with native world-space output usable directly by `scene-3d.js`.

- [ ] **Step 1: Write failing integration/source-contract tests**

Assert `game-3d.js` imports the existing gameplay modules rather than redefining movement/Dad/attack rules; creates Libi/Dad via `createCharacter3D`; feeds `player.position` and `dadFrame.position` directly to character transforms; never imports/calls `projectWorldToCinematicStage`; and continues to call retained adapter paths for stamina, song exposure, damage, inventory interaction, world pose, spatial distance, and retained-system ticking.

- [ ] **Step 2: Write failing camera behavior tests**

Using existing `createCameraController/stepCamera`, assert explore camera stays above/behind the player with finite FOV, chase mode pulls farther back than explore, and camera collision shortening still applies against `world.traceCameraSegment`. Preserve existing camera tests/behavior used by cinematic mode.

- [ ] **Step 3: Run integration tests and confirm RED**

Run: `node tests/crazy-family-v047-native-integration.test.mjs`
Expected: FAIL because `game-3d.js` does not exist.

- [ ] **Step 4: Implement `createCrazyFamilyGame3D` by adapting the current coordinator**

Reuse the current world, scenario, movement, Dad, attacks, interactions, audio, control bindings, and retained adapter calls. Replace only scene creation, actor visual updates, attack presentation if necessary for compatibility, and camera application. Character state strings must map to the Task 2 visual states. No cinematic projection or sprite frame logic is allowed in this file.

- [ ] **Step 5: Adjust `camera.js` only where native follow semantics require it**

Keep exported function names and cinematic-compatible behavior. Any new configuration values must default safely so existing callers do not change behavior unless native 3D explicitly opts in.

- [ ] **Step 6: Run native integration plus key existing Crazy Family regressions**

Run: `node tests/crazy-family-v047-native-integration.test.mjs && node tests/crazy-family-v044.test.mjs && node tests/crazy-family-cinematic-song-audio-retry.test.js && node tests/crazy-family-dad-audio-order.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add crazy-family/game-3d.js crazy-family/camera.js tests/crazy-family-v047-native-integration.test.mjs
git commit -m "feat(crazy-family): run gameplay with true 3d actors"
```

### Task 5: v0.47 acceptance wiring and regression gate

**Files:**
- Modify: `crazy-family/bootstrap.js`
- Modify: `crazy-family.html`
- Create: `tests/crazy-family-v047-acceptance.test.mjs`

**Interfaces:**
- Produces: visible/diagnostic version `v0.47` for the native acceptance slice.
- Produces: stable public test URL shape `crazy-family.html?renderer=3d` while the bare route still opens cinematic mode.

- [ ] **Step 1: Write failing acceptance test**

Assert the page still imports Three.js 0.180.0, the native query path is recognized, default mode remains cinematic, v0.46 contextual audio marker `LIBI_AUDIO_ORDER_V046='context-only-13-39'` remains present, native source contains no `PlaneGeometry`/cinematic projection dependency, and version labeling exposes v0.47 without deleting the cinematic fallback modules.

- [ ] **Step 2: Run acceptance test and confirm RED**

Run: `node tests/crazy-family-v047-acceptance.test.mjs`
Expected: FAIL until version/wiring is complete.

- [ ] **Step 3: Wire the final v0.47 label and page diagnostics**

Update only the visible/native acceptance metadata needed for v0.47. Do not change controls, audio banks, inventory markup, or retained gameplay configuration.

- [ ] **Step 4: Run the full Crazy Family v0.47 gate**

Run: `node tests/crazy-family-v047-renderer-selection.test.mjs && node tests/crazy-family-v047-characters-3d.test.mjs && node tests/crazy-family-v047-scene-3d.test.mjs && node tests/crazy-family-v047-native-integration.test.mjs && node tests/crazy-family-v047-acceptance.test.mjs && node tests/crazy-family-v044.test.mjs && node tests/crazy-family-cinematic-song-audio-retry.test.js && node tests/crazy-family-dad-audio-order.test.js`
Expected: all PASS.

- [ ] **Step 5: Manual browser acceptance**

Open `crazy-family.html?renderer=3d` and verify: Libi and Dad visibly have front/side/back volume; turning is Y rotation rather than sprite flipping; jump changes actual world Y; contact shadows ground both characters; explore and chase cameras show perspective depth; Dad song/attack/audio behavior still occurs; controls and interaction prompts still work. Then open bare `crazy-family.html` and verify the current cinematic v0.46 path still plays.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/bootstrap.js crazy-family.html tests/crazy-family-v047-acceptance.test.mjs
git commit -m "feat(crazy-family): publish v0.47 true 3d acceptance path"
```

## Plan self-review result

- Spec coverage: renderer safety, true volumetric actors, direct world transforms, perspective scene/camera, procedural animation, shadows/grounding, gameplay preservation, fallback, and acceptance tests are all assigned to a task.
- Interface consistency: bootstrap selects `createCrazyFamilyGame3D`; native game consumes `createCharacter3D` and `createLivingRoomScene3D`; all lifecycle handles retain `start/stop/dispose`.
- Scope discipline: final house reconstruction, GLB production art, facial animation, and physics rewrites remain explicitly excluded.
- Review-focus risks each have a corresponding test step.
