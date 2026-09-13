# Digital Book Reading Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every shared `book.html` page into a dense, continuous digital-reading experience with open chapters, a table of contents, optional inline deep expansions, provenance, synthesis, and the existing infinite feed moved below the core reading body.

**Architecture:** Add a pure `book-reading.js` model layer that converts each book's existing summary, ideas, topics, feed posts, and matched learning concepts into deterministic reading chapters. `book-page.js` renders that model into a reading-first layout and owns interactions; `book.html` provides stable containers; `book-page.css` provides the Editorial Premium layout while `book-feed.css` remains focused on the supplemental feed and provenance panels.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Node `assert` tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-13-digital-book-reading-design.md`

## Global Constraints
- Core chapter text is open by default.
- Deep expansions are optional and inline.
- The user should understand the book without opening expansions.
- Existing notes, saved feed items, refresh actions, infinite feed behavior, and provenance remain available.
- Layout works on desktop and mobile.
- Content is generated from each book's existing content bank; no separate hard-coded page per book.
- Commercial-book material is paraphrased/explanatory rather than reproduced as long excerpts.
- No image generation is part of this feature unless the user explicitly writes `צור`.

---

### Task 1: Reading model with open chapters and deep material

**Files:**
- Create: `book-reading.js`
- Create: `tests/book-reading.test.js`

**Interfaces:**
- Consumes: a book object shaped like `{id, slug, title, content:{summary, ideas, topics, feed_posts}}` and `LibraryDiscovery.LEARNING_CONCEPTS` / `LibraryDiscovery.matchConcepts` when available.
- Produces: `BookReading.buildReadingChapters(book, {seed}) -> ReadingChapter[]` and `BookReading.buildTakeaways(book, chapters) -> string[]`.
- `ReadingChapter`: `{id, kicker, title, sourceLabel, bodyParagraphs, supportBlocks, deep}`.
- `deep`: `{title, sections, takeaway}` where `sections` is an array of `{heading, paragraphs}`.

- [ ] **Step 1: Write the failing model test**

```js
const assert = require('assert');
const reading = require('../book-reading.js');
const sample = {id:'sample',slug:'sample',title:'Sample Book',content:{summary:'ספר על למידה, הרגלים, החלטות ושיפור מתמשך.',ideas:['שיפור קטן מצטבר','משוב משנה התנהגות','סביבה מעצבת הרגלים'],topics:['הרגלים','למידה','משוב','קבלת החלטות'],feed_posts:['יישום מעשי מתחיל משינוי קטן שניתן למדוד.']}};
const chapters = reading.buildReadingChapters(sample,{seed:'test'});
assert.ok(chapters.length >= 5);
chapters.forEach(chapter => {
  assert.ok(chapter.id && chapter.title);
  assert.ok(chapter.bodyParagraphs.length >= 3);
  assert.ok(chapter.deep.sections.length >= 4);
  assert.ok(chapter.deep.takeaway);
});
assert.ok(reading.buildTakeaways(sample,chapters).length >= 4);
console.log('book reading model tests: OK');
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node tests/book-reading.test.js`
Expected: FAIL because `book-reading.js` does not exist.

- [ ] **Step 3: Implement the pure reading model**

Create a UMD-style `book-reading.js` that exports to CommonJS and `window.BookReading`. Normalize arrays, select matched professional concepts deterministically, and construct chapter paragraphs from the book's own summary/ideas/topics plus clearly labelled professional connections. Main chapter bodies must be useful without deep expansion. Deep sections use: `הסבר מעמיק`, `הקשר רחב`, `דוגמה ויישום`, `מגבלה או נקודת מבט אחרת`, `חיבורים נוספים`, `שאלות למחשבה`.

```js
function buildReadingChapters(book, options) { /* returns ReadingChapter[] */ }
function buildTakeaways(book, chapters) { /* returns string[] */ }
return { buildReadingChapters, buildTakeaways };
```

Use deterministic hashing from the seed; do not use network calls.

- [ ] **Step 4: Run model test and syntax check**

