# Raishin v2 World Core — Design

Date: 2026-10-17
Status: Approved direction, implementation not started

## Goal

Replace the current Raishin Legacy presentation model with a real Phaser/WebGL world-space core that makes Raika feel planted in an explorable dojo rather than a sprite floating over a static stage.

The first milestone is intentionally narrow: one polished Inazuma dojo room with correct player scale, grounding, camera behavior, depth, and collision. Combat, jump, dodge, quests, and additional zones stay out of scope until movement and spatial feel are correct.

## Success Criteria

The build is successful when all of the following are true:

1. Raika is visually the subject of the frame, roughly 28–36% of viewport height at the default spawn depth.
2. Raika’s world position is always the planted ground point beneath her feet, never the center or bottom edge of the whole sprite cell.
3. Walking forward/back changes perspective scale continuously without visible vertical floating.
4. The camera follows the world, not a single-screen image. It can traverse a dojo wider/taller than one viewport and keeps Raika in a lower-middle third-person composition.
5. Walls, columns, training objects, and exits exist as world objects with collision and depth ordering.
6. Raika can pass visually behind/in front of appropriate objects according to world Y/depth.
7. The player cannot leave the walkable floor or clip through solid objects.
8. The result remains smooth and readable at 1600×900 and scales down responsively.
9. Existing canonical Raika art remains unchanged: no human ears, no tail, no character redesign.
10. The existing Legacy page remains available during the migration, but the final public Raishin route switches to v2 only after the new core passes tests and visual smoke checks.

## Current Diagnosis

The repository already has useful v2 modules: `WorldPlane`, `CollisionMap`, `PlayerController`, `PlayerView`, `CameraFollow`, animation metadata, and a Phaser `DojoScene`.

The current v2 still behaves like a stage because `DojoScene` draws the same 1600×900 dojo background as one screen-sized image, projects the entire 1000×600 logical world into a narrow trapezoid near the bottom of that image, and limits camera movement to only a few pixels. That creates apparent perspective but not an explorable world.

The existing player-ground concept is better than Legacy because the sprite origin is driven by per-frame pivots. However, the environment, camera, and player scale are still calibrated to a single static composition instead of a scrolling world.

## Architectural Decision

Use Phaser/WebGL v2 as the only implementation target for the new core.

Do not continue modifying `game.js`, `open-world-presentation.js`, or the Legacy canvas rendering to solve spatial problems. Those files may remain as fallback/reference until migration is complete.

Keep the current modular separation and strengthen it rather than replacing it with one large scene file.

### Main modules

- `WorldModel`: owns world dimensions, zones, anchors, spawn points, and semantic object data.
- `WorldPlane`: converts logical floor/world coordinates into render coordinates and perspective scale.
- `CollisionMap`: resolves player movement against walkable polygons and solid shapes.
- `PlayerController`: owns only movement state, velocity, facing, and world position.
- `PlayerAnimator`: selects animation frame and foot pivot.
- `PlayerView`: converts animation pivot + world projection into exact render transform.
- `CameraRig`: follows the player in world/render space with zoom, look-ahead, smoothing, and bounds.
- `DepthSystem`: assigns render depth from each object’s planted ground Y, with explicit offsets for floor/background/roof layers.
- `DojoScene`: composes systems and creates Phaser objects; it should not contain physics or projection formulas.

## World Model

### World size

The dojo must be materially larger than one viewport. Initial target:

- logical world: approximately 2400 × 1500 units
- one viewport shows roughly 45–60% of dojo width depending on camera zoom
- the first room should feel like 2.5–3.5 screen widths of traversable space, not an infinite open world

Exact dimensions can be tuned after the first visual calibration, but they must not collapse back to a one-screen background.

### Floor

The walkable area is represented as a polygon or set of convex polygons in logical world space. The player position is a point on this floor plus a collision radius.

The projection must preserve two independent concepts:

- `worldX/worldY`: gameplay position used by movement, collision, interactions, AI
- `screenX/screenY/scale`: visual projection used only for rendering

No gameplay collision may be performed directly in screen coordinates.

## Environment Rendering

The static single dojo image cannot remain the sole world representation.

For milestone 1, the approved dojo artwork may still be used as visual source material, but it must be split conceptually into layers/objects:

1. far wall / ceiling / decorative background
2. floor plane
3. rear props
4. traversable player layer
5. foreground props / columns / door frames
6. optional light and atmosphere overlays

Where a clean independent art asset does not exist yet, the scene may use cropped/duplicated pieces, masks, or temporary geometry placeholders, but the runtime architecture must already treat them as separate world objects.

The final scene must not rely on moving a single 1600×900 screenshot under the player.

## Raika Grounding

### Ground point contract

`worldX/worldY` always means the point on the floor directly beneath Raika’s planted support area.

Every animation frame supplies a normalized pivot `{x, y}` identifying the ground contact inside the sprite frame. The rendered sprite position is set to the projected ground point and the sprite origin is set to this pivot.

This contract applies to all four directions and later to idle, run, jump landing, attack recovery, and dodge animations.

