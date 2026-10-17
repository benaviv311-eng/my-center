# Crazy Family — Fixed Overhead Room Camera + True 3D Characters

Date: 2026-10-17
Status: Design approved in chat; written spec for review
Target slice: v0.47

## 1. Goal

Turn the `?renderer=3d` version of `crazy-family.html` into an actual playable 3D game view rather than a cinematic card presentation.

The two defining requirements are:

1. **Camera A — fixed overhead 3/4 room view:** the player sees almost the entire living room at once from a high, stable perspective camera. The camera does not chase Libi, does not zoom for sprint/chase/interaction, and does not automatically change angle during gameplay.
2. **True volumetric characters:** Libi and Dad are real 3D mesh hierarchies with readable front/side/back volume. They may not be sprite cards, billboards, layered planes, or camera-facing stacks.

Success means the game feels like a small open playable world inside the living room: the room stays spatially readable while Libi moves freely through it.

## 2. Current state and exact problem

The current world3d path already has a real `THREE.PerspectiveCamera`, world-space room geometry, collisions, wood/rug ground treatment, lighting and gameplay movement.

The remaining character problem is structural:

- `crazy-family/characters.js` still builds Libi and Dad from `THREE.PlaneGeometry`.
- In world3d it creates seven sprite planes layered through a small Z depth, plus an invisible box proxy.
- The visible stack is still rotated toward the camera to keep the canonical sprite readable.
- Therefore the result is 2.5D, not a true 3D actor.

The current camera is also still a player-relative camera controller. Even after recent stabilization, its architecture is based on following a player target and supporting orbit/collision. That is not the requested room-overview presentation.

## 3. Product direction

The world3d mode should visually read closer to a **high-angle room exploration game** than a third-person action camera.

The room is the stable frame. Libi moves inside the frame.

The camera relationship is therefore:

`room -> camera`

not:

`Libi -> camera`

The player remains fully controllable in world space. Only the visual framing changes.

## 4. Scope

### In scope for v0.47

- Keep `?renderer=3d` as the acceptance path.
- Replace the current layered sprite stack with real volumetric Libi and Dad meshes.
- Preserve canonical identity cues from the locked character canon while moving to procedural 3D proxies.
- Add a fixed high 3/4 perspective camera that frames nearly the full living room.
- Camera position, rotation and target remain stable during ordinary gameplay.
- Camera does not react to sprint, Dad chase state, Dad song state, attacks, interactions or Libi movement.
- Camera may recompute framing only on viewport resize so the living room remains visible on different aspect ratios.
- Keep player movement, jump, crouch, collision, Dad AI, songs, attacks, stamina, damage, inventory, interactions, scenario logic and audio authoritative and unchanged.
- Keep cinematic mode available as fallback during acceptance.
- Preserve the Character Lock for the current approved sprite assets; the fallback sprites remain canonical and must not be altered by this work.

### Out of scope for this slice

- Final sculpted/rigged production GLB characters.
- Facial animation, lip sync, fingers, cloth physics or IK.
- Re-authoring the entire living room as production-quality furniture art.
- Rewriting movement physics or Dad AI.
- Removing cinematic mode.
- Manual orbit/mouse-look in the overhead mode.

## 5. Character canon and 3D identity

The locked canon remains the identity source:

- Libi fallback asset: `assets/libi-sprites-v025.png`
- Dad fallback asset: `assets/crazy-family/dad-sprites-v028.png`

Those files remain untouched.

The new 3D actors are procedural volumetric proxies that reproduce the main identity cues rather than texture-projecting the sprite onto planes.

### Libi identity cues

- child proportions,
- smaller overall scale than Dad,
- brown hair,
- two pigtail masses,
- pink flower accent,
- coral/pink top,
- teal/turquoise overalls,
- striped sock cue,
- pink high-top shoe cue.

### Dad identity cues

- visibly taller and broader than Libi,
- dark-brown tousled hair,
- beard/stubble cue,
- teal/blue-green overshirt,
- light undershirt,
- pajama-pants silhouette,
- brown slipper cue.

The proxy is a technical and gameplay milestone. Its interface must remain compatible with later GLB/GLTF replacement without changing gameplay code.

## 6. True 3D character module

Create or introduce a dedicated volumetric character path, preferably `crazy-family/characters-3d.js`, with this interface:

```js
createCharacter3D({ scene, kind })
```

Returned handle:

```js
{
  root,
  setTransform({ position, facing, state, speed, grounded }),
  update(dt, now),
  setVisible(value),
  dispose()
}
```

Requirements:

- `root` is a `THREE.Group`.
- Every visible body part uses volumetric geometry such as box, capsule, sphere, cylinder or rounded equivalents.
- No visible descendant may use `THREE.PlaneGeometry`.
- No billboard behavior.
- No camera-facing rotation.
- No negative-X sprite flip for facing.
- Logical world `x/y/z` is written directly to `root.position`.
- Facing is a Y-axis world rotation.

The module owns visual construction and animation only. It does not own gameplay rules.

## 7. Character hierarchy and animation

Each actor should expose named articulated groups for at least:

- torso,
- head,
- hair,
- upper/lower arms,
- upper/lower legs,
- shoes/feet,
- character-specific clothing/accent meshes.

Minimum readable states:

- idle,
- walk/run,
- jump/airborne,
- landing,
- crouch,
- Dad chase,
- Dad sing,
- Dad pant,
- Dad yawn,
- Dad sneeze.