Run: `node --check book-reading.js && node tests/book-reading.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add book-reading.js tests/book-reading.test.js
git commit -m "feat: add digital book reading model"
```

---

### Task 2: Reading-first page structure and table of contents

**Files:**
- Modify: `book.html`
- Modify: `tests/book-page.test.js`

**Interfaces:**
- Produces DOM ids: `book-reading-toc`, `book-reading-body`, `book-takeaways`, `book-reading-progress`.

- [ ] **Step 1: Extend the page test first**

```js
['book-reading-toc','book-reading-body','book-takeaways','book-reading-progress'].forEach(id => assert.ok(html.includes(`id="${id}"`), `book.html should contain ${id}`));
assert.ok(html.includes('book-reading.js'), 'book.html should load book-reading.js');
assert.ok(html.indexOf('book-reading-body') < html.indexOf('book-infinite-feed'), 'reading body should precede the infinite feed');
```

- [ ] **Step 2: Run the page test and confirm RED**

Run: `node tests/book-page.test.js`
Expected: FAIL on missing reading containers.

- [ ] **Step 3: Replace the card-first primary section in `book.html`**

```html
<section class="book-reading-section" aria-label="קריאת הספר">
  <div class="book-reading-progress" aria-hidden="true"><span id="book-reading-progress"></span></div>
  <div class="book-reading-layout">
    <aside class="book-reading-toc-wrap"><div class="book-reading-toc-card"><strong>תוכן עניינים</strong><nav id="book-reading-toc" aria-label="תוכן עניינים של הספר"></nav></div></aside>
    <main><div id="book-reading-body" class="book-reading-body"></div><section class="book-takeaways-section"><span class="reading-eyebrow">סיכום</span><h2>מה לקחת מהספר</h2><ul id="book-takeaways"></ul></section></main>
  </div>
</section>
```

Keep the existing infinite-feed section after this block and rename its visible heading to `עוד מהספר`. Keep notes/reference after the feed. Load `book-reading.js` before `book-page.js`.

- [ ] **Step 4: Run page and feed tests**

Run: `node tests/book-page.test.js && node tests/book-infinite-feed.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add book.html tests/book-page.test.js
git commit -m "feat: add digital reading page structure"
```

---

### Task 3: Render open chapters, inline deep expansions, and navigation

**Files:**
- Modify: `book-page.js`
- Modify: `tests/book-page.test.js`

**Interfaces:**
- Consumes: `window.BookReading.buildReadingChapters` and `window.BookReading.buildTakeaways`.
- Produces handlers for `[data-reading-deepen]`, `[data-reading-close]`, TOC anchors, and progress.

- [ ] **Step 1: Add failing assertions**

```js
assert.ok(js.includes('buildReadingChapters'));
assert.ok(js.includes('data-reading-deepen'));
assert.ok(js.includes('book-reading-toc'));
assert.ok(js.includes('book-takeaways'));
assert.ok(js.includes('book-reading-progress'));
```

- [ ] **Step 2: Run and confirm RED**

Run: `node tests/book-page.test.js`
Expected: FAIL on the new reading assertions.

- [ ] **Step 3: Implement rendering in `book-page.js`**

Add `const R=window.BookReading;` and validate it during `loadBook()`. Render chapters with all `bodyParagraphs` open by default, inline support blocks, clickable provenance, and one `העמק` button per chapter. Deep panels render all structured sections and can be closed without hiding the core chapter.

```js
function renderReading(seed){
  const chapters=R.buildReadingChapters(state.book,{seed});
  $('book-reading-toc').innerHTML=chapters.map(ch=>`<a href="#chapter-${esc(ch.id)}">${esc(ch.title)}</a>`).join('');
  $('book-reading-body').innerHTML=chapters.map(readingChapter).join('');
  $('book-takeaways').innerHTML=R.buildTakeaways(state.book,chapters).map(item=>`<li>${esc(item)}</li>`).join('');
}
```

Update `refreshAll(mode)` so both the reading model and supplemental feed refresh. Add a requestAnimationFrame-throttled scroll handler that updates `#book-reading-progress` width from 0–100%.

