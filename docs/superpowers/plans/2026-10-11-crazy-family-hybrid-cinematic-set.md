# Crazy Family Hybrid Cinematic Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public Crazy Family room presentation with a layered cinematic home set that visually matches the approved warm reference while preserving free 360-degree play, fixed furniture gameplay geometry, dynamic item/Dad scenarios, and the approved Libi/Dad character assets.

**Architecture:** Keep `world.js`, navigation, collision, scenario, attacks, audio, and character state as the authoritative gameplay model. Add a separate cinematic visual-set layer that maps authored environment artwork to the existing world anchors, uses depth-aware occluder planes and lightweight contact treatment for characters/items, and hides the conflicting procedural furniture while leaving its gameplay geometry active.

**Tech Stack:** JavaScript ES modules, Three.js 0.180.0, HTML/CSS, Node test runner, Playwright Chromium, image assets under `assets/crazy-family/`.

**Spec:** `docs/superpowers/specs/2026-10-11-crazy-family-hybrid-cinematic-set-design.md`

## Global Constraints

- Preserve `APPROVED_LIBI_ASSET = 'assets/libi-sprites-v025.png'` exactly.
- Preserve `APPROVED_DAD_ASSET = 'assets/crazy-family/dad-sprites-v028.png'` exactly.
- Libi retains free camera-relative 360-degree movement and existing jump/crouch/run/interaction behavior.
- `world.js` remains authoritative for collision, navigation, attack tracing, surfaces, and interaction coordinates.
- The house/furniture gameplay layout remains fixed; scenarios may move Dad and special items only.
- Headphones and future special items remain independent world-space objects; they are never baked into the environment artwork.
- Cinematic artwork must contain no Libi, Dad, substitute people, HUD, text, buttons, or baked special items.
- Keep one WebGL renderer/runtime; no second canvas/render engine.
- Do not publish while the browser screenshot still reads primarily as primitive procedural 3D furniture.

## Review Focus

- **Visual/gameplay misalignment:** sofa/table artwork must line up closely enough with existing blockers that Libi never appears to walk visibly through solid furniture.
- **Camera edge exposure:** chase/explore camera changes must not reveal unfinished blank areas outside the authored set.
- **Dynamic spawn readability:** every v0.41 item spawn must remain visible, reachable, and not visually embedded in a cinematic layer.
- **Transparency/depth artifacts:** authored foreground layers must occlude characters when appropriate without permanent alpha haze or disappearing characters.
- **Browser performance:** large transparent artwork must not cause WebGL context loss or make the existing Chromium smoke path unstable.

---

### Task 1: Lock Canon and Gameplay Invariants Before Visual Work

**Files:**
- Create: `tests/crazy-family/cinematic-set-contract.test.mjs`
- Modify: none in production code

**Interfaces:**
- Consumes: `createLivingRoomWorld()` from `crazy-family/world.js`; character constants from `crazy-family/characters.js`; `createScenario()` / `applyScenarioToWorld()` from `crazy-family/scenario.js`.
- Produces: regression tests that protect the canonical characters, fixed furniture coordinates, and dynamic scenario semantics throughout the visual rewrite.

- [ ] **Step 1: Write the failing/guard tests**

Add tests named:

```js
'cinematic rewrite keeps canonical Libi and Dad assets'
'cinematic rewrite keeps fixed blocker geometry unchanged'
'cinematic rewrite keeps item scenarios dynamic'
```

Assertions must pin the character asset URLs exactly and snapshot the current collider coordinates for `sofa`, `coffee-table`, and `side-table`.

- [ ] **Step 2: Run the focused contract suite**

Run: `node --test tests/crazy-family/cinematic-set-contract.test.mjs`

Expected: PASS on canonical/gameplay invariants before visual implementation. If it does not pass, stop and reconcile the branch with current `main` before continuing.

- [ ] **Step 3: Run existing gameplay tests as baseline**

