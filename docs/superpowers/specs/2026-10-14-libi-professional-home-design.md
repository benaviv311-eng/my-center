# Libi Professional Home — Design Specification

Date: 2026-10-14
Branch: `feature/livi-professional-home`
Status: design approved in conversation; implementation not started

## 1. Product intent

Transform the current Crazy Family / Libi home scene from a cinematic screen-stage into a professional-feeling third-person home adventure where the player feels physically present inside the living room.

The target feeling is not “a character moving over a beautiful picture.” The target is: “I am Libi. I can move through this room, understand where I am in space, use the furniture, hear the house around me, and react to Dad as another living character in the same world.”

The strongest reference for movement, camera, polish and environment-as-playground is **It Takes Two**. The strongest reference for making the house itself interactive and systemic is **Hello Neighbor**, without borrowing its horror tone. The result must remain warm, playful, family-friendly and specific to the existing Crazy Family canon.

## 2. Non-negotiable canon

The following remain authoritative and must not be redesigned by this work:

- Libi’s approved canonical character design and approved asset identity.
- Dad’s approved canonical character design and approved asset identity.
- The approved living-room visual language: colors, furniture placement, lighting mood and overall family-home atmosphere.
- Free movement remains a core gameplay requirement.
- Dad remains an active autonomous character with his established behaviors, singing and reactions.
- Headphones / special-item placement may vary between runs.
- Existing retained gameplay systems such as lives, stamina, Dad exposure and current interaction logic must be preserved unless explicitly replaced by a later approved design.

This project changes **how the home is rendered and experienced**, not who the characters are or what world they belong to.

## 3. Experience pillars

### 3.1 Live inside the room

The living room must read as a real navigable place with stable spatial relationships. The player should be able to identify front/back, left/right, near/far and routes around major furniture without relying on UI.

### 3.2 Professional third-person movement

Movement must have readable acceleration, deceleration, turning, body orientation and animation transitions. Libi should feel controlled rather than dragged across the floor.

### 3.3 Cinematic but playable camera

The camera must create composition without sacrificing control. It follows and frames Libi, adapts around Dad and obstacles, and opens/closes based on speed and local space.

### 3.4 The house reacts

Furniture, props, surfaces, sound and lighting should respond to movement and interactions. The room should not look frozen while the player is active.

### 3.5 Dad shares the same world

Dad must navigate the same collision space, respect the same furniture boundaries and appear spatially grounded. His presence should be understood through movement, sound and reactions before UI explains anything.

## 4. Target architecture

The final gameplay surface becomes a true 3D scene using Three.js/WebGL, with the current 2D cinematic image retained only as a visual-reference source and optional transitional fallback.

The system is divided into clear layers:

1. **World simulation** — authoritative room coordinates, collision, surfaces, interactables and nav data.
2. **3D environment renderer** — room shell, furniture meshes, props, materials, lighting and shadows.
3. **Character controller** — Libi movement, grounded state, turning, animation state and contextual locomotion.
4. **Third-person camera rig** — follow target, collision avoidance, damping, framing and situation modes.
5. **Dad AI / navigation** — Dad decision state plus physical navigation through the same room.
6. **Interaction system** — nearby usable objects and context actions.
7. **Reactive-home system** — furniture reactions, prop movement, ambient animation and environmental sound.
8. **Audio spatialization** — listener tied to Libi/camera and emitters tied to Dad/objects/rooms.
9. **Presentation/HUD** — minimal in-world-feeling UI layered over gameplay.

These systems communicate through world-space positions and explicit state rather than screen-projection hacks.

## 5. Environment conversion

### 5.1 Canonical room reconstruction

The approved cinematic living-room reference becomes the art target for the 3D reconstruction.

The first professional playable room contains:

- floor and rug
- walls and openings
- sofa
- coffee table
- dining/kitchen transition area visible from the room
- foreground furniture/architectural elements that currently create composition
- doorway / route to the next area
- toy ball
- headphones / special item
- a small set of ambient props needed to make the room feel lived in

The reconstruction must match the visual proportions and mood closely enough that users recognize it as the same canonical room, while allowing physically coherent navigation.

### 5.2 Collision categories

Every environment object is assigned one of four collision roles:

- **solid** — cannot pass through: walls, table core, major furniture body.
- **step/climb** — may be mounted or traversed by contextual movement: sofa seat, low ledge.
- **soft/reactive** — blocks or slows movement but visibly reacts: cushions, lightweight props.
- **non-blocking visual** — art-only object that never traps movement.

Collision proxies must be simpler than visual meshes. Gameplay correctness must not depend on high-poly geometry.

