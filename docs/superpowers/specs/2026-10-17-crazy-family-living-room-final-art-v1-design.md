# Crazy Family — Living Room Final Art v1 Design

## Status
Approved direction; written design pending implementation-plan approval.

## Goal
Transform the existing `?renderer=3d` living room from a graybox/prototype into a polished stylized game environment while preserving all existing gameplay, collision, fixed overhead camera behavior, and locked character canon.

Success means the room reads immediately as a deliberately art-directed game space rather than a set of colored primitives, even before close inspection of Libi or Dad.

## Locked constraints
- Do not change player movement, Dad AI, attacks, interaction distances, collision dimensions, nav blockers, scenario spawn logic, or world coordinates in `world.js` unless a visual-only tolerance requires an explicitly documented exception.
- Do not change the approved fixed high 3/4 overhead camera behavior.
- Do not change canonical Libi or Dad appearance in this phase.
- Do not replace or weaken Character Lock.
- Cinematic fallback remains available and must continue to render.
- Final-art objects must preserve the same semantic IDs used by gameplay (`sofa`, `coffee-table`, `side-table`, `lamp`, `rug`, `doorway`, `toy-ball`, etc.).

## Art direction
The room should use a warm, colorful, family-friendly stylized 3D language: readable silhouettes, softened forms, rounded edges, warm wood, tactile fabric, restrained saturation, soft indirect-feeling light, and small lived-in details.

The target is a polished modern family/adventure-game look, not photorealism, not Roblox-like block geometry, and not a flat illustration. Forms should remain clear from the fixed overhead 3/4 camera.

## Architectural approach
Add a dedicated visual-art layer between `world.js` and `scene-3d.js`.

`world.js` remains the authoritative gameplay description: logical positions, dimensions, collision, interactables, navigation, surfaces, and scenario anchors.

A new `living-room-art.js` module will consume world renderables and build stylized `THREE.Group` / mesh assemblies with the same semantic IDs and transforms. `scene-3d.js` will own renderer, camera, lighting, scene orchestration, and disposal, but it will no longer directly turn every descriptor into a plain `BoxGeometry`.

The art factory API should be shaped so each procedural object can later be replaced by a GLB without changing `world.js` or gameplay code. Conceptually:

```js
createLivingRoomArt({ THREE, world, materials, quality })
```

returns a root group, an `objectsById` map, and disposal hooks. A future asset-backed implementation may resolve an object ID to `assets/crazy-family/living-room/*.glb` while preserving the same outward contract.

## Final Art v1 object scope

### Sofa
Replace the single box with a grouped stylized sofa:
- lower base/body with rounded/beveled silhouette;
- separate backrest;
- two side arms;
- three seat cushions;
- soft back cushions where the camera can read them;
- existing `cushion-a` and `cushion-b` remain separately addressable/reactive;
- fabric material distinct from wood/plastic;
- visual dimensions remain within the existing gameplay collider envelope.

### Coffee table
Replace the single box with:
- rounded tabletop with visible thickness;
- four or two stylized legs/supports;
- warm wood material distinct from floor;
- subtle edge highlight/roughness variation;
- top remains visually consistent with interaction/spawn anchors.

### Side table
Use a compact rounded wood table with separated top and legs/body. Its logical top position must remain compatible with the existing headphone spawn.

### Lamp
Build an actual lamp assembly:
- base;
- stem;
- lampshade;
- warm emissive bulb/inner shade cue;
- a local warm light with conservative range/intensity so it enriches the sofa corner without flattening the whole room.

### Doorway and wall treatment
Replace the doorway slab appearance with visible frame/trim and a readable opening/threshold treatment while preserving the existing logical doorway anchor.

Walls receive warm stylized material treatment and limited trim/baseboard detail. Avoid dense realism that competes with actors.

### Rug and floor
Keep the existing warm wood/rug identity but upgrade them:
- better procedural variation;
- more believable roughness separation;
- subtle board/plank breakup;
- rug border/pattern refinement;
- no high-frequency detail that shimmers from the overhead camera.

### Toys and lived-in dressing
Upgrade the existing toy ball and toy blocks into more deliberate stylized props and add a restrained set of non-gameplay dressing objects such as books, a small basket, stacked blocks, or framed/decorative objects.

Pure dressing objects must not become colliders or interactables in v1 and must not obstruct established navigation paths.

## Materials system
Create a small reusable material palette instead of per-object one-off colors:
- warm wood;
- darker furniture wood;
- sofa fabric;
- cushion fabric variants;
- painted wall/plaster;
- rug textile;
- toy plastic;
- metal accent;
- lamp shade/emissive accent.

