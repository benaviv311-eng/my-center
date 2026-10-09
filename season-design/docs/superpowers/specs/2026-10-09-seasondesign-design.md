# SeasonDesign — Product & Architecture Design

**Date:** 2026-10-09  
**Status:** Approved conversational design, written spec for review  
**Repository:** `benaviv311-eng/my-center`  
**Application root:** `season-design/`  
**Product name:** SeasonDesign  

## 1. Product intent

SeasonDesign is a standalone coaching application for planning, generating, adapting, and reviewing volleyball practices and multi-practice programs. It must behave as a coaching system rather than a random drill generator.

The product combines four sources of truth:

1. the approved exercise bank maintained in Google Sheets;
2. the history and current level of each saved group;
3. deterministic planning rules such as duration, focus priority, repetition limits, and progression;
4. AI for interpreting free-text intent, connecting compatible exercises, and proposing new material only when permitted.

Success means a coach can open the app on a phone, select a saved group, generate a practice that is realistically usable, edit only the parts that need adjustment, run the practice, submit feedback, and receive a better-informed recommendation next time.

## 2. Product boundaries

SeasonDesign is a new application with its own URL, authentication, database, PWA shell, and deployment. It will live in the existing `my-center` repository under `season-design/` as an isolated application and can later be split into a dedicated repository without changing product behavior.

It must not depend on the existing `my-center` site at runtime. Shared repository location is an organizational choice only.

Version 1 is private/invite-only, but the data model and authorization must support multiple coaches from the start.

## 3. Technology stack

- **Frontend / server:** Next.js + TypeScript
- **Database / auth:** Supabase + PostgreSQL
- **Authentication:** Google sign-in through Supabase Auth
- **Authorization:** Supabase Row Level Security
- **Deployment:** Vercel for the app, Supabase for data/auth
- **Mobile:** installable PWA
- **Exercise source:** Google Sheets synchronized into PostgreSQL
- **AI:** server-side integration only; no provider keys exposed to the browser

## 4. Main navigation

Mobile bottom navigation:

- Home
- Groups
- Create Practice
- Programs
- Library

Coach Draft is available from the Library, from a practice block, from an exercise, and from a secondary menu. Desktop uses a wider sidebar with the same destinations plus Coach Draft.

History and feedback are primarily accessed from the relevant group or practice rather than occupying a permanent bottom-nav item.

## 5. Home screen

The home screen is a work dashboard, not a static landing page. It should show:

- upcoming / next planned practice;
- recently used groups;
- active programs and current session position;
- feedback that still needs completion;
- quick resume actions;
- contextual recommendation for what to do next.

Example states:

- “Finish feedback for yesterday’s practice.”
- “Session 5 of 12 is next.”
- “Reception has been the primary focus in 3 of the last 4 practices.”

## 6. Saved groups

A coach can create permanent saved groups or use a temporary unsaved group for one-off practice generation.

Each saved group stores:

- free-form group name;
- broad age category;
- free-form age / grade label;
- typical player count;
- optional notes and recurring constraints;
- general level;
- per-skill levels;
- practice history;
- program history;
- feedback history;
- exercise usage history.

A saved group is the main context object for adaptive generation.

## 7. Group profile screen

The group screen is the coaching control center for that group.

It contains:

### 7.1 Group summary

- name;
- age/grade;
- typical player count;
- general level;
- notes / recurring constraints.

### 7.2 Skill-level profile

Each skill is tracked separately rather than inheriting one global group level.

Initial level vocabulary:

- beginner;
- basic;
- intermediate;
- advanced;
- competitive.

Skills include at minimum:

- forearm pass / underhand platform work;
- overhead setting;
- serve;
- attack;
- block;
- defense;
- reception;
- coverage;
- transitions.

The app may recommend a level change, but the coach remains authoritative. Store both system recommendation and coach-approved level.

### 7.3 Recent work

Show recent practices with:

- date;
- topic;
- focus 1 / 2 / 3;
- style;
- level;
- main exercises;
- feedback summary.

### 7.4 Topic balance

Track:

- number of practices per topic;
- number of appearances as focus 1, 2, or 3;
- time since topic last appeared;
- exercise repetition frequency.

### 7.5 Active program

Show current program position, completed sessions, future sessions, and any proposed adaptations.

