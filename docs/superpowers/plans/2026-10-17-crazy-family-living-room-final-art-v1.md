# Crazy Family — Living Room Final Art v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Crazy Family world3d living-room graybox with a polished stylized multi-part environment while preserving the approved fixed overhead camera, gameplay physics, interactions, and locked Libi/Dad canon.

**Architecture:** Keep `world.js` authoritative for gameplay coordinates/colliders and insert a dedicated art layer between world data and `scene-3d.js`. Split the visual layer into reusable stylized geometry, a shared material system, a semantic room-art registry with procedural fallbacks/future asset-resolver support, and a fixed lighting rig; `scene-3d.js` only orchestrates those pieces.

**Tech Stack:** JavaScript ES modules, Three.js, Node 22 `node:test`, Playwright 1.55 + Chromium/SwiftShader, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-17-crazy-family-living-room-final-art-v1-design.md`

## Global Constraints

- Do not change player movement, Dad AI, attacks, interaction distances, collision dimensions, nav blockers, scenario spawn logic, or world coordinates in `world.js`.
- Do not change the approved fixed high 3/4 overhead camera behavior.
- Do not change canonical Libi or Dad appearance and do not weaken Character Lock.
- Cinematic fallback must continue to render.
- Gameplay-relevant art roots must preserve current semantic IDs (`sofa`, `coffee-table`, `side-table`, `lamp`, `rug`, `doorway`, `toy-ball`, cushions, walls, floor).
- Pure dressing remains non-colliding and non-interactable in v1.
- Use `MeshStandardMaterial`; do not add a post-processing or geometry dependency in v1.
- No Blender/GLB asset is imported in v1, but the art registry must accept a future asynchronous asset resolver without gameplay/world changes.
- Keep allocations out of the render loop and keep shadow-casting lights limited.

## Review Focus

1. **Unknown or newly added world renderables:** must still appear through a generic procedural fallback rather than silently disappearing. Task 3 pins this.
2. **Future asset resolver returns `null`, throws, or returns an untagged Object3D:** v1 must fall back safely or normalize the returned root without changing gameplay IDs. Task 3 pins this.
3. **Reactive transforms on grouped furniture:** must apply to the semantic group root from its stable `baseTransform`, not drift child meshes or break cushion reactions. Tasks 3 and 5 pin this.
4. **Scenario item placement on styled furniture:** headphones/projected props must retain the existing anchor semantics and remain visible after art replacement. Task 5 pins this in browser smoke.
5. **Narrow/mobile viewport and SwiftShader/WebGL:** art and lighting must remain visible, fixed-camera framing must remain unchanged, and context must stay alive. Task 6 pins this.

---

### Task 1: Lock gameplay/world invariants before the art refactor

**Files:**
- Create: `tests/crazy-family/living-room-final-art-contract.test.mjs`
- Read only: `crazy-family/world.js`
- Read only: `crazy-family/overhead-camera.js`

**Interfaces:**
- Consumes: `createLivingRoomWorld()` and current fixed overhead camera contract.
- Produces: regression assertions that later art tasks must satisfy without editing gameplay data.

- [ ] **Step 1: Write the failing/guard test for unchanged gameplay geometry**

Add `living-room-final-art-contract.test.mjs` with assertions that the current collider snapshot is exactly:

```js
[
  ['sofa', -3.35, 0.55, 3.15, 1.25, 1.05],
  ['coffee-table', -0.25, 0.55, 2.15, 1.2, 0.52],
  ['side-table', -5.05, 0.38, 0.85, 0.75, 0.68],
]
```

and that the existing interactable IDs/actions remain `headphones/take`, `sofa/climb`, `toy-ball/push`, `doorway/open` with their current radii.

- [ ] **Step 2: Add a camera source guard to the same test**

Assert that `overhead-camera.js` still pins base position `{x:7.2,y:11.5,z:8}`, target `{x:0,y:.45,z:0}`, and FOV `48` (using the existing exported API/source contract rather than changing it).

- [ ] **Step 3: Run the contract test**

Run: `node --test tests/crazy-family/living-room-final-art-contract.test.mjs`

Expected: PASS on the pre-art branch; this is a characterization gate, not a behavior change.

- [ ] **Step 4: Commit**

```bash
git add tests/crazy-family/living-room-final-art-contract.test.mjs
git commit -m "test(crazy-family): lock living room gameplay invariants"
```

### Task 2: Add reusable stylized geometry and material systems

**Files:**
- Create: `crazy-family/stylized-geometry.js`
- Create: `crazy-family/living-room-materials.js`
- Create: `tests/crazy-family/living-room-materials.test.mjs`

**Interfaces:**
- Consumes: `THREE`; renderer max anisotropy is optional.
- Produces: `createRoundedBoxGeometry(THREE, options)` and `createLivingRoomMaterialSystem({ THREE, anisotropy }) -> { get(name), textures, dispose() }`.

- [ ] **Step 1: Write failing geometry/material contract tests**

Tests must assert:
- `createRoundedBoxGeometry` returns a `BufferGeometry` with a bounding box inside the requested width/height/depth and more vertices than a plain 8-corner box;
- material names `floorWood`, `furnitureWood`, `sofaFabric`, `cushionWarm`, `cushionCool`, `wall`, `rug`, `toyPlastic`, `metal`, `lampShade`, `lampGlow` all resolve;
- `get(name)` returns shared `MeshStandardMaterial` instances, not a fresh material on every call;
- material roughness/metalness families differ (fabric/rug high roughness, metal > 0 metalness, lampGlow emissive > 0);
- `dispose()` disposes owned textures/materials once and is safe to call twice;
- `anisotropy` omitted or non-finite falls back without throwing.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/crazy-family/living-room-materials.test.mjs`

