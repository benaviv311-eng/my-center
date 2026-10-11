# Crazy Family — Hybrid Cinematic Set Design

Date: 2026-10-11

## Goal

Replace the current visibly procedural Three.js living-room presentation with a hybrid cinematic set that visually matches the approved warm illustrated reference as closely as practical while preserving the existing game systems.

Success means a paused gameplay frame, with characters hidden, reads as another frame from the approved reference rather than as a simplified 3D prototype.

## Canon and non-negotiables

- Libi remains the approved canonical character asset. No redesign, replacement, or regeneration.
- Dad remains the approved canonical character asset. No redesign, replacement, or regeneration.
- Libi keeps free 360-degree movement across the playable home area.
- The home layout and furniture locations are fixed.
- Scenario state remains dynamic: special items such as headphones may spawn in different valid household locations on each run, and Dad may begin in different valid locations.
- Existing movement, collisions, navigation, attacks, audio, songs, Dad state machine, interaction rules, and scenario spawning remain authoritative gameplay systems.
- The approved reference is used for environment look, composition, materials, lighting, density, and mood only.

## Architecture

The game is split into two synchronized representations of the same house.

### 1. Hidden gameplay geometry

The current world model remains responsible for:

- walkable floor bounds
- furniture blockers and collision volumes
- Dad navigation and pathfinding
- interaction radii
- valid scenario spawn points
- attack tracing
- surface types
- camera collision

These volumes may be invisible or visually simplified. They are not the source of final appearance.

### 2. Cinematic visual set

A layered visual environment is rendered in front of, around, and behind the gameplay geometry. It uses high-quality authored environment artwork rather than procedural box furniture as the primary presentation.

The set is divided into depth-aware visual layers:

1. **Background architecture** — walls, windows, sunset exterior, kitchen depth, corridor depth, fixed built-ins.
2. **Midground furniture** — sofa, coffee table, rug, dining furniture, cabinets, shelves, lamps, fixed decorative objects.
3. **Gameplay surface anchors** — visual floor and furniture silhouettes aligned to the hidden collision layout.
4. **Foreground occluders** — nearby sofa edges, plants, furniture corners, curtain edges, and other elements allowed to pass in front of Libi or Dad when depth requires it.
5. **Contact treatment** — contact shadows, soft floor shadows, warm light wrap, and local grounding effects that visually seat characters and dynamic items inside the set.

The visual system must not become a single flat background image. Objects that need to appear in front of or behind characters are separate renderable layers or meshes with explicit depth behavior.

## Visual target

The environment must follow the approved reference in these ways:

- warm golden-hour interior lighting
- painterly/stylized family-animation quality
- dense but readable home detail
- soft rounded furniture forms
- warm wood floor with visible grain and tonal variation
- fabric sofa with believable cushions and soft edges
- patterned central rug
- open visual depth toward dining/kitchen/corridor areas
- window light that clearly motivates the warm illumination
- layered plants, books, framed art, child drawings, soft furnishings, and household clutter
- no visible primitive-box look
- no low-detail placeholder materials in the final visible set

The target is not photorealism. It is polished stylized cinematic illustration with consistent lighting and depth.

## Camera and projection

The current free-movement camera remains gameplay-driven, but the visual set is authored for the same dominant 3/4 family-room view seen in the approved reference.

Requirements:

- Camera remains low enough to feel inside the room, never like a dollhouse overview.
- Camera framing must keep enough parallax between background, midground, characters, and foreground to preserve depth.
- Existing camera collision still prevents clipping through blockers.
- Chase widening may continue, but must not expose unfinished areas outside the authored cinematic set.
- If the camera approaches the safe visual envelope, the controller should prefer boom shortening or constrained yaw over revealing missing scenery.

## Layer alignment

Every major fixed visual object that affects movement must have a corresponding world-space anchor aligned with the existing gameplay object.

At minimum:

- sofa visual ↔ sofa blocker
- coffee table visual ↔ coffee-table blocker
- side table visual ↔ side-table blocker
- doorway/corridor opening ↔ doorway interaction and passage geometry
- rug visual ↔ rug surface region
- kitchen/dining visual openings ↔ valid walkable areas

Purely decorative objects do not create collision unless a gameplay requirement explicitly calls for it.

## Dynamic objects

Dynamic scenario items, including headphones, are rendered as independent world-space objects and are not baked into the environment artwork.

For each scenario item:

- gameplay interaction position and visual position use the same world coordinate
- the item inherits the local lighting/contact-shadow treatment of its spawn zone
- spawn points may vary each run
- items must never appear visually embedded in a fixed furniture layer
- future special items can reuse the same spawn-anchor system

Dad is also independent from the environment art and remains free to move through all valid navigation space.

## Occlusion model

Occlusion is spatial rather than hard-coded per screenshot.

Each foreground/midground visual element that may cross in front of a character receives an occlusion region or depth proxy.

The renderer chooses whether that element appears in front of or behind Libi/Dad according to world position and camera depth. Existing camera occlusion logic may be reused where appropriate, but the final behavior must support authored foreground layers rather than only opacity-fading 3D blockers.

