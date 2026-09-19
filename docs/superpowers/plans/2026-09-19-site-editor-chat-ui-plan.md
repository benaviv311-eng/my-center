# Site Editor Chat UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing site chat a usable editor with Edit/Work modes, change cards, selected-element targeting, screenshots, status, and edit history.

**Architecture:** Keep `site-chat.js` as the shell but split Site Editor UI behavior into `site-editor-ui.js` and `site-editor-ui.css`. The UI calls the authenticated `site-editor` Edge Function; it never mutates repository state directly.

**Tech Stack:** Vanilla browser JavaScript/CSS, existing Supabase auth session, existing site chat drawer.

**Spec:** `docs/superpowers/specs/2026-09-19-site-editor-through-chat-design.md`

## Global Constraints

- Default mode is Edit.
- Consult-only never creates a Site Editor request.
- Work mode preserves active-request context but never removes approval requirements.
- Screenshot/image attachments remain private unless a publish-asset operation explicitly tells the user the image will become public.
- The browser cannot set request status, risk, approval, or deployment state directly.
- Selected-element mode must intercept one click and then restore normal page behavior.

## Review Focus

- Selecting a link/button must not navigate or trigger its action while inspect mode is active.
- Closing the drawer during a running edit must not lose server-side request state.
- A private chat image must not silently become a public repository asset.
- A cancelled request must stop showing approval/publish buttons.
- Mobile full-width chat must keep change-card actions reachable without horizontal overflow.

---

### Task 1: Add Editor UI module and modes

**Files:**
- Create: `site-editor-ui.js`
- Create: `site-editor-ui.css`
- Modify: `site-chat.js`
- Modify: `app.js`
- Modify: `book.html`
- Modify: `four-languages.html`
- Modify: `language-archive.html`
- Modify: `language-topics.html`
- Modify: `language-vocabulary.html`
- Modify: `library.html`
- Create: `tests/site-editor-ui.test.js`

**Interfaces:**
- Produces `window.SiteEditorUI.install({chatState, api, pageContext})`.
- Consumes authenticated `site-editor` API responses.

