# Coach Feed & Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static coach notes page with a data-driven RTL learning feed that has six sticky topic filters and interactive questions embedded naturally in the scroll.

**Architecture:** Keep `coach.html` as a thin page shell. Add a dedicated `coach-feed-data.js` content bank, `coach-feed.js` for deterministic mixing/filtering/question behavior, and `coach-feed.css` for the sticky navigation and card states. Tests use Node's built-in `node:test` runner and inspect both exported logic and page integration.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, CommonJS-compatible browser modules, Node.js `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-12-coach-feed-learning-design.md`

## Global Constraints

- Keep the coach page RTL and visually consistent with `styles.css` and the rest of “המרכז שלי”.
- Six sticky topics are fixed: פסיכולוגיה של הספורט, פסיכולוגיית אימון, פסיכולוגיה של תנועה, כוח מתפרץ, שפת אימון, גישות לכדורעף.
- Questions live inside normal scrolling; there is no separate quiz screen.
- Every question has 3–4 options and reveals correctness/recommendation, explanation, principle, and application after selection.
- Starter content must cover every topic and include practical volleyball context.
- Do not fabricate attributed quotations. Book/research-derived content must be explicitly marked as summary/paraphrase unless exact wording is verified.
- First implementation excludes accounts, cloud persistence, personalization algorithms, and automatic research ingestion.

---

### Task 1: Coach feed model and starter content bank

**Files:**
- Create: `coach-feed-data.js`
- Create: `coach-feed.js`
- Create: `tests/coach-feed.test.js`

**Interfaces:**
- `coach-feed-data.js` produces `COACH_TOPICS` and `COACH_FEED_CARDS` and exports them through CommonJS plus `window.CoachFeedData`.
- `coach-feed.js` consumes those arrays and produces `normalizeCard(card)`, `filterCards(cards, topic)`, `mixFeed(cards, seed, limit)`, `answerQuestion(card, optionIndex)`, and browser rendering helpers.

- [ ] **Step 1: Write the failing model tests**

Create `tests/coach-feed.test.js` with tests that require `coach-feed-data.js` and `coach-feed.js`, assert that exactly six topic definitions exist, every topic has at least three starter cards, at least one question exists in each practical topic, every question has 3–4 options and a valid `correctOption`, source-bearing cards contain `sourceKind`, and `filterCards`/`answerQuestion` return predictable results.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/coach-feed.test.js`
Expected: FAIL because `coach-feed-data.js` and `coach-feed.js` do not exist yet.

- [ ] **Step 3: Create the data bank**

Implement UMD/CommonJS-compatible `coach-feed-data.js` with the six fixed topic definitions and a starter bank containing a varied mix of:
- concept/explanation cards,
- applied volleyball examples,
- coaching-language cards,
- scenario/question cards,
- research-summary placeholders that are explicitly described as established concept summaries rather than invented study citations,
- library-inspired paraphrased ideas only when source attribution is honest.

Each card uses this shape:
```js
{
  id:'sport-psych-self-efficacy',
  topic:'sport-psychology',
  type:'concept',
  title:'מסוגלות עצמית',
  body:'אמונה ביכולת לבצע משימה משפיעה על בחירת מטרות, מאמץ והתמדה.',
  application:'בכדורעף: בנה רצף הצלחות קטן לפני העלאת דרגת הקושי.',
  tags:['ביטחון','מוטיבציה']
}
```
Question cards additionally contain `question`, `options`, `correctOption`, `explanation`, `principle`, and `application`.

- [ ] **Step 4: Implement feed logic**

Implement `coach-feed.js` with deterministic seed hashing and Fisher–Yates mixing so a visit can feel varied while remaining testable. `filterCards(cards, 'all')` returns all cards; topic filtering returns only matching topic cards. `answerQuestion` returns:
```js
{
  selectedOption,
  isCorrect,
  explanation: card.explanation,
  principle: card.principle,
  application: card.application
}
```
without mutating the source card.

- [ ] **Step 5: Run tests and syntax checks**

Run:
`node --test tests/coach-feed.test.js`
`node --check coach-feed-data.js`
`node --check coach-feed.js`
Expected: PASS.

### Task 2: Replace static coach page with sticky topic navigation and feed shell

**Files:**
- Modify: `coach.html`
- Create: `coach-feed.css`
- Modify: `tests/coach-feed.test.js`

**Interfaces:**
- `coach.html` provides `#coach-topic-nav`, `#coach-feed`, and `#coach-feed-status` containers used by `coach-feed.js`.
- Topic buttons use `data-coach-topic` values matching IDs from `COACH_TOPICS` plus `all`.

- [ ] **Step 1: Add failing integration tests**

Extend `tests/coach-feed.test.js` to assert that `coach.html` includes:
- `coach-feed.css`, `coach-feed-data.js`, `coach-feed.js`,
- sticky topic navigation container,
- one “הכול” button plus all six topic labels,
- `#coach-feed` content container,
- no old static “אימון 1” notes section as the main content.