Characters must visibly pass behind furniture when their world position requires it.

## Lighting integration

The environment artwork carries the broad cinematic lighting, while lightweight real-time lights and shadows integrate dynamic objects.

Required lighting behavior:

- primary warm directional light motivated by the window/sunset side
- softer ambient/fill light for readable shadows
- local practical warmth near lamps where visible
- real-time contact shadow under Libi, Dad, and dynamic items
- subtle warm rim/light wrap so characters feel embedded in the painted environment
- no heavy real-time shadow setup that materially harms browser performance

The environment and character lighting must agree in direction and color temperature.

## Asset strategy

The environment is authored as a clean, character-free, UI-free house visual based on the approved reference.

The authored set must exclude:

- Libi
- Dad
- any substitute people
- game HUD
- text
- buttons
- baked headphones or other dynamic special items

The visual asset is then separated into the minimum practical number of depth layers needed for convincing movement and occlusion. The goal is visual fidelity, not arbitrary layer count.

Preferred asset groups:

- background architecture plate
- main floor/rug plate
- sofa group
- coffee-table group
- dining/kitchen group where separate depth is needed
- left/right foreground groups
- plant/curtain/near-camera occluder groups
- optional shadow/light overlays

Transparent PNG/WebP layers are acceptable where appropriate. Large assets should use web-friendly dimensions and compression without visible degradation at the game canvas size.

## Existing Three.js furniture

The current procedural visual furniture is retained only as a temporary fallback/debug representation.

In cinematic mode:

- procedural room meshes that conflict visually with the authored set are hidden
- invisible world geometry remains active for collision/navigation
- semantic object IDs remain available so reactions and interactions continue to work

Reactive events such as sofa compression or toy movement may use lightweight layered transforms or authored secondary visuals rather than revealing the old box-based furniture.

## Scenario system

The v0.41 scenario model remains unchanged in principle:

- fixed house
- free Libi movement
- variable special-item location
- variable Dad start state/location where valid

The cinematic set must support every approved spawn point. Spawn points that are visually impossible in the new composition are removed or remapped only if an equivalent logical household location is provided and the scenario tests are updated accordingly.

## UI

The HUD remains separate from the cinematic environment and is not baked into environment assets.

The visual-set work does not redesign the HUD unless required to prevent overlap or readability problems. Existing controls remain functional.

## Performance budget

The cinematic look must remain usable in a browser.

Guidelines:

- favor a small number of large authored layers over dozens of expensive meshes
- use compressed web textures
- avoid excessive transparent overdraw
- limit real-time shadow casters to characters and essential dynamic objects
- preserve one WebGL scene and existing runtime rather than adding a second renderer
- keep the environment static whenever possible

The implementation must be verified in Chromium using the current real-browser smoke path.

## Data flow

1. `world.js` creates fixed gameplay geometry and interactables.
2. `scenario.js` chooses dynamic item and Dad starting positions.
3. `game.js` applies the scenario and creates runtime actors.
4. The cinematic scene module maps fixed world anchors to authored visual layers.
5. Dynamic actors/items are rendered at their normal world coordinates.
6. Camera depth and authored occlusion proxies determine foreground/background ordering.
7. Real-time contact treatment grounds dynamic objects in the static cinematic set.

## Implementation boundaries

The work should primarily affect the visual rendering path and asset loading.

Expected areas:

- `crazy-family/scene.js` or a new dedicated cinematic-set module
- environment asset files under `assets/crazy-family/`
- small scene/game integration changes for visual mode and depth proxies
- visual regression/browser smoke coverage

The following should not be rewritten unless a verified compatibility issue requires it:

- `movement.js`
- `dad.js`
- `attacks.js`
- `audio.js`
- core scenario selection semantics
- canonical character asset definitions

## Testing and acceptance

### Automated contract tests

Tests must verify that:

- canonical Libi and Dad asset URLs are unchanged
- fixed world blockers remain in the same authored gameplay positions
- scenario item spawns still vary across valid locations
- visual special-item position matches its interaction position
- cinematic mode hides conflicting procedural furniture visuals
- required cinematic layers load and register semantic IDs
- collision/navigation logic remains independent from visible layer art

### Browser smoke test

Chromium acceptance must verify:

- WebGL boots without context loss
- cinematic environment layers are visible
- Libi can move freely in more than one floor direction
- Libi can jump and land
- Libi can pass behind at least one authored foreground/furniture layer
- a special item is visible at its scenario-selected spawn and can be collected
- Dad remains visible and can navigate around fixed furniture blockers

### Visual acceptance

A fresh screenshot from the real browser is reviewed against the approved reference before publishing.

Do not publish if the room still reads primarily as primitive 3D furniture. The screenshot must demonstrate the intended illustrated cinematic look, warm lighting, depth, and dense household detail.

## Rollout

The cinematic set is introduced as the default visual mode only after browser and visual acceptance pass. The old procedural rendering may remain temporarily available as a debug/fallback path during implementation, but it is not the target public appearance.
