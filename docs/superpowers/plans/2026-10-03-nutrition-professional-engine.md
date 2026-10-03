# Professional Nutrition Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current macro-only menu optimizer with a deterministic, diversity-first meal-planning engine that persists preferred foods, avoids duplicate foods, respects realistic portions, explains gaps, and optionally applies a sports overlay.

**Architecture:** Keep `nutrition-builder.html` as the browser UI/orchestrator, move profile persistence into a small testable module, keep quantity/preparation helpers in `nutrition-meals.js`, and add a pure `nutrition-planner.js` that owns selection, diversity, meal assignment, diagnostics and strict/automatic behavior. The live page migrates incrementally so each task leaves it usable.

**Tech Stack:** Static GitHub Pages, vanilla HTML/CSS/JavaScript, UMD/CommonJS-compatible browser helpers, Node built-in `node:test` + `assert`.

**Spec:** `docs/superpowers/specs/2026-10-03-nutrition-professional-engine-design.md`

## Global Constraints

- The same stable food identity may appear at most once in the generated daily menu UI.
- Saved foods are preferred, never mandatory.
- Strict mode never silently adds a food that the user did not make available.
- Automatic mode may add a food only when it improves structure, diversity or a meaningful nutrient gap.
- Missing nutrient data remains unknown (`null` / `אין נתון`), never silently becomes zero.
- Preparation state is part of food identity when materially relevant, including cooked vs dry brown rice.
- Internal quantity calculations use grams; household units remain display helpers.
- Requested meal count remains constrained to 1–6 and persists.
- Portion ceilings are guardrails; impossible targets return explicit gaps instead of violating them.
- Sports mode is an overlay for healthy adults, not a medical nutrition engine, and must not invent workout times.
- Preserve the live page after every task; no opaque full-page rewrite.

## Review Focus

- Legacy profiles may exist under both `nutritionProfile` and `nutritionProfileV1`; migrate without losing the newer profile or saved foods.
- A strict-mode user with fewer unique foods than requested meals should receive an explicit variety/meal-structure gap, not duplicate foods to fill empty meals.
- External foods with missing macro or micronutrient fields must keep those fields unknown and must not receive false zero-based confidence.
- Saved government-database foods may become stale; persist stable lookup metadata rather than treating cached nutrient numbers as authoritative forever.
- Changing meal count after a menu exists must re-plan/reassign without duplicating food identities or mutating the saved-food list.

---

### Task 1: Stable food identity, duplicate merging, and unique meal assignment

**Files:**
- Modify: `nutrition-meals.js`
- Modify: `tests/nutrition-meals.test.mjs`

**Interfaces:**
- Consumes: existing food objects `{id, preparation?, ...}` and menu items `{f, q}`.
- Produces: `foodIdentity(food) -> string`, `mergeDuplicateFoods(items) -> Item[]`, `assignUniqueFoodsToMeals(items, count) -> Meal[]`, `nullableNumber(value) -> number|null`.

- [ ] **Step 1: Write failing identity/merge tests**

Add tests asserting that two items with the same stable identity merge into one item whose grams are summed, while cooked and dry brown rice remain distinct identities.

- [ ] **Step 2: Run the focused test file and verify failure**

Run: `node --test tests/nutrition-meals.test.mjs`
Expected: FAIL because the new helpers do not exist.

- [ ] **Step 3: Implement stable identity and duplicate merging**

Add the four exported helpers above to `nutrition-meals.js`. `foodIdentity()` must use `food.id` plus preparation only when preparation is not already encoded into the id. `nullableNumber()` returns `null` for missing/non-numeric values and preserves numeric zero.

- [ ] **Step 4: Write failing unique meal-assignment tests**

Assert that `assignUniqueFoodsToMeals()` never places the same stable identity in two meal slots, preserves total grams, respects 1–6 meal normalization, and may leave a slot empty when strict inputs contain too few unique foods rather than cloning a food.

- [ ] **Step 5: Implement unique meal assignment and stop using split-to-fill behavior in the new path**

Keep legacy `distributeItems()` temporarily for compatibility, but the new planner must consume `assignUniqueFoodsToMeals()`.

- [ ] **Step 6: Run tests**

