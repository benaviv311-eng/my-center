# Raishin Legacy — Premium Playable Inazuma Dojo v1

Date: 2026-10-10
Status: Design spec for review
Scope: Inazuma Dojo only

## 1. Goal
Turn the current Raishin Legacy free-roam prototype into a premium-feeling playable dojo that feels like a real room the player is inside, not a flat background image.

The v1 success condition is that the player can enter the page, immediately read the room clearly, move Raika through it smoothly, approach meaningful objects, receive contextual feedback, and feel visual depth, light, atmosphere and spatial structure.

This phase does not build the wider world yet. The dojo is the complete focus.

## 2. Current baseline
The current game already has:
- standalone `/raishin-legacy/` page
- 16:9 canvas
- WASD / arrow-key movement
- 4-direction, 8-frame Raika walk cycle
- depth scaling based on Y position
- HUD with health, Raihatsu, objective, minimap and action hints
- an Inazuma main-hall clean background

Current shortcomings:
- the scene reads too dark
- room depth is limited because the environment is rendered as one flat background
- objects are decorative rather than usable
- there is no room-aware collision map
- there are no contextual interaction prompts
- movement does not yet communicate premium game feel
- camera, atmosphere and environmental response are minimal

## 3. Design direction
Use a high-fidelity 2.5D cinematic room architecture rather than attempting a full 3D rebuild in this phase.

Why this is the recommended approach:
- preserves the approved Raika visual identity and current sprite workflow
- works well with the existing GitHub Pages static deployment
- allows strong visual quality through high-resolution art, lighting, particles, parallax and camera motion
- supports a genuinely usable room through collision zones and interactable objects
- avoids a large 3D modeling / rigging / animation dependency before the core game feel is proven

The dojo should feel like a compact premium PC-game hub room: visually rich, readable, reactive and full of meaningful objects.

## 4. Visual target
### Brightness and readability
- eliminate the current overly dark presentation
- keep warm Japanese dojo lighting, but preserve shadow detail
- use a bright golden-hour exterior as secondary light source
- maintain enough contrast for Raika to remain readable against the floor

### High-resolution rendering
- render the game at a high internal resolution and scale cleanly to the display
- use device pixel ratio responsibly, capped for performance
- keep image smoothing at high quality
- avoid CSS filters that make the room muddy or low-contrast

### Layered depth
The room should be divided conceptually into layers:
1. far exterior / garden
2. dojo architecture
3. playable floor
4. environmental props and occluders
5. Raika
6. foreground atmosphere / particles
7. HUD

The first implementation may still use pre-rendered art, but code should treat the room as spatial layers rather than one undifferentiated screenshot.

### Atmosphere
Subtle, not distracting:
- dust motes in sunbeams
- occasional sakura petals entering from the courtyard
- slow lantern glow variation
- slight ambient light motion
- small floor-light response around Raika
- restrained camera easing during movement

No heavy bloom, neon effects, or sci-fi look.

## 5. Playable room layout
The main hall is a usable room with explicit gameplay zones.

### Walkable area
A polygon-based floor mask replaces the current simple rectangular bounds. Raika can walk only on the visible usable floor and valid transition zones.

### Collision / blocked zones
Raika must not walk through:
- punching bag
- weapon racks
- structural columns
- rear furniture / altar zone
- walls
- non-walkable exterior edges

### Interactable points
Five v1 interactables:
1. Training Bag
2. Weapons Wall
3. Training Center / central floor
4. Courtyard Exit
5. Seika Meditation Point

Each interactable has:
- a trigger radius / zone
- a subtle visual highlight when Raika approaches
- one contextual prompt
- one immediate response when activated

## 6. Interactions
### Training Bag
Approach -> `Interact` prompt -> short training state.
First v1 response can be a simple practice panel / objective change. Later phases can add striking animation and bag physics.

### Weapons Wall
Approach -> `Examine` prompt -> compact overlay describing the training equipment or currently available practice weapon.
No full inventory system in this phase.

### Training Center
Entering the center can trigger the current dojo objective and tutorial guidance.
This becomes the primary training hotspot.

### Courtyard Exit
Approach -> `Go to Courtyard` prompt.
For dojo v1 the transition may remain locked or preview-only until the courtyard gameplay scene is built, but the doorway must feel real and usable.

### Seika Meditation Point
Approach -> `Focus` prompt -> short visual focus state:
- HUD dims slightly
- room audio/visual activity softens
- nearby important interaction points can become more legible

This is the first taste of Seika without introducing a full combat system.

## 7. Movement feel
Keep existing walk support and improve how it feels rather than replacing it.

