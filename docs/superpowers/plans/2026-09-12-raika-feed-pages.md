# Raika Feed + Page Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the frozen Raika topic bar from anchor scrolling to real pages, and turn `raika.html` into a deterministic daily mixed feed with manual refresh.

**Architecture:** Keep `raika-data.js` as the single browser data source. Add a focused `raika-feed.js` module for candidate building, deterministic seeded shuffle, localStorage refresh state, and feed rendering. Reuse the existing `raika-app.js` collection renderers and private scripts on seven topic pages, each page exposing only its relevant collection container while sharing the same page-navigation bar.

**Tech Stack:** Static GitHub Pages HTML/CSS/JavaScript, Node built-in test runner, existing Supabase private writers-room scripts.

**Spec:** `docs/superpowers/specs/2026-09-12-raika-feed-pages-design.md`

## Global Constraints

- `raika-data.js` remains the source of Raika data.
- No automatic canon promotion.
- Every feed card visibly preserves status: `canon`, `developing`, `idea`, or `parked`.
- The same date and refresh seed must yield the same feed order.
- Manual refresh changes the stored seed for that date only.
- Private auth/edit/version/AI scripts remain available on the relevant Raika pages.
- Global bottom navigation remains unchanged.

---

### Task 1: Add failing coverage for page navigation and daily feed behavior

**Files:**
- Modify: `tests/raika-private.test.js`
- Create: `tests/raika-feed.test.js`

**Interfaces:**
- Produces required behavior for `raika-feed.js`: `buildFeedCandidates(data)`, `dailyFeed(items,dateKey,refreshSeed,count)`, `hashString(value)`, `seededShuffle(items,seed)`.

- [ ] **Step 1: Add tests that require all seven page URLs in `raika.html` rather than `#anchors`.**
- [ ] **Step 2: Add tests that require all seven section HTML files and shared assets.**
- [ ] **Step 3: Add feed unit tests proving same date/seed is deterministic and a changed refresh seed changes order.**
- [ ] **Step 4: Add a test proving feed candidates preserve source status.**
- [ ] **Step 5: Push tests only and verify the Raika workflow fails because the new pages/module do not exist yet.**

### Task 2: Implement deterministic daily Raika feed

**Files:**
- Create: `raika-feed.js`
- Modify: `raika.html`
- Modify: `styles.css`

**Interfaces:**
- `buildFeedCandidates(data) -> FeedCard[]`
- `dailyFeed(items,dateKey,refreshSeed,count=16) -> FeedCard[]`
- Browser storage key: `raika-feed-refresh-v1:<YYYY-MM-DD>`
- Feed container: `#raika-daily-feed`
- Refresh control: `#raika-refresh-feed`

- [ ] **Step 1: Implement string hashing and seeded Fisher-Yates shuffle.**
- [ ] **Step 2: Flatten characters into candidate cards for summary, traits, wants, fears, beliefs, contradictions, and thinking where present.**
- [ ] **Step 3: Add candidates from scenes, plotlines, history, world, relationships, and writers-room ideas.**
- [ ] **Step 4: Render 16 mixed cards with category, title, short text, status badge, and target page link.**
- [ ] **Step 5: Read/write the per-date refresh seed in localStorage and rerender on `🔄 רענן פיד`.**
- [ ] **Step 6: Replace the old long section list in `raika.html` with the scrollable daily feed while keeping Raika header, canon note, private login hub, frozen topic bar, and bottom nav.**
- [ ] **Step 7: Add compact feed styles to `styles.css`.**

### Task 3: Create seven topic pages and switch frozen navigation to page URLs

**Files:**
- Create: `raika-characters.html`
- Create: `raika-scenes.html`
- Create: `raika-plotlines.html`
- Create: `raika-history.html`
- Create: `raika-world.html`
- Create: `raika-relationships.html`
- Create: `raika-writers-room.html`

**Interfaces:**
- Shared topic bar links: `raika-characters.html`, `raika-scenes.html`, `raika-plotlines.html`, `raika-history.html`, `raika-world.html`, `raika-relationships.html`, `raika-writers-room.html`.
- Each page loads `app.js`, `raika-data.js`, `raika-app.js`, `raika-private-auth.js`, `raika-private-editor.js`, `raika-edit-ui.js`, `raika-versions-ui.js`, `raika-ai.js`.

- [ ] **Step 1: Create each page with Raika title, canon note, shared frozen topic bar, search/status/type controls, one relevant collection container, and bottom nav.**
- [ ] **Step 2: Ensure scenes page keeps `#scenes-grid` so existing full-scene modal behavior remains.**
- [ ] **Step 3: Ensure every page includes `.raika-hub` so private login/authorized state can mount.**
- [ ] **Step 4: Ensure existing private editor decoration can find the same known grid IDs.**

### Task 4: Verify and integrate

**Files:**
- Test: `tests/raika-private.test.js`
- Test: `tests/raika-feed.test.js`

- [ ] **Step 1: Verify all changed browser scripts pass `node --check`.**
- [ ] **Step 2: Verify Node tests pass in GitHub Actions.**
- [ ] **Step 3: Review the branch diff for accidental canon/data changes.**
- [ ] **Step 4: Open a pull request to `main` only after green CI.**
