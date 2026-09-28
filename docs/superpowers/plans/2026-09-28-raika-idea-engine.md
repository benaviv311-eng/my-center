# Raika Idea Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לבנות בחדר הכותבים של ראיקה מנוע רעיונות שמחזיק לפחות 1,300 רעיונות בסיסיים, מייצר רעיונות חדשים דינמיים, מרענן את כל סט ההצעות, זוכר מה כבר הוצג, ומכבד חסימה קבועה של “אל תציע לי יותר”.

**Architecture:** המנוע ירחיב את פיד ראיקה הקיים במקום להחליף אותו: מאגר בסיס קבוע יישמר ב-Supabase, פיד ה-AI ימשיך לייצר הצעות חדשות, ו-Edge Function אחת תאחד מקור בסיס + מקור דינמי, תסנן blocked/seen, ותבנה batch מגוון. הממשק הקיים ב-`raika-feed-ui.js` יקבל רענון מלא, פילטרים ופעולת חסימה לצמיתות, תוך שמירת כל פעולות הפיד הקיימות.

**Tech Stack:** Vanilla JavaScript, Node test runner, Supabase Postgres + RLS, Supabase Edge Functions (Deno), `@supabase/supabase-js@2.116.0`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-26-raika-idea-engine-design.md`

## Global Constraints

- לפחות **1,300 רעיונות בסיסיים** זמינים במאגר לאחר seed.
- רענון מלא מציג **24 רעיונות** חדשים במסך הראשוני.
- מקור ברירת המחדל ל-batch: יעד **60% base / 40% dynamic**, עם fallback ל-base כאשר AI אינו זמין.
- batches נוספים בגלילה: **8–12 רעיונות**.
- `never_show_again` נשמר בשרת בין מכשירים וסשנים.
- חסימה קבועה חוסמת גם signature מדויק וגם fingerprint סמנטי/משפחת רעיון.
- הצעה אינה הופכת לקאנון בלי אישור מפורש.
- RLS לכל טבלה חדשה ב-`public`, עם ownership לפי `(select auth.uid()) = user_id`.
- אין לחשוף `service_role` או secret key ללקוח.
- מערכת הפיד חייבת לעבוד גם כאשר AI אינו זמין.
- פעולות קיימות נשמרות: שמור, אהבתי, עוד כזה, בוא נדבר, פתח לפיתוח, הפוך לסצנה, פחות כאלה, הסתר.

## Review Focus

1. **AI לא זמין בזמן רענון:** עדיין מוחזר batch מלא ככל האפשר ממאגר הבסיס, בלי לשבור את UI.
2. **חסימה חוזרת מניסוח שונה:** וריאציה עם אותו premise/plot family לא אמורה לחזור מיד כתחליף לרעיון שנחסם.
3. **מאגר כמעט מוצה תחת פילטר צר:** המערכת מחזירה פחות פריטים באופן תקין או מרחיבה exploration, אך אינה מחזירה blocked.
4. **רענון בזמן שיש כרטיסים שמורים/בפיתוח:** הכרטיסים הנעולים נשארים; רק הצעות לא-נעולות מוחלפות.
5. **מכשיר חדש / localStorage ריק:** seen/blocked שמורים בשרת עדיין משפיעים על התוצאות.

---

## File Structure

### Create

- `supabase/migrations/20260928_raika_idea_engine.sql` — טבלאות מאגר רעיונות, חסימות, metadata/indexes/RLS.
- `supabase/seed/raika_idea_pool.json` — לפחות 1,300 רשומות seed בסיסיות עם IDs קבועים ו-metadata.
- `raika-idea-engine-core.js` — helpers טהורים לבחירת batch, גיוון, signatures, blocked filtering ו-refresh semantics.
- `tests/raika-idea-engine.test.js` — unit/integration tests למאגר, ערבוב, חסימה ורענון.
- `tests/raika-idea-seed.test.js` — בדיקות איכות/כמות למאגר seed.

### Modify

- `supabase/functions/_shared/raika-feed-core.mjs` — request schema, novelty, semantic family checks, prompt + dedupe.
- `supabase/functions/raika-feed/index.ts` — פעולות `refresh_all`, `block_forever`, שילוב base/dynamic, server history.
- `raika-feed-client.js` — client methods חדשים לרענון וחסימה.
- `raika-feed-ui.js` — 24-card refresh, כפתור “אל תציע לי יותר”, פילטרים, new-ideas mode.
- `raika-feed-state.js` — refresh semantics ששומרים locked/saved cards.
- `raika-writers-room.html` — controls חדשים ו-version bumps.
- `tests/raika-feed.test.js` — browser contract + controls + script wiring.
- `tests/raika-private-ai.test.js` או קובץ Edge Function test קיים — API actions, blocked persistence, fallback.
- `supabase/functions/_shared/raika-feed-core.test.mjs` אם קיים; אחרת create `tests/raika-feed-core.test.mjs`.

---

### Task 1: Materialize and validate the 1,300+ base idea pool

**Files:**
- Create: `supabase/seed/raika_idea_pool.json`
- Create: `tests/raika-idea-seed.test.js`

**Interfaces:**
- Produces: JSON array where each record has `idea_id`, `title`, `body`, `card_type`, `characters`, `locations`, `timeline`, `tone`, `tags`, `plot_family`, `signature`, `semantic_fingerprint`, `canon_dependencies`, `novelty_score`, `source_type`.
- Consumers: Task 2 migration/seed load and Task 3 feed selection.

- [ ] **Step 1: Write failing seed-volume and quality tests**

In `tests/raika-idea-seed.test.js`, assert:
- JSON parses.
- `ideas.length >= 1300`.
- every `idea_id` is unique.
- every `signature` is unique.
- every row has non-empty `title`, `body`, `card_type`, `plot_family`.
- `source_type === 'base'`.
- at least the spec minimum per category: 200 plotline/saga, 150 character conflict, 120 relationship/dialogue, 120 flashback/history, 100 school, 100 family/comedy, 100 training/fight/mission, 100 world/faith/legacy, 100 antagonist/mystery/secret, 80 moral/philosophy, 80 what-if/twist, 50 scene-seed.
- no single character appears in more than 35% of records.
- at least 12 distinct `card_type` values.

- [ ] **Step 2: Run the seed test and verify RED**

Run:
`node --test tests/raika-idea-seed.test.js`

Expected: FAIL because `supabase/seed/raika_idea_pool.json` does not exist.

- [ ] **Step 3: Create the seed dataset**

Create `supabase/seed/raika_idea_pool.json` with at least 1,300 concrete proposal records. Build them from a broad set of authored narrative blueprints and canon-aware combinations; do not create trivial duplicates by swapping only a name.

Required ID pattern:
`raika-base-<category>-<zero-padded-number>`

Required `novelty_score`: number in `[0,1]`.

- [ ] **Step 4: Run the seed test and verify GREEN**

Run:
`node --test tests/raika-idea-seed.test.js`

Expected: PASS, 0 failures.

- [ ] **Step 5: Commit**

`git add supabase/seed/raika_idea_pool.json tests/raika-idea-seed.test.js && git commit -m "feat: add Raika base idea pool"`

---

### Task 2: Add Supabase storage for base pool and permanent blocking

**Files:**
- Create via Supabase CLI, then commit as: `supabase/migrations/20260928_raika_idea_engine.sql`
- Test: migration verification query / Supabase advisors

**Interfaces:**
- Produces tables:
  - `public.raika_idea_pool`
  - `public.raika_idea_blocks`
- `raika_idea_pool` rows are shared catalog content, read by Edge Function service client.
- `raika_idea_blocks` rows are user-owned and keyed by `user_id + semantic_fingerprint`.

- [ ] **Step 1: Create migration through Supabase CLI**

Run:
`supabase migration new raika_idea_engine`

Use the generated migration file as the source; when committed in this repo it must carry the generated timestamped name. If implementation occurs on 2026-09-28 and the generated name differs from `20260928_raika_idea_engine.sql`, keep the CLI-generated filename and update this plan reference in the implementation commit.

- [ ] **Step 2: Write schema SQL**

`raika_idea_pool` columns:
- `idea_id text primary key`
- `title text not null`
- `body text not null`
- `card_type text not null`
- `characters jsonb not null default '[]'`
- `locations jsonb not null default '[]'`
- `timeline text not null default ''`
- `tone jsonb not null default '[]'`
- `tags jsonb not null default '[]'`
- `plot_family text not null`
- `signature text not null unique`
- `semantic_fingerprint text not null`
- `canon_dependencies jsonb not null default '[]'`
- `novelty_score double precision not null check (novelty_score between 0 and 1)`
- `source_type text not null check (source_type in ('base','dynamic'))`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`