Use `MeshStandardMaterial` in v1 so the existing renderer pipeline remains simple and stable. Material differences should come from color, roughness, metalness where appropriate, subtle procedural maps, and lighting response rather than excessive texture noise.

The API should make a later GLB/PBR upgrade straightforward.

## Geometry strategy
Procedural final-art v1 may still use Three.js primitives internally, but no hero furniture item may remain visually equivalent to a single primitive. Furniture must be built as multi-part assemblies with softened silhouettes.

Use rounded geometry helpers where practical (for example rounded boxes via shape/extrusion or beveled geometry helpers implemented locally) rather than introducing a heavy new dependency for v1.

Geometry complexity should remain moderate because the environment is viewed from above and must work on mobile/browser WebGL.

## Lighting
Retain ACES tone mapping and soft shadows, but redesign the lighting into a deliberate stack:
- warm key light suggesting window/daylight direction;
- soft hemisphere/ambient fill;
- local lamp light near the sofa;
- optional low-intensity fill/rim only if needed for actor separation.

Avoid dramatic moving lights or camera-dependent lighting. The room should remain readable with the fixed overhead camera.

Shadow map settings should be tuned for visual quality without causing excessive mobile cost.

## Depth and polish
Final Art v1 should add depth cues without camera movement:
- contact shadows from existing shadow mapping;
- improved object grounding;
- slightly varied material roughness;
- layered furniture silhouettes;
- subtle emissive accents;
- balanced background/wall values so Libi and Dad remain readable.

Do not add heavy post-processing dependencies in v1. If ambient occlusion/post-processing is needed later, it becomes a separate phase after this art pass is validated.

## Object registry and semantic stability
Every gameplay-relevant art assembly must expose the same semantic object ID in `objectsById`.

Reactive transforms must continue to target the corresponding group root and use a stable `baseTransform` so sofa/cushion/toy reactions continue to work.

Scenario placement and `projectObject` behavior must remain compatible with headphones and other scenario items.

## GLB migration path
The art registry must support a future resolver with the same logical contract:

```js
resolveArtObject('sofa')
```

v1 may return a procedural group. A later version may return a loaded GLB scene. Both must expose:
- semantic ID;
- root transform;
- shadow configuration;
- `baseTransform`;
- compatibility with `objectsById` and reactive transforms.

This prevents future Blender/GLB work from requiring gameplay rewrites.

## Performance budget
Final Art v1 should remain lightweight enough for the existing browser target:
- avoid large external textures;
- reuse shared materials where possible;
- prefer one-time geometry creation;
- cap pixel ratio as already done;
- keep shadow-casting lights limited;
- avoid per-frame material/geometry allocations;
- target stable rendering in the existing Playwright/SwiftShader smoke environment.

## Quality and responsive behavior
The fixed overhead room composition must remain legible at desktop and narrow/mobile viewport sizes. The existing portrait framing logic remains authoritative; the art pass must fit inside it rather than modifying the camera to compensate for oversized visual geometry.

## Testing strategy
Add or update tests to enforce:
- world coordinates/collider dimensions are unchanged;
- gameplay-relevant object IDs are still present in `objectsById`;
- hero furniture is multi-part art rather than one-box graybox output;
- sofa cushions remain separately reactive/addressable;
- `projectObject` and scenario item placement still work;
- Character Lock remains green;
- cinematic browser smoke remains green;
- world3d browser smoke remains green for movement, collision, interaction, fixed camera, resize, and WebGL context;
- a screenshot artifact is uploaded for visual review of the Final Art v1 room.

## Non-goals for v1
- Rebuilding Libi or Dad final character models.
- Importing Blender-authored GLB assets yet.
- Changing game mechanics or room layout.
- Adding new playable rooms.
- Adding heavy post-processing stacks.
- Turning decorative dressing into new gameplay interactions.
- Changing the approved fixed overhead camera.

## Implementation boundary
Expected implementation work will be centered around a new living-room art module plus controlled changes to `scene-3d.js`, tests, and the Crazy Family world3d acceptance workflow. `world.js`, `game.js`, camera modules, and character modules should remain unchanged unless a test exposes a genuine compatibility issue.

## Acceptance criteria
Final Art v1 is accepted when:
1. The room no longer reads as a collection of boxes at first glance.
2. Sofa, coffee table, side table, lamp, doorway, rug/floor, toys, and wall treatment have intentional stylized forms/materials.
3. Lighting creates depth and warmth while preserving actor readability.
4. Libi/Dad, camera, gameplay, collisions, and interactions behave identically to the currently approved world3d version.
5. Existing Character Lock, cinematic smoke, and world3d smoke pass.
6. The visual-art registry is explicitly replaceable by future GLB assets without changes to gameplay/world logic.
