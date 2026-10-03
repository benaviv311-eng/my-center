# Professional Nutrition Engine — Design Spec

Date: 2026-10-03
Status: Proposed for user review
Scope: `nutrition-builder.html` and supporting nutrition profile / meal engine files

## 1. Goal

Replace the current "macro optimizer" behavior with a layered meal-planning engine that behaves more like a professional nutrition-planning workflow for healthy adults, with an optional sports layer.

The engine must not consider a menu successful merely because calories and macros are numerically close. A successful menu must also be varied, meal-appropriate, portion-reasonable, compatible with the user's saved foods, and transparent about any remaining gaps.

This is not a medical diet engine. Pregnancy, kidney disease, diabetes requiring therapeutic nutrition, eating disorders, and other conditions requiring clinical dietary treatment remain outside automatic planning and should trigger a professional-guidance notice rather than a medical prescription.

## 2. Evidence model

The engine uses three evidence layers:

1. **Healthy eating foundation** — food-group variety and frequency inspired by the Israeli Ministry of Health food-rainbow model: foods such as vegetables, fruit, whole grains and water as regular foundations; legumes, healthy fats and dairy/alternatives regularly; animal-protein foods with frequency awareness; and reduced reliance on ultra-processed foods.
2. **Nutrient adequacy** — calories, protein, carbohydrate, fat, fibre, water and later micronutrients are evaluated against calculated targets/reference ranges. Reference values are treated as guidance for healthy populations, not as perfect individual prescriptions.
3. **Sports overlay** — when sport mode is enabled, the engine may alter carbohydrate availability, protein distribution, hydration and meal timing according to training demands. It must consider type, amount and timing rather than only daily totals.

Primary references:
- Israel Ministry of Health food-rainbow guidance.
- EFSA Dietary Reference Values framework.
- Academy of Nutrition and Dietetics / Dietitians of Canada / ACSM position on Nutrition and Athletic Performance.

## 3. Core architecture

The planner runs in six stages.

### Stage A — Profile

Persistent local profile stores:
- name / profile label
- age
- sex used for calculations
- weight
- height
- activity level
- goal
- number of meals
- optional sport mode
- optional training schedule metadata later
- saved foods
- disliked / excluded foods later
- last-updated timestamp

Profile targets are recalculated from source profile data rather than trusted indefinitely from stale cached totals.

### Stage B — Food pool

Foods available to the planner are divided into:
- **Saved foods** — foods the user explicitly keeps in the profile; highest preference.
- **Current available foods** — foods entered for the current day/session.
- **Fallback foods** — allowed only in automatic mode.

Saved does not mean mandatory. It means preferred and reusable across future menu generation.

A food is identified by a stable `food.id` plus preparation state where relevant. For foods whose nutrition changes substantially with preparation, e.g. dry vs cooked rice, the preparation is part of the identity.

### Stage C — Daily structure

Before choosing exact grams, create meal slots according to the user's requested meal count.

Each meal has an intended structure rather than being an arbitrary bucket of nutrients. Depending on the user's pattern and goals, a normal main meal should preferentially include:
- a meaningful protein source
- a carbohydrate source when appropriate
- vegetables / fruit or another fibre-rich food
- a fat source when needed

Not every meal must contain every category. Snacks and sport-timed meals can have different templates.

### Stage D — Food selection and diversity

Selection is scored using two independent concepts:

#### 1. Target fit
How closely the day approaches:
- calories
- protein
- carbohydrate
- fat
- fibre
- later micronutrients

#### 2. Food quality and diversity
Rewards:
- more unique foods
- more food-group coverage
- saved-food usage
- fruit / vegetable / whole-grain / legume representation where appropriate
- reasonable distribution across meals

Penalizes:
- extreme serving sizes
- excessive dependence on a single food
- repeated use of the same food in multiple meal slots
- highly unbalanced meal composition
- achieving calories mainly through one energy-dense ingredient

The engine must never mark a day as "good" solely because the target-fit score is high.

## 4. No-duplicate rule

Canonical behavior:

**The same food may appear only once in the generated daily menu UI.**

If more of the same food is required, increase its total amount instead of creating a second row for the same `food.id`.

Internally, the engine may associate portions of that food with meal slots for calculation, but the user-facing daily food representation must consolidate them. If meal-by-meal placement is shown, the engine should avoid assigning the same food to multiple meals where alternatives exist. When unavoidable, it should be represented as one daily food allocation with an explicit split, not as accidental duplicate entries.

Before rendering, a canonical `mergeDuplicateFoods()` pass groups all items by stable food identity and sums their grams.

## 5. Diversity-first behavior

The planner should prefer introducing another suitable food before increasing an already-large portion of one food.

Example:
- Bad: 700 g cooked brown rice because calories are low.
- Better: moderate brown rice + another carbohydrate source + appropriate fat / protein / produce, provided those foods are available and fit the user's preferences.

Suggested selection order:
1. satisfy essential meal structure
2. use saved / available foods with broad category coverage
3. improve major nutrient gaps using unused foods
4. adjust quantities of already-selected foods
5. only then consider fallback foods in automatic mode

This order intentionally prevents the optimizer from immediately maximizing a single mathematically convenient ingredient.

