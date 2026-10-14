# Score Counter Time Hub — Design

**Date:** 2026-10-14

## Intent

Create one visible, consistent time-control surface for the existing Score Counter without introducing another timer engine and without rewriting the rules of existing games.

Success means that a coach sees one clear clock/control layer regardless of whether the active source is the standalone Time Center, Game Suite timed modes, or Timed Rounds. Existing game logic remains authoritative.

## Current architecture

The Score Counter currently has multiple time-owning subsystems:

- `score-time-center.js` — standalone Stopwatch / Timer / Intervals / Overtime engine.
- `score-game-suite.js` — internal timer state used by timed game modes.
- `score-timed-rounds.js` — dedicated turn/round/transition/tiebreak timing engine.
- Legacy timer UI from the compressed base app.

The problem is not that these engines exist; the problem is that more than one timing surface can be visible and users have to understand which one is currently authoritative.

## Chosen architecture

### Principle: one hub, multiple adapters

Add a new presentation/control layer named **Time Hub**. It does not own elapsed time. It asks adapters for the currently authoritative time source and renders that source through one consistent interface.

The hub selects exactly one provider at a time by priority:

1. Active dedicated timed-game provider, such as Timed Rounds.
2. Active Game Suite timed mode.
3. Standalone Time Center.
4. No provider — hub remains available in idle state and opens Time Center when the coach wants a standalone timer.

This avoids a fifth timer state and prevents drift between displays.

## Provider contract

Every provider exposed to the hub returns a normalized snapshot:

```js
{
  id: string,
  label: string,
  kind: 'stopwatch'|'countdown'|'interval'|'game',
  status: 'idle'|'ready'|'running'|'paused'|'finished',
  valueMs: number,
  sign: ''|'+',
  phase: string,
  context: string,
  primaryAction: null|{id:string,label:string},
  actions: Array<{id:string,label:string,enabled:boolean}>
}
```

A provider also exposes an action dispatcher:

```js
perform(actionId: string): boolean
```

The hub never edits provider state directly.

## Providers

### Time Center adapter

Reads `window.TeamScoreTimeCenter.state` and uses its existing public methods (`start`, `pause`, `reset`, `lap`, `split`, `skip`, `overtime`, `open`).

Displayed context includes Stopwatch, Timer, interval phase/round/set, and Overtime.

### Timed Rounds adapter

Reads `window.TeamScoreTimedRounds.getRuntime()` plus the active Game Suite session.

Displayed context includes active team, transition/turn/golden/finished phase, round, tiebreak, and remaining deadline time.

Actions map only to existing Timed Rounds methods: start now, pause/resume, skip turn, and existing transition controls when exposed.

### Game Suite adapter

Used for active time-based Game Suite modes not superseded by a dedicated provider. It reflects the suite timer/game session rather than creating new timing state.

Modes initially covered:

- Timed Game
- Timed + Overtime
- Target Chase when time-limited
- Countdown Target

The adapter should rely on a small public read/control API added to `score-game-suite.js` rather than reaching into private closure state from the hub.

## Visual behavior

The hub is a compact floating HUD that can expand into the full Time Center when needed.

Compact state shows:

- current source/mode
- large clock
- phase/context line
- primary play/pause/start action
- secondary context-valid actions

Examples:

- `TIMER · 02:14 · Running`
- `TIMED ROUNDS · Team Blue · Round 2/4 · 01:37`
- `INTERVALS · REST · Round 5/8 · 00:16`
- `OVERTIME · +00:28`

The user must never see controls that do not make sense for the active provider.

## Legacy timer behavior

The old compressed-app timer surface is visually suppressed when the Time Hub is active. Its underlying data is not deleted as part of this change.

The existing `score-suite-timer-more` and quick timer affordances remain hidden as they are today; the Time Hub becomes the canonical visible entry point.

## State and persistence

The hub stores only UI preferences such as collapsed/expanded position. It does not persist clock state.

All authoritative state remains in the source provider's existing storage/runtime.

## Background correctness

Clock values are derived from provider wall-clock/deadline state every render. The hub does not increment its own counter. Returning from a background tab therefore reflects the provider's real time rather than accumulated animation ticks.

## Events and refresh

Providers may emit a shared browser event `teamscore:timechange` after meaningful state changes. The hub also performs a lightweight periodic refresh for running clocks so visual seconds update smoothly.

The periodic refresh is presentation-only and never mutates game state.

## Failure behavior

- If a provider disappears while the hub is open, the hub reselects the next valid provider.
- If an action is unavailable, it is not shown or is disabled.
- If no active timed game exists, Time Center is the fallback provider.
- If Time Center is unavailable during early load, the hub shows an idle state and retries after scripts initialize.

## Files

### New

- `score-counter/score-time-hub.js` — provider selection, normalized snapshots, action routing, HUD rendering.
- `score-counter/score-time-hub.css` — hub presentation only.
- `score-counter/score-time-hub-regression.test.js` — structural regression coverage for provider priority, no independent timer state, action routing, and loader presence.

### Modified

- `score-counter/index.html` — load Time Hub CSS/JS after timing providers.
- `score-counter/score-time-center.js` — expose a normalized read helper/event hooks without changing timer semantics.
- `score-counter/score-timed-rounds.js` — expose a read snapshot/action surface or event hooks needed by the adapter.
- `score-counter/score-game-suite.js` — expose a minimal public timer/game timing API for active timed modes.
- `score-counter/score-time-center.css` or a narrowly scoped hub rule — suppress duplicate legacy timing UI where necessary.

## Explicit non-goals

- Do not merge all existing timer engines into one engine in this change.
- Do not rewrite Timed Rounds game rules.
- Do not change scoring rules.
- Do not replace existing localStorage formats unless a compatibility bug requires it.
- Do not add a new independent `setInterval`-driven clock state.

## Testing strategy

Regression tests must prove:

1. The Time Hub has no authoritative `running/baseMs/deadline` timer state of its own.
2. Provider priority chooses dedicated active game timing before Game Suite, then Time Center.
3. Hub actions delegate to provider APIs rather than mutating their internal state.
4. Timed Rounds context includes active team/round/phase.
5. Time Center context covers stopwatch/timer/interval/overtime.
6. Game Suite exposes the minimum read/control API for supported timed modes.
7. The loader includes hub CSS/JS in the correct order.
8. Existing timing regression tests continue to pass.

## Acceptance criteria

A coach can open Score Counter and see a single authoritative timing HUD. Starting or pausing from the HUD changes the already-active timing engine. Switching into Timed Rounds changes the HUD automatically to that game's team/round timer. Leaving the timed game falls back to the standalone Time Center. No duplicate visible timers appear, and existing game behavior remains unchanged.