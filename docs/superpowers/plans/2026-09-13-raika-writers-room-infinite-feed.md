# Raika Writers Room Infinite Creative Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an infinite, interactive Writers Room feed that uses Raika canon, drafts, developing material and saved ideas as context, invents new story possibilities, learns from the user's reactions, and never turns AI output into canon automatically.

**Architecture:** The browser sends a compact snapshot of the current merged `window.RAIKA_DATA` to a new authenticated Supabase Edge Function. The function augments that snapshot with private workspace items, recent feed cards and feedback from Postgres, calls OpenAI server-side with a strict JSON schema, deduplicates and persists proposal cards, then returns them to a one-column infinite-scroll UI. Existing Writers Room save/version/canon flows remain authoritative; feed actions bridge into those flows rather than creating a second story database.

**Tech Stack:** Static GitHub Pages HTML/CSS/vanilla JavaScript, Supabase Auth/Postgres/RLS/Edge Functions, OpenAI Responses API with Structured Outputs (`json_schema`), Node.js 24 `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-13-raika-writers-room-infinite-feed-design.md`

## Global Constraints

- Every generated feed card is a proposal; no feed action may write canon directly.
- Feed context may use canon, developing material, drafts, saved ideas, characters, relationships, scenes, plotlines, history, worldbuilding and prior AI material.
- The feed is allowed to invent new characters, backstory, secrets, conflicts, locations, factions, relationships, plotlines and saga directions.
- Raika feeds stay one column.
- Initial AI batch target: 10 cards. Follow-up batch target: 8 cards. Client may request 1–12; server clamps to 1–12.
- The feed must preserve variety across close-to-current, natural-development and wild-card ideas.
- `עוד כזה` is the only flow allowed to intentionally generate a close variation of an existing feed card.
- Existing/similar canon or developing scenes must be rejected or strongly suppressed.
- Preference signals influence composition but must not eliminate exploration; reserve at least 20% of each AI batch for categories that are not currently preferred.
- AI credentials stay server-side. Browser code never receives `OPENAI_API_KEY` or Supabase service credentials.
- If OpenAI is unavailable or not configured, the Writers Room remains usable and the feed shows deterministic local fallback prompts plus a clear retry state.
- Existing `raika_item_edits`, `raika_item_versions`, saved-items page and explicit approve flow remain authoritative story workflows.
- No image generation, social/public feed, multi-author collaboration, automatic canon approval, custom-model training or vector database is part of this implementation.

---

## File Structure

**Create**
- `supabase/migrations/20260913_raika_feed.sql` — feed cards, feedback, indexes and RLS.
- `supabase/functions/_shared/raika-feed-core.mjs` — request validation, schema, signatures, deduplication, preference summary and prompt construction.
- `supabase/functions/raika-feed/index.ts` — authenticated batch generation, feedback, more-like-this and scene expansion API.
- `raika-feed-context.js` — compact browser context snapshot plus local fallback idea generation.
- `raika-feed-client.js` — authenticated browser API wrapper for `raika-feed`.
- `raika-feed-state.js` — pure feed state transitions and loading guards.
- `raika-feed-ui.js` — mounting, rendering, infinite scroll, surprise refresh and error/loading states.
- `raika-feed-actions-core.js` — pure conversion from feed cards/scene expansions to normal Writers Room items.
- `raika-feed-actions.js` — interactive card actions and bridges to workspace/AI.
- `raika-feed.css` — one-column feed/card/loading/error presentation.
- `tests/raika-feed-schema.test.js` — migration contract tests.
- `tests/raika-feed-core.test.js` — server/shared pure logic tests.
- `tests/raika-feed-context.test.js` — browser context/fallback tests.
- `tests/raika-feed-state.test.js` — state/infinite-scroll behavior tests.
- `tests/raika-feed-actions.test.js` — save/develop/scene conversion tests.
- `tests/raika-feed-integration.test.js` — Writers Room script/layout/action wiring tests.

**Modify**
- `raika-writers-room.html` — fixed `♾️ פיד יצירתי` mount section, stylesheet and script order.
- `raika-generator-ui.js` — mount directed generator immediately before the new feed section.
- `raika-ai.js` — support transient feed-card consultation without auto-saving the card.
- `.github/workflows/raika-test.yml` — include Supabase feed function/shared/migration paths in PR path triggers.

---

### Task 1: Persist feed cards and interaction feedback

**Files:**
- Create: `supabase/migrations/20260913_raika_feed.sql`
- Create: `tests/raika-feed-schema.test.js`

**Interfaces:**
- Produces table `public.raika_feed_cards` keyed by UUID with `user_id`, content, signature, creativity distance and promotion metadata.
- Produces table `public.raika_feed_feedback` keyed by UUID with `card_id`, `user_id`, interaction action and optional metadata.
- Later tasks rely on `raika_feed_cards.id`, `signature`, `hidden_at`, `promoted_item_id` and `raika_feed_feedback.action`.

- [ ] **Step 1: Write the failing migration contract test**

```js
// tests/raika-feed-schema.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const path = 'supabase/migrations/20260913_raika_feed.sql';

test('Raika feed migration defines private card and feedback storage', () => {
  assert.equal(fs.existsSync(path), true);
  const sql = fs.readFileSync(path, 'utf8');
  assert.match(sql, /create table if not exists public\.raika_feed_cards/i);
  assert.match(sql, /create table if not exists public\.raika_feed_feedback/i);
  assert.match(sql, /creativity_distance[\s\S]*close[\s\S]*natural[\s\S]*wild/i);
  assert.match(sql, /signature text not null/i);
  assert.match(sql, /promoted_item_id text/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)\s*=\s*user_id/i);
  assert.match(sql, /more_like/i);
  assert.match(sql, /converted_scene/i);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:
```bash
node --test tests/raika-feed-schema.test.js
```
Expected: FAIL because `supabase/migrations/20260913_raika_feed.sql` does not exist.

- [ ] **Step 3: Create the migration**

```sql
-- supabase/migrations/20260913_raika_feed.sql
create table if not exists public.raika_feed_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_type text not null,
  title text not null,
  body text not null,
  structured_payload jsonb not null default '{}'::jsonb,
  context_refs jsonb not null default '[]'::jsonb,
  creativity_distance text not null check (creativity_distance in ('close','natural','wild')),
  signature text not null,
  batch_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  hidden_at timestamptz,
  promoted_item_id text
);