### 7.6 Current state summary

At the top of the screen show 2–4 actionable coaching observations such as:

- reception needs reinforcement;
- serving is progressing well;
- attack has not been trained recently;
- one exercise has been repeated too frequently.

## 8. Practice generator input

The Create Practice screen supports both structured controls and one main free-text instruction field.

### 8.1 Group

Choose:

- saved group;
- temporary group.

A saved group automatically supplies history, player count, age context, skill levels, active program, and recent feedback.

### 8.2 Duration

Quick options:

- 45;
- 60;
- 75;
- 90 minutes;
- custom.

### 8.3 Practice style

Options:

- regular;
- technical;
- game-based;
- advanced;
- custom.

Style changes the distribution of technical vs. complex/game-like work.

### 8.4 Main topic

Main practice topics:

- reception;
- serve;
- attack;
- coverage;
- transitions;
- block;
- defense;
- attack-to-defense transition.

The topic describes the game context and how elements should connect; it is not merely a skill label.

### 8.5 Focus priority

A practice supports 1–3 ordered focuses.

- **Focus 1:** main focus; may progress through isolated → fixed → complex → game situation.
- **Focus 2:** secondary; reduced basic technique, more integration into complex/game-like work.
- **Focus 3:** tertiary; mainly appears inside combined drills, sequences, and game situations.

Focus order is meaningful and affects time and technical depth.

### 8.6 Warm-up mode

Options:

- existing fixed warm-up;
- topic-based warm-up;
- warm-up game;
- generator chooses;
- saved custom warm-up.

Coaches can build and save multiple named fixed warm-ups.

### 8.7 Detail level

Options:

- short;
- normal;
- detailed.

Every exercise still supports an explicit “show explanation” action.

### 8.8 Exercise-source policy

Options:

- library only;
- prefer library;
- free generation.

Default is **prefer library**.

Any AI-created exercise must be visibly marked as new and must not enter the canonical bank automatically.

### 8.9 Free-text instruction

The coach can add natural-language constraints and intent, for example:

> Reception is still unstable. I want a game-based session, little standing in lines, and attack should remain a secondary focus.

The system interprets this instruction as a constraint layer on top of structured inputs.

## 9. Practice structure logic

There is no single fixed practice template.

The generator chooses structure according to style, duration, priorities, group level, history, and available exercises.

General behavior:

- technical practices allocate more time to isolated/fixed work;
- game-based practices reach complex and game situations earlier;
- advanced practices assume more technical base and allocate more time to decision-making and realistic sequences;
- custom mode allows the coach to override structural choices.

The final practice must pass a duration check. Total planned block duration must equal the requested practice duration unless the coach later edits it manually.

## 10. Exercise bank

The approved Google Sheet remains the editorial source for the core exercise bank.

Current major skill tabs include:

- warm-up games;
- forearm / underhand work;
- overhead setting;
- attack;
- block;
- serve.

The technical progression stored in the bank is:

- isolated;
- fixed;
- complex;
- game situations.

Game situations are their own category and do not require a one-to-one progression mapping.

The app uses synchronized database copies for speed, stability, tagging, search, and version history.

## 11. Legacy / additional bank

The “additional bank” from the Sheet is not merged blindly into the core skill tabs.

It is normalized into separate content types:

- group games;
- competitive games;
- game-flow sequences;
- transition ideas;
- warm-up ideas;
- coaching tags.

Items may be used in the middle or at the end of practice depending on topic and style.

Each item stores a short name plus an optional full explanation including setup, flow, rules, coaching cues, and variations.

## 12. Exercise synchronization from Google Sheets

Google Sheets is an editorial source, not the runtime database.

Synchronization imports/updates canonical content in PostgreSQL.

Each synchronized item records:

- source type = `sheets`;
- source spreadsheet id;
- source sheet/tab;
- source row/key when available;
- source revision/hash;
- synchronized-at timestamp.

The system must preserve historical snapshots. Updating an exercise in Sheets must not mutate past practice history.

User-created exercises use `source = user`.

AI-created exercises use `source = generated`.

## 13. Hybrid recommendation engine

The practice generator is hybrid by design.

### 13.1 Deterministic layer

The deterministic engine owns facts and constraints:

- requested duration;
- focus priority;
- practice style;
- group history;
- skill levels;
- active program;
- player count;
- age context;
- exercise eligibility;
- exercise repetition;
- source policy;
- recent feedback;
- available warm-ups and game sequences.

It filters and ranks eligible content before AI is used.

### 13.2 AI layer

AI is used to:

- interpret free text;
- connect compatible exercises into a coherent flow;
- explain why a block was selected;
- suggest program adjustments;
- summarize feedback;
- propose a new exercise when allowed and when the bank lacks a suitable option.

AI must not invent group history or silently overwrite a skill level.

### 13.3 Final validation

Before returning a practice, validate:

- total duration;
- focus priorities;
- level appropriateness;
- player-count compatibility where known;
- avoid unnecessary repetition;
- source policy compliance;
- no duplicate blocks unless intentional;
- logical progression / game connection.

## 14. Selection rationale

Every generated block supports a short optional rationale, e.g.:

- “Selected because the group remains intermediate in reception.”
- “This progresses the drill used in the previous session.”
- “Exercise X was avoided because it appeared in the previous two practices.”

The app must distinguish facts from system inference.

## 15. Editing a generated practice

The coach can edit a single block without regenerating the entire practice.

Actions per block:

- replace exercise;
- change duration;
- open explanation;
- delete;
- reorder;
- create variation.

Replacement should preserve the role of the block: similar target, level, focus priority, and duration rather than arbitrary substitution.

## 16. Saved practices

A generated or manually assembled practice can be:

- saved;
- reopened;
- edited;
- duplicated;
- converted to a reusable template.

Each practice stores snapshots of its exercise content so later library edits do not rewrite history.

## 17. Programs / season planning

SeasonDesign supports multi-practice programs.

Quick counts:

- 8;
- 10;
- 12;
- 16;
- custom number of sessions.

Programs are organized around **topics and development goals**, not a fixed list of drills.

A program stores intended topic distribution, focus priorities, and progression targets.

## 18. Adaptive programs

Adaptation means changing future planning according to where the group actually is.

Two adaptation dimensions:

1. **Difficulty adaptation** — choose easier or harder exercises within a topic.
2. **Topic-distribution adaptation** — increase or decrease the number/weight of future sessions devoted to a topic.

Example: if serve reception remains a major weakness, the system may propose more reception sessions, promote reception from focus 2 to focus 1 in future sessions, or reduce weight from a topic already progressing well.

The system proposes changes; the coach approves them.

## 19. Post-practice feedback

Every completed practice supports a “close practice” feedback flow.

Feedback combines structured ratings and free text.

At minimum:

- rating for each focus;
- overall difficulty: too easy / appropriate / too hard;
- optional overall practice rating;
- free-text notes;
- optional indication of what was actually completed vs. skipped.

Example free text:

> Deep reception was good, but they were late on short balls.

The system uses both ratings and text to recommend future adjustments.

## 20. Progress inference

The system must not automatically equate one good practice with a permanent level increase.

Store separately:

- current coach-approved level;
- system-suggested level;
- evidence/reason for recommendation;
- historical level changes.

The coach can approve, reject, or override a recommendation.

## 21. Coach Draft

Coach Draft is a dedicated visual exercise-design board inside SeasonDesign.

Its purposes:

- build a drill from scratch;
- visually explain an existing drill;
- save reusable drill templates;
- publish a draft as a personal exercise;
- insert a designed exercise into a practice or program.

## 22. Coach Draft layout

### 22.1 Top bar

- draft name;
- save status;
- New;
- Save;
- Duplicate;
- Add to Practice;
- Presentation Mode;
- Export.

### 22.2 Right toolbox

Draggable items:

- Team A player;
- Team B player;
- coach;
- ball;
- cone;
- hoop;
- bench;
- target;
- text;
- arrow;
- player-movement arrow;
- ball-path arrow;
- dashed arrow;
- marked zone.

### 22.3 Center canvas

Court options:

- full court;
- half court;
- flip sides;
- show/hide net;
- show/hide position numbers.

Objects can be moved, duplicated, deleted, resized where appropriate, rotated, locked, and multi-selected.

### 22.4 Left properties panel

Properties depend on selected object.

Player properties include:

- number;
- optional name;
- team;
- role;
- display style.

Arrow properties include:

- movement vs. ball path;
- line type;
- thickness;
- arrow style.

## 23. Coach Draft frames / steps

A draft contains ordered frames.

A new frame is created as a copy of the previous frame so the coach only changes what moved.

Frame actions:

- add before/after;
- duplicate;
- reorder;
- delete;
- add short explanation.

Example:

1. starting positions;
2. serve;
3. receiver movement;
4. set;
5. attack.

Version 1 uses step-by-step playback rather than advanced continuous animation.

## 24. Coach Draft exercise metadata

A draft can store:

- title;
- objective;
- type: warm-up / isolated / fixed / complex / game situation / game;
- primary skill;
- secondary skill;
- level;
- player count;
- duration;
- equipment;
- explanation;
- coaching cues;
- variations.

Save states:

- draft;
- template;
- personal library exercise.

“Create variation” duplicates the exercise while retaining a parent/reference relationship.

## 25. Coach Draft presentation mode

Presentation mode hides editing controls and shows only:

- court;
- objects;
- frame controls;
- concise explanation.

It is optimized for showing a drill to players or an assistant coach on court.

## 26. Coach Draft mobile behavior

On phones the board favors landscape/full-screen use.

- toolbox and properties become drawers;
- long press + drag moves objects;
- two-finger gestures support zoom/pan;
- court remains the dominant visual area.

## 27. Library screen

The Library supports search/filter across:

- core exercises;
- warm-up games;
- saved warm-ups;
- group games;
- game-flow sequences;
- Coach Draft exercises;
- personal exercises;
- AI-generated saved exercises.

Filters include:

- skill;
- type;
- level;
- player count;
- source;
- age/grade when relevant.

Actions include:

- open explanation;
- add to practice;
- open in Coach Draft;
- create variation.

## 28. Data model

Core tables/entities:

- `profiles`
- `groups`
- `group_skill_levels`
- `skill_level_history`
- `exercise_items`
- `exercise_versions`
- `exercise_tags`
- `warmups`
- `drafts`
- `draft_frames`
- `draft_objects`
- `practices`
- `practice_blocks`
- `programs`
- `program_sessions`
- `feedback`
- `group_progress_events`
- `sheet_sync_runs`

Additional join tables may be introduced for tags, focus mappings, program-session relationships, and exercise variants.

Every user-owned entity includes an owner/user id where applicable.

## 29. Data immutability and history

Historical records must be reproducible.

- Practices store exercise snapshots or immutable version references.
- Feedback never rewrites past practice content.
- Skill-level changes append history rather than replacing historical evidence.
- Sheet sync creates/updates current canonical versions without mutating completed-practice snapshots.

## 30. Error and missing-data behavior

The system must be explicit about uncertainty.

### New group with no history

Use coach-entered levels and say that no historical evidence exists yet.

### Not enough matching exercises

Do not silently return weak matches. Tell the coach there are insufficient approved matches and offer:

- relax constraints;
- generate a new exercise if source policy allows.

### Practice too long for requested time

Prioritize in focus order: focus 1, then 2, then 3. Show what was shortened or removed.

### Feedback conflicts with history

Recent coach feedback is treated as important evidence but does not erase older data.

### Sheets unavailable

Use last successful synchronized version.

### AI unavailable

Saved groups, history, programs, and saved practices remain readable/editable. AI-dependent generation or interpretation is disabled gracefully.

## 31. PWA and offline expectations

SeasonDesign is installable as a PWA.

Offline / weak-network support should include cached application shell plus recently viewed/saved group and practice data where technically safe.

AI generation, Google sign-in refresh when needed, and Sheets synchronization require network access.

The first implementation does not promise full offline editing synchronization for every object; conflict-safe online-first behavior is preferred over fragile offline writes.

## 32. Security

- Google Auth through Supabase.
- Row Level Security on user-owned tables.
- A coach can access only their own groups, programs, practices, feedback, drafts, and personal exercises.
- Canonical/shared exercise data is readable according to policy but writable only by authorized admin/sync processes.
- Sheet synchronization is restricted to admin/server context.
- AI credentials and service-role keys never reach client code.

## 33. Multi-user readiness

Version 1 is private/invite-only but must be multi-tenant structurally.

No schema should assume there is only one coach.