`raika_idea_blocks` columns:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `idea_id text`
- `signature text not null`
- `semantic_fingerprint text not null`
- `plot_family text not null default ''`
- `reason text not null default 'never_show_again'`
- `created_at timestamptz not null default now()`
- unique `(user_id, semantic_fingerprint)`

Indexes:
- pool on `(active, card_type)`, `plot_family`, `semantic_fingerprint`
- blocks on `(user_id, created_at desc)`, `(user_id, plot_family)`

Security:
- enable RLS on both tables.
- do not grant direct client write to `raika_idea_pool`; Edge Function service client owns catalog access.
- `raika_idea_blocks`: authenticated users can select/insert/delete only where `(select auth.uid()) = user_id`.

- [ ] **Step 3: Load the seed into `raika_idea_pool`**

Use a one-time seed/import script or SQL generated from `supabase/seed/raika_idea_pool.json`, preserving `idea_id` and signatures. Do not hand-edit production rows.

- [ ] **Step 4: Verify database behavior**

Queries must prove:
- `select count(*) from public.raika_idea_pool where active` >= 1300.
- duplicate `signature` insertion fails.
- one authenticated user cannot read another user's `raika_idea_blocks`.
- same user cannot insert duplicate `semantic_fingerprint`.

Run Supabase advisors and record no new critical security findings.