Run: `node --test tests/crazy-family/*.test.mjs`

Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/crazy-family/cinematic-set-contract.test.mjs
git commit -m "test: lock Crazy Family cinematic set invariants"
```

---

### Task 2: Author the Character-Free Cinematic Home Asset Pack

**Files:**
- Create: `assets/crazy-family/cinematic-home-v042/background.webp`
- Create: `assets/crazy-family/cinematic-home-v042/floor-rug.webp`
- Create: `assets/crazy-family/cinematic-home-v042/sofa.webp`
- Create: `assets/crazy-family/cinematic-home-v042/coffee-table.webp`
- Create: `assets/crazy-family/cinematic-home-v042/dining-kitchen.webp`
- Create: `assets/crazy-family/cinematic-home-v042/foreground-left.webp`
- Create: `assets/crazy-family/cinematic-home-v042/foreground-right.webp`
- Create: `assets/crazy-family/cinematic-home-v042/light-overlay.webp`
- Create: `assets/crazy-family/cinematic-home-v042/manifest.json`
- Create: `scripts/test-crazy-family-v042-assets.py`

**Interfaces:**
- Consumes: the approved reference image as environment/look reference only; fixed world anchors from `world.js`.
- Produces: a clean layered asset pack with transparent foreground/furniture pieces and a machine-readable manifest consumed by Task 3.

- [ ] **Step 1: Define the asset acceptance test**

`scripts/test-crazy-family-v042-assets.py` must fail until all required files exist. It must verify:
- every named asset exists;
- raster assets are non-empty and above a minimum useful resolution;
- `manifest.json` contains unique layer IDs;
- the manifest contains no character or HUD layer IDs;
- required semantic layer IDs include `cinematic-background`, `cinematic-floor-rug`, `cinematic-sofa`, `cinematic-coffee-table`, `cinematic-dining-kitchen`, `cinematic-foreground-left`, and `cinematic-foreground-right`.

- [ ] **Step 2: Run the asset test and confirm RED**

Run: `python scripts/test-crazy-family-v042-assets.py`

Expected: FAIL because the v0.42 asset pack does not exist yet.

- [ ] **Step 3: Create the clean environment master**

Create a high-quality, character-free, UI-free home image that follows the approved reference for composition, warm golden-hour lighting, material softness, household density, wood floor, sofa, patterned rug, open dining/kitchen depth, plants/books/art/child drawings, and overall polished stylized family-animation look.

Hard exclusions: no people, no Libi, no Dad, no headphones, no UI, no text.

- [ ] **Step 4: Separate the master into the minimum useful depth layers**

Use transparent WebP where alpha is needed. Keep the broad architecture in `background.webp`; isolate only objects that must participate in parallax/occlusion or align with gameplay anchors. Avoid creating dozens of tiny layers.

- [ ] **Step 5: Write `manifest.json`**

Each layer entry must include:
- `id`
- `src`
- `kind` (`background`, `surface`, `furniture`, `foreground`, `light`)
- `anchorId` when aligned to a gameplay object
- `world` placement (`x`, `y`, `z`, `width`, `height`)
- `renderOrder`
- `occluder` boolean

- [ ] **Step 6: Run asset test and confirm GREEN**

Run: `python scripts/test-crazy-family-v042-assets.py`

Expected: PASS.

- [ ] **Step 7: Visual review before coding against the pack**

Open the clean composite of all layers with characters hidden. Do not proceed if it still looks like a generic/simple 3D room rather than the approved reference family-home look.

- [ ] **Step 8: Commit**

```bash
git add assets/crazy-family/cinematic-home-v042 scripts/test-crazy-family-v042-assets.py
git commit -m "feat: add Crazy Family cinematic home artwork v0.42"
```

---

### Task 3: Add a Focused Cinematic Set Loader and Manifest API

**Files:**
- Create: `crazy-family/cinematic-set.js`
- Create: `tests/crazy-family/cinematic-set.test.mjs`

**Interfaces:**
- Consumes: `manifest.json`, Three.js scene, `world.objects`.
- Produces:
  - `createCinematicSet({ scene, world, manifestUrl }) -> Promise<CinematicSetHandle>`
  - `CinematicSetHandle.layersById: Map<string, THREE.Object3D>`
  - `CinematicSetHandle.anchorsByWorldId: Map<string, THREE.Object3D[]>`
  - `CinematicSetHandle.occluders: Array<{id,x,z,width,depth,object}>`
  - `CinematicSetHandle.setDebugVisible(value)`
  - `CinematicSetHandle.dispose()`

- [ ] **Step 1: Write failing unit tests**

Tests must assert that:
- manifest entries become stable semantic layer definitions;
- `anchorId: 'sofa'` resolves against the sofa world object instead of inventing a new gameplay coordinate;
- missing nonessential decorative layers can be skipped with a recorded warning;
- missing required `background` or anchored furniture layers rejects initialization rather than silently showing procedural placeholders.

- [ ] **Step 2: Run RED**

Run: `node --test tests/crazy-family/cinematic-set.test.mjs`

Expected: FAIL because `cinematic-set.js` does not exist.

- [ ] **Step 3: Implement the manifest loader**

Use `THREE.TextureLoader` and transparent planes/meshes. Set `texture.colorSpace = THREE.SRGBColorSpace`; use `depthWrite: false` on transparent art layers and explicit `renderOrder` from the manifest. Do not create colliders here.

- [ ] **Step 4: Implement anchor alignment**

Anchored furniture layers read `x/z` from the matching world object and use manifest offsets only for presentation. Background architecture remains set-authored.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/crazy-family/cinematic-set.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/cinematic-set.js tests/crazy-family/cinematic-set.test.mjs
git commit -m "feat: add cinematic home set loader"
```

