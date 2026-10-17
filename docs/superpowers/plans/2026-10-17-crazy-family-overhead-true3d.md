# Crazy Family Fixed Overhead + True 3D Characters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `crazy-family.html?renderer=3d` play from one fixed high 3/4 living-room camera while rendering Libi and Dad as true volumetric 3D actors instead of layered sprite planes.

**Architecture:** Keep `crazy-family/game.js` as the single gameplay coordinator so movement, Dad AI, attacks, audio, stamina, interactions and scenario state are not forked. The cinematic path keeps `characters.js` + `camera.js`; the world3d path gets two focused visual modules: `characters-3d.js` for volumetric actors and `overhead-camera.js` for a room-anchored fixed camera. `scene-3d.js` remains the PerspectiveCamera/room owner and gains a dedicated character layer only. The new 3D character proportions/colors are centralized in `character-3d-canon.js` and added to the existing Character Lock so parallel chats cannot casually drift the models.

**Tech Stack:** Vanilla JavaScript ES modules, Three.js 0.180.0 through the existing import map, Node `node:test`/`assert`, Playwright Chromium browser smoke tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-16-crazy-family-true-3d-characters-design.md`

## Global Constraints

- `?renderer=3d` remains the world3d acceptance path; the bare route remains cinematic during acceptance.
- Locked fallback assets remain unchanged: `assets/libi-sprites-v025.png` and `assets/crazy-family/dad-sprites-v028.png`.
- New 3D proportions/colors/identity markers live only in `crazy-family/character-3d-canon.js` and are covered by the Character Lock workflow.
- World3d visible actors may not use `THREE.PlaneGeometry`, layered planes, billboards, `faceCamera`, negative-X sprite flips, or cinematic projection.
- The overhead camera is a `THREE.PerspectiveCamera` with one stable high 3/4 room framing; it does not follow Libi or react to sprint, Dad chase/song, attacks, interactions, or room reactions.
- Responsive camera adaptation may depend only on viewport dimensions/aspect ratio and may change only camera distance along the same fixed room-view ray; target, angle and FOV remain fixed.
- World3d has no pointer-drag orbit or automatic camera collision motion.
- Existing movement, jump, crouch, collision, Dad AI, song timing, attacks, stamina, damage, inventory, interaction, scenario, spatial-audio and retained-system behavior remain authoritative and unchanged.
- Existing cinematic behavior and Character Lock tests must remain green.
- This slice uses procedural volumetric proxies; final rigged GLB/GLTF character art is out of scope.

## Review Focus

- Narrow/portrait or tiny viewport: camera framing stays finite and deterministic, with only distance scaling changing and no NaN/Infinity pose values; pinned in Task 1 tests.
- Zero-speed/idle actor state: Libi and Dad keep the last finite Y rotation without jitter or snapping to NaN; pinned in Task 2 tests.
- Dad song/chase, sprint, interaction and reactive camera-shake state: world3d camera pose remains byte-for-byte stable across frame updates; pinned in Task 4 source/behavior contracts and Task 5 browser smoke.
- A future edit accidentally changes the new 3D canon or reintroduces `PlaneGeometry`, `faceCamera`, sprite flipping or cinematic projection: Character Lock, source and browser assertions fail; pinned in Tasks 2, 4 and 5.
- Cinematic fallback or locked sprite canon regresses while world3d changes: dedicated cinematic smoke + Character Lock + existing Node suite catch it; pinned in Task 5.

---

### Task 1: Fixed room-anchored overhead camera

**Files:**
- Create: `crazy-family/overhead-camera.js`
- Create: `tests/crazy-family/overhead-camera.test.mjs`

**Interfaces:**
- Produces: `OVERHEAD_ROOM_CAMERA` immutable config with `position`, `target`, `fov`, `desktopAspect`, `maxDistanceScale`.
- Produces: `createOverheadCameraPose({ width = 960, height = 600 }) -> { position, target, fov }`.
- Camera base values: `position = { x: 7.2, y: 11.5, z: 8.0 }`, `target = { x: 0, y: 0.45, z: 0 }`, `fov = 48`, `desktopAspect = 1.35`, `maxDistanceScale = 1.45`.
- Resize rule: when aspect is below `1.35`, move the camera farther from the fixed target along the exact same target-to-camera ray, clamped to a distance multiplier of `1.45`; do not change target, angle or FOV.

- [ ] **Step 1: Write the failing overhead camera tests**

Create tests named:
- `overhead camera uses the approved fixed room pose on desktop`
- `overhead camera ignores gameplay inputs because it consumes viewport only`
- `portrait resize moves only along the same view ray`
- `zero and tiny dimensions stay finite`

Assert the exact desktop `position`, `target`, `fov=48`, and that portrait/tiny dimensions produce finite values, identical target/FOV, and a farther collinear camera position with scale `<= 1.45`.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test tests/crazy-family/overhead-camera.test.mjs`
Expected: FAIL because `crazy-family/overhead-camera.js` does not exist.

