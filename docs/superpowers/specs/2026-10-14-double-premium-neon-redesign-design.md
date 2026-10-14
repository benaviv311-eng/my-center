# DOUBLE Premium Neon Arcade — Design Spec

Date: 2026-10-14
Status: Proposed for implementation
Scope: DOUBLE only (`double.html`, main game wrapper/core, daily challenge, statistics, menu, audio/FX). The rest of `העולם שלי` is out of scope for this pass.

## 1. Goal

Transform DOUBLE from a functional browser game into a polished, commercial-feeling arcade experience while preserving all existing game modes, icon packs, daily challenge, statistics, announcer options, and local progress.

Success means:
- The landing screen immediately feels like a premium game rather than a utility page.
- The visual hierarchy is obvious: current mode, playable cards, primary action, then secondary controls.
- Motion and sound add energy without obscuring gameplay.
- Mobile and desktop both feel intentionally designed.
- Existing data keys and gameplay behavior remain backward-compatible.
- Reduced-motion and audio-off preferences remain respected.

## 2. Approaches considered

### A. Cosmetic skin only
Replace colors, backgrounds, shadows, and typography without changing component structure.

Pros: lowest implementation risk, fastest.
Cons: does not solve the current fragmented visual hierarchy; menu, daily, stats, and end screens would still feel like separate products.

### B. Unified Premium Neon design system — selected
Create one shared visual/motion language and apply it across landing, lobby, gameplay shell, daily challenge, statistics, and finish states. Keep the existing gameplay engines and localStorage contracts intact.

Pros: strong visual upgrade with controlled technical risk; avoids rewriting working game logic; gives every screen one coherent identity.
Cons: touches multiple presentation modules and requires careful regression testing.

### C. Full gameplay rewrite
Rebuild the game UI and state management into a new single-page architecture.

Pros: cleanest long-term architecture.
Cons: unnecessary risk for this goal; could break mature game modes, audio, icon packs, stats, and daily challenge. Rejected.

## 3. Selected visual identity

Name: **DOUBLE — Premium Neon Arcade**

Mood:
- energetic
- premium
- futuristic
- playful without looking childish
- dark cinematic base with controlled neon highlights

### Core palette
- Deep Navy: `#060B18`
- Midnight: `#0B1530`
- Space Indigo: `#171A3D`
- Electric Blue: `#49A6FF`
- Arcade Gold: `#FFD84D`
- Hot Pink: `#FF5C82`
- Mint Success: `#63E6BE`
- Energy Orange: `#FFB347`
- Error Red: `#FF6B7F`
- Glass Surface: `rgba(10, 20, 46, .72)`
- Glass Border: `rgba(255,255,255,.12)`

### Semantic color rules
- Player 1: Electric Blue
- Player 2: Hot Pink
- Daily challenge / records / trophies: Arcade Gold
- Success: Mint
- Mistake: Error Red
- Neutral interactive highlight: Blue/Indigo

## 4. Shared design system

Create a shared presentation layer rather than repeating ad hoc CSS across pages.

### New shared files
- `double/premium-theme.css` — tokens, surfaces, buttons, cards, HUD, modals, responsive rules.
- `double/premium-motion.css` — entrance, hover, success, error, countdown, trophy, shimmer, parallax rules.
- `double/premium-effects.js` — lightweight particles, glow reactions, UI micro-interactions, reduced-motion detection.

These files must not own game state. They only enhance presentation.

### Design tokens
Use CSS custom properties on `:root` for:
- colors
- glass opacity
- border opacity
- shadow strength
- glow intensity
- radius scale
- motion durations
- easing curves

This ensures landing, daily, stats, and finish screens stay visually synchronized.

## 5. Landing screen

### Background
Build a layered background entirely from performant browser-native effects:
1. deep gradient base
2. slow aurora/radial light blooms
3. star/particle field
4. very subtle grid/noise layer
5. focused glow behind the active card area

No large autoplay video background in this pass. The design should remain fast on mobile.

### Top bar
- compact DOUBLE wordmark
- profile/status cluster where relevant
- menu button as glass icon button
- optional tiny live music state indicator

### Main preview area
- cards remain the visual focus
- deeper material treatment: soft silver-white card face, edge light, inner ring, contact shadow
- mode-specific glow around card pair
- preview HUD becomes compact glass chips

### Hero / CTA
- current game title large and crisp
- one-line mode description
- primary gold CTA: `▶ שחק עכשיו`
- secondary actions are visually quieter

## 6. Lobby / menu architecture

Keep the current logical order:
1. number of players
2. game mode
3. difficulty where relevant

Then expose customization/settings below gameplay selection.

### Menu visual structure
- glass control-center panel
- section headings with clear hierarchy
- mode rows use icon tile + title + one short description
- selected item receives border glow and soft fill, not a large color block
- settings grouped separately from play flow

### Sections
- Play
- Icon pack
- Audio / announcer
- Statistics
- Help
- Daily challenge card for single-player flow

The daily challenge remains visually special with gold shimmer and daily status chips.

## 7. Gameplay presentation

Gameplay logic remains unchanged.

### Cards
- premium radial material
- stronger depth and cleaner edge highlight
- subtle floating idle motion
- match reaction: quick scale pulse + expanding ring + tiny particles
- wrong reaction: short shake + red edge flash

### HUD
- central compact chip system
- score/time/target readable at a glance
- competitive modes color-code players consistently
- tension state under 10 seconds adds subtle warm glow and pulse, never screen-wide flashing

### Countdown
`3 → 2 → 1 → GO`
- center-stage scale animation
- slight blur-to-sharp transition
- one short audio cue per count

