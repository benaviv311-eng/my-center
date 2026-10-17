# Crazy Family — Canonical Segmented 3D Rig Design

Date: 2026-10-17
Status: Design approved in chat; written spec awaiting user review
Target: Crazy Family `world3d` renderer

## 1. Goal

Replace the current `canonical-3d-stack` character presentation with a segmented articulated rig that gives Libi and Dad independent head, torso, arm and leg motion while preserving their approved visual identity.

The visual target is the readable, expressive third-person character motion associated with polished family adventure games, while the character designs themselves remain exactly the Crazy Family canon.

Success means:

- Libi still reads immediately as the approved Libi character.
- Dad still reads immediately as the approved Dad character.
- Walking, running, jumping and crouching visibly articulate limbs instead of moving one flat card.
- Oblique camera angles reveal real depth and do not collapse the character to a line.
- Existing movement, Dad AI, songs, attacks, damage, stamina and interactions continue to use the current game logic.
- The existing cinematic renderer remains unchanged as a fallback.

## 2. Canon is immutable

The rig must use the currently locked canonical assets only:

- Libi: `assets/libi-sprites-v025.png`
- Dad: `assets/crazy-family/dad-sprites-v028.png`

The existing `character-canon.js` asset path, version and Git blob SHA contract remains authoritative. Runtime asset overrides remain rejected.

No implementation in this milestone may redraw or replace:

- face
- hair
- clothing
- body colors
- character proportions
- identifying accessories

The front-facing visible surfaces of the rig must be sampled from the canonical sprite asset itself.

## 3. Important limitation

A source sprite sheet does not contain complete unseen 360-degree surface information. Therefore this milestone is an articulated canonical 2.5D/3D hybrid rig, not a fully sculpted 360-degree character model.

It will provide real world-space depth, articulated body parts and convincing third-person movement at normal gameplay camera angles. It will not invent a new back-of-head, side-face or clothing design that is absent from the approved source art.

A later true-360 milestone would require approved multi-view turnarounds or an explicitly approved canonical 3D model.

## 4. Architecture

### 4.1 Existing interfaces stay stable

`game.js` continues to call the character visual through the existing interface:

- `setPose(...)`
- `setFrame(...)`
- `faceCamera(...)`
- `setVisible(...)`
- `dispose()`

Game-state code must not learn about bones, body parts or rig internals.

### 4.2 New module: `crazy-family/character-rig.js`

This module owns articulated world3d character construction and animation.

It creates a root `THREE.Group` with these semantic parts:

- root
- torso
- head
- leftUpperArm
- leftLowerArm
- rightUpperArm
- rightLowerArm
- leftUpperLeg
- leftLowerLeg
- rightUpperLeg
- rightLowerLeg

Hands remain visually attached to lower-arm regions. Feet remain visually attached to lower-leg regions in this milestone.

Each part is a shallow 3D segment with:

- canonical front texture cut from the approved sprite source
- matching back surface using the same canonical pixels where possible
- shallow side depth using neutral edge material derived from the canonical part, never a newly designed costume texture
- its own pivot group for joint rotation
- shadow casting enabled

### 4.3 New module: `crazy-family/character-rig-profile.js`

This module contains geometry metadata only, not replacement art.

For each character it defines normalized values for:

- source frame used as the canonical rig base
- crop rectangles for each body part
- joint/pivot positions
- depth per part
- overlap margins so joints do not open visible gaps
- default z-order between parts
- per-character motion amplitudes

The profile may differ between Libi and Dad because their approved proportions differ.

The asset path and asset identity do not live here; those remain in `character-canon.js`.

### 4.4 Runtime texture extraction

The rig uses the approved sprite sheet as its only visible source.

At initialization:

1. Load the canonical texture.
2. Select the approved neutral source frame from the 5x2 sheet.
3. Extract each part using normalized crop data.
4. Create a transparent part texture on an offscreen canvas.
5. Apply that texture to the part's front/back mesh surfaces.

No generated image model, replacement PNG or external character asset is introduced.

## 5. Renderer behavior

### `cinematic`

Unchanged. It keeps the current canonical sprite path.

### `world3d`

`characters.js` delegates construction to `character-rig.js` instead of `createCanonical3DStack()`.

The old stack implementation remains available behind an internal fallback during development until the new rig passes acceptance tests, then may be removed in a later cleanup.

## 6. Character orientation

