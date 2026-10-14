# DOUBLE Premium Neon Arcade — Design Spec

Date: 2026-10-14
Status: Proposed for implementation
Scope: DOUBLE only (`double.html`, main game wrapper/core, daily challenge, statistics, menu, audio/FX). The rest of `העולם שלי` is out of scope for this pass.

## 1. Goal

Transform DOUBLE into a polished, commercial-feeling arcade experience while preserving all existing game modes, icon packs, daily challenge, statistics, announcer options, controls, and local progress.

Success means:
- Landing feels like a premium game rather than a utility page.
- Visual hierarchy is obvious: current mode → playable cards → primary CTA → secondary controls.
- Motion and sound add energy without obscuring gameplay.
- Desktop and mobile both feel intentionally designed.
- Existing localStorage keys and gameplay behavior remain backward-compatible.
- Reduced-motion and audio-off preferences are respected.

## 2. Approaches considered

### A. Cosmetic skin only
Colors, background, shadows and typography only.

Pros: fastest, lowest risk.
Cons: menu, daily, stats and finish states would still feel like separate products.

### B. Unified Premium Neon design system — selected
One shared visual/motion/audio language across landing, lobby, gameplay shell, daily challenge, statistics and finish states, while keeping existing game logic intact.

Pros: strongest visible upgrade with controlled technical risk.
Cons: touches multiple presentation modules and requires regression testing.

### C. Full gameplay rewrite
Rebuild UI/state into a new SPA architecture.

Pros: cleanest long-term architecture.
Cons: unnecessary risk for this goal; could break mature gameplay and stored progress. Rejected.

## 3. Visual identity

Name: **DOUBLE — Premium Neon Arcade**

Mood: energetic, premium, futuristic, playful without looking childish.

### Core palette
- Deep Navy `#060B18`
- Midnight `#0B1530`
- Space Indigo `#171A3D`
- Electric Blue `#49A6FF`
- Arcade Gold `#FFD84D`
- Hot Pink `#FF5C82`
- Mint Success `#63E6BE`
- Energy Orange `#FFB347`
- Error Red `#FF6B7F`
- Glass Surface `rgba(10,20,46,.72)`
- Glass Border `rgba(255,255,255,.12)`

Semantic rules: Player 1 blue, Player 2 pink, daily/records/trophies gold, success mint, mistakes red.

## 4. Shared design system

Create shared presentation files that never own game state:
- `double/premium-theme.css` — tokens, surfaces, buttons, cards, HUD, modals, responsive layout.
- `double/premium-motion.css` — entrance, hover, success, error, countdown, trophy, shimmer and parallax motion.
- `double/premium-effects.js` — particles, glow reactions, reduced-motion handling and visual micro-interactions.
- `double/premium-fx.js` — isolated UI/game sound effects with the existing `double-effects-enabled-v1` preference.

Use CSS custom properties for colors, radii, shadows, glass opacity, glow intensity, durations and easing.

## 5. Landing screen

### Background
Five lightweight browser-native layers:
1. deep gradient base
2. slow aurora/radial blooms
3. star/particle field
4. subtle grid/noise texture
5. focused glow behind active cards

No video background in this pass.

### Top bar
- compact DOUBLE wordmark
- menu button as glass icon control
- small status accents only; no competing secondary navigation

### Main preview
- cards remain the visual focus
- silver-white material, edge light, inner ring and deeper contact shadow
- mode-specific glow around card pair
- HUD becomes compact glass chips

### CTA
- current game title
- one-line description
- primary gold `▶ שחק עכשיו`
- secondary actions visually quieter

## 6. Lobby/menu

Logical order remains:
1. number of players
2. game mode
3. difficulty where relevant

Then customization/settings.

Visual structure:
- glass control-center panel
- strong section hierarchy
- mode rows: icon tile + title + one short description
- selected state: border glow + soft fill
- settings visually separated from play flow

Sections: Play, Icon pack, Audio/announcer, Statistics, Help. Daily challenge remains a special gold card in single-player mode.

## 7. Gameplay presentation

Gameplay logic remains unchanged.

### Cards
- premium radial material
- cleaner edge highlight and depth
- subtle idle float
- correct: quick scale pulse + expanding ring + tiny particles
- wrong: short shake + red edge flash

### HUD
- compact chip system
- score/time/target readable instantly
- consistent player colors
- <=10 seconds: restrained warm tension glow/pulse

### Countdown
`3 → 2 → 1 → GO` with scale + blur-to-sharp + audio cue.

