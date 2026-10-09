# Crazy Family — Playable Movie Set Design

Date: 2026-10-09
Status: Approved design, awaiting written-spec review before implementation planning

## 1. Product goal

Transform the ground-floor experience in `crazy-family.html` from a flat 2D/2.5D scene into a playable cinematic family-home set. The player should feel that Libi is physically inside the living room, not drawn on top of a background image.

The target experience combines:
- the spatial freedom and environmental playfulness of a third-person family adventure,
- the staged, cinematic room composition of a diorama-like set,
- the existing Crazy Family canon, abilities, Dad encounter systems, audio, attacks, inventory, and progression.

Success criterion: a paused gameplay screenshot should read immediately as “Libi is standing inside this living room,” not “Libi is overlaid on a picture of a living room.”

## 2. Scope

### In scope for the first vertical slice

Build one complete living-room slice with:
- real 3D room geometry,
- 360-degree movement,
- automatic 3/4 third-person camera,
- gravity and grounded movement,
- sofa, coffee table, rug, toys, doorway, and a small visible route toward the dining area,
- occlusion and camera-safe transparency,
- dynamic character scaling through real perspective rather than fake 2D scaling,
- Dad navigation and chase behavior inside the same spatial world,
- jumping,
- contextual interaction,
- headphones placed naturally on furniture,
- shared lighting and shadows for characters and room,
- preservation of the existing game systems listed below.

### Explicitly out of scope for this first slice

- rebuilding the entire house,
- generating final production-quality 3D character models without separate visual approval,
- replacing all existing story content,
- redesigning Libi or Dad,
- introducing manual camera control,
- migrating the project to Unity, Godot, or another external engine.

## 3. Core architectural decision

Use Three.js/WebGL inside the existing website and keep the game on the current site and route.

The existing HTML page remains the entry point, but rendering, movement, world geometry, camera, collision, interaction, Dad behavior, and audio are separated into focused JavaScript modules.

The current Canvas 2D stage will not remain the authoritative world model for the living-room slice. The new 3D scene becomes the source of truth for world position, floor contact, depth, occlusion, and collision.

## 4. Camera

### Camera style

Automatic cinematic third-person 3/4 camera.

The camera sits slightly above and behind Libi, looking forward into the room. It should feel close enough to place the player inside the home but far enough back to show nearby obstacles and Dad during a chase.

### Player control

The player controls Libi only. There is no manual camera stick or mouse-look in the first version.

### Camera modes

The camera controller supports four modes:

1. Explore — close, calm, cinematic.
2. Chase — pulls back enough to expose routes and, where possible, keep Dad readable.
3. Interaction — reframes toward the active object.
4. Cinematic moment — temporarily uses a authored angle for a short gag or event.

Transitions are smooth rather than hard cuts.

### Camera collision

The camera may not pass through walls or furniture. If geometry blocks the view of Libi, the camera should either move inward or make only the obstructing foreground object partially transparent.

## 5. Movement model

### Ground movement

Libi moves freely in 360 degrees relative to the camera.

Controls:
- left/right = lateral movement relative to the camera,
- up/down = forward/backward movement relative to the camera.

Movement supports diagonals.

### Motion feel

Libi is light, responsive, and agile:
- quick acceleration,
- short braking distance,
- fast directional changes,
- responsive jump.

Dad is heavier:
- slower acceleration,
- wider turns,
- longer braking distance,
- more visible inertia.

### Assisted navigation

The player remains free to move, but narrow passages may apply subtle steering assistance so Libi does not snag on doorway edges or tightly spaced furniture. This is not rail movement and must not take control away from the player.

## 6. Physics and collision

Libi uses a character controller with:
- gravity,
- floor detection,
- collision capsule,
- slope and step handling where needed,
- jump arc,
- landing state,
- physical separation from walls and furniture.

Jump height is represented by actual world-space vertical position, not a screen-space sprite offset.

The floor defines where the character stands. There is no global fixed screen Y used as the character’s floor.