## 6. Portion constraints

Each food may define:
- `perMealMin` where useful
- `perMealMax`
- `dailyMax`
- household measures
- preparation state

Portion constraints are guardrails, not universal medical limits. They exist to prevent obviously implausible menus.

When the target cannot be reached with reasonable portions and the allowed food pool, the engine must report the remaining gap instead of violating guardrails.

## 7. Saved foods UX

Every recognized food can expose a star action:
- `☆ שמור בפרופיל`
- `★ שמור בפרופיל` when already saved

Saved foods are stored inside the persistent nutrition profile in localStorage in the first implementation.

Profile saved-food record should contain at minimum:
```js
{
  id,
  name,
  preparation,
  source,
  savedAt
}
```

When a saved food originates from the government database, retain enough stable identifying information to look it up again rather than blindly caching old nutrient values forever.

The profile screen should include a compact "מאכלים שמורים" section where the user can remove saved foods.

## 8. Menu quality result

The result screen should show two distinct status areas:

### התאמה ליעדים
Calories / macros / fibre against targets.

### איכות וגיוון
Human-readable checks such as:
- number of unique foods
- food-group coverage
- fruit / vegetable presence
- whole-grain / legume presence where appropriate
- concentration warning if too many calories come from one food
- portion reasonableness

No single numeric "health score" is required in the first version; the engine may use internal scores but the UI should explain concrete strengths and gaps.

## 9. Sports mode

Sports mode is an overlay, not a separate diet.

Initial version:
- retain healthy-eating foundation
- allow higher carbohydrate emphasis when activity / performance goal supports it
- distribute protein across the chosen meal count rather than concentrating it in one meal
- later add training-time input and pre/post-training meal roles

Future sport timing must be explicitly tied to training schedule input. It should not invent a workout time.

## 10. Strict vs automatic mode

### Strict — רק ממה שיש לי
- only current foods + saved foods explicitly available for this session
- no silent additions
- if constraints prevent a good menu, report the gap and propose a specific optional addition

### Automatic — חולל אוטומטית
- saved and entered foods get priority
- engine may add appropriate foods from the database
- additions should improve diversity / structure, not merely chase a macro number

## 11. Nutrient values UX

For every menu item, clicking `ערכים` must show nutrient values scaled to the actual displayed gram amount, not per 100 g.

The panel should state the actual quantity clearly, e.g. `ערכים ל־180 גרם`.

If a nutrient is unavailable from the source, display `אין נתון`; do not convert missing data to zero.

## 12. Data correctness

- Numeric nutrition fields from external data are normalized carefully.
- Missing nutrient != zero.
- preparation state must be resolved when materially important.
- grams and household units are both shown where food-specific conversions exist.
- calculations use grams as the canonical internal unit.

## 13. Planned code boundaries

Recommended files:
- `nutrition-builder.html` — UI and orchestration, progressively reduced in responsibility.
- `nutrition-profile-meals.js` — persistent profile and meal-count UI; extend for saved foods or split profile persistence into a new module if this file becomes too broad.
- `nutrition-meals.js` — pure meal-planning helpers: merging duplicates, meal shells, portion checks, diversity calculations, quality checks.
- new `nutrition-planner.js` — professional planning pipeline and scoring logic.
- tests under `tests/` for deterministic planner behavior.

The core planner should be pure functions wherever possible so it can be tested without a browser.

## 14. Required tests before release

At minimum:
1. Same `food.id` supplied twice is consolidated into one daily item.
2. Increasing a food quantity never creates a duplicate UI row.
3. With multiple suitable foods available, planner prefers diversity before extreme enlargement of one food.
4. Saved foods survive reload via profile persistence.
5. Saved foods receive preference but are not forced into every generated menu.
6. Strict mode never silently adds an unapproved food.
7. Automatic mode can add a new food when it materially improves the menu.
8. Portion ceilings are respected.
9. Impossible target under constraints returns an explicit gap.
10. Actual-quantity nutrient modal remains correct.
11. Cooked/dry ambiguity remains explicit where required.
12. Missing nutrient data remains unknown rather than zero.
13. Requested meal count remains 1–6 and persists.
14. Result exposes both target-fit and quality/diversity diagnostics.

## 15. Migration strategy

Do not replace the current page in one opaque rewrite.

Phase 1: introduce pure planner helpers and tests while preserving UI.
Phase 2: saved-food persistence and duplicate consolidation.
Phase 3: diversity / portion-aware planner replaces current hill-climbing behavior.
Phase 4: quality diagnostics in UI.
Phase 5: optional sports overlay and later training-time support.

Each phase must keep the live page usable.

## 16. Success criteria

The redesign is successful when a user can save preferred foods once, request a menu with a chosen meal count, and receive a varied day that:
- uses preferred foods where sensible
- contains no accidental duplicate foods
- avoids absurd single-food quantities
- is reasonably close to nutrient targets
- explains remaining gaps honestly
- can distinguish cooked/dry states where needed
- shows nutrient values for the actual serving
- preserves the user's profile choices across visits
- behaves differently for sport needs only when the relevant sport context is supplied

This spec intentionally prioritizes a transparent, reasonable menu over mathematical perfection.