Animation remains procedural and lightweight. Opposing arm/leg swing, body bob, crouch compression, airborne pose and Dad song sway are enough for this slice.

## 8. Fixed overhead 3/4 camera

The world3d camera is a `THREE.PerspectiveCamera` positioned high above one corner/side of the living room and aimed toward a stable room target near the center of the playable floor.

### Required behavior

- High 3/4 angle: clearly above the characters, not eye-level third person.
- Shows almost all of the living room simultaneously.
- Stable world-space position and target during gameplay.
- Stable FOV during gameplay.
- No automatic zoom based on speed.
- No chase pullback.
- No interaction close-up.
- No automatic yaw/pitch recentering.
- No pointer-drag orbit in this mode.
- Libi can move from one side of the room to another without the camera following her.

### Responsive framing

A fixed camera may still need deterministic resize adaptation so the room is not cropped badly on a narrow/mobile viewport.

Resize adaptation may change **only one controlled framing parameter** (for example distance or FOV) from a predefined range based on viewport aspect ratio. It must not depend on gameplay state or character position.

The visual result should still feel like one fixed room camera.

## 9. Camera collision policy

Because the overhead camera is room-anchored rather than player-following, normal player-relative camera collision is unnecessary.

The camera should be placed outside/above furniture occluders by design. If a wall would block the room, that wall may use the existing occlusion/fade mechanism or be omitted from the rendered envelope for this camera.

Do not let furniture collision move the camera during play. The frame itself must remain stable.

## 10. Native scene integration

The existing `crazy-family/scene-3d.js` remains the native scene owner.

It keeps:

- `THREE.WebGLRenderer`,
- `THREE.PerspectiveCamera`,
- wood floor and rug treatment,
- native lights and shadows,
- room/furniture geometry,
- resize/render/dispose lifecycle.

The character integration changes from:

`logical position -> layered canonical sprite planes -> face camera`

into:

`logical position -> volumetric actor root -> world rotation`

No cinematic projection is allowed in the native actor path.

## 11. Game-loop integration

The existing gameplay loop remains authoritative.

World3d may either use the existing `game.js` coordinator with a 3D character adapter, or a focused `game-3d.js` adapter that imports and reuses the same gameplay systems. It must not duplicate movement, Dad logic, attack cadence, stamina or interaction rules.

Character state strings are mapped into the visual animator, while logical positions and collisions remain unchanged.

The fixed camera is applied independently from Libi position.

## 12. Facing and movement readability

Libi:

- movement direction determines Y rotation while moving,
- idle keeps the last finite facing,
- turns are smoothed enough to avoid instant snapping,
- front/side/back silhouette must remain readable from the overhead camera.

Dad:

- uses his controller/target direction for facing,
- rotates around Y,
- uses slightly heavier turn smoothing,
- remains clearly larger than Libi.

## 13. Lighting and grounding

Both characters share the room's existing 3D lighting.

Minimum requirements:

- hemisphere/ambient fill,
- warm directional key,
- soft character shadows,
- floor receives shadows.

Shadows and changing surface lighting are mandatory depth cues for the volumetric actors.

## 14. Backward compatibility and Character Lock

This work must not modify:

- `assets/libi-sprites-v025.png`,
- `assets/crazy-family/dad-sprites-v028.png`,
- their Character Lock hashes unless the user explicitly requests `Update canonical character`.

Cinematic mode must retain current behavior for:

- Libi contextual audio,
- Dad song/pre-song behavior,
- Dad attacks/damage,
- stamina,
- controls,
- scenario spawning,
- inventory/headphones goal,
- interaction prompts,
- mobile controls.

## 15. Automated tests

Required assertions:

1. `createCharacter3D` returns a `THREE.Group`.
2. No visible descendant geometry is `PlaneGeometry`.
3. Libi and Dad are differently proportioned, with Dad larger.
4. `setTransform` writes world `x/y/z` directly.
5. Facing changes `rotation.y` rather than sprite scale.
6. Zero-speed idle preserves a finite last facing.
7. World3d uses a `PerspectiveCamera`.
8. Overhead camera position/target/FOV do not change when Libi moves, sprints, Dad chases/sings, or an interaction becomes active.
9. Resize adaptation depends only on viewport dimensions/aspect ratio.
10. Native actor code contains no `faceCamera`/billboard dependency.
11. Native actor code contains no cinematic projection dependency.
12. Character Lock tests continue to pass.
13. Existing movement/Dad/attack/audio regressions continue to pass.
14. Browser smoke verifies both volumetric actors render and the fixed room view survives movement around furniture.

## 16. Browser acceptance

The milestone is accepted when `crazy-family.html?renderer=3d` demonstrates all of the following:

- the camera starts high above the living room at a 3/4 angle,
- nearly the whole living room is visible in one stable frame,
- walking Libi across the room does not move or re-angle the camera,
- sprint/chase/song/interaction do not change the camera framing,
- Libi is visibly volumetric from the fixed view,
- turning Libi changes actual 3D orientation and reveals side/back form,
- Dad is also volumetric and remains larger,
- Libi can walk, run, jump and crouch with the same gameplay collisions,
- Dad can chase/sing/attack with existing behavior,
- both characters cast contact shadows onto the room floor,
- no sprite-plane stack is visible in native mode,
- the bare `crazy-family.html` cinematic fallback still works.

## 17. Follow-up

After this acceptance slice, the next visual milestone can improve the production quality of the room and replace procedural character proxies with final rigged GLB/GLTF models while preserving the same world coordinates, camera contract and gameplay systems.