Run: `node --test tests/nutrition-meals.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add nutrition-meals.js tests/nutrition-meals.test.mjs
git commit -m "feat: add stable nutrition food identity"
```

### Task 2: Consolidated persistent nutrition profile and saved foods

**Files:**
- Create: `nutrition-profile.js`
- Create: `tests/nutrition-profile.test.mjs`
- Modify: `nutrition-profile-meals.js`
- Modify: `nutrition-builder.html`

**Interfaces:**
- Consumes: browser-like storage implementing `getItem/setItem/removeItem` and recognized food references.
- Produces: `NutritionProfile.load(storage)`, `NutritionProfile.save(storage, profile)`, `NutritionProfile.toggleSavedFood(profile, foodRef)`, `NutritionProfile.isSaved(profile, foodRef)`, `NutritionProfile.removeSavedFood(profile, identity)`, `NutritionProfile.migrate(storage)`.

- [ ] **Step 1: Write failing profile persistence tests**

Use a tiny fake storage object. Assert that saved foods survive save/load, duplicate saves collapse by stable identity, removing a saved food works, and meal count remains 1–6.

- [ ] **Step 2: Add migration tests for legacy keys**

Assert that `nutritionProfileV1` wins when both keys exist, missing fields from `nutritionProfile` may be merged safely, and saved foods are never discarded during migration.

- [ ] **Step 3: Run the new test file and verify failure**

Run: `node --test tests/nutrition-profile.test.mjs`
Expected: FAIL because `nutrition-profile.js` does not exist.

- [ ] **Step 4: Implement `nutrition-profile.js`**

Use `nutritionProfileV1` as the canonical key. A saved-food record contains `{id, name, preparation, source, sourceCode, savedAt}`; omit unavailable optional fields rather than inventing them.

- [ ] **Step 5: Make `nutrition-profile-meals.js` use the shared profile module**

Remove its private duplicated load/save logic. Meal-count updates must preserve `savedFoods` and all unrelated profile fields.

- [ ] **Step 6: Make the builder read/write the same canonical profile**

Replace direct writes to the old `nutritionProfile` key with the shared module and run migration once on initialization.

- [ ] **Step 7: Run profile and existing meal tests**