---

### Task 4: Make Cinematic Art the Default Visible Environment

**Files:**
- Modify: `crazy-family/scene.js`
- Modify: `crazy-family/game.js`
- Modify: `tests/crazy-family/cinematic-set-contract.test.mjs`

**Interfaces:**
- Consumes: `createCinematicSet()` from Task 3.
- Produces: `createLivingRoomScene({ canvas, world, visualMode = 'cinematic' })` whose public handle additionally exposes `cinematicSet` and `visualMode`.

- [ ] **Step 1: Add a failing integration contract**

Assert that cinematic mode has a code path which:
- loads the v0.42 manifest;
- marks procedural room meshes as debug/fallback rather than primary visible art;
- keeps dynamic objects such as `headphones` and `toy-ball` addressable in `objectsById`;
- does not change `world.colliders`.

- [ ] **Step 2: Run RED**

Run: `node --test tests/crazy-family/cinematic-set-contract.test.mjs`

Expected: FAIL on missing cinematic integration markers/API.

- [ ] **Step 3: Refactor `scene.js` only at the visual boundary**

Keep renderer/camera/light creation there, but move cinematic artwork responsibilities to `cinematic-set.js`. Existing procedural room constructors remain available only for `visualMode: 'debug-procedural'` or nonconflicting dynamic props.

- [ ] **Step 4: Make `game.js` await cinematic scene readiness**

`createCrazyFamilyGame()` must await the scene/cinematic set before starting the frame loop. The scenario-selected special item is then moved exactly as today after the set is ready.

- [ ] **Step 5: Confirm dynamic special-item alignment**

Add an assertion that the visible `headphones` object coordinates equal `scenario.item.position` after setup.

- [ ] **Step 6: Run focused and full tests**

Run:
```bash
node --test tests/crazy-family/cinematic-set-contract.test.mjs
node --test tests/crazy-family/*.test.mjs
node --check crazy-family/scene.js
node --check crazy-family/cinematic-set.js
node --check crazy-family/game.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add crazy-family/scene.js crazy-family/game.js tests/crazy-family/cinematic-set-contract.test.mjs
git commit -m "feat: render Crazy Family with cinematic home set"
```

---

### Task 5: Add Spatial Foreground Occlusion for Free 360-Degree Movement

**Files:**
- Create: `crazy-family/cinematic-occlusion.js`
- Create: `tests/crazy-family/cinematic-occlusion.test.mjs`
- Modify: `crazy-family/game.js`

**Interfaces:**
- Consumes: camera position, actor world position, cinematic-set occluder definitions.
- Produces:
  - `resolveCinematicOcclusion({ camera, actor, occluders }) -> Set<string>`
  - `applyCinematicOcclusion(cinematicSet, activeIds)`

- [ ] **Step 1: Write failing occlusion tests**

Cover:
- Libi behind the sofa => sofa/foreground layer is rendered in front;
- Libi on the camera side of the sofa => no false occlusion;
- unrelated background/wall layers are never toggled as actor occluders;
- Dad and Libi can be evaluated independently.

- [ ] **Step 2: Run RED**

Run: `node --test tests/crazy-family/cinematic-occlusion.test.mjs`

Expected: FAIL because module is missing.

- [ ] **Step 3: Implement world-space depth proxies**