- [ ] **Step 5: Commit**

Commit migration + seed import mechanism with:
`git commit -m "feat: store Raika idea pool and permanent blocks"`

---

### Task 3: Add pure selection, diversity, and refresh semantics

**Files:**
- Create: `raika-idea-engine-core.js`
- Create: `tests/raika-idea-engine.test.js`
- Modify: `raika-feed-state.js`

**Interfaces:**
- Produces:
  - `ideaFingerprint(card) -> string`
  - `filterBlocked(cards, blocked) -> Card[]`
  - `selectDiverseBatch(cards, options) -> Card[]`
  - `replaceRefreshableCards(state, cards) -> FeedState`
- `selectDiverseBatch` options: `{count, seenSignatures, blockedFingerprints, blockedFamilies, filterType, seed}`.
- Consumers: browser UI and server core tests.

- [ ] **Step 1: Write failing tests**

Cover:
- blocked fingerprint is removed.
- blocked `plot_family` near-variation is excluded when block is marked family-wide.
- selection returns at most 24 and has no duplicate signature.
- with sufficient pool, no single `card_type` exceeds 35% of batch.
- with sufficient pool, no single character dominates >35%.
- `replaceRefreshableCards` retains locked cards and replaces only unlocked cards.
- same deterministic `seed` gives same batch; different seed changes selection.

- [ ] **Step 2: Run tests and verify RED**

Run:
`node --test tests/raika-idea-engine.test.js`

Expected: FAIL because core module/functions do not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Create `raika-idea-engine-core.js` with the exact exported names above. Use deterministic hashing already established in Raika feed code rather than adding a dependency.

Modify `raika-feed-state.js` only enough to expose locked-card-preserving refresh semantics; do not remove existing daily-feed behavior used by `raika.html`.

- [ ] **Step 4: Run tests and verify GREEN**

Run:
`node --test tests/raika-idea-engine.test.js tests/raika-feed.test.js`

Expected: PASS for new engine tests and no regressions in existing Raika feed tests.

- [ ] **Step 5: Commit**

`git add raika-idea-engine-core.js raika-feed-state.js tests/raika-idea-engine.test.js && git commit -m "feat: add Raika idea selection engine"`

---

### Task 4: Extend server feed core for novelty and permanent exclusions

**Files:**
- Modify: `supabase/functions/_shared/raika-feed-core.mjs`
- Create or modify: `tests/raika-feed-core.test.mjs`

**Interfaces:**
- Extend `normalizeFeedRequest(input)` to support actions `refresh_all` and `block_forever`.
- Request adds:
  - `blocked_signatures: string[]`
  - `blocked_fingerprints: string[]`
  - `filter_type: string`
  - `novelty_target: number`
- Extend `buildFeedPrompt(...)` with blocked families + explicit “genuinely novel” instruction.
- Add `semanticFingerprint(card) -> string`.
- Add `isBlockedCard(card, blockedRows) -> boolean`.

- [ ] **Step 1: Write failing server-core tests**

Tests:
- `normalizeFeedRequest({action:'refresh_all',count:24})` accepts 24 for refresh even though normal load-more remains capped at 12.
- `block_forever` requires a `seed_card_id`.
- blocked fingerprint rejects exact and normalized near-equivalent card.
- prompt contains explicit blocked context and `novelty_target`.
- AI cards still require title/body and valid creativity distance.
- malformed/oversized blocked arrays are bounded.

