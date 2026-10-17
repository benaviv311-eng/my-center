# SeasonDesign — Training DNA Engine Design

**Date:** 2026-10-17  
**Status:** Approved conversational design, written spec for review  
**Repository:** `benaviv311-eng/my-center`  
**Application root:** `season-design/`  

## 1. Purpose

The Training DNA Engine defines how SeasonDesign thinks when it builds a volleyball practice.

The engine must not behave as a random drill picker or a fixed template generator. It must build a coherent training story around one primary outcome, use the saved group state and history, progress the learning challenge deliberately, and finish with realistic transfer into volleyball play whenever the primary focus is game-relevant.

The coach remains authoritative. The system recommends, explains, ranks, and adapts future planning, but never silently changes coach-approved group levels, permanent group state, or active program goals.

## 2. Core coaching principle

Every practice is built from the desired end state backward.

The engine asks, in order:

1. What should the group do better at the end of this practice?
2. What currently prevents that outcome?
3. What learning challenge should come first?
4. What progression best moves the group from controlled execution to realistic decision-making?
5. Which exercises best serve each role in that progression?
6. Does the final practice fit the requested time, group, load, equipment, recent history, and source policy?

The exercise library is therefore an input to the engine, not the engine itself.

## 3. Practice intent model

Each generated practice has one **Primary Outcome** and up to three ordered focuses.

### 3.1 Primary Outcome

The Primary Outcome is a volleyball behavior, not merely a skill label.

Examples:

- produce stable serve reception that allows the setter to run the offense;
- transition from block/defense into an attack-ready shape;
- create a repeatable outside-attack approach under variable sets;
- maintain serving quality under score pressure.

### 3.2 Focus priority

- **Focus 1:** primary development target. Receives the deepest progression and most dedicated time.
- **Focus 2:** supporting target. Appears in reduced isolated work and more integration.
- **Focus 3:** tertiary target. Appears mainly inside combined drills, game sequences, or constraints.

The engine must preserve focus order through composition and validation.

## 4. Training Arc

A practice is organized as a **Training Arc**, not a fixed sequence of named sections.

The conceptual arc is:

**Prepare → Solve → Stabilize → Decide → Compete**

These are roles, not mandatory blocks. One exercise may satisfy more than one role, and advanced groups may skip early roles when appropriate.

### 4.1 Prepare

Prepare the body, movement pattern, perceptual cue, and ball contact needed for the primary outcome.

Examples:

- reception: split step, lower stance, short forward movement, platform preparation;
- blocking: lateral movement, closing footwork, jump/landing, hand position;
- attack: shoulder preparation, approach rhythm, arm swing, landing control.

### 4.2 Solve

Expose the specific technical or tactical problem in a simplified environment.

The player should be able to focus on the key behavior with limited noise.

### 4.3 Stabilize

Increase repetition while keeping the task sufficiently controlled to establish repeatable execution.

### 4.4 Decide

Introduce relevant variability, perception, opponent behavior, trajectory, timing, or choice.

The player must read and act rather than repeat a known pattern.

### 4.5 Compete

Use scoring, consequences, pressure, or game constraints that reward the target behavior.

Competition must measure the practice objective rather than exist as decoration.

## 5. Relationship to progression stages

The existing progression vocabulary remains authoritative in the exercise bank:

- isolated;
- fixed;
- complex;
- game situation.

The Training Arc and progression stages are related but not identical.

Examples:

- Prepare may use isolated or fixed material;
- Solve may use isolated, fixed, or constrained complex work;
- Stabilize commonly uses fixed or complex work;
- Decide commonly uses complex or game-situation work;
- Compete normally uses game situations, competitive games, or game-flow sequences.

The engine must not force every practice through all four progression stages.

Group level, recent evidence, practice style, time, and objective determine the starting point and depth.

## 6. Training DNA quality dimensions

Every candidate exercise receives scores across five positive dimensions and a set of penalties.

### 6.1 Goal Alignment

How directly the exercise trains the Primary Outcome and the assigned focus role.

High score examples:

- a serve-reception activity when the primary outcome is reception quality;
- a block-to-transition sequence when the goal is transition attack.