### No artificial vertical correction

There is no global `bobY` or fixed pixel lowering used to compensate for floating. If a frame floats, its pivot metadata is wrong and must be corrected at the asset/frame-data level.

Walk animation may include natural body motion inside the art, but the detected/defined planted contact stays locked to the projected ground point.

### Scale

Character scale is derived from perspective depth and a single calibrated base character height. Default spawn should render Raika at approximately 28–36% of the viewport height.

A single `heroScale` calibration value is allowed; direction-specific or frame-specific visual scale hacks are not.

## Camera Rig

Replace the current few-pixel offset camera with an actual world camera.

### Behavior

- Phaser camera has real scroll bounds covering the rendered dojo world.
- Camera zoom is explicit and configurable.
- Raika is framed slightly below vertical center so more world is visible ahead of her.
- Soft dead zone: small player movement near center does not jitter the camera.
- Velocity look-ahead: horizontal movement shifts camera target slightly in travel direction; forward/back movement gets a smaller look-ahead.
- Critically damped or exponential smoothing prevents snapping.
- Camera never exposes outside-world empty space.

### Initial feel target

- stable while idle
- begins following after roughly 5–8% viewport travel from the desired framing point
- catches up decisively during sustained motion
- no micro-shake from animation frames

The camera follows the player’s ground projection, never the visual top/center of the sprite.

## Collision

Upgrade from only circular obstacles + rectangular bounds to reusable collision primitives:

- walkable polygon boundaries
- circles for posts/bags where appropriate
- axis-aligned or oriented rectangles for walls, benches, weapon racks, door frames

Movement resolution continues to prefer sliding along a free axis instead of stopping completely, but must be deterministic and tested.

## Depth and Occlusion

Every renderable world object has a ground anchor.

Default depth rule:

`depth = projectedGroundY + depthBias`

Raika and props therefore naturally sort in front/behind each other based on where they stand on the floor.

Background wall/ceiling and floor use fixed low depth bands. Foreground architectural overlays may use explicit high depth bands where perspective requires permanent occlusion.

## Interaction Coordinates

Interactions stay in logical world coordinates. `InteractionSystem` finds nearest usable item by world-space distance. UI prompts are projected from the object’s world anchor each frame.

Interaction logic must not depend on camera scroll or screen pixels.

## Milestone 1 Scope

Included:

- rebuilt Inazuma dojo world scene
- world larger than viewport
- 360-degree movement
- correct 4-direction animation grounding
- perspective scale
- real camera scroll/zoom/follow
- world collision
- depth sorting and basic occlusion
- training bag / weapons wall / training center / courtyard exit interaction anchors
- existing HUD preserved unless it obstructs visual testing
- automated unit/contract tests
- Chromium/browser visual smoke test if the repo workflow supports it

Explicitly excluded from milestone 1:

- jump mechanics
- dodge mechanics
- combat / hitboxes
- enemies
- quests
- inventory
- save game
- multiple exterior maps
- procedural world generation
- redesigning Raika

## Migration Strategy

1. Keep `/raishin-legacy/` unchanged as a fallback while building.
2. Develop the new world core behind `/raishin-legacy/v2.html`.
3. Do not import Legacy presentation adapters into v2.
4. Reuse only assets and pure logic that conform to the new world-space contracts.
5. Once visual acceptance is reached, switch `/raishin-legacy/index.html` to launch the v2 core.
6. Keep the old Legacy runtime available under a separate archived route for regression reference.

## Testing Strategy

### Unit / contract tests

- WorldPlane projection/unprojection round trip.
- Perspective scale monotonicity with world Y.
- PlayerController position stays in world space and is independent of camera.
- Four-direction animation pivots keep ground point invariant across frames.
- Collision prevents boundary exit and resolves sliding along obstacles.
- Camera target uses projected ground point and stays inside world bounds.
- Depth increases consistently with projected ground Y.
- Interaction distance is unaffected by camera position/zoom.

### Integration tests

- Spawn → walk in all four directions → stop: no visible ground drift.
- Walk behind and in front of at least one prop: depth ordering changes correctly.
- Traverse enough distance to force camera scrolling: player remains framed and no empty background is revealed.
- Move against each world boundary and solid obstacle: no clipping.

### Deployment verification

Before claiming the build is live:

1. relevant Raishin tests pass on the exact commit
2. GitHub Pages deployment for that exact commit succeeds
3. public v2 URL loads the expected cache-busted build
4. visual smoke confirms the player visibly moves through a scrolling world rather than over a static screen

## First Visual Acceptance Check

The first implementation checkpoint should deliberately contain only:

- dojo world
- Raika
- shadow
- camera
- collisions

No additional gameplay systems should be added before this checkpoint is approved.

The user should be able to answer three visual questions immediately:

1. Does Raika feel correctly sized relative to the dojo?
2. Do her feet feel physically planted while moving in every direction?
3. Does the camera/world now feel like a game space rather than a static image?

If any answer is no, calibration happens in world/camera/pivot data, not via Legacy pixel offsets.