Use camera-to-actor segment tests against manifest/world rectangles; do not hard-code screenshot pixel coordinates. Prefer render-order/depth-group switching over opacity fading.

- [ ] **Step 4: Wire the frame loop**

Each frame, evaluate occlusion for Libi and Dad after camera pose is known and before render. Avoid rebuilding materials or textures per frame.

- [ ] **Step 5: Run tests**

Run:
```bash
node --test tests/crazy-family/cinematic-occlusion.test.mjs
node --test tests/crazy-family/camera.test.mjs
node --test tests/crazy-family/*.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/cinematic-occlusion.js crazy-family/game.js tests/crazy-family/cinematic-occlusion.test.mjs
git commit -m "feat: add cinematic furniture occlusion"
```

---

### Task 6: Ground Characters and Dynamic Items in the Painted Environment

**Files:**
- Create: `crazy-family/contact-effects.js`
- Create: `tests/crazy-family/contact-effects.test.mjs`
- Modify: `crazy-family/game.js`
- Modify: `crazy-family/scene.js`

**Interfaces:**
- Consumes: Libi/Dad/special-item world transforms and current surface kind.
- Produces:
  - `createContactEffects(scene)`
  - `contactEffects.syncActor(id, { position, grounded, surfaceKind, scale })`
  - `contactEffects.syncItem(id, { position, visible })`
  - `contactEffects.dispose()`

- [ ] **Step 1: Write failing tests for stable contact-state calculation**

Pin these behaviors:
- grounded actor gets visible soft contact shadow;
- airborne actor shadow softens/scales rather than following the sprite upward at full opacity;
- hidden/collected item has no contact effect;
- rug/wood differences adjust subtle shadow intensity only, not gameplay state.

- [ ] **Step 2: Run RED**

Run: `node --test tests/crazy-family/contact-effects.test.mjs`

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement lightweight projected contact meshes**

Use small transparent floor-oriented planes or blob-shadow textures. Do not add expensive per-object shadow maps. Keep the current warm directional/fill light but tune it to agree with the authored golden-hour direction.

- [ ] **Step 4: Integrate with runtime actors and special item**

Update Libi/Dad contact effects from their existing pose data; update headphones at the scenario-selected position and hide its effect when collected.

- [ ] **Step 5: Run GREEN and syntax checks**

Run:
```bash
node --test tests/crazy-family/contact-effects.test.mjs
node --test tests/crazy-family/*.test.mjs
node --check crazy-family/contact-effects.js
node --check crazy-family/game.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/contact-effects.js crazy-family/scene.js crazy-family/game.js tests/crazy-family/contact-effects.test.mjs
git commit -m "feat: ground Crazy Family actors in cinematic set"
```

---

### Task 7: Constrain the Camera to the Authored Visual Envelope Without Removing Free Movement

**Files:**
- Modify: `crazy-family/camera.js`
- Modify: `tests/crazy-family/camera.test.mjs`

**Interfaces:**
- Consumes: existing camera mode, player/Dad positions, world collision, optional `visualEnvelope` bounds from cinematic set.
- Produces: `stepCamera(..., visualEnvelope)` behavior that preserves camera-relative free play but avoids exposing unpainted scenery.

- [ ] **Step 1: Add failing tests**

Add tests named:
- `visual envelope shortens camera before exposing unauthored set edge`
- `visual envelope does not clamp player movement`
- `chase framing remains wider than explore inside cinematic envelope`

- [ ] **Step 2: Run RED**

Run: `node --test tests/crazy-family/camera.test.mjs`

Expected: the new visual-envelope test fails.

- [ ] **Step 3: Implement camera-only containment**

Clamp/shorten the camera boom or constrain its final position; never alter the player's requested position or movement vector. Preserve existing blocker trace behavior.

- [ ] **Step 4: Run GREEN**

Run:
```bash
node --test tests/crazy-family/camera.test.mjs
node --test tests/crazy-family/movement.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/camera.js tests/crazy-family/camera.test.mjs
git commit -m "feat: keep cinematic camera inside authored home"
```

---

### Task 8: Real-Browser Acceptance, Visual Gate, Versioning, and Publication

**Files:**
- Modify: `tests/crazy-family/browser-smoke.mjs`
- Modify: `crazy-family.html`
- Create: `.github/workflows/test-crazy-family-v042-cinematic-set.yml`

