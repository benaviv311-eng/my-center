# Raika Writers Room Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the private Raika writers-room workspace for authenticated save/edit/autosave/version/approve/delete/archive behavior, without AI or Google Sheets sync yet.

**Architecture:** Keep `raika-data.js` as the public read-only baseline. Private edits live in the existing Supabase `raika_item_edits` and `raika_item_versions` tables and are accessed only through an authenticated `raika-workspace` Edge Function. The browser merges returned private overrides into the displayed writers-room cards; it never receives a service-role key or writes tables directly.

**Tech Stack:** GitHub Pages, vanilla HTML/CSS/JS, Supabase project `my-center` (`iwemlxvjyhffumzcqrxf`), `@supabase/supabase-js` browser UMD pinned to `2.116.0`, Supabase Edge Functions/Deno, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-raika-writers-room-cloud-sync-design.md`

## Global Constraints

- Supabase is the primary workspace for drafts, edits, versions, approvals and AI conversations.
- Drafts never sync to Google Sheets.
- Only an explicit Approve action may move a proposal into `canon`.
- Deleting unapproved content removes it from the active workspace; deleting approved content means archive, not physical deletion.
- Autosave must not create a version on every keystroke.
- Manual Save, Approve, Archive and Restore create version snapshots.
- Private credentials must never appear in public GitHub Pages code.
- The public Raika page must continue to render if private services are unavailable.

---

### Task 1: Define workspace state and payload contracts

**Files:**
- Create: `raika-private.js`
- Create: `tests/raika-private.test.js`

**Interfaces:**
- Produces: `normalizeWorkspaceItem(item)`, `mergeWorkspaceOverrides(baseItems, overrides)`, `nextDeleteAction(status)`, `buildAutosavePayload(item)`.
- Later tasks use these helpers in browser rendering and API calls.

- [ ] **Step 1: Write the failing tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeWorkspaceItem,
  mergeWorkspaceOverrides,
  nextDeleteAction,
  buildAutosavePayload
} = require('../raika-private.js');

test('AI/draft workspace items default to idea', () => {
  assert.equal(normalizeWorkspaceItem({item_id:'x',payload:{title:'רעיון'}}).status, 'idea');
});

test('override replaces matching base item without mutating base', () => {
  const base=[{id:'idea-1',title:'ישן',status:'idea'}];
  const merged=mergeWorkspaceOverrides(base,[{item_id:'idea-1',status:'developing',payload:{title:'חדש'}}]);
  assert.equal(merged[0].title,'חדש');
  assert.equal(merged[0].status,'developing');
  assert.equal(base[0].title,'ישן');
});

test('canon delete becomes archive while draft delete stays delete', () => {
  assert.equal(nextDeleteAction('canon'),'archive');
  assert.equal(nextDeleteAction('idea'),'delete');
});

test('autosave payload never promotes a draft to canon', () => {
  const body=buildAutosavePayload({id:'x',type:'scene',title:'בדיקה',summary:'טקסט',status:'idea'});
  assert.equal(body.action,'autosave');
  assert.equal(body.status,'idea');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/raika-private.test.js`

Expected: FAIL because `raika-private.js` does not exist.

- [ ] **Step 3: Implement only the pure contract helpers**

