# Raishin Legacy v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone `raishin-legacy/` page that opens directly to the approved Raika gameplay shot inside Inazuma Dojo with the approved minimal HUD.

**Architecture:** Keep the game isolated inside `raishin-legacy/` with dedicated HTML, CSS, JS, and assets. Use the repo’s existing lightweight Node/assert test style to verify isolation, required HUD elements, correct asset references, and responsive structure before implementation is accepted.

**Tech Stack:** Static HTML/CSS/vanilla JS, GitHub Pages, Node `fs` + `assert` tests.

**Spec:** `docs/superpowers/specs/2026-10-09-raishin-legacy-game-design.md`

## Global Constraints

- The game lives under `raishin-legacy/` and is independent from `raika.html` and all `raika-*.js` / `raika-*.css` files.
- v0.1 shows the approved rear gameplay view of Raika inside Inazuma Dojo.
- HUD contains: health, Raihatsu/energy, current objective, Jump, Dodge, Interact, and a small minimap.
- No combat, inventory, skill tree, NPC system, or saving in v0.1.
- Raika Visual Lock remains canonical: exactly two rabbit ears, no human ears, no tail, no redesign of face/hair/outfit/body.
- Inazuma Dojo uses the approved visual reference only; do not redesign it.
- The approved gameplay image must be reused as-is. If the approved binary image cannot be recovered from the conversation/runtime, stop and request that exact approved image from the user; do not regenerate it.

## Review Focus

- Missing approved gameplay asset must fail loudly rather than silently falling back to a regenerated or unrelated image.
- Mobile portrait must not crop Raika or create horizontal page scrolling.
- The page must not import or reference `raika.html`, `raika-*.js`, or `raika-*.css`.
- HUD controls must remain UI-only in v0.1 and must not imply combat or inventory functionality.
- Image rendering must preserve 16:9 with `object-fit: contain` / equivalent behavior rather than stretching.

---

### Task 1: Add failing standalone-page contract test

**Files:**
- Create: `tests/raishin-legacy-v01.test.js`
- Later create: `raishin-legacy/index.html`
- Later create: `raishin-legacy/styles.css`
- Later create: `raishin-legacy/game.js`

**Interfaces:**
- Consumes: filesystem paths in this repository.
- Produces: a Node test that asserts the standalone v0.1 contract.

- [ ] **Step 1: Write the failing test**

The test must assert:
- `raishin-legacy/index.html`, `styles.css`, and `game.js` exist.
- HTML contains a `16:9` gameplay frame marker and references only local `./styles.css`, `./game.js`, and the approved gameplay asset path.
- HTML/CSS/JS contain no `raika.html`, `raika-*.js`, or `raika-*.css` references.
- HUD text/markers exist for `Health`, `Raihatsu`, `Objective`, `Jump`, `Dodge`, `Interact`, and minimap.
- CSS includes a no-horizontal-overflow rule and responsive rules for portrait and landscape.
- The approved gameplay asset file exists.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/raishin-legacy-v01.test.js`

Expected: FAIL because `raishin-legacy/` does not exist yet.

- [ ] **Step 3: Commit the failing test**

Commit: `test: define Raishin Legacy v0.1 page contract`

### Task 2: Build the isolated v0.1 shell and HUD

**Files:**
- Create: `raishin-legacy/index.html`
- Create: `raishin-legacy/styles.css`
- Create: `raishin-legacy/game.js`

**Interfaces:**
- Consumes: approved gameplay image at `raishin-legacy/assets/gameplay/gameplay-hud-v1.png`.
- Produces: standalone responsive game shell with static HUD v0.1.

- [ ] **Step 1: Implement `index.html`**

Include one 16:9 gameplay frame, the approved gameplay image, and the HUD elements required by the spec. Do not include navigation back to `raika.html` or imports from the main Raika site.

- [ ] **Step 2: Implement `styles.css`**

Use isolated selectors under a root game container. Preserve the image with contain-style rendering, keep HUD clear of Raika’s center/back silhouette, and add desktop, mobile landscape, and mobile portrait behavior with no horizontal scroll.

- [ ] **Step 3: Implement `game.js`**

Provide only v0.1 UI initialization/markers needed by the static screen. Buttons remain non-combat UI and may provide a tiny pressed-state or status hint only.

- [ ] **Step 4: Run the contract test**

Run: `node tests/raishin-legacy-v01.test.js`

Expected: still FAIL only if the approved gameplay image asset has not yet been added; all structural assertions should pass.

- [ ] **Step 5: Commit**

Commit: `feat: add standalone Raishin Legacy v0.1 shell`

### Task 3: Add the approved gameplay image without regenerating it

**Files:**
- Create: `raishin-legacy/assets/gameplay/gameplay-hud-v1.png`

**Interfaces:**
- Consumes: the exact user-approved gameplay image from this conversation/runtime.
- Produces: the canonical visual asset used by v0.1.

- [ ] **Step 1: Recover the exact approved image file**

Use the existing approved output if it is accessible as a mounted conversation asset. Do not call image generation and do not recreate the shot.

- [ ] **Step 2: If the exact asset is unavailable, stop**

Ask the user to upload the approved image file. Do not substitute another image.

- [ ] **Step 3: Add the image at the exact path**

Path: `raishin-legacy/assets/gameplay/gameplay-hud-v1.png`

- [ ] **Step 4: Run the contract test**

Run: `node tests/raishin-legacy-v01.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add approved Raishin gameplay visual`

### Task 4: Final verification and publication readiness

**Files:**
- Verify: `raishin-legacy/index.html`
- Verify: `raishin-legacy/styles.css`
- Verify: `raishin-legacy/game.js`
- Verify: `raishin-legacy/assets/gameplay/gameplay-hud-v1.png`
- Verify: `tests/raishin-legacy-v01.test.js`

**Interfaces:**
- Consumes: complete v0.1 implementation.
- Produces: a branch ready to merge to `main` and publish via GitHub Pages at `/raishin-legacy/`.

- [ ] **Step 1: Run the v0.1 test**

Run: `node tests/raishin-legacy-v01.test.js`

Expected: PASS.

- [ ] **Step 2: Run the repository’s existing lightweight JS tests relevant to static pages**

Run the existing `tests/*.test.js` suite or the repository’s established equivalent command if present.

Expected: no new failures caused by the Raishin files.

- [ ] **Step 3: Manually inspect source isolation**

Confirm no `raika.html`, `raika-*.js`, `raika-*.css`, combat, inventory, save, or NPC code is introduced.

- [ ] **Step 4: Verify the publication URL after merge**

Expected GitHub Pages path: `/raishin-legacy/`.

- [ ] **Step 5: Commit any verification-only fixes, then prepare merge**

Commit if needed: `fix: finalize Raishin Legacy v0.1 release`