The character root is oriented in world space according to movement direction rather than behaving as a full billboard.

To protect visual identity from unsupported extreme angles:

- normal gameplay yaw is allowed
- the camera-facing correction is limited, not absolute
- the rig avoids showing an invented fully lateral facial surface
- if camera yaw exceeds the approved readable range, the root blends toward a canonical readable angle instead of exposing a nonexistent side design

This preserves real movement direction while keeping the approved face readable.

## 7. Animation model

Animation is procedural and driven from existing gameplay state. No gameplay logic is moved into the rig.

### Idle

- subtle torso breathing
- small head settling motion
- relaxed arm offset

### Walk

- opposite arm/leg swing
- moderate hip rotation
- planted feet
- light torso counter-rotation

### Run

- larger arm/leg swing
- stronger forward torso lean
- faster cadence
- clear Dad-vs-Libi amplitude differences

### Jump

- takeoff compression
- arms react upward/back according to character profile
- legs tuck slightly in air
- landing compression before returning to locomotion

### Crouch

- hips lower
- knees bend through upper/lower leg pivots
- torso leans slightly forward
- arms remain readable and do not clip through torso

### Dad song / chase states

Dad's existing retained state remains authoritative. The rig maps those states to pose accents only; it does not alter song timing, attacks or AI.

## 8. Frame compatibility

`setFrame()` remains supported so the external character-visual API is not broken.

For the segmented rig, frame changes may influence expression/pose accent data, but they must not swap in a different character asset.

The first implementation may use one canonical neutral source frame for the segmented surfaces and procedural motion for locomotion. Existing sprite-frame animation remains the fallback path until equivalent rig motion is verified.

## 9. Collision and gameplay separation

The rig is visual only.

The existing player capsule, Dad controller positions, attack hit checks, world collision, interactions and camera logic remain unchanged.

Visible body parts never become authoritative collision shapes in this milestone.

## 10. Performance

Targets:

- one shared source texture per character
- extracted part textures created once at initialization
- no per-frame canvas extraction
- transforms only during animation frames
- no new network dependency
- no external 3D runtime dependency beyond the existing Three.js stack

The rig must remain usable on the mobile viewport already supported by Crazy Family.

## 11. Fallback and failure behavior

If rig initialization fails for any reason:

- log a scoped Crazy Family rig warning
- fall back to the existing canonical 3D stack in `world3d`
- never fall back to an invented or generic character

If canonical asset validation fails, character creation must fail closed rather than silently replacing the art.

## 12. Files expected to change

New:

- `crazy-family/character-rig.js`
- `crazy-family/character-rig-profile.js`
- `tests/crazy-family/canonical-segmented-rig.test.mjs`
- browser/runtime acceptance coverage for the segmented rig

Modified:

- `crazy-family/characters.js`
- Crazy Family world3d acceptance workflow/tests only as needed

Not expected to change:

- `crazy-family/movement.js`
- `crazy-family/dad.js`
- `crazy-family/attacks.js`
- `crazy-family/audio.js`
- canonical image files

## 13. Acceptance tests

The change is acceptable only if all of the following are true:

1. Character Canon Lock still passes for both asset bytes.
2. `cinematic` still uses the existing canonical sprite rendering.
3. `world3d` reports `canonical-segmented-rig` for Libi and Dad.
4. The rig contains the expected semantic body parts.
5. Walk changes opposite arm/leg joint rotations.
6. Run produces a larger cadence/amplitude than walk.
7. Jump changes leg and torso pose without changing gameplay position ownership.
8. Crouch lowers the visible rig while gameplay crouch/capsule logic remains existing code.
9. No runtime asset path other than the locked canonical path is accepted.
10. Chromium world3d smoke test completes without console errors.
11. Screenshot review confirms Libi and Dad still match the approved characters and do not visually collapse at an oblique camera angle.
12. Existing Crazy Family audio and gameplay regression tests remain green.

## 14. Out of scope

This milestone does not:

- create a new Libi design
- create a new Dad design
- generate a GLB from scratch
- invent unseen facial or clothing details
- replace the living room
- rewrite game physics
- rewrite Dad AI
- change songs, attacks or abilities
- deliver unrestricted full 360-degree character inspection

## 15. Follow-up milestone

After this segmented rig is approved in the live game, a separate design can address true 360-degree models. That milestone must start from approved multi-view references/turnarounds for Libi and Dad so unseen geometry can be created without silently changing canon.