- [ ] **Step 3: Implement `createOverheadCameraPose`**

Implement the pure math module with no Three.js dependency and no player/Dad/world/gameplay parameters. Clamp width/height to at least `1` before computing aspect.

- [ ] **Step 4: Run the camera test and confirm GREEN**

Run: `node --test tests/crazy-family/overhead-camera.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/overhead-camera.js tests/crazy-family/overhead-camera.test.mjs
git commit -m "feat(crazy-family): add fixed overhead room camera"
```

### Task 2: Locked volumetric Libi and Dad proxies

**Files:**
- Create: `crazy-family/character-3d-canon.js`
- Create: `crazy-family/characters-3d.js`
- Create: `tests/crazy-family/characters-3d.test.mjs`
- Modify: `tests/crazy-family/canonical-3d-characters.test.mjs`
- Modify: `tests/crazy-family-character-lock.test.js`
- Modify: `.github/workflows/crazy-family-character-lock.yml`

**Interfaces:**
- Produces: `getCharacter3DCanon(kind)` for exactly `'libi' | 'dad'`.
- Produces: `createCharacter3D({ scene, kind }) -> { root, setTransform, update, setVisible, dispose }`.
- `setTransform({ position, heading, state, speed, grounded })` writes logical `x/y/z` directly to `root.position` and rotates only around `root.rotation.y`.
- 3D canon identity markers:
  - Libi: height `1.18`, child proportions, brown hair `0x5a3828`, two pigtail masses, flower `0xff78ad`, coral top `0xf07f87`, teal overalls `0x2d9ba7`, striped-sock marker, pink shoes `0xf35c95`.
  - Dad: height `1.78`, broader torso, dark-brown hair `0x3a251d`, beard/stubble marker, teal overshirt `0x2f7f7c`, light undershirt `0xf0e8d5`, pajama-pants marker, brown slippers `0x7b5037`.
- Visible geometry may use `BoxGeometry`, `SphereGeometry`, `CylinderGeometry` and other true-volume primitives, but never `PlaneGeometry`.

- [ ] **Step 1: Write the failing pure canon, renderer and Character Lock tests**

In `characters-3d.test.mjs`, import only `character-3d-canon.js` for runtime assertions and read `characters-3d.js` as source text. Assert:
- Libi/Dad heights and named identity markers match the values above.
- Dad height exceeds Libi height.
- source contains `THREE.Group` and volumetric geometry constructors.
- source does not contain `PlaneGeometry`, `faceCamera`, `lookAt(`, `cinematic-projection`, sprite-sheet texture loading, or signed `scale.x` facing.
- `setTransform` source writes world position and Y rotation.

Update `canonical-3d-characters.test.mjs` so it no longer requires the old `canonical-3d-stack`; instead assert `characters.js` remains the locked cinematic sprite fallback and native actors live in `characters-3d.js`.

Extend `tests/crazy-family-character-lock.test.js` to require `character-3d-canon.js`, assert the exact Libi/Dad 3D heights and locked identity colors above, and assert `characters-3d.js` imports `getCharacter3DCanon` rather than defining replacement colors/proportions inline.

Extend `.github/workflows/crazy-family-character-lock.yml` path filters to include `crazy-family/character-3d-canon.js`, `crazy-family/characters-3d.js`, and `tests/crazy-family/characters-3d.test.mjs`.

