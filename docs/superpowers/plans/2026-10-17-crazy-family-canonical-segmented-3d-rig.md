# Crazy Family Canonical Segmented 3D Rig Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `canonical-3d-stack` presentation in the Crazy Family `world3d` renderer with an articulated segmented rig that preserves the locked Libi and Dad artwork while adding independent limb motion and controlled world-space depth.

**Architecture:** Keep the public character-visual API and a stable world3d root `THREE.Group`. The root starts with the existing canonical stack as a safe fallback; an asynchronous segmented rig is built from frame 0 of the locked sprite sheet and swaps into that same root when ready, so `game.js` keeps the same mesh reference and gameplay ownership. Rig construction, profile metadata, pose animation and orientation are isolated from movement, AI, attacks, audio and collision.

**Tech Stack:** JavaScript ES modules, Three.js, browser Canvas 2D for one-time texture extraction, Node 22 test runner, Playwright 1.55 Chromium smoke tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-17-crazy-family-canonical-segmented-3d-rig-design.md`

## Global Constraints

- Libi asset remains exactly `assets/libi-sprites-v025.png` with the existing canon-lock blob SHA.
- Dad asset remains exactly `assets/crazy-family/dad-sprites-v028.png` with the existing canon-lock blob SHA.
- Rig source frame is frame index `0` for both characters.
- Visible yaw is clamped to `±25°` from camera-facing yaw.
- No invented face, hair, clothing, accessory or unseen back/side design.
- Back surfaces reuse the canonical part texture mirrored horizontally.
- Side material color is derived once from opaque edge pixels of that canonical part.
- `cinematic` rendering stays unchanged.
- Existing movement, Dad AI, attacks, songs, damage, stamina, interaction and collision code stay authoritative.
- No new network dependency and no new 3D runtime dependency beyond the existing Three.js stack.
- If segmented-rig initialization fails, `world3d` falls back to the existing canonical stack; it never substitutes a generic character.

## Review Focus

- **Incomplete or delayed image load:** the game must remain playable on the canonical stack until the segmented rig becomes ready, and a failed load must leave the fallback intact.
- **Extreme camera orbit:** visible character yaw must stay within 25° of camera-facing yaw rather than exposing an invented full side/back.
- **Rapid state changes:** walk → run → jump → crouch must not accumulate transforms or leave joints in a previous state.
- **Mobile resize / slow device:** texture extraction must happen only once per character and no per-frame canvas work may appear.
- **Canon tampering:** any runtime asset override or mismatched canonical path must still fail closed before rig construction.

---

### Task 1: Canonical rig profiles and deterministic geometry metadata

**Files:**
- Create: `crazy-family/character-rig-profile.js`
- Create: `tests/crazy-family/canonical-segmented-rig.test.mjs`

**Interfaces:**
- Consumes: `kind` values `libi` and `dad`.
- Produces: `CHARACTER_RIG_PART_NAMES`, `CHARACTER_RIG_PROFILES`, and `getCharacterRigProfile(kind)`.
- Each profile exposes `sourceFrame`, `readableYawLimitRadians`, `parts`, and `motion`.

- [ ] **Step 1: Write the failing profile contract test**

Add tests asserting:

```js
assert.equal(getCharacterRigProfile('libi').sourceFrame, 0);
assert.equal(getCharacterRigProfile('dad').sourceFrame, 0);
assert.equal(getCharacterRigProfile('libi').readableYawLimitRadians, 25 * Math.PI / 180);
assert.deepEqual(CHARACTER_RIG_PART_NAMES, [
  'torso','head',
  'leftUpperArm','leftLowerArm','rightUpperArm','rightLowerArm',
  'leftUpperLeg','leftLowerLeg','rightUpperLeg','rightLowerLeg',
]);
```

Also assert every part has normalized crop coordinates in `[0,1]`, positive depth, a pivot, and overlap metadata; assert Dad and Libi have separate motion profiles; assert unknown `kind` throws.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: FAIL because `character-rig-profile.js` and its exports do not exist.

- [ ] **Step 3: Implement the profile module**

Create:

```js
export const CHARACTER_RIG_PART_NAMES = Object.freeze([...]);
export const CHARACTER_RIG_PROFILES = Object.freeze({ libi: ..., dad: ... });
export function getCharacterRigProfile(kind) { ... }
```

Use frame `0`, yaw limit `25 * Math.PI / 180`, normalized crops/pivots, per-part shallow depth, overlap margins, z-order and per-character idle/walk/run/jump/crouch amplitudes. Do not put asset paths or SHAs in this file.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: PASS for profile-contract tests.

- [ ] **Step 5: Commit**

```bash
git add crazy-family/character-rig-profile.js tests/crazy-family/canonical-segmented-rig.test.mjs
git commit -m "feat(crazy-family): define canonical segmented rig profiles"
```

---

### Task 2: Build segmented parts from the locked canonical image

**Files:**
- Create: `crazy-family/character-rig.js`
- Modify: `tests/crazy-family/canonical-segmented-rig.test.mjs`

**Interfaces:**
- Consumes: `getCharacterRigProfile(kind)`, canonical metadata from `character-canon.js`, and a loaded canonical image/texture source.
- Produces: `createCanonicalSegmentedRig({ kind, canonical, sourceImage, documentRef }) -> { root, parts, setPoseState, setFrame, faceCamera, dispose }`.
- `root.userData.renderMode` must be `canonical-segmented-rig`.

- [ ] **Step 1: Extend the failing test for rig structure**

Assert the source contains/exports the factory, uses only `canonical.asset`, records `canonical.version`, and exposes all semantic part names. Add a pure helper test for crop-to-pixel conversion so normalized crop values deterministically map inside one frame of the 5×2 sheet.

Also pin the performance rule: extracted part canvases/textures are created during initialization only; the pose/update path must not call `drawImage` or create a canvas.

- [ ] **Step 2: Run focused test and verify RED**

Run: `node --test tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: FAIL because `character-rig.js` does not exist.