### Victory / finish
- trophy rise animation
- result number counts up or settles with scale
- new record gets gold shimmer treatment
- replay is the primary action
- return is secondary

## 8. Daily challenge

Daily challenge keeps its existing deterministic seed and gameplay rules.

Visual changes:
- gold/indigo identity
- richer header with date and streak badge
- progress 0/15 gets an animated progress rail
- penalties get visible but restrained red feedback
- finish state highlights daily best, streak, completed days, and penalties
- `שיא חדש` receives a one-time gold burst

## 9. Statistics screen

Keep the existing stored metrics and calculations.

Redesign:
- premium full-screen/modal dashboard
- five primary metric cards
- reaction graph uses glowing bars with clearer labels
- per-mode cards become compact data tiles
- best values highlighted in gold/mint
- reset action remains visually destructive and separate

No external charting dependency.

## 10. Motion system

### Principles
- 120–260 ms for interaction feedback
- 280–450 ms for page/section transitions
- background motion very slow: 8–30 seconds
- no continuous aggressive pulsing
- motion must never delay input

### Required motion states
- menu enter/exit
- mode card hover/press
- button press depth
- card idle float
- correct match pulse/ring/particles
- wrong shake/flash
- combo emphasis
- daily gold shimmer
- countdown
- result/trophy entrance
- statistics number entrance

### Accessibility
If `prefers-reduced-motion: reduce`:
- disable parallax, floating loops, shimmer sweeps, particle bursts
- keep only instant state changes or simple opacity transitions

## 11. Audio and music

The existing `DoubleMusic` interface remains the contract so current bridges do not break.

### Music architecture
Keep HTML Audio/WebAudio-generated assets local to the browser, but replace the current single-feel loop with a richer adaptive mix while preserving low file/dependency overhead.

Scenes:
- `lobby`: calm synthwave/arcade groove
- `play`: stronger beat and bass
- `tension`: faster/denser layer for <=10 seconds
- `victory`: loop pauses and stinger plays

### Sound effects
Add a dedicated lightweight FX module with independent on/off state:
- UI click
- menu whoosh
- correct match
- combo escalation
- wrong buzz
- countdown tick
- GO cue
- record/new-best sparkle
- trophy/victory cue

Audio rules:
- music and FX remain separately controllable
- no sound before browser user gesture permits playback
- audio failures must be silent failures; gameplay must continue
- existing announcer remains independent

## 12. Performance rules

- No framework migration.
- No large video backgrounds.
- No heavy canvas renderer for the whole UI.
- Decorative particles capped and auto-removed.
- Prefer CSS transforms/opacity for animation.
- Avoid layout thrashing in gameplay loops.
- Existing icon sprite packs remain lazy-loaded through current bootstrap flow.

## 13. Backward compatibility

Must preserve:
- all current game modes
- `double-difficulty-v1`
- `double-music-enabled-v1`
- `double-effects-enabled-v1`
- announcer preference key
- icon pack selection
- statistics store
- daily challenge record/streak store
- versus controls and avatars
- existing direct-launch query parameters

No user progress migration should be required.

## 14. File-level implementation map

Expected presentation changes:
- `double.html` — add shared premium theme hooks and updated cache version.
- `double/menu-lobby.css` — align with shared tokens; reduce duplicated visual rules.
- `double/menu-lobby-v3.js` — add classes/state hooks only where needed; preserve flow.
- `double-game.html` — premium end overlay and shared visual assets.
- `double-game-core.html` / `double/game.js` — minimal class/data hooks for motion/audio reactions only; gameplay logic unchanged.
- `double-daily.html` — shared premium theme and daily-specific gold identity.
- `double/daily-challenge-game.js` — presentation event hooks only.
- `double/stats-ui.js` — redesigned dashboard markup/classes without changing stats calculations.
- `double/music-engine.js` — richer scene behavior behind the same public API.
- new `double/premium-theme.css`
- new `double/premium-motion.css`
- new `double/premium-effects.js`
- optional new `double/premium-fx.js` if FX should remain isolated from visual effects.

## 15. Error handling

- Missing premium stylesheet: existing inline styles still leave the app usable.
- Missing effects module: gameplay continues without decorative motion.
- Audio unavailable/blocked: controls remain functional and music status reflects disabled/unavailable state where possible.
- Unsupported `backdrop-filter`: opaque fallback surfaces must remain legible.
- Low-performance/reduced-motion environments receive simplified effects.

## 16. Testing strategy

### Regression
- all single-player modes launch
- all versus modes launch
- daily challenge launches and deterministic sequence remains unchanged
- icon pack switching still works
- stats still record and render
- music toggle and FX toggle persist
- announcer still works
- back/replay flows still work

### Visual behavior
- menu hierarchy on desktop/mobile
- cards never overlap critical HUD/CTA areas
- end overlays fit small screens
- daily challenge remains playable at narrow widths
- reduced-motion removes continuous animation

### Audio
- music starts after an allowed user gesture
- music OFF persists
- FX OFF persists
- victory stinger does not permanently stop lobby/play recovery

### Performance
- no runaway MutationObserver loops
- no unbounded particle DOM growth
- no repeated audio-object creation in steady gameplay loops

## 17. Definition of done

The redesign is complete when:
- landing, lobby, main game, daily challenge, stats, and finish states visibly share the same Premium Neon identity
- animations and audio react coherently to game states
- every existing mode remains playable
- daily challenge/stats/progress remain intact
- mobile layout is intentionally polished
- reduced-motion and audio-off behavior work
- regression tests and syntax checks pass
