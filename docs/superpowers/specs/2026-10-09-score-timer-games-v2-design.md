# Score Counter Timer & Games V2 Design

## Goal
Upgrade the existing TeamScore screen without replacing its simple score-counter flow. Add an advanced timer/stopwatch/interval engine, natural English announcements, saved presets/history, player/team rosters, and a catalog of competitive/training game modes.

## Non-negotiable UX
- Default view stays simple: team name, score, +/-, timer.
- Advanced controls open on demand and must not break current card layout, columns, dragging/resizing, or score controls.
- Timer remains movable/resizable/lockable and persists its placement.
- English countdown voice only; do not fall back to a clearly robotic voice. If a preferred natural browser voice is unavailable, use tones and visual countdown instead.
- Voice profiles: Coach and Arena Announcer (dramatic fighting-game arena feel without copying protected voice assets or branded phrases).

## Timer modes
1. Stopwatch: count up, pause/resume/reset, lap/split, optional auto-lap.
2. Timer: count down from configurable time, quick +/- time, overtime, restart.
3. Intervals: work/rest/rounds/start delay/between-set break, skip, repeat.

## Reliability
- Derive elapsed/remaining time from timestamps, not tick counts.
- Persist active session, preset, layout, history, and preferences in localStorage.
- Resume after refresh/backgrounding based on timestamps.
- Use Screen Wake Lock when available while active.

## Announcements
- Natural English voice selection with preferred high-quality voice names.
- Countdown options: silent, tones, 3..1, 10..1, voice+tones.
- Dynamic phrases for team names, score, lead changes, ties, match/set point, streaks, comeback, rounds, work/rest, time, finished.
- Team display name may have separate English pronunciation alias.

## Game catalog
Primary modes:
- Free Score
- First to X
- Win by 2
- Timed Game
- Timed Game + Overtime
- Best of 3 / Best of 5
- Timed Rounds
- Pressure Game
- Target Chase
- Streak Challenge
- Comeback Challenge
- Sideout Challenge
- Serve Pressure
- Training Mode
- Race / Challenge
- Random Challenge / Surprise Me
- Team Battle
- King Rotation / King of the Court
- Elimination / Survival
- Countdown Target
- Tournament Mode
- Custom Game Builder
- Four-Team Rotation: first team to 10 triggers ranking; place 1+4 share one side and 2+3 the other; continue to 20.
- Spiegel / King of Underhand: player names, bad-point counters, thresholds, elimination/final duel, optional categorized errors.
- Weighted drill scoring
- Player Tracking inside team games
- Multi-team games
- Individual player challenges

Secondary resolution modes:
- Golden Point
- Sudden Death
- Tiebreak Round
- Timed Tiebreak
- First-to-X Tiebreak
- Overtime
- Final Duel
- Redemption Challenge
- Adaptive Difficulty
- Bonus/Penalty scoring
- Streak Bonus
- Alternate Turns
- Round-order switching
- Win-by-2 with optional cap

## Timed Rounds
Each team gets the same configurable turn duration (default examples use 3:00). A turn locks its score at time. After each team has played, the round summary appears. Round order alternates. Overall winner can be total points or rounds won. Default tiebreak: one timed minute each, then Golden Point if still tied.

## Pressure Game
User chooses starting scores and finish rules. Announcer reads every score change and important state. Restart repeats the exact scenario.

## Four-Team Rotation
Track four individual team scores. When the first team reaches 10, rank all four. Pair #1 with #4 on one side, #2 with #3 on the other. Keep individual scores; continue until a team reaches 20; show ranking at 10 and final ranking.

## Spiegel
Track players, not teams. A tap adds a bad point; undo/redo supported. Configurable elimination threshold. Long press/category menu can record reception, drop, out, double, net, serve, other. Track current/next player, elimination, final duel, and per-player summary.

## Data and history
- Roster per team with optional number, pronunciation alias, attendance.
- Player profile accumulates game count, bad points, serve/sideout %, streaks, pressure results, records, notes, goals.
- Session history stores mode, duration, rounds, laps/splits, teams, players, results, and game stats.
- Export/copy summary hooks; CSV for lap/split/stat rows.

## Statistics
Track total points, lead changes, ties, longest streak, time in lead, deciding points, comeback size, round performance, points/minute, serve %, sideout %, and an MVP Moment summary.

## Implementation boundary
V2 must be additive. Existing TeamScore markup is injected from the compressed app; new V2 scripts detect existing cards and score buttons and augment behavior without replacing the underlying score source of truth.