### 5.3 Navigation space

The room needs a hand-authored navigation footprint for Dad and future NPCs. It must include valid routes around the sofa/table and mark temporary blockers separately from permanent furniture.

## 6. Libi movement controller

The controller is capsule-based and remains independent from the character’s render mesh.

Required movement states for the first professional pass:

- idle
- walk
- jog/run
- sprint
- jump start
- airborne
- landing
- crouch
- contextual step-up / climb onto sofa
- contextual drop-down

Movement rules:

- input is camera-relative.
- turning has angular smoothing; the character does not instantly flip direction.
- acceleration and braking are visible and tunable.
- sprint affects animation, camera distance and footstep cadence.
- grounded detection is based on actual collision support, not screen Y.
- small surface height changes are stepped automatically within a strict threshold.
- illegal penetrations are resolved before rendering.

The approved Libi visual may initially remain sprite-based or billboarded during the transition, but the controller and camera must already behave as if she is a real 3D actor. The renderer boundary must allow a later rigged 3D Libi without rewriting gameplay.

## 7. Camera system

The camera is the most important system for the “professional game” feeling.

### 7.1 Base behavior

Use an over-the-shoulder / elevated third-person follow camera with:

- spring-damped position follow
- spring-damped look target
- adjustable horizontal orbit
- limited vertical pitch
- speed-sensitive follow distance
- stable horizon
- obstacle collision and automatic camera pull-in

### 7.2 Camera modes

The rig supports named modes rather than one generic pose:

- **explore** — wider, calm framing while moving around the room.
- **close interaction** — moves closer during object interaction.
- **Dad nearby** — keeps both Libi and Dad readable when possible.
- **Dad chase/song pressure** — slightly more dynamic distance and lateral framing, with restrained shake only when justified.
- **context climb** — camera favors the destination surface and keeps feet visible.

Transitions are eased, never hard cuts unless deliberately authored.

### 7.3 Camera collision

A ray/sphere cast runs from target to desired camera position. If furniture or wall geometry blocks it, the camera moves inward along the safe line. It must never clip through walls, sofa backs or foreground objects.

## 8. Character rendering and animation

The existing approved Libi and Dad identities remain fixed.

For the first migration milestone, character rendering can use high-quality directional sprite/billboard presentation if that lets gameplay become professional sooner. However:

- the billboard must orient correctly to the camera and movement direction.
- foot position must remain physically planted in world space.
- render scaling is not driven by custom 2D perspective formulas; the 3D camera provides perspective.
- directional animation should cover at least front/three-quarter/back readability for navigation.
- shadow/contact treatment must make both actors sit on the floor.

A later asset upgrade may replace the visual with full 3D rigs without changing movement or AI APIs.

## 9. Dad AI and world presence

Dad continues to use his behavior state machine, but movement becomes navigation-aware.

Dad must:

- find routes around solid furniture instead of passing through it.
- maintain believable stopping distance from Libi.
- turn toward travel direction.
- spatialize voice/singing from his actual world position.
- perform existing pant/yawn/sneeze behaviors without freezing the world.
- react to selected audible events such as a nearby lightweight prop impact.

Dad’s singing/pressure gameplay stays intact, but visual attacks and effects must originate from his 3D position and respect room scale.

## 10. Interaction model

Interactions are proximity- and facing-aware.

First-room supported interactions:

- push/kick toy ball
- pick up headphones / special item
- climb onto sofa
- drop from sofa
- open/use doorway when unlocked
- inspect or trigger a small number of authored household props

The prompt appears only when an interaction is actually available. The prompt text is secondary; animation, highlight and positioning should already suggest what can be used.

## 11. Reactive living room

The home needs low-cost ambient life even when the player is idle.

Initial reactions:

- sofa cushion compression when landed/sat on
- ball rolling with friction and collision response
- subtle curtain or plant motion if present in the approved art language
- small light/TV ambient variation where visually appropriate
- footstep particles/shadows only when justified by surface
- different footstep sounds for rug/wood/other surfaces
- nearby lightweight object nudge sound

The intent is not full physics simulation. Only objects that improve play or atmosphere become reactive.

## 12. Audio

Audio becomes fully world-space aware.

Requirements:

- Dad voice volume/pan derives from actual relative position.
- footsteps derive from surface and speed.
- object impacts originate from object position.
- ambience is layered: room tone, appliance/TV ambience where appropriate, and music.
- music remains non-positional unless intentionally diegetic.
- transitions between same-room and future adjacent-room audio are supported by the API.

## 13. HUD and presentation

The stage should feel like a game, not a webpage.