## 7. Existing abilities

The current Libi ability set is preserved:

1. Walk.
2. Run.
3. Jump.
4. Jump over obstacles.
5. Forward roll.
6. Crouch / pass under obstacles.
7. Climb.
8. Grab objects.
9. Push or move objects.
10. Interact with characters and objects.

The vertical slice does not need to fully re-author every advanced animation, but its architecture must support all ten abilities without reverting to flat screen-space movement.

## 8. Living-room world design

The first room is designed as a lived-in family space, not a sterile showroom.

Core elements:
- sofa,
- coffee table,
- rug,
- toys,
- cushions,
- lamp,
- family photos,
- children’s drawings,
- small household clutter,
- doorway toward the dining/kitchen direction,
- headphones placed naturally on a sofa arm, side table, or similar furniture.

The scene should contain enough domestic detail to feel inhabited without becoming visually noisy.

## 9. Environmental interaction

### Sofa

Libi can:
- run around it,
- climb onto it,
- jump from it,
- use it as partial cover.

Dad:
- routes around it,
- may bump a corner,
- may lean on it while panting.

### Coffee table

Libi can pass under it while crouching or rolling if clearance allows.

Dad cannot use that route and must path around it.

### Chairs and narrow gaps

Libi can fit through gaps that Dad cannot. Dad may push a chair, take another route, or lose time correcting his path.

### Toys

Small toys may react when contacted. A ball or lightweight toy can roll instead of staying glued in place.

Physics reactions should remain designed and controlled rather than turning the room into uncontrolled simulation.

## 10. Occlusion

Occlusion is a core feature, not a decoration layer.

Examples:
- behind the sofa, parts of Libi are hidden,
- behind the coffee table, lower legs may disappear,
- Dad may enter gradually from behind a doorway,
- foreground objects may partially cover the camera view.

If an object blocks Libi almost completely, only that obstructing object fades temporarily to roughly 70–80% opacity. Libi herself is not rendered through walls.

## 11. Lighting and grounding

The room and characters must share the same lighting environment.

Lighting direction:
- warm evening / late-afternoon light from a window,
- warm practical lamp in the living room,
- slightly cooler light toward the kitchen or deeper room area.

Both Libi and Dad receive:
- soft cast shadows,
- contact shadows at the feet,
- consistent light color and direction with the room.

This shared lighting is a primary anti-floating requirement.

## 12. Character presentation

### Libi

Libi’s approved visual design is locked and must not be altered automatically.

The current 2D sprite can be used only as a temporary development placeholder if needed. The production target is a 3D character that preserves exactly:
- brown expressive eyes,
- brown hair in two messy pigtails,
- pink flower clip,
- coral/pink shirt,
- teal/turquoise short overalls,
- flower detail,
- striped socks,
- pink high-top sneakers,
- approved proportions and color identity.

Any new model or visual reinterpretation requires separate user approval before replacing the approved look.

### Dad

Dad’s approved identity is also preserved:
- tousled dark-brown hair,
- stubble,
- teal/blue-green plaid overshirt,
- light undershirt,
- teddy-bear pajama pants,
- brown house slippers,
- handheld singing prop / microphone-like object,
- playful exaggerated family-animation style.

Dad should remain physically larger and heavier than Libi in the 3D world.

## 13. Dad AI and navigation

Dad moves on a navigation representation of the room rather than targeting a screen coordinate.

He can:
- route around sofa and table,
- choose an opening between furniture,
- cut toward Libi,
- enter from a doorway,
- re-path when blocked.

He is intentionally imperfect. He may occasionally:
- choose a slower side,
- hesitate,
- correct direction,
- bump furniture,
- tire,
- sneeze,
- miss Libi’s sharp turn.

This imperfection supports comedy and gives the player readable escape windows.

## 14. Dad encounter rhythm

The existing encounter rhythm remains:

calm → Dad notices Libi → approaches → speaks → begins singing → chase → tires / is interrupted → escape window → resumes.

The camera expands slightly during chase and returns to a closer explore framing afterward.