- [ ] **Step 3: Implement canonical part extraction and shallow 3D meshes**

Implement:

```js
export function cropRectToPixels(crop, frame, imageWidth, imageHeight, columns, rows) { ... }
export async function createCanonicalSegmentedRig({ kind, canonical, sourceImage, documentRef = document }) { ... }
```

For each part:
- extract only from frame index `0` of `canonical.asset`;
- create the transparent front part texture once;
- reuse/mirror it for the back surface;
- derive one side color from opaque edge pixels;
- construct a shallow `THREE.BoxGeometry` or equivalent closed shallow segment with the canonical front/back visible surfaces;
- attach it beneath a named pivot `THREE.Group`;
- enable cast/receive shadow;
- store semantic references in `parts`.

The returned root must contain no generic replacement art and must preserve the canonical asset/version metadata.

- [ ] **Step 4: Add the incomplete-image failure test**

Make the factory reject a missing/zero-size source image with a scoped error such as `Crazy Family segmented rig: canonical image unavailable`; do not create substitute geometry.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/character-rig.js tests/crazy-family/canonical-segmented-rig.test.mjs
git commit -m "feat(crazy-family): build rig from locked canonical sprites"
```

---

### Task 3: Procedural articulation and readable orientation

**Files:**
- Modify: `crazy-family/character-rig.js`
- Modify: `tests/crazy-family/canonical-segmented-rig.test.mjs`

**Interfaces:**
- `setPoseState({ state, timeSeconds, speed, grounded, crouching, facing, movementYaw })` mutates only rig transforms.
- `faceCamera({ cameraPosition, characterPosition, movementYaw })` applies the ±25° readable-yaw rule.
- `setFrame(frame)` records the requested legacy frame without changing the segmented source image.

- [ ] **Step 1: Write failing animation tests**

Test the pure pose calculation/helper output rather than WebGL pixels:

- idle produces only bounded breathing/head offsets;
- walk rotates left arm opposite left leg and right arm opposite right leg;
- run amplitude is strictly greater than walk amplitude for the same phase;
- jump changes torso/leg pose without changing root world position;
- crouch lowers the visible hips/root presentation and bends knees;
- applying idle after run resets joints rather than retaining accumulated rotations;
- Dad and Libi use different motion amplitudes from their profiles.

- [ ] **Step 2: Write failing yaw-clamp tests**

For camera-facing yaw `0`, assert movement requests of `+90°` and `-90°` resolve to at most `+25°` and `-25°`. Test wraparound near `±π` so the shortest angular delta is used.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --test tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: FAIL on missing pose/orientation implementation.

- [ ] **Step 4: Implement pose and orientation helpers**

Expose pure helpers for tests, then have the runtime rig apply their results to pivots. Every update starts from the profile's neutral pose before state accents are applied so rapid transitions cannot accumulate stale transforms.

The visible root yaw is camera-facing yaw plus a clamped shortest-angle delta in `[-25°, +25°]`; the unclamped movement yaw may still drive torso/hip counter-rotation internally.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/character-rig.js tests/crazy-family/canonical-segmented-rig.test.mjs
git commit -m "feat(crazy-family): animate segmented canonical rig"
```

---

### Task 4: Integrate the rig behind the existing character-visual API with safe fallback

**Files:**
- Modify: `crazy-family/characters.js`
- Modify: `tests/crazy-family/canonical-3d-characters.test.mjs`
- Modify: `tests/crazy-family/canonical-segmented-rig.test.mjs`

**Interfaces:**
- `createCharacterVisual(options)` stays synchronous and returns the existing public methods: `mesh`, `setPose`, `setFrame`, `faceCamera`, `setVisible`, `dispose`.
- For `world3d`, `mesh` is a stable root `THREE.Group`; its children transition from `canonical-3d-stack` fallback to `canonical-segmented-rig` when rig initialization succeeds.
- Add `ready` Promise only as optional diagnostic/test surface; gameplay does not need to await it.

- [ ] **Step 1: Write failing integration tests**