Expected: FAIL because the new modules/exports do not exist.

- [ ] **Step 3: Implement `createRoundedBoxGeometry(THREE, options)`**

In `stylized-geometry.js`, create a local rounded/beveled box helper using Three.js core geometry only. Required options: `{ width, height, depth, radius = 0.06, bevel = 0.015, curveSegments = 4 }`. Clamp radius/bevel so degenerate small props cannot create invalid geometry.

- [ ] **Step 4: Implement `createLivingRoomMaterialSystem({ THREE, anisotropy = 4 })`**

Move/refine the current procedural wood/rug canvas-texture behavior out of `scene-3d.js`, add subtle reusable fabric/wall/toy procedural maps, and expose the named shared materials from Step 1. Keep texture frequencies low enough for the overhead camera.

- [ ] **Step 5: Run tests to verify GREEN**

Run: `node --test tests/crazy-family/living-room-materials.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/stylized-geometry.js crazy-family/living-room-materials.js tests/crazy-family/living-room-materials.test.mjs
git commit -m "feat(crazy-family): add stylized room geometry and materials"
```

### Task 3: Build the semantic Living Room Final Art registry

**Files:**
- Create: `crazy-family/living-room-art.js`
- Create: `tests/crazy-family/living-room-art.test.mjs`

**Interfaces:**
- Consumes: `createLivingRoomWorld()` data; `createRoundedBoxGeometry`; a material system exposing `get(name)`; optional `resolveAsset(id, def)`.
- Produces: `async createLivingRoomArt({ THREE, world, materials, quality = 'high', resolveAsset = null }) -> { root, dressingRoot, objectsById, resolveArtObject(id), dispose() }`.

- [ ] **Step 1: Write failing semantic/art-assembly tests**