- [ ] **Step 2: Run the tests and confirm RED**

Run:
```bash
node --test tests/crazy-family/characters-3d.test.mjs tests/crazy-family/canonical-3d-characters.test.mjs
node tests/crazy-family-character-lock.test.js
```
Expected: FAIL because the new 3D canon/renderer modules do not exist and the old test still describes the layered stack.

- [ ] **Step 3: Implement `character-3d-canon.js`**

Create immutable per-character visual configuration for dimensions, materials/colors and named identity cues. Throw for unknown `kind`. Do not import or mutate the fallback sprite assets.

- [ ] **Step 4: Implement `createCharacter3D` with articulated volumetric groups**

Build one root `THREE.Group` with named torso/head/hair/arm/leg/foot groups, character-specific clothing/accent meshes, cast shadows on every visible mesh, and lightweight procedural animation. Preserve a private last finite heading so idle/zero-speed frames keep orientation; smooth Y rotation rather than snapping.

Required visual state mapping:
- Libi: `idle`, `run`, `sprint`, `crouch`, `airborne`, `landing`.
- Dad: `idle`, `chase`, `sing`, `pant`, `yawn`, `sneeze`.

- [ ] **Step 5: Run character and lock tests and confirm GREEN**

Run:
```bash
node --test tests/crazy-family/characters-3d.test.mjs tests/crazy-family/canonical-3d-characters.test.mjs
node tests/crazy-family-character-lock.test.js
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/character-3d-canon.js crazy-family/characters-3d.js tests/crazy-family/characters-3d.test.mjs tests/crazy-family/canonical-3d-characters.test.mjs tests/crazy-family-character-lock.test.js .github/workflows/crazy-family-character-lock.yml
git commit -m "feat(crazy-family): add locked volumetric family actors"
```

### Task 3: Dedicated world3d character layer

**Files:**
- Modify: `crazy-family/scene-3d.js`
- Modify: `tests/crazy-family/scene-3d.test.mjs`

**Interfaces:**
- `createLivingRoom3DScene(...)` additionally produces `characterLayer: THREE.Group` named `world3d-characters`.
- `characterLayer` lives in native world space under the scene/visual stage and shares existing room lighting/shadows.
- Existing scene return fields remain compatible.

- [ ] **Step 1: Write the failing scene contract test**

Extend `scene-3d.test.mjs` to assert source creates `characterLayer`, names it `world3d-characters`, attaches it to the 3D scene hierarchy, returns it from `createLivingRoom3DScene`, keeps `PerspectiveCamera`, and still contains no cinematic projection import.

- [ ] **Step 2: Run the scene test and confirm RED**

Run: `node --test tests/crazy-family/scene-3d.test.mjs`
Expected: FAIL because `characterLayer` is not exposed.

- [ ] **Step 3: Add the character layer to `scene-3d.js`**

Do not change floor/rug materials, room geometry, renderer quality settings, lighting, object interaction or collision descriptors.

- [ ] **Step 4: Run the scene test and confirm GREEN**

Run: `node --test tests/crazy-family/scene-3d.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/scene-3d.js tests/crazy-family/scene-3d.test.mjs
git commit -m "feat(crazy-family): add native character layer"
```

### Task 4: Integrate fixed camera and true 3D actors into the existing game loop

**Files:**
- Modify: `crazy-family/game.js`
- Modify: `tests/crazy-family/world3d-game-contract.test.mjs`
- Modify: `tests/crazy-family/camera.test.mjs` only if an existing cinematic assertion needs explicit scoping; do not change the follow-camera behavior itself.

**Interfaces:**
- Consumes: `createOverheadCameraPose({ width, height })` from Task 1.
- Consumes: `createCharacter3D({ scene, kind })` from Task 2.
- Consumes: `sceneHandle.characterLayer` from Task 3.
- Cinematic path continues to consume `createCharacterVisual`, `createCameraController`, `stepCamera` and existing projected sprite flow.

- [ ] **Step 1: Rewrite the world3d source-contract tests to describe the approved architecture**

