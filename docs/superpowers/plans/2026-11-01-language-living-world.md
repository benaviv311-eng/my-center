# Language Living World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a colorful, interactive story-and-coach layer in the existing four-language hub without losing existing lessons, games, and feed.

**Architecture:** Keep static HTML/CSS and vanilla browser JavaScript. Add a pure mission-content model and a pure memory model, then a DOM controller for world scenes and coaching. The existing feed owns language selection and emits a change event; all new data remains browser-local.

**Tech Stack:** HTML, CSS, JavaScript, Node built-in `assert` tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-01-language-living-world-design.md`

## Global Constraints
- Preserve `my-center-languages-v1` and existing routes.
- Language codes: `ar`, `it`, `ru`, `es`; optional `all`/`four` views.
- RTL Hebrew UI, Arabic Hebrew-diacritic transliteration, Russian Latin transliteration, mobile responsive.
- No remote database changes or secret keys.

## Review Focus
- Changing language mid-mission must reset the visible mission without mixing phrases.
- Incomplete/malformed localStorage must never blank the page.
- Old progress and lesson links must remain intact.
- Slow or absent speech APIs must have a readable, nonblocking fallback.
- Branching answers must not allow repeated taps to score twice.

---

### Task 1: Restore the four-language feed mode

**Files:** Modify `languages.html`, `languages-feed.js`; Test `tests/language-feed.test.js`.

**Interfaces:** Existing `setLanguageFilter(next)` accepts `four`, and `buildBatch` delegates to `buildFourLanguageFeed`.

- [ ] **Step 1: Run existing failing test** — `node tests/language-feed.test.js`; expected missing `feed-filter-four` failure.
- [ ] **Step 2: Restore the filter control and navigation while preserving single-language choices**.
- [ ] **Step 3: Verify green** — `node tests/language-feed.test.js` → `OK`.
- [ ] **Step 4: Commit** — `fix: restore four-language feed mode`.

### Task 2: Missions and adaptive mastery models

**Files:** Create `language-world-model.js`, `language-mastery.js`, `tests/language-world.test.js`.

**Interfaces:** `LanguageWorldModel.getPlaces(lang)`, `.getMission(lang,placeId)`, `.resolveChoice(lang,placeId,stepIndex,choiceIndex)`; `LanguageMastery.record(state,lang,key,correct,now)` and `.due(state,lang,now)`.

- [ ] **Step 1: Write failing tests** for four-language coverage, dialogue branching, content completeness, distinct progress, review timing, corrupt-state safety.
- [ ] **Step 2: Run red** — `node tests/language-world.test.js` → missing module.
- [ ] **Step 3: Implement data and pure logic** with three places and two dialogue steps per place/language.
- [ ] **Step 4: Run green** — `node tests/language-world.test.js` → `OK`.
- [ ] **Step 5: Commit** — `feat: add language missions and mastery models`.

### Task 3: Immersive world, coaching, feed and design

**Files:** Create `language-world.js`, `language-world.css`, `tests/language-world-ui.test.js`; Modify `languages.html`, `languages-feed.js`, `.github/workflows/language-feed-test.yml`.

**Interfaces:** `LanguageWorld.open(place,lang)`, `.render(lang)`, `.feedMoment(lang,seed)`, `.onLanguageChange(lang)` consume Task 2 models; `language:change` event is dispatched by the existing filter selection.

- [ ] **Step 1: Write failing integration tests** for world section, assets, public API, language change wiring, same-language activity links, existing lesson routes.
- [ ] **Step 2: Run red** — `node tests/language-world-ui.test.js` → failure for missing controller/markup.
- [ ] **Step 3: Implement progressive accessible UI, TTS and optional speech practice, review panel, responsive CSS, feed inserts, navigation links**.
- [ ] **Step 4: Run green** — `node tests/language-world-ui.test.js && node tests/language-feed.test.js` → both `OK`.
- [ ] **Step 5: Run full language tests and HTML/JS validation**, record any pre-existing unrelated failures.
- [ ] **Step 6: Commit** — `feat: bring language world and coach into learning hub`.

### Task 4: Deployment and smoke verification

**Files:** No further source change unless a verified issue requires a test-first fix.

- [ ] **Step 1: Review diff and current branch SHA**.
- [ ] **Step 2: Push tested commit to the existing GitHub repository / intended publishing branch**.
- [ ] **Step 3: Verify the live page loads and mission UI works; hand off the actual URL**.