Required v1 movement polish:
- smoother acceleration / deceleration
- no abrupt direction snapping when changing input
- stable depth scaling
- spatially correct collision response
- controlled character size relative to room depth
- idle frame when stopped
- camera easing that follows without nausea or over-motion

Deferred from this exact milestone unless trivial:
- full sprint animation set
- jump physics
- dodge animation system
- combat movement

These remain the next movement layer after the room itself feels correct.

## 8. Camera
Use a restrained cinematic camera.

For dojo v1:
- room remains largely visible
- camera follows Raika with a soft dead-zone instead of hard-locking her to screen center
- slight horizontal / vertical easing only
- no aggressive zoom during normal walking
- interaction points may use a subtle 2-4% framing shift

The player should feel inside a room, not like the entire background is sliding around constantly.

## 9. HUD
Preserve the minimal HUD philosophy.

Keep:
- health
- Raihatsu
- objective
- minimap
- Jump / Dodge / Interact slots

Improve:
- real Raika portrait when an approved portrait asset is available
- contextual interaction prompt near the relevant object, not permanently in the center
- objective updates from room interactions
- minimap marker tied to Raika position rather than static decoration

Do not add yet:
- inventory grid
- full quest journal
- currencies
- EXP numbers
- damage numbers
- complex skill tree

## 10. Sound design hooks
Code should leave clean hooks for:
- footsteps on wood
- room ambience
- lantern / room tone
- interaction confirmation
- bag impact
- Seika focus ambience

Actual production audio can be added incrementally, but interactions should be structured so audio can be attached without rewriting game logic.

## 11. Technical architecture
Recommended file organization:

- `raishin-legacy/index.html` — game shell + HUD containers
- `raishin-legacy/styles.css` — layout, HUD and overlays
- `raishin-legacy/game.js` — orchestration and render loop
- `raishin-legacy/movement.js` — input / movement helpers
- `raishin-legacy/dojo-world.js` — room geometry, walkable polygon, collisions, interaction zones, spatial helpers
- `raishin-legacy/dojo-effects.js` — atmosphere, particles, light modulation, camera helpers
- `raishin-legacy/assets/gameplay/...` — approved premium dojo layers
- `raishin-legacy/assets/player/...` — approved Raika animation assets

No dependency on unrelated site pages or the Libi / Crazy Family game.

## 12. Data model for room objects
Each usable room object should be data-driven, for example:

```js
{
  id: 'training-bag',
  label: 'Training Bag',
  x: 310,
  y: 540,
  radius: 70,
  prompt: 'Practice',
  type: 'interact',
  collision: { ... }
}
```

This lets future dojo objects be added without hard-coding every interaction into the render loop.

## 13. Performance target
Target current desktop browsers first.

Requirements:
- stable animation near 60 fps on a normal modern desktop
- no unnecessary full-resolution re-processing each frame
- pre-load required room assets
- use lightweight canvas particles rather than large video overlays
- cap particle count and device-pixel-ratio rendering cost

Mobile remains responsive, but desktop game feel is the primary quality target for v1.

## 14. Accessibility / fallback
- keyboard remains primary input for desktop
- focusable game frame
- visible load error state
- reduced-motion preference disables / reduces non-essential ambient motion
- HUD labels remain available to screen readers

## 15. Acceptance criteria
The dojo v1 is ready for approval when:
1. the room is visibly brighter and readable without losing the warm Inazuma mood
2. Raika can move across a shaped walkable floor rather than a simple rectangle
3. she cannot walk through the main room obstacles
4. all five interaction zones can be approached and produce contextual prompts
5. at least Training Bag, Weapons Wall, Training Center and Seika produce a visible response
6. Courtyard Exit behaves as a real transition point even if the next scene is still locked
7. minimap reflects player movement
8. environmental atmosphere is present but subtle
9. camera follows smoothly without breaking the 16:9 presentation
10. the existing visual-lock constraints for Raika are not altered by code or asset changes
11. dedicated dojo tests cover geometry, interaction detection and main DOM/game contracts
12. the standalone `/raishin-legacy/` page remains independent of unrelated site apps

## 16. Out of scope for this spec
- wider world / village / forest / river
- enemy AI
- combat system
- full Raihatsu skill tree
- inventory economy
- NPC dialogue system
- save-game system
- full courtyard gameplay scene
- full 3D character model / skeletal rig

## 17. Development order after approval
1. Fix visual brightness / render quality baseline
2. Add spatial dojo world model
3. Replace rectangular movement bounds with walkable geometry and collisions
4. Add five interaction zones and contextual prompts
5. Add minimap position binding
6. Add camera easing and depth polish
7. Add atmosphere / particles / dynamic light modulation
8. Add visible interaction responses
9. Run dedicated tests and visual QA
10. Publish only after explicit approval