- [ ] **Step 1: Write failing tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('site chat loads editor UI and exposes three modes',()=>{
  const js=read('site-editor-ui.js');
  const app=read('app.js');
  assert.match(app,/site-editor-ui\.js\?v=1/);
  assert.match(app,/site-editor-ui\.css\?v=1/);
  assert.match(js,/consult/);
  assert.match(js,/edit/);
  assert.match(js,/work/);
  assert.match(js,/✏️ עריכה/);
  assert.match(js,/⚡ עבודה/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-ui.test.js`  
Expected: FAIL because the new files are missing.

- [ ] **Step 3: Implement module and controls**

Expose:
```js
window.SiteEditorUI={
  install({chatState,api,pageContext}){/* bind once */},
  mode(){/* consult|edit|work */},
  activeRequestId(){/* string|null */}
};
```

Add toolbar controls `🛡️ ייעוץ בלבד`, `✏️ עריכה`, `⚡ עבודה`. Store the preference in `localStorage['site-editor-mode']`, defaulting to `edit`. Keep server approval state authoritative.

Load CSS/JS from `app.js` and the same standalone pages that directly load chat assets.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/site-editor-ui.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site-editor-ui.js site-editor-ui.css site-chat.js app.js book.html four-languages.html language-archive.html language-topics.html language-vocabulary.html library.html tests/site-editor-ui.test.js
git commit -m "feat: add site editor chat modes"
```

---

### Task 2: Render change-request cards and approval actions

**Files:**
- Modify: `site-editor-ui.js`
- Modify: `site-editor-ui.css`
- Modify: `tests/site-editor-ui.test.js`

**Interfaces:**
- Consumes request shape `{id,summary,risk_level,status,operations,requires_preview,public_asset_warning}`.
- Calls `site-editor` actions `approve_plan`, `cancel`, `request_revision`.

- [ ] **Step 1: Add failing tests**

```js
test('change cards show risk files and approval controls',()=>{
  const js=read('site-editor-ui.js');
  for(const marker of ['מאשר','שנה את ההצעה','בטל','risk_level','requires_preview','public_asset_warning']) assert.ok(js.includes(marker));
  assert.match(js,/approve_plan/);
  assert.match(js,/request_revision/);
  assert.match(js,/cancel/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-ui.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement request card rendering**

Render:
- summary;
- risk badge;
- affected file paths from operations;
- required validation;
- preview requirement;
- warning when a private attachment will become a public asset.

Buttons are status-aware. Disable duplicate submissions while a request action is in flight.

- [ ] **Step 4: Add safe error mapping**

Map stable API codes:
```js
const EDITOR_ERRORS={
  owner_required:'אין הרשאת עריכת אתר.',
  stale_plan:'הקבצים השתנו מאז האישור. צריך להכין הצעה חדשה.',
  unsafe_plan:'השינוי המוצע נחסם מטעמי בטיחות.',
  editor_unavailable:'עורך האתר אינו זמין כרגע.'
};
```

Never render raw provider text.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-ui.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add site-editor-ui.js site-editor-ui.css tests/site-editor-ui.test.js
git commit -m "feat: render site edit approval cards"
```

---

### Task 3: Add selected-element inspect mode

**Files:**
- Modify: `site-editor-ui.js`
- Modify: `site-editor-ui.css`
- Modify: `tests/site-editor-ui.test.js`

**Interfaces:**
- Produces `selectedElementContext(element)` returning `tag,id,classes,data,visible_text,dom_path,container,bounds,computed_style`.

- [ ] **Step 1: Add failing tests**

```js
test('inspect mode captures one element without activating it',()=>{
  const js=read('site-editor-ui.js');
  assert.match(js,/בחר מהעמוד/);
  assert.match(js,/preventDefault\(\)/);
  assert.match(js,/stopPropagation\(\)/);
  assert.match(js,/selectedElementContext/);
  for(const key of ['display','position','fontSize','fontWeight','color','backgroundColor','margin','padding','gap']) assert.ok(js.includes(key));
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-ui.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement inspect overlay**

Use capture-phase `pointerover`, `pointerout`, and `click` handlers. While active, outline the hovered target. On the selection click, call `preventDefault`, `stopPropagation`, and `stopImmediatePropagation`; capture the context; then remove listeners and outline.

Stable DOM path should prefer `#id`, then stable `data-*` selectors, then tag/class/nth-of-type segments.

- [ ] **Step 4: Add selected-element chip**

Show `נבחר: <selector>` above the composer with an × clear button. Include the captured object in the next edit request.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-ui.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add site-editor-ui.js site-editor-ui.css tests/site-editor-ui.test.js
git commit -m "feat: select page elements for chat edits"
```

---

### Task 4: Route edit-language messages into Site Editor

**Files:**
- Modify: `site-chat.js`
- Modify: `site-editor-ui.js`
- Modify: `supabase/functions/site-chat/index.ts`
- Modify: `tests/site-editor-ui.test.js`
- Modify: `tests/site-chat.test.js`

**Interfaces:**
- `site-chat` may return `site_edit_request`.
- Request payload includes thread id, current page context, selected element, and attachment ids.
- Normal conversational responses remain unchanged.

- [ ] **Step 1: Add failing tests**

```js
test('edit mode can receive a structured site edit request from site-chat',()=>{
  const chat=read('site-chat.js');
  const fn=read('supabase/functions/site-chat/index.ts');
  assert.match(chat,/site_edit_request/);
  assert.match(fn,/site_edit_request/);
  assert.match(fn,/selected_element/);
  assert.match(fn,/attachment_ids/);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-ui.test.js tests/site-chat.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement server-assisted edit intent**

In consult mode, never propose an edit.

Before routing to Site Editor, preserve the existing structured-action path: database-backed content changes continue to use `content_create`/`content_update`; memory changes continue to use the memory actions; Raika structured content continues to use `raika_edit_upsert`. Only source/layout/code/feature/infrastructure requests route to Site Editor.

In edit/work modes, the chat model may emit:
```json
{"intent":"site_edit","goal":"..."}
```
inside a structured server-only block. `site-chat` then calls the `site-editor` proposal endpoint server-to-server, passing page context, selected element, and only attachment ids owned by the current user. The browser receives the resulting request metadata, not GitHub credentials.

Do not route based only on client keyword regex.

- [ ] **Step 4: Preserve work-mode context**

If `activeRequestId` exists, include it so follow-ups such as `עוד קצת` can become a revision of that request rather than a new unrelated request.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/site-editor-ui.test.js tests/site-chat.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add site-chat.js site-editor-ui.js supabase/functions/site-chat/index.ts tests/site-editor-ui.test.js tests/site-chat.test.js
git commit -m "feat: route site edit intent from chat"
```

---

### Task 5: Add Site Changes history and live status

**Files:**
- Modify: `site-editor-ui.js`
- Modify: `site-editor-ui.css`
- Modify: `supabase/functions/site-editor/index.ts`
- Modify: `tests/site-editor-ui.test.js`
- Modify: `tests/site-editor-core.test.js`

**Interfaces:**
- Add `list_requests` and `get_request` actions.
- Poll every 3 seconds only while request status is active.

- [ ] **Step 1: Add failing tests**

```js
test('site changes view restores request history and active progress',()=>{
  const js=read('site-editor-ui.js');
  assert.match(js,/שינויים באתר/);
  assert.match(js,/list_requests/);
  assert.match(js,/get_request/);
  assert.match(js,/3000/);
  for(const stage of ['מנתח','מוצא קבצים','מכין שינוי','שומר Branch','מריץ בדיקות','מכין Preview','ממתין לאישור','מפרסם']) assert.ok(js.includes(stage));
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/site-editor-ui.test.js tests/site-editor-core.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement request history and polling**

Add `שינויים באתר` to the chat toolbar. Reconstruct cards from Supabase-backed API responses after reload. Poll active statuses only; stop polling on `awaiting_plan_approval`, `preview_ready`, `awaiting_publish_approval`, `deployed`, `failed`, `cancelled`, `rolled_back`.

- [ ] **Step 4: Mobile verification**

Add CSS so cards and action rows wrap within `100vw` at `max-width:620px`. Buttons stay at least 44px tall.

- [ ] **Step 5: Run GREEN and full suite**

Run: `node --test tests/*.test.js`  
Expected: zero failures.

- [ ] **Step 6: Commit**

```bash
git add site-editor-ui.js site-editor-ui.css supabase/functions/site-editor/index.ts tests/site-editor-ui.test.js tests/site-editor-core.test.js
git commit -m "feat: add site edit history and status"
```