Assert:
- `cinematic` still selects `canonical-sprite`;
- `world3d` creates a stable root and starts with canonical stack fallback;
- successful initialization changes `root.userData.renderMode` to `canonical-segmented-rig` without replacing the root reference;
- initialization rejection logs a scoped warning and leaves `canonical-3d-stack` active;
- asset override rejection still occurs before async rig work starts;
- `setFrame()` continues to work on cinematic/fallback and only records the requested frame on the segmented rig.

- [ ] **Step 2: Run integration tests and verify RED**

Run: `node --test tests/crazy-family/canonical-3d-characters.test.mjs tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: FAIL because `characters.js` still owns only sprite/stack rendering.

- [ ] **Step 3: Refactor `characters.js` around the stable world3d root**

Keep the existing stack builder as a private fallback. For world3d:
1. create one stable root group carrying canonical metadata;
2. attach the existing stack inside it immediately;
3. load the already locked canonical image;
4. call `createCanonicalSegmentedRig(...)` once;
5. on success dispose/remove only fallback children and attach the rig beneath the same root;
6. on failure preserve the stack and log one scoped warning.

Delegate pose/frame/camera/dispose behavior to the active presentation without changing gameplay state or collisions.

- [ ] **Step 4: Run focused integration tests and verify GREEN**

Run: `node --test tests/crazy-family/canonical-3d-characters.test.mjs tests/crazy-family/canonical-segmented-rig.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run the entire Crazy Family Node suite**

Run: `node --test tests/crazy-family/*.test.mjs`

Expected: all tests PASS, including audio, Dad, attacks, movement, renderer and canon-lock contracts.

- [ ] **Step 6: Commit**

```bash
git add crazy-family/characters.js tests/crazy-family/canonical-3d-characters.test.mjs tests/crazy-family/canonical-segmented-rig.test.mjs
git commit -m "feat(crazy-family): activate segmented rig in world3d"
```

---

### Task 5: Browser acceptance, visual evidence and CI gate

**Files:**
- Modify: `tests/crazy-family/browser-world3d-smoke.mjs`
- Modify only if needed: `.github/workflows/crazy-family-world3d-milestone-a.yml`

**Interfaces:**
- Browser diagnostics read `window.__crazyFamilyMovieSetGame.playerVisual.mesh` and `dadVisual.mesh` without changing gameplay behavior.
- Screenshot artifact remains `artifacts/crazy-family-world3d-milestone-a.png` unless a new clearly named segmented-rig artifact is added to the same workflow.

- [ ] **Step 1: Extend browser smoke assertions**

After game load, wait for both stable roots to report `userData.renderMode === 'canonical-segmented-rig'`. Assert semantic descendants exist for torso, head, arms and legs; assert `canonicalAssetUrl` still equals the locked path for Libi/Dad.

Capture initial joint rotations, hold movement to produce walk/run, then assert opposite arm/leg motion changes. Trigger jump and crouch and assert visible rig transforms change while the existing player position/capsule remains authoritative.

- [ ] **Step 2: Add extreme-orbit and mobile checks**

Orbit the camera far enough to request an unsupported side view and read the rig's camera-facing delta diagnostic; assert absolute visible delta `<= 25° + epsilon`. Resize to `430×820`; assert rig remains visible and WebGL context remains valid.

- [ ] **Step 3: Run local browser acceptance**

Run:

```bash
node --test tests/crazy-family/*.test.mjs
npm install --no-save --no-package-lock playwright@1.55.0
npx playwright install chromium
python -m http.server 8000 --bind 127.0.0.1
node tests/crazy-family/browser-smoke.mjs
node tests/crazy-family/browser-world3d-smoke.mjs
```

Expected: Node suite PASS; cinematic smoke PASS; world3d smoke PASS; no fatal browser console errors.

- [ ] **Step 4: Review the generated screenshot**

Open the world3d artifact and explicitly verify:
- Libi is still the approved Libi, not a redesigned character;
- Dad is still the approved Dad;
- arms/legs read as articulated rather than a single card;
- oblique view shows depth but no invented full side/back face;
- no detached limb gaps or obvious texture seams at neutral gameplay distance.

If any visual criterion fails, do not merge; adjust only profile crops/pivots/depth/motion and rerun acceptance.

- [ ] **Step 5: Verify Character Canon Lock and PR CI**

Push the branch and confirm both the Character Lock workflow and Crazy Family world3d acceptance workflow are green. A failure in unrelated repository workflows must be inspected, but it does not override a failed Crazy Family gate.

- [ ] **Step 6: Commit final acceptance changes**

```bash
git add tests/crazy-family/browser-world3d-smoke.mjs .github/workflows/crazy-family-world3d-milestone-a.yml
git commit -m "test(crazy-family): gate segmented canonical rig in Chromium"
```

---

## Final verification before merge

Run the current branch against the spec and verify all 13 acceptance points. Confirm `git diff main...HEAD` contains no changes to the canonical PNG files, `movement.js`, `dad.js`, `attacks.js`, or `audio.js`. Re-run `node --test tests/crazy-family/*.test.mjs`, the two Playwright smoke tests, Character Canon Lock, and screenshot review immediately before merging.
