# Raika Writers Room AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two canon-aware AI idea generators and per-card AI consultation to the private Raika writers room, with every generated result remaining an `idea` until explicitly approved.

**Architecture:** The browser sends only structured generator inputs plus bounded Raika context to an authenticated Supabase Edge Function. The function verifies the authorized user, calls the OpenAI Responses API server-side, validates structured JSON, stores consultation messages in the existing Raika AI tables, and returns a proposal. Saving a proposal reuses the `raika-workspace` API from the persistence plan.

**Tech Stack:** GitHub Pages, vanilla JS, Supabase Edge Functions/Deno, existing `raika_ai_threads` / `raika_ai_messages`, OpenAI Responses API, default model `gpt-5.6-terra`, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-raika-writers-room-cloud-sync-design.md`

## Global Constraints

- Depends on `2026-09-12-raika-writers-room-persistence-plan.md` being complete.
- Every AI result starts as `idea`, never `canon`.
- AI responses never modify saved content automatically.
- Retry creates a new variation and never overwrites a previously saved variation.
- The OpenAI API key must exist only as a Supabase Edge Function secret.
- Context must be bounded to relevant canon rather than sending the entire Raika database blindly.
- Manual editing and saving must continue working when OpenAI is unavailable.

---

### Task 1: Define generator modes, context builder and output validator

**Files:**
- Create: `raika-ai.js`
- Create: `tests/raika-ai.test.js`
- Create: `supabase/functions/_shared/raika-ai-core.mjs`
- Create: `tests/raika-ai-core.test.mjs`

**Interfaces:**
- Browser produces `buildGeneratorRequest(mode, values, data)`.
- Edge core produces `buildCanonContext(mode, input, data)`, `validateGeneratedIdea(mode, value)` and `ideaSchema(mode)`.

- [ ] **Step 1: Write failing browser request tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const {buildGeneratorRequest}=require('../raika-ai.js');

test('two-character generator sends both character ids',()=>{
  const body=buildGeneratorRequest('interaction',{characterA:'raika',characterB:'okane',note:'מתח חברתי'},{});
  assert.equal(body.action,'generate');
  assert.equal(body.mode,'interaction');
  assert.deepEqual(body.input,{characterA:'raika',characterB:'okane',note:'מתח חברתי'});
});

test('emotion scene generator sends character and emotion',()=>{
  const body=buildGeneratorRequest('emotion_scene',{character:'raika',emotion:'קנאה',context:''},{});
  assert.equal(body.mode,'emotion_scene');
  assert.equal(body.input.emotion,'קנאה');
});
```

- [ ] **Step 2: Write failing Edge core tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGeneratedIdea} from '../supabase/functions/_shared/raika-ai-core.mjs';

test('generated interaction is forced to idea status',()=>{
  const out=validateGeneratedIdea('interaction',{title:'רגע',summary:'מפגש',dialogue:['א','ב'],status:'canon'});
  assert.equal(out.status,'idea');
});

test('invalid generated idea is rejected',()=>{
  assert.throws(()=>validateGeneratedIdea('emotion_scene',{title:''}));
});
```

- [ ] **Step 3: Run and verify RED**

Run: `node --test tests/raika-ai.test.js tests/raika-ai-core.test.mjs`

Expected: FAIL because files/functions do not exist.

- [ ] **Step 4: Implement browser request builder**

```js
function buildGeneratorRequest(mode,values){
  if(mode==='interaction') return {action:'generate',mode,input:{characterA:values.characterA||'',characterB:values.characterB||'',note:values.note||''}};
  if(mode==='emotion_scene') return {action:'generate',mode,input:{character:values.character||'',emotion:values.emotion||'',context:values.context||'',location:values.location||'',secondCharacter:values.secondCharacter||''}};
  throw new Error('Unknown generator mode');
}
if(typeof module!=='undefined') module.exports={buildGeneratorRequest};
```

- [ ] **Step 5: Implement strict output normalization**

`validateGeneratedIdea()` must require non-empty `title` and `summary`, bound all strings, normalize arrays, and return `status:'idea'` regardless of model output. Interaction fields: `interactionType`, `wantsA`, `wantsB`, `dialogue`, `changeAfter`, `placement`, `why`, `conflicts`, `tags`. Emotion-scene fields: `opening`, `trigger`, `beats`, `externalVsInternal`, `dialogue`, `turningPoint`, `residue`, `placement`, `why`, `opens`, `conflicts`, `tags`.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/raika-ai.test.js tests/raika-ai-core.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add raika-ai.js tests/raika-ai.test.js supabase/functions/_shared/raika-ai-core.mjs tests/raika-ai-core.test.mjs
git commit -m "test: define Raika AI generator contracts"
```