Public community sharing, marketplace features, coach-to-coach collaboration, and organization management are out of scope for version 1.

## 34. Version 1 scope

Version 1 includes:

- Google sign-in;
- saved groups and temporary groups;
- per-skill level tracking;
- synchronized exercise library;
- practice generation;
- individual block editing;
- saved practices/templates;
- post-practice feedback;
- progress recommendations;
- multi-session programs;
- adaptive program recommendations;
- basic Coach Draft;
- PWA installation;
- history and analytics needed for generation.

Explicitly deferred:

- advanced Coach Draft animation;
- public community sharing;
- marketplace;
- complex coach collaboration;
- public profile/social layer;
- advanced organization/team administration.

## 35. Testing requirements

### 35.1 Generator tests

Verify:

- total duration matches requested duration;
- focus 1 receives greater weight than lower-priority focuses;
- practice style changes block distribution;
- group level changes eligible exercises;
- recent repetition reduces ranking appropriately;
- source policy is honored;
- a temporary group cannot leak into another group’s history;
- changing one block does not regenerate unrelated blocks.

### 35.2 Program tests

Verify:

- planned topic distribution is preserved unless an adaptation is approved;
- feedback can generate an adaptation proposal;
- adaptation changes future sessions only;
- coach rejection preserves existing future plan.

### 35.3 History tests

Verify:

- completed practice snapshots remain unchanged after Sheets updates;
- skill history is append-only;
- group A never affects group B recommendations except through shared canonical library data.

### 35.4 Coach Draft tests

Verify:

- object position persistence;
- frame duplication;
- frame reordering;
- save/reopen fidelity;
- touch interaction;
- presentation mode;
- publishing a draft into personal library;
- variant parent relationship.

### 35.5 Security tests

Verify RLS denies cross-user access for every user-owned table.

## 36. Product success criteria

Version 1 is successful when the coach can:

1. sign in from phone or desktop;
2. create/select a saved group;
3. generate a usable practice based on topic, priorities, level, history, and free-text intent;
4. understand why major blocks were selected;
5. replace or edit individual blocks without rebuilding everything;
6. run and save the practice;
7. submit structured + free-text feedback;
8. see the group profile and recommendations improve over time;
9. build an 8+ session topic-based program and adapt it based on group needs;
10. visually build and save a drill in Coach Draft.

## 37. Architecture boundaries

The implementation should keep the following units independent:

- **Auth & tenancy** — identity and authorization only.
- **Library sync** — Sheets → normalized exercise data.
- **Library search/ranking** — deterministic eligibility and ranking.
- **Practice composer** — constructs a practice plan from ranked candidates and coach constraints.
- **AI interpretation** — free-text parsing, explanations, new-exercise proposal, feedback summarization.
- **Group progression** — skill-level state, history, and recommendations.
- **Programs** — topic plan and adaptation proposals.
- **Coach Draft** — visual model, frames, objects, and publication into library.
- **Feedback** — post-practice input and evidence generation.

Each unit should expose explicit typed interfaces so internal changes do not require broad rewrites.

## 38. Deployment boundary inside `my-center`

Although the code lives in `benaviv311-eng/my-center`, the SeasonDesign app is deployed from the `season-design/` root as an independent Vercel project with its own environment variables, URL, build settings, and Supabase project.

No production import path should depend on the legacy site outside `season-design/` unless explicitly introduced later as a shared package.

## 39. Key product principle

SeasonDesign must always separate three concepts:

- **known facts** — saved data, history, approved levels, canonical exercises;
- **system inference** — recommendations, level-change suggestions, balance observations;
- **generated content** — AI-created exercise or explanatory text.

The UI should make those distinctions understandable so the coach remains in control.

## 40. Final decision summary

SeasonDesign is a standalone, cloud-synchronized, multi-user-ready coaching PWA built with Next.js and Supabase, hosted independently while living under `my-center/season-design/` in the current repository.

Its core workflow is:

**Group context → topic/focus request → deterministic filtering/ranking → AI-assisted composition → coach editing → practice execution → feedback → progression/program recommendation.**

Coach Draft complements this by allowing a coach to visually design exercises and publish them into their personal exercise library.

This document defines Version 1 product behavior and architectural boundaries. Implementation planning must preserve these decisions unless the written spec is explicitly revised and re-approved.