With a real `THREE` import and lightweight stub materials, assert:
- `objectsById` contains `floor`, four walls, `sofa`, `coffee-table`, `rug`, `side-table`, `lamp`, `cushion-a`, `cushion-b`, `toy-blocks`, `toy-ball`, `doorway`;
- every gameplay-relevant root has `name === id`, `userData.semanticId === id`, `userData.artMode === 'stylized-final-v1'`, and a stable `baseTransform`;
- sofa root contains at least base, back, two arms, three seat cushions, and separate decorative/back cushion geometry; it is not a single `BoxGeometry` mesh;
- coffee/side tables contain separate top/support geometry;
- lamp contains base/stem/shade/glow geometry;
- doorway contains frame/trim/opening treatment rather than one slab;
- `cushion-a` and `cushion-b` remain separate roots addressable in `objectsById`;
- dressing-only props live below `dressingRoot` and are absent from `world.colliders`/`world.interactables`;
- an unknown synthetic world renderable receives a generic stylized fallback group rather than disappearing.

- [ ] **Step 2: Add future asset-resolver failure/normalization tests**

Test three cases for `resolveAsset`:
- returns `null` -> procedural builder is used;
- throws -> procedural fallback is used and the error is captured in `root.userData.assetFallbacks` (no uncaught rejection);
- returns a `THREE.Group` without semantic metadata -> returned group is normalized to the requested ID and gets `baseTransform`/shadow configuration.

- [ ] **Step 3: Run tests to verify RED**

Run: `node --test tests/crazy-family/living-room-art.test.mjs`

Expected: FAIL because `living-room-art.js` does not exist.

- [ ] **Step 4: Implement `createLivingRoomArt(...)` and the builder registry**

Use a builder map keyed by semantic ID/category. Procedural builders cover sofa, coffee table, side table, lamp, doorway/walls, floor/rug, toy ball/blocks, cushions; all other renderables use the generic rounded fallback. Keep each hero object inside the existing logical envelope and place it from the matching world definition.

- [ ] **Step 5: Implement non-gameplay dressing**

Add a restrained fixed dressing set under `dressingRoot` (for example book stack, basket, extra blocks/frame) positioned outside nav paths. Give dressing IDs prefixed `dressing-` and never add them to `objectsById` entries used by gameplay.

- [ ] **Step 6: Run tests to verify GREEN**

Run: `node --test tests/crazy-family/living-room-art.test.mjs tests/crazy-family/living-room-final-art-contract.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add crazy-family/living-room-art.js tests/crazy-family/living-room-art.test.mjs
git commit -m "feat(crazy-family): build stylized living room art registry"
```

### Task 4: Add the fixed stylized lighting rig

**Files:**
- Create: `crazy-family/living-room-lighting.js`
- Create: `tests/crazy-family/living-room-lighting.test.mjs`

**Interfaces:**
- Consumes: `THREE`, `world`, and quality (`'high' | 'medium'`).
- Produces: `createLivingRoomLighting({ THREE, scene, world, quality = 'high' }) -> { root, keyLight, lampLight, dispose() }`.

- [ ] **Step 1: Write failing lighting tests**

Assert:
- rig creates exactly one HemisphereLight, one shadow-casting DirectionalLight, and one local PointLight tied to the logical lamp position;
- lamp light has finite positive intensity/range and does not cast a second expensive shadow map;
- key light casts shadows and uses 1024 map size in `high`, 512 in `medium`;
- no light position depends on camera/player state;
- repeated `dispose()` is safe.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/crazy-family/living-room-lighting.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `createLivingRoomLighting(...)`**