- [ ] **Step 4: Preserve provenance behavior**

Keep existing `[data-source-expand]` click/keyboard logic active inside reading chapters. Provenance explains source; `העמק` teaches the topic in depth.

- [ ] **Step 5: Run syntax and regression tests**

Run: `node --check book-page.js && node tests/book-reading.test.js && node tests/book-page.test.js && node tests/book-infinite-feed.test.js`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add book-page.js tests/book-page.test.js
git commit -m "feat: render continuous digital book chapters"
```

---

### Task 4: Editorial Premium responsive visual system

**Files:**
- Modify: `book-page.css`
- Modify: `book-feed.css`
- Modify: `tests/book-page.test.js`

- [ ] **Step 1: Add CSS contract assertions**

```js
const pageCss = fs.readFileSync(path.join(root,'book-page.css'),'utf8');
['book-reading-layout','book-reading-toc-card','reading-chapter','reading-deep-panel','book-takeaways-section'].forEach(token => assert.ok(pageCss.includes(token), `book-page.css should style ${token}`));
```

- [ ] **Step 2: Run and confirm RED**

Run: `node tests/book-page.test.js`
Expected: FAIL on missing Editorial Premium classes.

- [ ] **Step 3: Implement Editorial Premium CSS**

```css
.book-page-shell{max-width:1180px;margin-inline:auto}
.book-reading-layout{display:grid;grid-template-columns:minmax(180px,240px) minmax(0,720px);gap:clamp(28px,5vw,70px);justify-content:center;align-items:start}
.book-reading-toc-card{position:sticky;top:18px;padding:18px;border-inline-start:2px solid var(--line)}
.book-reading-body{display:grid;gap:0}
.reading-chapter{padding:clamp(34px,6vw,72px) 0;border-bottom:1px solid var(--line);scroll-margin-top:24px}
.reading-chapter-copy{font-size:clamp(17px,2vw,19px);line-height:1.95;max-width:68ch}
.reading-chapter-copy p+p{margin-top:1.25em}
.reading-deep-panel{margin-top:24px;padding:clamp(20px,4vw,34px);border-radius:20px;background:var(--card);border:1px solid var(--line)}
.book-takeaways-section{margin:54px 0 24px;padding:clamp(24px,5vw,42px);border-block:1px solid var(--line)}
@media(max-width:820px){.book-reading-layout{grid-template-columns:1fr}.book-reading-toc-card{position:static}.reading-chapter{padding:36px 0}}
```

Refine typography, support blocks, focus states, deep panels, mobile TOC, and progress bar. Keep the infinite feed visually subordinate. Do not add images or image placeholders.

- [ ] **Step 4: Run tests**

Run: `node tests/book-page.test.js && node tests/book-infinite-feed.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add book-page.css book-feed.css tests/book-page.test.js
git commit -m "style: add editorial digital book layout"
```

---

### Task 5: Regression verification and delivery

- [ ] **Step 1: Run all book-specific checks**

```bash
node --check book-reading.js
node --check book-page.js
node --check book-infinite-feed.js
node tests/book-reading.test.js
node tests/book-page.test.js
node tests/book-infinite-feed.test.js
```

Expected: all PASS.

- [ ] **Step 2: Verify ordering and no image integration**

```bash
grep -n "book-reading-body\|book-infinite-feed" book.html
grep -R "generated-image" book.html book-page.js book-reading.js book-page.css book-feed.css || true
```

Expected: reading body appears before feed; no generated-image integration exists.

- [ ] **Step 3: Verify branch diff**

Run: `git diff main...HEAD -- book.html book-page.js book-reading.js book-page.css book-feed.css tests/book-page.test.js tests/book-reading.test.js`
Expected: only approved reading-experience changes.

- [ ] **Step 4: Push the feature branch**

```bash
git push origin feature/digital-book-reading
```

- [ ] **Step 5: Merge/deploy only after green verification**

After deployment manually verify desktop and mobile: core text visible immediately, TOC navigation works, `העמק` opens inline, provenance opens separately, notes still save, and `עוד מהספר` continues loading below the reading body.