In `world3d-game-contract.test.mjs`, replace the old assertions that require `orbitCamera`, signed sprite scale and `faceCamera` with assertions that world3d:
- imports and creates `createCharacter3D` for Libi and Dad,
- uses `sceneHandle.characterLayer`,
- imports and uses `createOverheadCameraPose`,
- feeds `player.position` and `player.heading` directly to Libi `setTransform`,
- derives Dad visual heading from `dadFrame.velocity` with last-heading fallback and feeds direct world position,
- calls each actor `update(dt, now)`,
- does not call `faceCamera` in the native branch,
- does not bind pointer-drag orbit in world3d,
- does not pass player speed, chase mode, Dad state, interaction state or reaction shake into overhead pose computation,
- retains the existing cinematic imports and gameplay calls.

- [ ] **Step 2: Run the contract test and confirm RED**

Run: `node --test tests/crazy-family/world3d-game-contract.test.mjs`
Expected: FAIL because game.js still uses layered canonical visuals, orbit and follow-camera stepping.

- [ ] **Step 3: Branch only the visual actor construction**

In `createCrazyFamilyGame`, create cinematic actors with `createCharacterVisual(...)` exactly as today, and world3d actors with `createCharacter3D({ scene: sceneHandle.characterLayer, kind })`.

Keep the locked sprite asset constants and `characters.js` imports for cinematic mode only.

- [ ] **Step 4: Branch only the camera policy**

For world3d:
- initialize `cameraPose = createOverheadCameraPose({ width: 960, height: 600 })`;
- on resize, recompute from viewport dimensions and apply it once;
- during ordinary animation frames, do not call `stepCamera` for world3d;
- call `sceneHandle.applyCameraPose(cameraPose, 0, now)` so room reaction shake cannot move the overhead camera;
- do not bind pointer camera handlers.

For cinematic mode, preserve existing `stepCamera`, camera modes, occlusion and reaction-shake behavior.

- [ ] **Step 5: Feed real world orientation into the 3D actors**

For Libi use `player.heading` directly. For Dad keep a private visual heading initialized to a finite default and update it only when horizontal velocity magnitude exceeds `0.05`, using the same world convention as movement: `Math.atan2(vx, -vz)`.

Map current gameplay states into the Task 2 animation state names without changing gameplay state itself.

- [ ] **Step 6: Remove native billboard presentation while keeping cinematic presentation**

Delete/stop using world3d signed-X scale, frame stepping and `faceCamera` calls. Keep sprite frame selection and projection only inside the cinematic branch.

- [ ] **Step 7: Run focused integration regressions**

Run:
```bash
node --test tests/crazy-family/world3d-game-contract.test.mjs tests/crazy-family/camera.test.mjs tests/crazy-family/movement.test.mjs tests/crazy-family/dad.test.mjs tests/crazy-family/attacks.test.mjs tests/crazy-family/interaction.test.mjs
node tests/crazy-family-character-lock.test.js
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add crazy-family/game.js tests/crazy-family/world3d-game-contract.test.mjs tests/crazy-family/camera.test.mjs
git commit -m "feat(crazy-family): use fixed overhead camera and true 3d actors"
```

### Task 5: Browser acceptance, versioning and CI gate

**Files:**
- Modify: `tests/crazy-family/browser-world3d-smoke.mjs`
- Modify: `.github/workflows/crazy-family-world3d-milestone-a.yml`
- Modify: `crazy-family/bootstrap.js`
- Test: existing `tests/crazy-family/browser-smoke.mjs`
- Test: existing Character Lock workflow/tests

**Interfaces:**
- Browser diagnostics continue to use `globalThis.__crazyFamilyMovieSetGame`.
- World3d smoke reads `game.scene.camera`, `game.playerVisual.root`, `game.dadVisual.root`, `game.cameraPose`, player/dad logical positions and renderer diagnostics.
- Publish visible version `v0.47` only after the acceptance checks in this task are wired.

- [ ] **Step 1: Rewrite the world3d browser smoke for the new acceptance target**