create table if not exists public.raika_feed_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.raika_feed_cards(id) on delete cascade,
  action text not null check (action in (
    'shown','liked','saved','more_like','less_like','discussed',
    'developed','converted_scene','hidden'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists raika_feed_cards_user_created_idx
  on public.raika_feed_cards(user_id, created_at desc);
create index if not exists raika_feed_cards_user_signature_idx
  on public.raika_feed_cards(user_id, signature);
create index if not exists raika_feed_feedback_user_created_idx
  on public.raika_feed_feedback(user_id, created_at desc);
create index if not exists raika_feed_feedback_card_idx
  on public.raika_feed_feedback(card_id, created_at desc);

alter table public.raika_feed_cards enable row level security;
alter table public.raika_feed_feedback enable row level security;

drop policy if exists "raika feed cards own rows" on public.raika_feed_cards;
create policy "raika feed cards own rows"
  on public.raika_feed_cards
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "raika feed feedback own rows" on public.raika_feed_feedback;
create policy "raika feed feedback own rows"
  on public.raika_feed_feedback
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 4: Run the schema test and verify GREEN**

Run:
```bash
node --test tests/raika-feed-schema.test.js
```
Expected: PASS.

- [ ] **Step 5: Apply the migration to Supabase and inspect advisors**

Apply the exact SQL in `supabase/migrations/20260913_raika_feed.sql` to project `iwemlxvjyhffumzcqrxf` with migration name `raika_feed` using the Supabase migration tool. Then run Supabase security and performance advisors. Treat new warnings caused by these two tables as blockers; pre-existing unrelated warnings are not blockers for this task.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260913_raika_feed.sql tests/raika-feed-schema.test.js
git commit -m "feat: add Raika creative feed storage"
```

---

### Task 2: Build deterministic feed core logic and OpenAI schema

**Files:**
- Create: `supabase/functions/_shared/raika-feed-core.mjs`
- Create: `tests/raika-feed-core.test.js`

**Interfaces:**
- Produces `normalizeFeedRequest(input)` → `{action,count,seed_card_id,recent_signatures,base_context}`.
- Produces `normalizeGeneratedCard(raw)` → normalized card or `null`.
- Produces `cardSignature(card)` → stable lowercase signature string.
- Produces `similarity(a,b)` → `0..1` token similarity.
- Produces `dedupeCards(cards,recentCards,{allowSeedVariation})` → filtered cards.
- Produces `summarizeFeedback(rows)` → preference object.
- Produces `buildFeedSchema(count)` → strict JSON Schema object.
- Produces `buildFeedPrompt(args)` → Hebrew creative-writing prompt.

- [ ] **Step 1: Write failing pure-logic tests**

```js
// tests/raika-feed-core.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

async function core(){ return import('../supabase/functions/_shared/raika-feed-core.mjs'); }

test('request count is clamped and unknown actions are rejected', async () => {
  const c = await core();
  assert.equal(c.normalizeFeedRequest({action:'generate',count:99}).count, 12);
  assert.equal(c.normalizeFeedRequest({action:'generate',count:0}).count, 1);
  assert.throws(() => c.normalizeFeedRequest({action:'publish'}));
});

test('generated cards normalize to proposal-safe feed cards', async () => {
  const c = await core();
  const card = c.normalizeGeneratedCard({
    type:'scene', title:'  מבחן ', body:'רעיון', creativity_distance:'natural',
    characters:['raika'], tags:['משפחה']
  });
  assert.equal(card.title, 'מבחן');
  assert.equal(card.creativity_distance, 'natural');
  assert.deepEqual(card.characters, ['raika']);
  assert.equal(card.status, 'proposal');
});

test('dedupe rejects near-identical cards unless more-like-this is explicit', async () => {
  const c = await core();
  const old = {title:'ראיקה מבקשת עזרה מאוקנה',body:'ראיקה נאלצת לבקש עזרה מאוקנה',card_type:'relationship',characters:['raika','okane']};
  const newer = {title:'ראיקה מבקשת את עזרת אוקנה',body:'ראיקה נאלצת לבקש מאוקנה עזרה',card_type:'relationship',characters:['raika','okane']};
  assert.equal(c.dedupeCards([newer],[old],{allowSeedVariation:false}).length, 0);
  assert.equal(c.dedupeCards([newer],[old],{allowSeedVariation:true}).length, 1);
});

test('feedback weighting keeps exploration quota', async () => {
  const c = await core();
  const p = c.summarizeFeedback([
    {action:'more_like',metadata:{card_type:'family'}},
    {action:'developed',metadata:{card_type:'family'}},
    {action:'less_like',metadata:{card_type:'villain'}}
  ]);
  assert.ok(p.weights.family > 0);
  assert.ok(p.weights.villain < 0);
  assert.equal(p.exploration_ratio, 0.2);
});

test('feed schema requires an array of structured cards', async () => {
  const c = await core();
  const schema = c.buildFeedSchema(8);
  assert.equal(schema.type, 'object');
  assert.equal(schema.properties.cards.type, 'array');
  assert.equal(schema.properties.cards.maxItems, 8);
  assert.ok(schema.required.includes('cards'));
});
```

- [ ] **Step 2: Run RED**

Run:
```bash
node --test tests/raika-feed-core.test.js
```
Expected: FAIL because `raika-feed-core.mjs` does not exist.

- [ ] **Step 3: Implement normalization, signatures, similarity and feedback weights**

```js
// supabase/functions/_shared/raika-feed-core.mjs
const ACTIONS = new Set(['generate','feedback','more_like','expand_scene']);
const DISTANCES = new Set(['close','natural','wild']);
const FEEDBACK_WEIGHT = {
  more_like: 4,
  developed: 4,
  converted_scene: 4,
  saved: 2,
  liked: 2,
  discussed: 2,
  less_like: -4,
  hidden: -3,
  shown: 0,
};

const text = (v,max=6000) => String(v ?? '').trim().slice(0,max);
const arr = (v,max=24) => Array.isArray(v) ? v.slice(0,max).map(x => text(x,120)).filter(Boolean) : [];
const tokens = v => new Set(text(v,12000).toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/).filter(Boolean));

export function normalizeFeedRequest(input={}) {
  const action = text(input.action || 'generate',40);
  if (!ACTIONS.has(action)) throw new Error('Unsupported feed action');
  return {
    action,
    count: Math.max(1,Math.min(12,Number(input.count || 8))),
    seed_card_id: text(input.seed_card_id,80),
    recent_signatures: arr(input.recent_signatures,80),
    base_context: input.base_context && typeof input.base_context === 'object' ? input.base_context : {},
  };
}

export function normalizeGeneratedCard(raw={}) {
  const title = text(raw.title,220), body = text(raw.body,5000);
  if (!title || !body) return null;
  const creativity_distance = DISTANCES.has(raw.creativity_distance) ? raw.creativity_distance : 'natural';
  return {
    status:'proposal',
    card_type:text(raw.type || raw.card_type || 'idea',80) || 'idea',
    title,
    body,
    creativity_distance,
    characters:arr(raw.characters,16),
    entities:arr(raw.entities,16),
    suggested_placement:text(raw.suggested_placement,1200),
    why_it_may_work:text(raw.why_it_may_work,1600),
    context_refs:arr(raw.context_refs,30),
    tags:arr(raw.tags,20),
  };
}

export function cardSignature(card={}) {
  return [card.card_type,...(card.characters||[]),...(card.entities||[]),card.title,card.body]
    .join('|').toLowerCase().replace(/[^\p{L}\p{N}|]+/gu,' ').replace(/\s+/g,' ').trim().slice(0,1400);
}

export function similarity(a,b) {
  const A=tokens(`${a.title||''} ${a.body||''}`), B=tokens(`${b.title||''} ${b.body||''}`);
  if (!A.size || !B.size) return 0;
  let common=0; for (const t of A) if (B.has(t)) common++;
  return common / Math.max(1,Math.min(A.size,B.size));
}

export function dedupeCards(cards=[], recentCards=[], {allowSeedVariation=false}={}) {
  const accepted=[];
  for (const raw of cards) {
    const card=normalizeGeneratedCard(raw); if(!card) continue;
    card.signature=cardSignature(card);
    const pool=[...recentCards,...accepted];
    const duplicate=pool.some(old => old.signature===card.signature || similarity(old,card) >= (allowSeedVariation ? 0.9 : 0.72));
    if (!duplicate) accepted.push(card);
  }
  return accepted;
}

export function summarizeFeedback(rows=[]) {
  const weights={};
  for (const row of rows) {
    const type=text(row?.metadata?.card_type || 'general',80) || 'general';
    weights[type]=(weights[type]||0)+(FEEDBACK_WEIGHT[row.action]||0);
  }
  return {weights,exploration_ratio:0.2};
}
```

- [ ] **Step 4: Add strict response schema and prompt builder**

Append concrete `buildFeedSchema(count)` and `buildFeedPrompt(args)` implementations. `buildFeedSchema` must return an object with required `cards`, and each card must require `type`, `title`, `body`, `creativity_distance`, `characters`, `entities`, `suggested_placement`, `why_it_may_work`, `context_refs`, and `tags`; all object schemas set `additionalProperties:false`. `buildFeedPrompt` must explicitly say in Hebrew that the model may invent new material, must not rewrite canon as fact, must mix all three creativity distances, must avoid listed recent signatures/scenes, and must reserve at least 20% of ideas for exploration outside current preferences.

Use this exact card schema shape:

```js
export function buildFeedSchema(count=8){
  return {
    type:'object', additionalProperties:false, required:['cards'],
    properties:{
      cards:{
        type:'array', minItems:1, maxItems:Math.max(1,Math.min(12,count)),
        items:{
          type:'object', additionalProperties:false,
          required:['type','title','body','creativity_distance','characters','entities','suggested_placement','why_it_may_work','context_refs','tags'],
          properties:{
            type:{type:'string'}, title:{type:'string'}, body:{type:'string'},
            creativity_distance:{type:'string',enum:['close','natural','wild']},
            characters:{type:'array',items:{type:'string'}},
            entities:{type:'array',items:{type:'string'}},
            suggested_placement:{type:'string'}, why_it_may_work:{type:'string'},
            context_refs:{type:'array',items:{type:'string'}},
            tags:{type:'array',items:{type:'string'}},
          }
        }
      }
    }
  };
}
```

- [ ] **Step 5: Run core tests**

Run:
```bash
node --test tests/raika-feed-core.test.js
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/raika-feed-core.mjs tests/raika-feed-core.test.js
git commit -m "feat: add Raika feed generation core"
```

---

### Task 3: Add the authenticated `raika-feed` Edge Function

**Files:**
- Create: `supabase/functions/raika-feed/index.ts`
- Modify: `.github/workflows/raika-test.yml`
- Test: `tests/raika-feed-core.test.js`

**Interfaces:**
- POST `raika-feed` body `{action:'generate',count,base_context,recent_signatures}` → `{ok:true,cards:[...]}`.
- POST `{action:'more_like',seed_card_id,count,base_context,recent_signatures}` → related cards.
- POST `{action:'feedback',card_id,feedback_action,metadata,promoted_item_id?}` → `{ok:true}`.
- POST `{action:'expand_scene',seed_card_id,base_context}` → `{ok:true,proposal:{...}}`.
- All actions require the existing authorized Writers Room session.

- [ ] **Step 1: Extend the core test with server error-code contracts**

Add tests ensuring exported `mapOpenAIError(status)` maps `401 → openai_401`, `429 → openai_429`, and all other non-2xx statuses to `openai_<status>`.

```js
assert.equal(c.mapOpenAIError(401),'openai_401');
assert.equal(c.mapOpenAIError(429),'openai_429');
assert.equal(c.mapOpenAIError(500),'openai_500');
```

- [ ] **Step 2: Run RED, then add `mapOpenAIError` to the shared core**

Run:
```bash
node --test tests/raika-feed-core.test.js
```
Expected: FAIL until the export exists; then PASS after:

```js
export const mapOpenAIError = status => `openai_${Number(status)||500}`;
```

- [ ] **Step 3: Implement authentication and context loading**

Create `supabase/functions/raika-feed/index.ts` following the current `raika-consult` authorization pattern: read the user bearer token with an anon-scoped Supabase client, verify `auth.getUser()`, verify at least one readable `raika_authorized_users` row, and only then use the service-role client for private server work.

Load:

```ts
const [{data:workspace},{data:recentCards},{data:feedback}] = await Promise.all([
  admin.from('raika_item_edits')
    .select('item_type,item_id,status,payload,updated_at')
    .eq('user_id',user.id).order('updated_at',{ascending:false}).limit(80),
  admin.from('raika_feed_cards')
    .select('id,card_type,title,body,signature,creativity_distance,structured_payload,created_at,hidden_at,promoted_item_id')
    .eq('user_id',user.id).order('created_at',{ascending:false}).limit(80),
  admin.from('raika_feed_feedback')
    .select('action,metadata,created_at')
    .eq('user_id',user.id).order('created_at',{ascending:false}).limit(200),
]);
```

Build the prompt context from the request's sanitized `base_context`, `workspace`, `recentCards` and `summarizeFeedback(feedback||[])`. Do not send entire database rows or version history to OpenAI.

- [ ] **Step 4: Implement `generate` and `more_like` using Structured Outputs**

Use the current OpenAI Responses endpoint already used by `raika-consult`. Configure strict JSON Schema through `text.format`:

```ts
const openaiBody = {
  model:'gpt-5.6-sol',
  input:buildFeedPrompt({
    count:reqData.count,
    baseContext:reqData.base_context,
    workspace:workspace||[],
    recentCards:recentCards||[],
    preferences:summarizeFeedback(feedback||[]),
    seedCard,
  }),
  reasoning:{effort:'medium'},
  text:{format:{
    type:'json_schema',
    name:'raika_feed_batch',
    strict:true,
    schema:buildFeedSchema(reqData.count),
  }},
};
```

Call `https://api.openai.com/v1/responses` with `OPENAI_API_KEY`. If the key is absent, return HTTP 503 `{error:'AI is not configured yet',code:'ai_not_configured'}`. Preserve OpenAI status/detail errors the same way `raika-consult` does.

Parse `output_text`/output content, `JSON.parse` it, then call `dedupeCards`. For ordinary generation set `allowSeedVariation:false`; for `more_like` set it to `true` only relative to the selected seed while still rejecting duplicates among newly returned cards.

Insert accepted cards into `raika_feed_cards` and return the inserted rows. Store the normalized card's remaining fields in `structured_payload`, and `context_refs` as a JSON array.

- [ ] **Step 5: Implement feedback/hide/promotion metadata**

For `action:'feedback'` validate `feedback_action` against the migration's allowed actions, ensure the card belongs to the current user, insert one `raika_feed_feedback` row, and:

```ts
if (feedback_action === 'hidden') {
  await admin.from('raika_feed_cards')
    .update({hidden_at:new Date().toISOString()})
    .eq('id',card_id).eq('user_id',user.id);
}
if (promoted_item_id) {
  await admin.from('raika_feed_cards')
    .update({promoted_item_id:String(promoted_item_id).slice(0,180)})
    .eq('id',card_id).eq('user_id',user.id);
}
```

- [ ] **Step 6: Implement `expand_scene`**

Fetch the seed card by user/id and issue a second structured OpenAI request whose schema returns one object with required fields:
`title`, `opening`, `trigger`, `beats[]`, `dialogue`, `turning_point`, `ending`, `placement`, `why`, `opens`, `characters[]`, `tags[]`.

Return it as `{ok:true,proposal}`. Do not save it to `raika_item_edits` in the Edge Function; the browser action bridge does that in Task 6.

- [ ] **Step 7: Add CI path coverage**

Modify `.github/workflows/raika-test.yml` pull-request paths to include:

```yaml
      - 'supabase/functions/raika-feed/**'
      - 'supabase/functions/_shared/raika-feed-core.mjs'
      - 'supabase/migrations/20260913_raika_feed.sql'
```

The test command stays `node --test tests/raika-*.test.js`.

- [ ] **Step 8: Run all Raika tests**

Run:
```bash
node --test tests/raika-*.test.js
```
Expected: all PASS.

- [ ] **Step 9: Deploy the Edge Function**

Deploy `raika-feed` to Supabase project `iwemlxvjyhffumzcqrxf` with `verify_jwt=true`, including `index.ts` and relative shared dependency. Do not alter `raika-consult` in this task.

- [ ] **Step 10: Commit**

```bash
git add supabase/functions/raika-feed supabase/functions/_shared/raika-feed-core.mjs .github/workflows/raika-test.yml tests/raika-feed-core.test.js
git commit -m "feat: add Raika creative feed API"
```

---

### Task 4: Build compact browser context and a useful no-AI fallback

**Files:**
- Create: `raika-feed-context.js`
- Create: `tests/raika-feed-context.test.js`

**Interfaces:**
- Produces `RaikaFeedContext.build(data)` → compact context object sent to the Edge Function.
- Produces `RaikaFeedContext.fallback(data,{count,seen})` → local proposal cards used only when AI generation fails.

- [ ] **Step 1: Write failing context/fallback tests**

```js
// tests/raika-feed-context.test.js
const test=require('node:test');
const assert=require('node:assert/strict');
const ctx=require('../raika-feed-context.js');

const data={
  characters:[{id:'raika',title:'ראיקה',summary:'גיבורה'},{id:'tomo',title:'טומו',summary:'חבר'}],
  scenes:[{id:'s1',title:'אימון',summary:'ראיקה מתאמנת',status:'canon',characters:['raika']}],
  plotlines:[{id:'p1',title:'חברות',summary:'ראיקה וטומו'}],
  relationships:[{id:'r1',title:'ראיקה וטומו',characters:['raika','tomo']}],
  history:[], world:[], ideas:[{id:'i1',title:'רעיון',summary:'טיוטה',status:'idea',saved:true}]
};

test('context includes canon plus private creative material without dumping whole objects',()=>{
  const out=ctx.buildFeedBaseContext(data);
  assert.equal(out.characters[0].id,'raika');
  assert.equal(out.scenes[0].status,'canon');
  assert.equal(out.ideas[0].saved,true);
  assert.equal('image' in out.scenes[0],false);
});

test('fallback creates varied proposal cards from existing material',()=>{
  const cards=ctx.buildLocalFallbackCards(data,{count:4,seen:[]});
  assert.equal(cards.length,4);
  assert.ok(new Set(cards.map(c=>c.card_type)).size>=2);
  assert.ok(cards.every(c=>c.status==='proposal' && c.fallback===true));
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/raika-feed-context.test.js
```
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement compact context selection**

Use explicit whitelisting rather than `JSON.stringify(window.RAIKA_DATA)`:

```js
function pick(x={}){return {
  id:String(x.id||''), title:String(x.title||''), summary:String(x.summary||''),
  status:String(x.status||''), saved:Boolean(x.saved),
  characters:Array.isArray(x.characters)?x.characters.slice(0,12):[],
  tags:Array.isArray(x.tags)?x.tags.slice(0,12):[],
  placement:String(x.placement||''), why:String(x.why||''), opens:String(x.opens||'')
};}
function buildFeedBaseContext(data={}){
  return {
    characters:(data.characters||[]).slice(0,40).map(pick),
    scenes:(data.scenes||[]).slice(0,50).map(pick),
    plotlines:(data.plotlines||[]).slice(0,20).map(pick),
    relationships:(data.relationships||[]).slice(0,24).map(pick),
    history:(data.history||[]).slice(0,20).map(pick),
    world:(data.world||[]).slice(0,20).map(pick),
    ideas:(data.ideas||[]).filter(x=>x.status==='idea'||x.status==='developing'||x.status==='parked'||x.saved).slice(0,30).map(pick),
  };
}
```

- [ ] **Step 4: Implement deterministic fallback templates**

Create at least 12 templates spanning relationship, consequence, secret, comedy, missing beat, underused character, worldbuilding, legacy, antagonist, school, training and wild-card questions. Rotate through available characters/scenes using a deterministic hash of seen signatures so repeated retry calls produce a different ordering without random hidden state.

Each fallback card must be shaped like:

```js
{
  id:`fallback-${signature}`,
  status:'proposal', fallback:true,
  card_type:'relationship',
  title:'חיבור שלא בדקנו',
  body:'מה יקרה אם ראיקה תצטרך לבקש מטומו עזרה דווקא בנושא שהיא תמיד מסתירה?',
  creativity_distance:'natural',
  characters:['raika','tomo'],
  entities:[], suggested_placement:'', why_it_may_work:'מבוסס על שתי דמויות פעילות בעולם.',
  context_refs:['character:raika','character:tomo'], tags:['חברות']
}
```

Filter any generated fallback signature already present in `seen`.

- [ ] **Step 5: Run tests**

```bash
node --test tests/raika-feed-context.test.js
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add raika-feed-context.js tests/raika-feed-context.test.js
git commit -m "feat: add Raika feed context and fallback ideas"
```

---

### Task 5: Add feed client, state model and infinite-scroll UI

**Files:**
- Create: `raika-feed-client.js`
- Create: `raika-feed-state.js`
- Create: `raika-feed-ui.js`
- Create: `tests/raika-feed-state.test.js`

**Interfaces:**
- `RaikaFeedClient.generate({count,recentSignatures})`
- `RaikaFeedClient.moreLike(cardId,{count,recentSignatures})`
- `RaikaFeedClient.feedback(cardId,action,metadata,promotedItemId?)`
- `RaikaFeedClient.expandScene(cardId)`
- `RaikaFeedState.create()`, `append()`, `insertAfter()`, `replaceUnlocked()`, `lock()`, `hide()`.
- `RaikaFeedUI.getCard(id)` and `RaikaFeedUI.markLocked(id)` are used by Task 6 actions.

- [ ] **Step 1: Write failing state tests**

```js
// tests/raika-feed-state.test.js
const test=require('node:test');
const assert=require('node:assert/strict');
const s=require('../raika-feed-state.js');

test('append dedupes ids and loading guard blocks duplicate requests',()=>{
  let st=s.createFeedState();
  st=s.appendCards(st,[{id:'a'},{id:'a'},{id:'b'}]);
  assert.deepEqual(st.cards.map(x=>x.id),['a','b']);
  st=s.setLoading(st,true);
  assert.equal(s.canLoadMore(st),false);
});

test('more-like inserts after seed without deleting seed',()=>{
  let st=s.appendCards(s.createFeedState(),[{id:'a'},{id:'b'}]);
  st=s.insertCardsAfter(st,'a',[{id:'x'},{id:'y'}]);
  assert.deepEqual(st.cards.map(x=>x.id),['a','x','y','b']);
});

test('surprise refresh preserves locked saved/developed cards',()=>{
  let st=s.appendCards(s.createFeedState(),[{id:'a'},{id:'b'}]);
  st=s.lockCard(st,'a');
  st=s.replaceUnlockedCards(st,[{id:'c'}]);
  assert.deepEqual(st.cards.map(x=>x.id),['a','c']);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/raika-feed-state.test.js
```
Expected: FAIL because `raika-feed-state.js` does not exist.

- [ ] **Step 3: Implement pure state transitions**

Use immutable returns:

```js
function createFeedState(){return {cards:[],locked:new Set(),hidden:new Set(),loading:false,error:'',exhausted:false};}
function appendCards(state,cards=[]){const seen=new Set(state.cards.map(c=>String(c.id)));return {...state,cards:[...state.cards,...cards.filter(c=>c?.id&&!seen.has(String(c.id))&&seen.add(String(c.id)))]};}
function setLoading(state,loading){return {...state,loading:Boolean(loading)};}
function canLoadMore(state){return !state.loading && !state.exhausted;}
function lockCard(state,id){const locked=new Set(state.locked);locked.add(String(id));return {...state,locked};}
function hideCard(state,id){const hidden=new Set(state.hidden);hidden.add(String(id));return {...state,hidden};}
```

Implement `insertCardsAfter` and `replaceUnlockedCards` to satisfy tests. Export for both browser and Node.

- [ ] **Step 4: Implement authenticated feed client**

`raika-feed-client.js` must reuse `RaikaPrivate.client.auth.getSession()`, send the publishable key plus user bearer token, and include `RaikaFeedContext.buildFeedBaseContext(window.RAIKA_DATA||{})` in generation/scene-expansion requests.

Error objects must preserve `{code,status,detail}` exactly as `raika-ai-client-v2.js` does so UI can distinguish `ai_not_configured`, `openai_401` and `openai_429`.

- [ ] **Step 5: Implement one-column feed UI and infinite loading**

`raika-feed-ui.js` mounts into the static `#raika-feed` section. It waits for authorized private readiness before AI generation:

```js
function init(){
  render();
  document.addEventListener('raika:private-ready',()=>loadInitial());
  if(window.RaikaPrivate?.authorized) loadInitial();
  observer=new IntersectionObserver(entries=>{
    if(entries.some(x=>x.isIntersecting)) loadMore();
  },{rootMargin:'600px 0px'});
  observer.observe(document.getElementById('raika-feed-sentinel'));
}
```

`loadMore()` must check `RaikaFeedState.canLoadMore(state)` before the request. On success append cards. On failure call `RaikaFeedContext.buildLocalFallbackCards(...)`, append fallback cards, and render a persistent inline message with a `נסה שוב AI` button. Existing cards remain visible.

Render each card with buttons carrying data attributes:

```html
<button data-rf-action="like">❤️ אהבתי</button>
<button data-rf-action="save">💾 שמור</button>
<button data-rf-action="more">🔄 עוד כזה</button>
<button data-rf-action="discuss">💬 בוא נדבר על זה</button>
<button data-rf-action="develop">✍️ פתח לפיתוח</button>
<button data-rf-action="scene">🎬 הפוך להצעת סצנה</button>
<button data-rf-action="less">🚫 פחות כאלה</button>
<button data-rf-action="hide">🗑️ הסתר</button>
```

`✨ תפתיע אותי` calls `replaceUnlockedCards` with a fresh AI batch; on AI failure it uses a fresh local fallback batch.

- [ ] **Step 6: Run state tests and all Raika tests**

```bash
node --test tests/raika-feed-state.test.js
node --test tests/raika-*.test.js
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add raika-feed-client.js raika-feed-state.js raika-feed-ui.js tests/raika-feed-state.test.js
git commit -m "feat: add Raika infinite feed client and state"
```

---

### Task 6: Bridge feed actions into save, development, scene and consultation flows

**Files:**
- Create: `raika-feed-actions-core.js`
- Create: `raika-feed-actions.js`
- Modify: `raika-ai.js`
- Create: `tests/raika-feed-actions.test.js`

**Interfaces:**
- `feedCardToWorkspaceItem(card,status='idea')` → standard workspace item.
- `sceneProposalToWorkspaceItem(card,proposal,uniqueSuffix)` → saved scene-proposal idea.
- `RaikaAI.openTransientFeed(card)` opens consultation without auto-saving the feed card.

- [ ] **Step 1: Write failing conversion tests**

```js
// tests/raika-feed-actions.test.js
const test=require('node:test');
const assert=require('node:assert/strict');
const a=require('../raika-feed-actions-core.js');

test('save maps a feed card to a normal saved idea',()=>{
  const item=a.feedCardToWorkspaceItem({id:'abc',title:'רעיון',body:'תוכן',card_type:'relationship',characters:['raika']},'idea');
  assert.equal(item.id,'feed-abc');
  assert.equal(item.type,'idea');
  assert.equal(item.status,'idea');
  assert.equal(item.saved,true);
  assert.ok(item.tags.includes('פיד יצירתי'));
});

test('develop maps to developing but remains saved/recoverable',()=>{
  const item=a.feedCardToWorkspaceItem({id:'abc',title:'רעיון',body:'תוכן'},'developing');
  assert.equal(item.status,'developing');
  assert.equal(item.saved,true);
});

test('expanded scene becomes a saved proposal, not canon',()=>{
  const item=a.sceneProposalToWorkspaceItem({id:'abc'},{title:'סצנה',opening:'פתיחה',beats:['א','ב'],dialogue:'שיחה',turning_point:'מפנה',ending:'סיום',placement:'אמצע',why:'מתאים',opens:'המשך',characters:['raika'],tags:['רגש']},'123');
  assert.equal(item.id,'feed-scene-abc-123');
  assert.equal(item.type,'idea');
  assert.equal(item.status,'idea');
  assert.equal(item.saved,true);
  assert.match(item.summary,/פתיחה/);
});
```

- [ ] **Step 2: Run RED, implement pure converters, then GREEN**

```bash
node --test tests/raika-feed-actions.test.js
```

Implement converters with these rules:
- Save/develop IDs use `feed-${card.id}` so repeated save updates the same workspace item.
- Scene expansion IDs use `feed-scene-${card.id}-${uniqueSuffix}` so multiple explicit expansions can coexist.
- Feed save/develop always sets `saved:true`.
- Never set `status:'canon'` in this module.
- Add tags `פיד יצירתי` and the card type; scene expansion also adds `הצעת סצנה`.

Run again and expect PASS.

- [ ] **Step 3: Add transient consultation support to `raika-ai.js`**

Extend AI state with `contextOverride:null`. Add:

```js
function raiOpenTransientFeed(card){
  RaikaAI.contextOverride={
    type:'feed', id:String(card.id),
    context:{
      rule:'כרטיס מהפיד הוא הצעה בלבד ואינו קאנון.',
      item:{id:card.id,title:card.title,summary:card.body,characters:card.characters||[],tags:card.tags||[]},
      feed_card:card,
    }
  };
  return raiOpen('feed',String(card.id));
}
```

Modify `raiContext(type,id)` and `raiOpen(type,id)` so they use the override item/context when `type==='feed'` and IDs match; otherwise retain existing behavior. Clear the override when the consultation modal closes or another normal item opens. Export as `window.RaikaAI.openTransientFeed`.

This action creates/uses an AI thread but does not create a workspace item.

- [ ] **Step 4: Implement interactive action delegation**

In `raika-feed-actions.js`, listen for `[data-rf-action]` clicks and get the card with `RaikaFeedUI.getCard(cardId)`.

Exact behavior:
- `like` → `feedback(id,'liked',{card_type})`; keep visible.
- `save` → `RaikaWorkspaceClient.save(feedCardToWorkspaceItem(card,'idea'))`; `feedback(...,'saved',...,workspaceItem.id)`; `RaikaFeedUI.markLocked(id)`.
- `more` → `RaikaFeedClient.moreLike(id,{count:3,...})`; insert returned cards immediately after seed; feedback `more_like`.
- `discuss` → `RaikaAI.openTransientFeed(card)`; feedback `discussed`.
- `develop` → save `feedCardToWorkspaceItem(card,'developing')`; feedback `developed` with promoted item id; lock card.
- `scene` → `RaikaFeedClient.expandScene(id)`; save `sceneProposalToWorkspaceItem(card,proposal,String(Date.now()))`; feedback `converted_scene`; lock card.
- `less` → feedback `less_like`; visually mark button selected but leave card readable.
- `hide` → feedback `hidden`; call state/UI hide so card disappears.

Every failing save/expand/feedback operation must show a card-local error and leave the original card on screen.

- [ ] **Step 5: Add a static wiring test for transient consultation**

Append to `tests/raika-feed-actions.test.js`:

```js
const fs=require('node:fs');
test('AI module exposes transient feed consultation',()=>{
  const src=fs.readFileSync('raika-ai.js','utf8');
  assert.match(src,/openTransientFeed/);
  assert.match(src,/type:'feed'/);
});
```

- [ ] **Step 6: Run tests**

```bash
node --test tests/raika-feed-actions.test.js
node --test tests/raika-*.test.js
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add raika-feed-actions-core.js raika-feed-actions.js raika-ai.js tests/raika-feed-actions.test.js
git commit -m "feat: connect Raika feed actions to writers room"
```

---

### Task 7: Integrate the feed into the Writers Room layout

**Files:**
- Create: `raika-feed.css`
- Modify: `raika-writers-room.html`
- Modify: `raika-generator-ui.js`
- Create: `tests/raika-feed-integration.test.js`

**Interfaces:**
- Static mount ids: `raika-feed`, `raika-feed-list`, `raika-feed-error`, `raika-feed-sentinel`, `raika-feed-surprise`.
- Directed generator remains immediately above the creative feed.
- Existing manual proposal grid remains below the creative feed.

- [ ] **Step 1: Write failing integration tests**

```js
// tests/raika-feed-integration.test.js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('writers room includes creative feed between generator target and manual ideas',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/id="raika-feed"/);
  assert.match(html,/id="raika-feed-list"/);
  assert.match(html,/id="raika-feed-surprise"/);
  assert.match(html,/raika-feed\.css/);
  assert.match(html,/raika-feed-context\.js[^]*raika-feed-client\.js[^]*raika-feed-state\.js[^]*raika-feed-ui\.js[^]*raika-feed-actions\.js/);
});

test('generator explicitly mounts before creative feed',()=>{
  const src=fs.readFileSync('raika-generator-ui.js','utf8');
  assert.match(src,/raika-feed/);
  assert.match(src,/insertBefore/);
});

test('feed CSS is one column',()=>{
  const css=fs.readFileSync('raika-feed.css','utf8');
  assert.match(css,/\.raika-feed-list\s*\{[^}]*grid-template-columns\s*:\s*1fr/s);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/raika-feed-integration.test.js
```
Expected: FAIL because feed markup/CSS are not wired yet.

- [ ] **Step 3: Add static feed section to `raika-writers-room.html`**

Inside `#writers-room`, place this block before `.writers-room-intro`:

```html
<section id="raika-feed" class="raika-feed card" aria-labelledby="raika-feed-title">
  <div class="section-head">
    <div>
      <h3 id="raika-feed-title">♾️ פיד יצירתי</h3>
      <p class="meta">רעיונות חדשים מתוך עולם ראיקה — וגם כיוונים שלא כתבנו עדיין.</p>
    </div>
    <button id="raika-feed-surprise" class="btn small" type="button">✨ תפתיע אותי</button>
  </div>
  <div id="raika-feed-error" class="canon-note hidden"></div>
  <div id="raika-feed-list" class="raika-feed-list"></div>
  <div id="raika-feed-loading" class="meta hidden">יוצר רעיונות חדשים…</div>
  <div id="raika-feed-sentinel" aria-hidden="true"></div>
</section>
```

Add `<link rel="stylesheet" href="raika-feed.css?v=1">` in `<head>`.

Load feed scripts after existing workspace/AI/generator dependencies in this order:

```html
<script src="raika-feed-context.js?v=1"></script>
<script src="raika-feed-client.js?v=1"></script>
<script src="raika-feed-state.js?v=1"></script>
<script src="raika-feed-actions-core.js?v=1"></script>
<script src="raika-feed-ui.js?v=1"></script>
<script src="raika-feed-actions.js?v=1"></script>
```

- [ ] **Step 4: Keep generator above the feed**

Change `rgMount()` in `raika-generator-ui.js` from inserting only before `.writers-room-intro` to:

```js
const anchor=host.querySelector('#raika-feed')||host.querySelector('.writers-room-intro');
host.insertBefore(box,anchor);
```

- [ ] **Step 5: Create feed CSS**

At minimum:

```css
.raika-feed{margin-top:18px;overflow:visible}
.raika-feed-list{display:grid;grid-template-columns:1fr;gap:14px}
.raika-feed-card{border:1px solid var(--line,#e8dfcf);border-radius:18px;padding:16px;background:var(--card,#fffdf8)}
.raika-feed-card h4{margin:6px 0 8px}
.raika-feed-card .card-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.raika-feed-type{font-size:.82rem;font-weight:800;opacity:.72}
.raika-feed-card[data-distance="wild"]{outline:1px dashed rgba(120,80,160,.28)}
.raika-feed-skeleton{min-height:150px;border-radius:18px;background:linear-gradient(90deg,rgba(0,0,0,.035),rgba(0,0,0,.07),rgba(0,0,0,.035));background-size:220% 100%;animation:raika-feed-pulse 1.5s infinite}
@keyframes raika-feed-pulse{to{background-position:-220% 0}}
#raika-feed-sentinel{height:2px}
```

Do not create a two-column desktop breakpoint.

- [ ] **Step 6: Run integration and full test suite**

```bash
node --test tests/raika-feed-integration.test.js
node --test tests/raika-*.test.js
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add raika-writers-room.html raika-generator-ui.js raika-feed.css tests/raika-feed-integration.test.js
git commit -m "feat: add infinite creative feed to Raika room"
```

---

### Task 8: End-to-end verification, deployment and live-site check

**Files:**
- No new feature files expected.
- Update cache-busting query values in `raika-writers-room.html` only if final changed assets still point at older versions.

**Interfaces:**
- Verifies the complete user flow from authenticated room → feed → feedback/save/develop/discuss/scene → infinite load.

- [ ] **Step 1: Run the complete local/static test suite from a clean checkout**

Run:
```bash
node --test tests/raika-*.test.js
```
Expected: zero failures.

- [ ] **Step 2: Verify database shape and RLS**

Using Supabase, confirm:
- `raika_feed_cards` exists with RLS enabled.
- `raika_feed_feedback` exists with RLS enabled.
- both owner-row policies exist.
- indexes on user/time and signature exist.

Run security/performance advisors and inspect new feed-related findings.

- [ ] **Step 3: Verify Edge Function deployment**

Confirm `raika-feed` is ACTIVE with `verify_jwt=true`. Make one authenticated `generate` request through the site. Accept either:
- AI cards returned successfully, or
- a clear `ai_not_configured` / OpenAI error followed by local fallback cards in the UI.

A silent blank feed is a failure.

- [ ] **Step 4: Manual interaction smoke test in the live Writers Room**

Verify in order:
1. Open Writers Room after login → first feed batch appears.
2. Scroll near bottom → exactly one additional request/batch loads while loading guard is active.
3. `✨ תפתיע אותי` changes unsaved cards but keeps cards already saved/developed in the current view.
4. `❤️ אהבתי` records without saving a story item.
5. `💾 שמור` creates a saved Raika item visible on `📌 שמורים`.
6. `🔄 עוד כזה` inserts variations directly beneath the seed card.
7. `💬 בוא נדבר על זה` opens AI consultation without first creating a workspace item.
8. `✍️ פתח לפיתוח` creates a `developing` saved workspace item; it does not become canon and does not reappear in the Writers Room proposal list.
9. `🎬 הפוך להצעת סצנה` creates a saved scene proposal with `status:'idea'`, not canon.
10. `🚫 פחות כאלה` and `🗑️ הסתר` record feedback; hide removes only the feed card.
11. Existing directed generator and manual proposal cards still work.

- [ ] **Step 5: Verify preference/dedup behavior in a second batch**

After several likes/more-like/less-like actions, load another batch and confirm:
- preferred families are more frequent but do not occupy the entire batch;
- at least one exploratory/unpreferred family still appears in a normal 8–10 card AI batch when the model follows the prompt;
- exact or near-identical recent ideas are filtered;
- `עוד כזה` remains allowed to generate deliberate close variations.

- [ ] **Step 6: Verify GitHub Actions and Pages deployment**

Push the feature branch, wait for `Raika tests` success on the final commit, compare the branch against current `main`, merge only when the diff is Raika/feed-specific, then verify the GitHub Pages deployment for the merged SHA reaches `success`.

- [ ] **Step 7: Final completion check**

Do not claim completion until all of the following are evidenced:
- final `node --test tests/raika-*.test.js` passes;
- Supabase migration is applied;
- `raika-feed` is active with JWT verification;
- final GitHub Actions Raika workflow passes;
- Pages deployment succeeds;
- live Writers Room visibly renders either AI-generated cards or the explicit fallback/error path;
- no feed action can make content canon without the existing explicit approval flow.

- [ ] **Step 8: Commit any final cache/version-only adjustment**

If required:
```bash
git add raika-writers-room.html
git commit -m "chore: refresh Raika feed assets"
```

If no cache/version change is required, do not create an empty commit.
