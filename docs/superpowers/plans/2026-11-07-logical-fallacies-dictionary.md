# Logically Fallacious Dictionary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give readers of Logically Fallacious a navigable local index of all 238 public online entries, with Hebrew discovery and an original educational layer.

**Architecture:** A UMD data module owns the official entry titles and curated Hebrew content; a pure search/filter module creates indexed results; a browser-only UI module mounts into a dedicated section of book.html after the book:content-ready event. The existing infinite feed may reuse the same data only for the target book.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js assert tests, existing GitHub Pages repository.

**Spec:** `docs/superpowers/specs/2026-11-07-logical-fallacies-dictionary-design.md`

## Global Constraints

- All existing book content and pages remain unchanged except additive integration points.
- Distinguish 238 public index entries from the printed book's 300+ claims.
- Preserve existing 14 enriched fallacies and source credit; do not reproduce third-party prose en masse.
- Existing Node.js tests must keep passing; no new dependencies.

## Review Focus

- Only the target book displays the section.
- Search returns matching Hebrew/English names, and empty queries show the whole list.
- Saving toggles without stale state and survives reload.
- The data has 238 unique entries and no missing titles.
- HTML escaping and external-link safety prevent injection.

### Task 1: Catalogue and search

**Files:** Create `book-fallacies-data.js`, `book-fallacies.js`, `tests/book-fallacies.test.js`.

**Interfaces:** `BookFallaciesData.ENTRIES`, `BookFallacies.isTargetBook(book)`, `BookFallacies.search(items,query,category,savedIds)`, `BookFallacies.CATEGORIES`.

- [ ] Write failing tests for count, unique titles, target recognition, bilingual search, categories, saved filter.
- [ ] Run `node tests/book-fallacies.test.js`, confirm expected failure.
- [ ] Add static titles, curated Hebrew descriptions, safe fallbacks, stable IDs and pure search utilities.
- [ ] Run the same test, require pass.

### Task 2: Dedicated reading interface

**Files:** Create `book-fallacies-ui.js`, `book-fallacies.css`, `tests/book-fallacies-ui.test.js`; modify `book.html`.

**Interfaces:** `BookFallaciesUI.cardMarkup(item,saved)`, `BookFallaciesUI.detailMarkup(item,saved)`, `BookFallaciesUI.install()`.

- [ ] Write failing tests for markup, safe links, controls, CSS and script inclusion.
- [ ] Run `node tests/book-fallacies-ui.test.js`, confirm expected failure.
- [ ] Implement the standalone search, category filtering, saved collection, detail view and accessible controls.
- [ ] Run the same test, require pass.

### Task 3: Feed connection and regressions

**Files:** Modify `book-infinite-feed.js`; extend `tests/book-fallacies.test.js`.

**Interfaces:** `BookInfiniteFeed.buildBookFeedBatch` selects the extended source only for the target book.

- [ ] Write failing tests for target book extended fallacies and other book unchanged.
- [ ] Run test, confirm expected failure.
- [ ] Reuse the catalog for target book while retaining existing content for every other book.
- [ ] Run all relevant book tests and basic syntax checks, require pass.