### Finish
- trophy rise
- result settles with scale/count-up treatment
- new record gets one gold shimmer/burst
- replay primary, return secondary

## 8. Daily challenge

Keep deterministic seed and all current rules unchanged.

Visual identity:
- gold/indigo
- richer header with date/streak
- animated 0/15 progress rail
- visible but restrained penalty feedback
- finish card highlights best, streak, completed days and penalties
- one-time gold burst for a new daily record

## 9. Statistics

Keep existing stored metrics/calculations unchanged.

Redesign:
- premium dashboard modal
- five primary metric cards
- clearer glowing reaction graph
- compact per-mode data tiles
- best values highlighted gold/mint
- destructive reset visually separated
- no external chart library

## 10. Motion rules

- interaction feedback: 120–260 ms
- page/section transitions: 280–450 ms
- background loops: 8–30 s
- no continuous aggressive pulsing
- motion never delays input

Required states: menu enter/exit, hover/press, card idle, correct, wrong, combo, daily shimmer, countdown, trophy/result, stats entrance.

If `prefers-reduced-motion: reduce`: disable parallax, float loops, shimmer sweeps and particle bursts; retain simple opacity/state changes.

## 11. Audio/music

Preserve the public `DoubleMusic` API so existing bridges keep working.

Adaptive scenes:
- `lobby`: calm synthwave arcade groove
- `play`: stronger beat/bass
- `tension`: denser/faster layer for <=10 seconds
- `victory`: loop pauses, short stinger plays

`premium-fx.js` owns independent effects:
- UI click
- menu whoosh
- correct
- combo escalation
- wrong buzz
- countdown tick
- GO
- new-best sparkle
- trophy/victory cue

Rules:
- music and FX independently controllable
- no playback before permitted user gesture
- audio failure never blocks gameplay
- announcer remains independent

## 12. Performance

- no framework migration
- no video background
- no full-screen heavy canvas renderer
- particles capped and auto-removed
- animations favor transform/opacity
- avoid layout thrashing in gameplay loops
- existing icon sprites remain lazy-loaded

## 13. Backward compatibility

Preserve:
- all current game modes
- `double-difficulty-v1`
- `double-music-enabled-v1`
- `double-effects-enabled-v1`
- announcer preference
- icon pack selection
- statistics store
- daily challenge store/streak
- versus controls/avatars
- direct-launch query parameters

No progress migration.

## 14. File map

Expected changes:
- `double.html` — premium hooks and cache version
- `double/menu-lobby.css` — shared tokens, less duplicated visual styling
- `double/menu-lobby-v3.js` — presentation hooks only; selection flow preserved
- `double-game.html` — premium end overlay/shared assets
- `double-game-core.html` / `double/game.js` — minimal state classes/events for reactions; gameplay unchanged
- `double-daily.html` — shared theme + daily gold identity
- `double/daily-challenge-game.js` — presentation/FX event hooks only
- `double/stats-ui.js` — premium dashboard markup/classes; calculations unchanged
- `double/music-engine.js` — richer scene behavior behind same API
- new `double/premium-theme.css`
- new `double/premium-motion.css`
- new `double/premium-effects.js`
- new `double/premium-fx.js`

## 15. Error handling

- missing premium stylesheet: existing inline styles remain usable
- missing visual effects module: gameplay continues
- audio blocked/unavailable: silent failure; gameplay continues
- unsupported backdrop filter: opaque readable fallback
- reduced-motion/low-performance: simplified effects

## 16. Testing

Regression:
- all single-player modes launch
- all versus modes launch
- daily deterministic sequence unchanged
- icon pack switching works
- stats record/render
- music and FX preferences persist
- announcer works
- back/replay flows work

Visual:
- menu hierarchy desktop/mobile
- cards do not overlap critical HUD/CTA
- end overlay fits small screens
- daily is playable at narrow widths
- reduced-motion disables continuous effects

Audio:
- starts only after allowed gesture
- music OFF persists
- FX OFF persists
- victory stinger recovers to later lobby/play state

Performance:
- no runaway MutationObserver loops
- no unbounded particle DOM growth
- no repeated audio-object churn in steady loops

## 17. Definition of done

Complete when landing, lobby, main game, daily challenge, stats and finish states share one Premium Neon identity; motion/audio react coherently; every mode remains playable; progress/stats/daily data remain intact; mobile is polished; reduced-motion/audio-off work; and regression/syntax tests pass.