- [ ] **Step 2: Run tests to verify integration failure**

Run: `node --test tests/coach-feed.test.js`
Expected: FAIL on missing feed shell/assets.

- [ ] **Step 3: Replace coach page body content**

Keep the existing page title, back link, bottom navigation, and `app.js`. Replace the static sections between title and bottom nav with:
```html
<section class="coach-feed-shell" aria-labelledby="coach-feed-heading">
  <div class="coach-feed-intro">
    <p class="eyebrow">למידה יומית למאמן</p>
    <h2 id="coach-feed-heading">פיד המאמן</h2>
    <p>פסיכולוגיה, תנועה, כוח, שפה ורעיונות לכדורעף — בגלילה אחת.</p>
  </div>
  <div class="coach-topic-nav" id="coach-topic-nav" aria-label="תחומי מאמן"></div>
  <p class="coach-feed-status" id="coach-feed-status" aria-live="polite"></p>
  <div class="coach-feed" id="coach-feed"></div>
</section>
```
Load `coach-feed-data.js` then `coach-feed.js` before `app.js`.

- [ ] **Step 4: Add coach-specific styling**

Create `coach-feed.css` with:
- sticky horizontal topic row using `position: sticky`,
- accessible button focus/active states,
- one-column mobile feed and centered constrained desktop width,
- visually distinct question cards,
- answer option buttons,
- expanded feedback panel,
- evidence/source pills and application blocks,
while reusing existing CSS variables/colors instead of introducing a separate visual system.

- [ ] **Step 5: Run integration tests**

Run: `node --test tests/coach-feed.test.js`
Expected: PASS.

### Task 3: Browser rendering, topic filtering, and embedded question interaction

**Files:**
- Modify: `coach-feed.js`
- Modify: `tests/coach-feed.test.js`

**Interfaces:**
- `initCoachFeed(document, {cards, topics, seed})` initializes the page.
- `renderCard(card)` renders standard and question cards.
- Clicking `[data-coach-topic]` filters and remixes the visible feed.
- Clicking `[data-question-option]` reveals feedback in the same card and disables repeated answering for that rendered instance.

- [ ] **Step 1: Add behavior-oriented tests**

Add tests for exported pure helpers:
- `mixFeed` is deterministic for identical seed and different for a different seed,
- mixed feed includes multiple card types when enough data is supplied,
- question feedback contains all four required pieces,
- filtering never leaks cards from another topic.

- [ ] **Step 2: Run tests to confirm missing behavior**

Run: `node --test tests/coach-feed.test.js`
Expected: FAIL for the unimplemented helpers/behavior.

- [ ] **Step 3: Implement browser rendering**

Render normal cards with topic/type metadata, title, body, optional application/source/evidence. Render question cards with 3–4 buttons. Use event delegation from the feed container so re-rendering does not duplicate listeners.

When an option is selected, append feedback structured as:
```html
<div class="coach-question-feedback" role="status">
  <strong>נכון / עדיף לבחור אחרת</strong>
  <p class="coach-feedback-explanation">...</p>
  <p><b>העיקרון:</b> ...</p>
  <p><b>בכדורעף:</b> ...</p>
</div>
```

- [ ] **Step 4: Implement topic filtering**

Build nav buttons from `COACH_TOPICS` in code, preserve the sticky nav while only replacing the feed body, update `aria-pressed`, and update `#coach-feed-status` with the active topic and visible card count.

- [ ] **Step 5: Run tests and syntax checks**

Run:
`node --test tests/coach-feed.test.js`
`node --check coach-feed.js`
Expected: PASS.

### Task 4: Full regression and source-integrity checks

**Files:**
- Modify: `tests/coach-feed.test.js`

**Interfaces:**
- No new runtime interface; this task locks the implementation contract.

- [ ] **Step 1: Add source-integrity assertions**

Assert that any card with `source` also has `sourceKind` from `['summary','paraphrase','verified-quote','research-summary']`, and that starter content does not label text as `verified-quote` unless it also includes a `sourceUrl` or explicit bibliographic locator.

- [ ] **Step 2: Add coverage assertions**

Assert that every one of the six topics has:
- at least one explanatory/concept card,
- at least one practical/application or scenario card,
- at least one question card or decision card,
- at least one volleyball-specific `application`.

- [ ] **Step 3: Run the full repository test suite**

Run: `node --test tests/*.test.js`
Expected: all existing tests plus coach-feed tests PASS.

- [ ] **Step 4: Run syntax verification for all new scripts**

Run:
`node --check coach-feed-data.js`
`node --check coach-feed.js`
Expected: both commands exit 0.

- [ ] **Step 5: Commit implementation**

Commit the feature with a message such as:
`feat: build interactive coach learning feed`