---

### Task 2: Build authenticated `raika-consult` Edge Function

**Files:**
- Create: `supabase/functions/raika-consult/index.ts`
- Modify: `supabase/functions/_shared/raika-ai-core.mjs`
- Test: `tests/raika-ai-core.test.mjs`

**Interfaces:**
- Request actions: `generate`, `consult`, `thread_messages`.
- `generate` returns `{ok:true,idea:{...status:'idea'},thread_id}`.
- `consult` returns `{ok:true,message:string,thread_id}`.

- [ ] **Step 1: Add failing context-bounding test**

```js
test('canon context includes requested characters but stays bounded',()=>{
  const data={characters:Array.from({length:50},(_,i)=>({id:`c${i}`,title:`C${i}`,summary:'x'})),scenes:[]};
  const ctx=buildCanonContext('interaction',{characterA:'c1',characterB:'c2'},data);
  assert.match(ctx,/C1/);
  assert.match(ctx,/C2/);
  assert.ok(ctx.length < 12000);
});
```

- [ ] **Step 2: Run and verify RED, then implement bounded context**

The context must include: fixed canon rules, requested character records, related plotline/relationship records by character IDs/tags, and at most four relevant scenes. Never include private secrets or unrelated workspace data.

- [ ] **Step 3: Implement server authorization exactly like `raika-workspace`**

Keep `verify_jwt=true`. Validate the user JWT, hash the authenticated email, require a row in `raika_authorized_users`, then create the admin client. Reject unauthenticated or unauthorized calls before any OpenAI call.

- [ ] **Step 4: Implement OpenAI Responses API call**

Use server-side `fetch('https://api.openai.com/v1/responses', ...)` with:

```ts
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: Deno.env.get('RAIKA_AI_MODEL') || 'gpt-5.6-terra',
    reasoning: { effort: 'medium' },
    instructions,
    input: userPrompt,
    text: { format: ideaSchema(mode) }
  })
});
```

Parse the returned text as JSON and pass it through `validateGeneratedIdea()` before returning or saving anything.

- [ ] **Step 5: Save AI thread/message history**

For `consult`, create/reuse a `raika_ai_threads` row keyed to `item_type/item_id`, insert the user message and assistant message into `raika_ai_messages`, and save a bounded `context_snapshot`. `generate` may create a generator thread with `item_type:'generator'` and `item_id` equal to a generated request UUID for traceability.

- [ ] **Step 6: Verify missing-secret behavior**

If `OPENAI_API_KEY` is missing, return HTTP 503 with `{error:'AI_NOT_CONFIGURED'}`. Do not affect workspace saving.

- [ ] **Step 7: Configure secret checkpoint**

Before production deploy, confirm `OPENAI_API_KEY` exists in Supabase Edge Function secrets. If the available tool cannot set secrets, perform the one-time Dashboard/CLI secret setup; never paste the secret into GitHub or frontend code.

- [ ] **Step 8: Deploy and smoke-test**

