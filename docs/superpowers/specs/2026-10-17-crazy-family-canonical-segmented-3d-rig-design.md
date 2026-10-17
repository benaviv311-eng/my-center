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
- back surface using the same canonical part texture mirrored horizontally; no alternate back design is introduced
- side surfaces using a flat material whose color is computed once from opaque edge pixels of that canonical part
- its own pivot group for joint rotation
- shadow casting enabled

### 4.3 New module: `crazy-family/character-rig-profile.js`

This module contains geometry metadata only, not replacement art.

For each character it defines normalized values for:

- source frame index
- crop rectangles for each body part
- joint/pivot positions
- depth per part
- overlap margins so joints do not open visible gaps
- default z-order between parts
- per-character motion amplitudes

For this milestone the canonical rig source frame is **frame index 0** for both Libi and Dad, matching the default first frame already used by the existing character renderer before animation advances.

The profile may differ between Libi and Dad because their approved proportions differ.

The asset path and asset identity do not live here; those remain in `character-canon.js`.

### 4.4 Runtime texture extraction

The rig uses the approved sprite sheet as its only visible source.

At initialization:

1. Load the canonical texture.
2. Select frame index 0 from the 5x2 sheet.
3. Extract each part using normalized crop data from `character-rig-profile.js`.
4. Create a transparent part texture on an offscreen canvas.
5. Apply that texture to the part's front/back mesh surfaces.
6. Compute the side-material color from the opaque edge pixels of that extracted canonical part.

No generated image model, replacement PNG or external character asset is introduced.

## 5. Renderer behavior

### `cinematic`

Unchanged. It keeps the current canonical sprite path.

### `world3d`

`characters.js` delegates construction to `character-rig.js` instead of `createCanonical3DStack()`.

The old stack implementation remains available as an internal failure fallback during this milestone. It is not removed until the segmented rig has passed live acceptance.

## 6. Character orientation

The segmented rig remains readable instead of exposing invented side/back facial detail.

Orientation rule:

1. Compute movement yaw from the current horizontal movement direction when movement is significant.
2. Compute camera-facing yaw from character position to camera position.
3. Clamp the character root's visible yaw to **±25 degrees from camera-facing yaw**.
4. Use the unclamped movement yaw to drive torso lean, hip counter-rotation and left/right gait emphasis.

This gives the body directional motion and real depth while preventing the camera from seeing an unsupported full side or back design.

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

- larger arm/leg swing than walk
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

For the segmented rig in this milestone:

- visible segmented surfaces stay sourced from canonical frame index 0
- `setFrame()` records the requested frame and may drive pose/expression accents, but does not replace the rig's source asset or create a second character design
- the existing sprite-frame animation remains available only in the cinematic and stack-fallback paths

This makes the rig deterministic while keeping the public visual API compatible.

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
10. Character visible yaw never exceeds 25 degrees from camera-facing yaw.
11. Chromium world3d smoke test completes without console errors.
12. Screenshot review confirms Libi and Dad still match the approved characters and do not visually collapse at an oblique camera angle.
13. Existing Crazy Family audio and gameplay regression tests remain green.

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