Run: `node --test tests/nutrition-profile.test.mjs tests/nutrition-meals.test.mjs`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add nutrition-profile.js nutrition-profile-meals.js nutrition-builder.html tests/nutrition-profile.test.mjs
git commit -m "feat: persist preferred nutrition foods"
```

### Task 3: Pure professional planner with diversity-first selection

**Files:**
- Create: `nutrition-planner.js`
- Create: `tests/nutrition-planner.test.mjs`
- Modify: `nutrition-builder.html`

**Interfaces:**
- Consumes: `planDay({foods, fallbackFoods, targets, mealCount, mode, savedFoodIds, sportMode})`.
- Produces: `{items, meals, totals, targetDiagnostics, qualityDiagnostics, gaps, addedFoodIds}` where `items` contains unique food identities only.

- [ ] **Step 1: Write failing planner tests for diversity and duplication**

Create fixtures where one huge rice portion could mathematically hit calories but several suitable foods are available. Assert that the planner selects multiple unique foods before enlarging rice to its ceiling, and that `items` has no duplicate identities.

- [ ] **Step 2: Add strict/automatic behavior tests**

Assert that strict mode never uses `fallbackFoods`, while automatic mode may add one when it materially improves an unresolved structure/nutrient gap.

- [ ] **Step 3: Add saved-food preference tests**

With two nutritionally similar choices, assert that a saved food is preferred. Also assert that a saved food that worsens constraints is not forced into the result.

- [ ] **Step 4: Add portion and impossibility tests**

Assert `dailyMax` and `perMealMax` are respected. When targets cannot be approached within constraints, assert `gaps` contains a concrete calorie/protein/fibre/variety message instead of exceeding the ceiling.

- [ ] **Step 5: Add Review Focus tests for too few unique foods**

With 4 requested meals but only 2 strict foods, assert no duplicate food identity is created and diagnostics report insufficient variety/meal coverage.

- [ ] **Step 6: Run planner tests and verify failure**

Run: `node --test tests/nutrition-planner.test.mjs`
Expected: FAIL because the planner does not exist.

- [ ] **Step 7: Implement deterministic `nutrition-planner.js`**

Selection order is fixed by the spec: essential meal structure → saved/current foods with broad category coverage → unused foods that close major gaps → quantity adjustment of selected foods → fallback additions only in automatic mode. Use deterministic tie-breaking by food identity so tests and generated menus are stable.

- [ ] **Step 8: Integrate the builder with `planDay()` behind the existing Build button**

Replace the current hill-climbing `optimize()` call path without deleting legacy helpers until the new integration is verified. `state.result` should be adapted from planner output so existing balance UI can keep working during migration.

- [ ] **Step 9: Run all nutrition tests**

Run: `node --test tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add nutrition-planner.js nutrition-builder.html tests/nutrition-planner.test.mjs
git commit -m "feat: add diversity-first nutrition planner"
```

### Task 4: Saved-food controls and no-duplicate menu UI

**Files:**
- Modify: `nutrition-builder.html`
- Modify: `tests/nutrition-meals.test.mjs`
- Modify: `tests/nutrition-profile.test.mjs`

**Interfaces:**
- Consumes: planner output and `NutritionProfile` saved-food APIs.
- Produces: star/save controls in recognized food chips/menu rows and a `מאכלים שמורים` section on the profile surface.

- [ ] **Step 1: Write failing static integration tests**

Assert the builder loads `nutrition-profile.js` and `nutrition-planner.js`, exposes a save/unsave control, renders `מאכלים שמורים`, and uses planner-provided unique items rather than cloning rows via meal splitting.

- [ ] **Step 2: Run focused integration tests and verify failure**

Run: `node --test tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs`
Expected: FAIL on the new UI assertions.

- [ ] **Step 3: Add star controls to recognized foods**

Use copy `☆ שמור בפרופיל` and `★ שמור בפרופיל`. Toggling updates the canonical profile immediately and does not change current grams by itself.

- [ ] **Step 4: Add compact saved-food management to the profile**

Show saved food names with remove actions. Government-source saved items display source metadata and retain `sourceCode` for future refresh.

- [ ] **Step 5: Render each stable food identity once**

The daily menu UI must have one visible food row per stable identity. Assign the whole quantity to one meal in the initial UI; if the planner cannot populate all requested meals with unique foods, keep the empty meal/quality warning rather than duplicating a food.

- [ ] **Step 6: Verify meal-count change does not create duplicates**

Add a test fixture or static integration assertion covering re-plan/re-render after meal-count change while saved foods stay unchanged.

- [ ] **Step 7: Run all nutrition tests**

Run: `node --test tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add nutrition-builder.html tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs
git commit -m "feat: add saved foods and unique menu rows"
```

### Task 5: Quality diagnostics and unknown nutrient correctness

**Files:**
- Modify: `nutrition-planner.js`
- Modify: `nutrition-builder.html`
- Modify: `tests/nutrition-planner.test.mjs`
- Modify: `tests/nutrition-meals.test.mjs`

**Interfaces:**
- Consumes: planned unique items, meal assignment and nullable nutrient fields.
- Produces: `qualityDiagnostics` with concrete checks and UI sections `התאמה ליעדים` and `איכות וגיוון`.

- [ ] **Step 1: Write failing quality diagnostic tests**

Assert diagnostics report unique-food count, category coverage, fruit/vegetable presence when available, whole-grain/legume representation when appropriate, concentration warning when one food dominates energy, portion reasonableness and empty requested meal slots.

- [ ] **Step 2: Write failing unknown-data tests**

Assert a missing nutrient stays `null`; `nutrientsForQuantity()` does not turn it into zero; quality/target diagnostics mark it unknown rather than satisfied or deficient from fabricated zero.

- [ ] **Step 3: Run tests and verify failure**

Run: `node --test tests/nutrition-planner.test.mjs tests/nutrition-meals.test.mjs`
Expected: FAIL on the new diagnostics/unknown assertions.

- [ ] **Step 4: Implement quality diagnostics**

Keep internal score details private if useful, but expose concrete human-readable checks instead of one health score.

- [ ] **Step 5: Fix government row normalization in the builder**

Update `govFoodFromRow()` so missing external nutrient fields use the nullable numeric helper instead of the current zero-default conversion. Essential unknowns must be carried into planner diagnostics.

- [ ] **Step 6: Add result UI sections**

Keep current macro bars under `התאמה ליעדים`; add `איכות וגיוון` with strengths, warnings and unresolved gaps. Preserve the actual-quantity nutrient modal (`ערכים ל־X גרם`).

- [ ] **Step 7: Run all nutrition tests plus inline-JS syntax validation**

Run: `node --test tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs`
Expected: PASS, including the existing inline JavaScript syntax/build-button wiring test.

- [ ] **Step 8: Commit**

```bash
git add nutrition-planner.js nutrition-builder.html tests/nutrition-planner.test.mjs tests/nutrition-meals.test.mjs
git commit -m "feat: add nutrition quality diagnostics"
```

### Task 6: Initial sports overlay without invented timing

**Files:**
- Modify: `nutrition-profile.js`
- Modify: `nutrition-planner.js`
- Modify: `nutrition-builder.html`
- Modify: `tests/nutrition-profile.test.mjs`
- Modify: `tests/nutrition-planner.test.mjs`

**Interfaces:**
- Consumes: profile `sportMode:boolean`, activity/goal/targets, requested meal count.
- Produces: sports-aware planner diagnostics/distribution with no pre/post-workout timing unless schedule metadata exists in a later feature.

- [ ] **Step 1: Write failing sport-mode profile tests**

Assert `sportMode` persists and defaults to false without changing existing profiles unexpectedly.

- [ ] **Step 2: Write failing planner sport tests**

Assert sport mode can prefer better carbohydrate availability when activity/performance context supports it and flags excessive protein concentration in one meal. Assert it does not create a `pre-workout` or `post-workout` meal role without workout-time input.

- [ ] **Step 3: Run tests and verify failure**

Run: `node --test tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs`
Expected: FAIL on the new sport assertions.

- [ ] **Step 4: Implement the initial sports overlay**

Add sport-aware weighting/diagnostics only; do not invent workout timing. Preserve the healthy-eating/diversity foundation and all portion guardrails.

- [ ] **Step 5: Add a simple optional sport-mode control to the profile**

Copy must make clear that the feature adjusts planning for training/performance and is not a medical mode.

- [ ] **Step 6: Run the complete nutrition test suite**

Run: `node --test tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs`
Expected: PASS.

- [ ] **Step 7: Verify live-page safety before release**

Run the repository's nutrition workflow and GitHub Pages build. Confirm the nutrition workflow concludes `success`, the Pages deployment concludes `success`, and unrelated workflows are reported separately rather than treated as blockers unless they cover the nutrition page.

- [ ] **Step 8: Commit**

```bash
git add nutrition-profile.js nutrition-planner.js nutrition-builder.html tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs
git commit -m "feat: add nutrition sports overlay"
```

### Task 7: Final regression and legacy cleanup

**Files:**
- Modify: `nutrition-builder.html`
- Modify: `nutrition-meals.js` only if legacy exports are now unused
- Modify: nutrition tests as needed for final behavior, not to weaken assertions

**Interfaces:**
- Consumes: all modules from Tasks 1–6.
- Produces: one live planner path with no obsolete optimizer behavior reachable from the UI.

- [ ] **Step 1: Add end-state regression assertions**

Assert the builder's Build button calls the professional planner path, the old hill-climbing optimizer is no longer reachable from that button, and required scripts load in dependency order.

- [ ] **Step 2: Run the entire nutrition suite**

Run: `node --test tests/nutrition-meals.test.mjs tests/nutrition-profile.test.mjs tests/nutrition-planner.test.mjs`
Expected: PASS.

- [ ] **Step 3: Remove only proven-dead legacy planner code**

Delete obsolete `optimize()`/split-to-fill code only after search confirms no live callers. Keep general helpers still used by quantity/measure UI.

- [ ] **Step 4: Re-run tests and page syntax checks**

Expected: PASS with no missing globals or dead script references.

- [ ] **Step 5: Deploy and verify**

Push the final commit, wait for GitHub Pages deployment success, then open/share a cache-busted `nutrition-builder.html` URL. Do not claim remote government API behavior is verified unless it was actually exercised.

- [ ] **Step 6: Commit**

```bash
git add nutrition-builder.html nutrition-meals.js tests
git commit -m "refactor: retire legacy nutrition optimizer"
```