Unauthenticated `generate` → 401. Authorized malformed payload → 400. Authorized valid interaction → 200 with `idea.status === 'idea'`.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/raika-consult/index.ts supabase/functions/_shared/raika-ai-core.mjs tests/raika-ai-core.test.mjs
git commit -m "feat: add canon-aware Raika AI endpoint"
```

---

### Task 3: Add the two-mode generator UI

**Files:**
- Modify: `raika.html`
- Modify: `raika-ai.js`
- Modify: `styles.css`
- Test: `tests/raika-ai.test.js`

**Interfaces:**
- UI IDs: `raika-idea-mode`, `raika-character-a`, `raika-character-b`, `raika-character`, `raika-emotion`, `raika-generate`, `raika-ai-result`.
- Character options are populated from `window.RAIKA_DATA.characters` rather than hard-coded.

- [ ] **Step 1: Write failing markup tests**

```js
test('writers room exposes both AI generator modes',()=>{
  const html=require('node:fs').readFileSync('raika.html','utf8');
  assert.match(html,/id=["']raika-idea-mode["']/);
  assert.match(html,/value=["']interaction["']/);
  assert.match(html,/value=["']emotion_scene["']/);
  assert.match(html,/id=["']raika-ai-result["']/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/raika-ai.test.js`

- [ ] **Step 3: Add generator card**

Add a card at the top of `#writers-room` titled `✨ צור איתי רעיון`. Mode A displays two character selects and an optional note. Mode B displays character, emotion, optional context/location/second-character fields. Generator controls are available only in authenticated private mode; public users see the explanatory card but not active generate controls.

- [ ] **Step 4: Populate character selects from canon**

```js
function characterOptions(data){
  return (data.characters||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
}
```

- [ ] **Step 5: Render result as an unsaved idea card**

The result card visibly shows `💡 הצעה` and actions `💾 שמור כטיוטה`, `✏️ ערוך`, `🔄 נסה שוב`, `✅ אשר`, `🗑️ מחק`. `✅ אשר` must first persist the draft through `raika-workspace`, then use the normal explicit approval flow; it must never directly mark raw model output canon.

- [ ] **Step 6: Run tests**

Run: `node --test tests/raika-ai.test.js tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add raika.html raika-ai.js styles.css tests/raika-ai.test.js
git commit -m "feat: add Raika AI idea generator UI"
```

---

### Task 4: Save, edit and retry generated ideas without overwriting prior work

**Files:**
- Modify: `raika-ai.js`
- Modify: `raika-private.js`
- Test: `tests/raika-ai.test.js`

**Interfaces:**
- `saveGeneratedIdea(idea)` creates a stable client ID `ai-<crypto.randomUUID()>` then calls `raika-workspace` `save` with status `idea`.
- `retryGeneration(request, savedIdeaId)` returns a new unsaved variation and never reuses `savedIdeaId`.

- [ ] **Step 1: Write failing retry test**

```js
test('retry creates a new variation id instead of overwriting saved result',()=>{
  const first={id:'ai-old',status:'idea'};
  const next=prepareRetryResult(first,{title:'חדש',summary:'וריאציה'});
  assert.notEqual(next.id,first.id);
  assert.equal(next.status,'idea');
});
```

- [ ] **Step 2: Run and verify RED**

- [ ] **Step 3: Implement save/retry behavior**

Saved result IDs are stable. Retry output gets a fresh ID only when the user saves that variation. Do not mutate the already-saved card. Reuse workspace Save/Edit/Delete/Approve actions from the persistence phase.

- [ ] **Step 4: Run tests and manual flow**

Generate → Save A → Retry → Save B → reload. Both A and B must be present and editable as distinct ideas.

- [ ] **Step 5: Commit**

```bash
git add raika-ai.js raika-private.js tests/raika-ai.test.js
git commit -m "feat: preserve Raika AI idea variations"
```

---

### Task 5: Add per-card `התייעץ איתי` chat

**Files:**
- Modify: `raika-private.js`
- Modify: `raika-ai.js`
- Modify: `styles.css`
- Test: `tests/raika-ai.test.js`

**Interfaces:**
- `openConsult(item)` creates/opens a drawer.
- `sendConsultMessage(item,message)` calls `raika-consult` action `consult`.
- Returned assistant message offers `העתק לטיוטה`, `החלף טקסט ערוך`, `שמור כרעיון חדש`, `השאר כהתייעצות בלבד`.

- [ ] **Step 1: Add failing action-render tests**

Assert consultation HTML contains all four actions and does not contain an automatic `canon` mutation.

- [ ] **Step 2: Implement drawer and message history**

On open, request `thread_messages`. On send, preserve the current edited card snapshot as context. Button actions that change a draft must require an explicit click and then use workspace save methods.

- [ ] **Step 3: Run tests**

Run: `node --test tests/raika-ai.test.js tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add raika-private.js raika-ai.js styles.css tests/raika-ai.test.js
git commit -m "feat: add Raika per-card AI consultation"
```

---

### Task 6: AI production verification

**Files:**
- Modify only if verification exposes a defect.

- [ ] **Step 1: Run all Raika tests**

Run: `node --test tests/raika-*.test.js`

Expected: all PASS.

- [ ] **Step 2: Run Supabase security advisors**

Resolve new high-severity findings before merge.

- [ ] **Step 3: Browser smoke-test both modes**

Verify `ראיקה + אוקנה` produces an interaction idea and `ראיקה + קנאה` produces an emotion scene. Both must visibly remain `💡 הצעה` until explicit approval.

- [ ] **Step 4: Failure-mode test**

Temporarily use an invalid model/blocked request in a development invocation and verify the UI reports an AI failure while Save/Edit still works.

- [ ] **Step 5: Merge and verify Pages**

After CI and function verification pass, merge to `main`, verify GitHub Pages succeeds, and perform one live generation plus one consultation using the authorized account.