```js
function normalizeWorkspaceItem(row={}){
  return {
    id: row.item_id || row.id || '',
    type: row.item_type || row.type || 'idea',
    status: row.status || 'idea',
    ...(row.payload || row)
  };
}

function mergeWorkspaceOverrides(baseItems=[], overrides=[]){
  const map=new Map(overrides.map(row=>[row.item_id,normalizeWorkspaceItem(row)]));
  const seen=new Set();
  const merged=baseItems.map(item=>{
    const over=map.get(item.id);
    if(!over) return {...item};
    seen.add(item.id);
    return {...item,...over,id:item.id};
  });
  for(const row of overrides){
    if(!seen.has(row.item_id)) merged.push(normalizeWorkspaceItem(row));
  }
  return merged;
}

function nextDeleteAction(status){ return status==='canon' ? 'archive' : 'delete'; }

function buildAutosavePayload(item){
  return {
    action:'autosave',
    item_type:item.type || 'idea',
    item_id:item.id,
    status:item.status==='canon' ? 'developing' : (item.status || 'idea'),
    payload:{title:item.title||'',summary:item.summary||'',placement:item.placement||'',why:item.why||'',opens:item.opens||'',tags:item.tags||[],characters:item.characters||[]}
  };
}

if(typeof module!=='undefined') module.exports={normalizeWorkspaceItem,mergeWorkspaceOverrides,nextDeleteAction,buildAutosavePayload};
```

- [ ] **Step 4: Run the focused test and full Raika tests**

Run: `node --test tests/raika-private.test.js tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raika-private.js tests/raika-private.test.js
git commit -m "test: define Raika workspace state contracts"
```

---

### Task 2: Add authenticated workspace Edge Function

**Files:**
- Create: `supabase/functions/_shared/raika-workspace-core.mjs`
- Create: `supabase/functions/raika-workspace/index.ts`
- Create: `tests/raika-workspace-core.test.mjs`

**Interfaces:**
- Browser sends `{action, item_type, item_id, status, payload}`.
- Supported actions: `list`, `autosave`, `save`, `approve`, `delete`, `archive`, `versions`, `restore`.
- Edge Function returns `{ok:true,...}` or `{error:string}` and requires an authenticated Supabase user JWT.

- [ ] **Step 1: Write failing core tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAction, sanitizeWorkspacePayload } from '../supabase/functions/_shared/raika-workspace-core.mjs';

test('only supported workspace actions pass validation',()=>{
  assert.equal(validateAction('approve'),'approve');
  assert.throws(()=>validateAction('publish_everything'));
});