## 15. Dad pant, yawn, and sneeze

Existing behavior states remain and become spatially grounded.

### Pant

Dad stops, bends forward, catches his breath, and may brace on nearby furniture or a doorway if positioned appropriately.

### Yawn

Used during quiet or idle periods and creates a short movement opportunity for Libi.

### Sneeze

Sneeze effects can influence nearby room dressing. The strongest sneeze may:
- shake cushions,
- move curtains,
- lift papers,
- roll a toy,
- cause a restrained camera shake.

The room response should be authored and readable rather than chaotic.

## 16. Dad sound attacks in 3D

The existing Dad attack system is preserved conceptually but projected into world space.

Attacks originate from Dad’s position / mouth / singing prop and travel through the room.

The 3D layout allows Libi to:
- sidestep,
- move behind Dad,
- jump over low attacks,
- crouch under high attacks,
- use room geometry where gameplay rules permit.

The attack presentation remains stylized and readable.

## 17. Headphones and pickups

Pickups must no longer float as arcade tokens in the living-room slice.

The headphones are placed on a believable household surface. When Libi is close:
- the object receives a restrained highlight,
- one contextual interaction prompt appears,
- the pickup animation is tied to Libi’s action rather than a floating collection bubble.

The existing inventory rules remain.

## 18. Contextual interaction system

Use one primary action input for nearby context-sensitive actions.

Examples:
- headphones → take,
- door → open,
- sofa → climb,
- toy → pick up,
- chair → push,
- person → talk.

A proximity / interaction resolver selects only the most relevant eligible action and presents a small prompt.

## 19. Audio and spatial sound

The existing songs, Dad voice clips, music ducking, and gameplay audio are preserved.

For the 3D slice, spatial audio should communicate location:
- Dad sounds louder as he approaches,
- audio from an adjacent room is muffled,
- footsteps vary by surface,
- the refrigerator, room ambience, and household sounds provide low-level environmental life.

Suggested surface cues:
- rug: soft thump,
- wood: tap,
- tile: harder clack,
- sofa/cushion: soft puff.

## 20. Visual style

Locked target name: **Cinematic Stylized Family 3D**.

Visual characteristics:
- warm family-animation aesthetic,
- soft forms,
- slightly exaggerated materials,
- cinematic lighting,
- rich but not photorealistic detail,
- no low-poly or Roblox-like look,
- no flat mobile-game presentation.

The intended feeling is a playable family-animation set.

## 21. Preservation of existing systems

The migration should preserve, adapt, or wrap the existing:
- lives,
- stamina,
- shield,
- dizziness,
- Dad songs,
- Dad spoken lines,
- music ducking,
- Dad attack definitions,
- inventory,
- collectibles,
- Libi ability rules,
- Dad behavior states,
- story/canon.

The systems most directly replaced are:
- 2D movement,
- 2D renderer for the living-room slice,
- fixed-screen floor logic,
- flat collision,
- flat camera assumptions.

## 22. Proposed module boundaries

The implementation should stop expanding `crazy-family.html` as a monolith.

Proposed structure:

```text
crazy-family.html
crazy-family/
  game.js
  world.js
  player.js
  dad.js
  camera.js
  physics.js
  interaction.js
  audio.js
  attacks.js
assets/crazy-family/
  characters/
  house/
  props/
  audio/
```

Responsibilities:
- `game.js`: bootstrapping, main update loop, shared state wiring.
- `world.js`: room scene, geometry, props, lighting, nav representation.
- `player.js`: Libi controller, movement state, ability hooks.
- `dad.js`: Dad state machine, chase movement, navigation behavior.
- `camera.js`: automatic camera modes, framing, collision handling.
- `physics.js`: ground checks, collision helpers, movement resolution.
- `interaction.js`: contextual action selection and execution.
- `audio.js`: spatial audio, music ducking, retained voice systems.
- `attacks.js`: world-space Dad attack behavior and rendering hooks.