Low score example:

- a visually engaging game with little connection to the practice objective.

### 6.2 Progression Fit

How appropriate the exercise is relative to:

- group level;
- current point in the Training Arc;
- previous block;
- recent feedback;
- coach-approved skill level.

The engine should avoid unexplained jumps in difficulty and avoid unnecessary regression when the group is ready to progress.

### 6.3 Touch Density

Estimated number of meaningful target actions per player per minute.

The engine should prefer designs that reduce idle queues and waiting.

Touch Density is contextual: a game-situation block may intentionally have fewer contacts than an isolated block if its decision value is higher.

### 6.4 Game Transfer

How closely the player must perceive, decide, move, and execute as they would in volleyball.

A high Game Transfer score requires relevant information and decisions, not merely a court-shaped drill.

### 6.5 Flow Efficiency

How efficiently the block can run with the known player count, equipment, court count, explanation cost, and transition from the previous block.

The engine should prefer blocks that keep players active and avoid unnecessary setup churn.

## 7. Penalties

Candidate ranking may apply penalties for:

- recent repetition of the same exercise;
- excessive repetition of the same exercise family;
- long waiting lines;
- poor player-count fit;
- equipment requirements the group cannot meet;
- redundant similarity to the previous block;
- unnecessary drop in challenge;
- excessive explanation/setup time;
- violation of exercise-source policy;
- excessive physical or cognitive load relative to adjacent blocks.

Penalties reduce rank but do not rewrite the source exercise metadata.

## 8. Practice styles

Practice style changes how the Training Arc is composed.

### 8.1 Regular

Balanced progression from preparation/technical work toward realistic application.

### 8.2 Technical

More time in controlled execution, higher touch density, fewer simultaneous variables, later arrival at competitive pressure.

The practice must still include transfer when Focus 1 is game-relevant.

### 8.3 Game-based

Reaches Decide and Compete earlier. Technical correction occurs inside or between game-like blocks where possible.

### 8.4 Advanced

Assumes stronger technical foundations. Isolated work is used only for a clearly identified problem or as a short reset. More time is assigned to perception, decision-making, transitions, and realistic sequences.

### 8.5 Competitive

Used when the target skill is already sufficiently learned and the goal is execution under score, consequence, fatigue, or repeated pressure.

### 8.6 Light / Recovery

Lower physical load, controlled jump volume, useful ball contacts, technical quality, movement quality, and moderate cognitive challenge without high physical stress.

## 9. Warm-up design

Warm-up is part of the Training Arc and must prepare for the practice objective.

A topic-based warm-up can include three layers:

1. **General preparation** — temperature, joints, general movement;
2. **Movement preparation** — movement patterns needed later;
3. **Ball preparation** — contact and perception related to the target topic.

A saved fixed warm-up remains valid when the coach explicitly chooses it.

The engine must not replace a coach-selected fixed warm-up without permission.

## 10. Problem model

The engine should distinguish a broad skill rating from a specific observed problem.

Examples for reception:

- late recognition of short serve;
- poor first step;
- arriving off balance;
- unstable platform angle;
- weak target control;
- communication breakdown;
- spacing/ownership problem.

A problem statement may come from:

- coach feedback;
- structured focus rating;
- explicit free-text instruction;
- a system inference derived from multiple pieces of evidence.

System inference must be labeled as inference and must not overwrite coach-approved skill level.

## 11. Exercise progression and regression

Exercises may expose:

- one or more regressions;
- one or more progressions;
- compatible predecessor roles;
- compatible successor roles.

Example for serve reception:

throw → controlled serve → free serve → targeted serve → score-pressure reception.

During practice editing or live mode, the coach can request:

- easier;
- harder;
- similar alternative.

Replacement must preserve the block role, target, approximate duration, source policy, and group suitability where possible.

## 12. Game-transfer rule

If Focus 1 is a game-relevant volleyball behavior, the final practice must contain at least one block requiring realistic perception or decision-making tied to that focus.

A practice focused on reception cannot end entirely with coach-fed balls unless the coach explicitly overrides the rule.

The engine may surface the override as a warning rather than silently blocking the coach.

## 13. Competition design