test('workspace payload is bounded and arrays are normalized',()=>{
  const p=sanitizeWorkspacePayload({title:'  כותרת  ',tags:['א','ב'],summary:'x'.repeat(13000)});
  assert.equal(p.title,'כותרת');
  assert.equal(p.tags.length,2);
  assert.equal(p.summary.length,12000);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/raika-workspace-core.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure validator**

```js
const ACTIONS=new Set(['list','autosave','save','approve','delete','archive','versions','restore']);
const STATUSES=new Set(['idea','developing','canon','parked','archived']);
export function validateAction(value){
  const action=String(value||'');
  if(!ACTIONS.has(action)) throw new Error('Unsupported action');
  return action;
}
export function validateStatus(value){
  const status=String(value||'idea');
  if(!STATUSES.has(status)) throw new Error('Invalid status');
  return status;
}
export function sanitizeWorkspacePayload(value={}){
  const text=(v,max=12000)=>String(v??'').trim().slice(0,max);
  return {
    title:text(value.title,200), summary:text(value.summary), placement:text(value.placement,2000),
    why:text(value.why,4000), opens:text(value.opens,4000),
    tags:Array.isArray(value.tags)?value.tags.slice(0,40).map(x=>text(x,100)):[],
    characters:Array.isArray(value.characters)?value.characters.slice(0,30).map(x=>text(x,100)):[]
  };
}
```

- [ ] **Step 4: Implement `raika-workspace` with server-side authorization**

Use `npm:@supabase/supabase-js@2.116.0`. Keep `verify_jwt=true`. Read the caller JWT from `Authorization`, call `auth.getUser(token)`, hash `user.email.toLowerCase()` with SHA-256, and require a matching row in `raika_authorized_users`. Only after authorization create the admin client with `SUPABASE_SERVICE_ROLE_KEY`.

Core behavior:

```ts
if (action === 'autosave') {
  // upsert active state; no version snapshot
}
if (action === 'save' || action === 'approve' || action === 'archive') {
  // read current row; insert snapshot into raika_item_versions when current exists;
  // then upsert new active row
}
if (action === 'delete') {
  // reject if current status is canon; canon must use archive
  // delete active draft row only
}
if (action === 'restore') {
  // snapshot current active row, then copy selected version payload/status into active row
}
```

Use the existing unique key `(user_id,item_type,item_id)` for `upsert(...,{onConflict:'user_id,item_type,item_id'})`.

- [ ] **Step 5: Run core tests**

Run: `node --test tests/raika-workspace-core.test.mjs`

Expected: PASS.

- [ ] **Step 6: Deploy and smoke-test the function**

Deploy `raika-workspace` with JWT verification enabled. Call it once without a session and confirm HTTP 401, then once with the authorized session and `{action:'list'}` and confirm `{ok:true,items:[...]}`.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/raika-workspace-core.mjs supabase/functions/raika-workspace/index.ts tests/raika-workspace-core.test.mjs
git commit -m "feat: add authenticated Raika workspace API"
```

---

### Task 3: Add private login and workspace API client to the static site

**Files:**
- Modify: `raika.html`
- Modify: `raika-private.js`
- Test: `tests/raika-private.test.js`

**Interfaces:**
- Produces: `initRaikaPrivate()`, `workspaceRequest(body)`, `requestMagicLink(email)`, `signOutRaika()`.
- Uses global `supabase.createClient` from pinned browser UMD `2.116.0`.

- [ ] **Step 1: Add failing HTML/client tests**

```js
test('Raika page loads pinned Supabase client and private workspace script',()=>{
  const html=require('node:fs').readFileSync('raika.html','utf8');
  assert.match(html,/@supabase\/supabase-js@2\.116\.0/);
  assert.match(html,/raika-private\.js/);
  assert.match(html,/id=["']raika-private-login["']/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/raika-private.test.js`

- [ ] **Step 3: Add login UI**

Insert above the writers-room generator area:

```html
<div id="raika-private-login" class="card raika-private-login">
  <span id="raika-auth-state">🔒 מצב צפייה</span>
  <input id="raika-login-email" class="search" type="email" autocomplete="email" placeholder="מייל מורשה">
  <button id="raika-login-send" class="btn small" type="button">שלח קישור כניסה</button>
  <button id="raika-logout" class="btn small hidden" type="button">יציאה</button>
</div>
```

Load before `raika-private.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0"></script>
<script src="raika-private.js?v=1"></script>
```

- [ ] **Step 4: Implement browser client**

Use the project URL returned by Supabase and a publishable key only. `requestMagicLink()` calls `signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.href.split('#')[0]}})`. `workspaceRequest()` requires `getSession()` and sends the session access token to `/functions/v1/raika-workspace` as `Authorization: Bearer <token>`.

- [ ] **Step 5: Run tests**

Run: `node --test tests/raika-private.test.js tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add raika.html raika-private.js tests/raika-private.test.js
git commit -m "feat: add private Raika workspace login"
```

---

### Task 4: Render editable writers-room cards and autosave

**Files:**
- Modify: `raika-app.js`
- Modify: `raika-private.js`
- Modify: `styles.css`
- Test: `tests/raika-private.test.js`

**Interfaces:**
- `raika-app.js` calls `window.RaikaPrivate.decorateIdeaCard(item)` when private mode is active.
- `raika-private.js` exposes `scheduleAutosave(itemId, draft)` and `flushSave(itemId)`.

- [ ] **Step 1: Write failing debounce/state tests**

```js
test('autosave scheduler replaces older timer for same item', async () => {
  const calls=[];
  const s=createAutosaveScheduler((body)=>{calls.push(body);return Promise.resolve();},20);
  s.schedule('a',{title:'א'});
  s.schedule('a',{title:'ב'});
  await new Promise(r=>setTimeout(r,40));
  assert.equal(calls.length,1);
  assert.equal(calls[0].payload.title,'ב');
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/raika-private.test.js`

- [ ] **Step 3: Implement autosave scheduler**

```js
function createAutosaveScheduler(send,delay=1000){
  const timers=new Map();
  return {schedule(id,body){clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>{timers.delete(id);send(buildAutosavePayload(body));},delay));}};
}
```

- [ ] **Step 4: Add edit controls and save state UI**

Each editable idea card receives `✏️ ערוך`, `💾 שמור`, `🕘 גרסאות`, `✅ אשר`, `🗑️ מחק`, plus a state label with exact states `לא נשמר`, `שומר…`, `נשמר`, `מאושר`, `ארכיון`. Editing title/body/tags/characters triggers a one-second autosave; manual Save calls `action:'save'` immediately.

- [ ] **Step 5: Merge server overrides before rendering ideas**

After authenticated `list`, call:

```js
window.RAIKA_DATA.ideas = mergeWorkspaceOverrides(window.RAIKA_DATA.ideas, rows);
renderAll();
```

Do not alter `characters/scenes/plotlines` baseline data in this task.

- [ ] **Step 6: Run all Raika tests**

Run: `node --test tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add raika-app.js raika-private.js styles.css tests/raika-private.test.js
git commit -m "feat: add editable Raika ideas with autosave"
```

---

### Task 5: Add versions, restore, approve, delete and archive flows

**Files:**
- Modify: `raika-private.js`
- Modify: `styles.css`
- Test: `tests/raika-private.test.js`

**Interfaces:**
- `openVersions(item)` calls `workspaceRequest({action:'versions',...})`.
- `restoreVersion(item,versionId)` calls `action:'restore'`.
- `approveItem(item)` calls `action:'approve'`.
- `deleteOrArchive(item)` uses `nextDeleteAction(item.status)`.

- [ ] **Step 1: Write failing action tests**

```js
test('deleteOrArchive payload archives canon',()=>{
  assert.deepEqual(buildRemovalPayload({id:'x',type:'scene',status:'canon'}),{action:'archive',item_id:'x',item_type:'scene'});
});

test('deleteOrArchive payload physically deletes idea draft',()=>{
  assert.deepEqual(buildRemovalPayload({id:'x',type:'scene',status:'idea'}),{action:'delete',item_id:'x',item_type:'scene'});
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/raika-private.test.js`

- [ ] **Step 3: Implement confirmation and versions drawer**

Approve confirmation text: `להפוך את הגרסה הנוכחית לקאנון?`.

Canon removal confirmation text: `הפריט מאושר. הוא יעבור לארכיון ולא יימחק מההיסטוריה.`.

Versions drawer lists timestamp/status and buttons `הצג` / `שחזר גרסה זו`.

- [ ] **Step 4: Verify state transitions against the Edge Function**

Create a temporary idea, manual-save it, approve it, archive it, restore an earlier version, and verify each operation returns the expected status and a new snapshot exists after Save/Approve/Archive/Restore.

- [ ] **Step 5: Run full Raika suite**

Run: `node --test tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add raika-private.js styles.css tests/raika-private.test.js
git commit -m "feat: add Raika versions approval and archive flows"
```

---

### Task 6: Production verification for persistence phase

**Files:**
- Modify only if verification finds a defect.

- [ ] **Step 1: Run complete tests**

Run: `node --test tests/raika-*.test.js`

Expected: all PASS.

- [ ] **Step 2: Run Supabase security advisors**

Use Supabase security advisors and resolve any new high-severity finding caused by this phase before merge.

- [ ] **Step 3: Browser smoke test**

Verify public mode still renders without login. Then authenticate and verify: edit → autosave → reload → edit persists; manual Save creates a version; Approve becomes canon; canon Delete becomes archive; draft Delete removes it from active view.

- [ ] **Step 4: Merge and verify GitHub Pages deployment**

After CI passes, merge to `main`, verify Pages succeeds, then open `raika.html` from the live Pages URL and repeat one read-only smoke check.
