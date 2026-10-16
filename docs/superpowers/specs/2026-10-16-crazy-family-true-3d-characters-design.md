# Crazy Family — True 3D Characters Design

Date: 2026-10-16
Status: Approved direction, written spec for review
Target slice: v0.47

## 1. Goal

Remove the flat-character look from `crazy-family.html` by replacing the current projected sprite characters with true 3D character bodies and a real perspective third-person camera, while preserving the gameplay systems that already work.

The acceptance test is visual and structural: when Libi or Dad turns, the player must be able to read front / side / back depth from the model itself. Neither character may be a `PlaneGeometry`, billboard, camera-facing card, or screen-projected sprite in the true-3D path.

## 2. Current state and exact problem

The current gameplay logic already tracks Libi and Dad in logical world coordinates (`x/y/z`) and the existing movement, Dad AI, attacks, audio, stamina, interactions, and collision systems depend on those logical positions.

The visible character path is still flat:

- `crazy-family/characters.js` creates each actor with `THREE.PlaneGeometry` and a sprite-sheet texture.
- `crazy-family/game.js` converts logical world positions through `sceneHandle.projectWorld(...)` before drawing actors.
- `crazy-family/scene.js` uses an `OrthographicCamera` for the cinematic screen-stage.
- `crazy-family/cinematic-projection.js` performs fake depth scaling and floor projection for that 2D presentation.

That architecture is the reason the characters appear pasted into the room even though their gameplay state is already spatial.

## 3. Scope

### In scope for v0.47

- Add a true-3D render path behind an explicit renderer switch.
- Libi becomes a true 3D mesh hierarchy with visible depth from every viewing direction.
- Dad becomes a true 3D mesh hierarchy with visible depth from every viewing direction.
- Add a perspective third-person camera that follows Libi in world space.
- Feed character visuals directly from logical world positions; no cinematic projection for actors in the true-3D path.
- Preserve all current gameplay state and systems: movement, run, crouch, jump, stamina, Dad AI, song timing, Dad attacks, spatial audio, damage, inventory, interactions, scenario spawn logic, and retained v0.46 audio behavior.
- Preserve the existing v0.46 screen-stage path as a safe fallback.
- Add automated regression tests proving that the 3D path does not instantiate sprite planes and does not call the cinematic character projection path.

### Out of scope for this slice

- Rebuilding the full living room as final native 3D geometry.
- Re-authoring every furniture asset.
- Rewriting gameplay physics or Dad AI.
- Final production-quality sculpted character art.
- Facial animation, lip sync, fingers, cloth simulation, or inverse kinematics.
- Removing the current cinematic renderer before the new path is accepted.

## 4. Character art strategy

v0.47 uses authored procedural low-poly 3D proxy characters built from real volumetric Three.js geometry. They are not placeholder cards.

The proxy must preserve the approved identity cues strongly enough that the player can immediately distinguish Libi and Dad:

### Libi

- child proportions and smaller world scale,
- brown hair with two pigtail masses,
- pink flower accent,
- coral/pink top,
- teal/turquoise overalls,
- striped sock cue,
- pink high-top shoe cue.

### Dad

- visibly taller and broader than Libi,
- dark-brown tousled hair,
- stubble/beard cue,
- teal/blue-green overshirt,
- light undershirt,
- pajama-pants silhouette,
- brown slipper cue.

The proxy is a technical and visual 3D milestone, not the final locked sculpt. The current approved sprite art remains available as fallback and must not be deleted.

The character interface must be asset-agnostic so later GLB/GLTF rigged models can replace the procedural proxies without changing gameplay code.

## 5. Renderer selection and safety

Introduce a renderer mode selector with two modes:

- `cinematic` — current v0.46 screen-stage behavior.
- `native3d` — new true-3D character/camera path.

During development and acceptance, `native3d` is enabled with `?renderer=3d`. The default route remains the stable current renderer until the new path passes tests and visual approval.

If the new path cannot initialize WebGL or throws during startup, the bootstrap layer must fall back to the current cinematic renderer rather than leaving a blank game.

## 6. New 3D character interface

Create a new focused module, `crazy-family/characters-3d.js`.

It exports:

```js
createCharacter3D({ scene, kind })
```

The returned handle exposes:

```js
{
  root,
  setTransform({ position, facing, state, speed, grounded }),
  update(dt, now),
  setVisible(value),
  dispose()
}
```

`root` is a real `THREE.Group` containing volumetric meshes. No `PlaneGeometry` is allowed anywhere in the actor hierarchy.

`setTransform(...)` consumes logical world coordinates directly. It must not consume `projectWorldToCinematicStage(...)` output.

The module owns visual animation only. It does not own movement, collision, Dad behavior, damage, inventory, or audio.

## 7. Procedural character construction

The first volumetric models are assembled from a small number of Three.js primitives with shared materials and named body groups:

- torso,
- head,
- hair,
- upper/lower arms,
- upper/lower legs,
- shoes,
- character-specific clothing/accent meshes.