Competitive scoring must reinforce the target behavior.

Examples:

- reception quality scoring;
- side-out points;
- consecutive successful actions;
- serve target accuracy;
- block-touch followed by transition completion;
- execution under end-of-set scoring.

Generic scoring is allowed only when it does not conflict with the learning goal.

## 14. Load model

Each block may carry three estimated load dimensions:

### 14.1 Physical Load

Examples: running, jump count, repeated explosive efforts, defensive floor work.

### 14.2 Cognitive Load

Examples: number of decisions, perceptual uncertainty, role switching, tactical rules.

### 14.3 Technical Load

Difficulty of maintaining movement/contact quality under the task constraints.

The Load Balancer evaluates adjacent blocks and total practice shape.

The purpose is not to produce medical-grade workload data. It is a coaching-level planning signal that prevents obviously poor sequencing and supports deliberate rhythm in the session.

## 15. Practice rhythm

The engine should avoid long uninterrupted runs of maximal difficulty or maximal physical load.

A practice should contain intentional waves of challenge when appropriate:

- learn;
- apply;
- reset or clarify;
- increase pressure;
- compete.

This rule is subordinate to the practice objective and coach overrides.

## 16. Exercise rationale

Every generated block can expose a concise rationale.

The rationale should answer:

- why this block;
- why now;
- what the coach should watch;
- what it prepares for next.

Example:

> Chosen after platform-control work because the group now needs forward movement before contact. Watch whether players arrive balanced before forming the platform. The next block introduces live serve variability.

Rationale must distinguish stored facts from system inference.

## 17. Coaching cues

The engine should prefer one or two active coaching cues per block.

Long explanatory text remains available behind an explanation action, but live practice mode should surface concise cues only.

Examples:

- early to the ball;
- platform to target;
- close the block gap;
- land ready to transition.

## 18. Input data

The Training DNA Engine consumes a normalized `PracticeContext` containing:

- requested duration;
- saved or temporary group context;
- Primary Outcome;
- ordered focuses;
- practice style;
- warm-up preference;
- source policy;
- free-text constraints;
- player count;
- age context;
- coach-approved skill levels;
- recent practices;
- recent exercise usage;
- recent feedback;
- active program position;
- known equipment/court constraints;
- relevant problem/evidence records.

Missing optional context must not prevent practice generation. The engine should degrade gracefully and explain when it had less evidence available.

## 19. Engine architecture

The engine is split into focused modules.

### 19.1 `PracticeIntent`

Normalizes the requested outcome, focus order, style, duration, warm-up mode, source policy, and explicit constraints.

### 19.2 `GroupState`

Builds the planning snapshot for the selected group from coach-approved levels, history, active program, constraints, and recent feedback.

### 19.3 `ProblemModel`

Represents the specific development problem/evidence relevant to the practice.

### 19.4 `TrainingArcBuilder`

Selects the necessary Training Arc roles and target time distribution.

It determines which roles can be skipped or combined based on group state, style, time, and objective.

### 19.5 `ExerciseEligibility`

Filters exercises that violate hard constraints such as source policy, incompatible player count, impossible equipment, invalid skill/category, or clearly unsuitable level.

### 19.6 `ExerciseRanker`

Scores eligible exercises using Goal Alignment, Progression Fit, Touch Density, Game Transfer, Flow Efficiency, and penalties.

The scorer should be deterministic for the same normalized context unless an explicitly randomized variation mode is requested.

### 19.7 `LoadBalancer`

Evaluates physical, cognitive, and technical load across the proposed sequence and requests substitutions or reordering when the rhythm is poor.

### 19.8 `PracticeComposer`

Builds the final ordered block sequence and assigns exact durations.

### 19.9 `PracticeValidator`

Validates hard constraints and produces warnings for soft constraints.

### 19.10 `FeedbackInterpreter`

Converts structured and free-text post-practice feedback into future-only evidence/recommendations.

It never directly updates the coach-approved skill level.

## 20. Deterministic vs. AI responsibilities

The deterministic engine owns:

- exact duration;
- focus priority;
- group facts;
- coach-approved levels;
- eligibility;
- repetition limits;
- source policy;
- progression constraints;
- game-transfer requirement;
- load limits and warnings;
- hard validation.