During active play:

- top website chrome is minimized or hidden in fullscreen/game mode.
- lives/stamina/Dad exposure remain readable but compact.
- item count and contextual prompt use game-styled presentation.
- mobile controls remain available but visually secondary.
- desktop play supports keyboard and should be ready for gamepad mapping.

The player’s attention should stay in the room.

## 14. Migration strategy

The current v0.44 cinematic implementation remains available as a fallback during development. It must not be deleted until the real 3D room passes the acceptance criteria below.

Migration is staged:

### Milestone A — playable graybox room

Build true 3D room geometry, collision, Libi controller and professional camera using simple materials. Existing canonical visual assets are unchanged. Success criterion: moving around already feels like a game before art polish.

### Milestone B — canonical visual reconstruction

Replace graybox surfaces with the approved room style, lighting, furniture silhouettes and materials.

### Milestone C — Dad navigation and interactions

Move Dad into the same 3D navigation space and port the core interactions and special-item flow.

### Milestone D — reactive home and audio polish

Add the small environmental reactions, surface sounds and camera/audio polish that create a lived-in feeling.

### Milestone E — switch default renderer

Make the 3D home the default only after acceptance tests pass. Keep `?legacy=1` or an equivalent diagnostic fallback for the prior renderer during stabilization.

## 15. Performance budget

The first target remains browser play on desktop and modern mobile devices.

Guidelines:

- prefer low/medium-poly furniture with authored normal/roughness maps rather than dense geometry.
- keep collision meshes extremely simple.
- cap dynamic lights and shadow-casting lights.
- use baked/static lighting where practical, with one primary dynamic character/key shadow strategy.
- avoid per-frame allocations in movement, camera and AI loops.
- use level-of-detail or visibility disabling only when the room grows beyond the first living-room area.

The game should maintain smooth input and camera movement as a higher priority than decorative effects.

## 16. Error handling and fallback

If WebGL/3D initialization fails, show a clear in-game fallback message and allow the existing compatible mode where possible.

Asset-load failures must identify the missing asset and keep the game from silently displaying a broken room.

Navigation or interaction systems must fail safe: an NPC should stop rather than walk through a wall, and an unavailable interaction should disappear rather than fire incorrectly.

## 17. Testing strategy

The implementation plan must use tests before behavior changes.

Required automated coverage:

- character acceleration/braking and camera-relative movement
- grounded/jump/landing transitions
- collision against room boundaries and major furniture
- camera obstacle avoidance
- camera mode transitions
- Dad path navigation around at least sofa + coffee table
- interaction availability by position/facing
- special-item spawn remains reachable
- retained Dad-song gameplay still applies damage/exposure correctly
- surface audio lookup
- renderer/fallback boot behavior

Required browser integration checks:

- Libi can make a complete loop around sofa/table without clipping.
- Libi can walk from front living-room area toward the kitchen transition and perspective is naturally provided by the camera.
- camera never crosses a major wall/furniture blocker during that route.
- Dad can reach Libi from multiple spawn points without crossing furniture.
- headphones can be collected from every approved spawn.
- game remains playable with keyboard and mobile controls.

## 18. Acceptance criteria

The new renderer is not considered complete merely because it is technically 3D.

It is accepted only when all of these are true:

1. A first-time viewer can immediately tell that Libi is **inside** the living room, not overlaid on it.
2. Walking forward/backward produces convincing spatial travel with no custom fake perspective scaling.
3. The player can circle the sofa and coffee table and understand their depth from camera movement and occlusion.
4. Libi’s feet remain grounded with stable contact shadows and no visible floating during normal locomotion.
5. The camera feels smooth, avoids major obstacles and does not make the player fight it.
6. Dad moves through the same room space without clipping through major furniture.
7. At least the sofa, ball, headphones and doorway have meaningful gameplay interaction.
8. Spatial audio makes Dad’s position understandable even when he is outside the center of the frame.
9. The room has visible/audible ambient life while the player is idle.
10. Existing canonical Libi and Dad identity is preserved.
11. Existing core gameplay rules continue working after the renderer switch.
12. The experience reads visually as the same approved home, not as a generic 3D demo room.

## 19. Explicit non-goals for this phase

To keep the first professional-home conversion focused, this phase does **not** include:

- rebuilding every room in the house
- multiplayer
- full ragdoll simulation
- destructible furniture
- photorealistic physically simulated household physics
- redesigning Libi or Dad
- replacing all character art with final 3D rigs before movement/camera quality is proven
- adding unrelated new game modes

The first success is one excellent living room that proves the game can feel alive.