**Interfaces:**
- Consumes: complete cinematic set from Tasks 1–7.
- Produces: browser screenshot artifact, automated gameplay proof, v0.42 public marker, and a publishable commit only after visual acceptance.

- [ ] **Step 1: Extend browser smoke assertions**

The smoke test must assert:
- WebGL context is alive;
- `scene.visualMode === 'cinematic'`;
- all required cinematic semantic layer IDs exist;
- conflicting procedural sofa/table visuals are not visible as the primary set;
- Libi moves in at least two independent floor directions;
- jump raises world Y and lands;
- scenario-selected headphones visual equals its interaction coordinates;
- at least one authored foreground/furniture occluder can render in front of Libi at a known test position;
- Dad visual exists and its navigation state remains active.

- [ ] **Step 2: Capture a deterministic screenshot artifact**

Save: `artifacts/crazy-family-v042-cinematic-set.png`.

The screenshot should use a stable initial scenario seed/query switch where necessary so visual comparison is meaningful.

- [ ] **Step 3: Run the full verification locally/CI**

Run:
```bash
python scripts/test-crazy-family-v042-assets.py
node --test tests/crazy-family/*.test.mjs
node --check crazy-family/cinematic-set.js
node --check crazy-family/cinematic-occlusion.js
node --check crazy-family/contact-effects.js
node --check crazy-family/scene.js
node --check crazy-family/game.js
npx playwright test --version || true
# serve repo, then:
node tests/crazy-family/browser-smoke.mjs
```

Expected: all game tests pass, syntax passes, browser smoke passes, screenshot artifact is produced.

- [ ] **Step 4: Perform the mandatory visual gate**

Compare the fresh real-browser screenshot to the approved reference. Reject publication if any of these dominate the frame:
- obvious primitive boxes/cylinders replacing the reference-quality furniture;
- flat single-background look with no meaningful depth/occlusion;
- floating Libi/Dad/items with weak floor contact;
- missing warm golden-hour light direction;
- sparse room detail compared with the reference;
- visible noncanonical people or baked gameplay items.

- [ ] **Step 5: Update public version marker only after visual acceptance**

Change the game subtitle in `crazy-family.html` from `v0.41` to `v0.42` and add a cache-bust marker/comment such as `HYBRID_CINEMATIC_SET_V042`.

- [ ] **Step 6: Add focused CI workflow**

`.github/workflows/test-crazy-family-v042-cinematic-set.yml` should install Node/Playwright as needed, run the asset contract, all Crazy Family node tests, JS syntax checks, browser smoke, and upload the screenshot artifact. It must not auto-overwrite unrelated files or assume unrelated site workflows are green.

- [ ] **Step 7: Fresh final verification**

Run the complete Task 8 command set again after the version/workflow edit. Record the exact passing counts and workflow run ID before claiming completion.

- [ ] **Step 8: Commit**

```bash
git add crazy-family.html tests/crazy-family/browser-smoke.mjs .github/workflows/test-crazy-family-v042-cinematic-set.yml
git commit -m "feat: ship Crazy Family hybrid cinematic home v0.42"
```

- [ ] **Step 9: Integrate over the latest `main` without overwriting parallel work**

Fetch current `main`, replay/rebase the v0.42 commits over it, rerun the focused verification, then update `main` only if the lease/current-head check still matches. Do not force unrelated changes away.

- [ ] **Step 10: Verify GitHub Pages deployment**

Confirm the Pages build/deploy for the integrated commit succeeds before sending the live link.

---

## Self-Review Notes

- **Spec coverage:** The plan covers authored layered assets, hidden gameplay geometry, semantic anchor alignment, scenario items, spatial occlusion, contact treatment, camera envelope, browser performance, visual acceptance, and publication gating.
- **Type consistency:** `createCinematicSet()` is the single asset/visual-set boundary; `resolveCinematicOcclusion()` only decides layer ordering; `contactEffects` only grounds dynamic actors/items. Gameplay ownership remains outside all three modules.
- **YAGNI:** No HUD redesign, no character redesign, no second renderer, no rewrite of movement/Dad/attacks/audio, and no arbitrary high layer count.
- **Highest-risk requirement:** Task 2's authored art quality is the gating dependency. Coding must not be used to rationalize a weak asset pack; visual acceptance happens before and after integration.