AI may assist with:

- interpreting natural-language intent;
- mapping feedback text to possible problem categories;
- explaining rationale in natural language;
- connecting compatible blocks into a coherent description;
- proposing a new exercise only when source policy permits;
- suggesting future program adjustments.

AI must not:

- invent group history;
- invent completed practices;
- silently change levels;
- bypass source policy;
- override duration validation;
- mark an inference as a fact.

The deterministic engine must remain capable of producing a valid practice when AI is unavailable.

## 21. Candidate scoring

Version 1 should use a transparent weighted score rather than a hidden ML model.

Conceptually:

`score = goalAlignment + progressionFit + touchDensity + gameTransfer + flowEfficiency - penalties`

Weights may vary by practice style and Training Arc role.

Examples:

- Technical style increases the weight of Touch Density and Progression Fit;
- Game-based style increases Game Transfer and decision value;
- Advanced style increases Game Transfer and reduces preference for isolated content;
- Light style increases compatibility with physical-load limits.

Exact numeric weights belong in the implementation plan and tests, not in this design spec.

## 22. Practice composition rules

The composer must:

- preserve ordered focus priority;
- allocate the largest dedicated development share to Focus 1;
- avoid unrelated filler blocks;
- create logical transitions between blocks;
- avoid duplicate or near-duplicate blocks unless intentional;
- ensure the total duration exactly equals the requested duration;
- include game transfer for Focus 1 unless overridden;
- respect warm-up choice;
- keep setup transitions practical;
- prefer compatible exercise families when they create a stronger learning progression.

## 23. Duration behavior

Requested duration is a hard constraint.

The composer can adjust block duration within exercise-supported bounds.

If the planned sequence cannot fit:

1. remove lower-priority optional content;
2. reduce duration of flexible blocks;
3. combine compatible roles;
4. surface a validation error only when no valid composition remains.

The engine must not silently return 87 minutes for a requested 90-minute practice.

## 24. Editing behavior

After generation, each block supports:

- replace with similar;
- easier;
- harder;
- change minutes;
- reorder;
- delete;
- duplicate;
- lock;
- show rationale;
- show explanation.

Locked blocks are preserved during partial regeneration.

Changing one block should not regenerate unrelated blocks unless validation requires a broader adjustment. When broader adjustment is required, the UI must explain why.

## 25. Live practice behavior

The same block metadata should support a live practice mode.

Live mode prioritizes:

- current block;
- countdown/timer;
- one or two coaching cues;
- next block preview;
- completed/skipped state;
- quick `+2 minutes`;
- easier/harder suggestion;
- notes for post-practice feedback.

Live mode must not require reading long rationale text during training.

## 26. Feedback loop

Post-practice feedback should be fast enough to complete immediately after training.

At minimum record:

- completed / skipped per block;
- Focus 1 rating;
- Focus 2/3 ratings when applicable;
- overall difficulty: too easy / appropriate / too hard;
- useful exercise signals;
- problematic exercise signals;
- free-text note;
- optionally identified problem category.

The interpreter produces future-only evidence such as:

- reinforce short-serve recognition;
- maintain reception as Focus 1;
- progress attack to more variable sets;
- reduce jump load next session;
- avoid repeating exercise X immediately.

Recommendations remain separate from coach-approved permanent levels.

## 27. Evidence model

Each system recommendation should carry evidence references where practical.

Evidence types include:

- explicit coach note;
- structured focus rating;
- repeated difficulty rating;
- skipped block;
- recent exercise usage;
- active program goal;
- coach-approved level.

A system inference should store its reason and confidence category rather than appearing as an unexplained state change.

## 28. Error handling and graceful degradation

The engine must still generate when optional data is unavailable.

Examples:

- no group history → use current group profile and explicit request;
- no feedback → do not invent weakness evidence;
- no suitable library exercise → either use a lower-ranked compatible item, or generate a clearly marked new exercise only if source policy permits;
- missing equipment metadata → do not reject the exercise solely for unknown equipment, but mark confidence lower;
- AI unavailable → use deterministic composition and deterministic rationale templates.