Keep existing startup, movement in two directions, jump, furniture-route collision and WebGL checks. Replace orbit/camera-boom checks with:
- camera is a `PerspectiveCamera` and starts above the room;
- snapshot camera position/rotation/FOV before gameplay movement;
- move Libi across multiple room regions, sprint, trigger/observe Dad chase/song state if available, and verify camera position/rotation/FOV remain unchanged within `1e-6` except a browser resize step;
- after resize, verify target/angle/FOV remain stable and only camera distance changes deterministically;
- traverse Libi and Dad roots and assert at least one visible mesh each, no visible descendant has geometry type `PlaneGeometry`, and both roots are `THREE.Group`;
- rotate/move Libi and verify `root.rotation.y` changes while `root.scale.x` stays positive;
- verify Dad's configured/world height is larger than Libi's;
- verify both actor contact shadows/effects remain active;
- capture screenshot to `artifacts/crazy-family-world3d-overhead-true3d.png`.

- [ ] **Step 2: Run the browser smoke locally/CI-style and confirm RED before final wiring**

Run with the existing static server + Playwright setup:
```bash
node tests/crazy-family/browser-world3d-smoke.mjs
```
Expected: FAIL until Tasks 1-4 integration is fully present in the browser path or until old orbit assertions are removed.

- [ ] **Step 3: Update the dedicated workflow as the acceptance gate**

Rename the workflow display name to `Crazy Family world3d Overhead True3D`; change its feature-branch push trigger to `feature/crazy-family-overhead-true3d`; keep Node tests + cinematic browser smoke + world3d browser smoke. Update the screenshot artifact path/name. Keep PR path filtering on `crazy-family/**`, `tests/crazy-family/**` and the workflow itself.

- [ ] **Step 4: Publish `v0.47`**

Change `CRAZY_FAMILY_VERSION` in `crazy-family/bootstrap.js` from `v0.44` to `v0.47`. Do not alter renderer selection or the bare-route cinematic fallback.

- [ ] **Step 5: Run the full Crazy Family Node gate**

Run:
```bash
node --test tests/crazy-family/*.test.mjs
node tests/crazy-family-character-lock.test.js
node tests/crazy-family-character-asset-integrity.test.js
```
Expected: all Crazy Family Node tests and both Character Lock checks PASS.

- [ ] **Step 6: Run both browser acceptance paths**

With the static server running:
```bash
node tests/crazy-family/browser-smoke.mjs
node tests/crazy-family/browser-world3d-smoke.mjs
```
Expected: both PASS.

- [ ] **Step 7: Verify protected canonical assets are untouched**

Compare the branch diff and confirm neither `assets/libi-sprites-v025.png` nor `assets/crazy-family/dad-sprites-v028.png` changed. Confirm `character-3d-canon.js` changes are exactly the newly approved v0.47 3D canon and no unrelated character replacement is present.

- [ ] **Step 8: Commit**

```bash
git add tests/crazy-family/browser-world3d-smoke.mjs .github/workflows/crazy-family-world3d-milestone-a.yml crazy-family/bootstrap.js
git commit -m "test(crazy-family): gate overhead true 3d acceptance"
```

## Plan Self-Review Result

- **Spec coverage:** fixed high room camera, resize-only adaptation, true volumetric Libi/Dad, world-space Y rotation, no billboard/projection, shared 3D lighting/shadows, unchanged gameplay, cinematic fallback, Character Lock and browser acceptance all have an owning task.
- **Step scan:** every implementation task has RED, minimal implementation, GREEN and commit boundaries; no task requires inventing a new gameplay system.
- **Interface consistency:** Task 1 produces `createOverheadCameraPose`; Task 2 produces locked `getCharacter3DCanon` + `createCharacter3D`; Task 3 produces `sceneHandle.characterLayer`; Task 4 is the single integration consumer; Task 5 exercises the resulting public/browser contract.
- **Review Focus:** narrow viewport, idle heading stability, gameplay-state camera stability, accidental 3D-canon/flat-rendering drift, and cinematic/canon regressions are each pinned to explicit tests.
- **Scope discipline:** no final GLB sculpt, room-art rebuild, physics rewrite, Dad AI fork, facial animation or manual camera control is included.