- [ ] **Step 2: Run tests and verify RED**

Run:
`node --test tests/raika-feed-core.test.mjs`

Expected: FAIL on unsupported actions / missing functions.

- [ ] **Step 3: Implement core changes**

Keep `generate`, `more_like`, `feedback`, `expand_scene` backward compatible. Allow `refresh_all` count up to 24; retain max 12 for incremental generation.

Fingerprint should be based on normalized:
`card_type + sorted characters + plot_family/core premise tokens + title/body content`.

- [ ] **Step 4: Run tests and verify GREEN**

Run:
`node --test tests/raika-feed-core.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

`git add supabase/functions/_shared/raika-feed-core.mjs tests/raika-feed-core.test.mjs && git commit -m "feat: add Raika feed novelty and block rules"`

---

### Task 5: Implement server-side refresh_all, base/dynamic mixing, and block_forever

**Files:**
- Modify: `supabase/functions/raika-feed/index.ts`
- Test: Edge Function integration tests in existing Raika private/feed test suite

**Interfaces:**
- `POST action=refresh_all` returns `{ok:true,cards:[...],source_mix:{base:number,dynamic:number}}`.
- `POST action=block_forever` with `seed_card_id` returns `{ok:true,blocked:true}`.
- Existing `feedback` endpoint remains unchanged for ordinary hidden/less-like behavior.

- [ ] **Step 1: Write failing integration/API tests**

Prove:
- `refresh_all` asks for up to 24.
- blocked card/fingerprint never appears in result.
- saved/promoted cards are not deleted server-side.
- when OpenAI fails or key is absent, base-pool cards are still returned.
- with AI available and enough results, target mix is approximately 60/40 (allow ±2 cards at 24).
- new device with no client blocked list is still filtered using `raika_idea_blocks`.
- `block_forever` creates idempotent block state.
- non-owner cannot block/read another user's rows.

- [ ] **Step 2: Run tests and verify RED**

Run the exact existing Edge Function test command used by the repository; if none exists, add a Node/Deno-compatible test harness and run it directly.

Expected: FAIL because actions are unsupported.

- [ ] **Step 3: Implement `block_forever`**

Lookup the card by `seed_card_id + user_id`. Derive `signature`, semantic fingerprint and `plot_family` from structured payload. Upsert into `raika_idea_blocks`; also set `hidden_at` on the current feed card.

- [ ] **Step 4: Implement `refresh_all`**

Load in parallel:
- workspace context
- recent feed cards
- feedback
- user blocks
- candidate base pool rows

Filter server-side before any response. Pick ~14 base cards for count 24, request ~10 dynamic cards, dedupe, then fill shortfalls from unused base pool.

Do not delete historic feed cards; history is useful for seen filtering.

- [ ] **Step 5: Implement AI-failure fallback**

If OpenAI is unavailable for `refresh_all`, return a diverse base-only batch instead of HTTP 503, with `source_mix.dynamic = 0`.

Keep existing error behavior for explicitly AI-only operations such as `expand_scene`.

- [ ] **Step 6: Run integration tests and verify GREEN**

Expected: all new server tests PASS.

- [ ] **Step 7: Commit**

`git add supabase/functions/raika-feed/index.ts <test-files> && git commit -m "feat: add Raika refresh and permanent blocking API"`

---

### Task 6: Extend browser client and state contracts

**Files:**
- Modify: `raika-feed-client.js`
- Modify: `raika-feed-state.js`
- Test: `tests/raika-idea-engine.test.js`

**Interfaces:**
- Add `refreshAll({count=24,filterType='all'})`.
- Add `blockForever(cardId)`.
- Add `generateNew({count=24,filterType='new'})` or route through `refreshAll` with novelty filter.
- State preserves `locked`/saved cards during refresh.

- [ ] **Step 1: Write failing client/state tests**

Assert the client sends:
- `action:'refresh_all'`, `count:24`, current recent signatures.
- `action:'block_forever'`, `seed_card_id`.
- filter `new` sets novelty target high (>= 0.8) or explicit `filter_type:'new'`.

State test asserts:
- 3 locked + 10 unlocked + 24 new -> locked remain, unlocked disappear, new appear without duplicate IDs.

- [ ] **Step 2: Run and verify RED**

Run:
`node --test tests/raika-idea-engine.test.js`

Expected: FAIL on missing client/state behavior.

- [ ] **Step 3: Implement client methods and state helper**

No new network library. Reuse `rfcCall`.

- [ ] **Step 4: Run and verify GREEN**

Run:
`node --test tests/raika-idea-engine.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