Limbs are parented so simple procedural animation can rotate joints without changing gameplay positions.

Required states:

- `idle` / `ground`,
- `walk`,
- `run`,
- `jump`,
- `crouch`,
- Dad `chase`,
- Dad `sing`,
- Dad `pant`,
- Dad `yawn`,
- Dad `sneeze`.

Animation may be simple but must read as volumetric motion: opposing arm/leg swing while moving, body bob, jump pose, crouch compression, and Dad song sway.

## 8. Native 3D scene path

Create `crazy-family/scene-3d.js` as the native scene owner.

Responsibilities:

- create `THREE.WebGLRenderer`,
- create a `THREE.PerspectiveCamera`,
- create native world-space lighting,
- provide a stable floor and simple world-space reference geometry sufficient to ground the characters,
- expose scene/camera/renderer handles,
- resize correctly,
- apply camera poses,
- render and dispose resources.

The existing cinematic room may remain visible only if it can be used as a non-authoritative background without re-flattening actor coordinates. The native path must not project actors into that image plane.

For v0.47, a simplified floor / room envelope is acceptable if needed to prove true 3D characters and camera behavior. The goal of this slice is to remove flat actors, not to finish the entire native 3D house.

## 9. Third-person camera

Add a native camera controller interface or native branch to the existing controller.

The target behavior:

- perspective camera,
- follows behind and above Libi,
- uses Libi world position as the anchor,
- looks slightly ahead of Libi rather than directly at her feet,
- smooths position and target movement,
- chase mode pulls back modestly when Dad is close or singing,
- no manual mouse-look in this slice.

The camera must make character depth obvious. It may not be orthographic in `native3d` mode.

## 10. Game-loop integration

`crazy-family/game.js` remains the gameplay coordinator.

The new renderer path changes only the visual integration point:

### Current cinematic actor flow

`logical position -> projectWorld(...) -> sprite PlaneGeometry`

### New native3d actor flow

`logical position -> createCharacter3D.setTransform(...) -> volumetric meshes`

The current movement state, Dad frame, song state, attack state, interaction resolution, stamina, audio, and retained-system calls stay authoritative.

The true-3D path must not duplicate or fork gameplay rules.

## 11. Facing and animation rules

Character facing is world-space rotation around Y, not negative X scale on a sprite.

For Libi:

- derive facing direction from horizontal velocity when moving,
- retain last facing while idle,
- rotate smoothly enough to avoid instant 180-degree snapping.

For Dad:

- use the direction already provided by the Dad controller / target relation,
- heavier turn smoothing than Libi.

Animation speed follows logical movement speed so footsteps and body motion remain visually coherent.

## 12. Lighting and grounding

Both characters must share the same 3D lighting environment.

Minimum lighting:

- hemisphere/ambient fill,
- warm directional key,
- soft shadows enabled.

Both actor roots cast shadows. The floor receives shadows.

This is mandatory because contact shadow and changing surface shading are primary cues that the characters are no longer flat cards.

## 13. Backward compatibility

The following must remain unchanged in behavior in cinematic mode:

- v0.46 Libi contextual audio mapping,
- Dad song and pre-song behavior,
- Dad attack cadence and damage,
- stamina,
- controls,
- current scenario spawning,
- inventory and headphones goal,
- interaction prompts,
- mobile controls.

The existing `characters.js`, `cinematic-projection.js`, and cinematic scene code remain until native3d is accepted.

## 14. Tests

Add regression coverage for the new path.

Required automated assertions:

1. `createCharacter3D` returns a `THREE.Group` with volumetric child geometry.
2. No descendant geometry type is `PlaneGeometry`.
3. Libi and Dad have different configured heights/scales, with Dad larger.
4. `setTransform` writes logical `x/y/z` directly to the actor root.
5. Facing changes `rotation.y`, not signed sprite scale.
6. Native scene camera is `PerspectiveCamera`.
7. `?renderer=3d` selects native3d while the default remains cinematic during acceptance.
8. Native actor updates do not call `projectWorldToCinematicStage`.
9. Existing v0.46 audio tests continue to pass.
10. Existing movement / Dad / attack tests continue to pass.

## 15. Acceptance checklist

The milestone is accepted when all of the following are true:

- opening the game with `?renderer=3d` shows Libi and Dad as actual volumetric characters,
- rotating/moving around them visibly reveals side and back depth,
- the camera is perspective and follows Libi in third person,
- Libi can walk, run, jump, and crouch without reverting to screen projection,
- Dad can chase and sing while remaining volumetric,
- existing audio and gameplay still work,
- shadows visibly ground both characters,
- current stable renderer still works without the query flag,
- automated regression suite passes.

## 16. Follow-up after v0.47

After this slice is visually approved, the next milestone is to replace the cinematic environment layers with native room geometry and furniture while keeping the same logical world and 3D character interfaces.

A later character-art milestone can swap the procedural models for final rigged GLB/GLTF assets without changing gameplay code.