Use the spec’s warm daylight key + soft hemispheric fill + local warm lamp point light. Name roots/lights (`living-room-lighting`, `living-room-key`, `living-room-lamp-light`) for browser diagnostics.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/crazy-family/living-room-lighting.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/living-room-lighting.js tests/crazy-family/living-room-lighting.test.mjs
git commit -m "feat(crazy-family): add final art living room lighting"
```

### Task 5: Integrate Final Art v1 into the existing world3d scene without touching gameplay

**Files:**
- Modify: `crazy-family/scene-3d.js`
- Modify: `tests/crazy-family/scene-3d.test.mjs`
- Test: `tests/crazy-family/living-room-final-art-contract.test.mjs`

**Interfaces:**
- Consumes: Tasks 2–4 APIs.
- Produces: unchanged `createLivingRoom3DScene({ canvas, world })` outward contract, with styled art in `visualStage`, existing `characterLayer`, and semantic `objectsById`.

- [ ] **Step 1: Write failing scene integration assertions**

Update `scene-3d.test.mjs` to require imports/calls for `createLivingRoomMaterialSystem`, `createLivingRoomArt`, and `createLivingRoomLighting`, and require that direct `buildGrayboxDescriptors`/`boxMesh` construction is no longer the primary room path.

- [ ] **Step 2: Add integration source guards**

Assert that `scene-3d.js` still exposes `visualMode:'world3d'`, `screenStage:false`, `characterLayer`, `objectsById`, `projectObject`, `applyReactiveTransforms`, and that it still uses ACES tone mapping, soft shadows, and pixel ratio cap `2`.

- [ ] **Step 3: Run tests to verify RED**

Run: `node --test tests/crazy-family/scene-3d.test.mjs tests/crazy-family/living-room-final-art-contract.test.mjs`

Expected: FAIL because `scene-3d.js` still builds the graybox directly.

- [ ] **Step 4: Replace scene-owned graybox construction with the new art/material/lighting systems**

`scene-3d.js` should:
- create renderer/camera/stages exactly as before;
- create one material system;
- `await createLivingRoomArt(...)` and add its root to `visualStage`;
- use the art registry’s `objectsById` for gameplay/reactive transforms;
- create the fixed lighting rig;
- keep headphones/scenario-prop handling compatible with current `projectObject` behavior;
- dispose art, lighting, materials, contact effects, and renderer without double-disposing shared resources.

- [ ] **Step 5: Preserve grouped reactive transforms**

Update `applyReactiveTransforms` only as needed so it transforms the semantic root from `objectsById` against its `baseTransform`; do not mutate child-local transforms. Verify `cushion-a`, `cushion-b`, toy ball, and sofa still react independently.

- [ ] **Step 6: Run the complete Crazy Family Node suite**

Run: `node --test tests/crazy-family/*.test.mjs`

Expected: all Crazy Family Node tests PASS.

- [ ] **Step 7: Run Character Lock tests**

Run: `node --test tests/crazy-family-character-lock.test.js tests/crazy-family-character-asset-integrity.test.js`

Expected: PASS with no character-canon changes.

- [ ] **Step 8: Commit**

```bash
git add crazy-family/scene-3d.js tests/crazy-family/scene-3d.test.mjs
git commit -m "feat(crazy-family): render final art living room in world3d"
```

### Task 6: Browser acceptance, screenshot artifact, version, and CI gate

**Files:**
- Modify: `tests/crazy-family/browser-world3d-smoke.mjs`
- Modify: `.github/workflows/crazy-family-world3d-milestone-a.yml`
- Modify: `crazy-family/bootstrap.js`
- Test: `tests/crazy-family/browser-smoke.mjs`

**Interfaces:**
- Consumes: integrated scene from Task 5.
- Produces: visual browser acceptance evidence, stable deployment cache version `v0.48`, and CI artifact `crazy-family-living-room-final-art-v1`.

- [ ] **Step 1: Write the failing browser Final Art assertions**

Extend `browser-world3d-smoke.mjs` initial diagnostics to assert:
- `objectsById.get('sofa').userData.artMode === 'stylized-final-v1'` and sofa has at least 8 mesh descendants;
- coffee table, side table, lamp, doorway all have `artMode === 'stylized-final-v1'` and more than one mesh descendant;
- `cushion-a` and `cushion-b` exist as separate semantic roots;
- scene has `living-room-key` and `living-room-lamp-light`;
- no hero object is a single plain `BoxGeometry` root mesh;
- headphones exist and remain visible after scenario projection.

- [ ] **Step 2: Preserve all existing world3d behavioral smoke assertions**

Keep the current checks for volumetric Libi/Dad, fixed camera through movement/pointer drag, jump, furniture routing, collision, portrait resize, and WebGL context health. Do not weaken tolerances to make the art pass succeed.

- [ ] **Step 3: Change screenshot output**

Capture desktop Final Art evidence before portrait resize to `artifacts/crazy-family-living-room-final-art-v1.png`; optionally keep the portrait screenshot only if it helps debug framing, but the uploaded primary artifact must be the desktop art-review image.

- [ ] **Step 4: Run browser smoke to verify RED before scene integration is considered complete**

Run (after Playwright Chromium/runtime is available):

```bash
python -m http.server 8000 --bind 127.0.0.1
node tests/crazy-family/browser-world3d-smoke.mjs
```

Expected before Task 5 integration: FAIL on missing `stylized-final-v1` art diagnostics. After Task 5: PASS.

- [ ] **Step 5: Bump Crazy Family cache/version marker**

Change `CRAZY_FAMILY_VERSION` in `crazy-family/bootstrap.js` from `v0.47` to `v0.48` and update any exact-version contract test if one exists.

- [ ] **Step 6: Update the acceptance workflow artifact/step names**

In `.github/workflows/crazy-family-world3d-milestone-a.yml`:
- keep Node suite + Chromium install + static server + cinematic smoke;
- rename world3d step to `Living Room Final Art v1 browser smoke`;
- upload artifact name `crazy-family-living-room-final-art-v1` from `artifacts/crazy-family-living-room-final-art-v1.png`.

- [ ] **Step 7: Run both browser smokes locally/CI-equivalent**

Run:

```bash
node tests/crazy-family/browser-smoke.mjs
node tests/crazy-family/browser-world3d-smoke.mjs
```

Expected: both PASS; no fatal page errors or WebGL context loss.

- [ ] **Step 8: Run final Node/lock verification**

Run:

```bash
node --test tests/crazy-family/*.test.mjs
node --test tests/crazy-family-character-lock.test.js tests/crazy-family-character-asset-integrity.test.js
```

Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add tests/crazy-family/browser-world3d-smoke.mjs .github/workflows/crazy-family-world3d-milestone-a.yml crazy-family/bootstrap.js
git commit -m "test(crazy-family): gate living room final art v1"
```

### Task 7: PR-level verification and visual review gate

**Files:**
- No product files expected unless verification exposes a bug.
- Evidence: GitHub Actions jobs + uploaded screenshot artifact.

**Interfaces:**
- Consumes: complete feature branch.
- Produces: merge-ready PR only after code and visual gates pass.

- [ ] **Step 1: Rebase/merge latest `main` into the feature branch without force-pushing over concurrent work**

Verify only Crazy Family/plan files differ from `main`; resolve any concurrent changes deliberately.

- [ ] **Step 2: Open/update PR against `main`**

PR body must state the locked non-goals: no gameplay/camera/character changes, no GLB yet, cinematic fallback preserved.

- [ ] **Step 3: Wait for required relevant gates**

Required evidence:
- Crazy Family Node suite: green;
- Character Lock: green;
- cinematic browser smoke: green;
- Living Room Final Art v1 world3d browser smoke: green;
- screenshot artifact uploaded.

Unrelated pre-existing workflows (for example Coach training lab) are not blockers unless their failure is caused by this branch.

- [ ] **Step 4: Inspect the uploaded desktop screenshot**

Reject the PR if any of these are visually true even with green tests:
- sofa/table/lamp still read as single boxes at first glance;
- hero furniture clips through floor/walls or exceeds collider envelope enough to mislead navigation;
- lamp/key lighting blows out characters or makes the room unreadably dark;
- fixed overhead composition crops essential hero furniture on desktop;
- dressing blocks a known navigation corridor.

- [ ] **Step 5: Compare final branch against latest `main` and run one fresh full verification after any review fix**

Repeat the Task 6 Node + lock + browser commands on the final head.

- [ ] **Step 6: Present integration options rather than merging automatically**

Use the finishing-development-branch workflow; merge only after explicit user choice.