The first implementation plan may choose a smaller number of files if that keeps interfaces clearer, but these responsibilities must remain separated.

## 23. Data flow

Per frame:

1. Read player input.
2. Resolve intended movement relative to camera.
3. Advance character controller and world collision.
4. Update Libi state and contextual interaction candidate.
5. Update Dad state machine and navigation.
6. Update Dad attacks and reactive props.
7. Update camera target and collision-safe position.
8. Update spatial audio state.
9. Render the 3D scene.
10. Render minimal UI overlays.

World-space position is authoritative. UI and camera never rewrite character world coordinates.

## 24. Error handling and fallback behavior

If a 3D asset fails to load during development:
- the game should display a simple placeholder mesh or fallback material,
- the rest of the scene should continue running,
- loading errors should be logged clearly.

If WebGL is unavailable:
- show a clear unsupported-browser message for the new slice rather than silently falling back to the old floating implementation.

Audio failures must not stop gameplay.

## 25. Testing requirements

The implementation plan must include automated regression checks for the retained systems and focused tests for new world behavior.

Required test categories:

### Movement
- Libi can move forward/backward/left/right in camera-relative world space.
- Diagonal input is normalized.
- Gravity returns Libi to the actual floor surface.
- Jumping does not alter the floor reference itself.

### Collision
- Libi cannot pass through sofa/table collision where not permitted.
- valid narrow passages remain traversable,
- camera does not pass through room geometry.

### Interaction
- only nearby valid objects become interactable,
- headphones are collected through the contextual action,
- inventory receives the existing headphones item correctly.

### Dad
- Dad can navigate around a blocking sofa,
- Dad cannot use Libi-only small gaps,
- pant/yawn/sneeze states still interrupt chase appropriately,
- retained singing and attack state transitions still work.

### Rendering / grounding
- Libi and Dad use the same world floor and lighting environment,
- character shadows remain on the floor during jumps,
- obstructing foreground geometry can fade without revealing characters through unrelated walls.

### Regression
- lives, stamina, shield, dizziness, inventory, audio clips, and Dad attack definitions remain available after migration.

## 26. Vertical-slice acceptance criteria

The living-room slice is ready only when all of the following are true:

1. Libi can move freely in 360 degrees inside the room.
2. The camera follows automatically from a 3/4 third-person view.
3. Libi and Dad visibly stand on the same 3D floor as the furniture.
4. Characters can pass in front of and behind furniture with correct occlusion.
5. Libi can jump and the shadow remains on the floor below her.
6. Dad can chase through the room using navigation rather than screen-space pursuit.
7. The sofa and coffee table create distinct routes for Libi and Dad.
8. The headphones are naturally placed and collected contextually.
9. Shared lighting and contact shadows eliminate the floating-overlay appearance.
10. The existing Dad voice/song/attack systems still function.
11. No approved Libi or Dad visual design is replaced without separate explicit approval.
12. A paused screenshot reads as a character physically inside a family living room.

## 27. Implementation sequence after this spec is approved

The implementation plan should proceed in this order:

1. Create modular Three.js boot path inside the existing page.
2. Build placeholder living-room geometry and lighting.
3. Implement camera-relative 360-degree character controller.
4. Implement automatic 3/4 camera and camera collision.
5. Add sofa/table/rug/toys and world collision.
6. Add occlusion handling.
7. Port Dad navigation and chase state machine.
8. Port contextual headphones interaction and inventory handoff.
9. Port Dad audio and attacks into world space.
10. Add reactive room behavior and spatial audio.
11. Replace temporary development character representations only after approved production character assets exist.
12. Verify vertical-slice acceptance criteria before expanding to dining room or kitchen.

## 28. Non-negotiable constraints

- Do not automatically redesign Libi.
- Do not automatically redesign Dad.
- Do not treat a 2D background image as the final 3D room.
- Do not restore a single fixed floor Y for the living-room slice.
- Do not move the project to a separate external game engine.
- Do not expand to the whole house until the living-room vertical slice passes the acceptance criteria.
