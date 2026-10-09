# TeamScore Timer & Game Suite Design

## Goal
Upgrade the existing TeamScore score-counter with an advanced stopwatch/timer/interval system, natural English announcements, saved presets/history, and the complete set of approved game/training modes without replacing the existing scoreboard.

## Core rules
- Extend the current `score-counter` app in place; do not create a separate site.
- Preserve the existing score-card layout, background system, drag/resize behavior, audio layers, and current scoring controls.
- Time modes: Stopwatch, Timer, Intervals.
- Timer shell remains movable/resizable/lockable and supports compact/court/full views.
- English countdown/announcements; prefer human/natural voices and avoid a robotic fallback when no suitable voice is available.
- Voice profiles: Coach and Arena Announcer, plus optional alternate voices.
- Team names can be announced, with a separate pronunciation/voice alias.
- Persist presets, preferences, game history, rosters and player history locally; cloud/remote synchronization can layer on later.
- Provide Undo/Redo for game-suite scoring actions.

## Approved game modes
Free Score; First to X; Win by 2; Timed Game; Timed Game + Overtime; Best of 3/5; Timed Rounds; Pressure Game; Target Chase; Streak Challenge; Comeback Challenge; Sideout Challenge; Serve Pressure; Training Mode; Race / Challenge; Random Challenge / Surprise Me; Team Battle; King Rotation / King of the Court; Elimination / Survival; Countdown Target; Tournament Mode; Custom Game Builder; Four-Team Rotation (rerank at first team reaching 10, then 1+4 and 2+3, finish at 20); Spiegel / King of Underhand (bad points per player); drill-weighted scoring; player tracking; multi-team games; individual player challenges.

## Submodes / resolution rules
Golden Point; Sudden Death; timed tiebreak; First-to-X tiebreak; Overtime; Final Duel; Redemption Challenge; Adaptive Difficulty; Bonus/Penalty scoring; Streak Bonus; Alternate Turns; alternating first team between rounds; Win by 2 with optional cap.

## Timed Rounds canonical behavior
Each team receives the configured duration (example: 3:00) to score as many points as possible. Teams take turns. Across multiple rounds the starting order alternates. Winner can be total points or rounds won. Ties can trigger a timed tiebreak (default one minute each), then Golden Point.

## Pressure Game canonical behavior
Coach selects a starting score (for example 22-22 or 24-23), target, Win by 2 and set/match context. The announcer reads score and pressure events. Restart repeats the same scenario.

## Four-Team Rotation canonical behavior
Four teams keep individual scores. When the first team reaches 10, rank all four; rank 1 pairs with rank 4 on one side and rank 2 pairs with rank 3 on the other. Scores are not reset. Continue to 20 and preserve the ranking at 10 and the final ranking.

## Spiegel canonical behavior
Load player names, count bad points, allow undo, configure elimination threshold (3/5/7/10/custom), maintain Now Playing/Next/Eliminated rotation, Final Duel for last two, optional error classification by long press, and individual end summary/history.

## Statistics
Track points, lead changes, ties, longest streak, time in lead, points/minute, comeback size, serve %, sideout %, rounds won, pressure performance, and an MVP Moment summary. Player tracking is optional and must not slow normal score entry.

## Reliability
Use wall-clock timestamps rather than interval ticks for elapsed/remaining time. Restore active session after refresh where possible. Support Wake Lock when available. Never reset an active session solely because the tab becomes hidden.

## UI
Keep default usage simple: team name, score controls, timer. Advanced modes live behind a Games control / sheet. Include Recent, Favorites, Quick Start, Surprise Me, Court Mode and saved presets. Mobile controls must be large and reset must be guarded.
