# Book Search and Reading Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a per-book search across all available chapters and concepts, a dedicated Jung types guide, and remove repetitive template introductions across the library.

**Architecture:** A pure UMD index/search model consumes the book data, current chapters and related-concepts catalogue; a small UI controller renders an accessible in-book search panel and details. Keep the existing `book-page.js` reader integration narrow, and replace template-driven paragraphs in the existing reading model with source-grounded writing.

**Tech Stack:** Vanilla HTML/CSS/JS, CommonJS-compatible UMD modules, Node `assert` tests, existing GitHub Pages repository.

**Spec:** `docs/superpowers/specs/2026-11-07-book-search-and-reading-design.md`

## Global Constraints

- Keep the current GitHub Pages site and existing reading, notes, source badges and controls working.
- Do not mutate Supabase book records, original-text assets or user notes.
- Mark guide explanations as educational synthesis, not verbatim Jung quotes; do not equate Jung's eight combinations with MBTI's sixteen types.
- Search all locally available book content, not just the random selection currently rendered.
- Remove generic prose rather than padding sparse books with inventions.

## Review Focus

1. **Niqqud and punctuation:** `סוגי אישיות` should match equivalent text with spacing or Hebrew marks (Task 1).
2. **Hidden material:** a topic absent from the visible chapter set should still be findable/openable (Task 1/3).
3. **Sparse books:** empty `content` must not crash search, invent chapters or generate boilerplate (Task 1/2).
4. **Refreshing chapters:** search links should not target stale chapter elements after regeneration (Task 3).
5. **RTL/mobile and keyboard:** the search should be operable by keyboard and fit small screens (Task 3).

---

### Task 1: Comprehensive book index

**Files:**
- Create: `book-search.js`
- Create: `tests/book-search.test.js`

**Interfaces:**
- Produces: `BookSearch.buildBookIndex(book, chapters, relatedConcepts, guides)` → array of `{id,kind,title,description,sourceLabel,chapterId?,detail?,searchTerms?}`.
- Produces: `BookSearch.searchBookIndex(entries, query)` → matching array; with an empty query return grouped browseable entries.

- [ ] **Step 1: Write failing tests** for Hebrew query normalization, matching all topics/ideas/learning points beyond visible chapters, result grouping and no-data handling.
- [ ] **Step 2: Run** `node tests/book-search.test.js` and confirm expected failures because the module is absent.
- [ ] **Step 3: Implement** `book-search.js` with a stable deduplicated index and all-term substring/token search, without external services.
- [ ] **Step 4: Run** `node tests/book-search.test.js` and confirm all cases pass.
- [ ] **Step 5: Commit** Task 1 files on the feature branch.

### Task 2: Source-grounded reading paragraphs

**Files:**
- Modify: `book-reading.js`
- Modify: `tests/book-reading.test.js`

**Interfaces:**
- Preserve `BookReading.buildReadingChapters(book, options)` and `BookReading.buildTakeaways(book, chapters)` signatures.

- [ ] **Step 1: Extend failing tests** so no chapter starts with generic introductions, and varied source material yields distinct substantive paragraph content while sparse books remain honest.
- [ ] **Step 2: Run** `node tests/book-reading.test.js`, confirming failures against the current repeated phrases.
- [ ] **Step 3: Replace** `mainParagraphs` and repetitive portions of `deepMaterial` with paragraphs grounded in the specific book's supplied passages and curated concepts, suppressing fake filler.
- [ ] **Step 4: Run** `node tests/book-reading.test.js` and confirm all cases pass.
- [ ] **Step 5: Commit** Task 2 files on the feature branch.

### Task 3: Search UI and reading navigation

**Files:**
- Create: `book-search-ui.js`
- Modify: `book.html`
- Modify: `book-page.css`
- Modify: `book-page.js`
- Modify: `tests/book-page.test.js`

**Interfaces:**
- Consumes `BookSearch.buildBookIndex` and `BookSearch.searchBookIndex` (Task 1); accepts an optional book-specific guide module that is introduced in Task 4.
- `book-page.js` dispatches `book:content-ready` with `{book,chapters}` on initial render and refresh; UI reindexes and navigates to live chapters.

- [ ] **Step 1: Write failing integration tests** for search button, panel, result slots, script wiring, a refresh event and keyboard semantics.
- [ ] **Step 2: Run** `node tests/book-page.test.js` and confirm failures for absent UI.
- [ ] **Step 3: Implement** a responsive open/close/search/results/detail panel, with click-to-chapter scrolling and a details view for non-rendered topics and concepts.
- [ ] **Step 4: Run** `node tests/book-page.test.js` and verify UI strings and script links; manually inspect responsiveness where browser is available.
- [ ] **Step 5: Commit** Task 3 files on the feature branch.

### Task 4: Jung's eight types as a real explorable guide

**Files:**
- Create: `book-search-guides.js`
- Create: `tests/book-search-guides.test.js`
- Modify: `book.html`
- Modify: `tests/book-page.test.js`

**Interfaces:**
- Produces: `BookSearchGuides.forBook(book)` → array of topic records for *Psychological Types*, otherwise `[]`; records contain id, title, explanation, example and distinction.

- [ ] **Step 1: Write failing tests** asserting eight Jung type combinations, all found by `סוגי אישיות`, and zero matches for unrelated books.
- [ ] **Step 2: Run** `node tests/book-search-guides.test.js` to confirm expected failure.
- [ ] **Step 3: Add** factual, bounded content about attitude × function, with descriptions, examples and limitations; research/check authoritative original text first, and wire the guide into the book page.
- [ ] **Step 4: Run** guide and combined search tests with real book fixture.
- [ ] **Step 5: Commit** Task 4 files on the feature branch.

### Task 5: Full validation and publication

**Files:**
- Modify: only what failed validation, if necessary.

- [ ] **Step 1: Run** `node --test tests/*.test.js` and report exact pass/failure counts.
- [ ] **Step 2: Review** `git diff` for unrelated changes and check `node --check` on changed JS files.
- [ ] **Step 3: Publish** the verified feature branch through the existing GitHub PR flow; no rewrite of unrelated commits.
- [ ] **Step 4: Verify** the live book page and search results in a browser when available; report limitations if the browser is unavailable.
- [ ] **Step 5: Share** the direct library URL and summarize what is live, distinguishing verified deployment from source changes.
