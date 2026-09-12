# Language Learning Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a focused long-scroll interactive learning page for one selected language, plus separate overview, topics, and archive/review pages.

**Architecture:** Keep the site static and framework-free. Put shared course data, display rules, persistence helpers, and language/topic metadata in `language-core.js`; build small page-specific controllers on top. Preserve the existing `my-center-languages-v1` localStorage object and add fields without deleting legacy data.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-12-language-learning-pages-design.md`

## Global Constraints
- Arabic primary text is Hebrew transliteration; Arabic script is secondary.
- Russian primary text is Latin transliteration; Cyrillic is secondary.
- Italian and Spanish primary text is their normal spelling.
- Selecting a language opens only that language's focused study page.
- Exercise sections refresh independently.
- Existing saved progress under `my-center-languages-v1` remains readable.

---

### Task 1: Shared language core
**Files:** Create `language-core.js`.

- [ ] Define language metadata for `ar`, `it`, `ru`, `es` and six complete topics.
- [ ] Add helpers for URL language/topic validation, primary/secondary display text, deterministic shuffling, state loading/saving, seen-word persistence, mistakes, and completion.
- [ ] Verify with `node --check language-core.js` in a local syntax check copy.

### Task 2: Languages overview
**Files:** Modify `languages.html`; create `languages-home.js`; create/update shared page styles.

- [ ] Replace the old all-in-one lesson view with four language cards.
- [ ] Show daily completion and per-language stored word counts.
- [ ] Link each card to `language-study.html?lang=<code>`, plus separate topics/archive actions.
- [ ] Verify all generated links and required element IDs.

### Task 3: Long interactive study page
**Files:** Create `language-study.html`, `language-study.js`, `language-pages.css`.

- [ ] Render only the selected language and selected topic.
- [ ] Render vocabulary, recognition, reverse questions, sentence builder, missing word, true/false, situation choice, short translation, dialogue, what-would-you-say, previous material, mistakes, and final challenge.
- [ ] Add per-section refresh buttons that only rerender their section.
- [ ] Record wrong answers to persistent mistakes and words to seen vocabulary.
- [ ] Add `עוד תרגילים ↓` to append another exercise batch.
- [ ] Verify JavaScript syntax and that Arabic/Russian display rules are applied by shared helpers.

### Task 4: Topics page
**Files:** Create `language-topics.html`, `language-topics.js`.

- [ ] Render six available topics for the selected language.
- [ ] Selecting a topic routes to the focused study page with both query parameters.
- [ ] Show the current topic and stored progress counts where available.

### Task 5: Archive and review page
**Files:** Create `language-archive.html`, `language-archive.js`.

- [ ] Show seen vocabulary for one selected language by default.
- [ ] Provide search and status filters (`חדש`, `לתרגול`, `יודע`).
- [ ] Use primary transliteration display for Arabic and Russian and secondary native script.
- [ ] Add a mistakes-only review area with clear/reset actions.

### Task 6: Verification
**Files:** All new/modified language files.

- [ ] Fetch final files from `main` and confirm expected scripts/styles are referenced.
- [ ] Run syntax checks on all JavaScript content in a local temporary copy.
- [ ] Confirm home page link still reaches `languages.html` and no other site area is modified.