`git add raika-feed-client.js raika-feed-state.js tests/raika-idea-engine.test.js && git commit -m "feat: connect Raika idea engine client"`

---

### Task 7: Add Writers Room controls and permanent-block action

**Files:**
- Modify: `raika-writers-room.html`
- Modify: `raika-feed-ui.js`
- Modify: `raika-feed-actions-core.js` only if action metadata needs shared normalization.
- Modify: `tests/raika-feed.test.js`

**Interfaces:**
- Controls:
  - `#raika-feed-refresh-all`
  - `#raika-feed-surprise` remains
  - `[data-rf-filter]` values: `all,plotline,scene,dialogue,comedy,flashback,worldbuilding,secret,twist,new`
- Card action:
  - `data-rf-action="never"`
- UI calls `RaikaFeedClient.blockForever(card.id)` before removing card.

- [ ] **Step 1: Write failing UI contract tests**

In `tests/raika-feed.test.js`, assert Writers Room includes:
- button text `רענן הכל`
- filter/control for `רעיונות חדשים`
- permanent-block copy `אל תציע לי יותר`
- required scripts with bumped query version after modification.

Add source-level assertions that:
- `rfuRefreshAll` exists.
- it uses `refreshAll({count:24...})`.
- permanent block waits for server success before hiding locally.
- refresh uses locked-card-preserving state replacement.

- [ ] **Step 2: Run tests and verify RED**

Run:
`node --test tests/raika-feed.test.js`

Expected: FAIL because controls/action are missing.

- [ ] **Step 3: Implement controls and card action**

Update `rfuCardHtml` to add:
`<button ... data-rf-action="never">🗑️ אל תציע לי יותר</button>`

Add top toolbar controls in `raika-writers-room.html`.

`rfuRefreshAll`:
- set loading
- call server
- replace unlocked only
- clear prior transient error
- preserve locked
- render.

- [ ] **Step 4: Add filter behavior**

`new` asks server for dynamic/high-novelty ideas; other filters pass `filter_type`. Do not fake filter by hiding a mixed batch after fetch when a server-side filter is available.

- [ ] **Step 5: Run tests and verify GREEN**

Run:
`node --test tests/raika-feed.test.js tests/raika-idea-engine.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

`git add raika-writers-room.html raika-feed-ui.js raika-feed-actions-core.js tests/raika-feed.test.js && git commit -m "feat: add Raika refresh and never-show UI"`

---

### Task 8: Full regression, deployment safety, and live verification

**Files:**
- Modify only if failures reveal issues in files already in scope.

**Interfaces:**
- No new interfaces; this task verifies the complete feature.

- [ ] **Step 1: Run the focused Raika suite**

Run:
`node --test tests/raika*.test.js tests/raika-feed-core.test.mjs`

Expected: 0 failures.

- [ ] **Step 2: Run the full repository test suite**

Run:
`node --test tests/*.test.js`

Expected: 0 failures caused by this feature. If unrelated pre-existing failures remain, identify them by exact test name and do not report the suite as green.

- [ ] **Step 3: Syntax-check touched browser JS**

Run:
`node --check raika-idea-engine-core.js && node --check raika-feed-client.js && node --check raika-feed-ui.js && node --check raika-feed-state.js`

Expected: exit 0.

- [ ] **Step 4: Verify Supabase**

After schema/function deployment:
- query active idea count >= 1300.
- create a test block and verify it is excluded from refresh.
- verify RLS ownership with two-user test or policy test.
- run Supabase advisors.

- [ ] **Step 5: Browser smoke test**

On Writers Room:
1. initial batch loads.
2. `רענן הכל` replaces unlocked cards.
3. saved/developing cards remain.
4. `אל תציע לי יותר` removes card.
5. reload page and refresh: blocked card does not return.
6. `רעיונות חדשים` produces high-novelty/dynamic cards.
7. disable/mock AI: refresh still returns base ideas.

- [ ] **Step 6: Commit any final scoped fixes**

Commit only fixes required by verification.

- [ ] **Step 7: Deploy and verify GitHub Pages / Edge Function**

Confirm the deployed page references the updated versioned JS assets and the Edge Function version serving `refresh_all`/ `block_forever` is live before claiming completion.