Hard failures should be reserved for impossible requirements such as no valid way to satisfy a mandatory source policy and required block role.

## 29. Data model additions

The Training DNA Engine requires structured metadata beyond the existing exercise title/description/stage fields.

The implementation should support, directly or through version metadata:

- primary and secondary skills;
- training role compatibility;
- progression stage;
- level range;
- minimum/maximum or typical player count;
- typical duration range;
- equipment;
- physical-load estimate;
- cognitive-load estimate;
- technical-load estimate;
- touch-density estimate/category;
- game-transfer estimate/category;
- setup complexity;
- coaching cues;
- progressions;
- regressions;
- exercise-family key;
- source type and version snapshot.

Not every imported legacy exercise must have complete metadata on day one. Unknown metadata should be represented explicitly rather than fabricated.

## 30. Backward compatibility

Existing exercise versions and saved practices remain valid.

The engine must not rewrite historical practice snapshots when exercise metadata changes.

Exercises with incomplete metadata remain usable with lower-confidence ranking and fewer hard filters.

Existing group levels remain coach-approved source-of-truth values.

## 31. Validation outputs

The validator returns:

### Hard errors

- duration cannot be satisfied;
- mandatory source policy violated;
- no valid block for a required role after allowed fallback;
- invalid focus configuration;
- corrupted practice structure.

### Warnings

- unusually low touch density;
- repeated exercise family;
- high consecutive physical load;
- weak game transfer;
- unknown player-count compatibility;
- missing progression metadata;
- coach override of game-transfer rule.

Warnings should be actionable and should not prevent saving when coach override is reasonable.

## 32. Testing strategy

The engine should be developed test-first with deterministic fixtures.

### 32.1 Unit tests

Cover:

- intent normalization;
- Training Arc selection;
- exercise eligibility;
- scoring/ranking;
- repetition penalties;
- load balancing;
- exact duration composition;
- game-transfer validation;
- source-policy behavior;
- feedback interpretation boundaries.

### 32.2 Scenario tests

Use representative coaching scenarios such as:

- beginner group, 60 minutes, reception Focus 1;
- advanced group, 90 minutes, game-based transition practice;
- reception weakness from recent feedback;
- repeated exercise penalty;
- 18 players with a low-capacity drill;
- light practice after a high-jump session;
- library-only policy with limited content;
- AI unavailable.

### 32.3 Invariant tests

Every generated practice must satisfy invariants such as:

- total duration equals request;
- no silent focus reorder;
- no silent skill-level mutation;
- historical snapshot immutability;
- no generated exercise under `library only`;
- Focus 1 game-transfer requirement unless explicit override.

### 32.4 Acceptance tests

From the UI, a coach should be able to:

1. choose a saved group;
2. request a practice;
3. see a coherent Training Arc;
4. inspect why a block was selected;
5. make one block easier/harder or replace it;
6. keep total time valid;
7. save/run the practice;
8. submit feedback;
9. receive a future recommendation without automatic permanent level change.

## 33. Initial implementation scope

The first implementation of Training DNA should focus on the smallest complete coaching loop:

**group context → practice intent → Training Arc → ranked library exercises → exact-duration practice → block rationale → feedback evidence → next-practice recommendation**

The first implementation does not require:

- machine-learned ranking;
- automatic video analysis;
- biometric workload estimation;
- fully animated Coach Draft;
- automatic permanent skill-level changes.

These remain outside the Training DNA Engine scope.

## 34. Success criteria

The Training DNA Engine is successful when:

- two practices with the same duration but different group state can have meaningfully different structure;
- the chosen sequence has an explainable progression rather than random exercise order;
- Focus 1 clearly dominates the learning logic without excluding secondary focuses;
- the engine adapts future recommendations from feedback while preserving coach authority;
- a coach can understand why each block exists;
- the final practice is immediately usable on court;
- exact duration, source policy, and core constraints are always validated;
- the deterministic engine still produces a valid practice when AI is unavailable.

## 35. Product principle

SeasonDesign suggests. The coach decides.

The engine should be opinionated enough to create a strong practice, transparent enough to explain itself, and flexible enough for the coach to override it without fighting the system.
