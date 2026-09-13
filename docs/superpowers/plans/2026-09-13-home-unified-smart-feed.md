# Unified Smart Home Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current section-based homepage with one daily, infinite, personalized feed that reads directly from the content sources already used by Raika, Coach, Volleyball, Languages, Music, Library, and Verses.

**Architecture:** Add three pure modules for source normalization, ranking/diversity, and persistent feed state, then a browser controller that composes them. Existing content remains the source of truth: the homepage only adapts and ranks it. Async sources are isolated with `Promise.allSettled`, so one failed source never prevents the rest of the feed from rendering.

**Tech Stack:** Static HTML/CSS/JavaScript on GitHub Pages, browser `localStorage`, `IntersectionObserver`, existing UMD/CommonJS data modules, Supabase public library/verse endpoints already used by the site, Node 22 `node:test` / `assert` tests.

**Spec:** `docs/superpowers/specs/2026-09-13-home-unified-smart-feed-design.md`

## Global Constraints

- Feed content must come only from content already present on the site or from the same public source endpoints those pages already use.
- Default mode is `בשבילי`; filters are `הכול`, `ראיקה`, `מאמן`, `כדורעף`, `שפות`, `מוזיקה`, `ספרייה`, `פסוקים`, `שמורים`.
- A new deterministic base order is created each Jerusalem calendar day; the same day restores the saved order and scroll position.
- Personalization may learn from open/save/more/less/hide/dwell signals, but diversity must stop one source from dominating.
- `לא להציג כרגע` applies to the current day; saved and learned preferences persist across days.
- New/unseen content is preferred before recycled content.
- Short content expands in-feed; deep content links to its existing source page.
- Infinite loading uses `IntersectionObserver`; no primary `טען עוד` button.
- One source failure must not fail the whole homepage.
- Raika status/canon metadata must be preserved; the home feed never promotes an item to canon.
- No private task/calendar/editor data is added merely because it exists outside the visible site feed sources.

---

## File Structure

- Create `home-feed-sources.js` — adapters from existing site sources to the normalized `HomeFeedItem` contract, including async library/verse/music loaders.
- Create `home-feed-ranking.js` — deterministic scoring, seeded ordering, diversity interleaving, and recycle-cycle ordering.
- Create `home-feed-state.js` — localStorage schema, Jerusalem day rollover, seen history, preferences, per-day hide/order/cursor/scroll state.
- Create `home-feed.js` — DOM rendering, filters, infinite scroll, click behavior, feedback actions, dwell tracking, source-failure notices, scroll restoration.
- Create `home-feed.css` — homepage feed toolbar, cards, source badges, actions, expanded states, loading/sentinel, responsive layout.
- Modify `index.html` — replace the old homepage section mosaic with the unified feed shell and load the existing source scripts plus the new feed modules.
- Modify `app.js` — expose the existing `my-center-favorites` set through a tiny public bridge and emit a favorite-change event, so old pages and the new homepage use one saved-items store.
- Create `tests/home-feed-sources.test.js` — adapters and source contract tests.
- Create `tests/home-feed-ranking.test.js` — scoring, diversity, deterministic order, unseen-before-recycle tests.
- Create `tests/home-feed-state.test.js` — daily rollover, persistence, signals, hide-today, scroll tests.
- Create `tests/home-feed-page.test.js` — homepage wiring, filters, scripts, no legacy mosaic, card rendering contract.
- Create `.github/workflows/home-feed-test.yml` — run the full Node test suite and syntax checks when unified-home-feed files change.

---

### Task 1: Persistent daily feed state

**Files:**
- Create: `home-feed-state.js`
- Test: `tests/home-feed-state.test.js`

**Interfaces:**
- Produces: `HomeFeedState.dayKey(date) -> string`
- Produces: `HomeFeedState.load(storage,date) -> FeedState`
- Produces: `HomeFeedState.save(storage,state) -> void`
- Produces: `HomeFeedState.ensureDay(state,date) -> FeedState`
- Produces: `HomeFeedState.markShown(state,items,date) -> FeedState`
- Produces: `HomeFeedState.recordSignal(state,item,signal,value,date) -> FeedState`
- Produces: `HomeFeedState.setScroll(state,y) -> FeedState`
- Produces: `HomeFeedState.setDailyOrder(state,ids) -> FeedState`
- `FeedState` shape is fixed as:

```js
{
  version: 1,
  profile: {
    seen: {},
    sourceAffinity: {},
    typeAffinity: {},
    saved: []
  },
  day: {
    key: 'YYYY-MM-DD',
    seed: 'home|YYYY-MM-DD',
    order: [],
    cursor: 0,
    scrollY: 0,
    hidden: []
  }
}
```

- [ ] **Step 1: Write the failing state tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../home-feed-state.js');

function memoryStorage(){
  const map=new Map();
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v))};
}

test('same Jerusalem day restores order and scroll',()=>{
  const storage=memoryStorage();
  let state=S.load(storage,new Date('2026-09-13T08:00:00Z'));
  state=S.setDailyOrder(state,['a','b','c']);
  state=S.setScroll(state,812);
  S.save(storage,state);
  const again=S.load(storage,new Date('2026-09-13T18:00:00Z'));
  assert.deepEqual(again.day.order,['a','b','c']);
  assert.equal(again.day.scrollY,812);
});

test('new Jerusalem day resets daily state but keeps preferences',()=>{
  const storage=memoryStorage();
  let state=S.load(storage,new Date('2026-09-13T08:00:00Z'));
  state=S.recordSignal(state,{id:'coach:x',source:'coach',type:'concept'},'more',1,new Date('2026-09-13T08:00:00Z'));
  state.day.hidden.push('coach:x');
  state.day.order=['coach:x'];
  S.save(storage,state);
  const next=S.load(storage,new Date('2026-09-14T08:00:00Z'));
  assert.equal(next.profile.sourceAffinity.coach > 0,true);
  assert.deepEqual(next.day.hidden,[]);
  assert.deepEqual(next.day.order,[]);
});
```

- [ ] **Step 2: Run the state test and verify red**

Run: `node --test tests/home-feed-state.test.js`

Expected: FAIL with `Cannot find module '../home-feed-state.js'`.

- [ ] **Step 3: Implement the state module**

```js
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.HomeFeedState=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const KEY='my-center-home-feed-v1';
  const clone=x=>JSON.parse(JSON.stringify(x));
  function dayKey(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function fresh(date){const key=dayKey(date);return {version:1,profile:{seen:{},sourceAffinity:{},typeAffinity:{},saved:[]},day:{key,seed:`home|${key}`,order:[],cursor:0,scrollY:0,hidden:[]}};}
  function ensureDay(state,date=new Date()){
    const next=clone(state||fresh(date)),key=dayKey(date);
    if(next.day?.key!==key) next.day={key,seed:`home|${key}`,order:[],cursor:0,scrollY:0,hidden:[]};
    return next;
  }
  function load(storage=localStorage,date=new Date()){
    let parsed=null;try{parsed=JSON.parse(storage.getItem(KEY)||'null')}catch(_){parsed=null}
    return ensureDay(parsed&&parsed.version===1?parsed:fresh(date),date);
  }
  function save(storage=localStorage,state){storage.setItem(KEY,JSON.stringify(state));}
  function setDailyOrder(state,ids){const next=clone(state);next.day.order=[...ids];next.day.cursor=0;return next;}
  function setScroll(state,y){const next=clone(state);next.day.scrollY=Math.max(0,Number(y)||0);return next;}
  function markShown(state,items,date=new Date()){
    const next=clone(state),d=dayKey(date);
    for(const item of items){const row=next.profile.seen[item.id]||{count:0,dwellMs:0,opens:0};row.count+=1;row.lastSeenDay=d;next.profile.seen[item.id]=row;}
    return next;
  }
  function recordSignal(state,item,signal,value=1,date=new Date()){
    const next=clone(state),amount=Number(value)||1;
    const seen=next.profile.seen[item.id]||{count:0,dwellMs:0,opens:0};
    if(signal==='open') seen.opens=(seen.opens||0)+amount;
    if(signal==='dwell') seen.dwellMs=(seen.dwellMs||0)+Math.max(0,amount);
    if(signal==='more'){next.profile.sourceAffinity[item.source]=(next.profile.sourceAffinity[item.source]||0)+amount;next.profile.typeAffinity[item.type]=(next.profile.typeAffinity[item.type]||0)+amount;}
    if(signal==='less'){next.profile.sourceAffinity[item.source]=(next.profile.sourceAffinity[item.source]||0)-amount;next.profile.typeAffinity[item.type]=(next.profile.typeAffinity[item.type]||0)-amount;}
    if(signal==='hide'&&!next.day.hidden.includes(item.id)) next.day.hidden.push(item.id);
    next.profile.seen[item.id]=seen;seen.lastSignalDay=dayKey(date);
    return next;
  }
  return {KEY,dayKey,load,save,ensureDay,markShown,recordSignal,setScroll,setDailyOrder};
});
```

- [ ] **Step 4: Run the state tests and verify green**

Run: `node --test tests/home-feed-state.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add home-feed-state.js tests/home-feed-state.test.js
git commit -m "feat: add daily home feed state"
```

---

### Task 2: Normalize all existing content sources

**Files:**
- Create: `home-feed-sources.js`
- Test: `tests/home-feed-sources.test.js`

**Interfaces:**
- Produces normalized items with exactly these top-level keys: `id,source,type,title,summary,fullText,deepLink,tags,weight,expandable,metadata`.
- Produces: `fromRaika(data)`, `fromCoach(data)`, `fromVolleyball(cards)`, `fromLanguages(model,seed,count)`, `fromLibraryPayload(payload,discovery)`, `fromVerseRows(rows)`, `fromMusicHtml(html)`.
- Produces: `collectAll(env) -> Promise<{items:HomeFeedItem[],errors:{source:string,message:string}[]}>`.
- `collectAll` accepts explicit dependencies so tests do not depend on browser globals.

- [ ] **Step 1: Write failing adapter tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../home-feed-sources.js');

test('adapters create stable globally namespaced ids',()=>{
  const raika=S.fromRaika({characters:[{id:'raika',title:'ראיקה',summary:'גיבורה',status:'canon',type:'character',tags:['מורשת']}],scenes:[]});
  assert.equal(raika[0].id,'raika:character:raika');
  assert.equal(raika[0].source,'raika');
  assert.equal(raika[0].metadata.status,'canon');
  const coach=S.fromCoach({COACH_FEED_CARDS:[{id:'sp-1',topic:'sport-psychology',type:'concept',title:'מסוגלות',body:'טקסט',application:'יישום'}],COACH_TOPICS:[{id:'sport-psychology',page:'coach-sport-psychology.html'}]});
  assert.equal(coach[0].deepLink,'coach-sport-psychology.html');
  assert.equal(coach[0].fullText.includes('יישום'),true);
});

test('library and verse adapters use existing payload content',()=>{
  const discovery={buildDiscoveryPool:books=>[{id:'b1|post|0',bookId:'b1',bookTitle:'Book',title:'רעיון',text:'טקסט',type:'📖',sourceKind:'book'}]};
  const lib=S.fromLibraryPayload({books:[{id:'b1',slug:'book',title:'Book',content:{summary:'Summary'}}]},discovery);
  assert.equal(lib[0].source,'library');
  const verses=S.fromVerseRows([{id:'v1',slug:'v1',title:'פסוק',content:{verse:'שבע יפול צדיק וקם',reference:'משלי',human:'חוסן'}}]);
  assert.equal(verses[0].id,'verses:v1');
  assert.equal(verses[0].expandable,true);
});
```

- [ ] **Step 2: Run the source tests and verify red**

Run: `node --test tests/home-feed-sources.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the normalized source contract and adapters**

Use a UMD wrapper and keep adapter inputs explicit. The implementation must use these mappings:

```js
const SOURCE_META={
  raika:{label:'⚡ ראיקה'},coach:{label:'🧠 מאמן'},volleyball:{label:'🏐 כדורעף'},
  languages:{label:'🌍 שפות'},music:{label:'🎵 מוזיקה'},library:{label:'📚 ספרייה'},verses:{label:'📖 פסוקים'}
};
const RAIKA_PAGES={character:'raika-characters.html',scene:'raika-scenes.html',plotline:'raika-plotlines.html',history:'raika-history.html',world:'raika-world.html',relationship:'raika-relationships.html',idea:'raika-writers-room.html'};
function item(v){return Object.assign({id:'',source:'',type:'item',title:'',summary:'',fullText:'',deepLink:'',tags:[],weight:0,expandable:false,metadata:{}},v);}
```

Raika must flatten `characters`, `scenes`, `plotlines`, `history`, `world`, `relationships`, and `ideas`, preserving `status` in `metadata` and never changing it.

Coach must read `data.COACH_FEED_CARDS` and `data.COACH_TOPICS`, mapping `body` to `summary` and combining `application/explanation/principle` into `fullText` when present.

Volleyball must map each `VOLLEYBALL_FEED_CARDS` entry using `text` as summary and `detail` as expansion; link to `volleyball.html#volleyball-feed-section`.

Languages must call the existing model rather than copy its bank:

```js
function fromLanguages(model,seed='home-languages',count=48){
  if(!model||typeof model.buildFeed!=='function') return [];
  return model.buildFeed({filter:'all',seed,count}).map(card=>item({
    id:`languages:${card.lang}:${card.type}:${card.id}`,
    source:'languages',type:card.type,title:card.title||card.he||card.target||'שפות',
    summary:card.he||card.prompt||card.title||'',
    fullText:[card.target,card.pron,card.he].filter(Boolean).join(' · '),
    deepLink:'languages.html',tags:[card.lang,card.type].filter(Boolean),expandable:true,metadata:{lang:card.lang}
  }));
}
```

Library must use `LibraryDiscovery.buildDiscoveryPool(payload.books)` after loading the same `library-feed?json=1` public endpoint already used by `library-discovery-ui.js`; it must not create a second hand-authored book bank.

Verses must adapt the rows returned by the existing `fetchPublicVerses()` function.

Music has no JavaScript data bank today. To avoid duplicating its text, `collectAll` must fetch same-origin `music.html`, pass the HTML through `fromMusicHtml`, and extract the existing `.card` headings/text into normalized items. It must not create a parallel music content array.

`collectAll(env)` must use `Promise.allSettled` for library, verses, and music and append sync sources immediately. Required environment keys:

```js
{
  raikaData,
  coachData,
  volleyballCards,
  languageModel,
  libraryDiscovery,
  fetchLibraryPayload,
  fetchVerses,
  fetchMusicHtml,
  seed
}
```

- [ ] **Step 4: Run source tests and syntax check**

Run:

```bash
node --test tests/home-feed-sources.test.js
node --check home-feed-sources.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add home-feed-sources.js tests/home-feed-sources.test.js
git commit -m "feat: adapt site content into home feed items"
```

---

### Task 3: Smart ranking, diversity, and recycle cycles

**Files:**
- Create: `home-feed-ranking.js`
- Test: `tests/home-feed-ranking.test.js`

**Interfaces:**
- Consumes: normalized `HomeFeedItem[]` and `FeedState` from Tasks 1–2.
- Produces: `scoreItem(item,state,seed) -> number`.
- Produces: `rankForMode(items,state,mode,seed) -> HomeFeedItem[]`.
- Produces: `diversify(items,{windowSize,maxPerSource}) -> HomeFeedItem[]`.
- Produces: `buildDailyOrder(items,state,mode) -> string[]`.
- Produces: `buildRecycleCycle(items,state,mode,cycleIndex) -> string[]`.

- [ ] **Step 1: Write failing ranking tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('../home-feed-ranking.js');

const items=['raika','coach','volleyball','languages','library','music','verses'].flatMap((source,i)=>[
  {id:`${source}:1`,source,type:'concept',weight:0},
  {id:`${source}:2`,source,type:'concept',weight:0}
]);
const state={profile:{seen:{'raika:1':{count:2}},sourceAffinity:{coach:3},typeAffinity:{},saved:['library:1']},day:{seed:'home|2026-09-13',hidden:['music:2']}};

test('unseen, saved and preferred content outrank ordinary seen content',()=>{
  assert.ok(R.scoreItem(items.find(x=>x.id==='coach:1'),state,state.day.seed) > R.scoreItem(items.find(x=>x.id==='raika:1'),state,state.day.seed));
  assert.ok(R.scoreItem(items.find(x=>x.id==='library:1'),state,state.day.seed) > R.scoreItem(items.find(x=>x.id==='raika:1'),state,state.day.seed));
});

test('diversity prevents one source owning the recent window',()=>{
  const biased=[...Array(6)].map((_,i)=>({id:`coach:${i}`,source:'coach'})).concat(items.filter(x=>x.source!=='coach'));
  const out=R.diversify(biased,{windowSize:6,maxPerSource:2});
  for(let i=0;i<out.length;i+=6){
    const block=out.slice(i,i+6),counts={};block.forEach(x=>counts[x.source]=(counts[x.source]||0)+1);
    assert.ok(Math.max(...Object.values(counts))<=2 || new Set(block.map(x=>x.source)).size===1);
  }
});

test('same seed yields stable order and hidden-today items are excluded',()=>{
  const a=R.buildDailyOrder(items,state,'for-you');
  const b=R.buildDailyOrder(items,state,'for-you');
  assert.deepEqual(a,b);
  assert.equal(a.includes('music:2'),false);
});
```

- [ ] **Step 2: Run ranking tests and verify red**

Run: `node --test tests/home-feed-ranking.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement deterministic scoring and diversity**

Use the exact signal weights below for v1 so behavior is understandable and testable:

```js
function scoreItem(item,state,seed){
  const seen=state.profile.seen[item.id];
  let score=100+(Number(item.weight)||0);
  if(!seen) score+=35; else score-=Math.min(20,(seen.count||0)*4);
  if(state.profile.saved.includes(item.id)) score+=25;
  score+=(state.profile.sourceAffinity[item.source]||0)*4;
  score+=(state.profile.typeAffinity[item.type]||0)*3;
  if(seen?.opens) score+=Math.min(8,seen.opens*2);
  if(seen?.dwellMs) score+=Math.min(8,seen.dwellMs/5000);
  score+=(hash(`${seed}|${item.id}`)%500)/100;
  return score;
}
```

`rankForMode` rules:
- `for-you`: score descending, then `diversify(...,{windowSize:7,maxPerSource:2})`.
- `all`: deterministic seeded shuffle, then diversity.
- source filters: include only `item.source===mode` and score/shuffle deterministically.
- `saved`: include only IDs in the shared favorites store/state saved set.
- exclude `state.day.hidden` in every mode.

`buildDailyOrder` must place never-seen items before previously seen items when scores are otherwise comparable. `buildRecycleCycle` may repeat IDs only after the first complete daily order has been consumed; use `${state.day.seed}|cycle:${cycleIndex}` to produce a different deterministic cycle without inventing new content.

- [ ] **Step 4: Run ranking tests**

Run:

```bash
node --test tests/home-feed-ranking.test.js
node --check home-feed-ranking.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add home-feed-ranking.js tests/home-feed-ranking.test.js
git commit -m "feat: rank and diversify unified home feed"
```

---

### Task 4: Reuse the site's existing favorites store

**Files:**
- Modify: `app.js`
- Test: `tests/home-feed-page.test.js`

**Interfaces:**
- Produces browser API `window.MyCenterFavorites` with `has(id)`, `all()`, `toggle(id)`.
- Emits `mycenter:favorites-changed` with `{id,saved}` after a change.
- Existing `.fav[data-id]` behavior remains backward compatible.

- [ ] **Step 1: Add the failing static integration assertions**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('app exposes one shared favorites bridge',()=>{
  const js=read('app.js');
  assert.ok(js.includes('window.MyCenterFavorites'));
  assert.ok(js.includes('mycenter:favorites-changed'));
  assert.ok(js.includes("const favoriteKey='my-center-favorites'"));
});
```

- [ ] **Step 2: Run the page test and verify red**

Run: `node --test tests/home-feed-page.test.js`

Expected: FAIL on the missing bridge/event assertions.

- [ ] **Step 3: Refactor `app.js` favorite mutation through one function**

Add:

```js
function setFavorite(id,shouldSave){
  if(shouldSave) favorites.add(id); else favorites.delete(id);
  localStorage.setItem(favoriteKey,JSON.stringify([...favorites]));
  refreshFavs();
  document.dispatchEvent(new CustomEvent('mycenter:favorites-changed',{detail:{id,saved:favorites.has(id)}}));
  return favorites.has(id);
}
function toggleFavorite(id){return setFavorite(id,!favorites.has(id));}
window.MyCenterFavorites={has:id=>favorites.has(id),all:()=>[...favorites],toggle:toggleFavorite};
```

Update the existing `.fav` click handler to call `toggleFavorite(id)` rather than mutating the `Set` separately. Keep the existing toast copy.

- [ ] **Step 4: Run existing and new tests**

Run: `node --test tests/home-feed-page.test.js tests/*.test.js`

Expected: all tests PASS; no regression to existing favorites behavior.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/home-feed-page.test.js
git commit -m "refactor: expose shared favorites bridge"
```

---

### Task 5: Browser controller, card behavior, filters, dwell tracking, and infinite loading

**Files:**
- Create: `home-feed.js`
- Expand test: `tests/home-feed-page.test.js`

**Interfaces:**
- Consumes `HomeFeedSources`, `HomeFeedRanking`, `HomeFeedState`, `MyCenterFavorites`.
- Produces: `HomeFeed.renderCard(item,{saved,recycled}) -> string`.
- Produces: `HomeFeed.filterMode(items,mode,savedIds) -> HomeFeedItem[]`.
- Produces: `HomeFeed.init(document,env) -> Promise<controller|null>`.
- Controller exposes `appendBatch()`, `setMode(mode)`, `refreshOrder()`, `destroy()` for tests/debugging.

- [ ] **Step 1: Add failing render/wiring assertions**

```js
test('home feed renderer exposes source, feedback controls and deep link',()=>{
  const H=require('../home-feed.js');
  const html=H.renderCard({id:'coach:x',source:'coach',type:'concept',title:'כותרת',summary:'קצר',fullText:'הרחבה',deepLink:'coach.html',tags:[],expandable:true,metadata:{}},{saved:false,recycled:false});
  assert.ok(html.includes('data-home-item="coach:x"'));
  assert.ok(html.includes('data-home-action="more"'));
  assert.ok(html.includes('data-home-action="less"'));
  assert.ok(html.includes('data-home-action="hide"'));
  assert.ok(html.includes('פתח לעומק'));
});
```

- [ ] **Step 2: Run and verify red**

Run: `node --test tests/home-feed-page.test.js`

Expected: FAIL because `home-feed.js` does not exist.

- [ ] **Step 3: Implement the UMD controller**

Required batch size: 12 cards. Required sentinel root margin: `700px 0px`.

Card actions must be rendered as:

```html
<div class="home-card-actions">
  <button type="button" data-home-action="save">♡ שמור</button>
  <button type="button" data-home-action="more">＋ יותר מזה</button>
  <button type="button" data-home-action="less">－ פחות מזה</button>
  <button type="button" data-home-action="hide">× לא להציג כרגע</button>
</div>
```

Behavior:
- save calls `MyCenterFavorites.toggle(item.id)` and mirrors `state.profile.saved` from `MyCenterFavorites.all()` before re-ranking/filtering.
- more/less call `HomeFeedState.recordSignal` with `more`/`less`, save state, and update future ranking; the current card stays in place.
- hide calls `recordSignal(...,'hide')`, persists, removes the card from DOM, and fills its slot with the next item.
- click on an expandable short card toggles its `.home-card-expanded` block unless the click originated in a button/link.
- click on a deep card records `open` and follows `deepLink`; the explicit `פתח לעומק` anchor does the same.
- listen for `mycenter:favorites-changed` so external favorite actions update the `שמורים` filter immediately.

Dwell tracking must use a second `IntersectionObserver`. When a card is at least 60% visible, store `performance.now()` by ID; when it leaves that threshold, add the elapsed milliseconds through `recordSignal(...,'dwell',elapsed)`. Save at most once per visibility exit, not on every scroll event.

Infinite feed behavior:

```js
const observer=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting)) appendBatch();
},{rootMargin:'700px 0px'});
observer.observe(document.getElementById('home-feed-sentinel'));
```

When the first daily order is exhausted, increment `cycleIndex`, call `buildRecycleCycle`, and render the next repeated card with `recycled:true` so the UI may show `↻ חזרה חכמה` without pretending it is new content.

Scroll position: debounce `window.scrollY` persistence to ~250 ms. After initial cards render, restore `state.day.scrollY` with `requestAnimationFrame(()=>scrollTo(0,savedY))`.

Source failures: render a small status line such as `מוזיקה לא נטענה כרגע · שאר הפיד ממשיך` only when `collectAll` returns an error for that source.

- [ ] **Step 4: Run page tests and syntax check**

Run:

```bash
node --test tests/home-feed-page.test.js
node --check home-feed.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add home-feed.js tests/home-feed-page.test.js
git commit -m "feat: add interactive infinite home feed"
```

---

### Task 6: Replace the homepage mosaic with the unified feed shell

**Files:**
- Modify: `index.html`
- Create: `home-feed.css`
- Expand test: `tests/home-feed-page.test.js`

**Interfaces:**
- Required DOM IDs: `home-feed-toolbar`, `home-feed-status`, `home-feed-list`, `home-feed-sentinel`.
- Required filter buttons use `data-home-filter` with values: `for-you`, `all`, `raika`, `coach`, `volleyball`, `languages`, `music`, `library`, `verses`, `saved`.

- [ ] **Step 1: Add failing homepage structure assertions**

```js
test('index is a unified feed, not the old section mosaic',()=>{
  const html=read('index.html');
  ['home-feed-toolbar','home-feed-status','home-feed-list','home-feed-sentinel'].forEach(id=>assert.ok(html.includes(`id="${id}"`)));
  ['for-you','all','raika','coach','volleyball','languages','music','library','verses','saved'].forEach(mode=>assert.ok(html.includes(`data-home-filter="${mode}"`)));
  ['home-feed.css','home-feed-state.js','home-feed-sources.js','home-feed-ranking.js','home-feed.js'].forEach(file=>assert.ok(html.includes(file)));
  assert.equal(html.includes('id="daily-verses"'),false);
  assert.equal(html.includes('⚡ ראיקה היום'),false);
  assert.equal(html.includes('🏐 היום כמאמן'),false);
});
```

- [ ] **Step 2: Run and verify red**

Run: `node --test tests/home-feed-page.test.js`

Expected: FAIL on missing feed shell and legacy sections still present.

- [ ] **Step 3: Replace the old homepage sections in `index.html`**

Keep the existing header/top actions and bottom navigation. Replace the content between header and bottom nav with:

```html
<section class="home-feed-hero">
  <p class="eyebrow">המרכז שלי</p>
  <h1>מה מעניין אותי היום?</h1>
  <p>ראיקה, כדורעף, אימון, שפות, מוזיקה, ספרים ופסוקים — בפיד אחד שממשיך איתי לאורך היום.</p>
</section>
<section id="home-feed-toolbar" class="home-feed-toolbar" aria-label="סינון הפיד">
  <button class="home-filter active" data-home-filter="for-you" aria-pressed="true">✨ בשבילי</button>
  <button class="home-filter" data-home-filter="all">הכול</button>
  <button class="home-filter" data-home-filter="raika">⚡ ראיקה</button>
  <button class="home-filter" data-home-filter="coach">🧠 מאמן</button>
  <button class="home-filter" data-home-filter="volleyball">🏐 כדורעף</button>
  <button class="home-filter" data-home-filter="languages">🌍 שפות</button>
  <button class="home-filter" data-home-filter="music">🎵 מוזיקה</button>
  <button class="home-filter" data-home-filter="library">📚 ספרייה</button>
  <button class="home-filter" data-home-filter="verses">📖 פסוקים</button>
  <button class="home-filter" data-home-filter="saved">♥ שמורים</button>
</section>
<p id="home-feed-status" class="home-feed-status" aria-live="polite">טוען את הפיד…</p>
<main id="home-feed-list" class="home-feed-list" aria-live="polite"></main>
<div id="home-feed-sentinel" class="home-feed-sentinel" aria-label="טעינת תוכן נוסף"><span></span><span></span><span></span></div>
```

Load existing sources before the controller, in this order:

```html
<script src="app.js?v=4"></script>
<script src="raika-data.js"></script>
<script src="coach-feed-data.js"></script>
<script src="volleyball-data.js"></script>
<script src="language-feed-model.js?v=2"></script>
<script src="language-four-feed-model.js?v=1"></script>
<script src="library-discovery.js"></script>
<script src="daily-verses.js?v=2"></script>
<script src="home-feed-state.js?v=1"></script>
<script src="home-feed-sources.js?v=1"></script>
<script src="home-feed-ranking.js?v=1"></script>
<script src="home-feed.js?v=1"></script>
```

`home-feed.js` must construct its environment using the existing globals/lexical globals safely:

```js
const env={
  raikaData:typeof RAIKA_DATA!=='undefined'?RAIKA_DATA:null,
  coachData:globalThis.CoachFeedData,
  volleyballCards:typeof VOLLEYBALL_FEED_CARDS!=='undefined'?VOLLEYBALL_FEED_CARDS:[],
  languageModel:globalThis.LanguageFeedModel,
  libraryDiscovery:globalThis.LibraryDiscovery,
  fetchVerses:typeof fetchPublicVerses==='function'?fetchPublicVerses:null,
  fetchLibraryPayload:()=>fetch('https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Library ${r.status}`);return r.json()}),
  fetchMusicHtml:()=>fetch('music.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Music ${r.status}`);return r.text()})
};
```

- [ ] **Step 4: Add `home-feed.css`**

CSS requirements:
- sticky horizontal filter row under the header on small screens;
- one-column feed up to ~760 px for comfortable reading, centered in the app;
- clear source badge differences without hardcoding inaccessible low-contrast text;
- `.home-feed-card`, `.home-card-head`, `.home-source-badge`, `.home-card-actions`, `.home-card-expanded`, `.home-recycled-badge`, `.home-feed-sentinel`;
- action buttons wrap on narrow screens;
- bottom padding must clear the fixed bottom nav.

Use existing CSS variables/classes where available rather than introducing a second visual system.

- [ ] **Step 5: Run integration checks**

Run:

```bash
node --test tests/home-feed-page.test.js
node --check home-feed-state.js
node --check home-feed-sources.js
node --check home-feed-ranking.js
node --check home-feed.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html home-feed.css tests/home-feed-page.test.js
git commit -m "feat: turn homepage into unified smart feed"
```

---

### Task 7: CI coverage and full regression verification

**Files:**
- Create: `.github/workflows/home-feed-test.yml`

**Interfaces:**
- CI must run on pull requests that touch the unified homepage files and on pushes to `home-unified-smart-feed` and `main`.

- [ ] **Step 1: Add the workflow**

```yaml
name: Home Feed Tests

on:
  push:
    branches: ['home-unified-smart-feed', 'main']
    paths:
      - 'index.html'
      - 'app.js'
      - 'home-feed-*.js'
      - 'home-feed.css'
      - 'tests/home-feed-*.test.js'
      - '.github/workflows/home-feed-test.yml'
  pull_request:
    paths:
      - 'index.html'
      - 'app.js'
      - 'home-feed-*.js'
      - 'home-feed.css'
      - 'tests/home-feed-*.test.js'
      - '.github/workflows/home-feed-test.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Run full test suite
        run: node --test tests/*.test.js
      - name: Check home feed scripts
        run: |
          node --check home-feed-state.js
          node --check home-feed-sources.js
          node --check home-feed-ranking.js
          node --check home-feed.js
```

- [ ] **Step 2: Run the complete local suite before integration**

Run:

```bash
node --test tests/*.test.js
node --check app.js
node --check home-feed-state.js
node --check home-feed-sources.js
node --check home-feed-ranking.js
node --check home-feed.js
```

Expected: zero failing tests and zero syntax errors.

- [ ] **Step 3: Browser smoke test on the branch deployment/preview path**

Verify manually:
1. Default tab is `✨ בשבילי`.
2. First 12 cards contain multiple sources when inventory permits.
3. Scrolling near the sentinel appends another batch automatically.
4. `יותר מזה` changes later ranking but does not remove the current card.
5. `פחות מזה` lowers later frequency.
6. `לא להציג כרגע` removes the card and it does not return that day.
7. `♡ שמור` updates both the card and `♥ שמורים` filter.
8. Short card expansion stays in the feed; deep card opens its source page.
9. Reload restores the same daily order and approximate scroll position.
10. Changing the stored day key in devtools (or testing the next day) creates a new daily order while keeping preferences/saved items.
11. Simulate one failed source fetch; remaining sources still render and a small status notice appears.
12. Raika items retain their status metadata; no proposal/developing item is relabeled as canon.

- [ ] **Step 4: Commit CI**

```bash
git add .github/workflows/home-feed-test.yml
git commit -m "ci: verify unified home feed"
```

- [ ] **Step 5: Final branch verification before merge**

Run `node --test tests/*.test.js` one final time from the branch head and confirm GitHub Actions `Home Feed Tests` succeeds. Only then open/merge the PR to `main`; after merge, verify the GitHub Pages deployment succeeds before claiming the live homepage has changed.

---

## Self-Review Result

- Spec coverage: all approved requirements map to Tasks 1–7: direct source adapters, daily persistence, smart ranking, diversity, filters, feedback controls, saved items, short/deep behavior, infinite loading, recycle cycles, failure isolation, and live deployment verification.
- Placeholder scan: no TBD/TODO/future placeholders remain.
- Interface consistency: `HomeFeedItem`, `FeedState`, filter mode names, daily seed, shared favorites event, and controller method names are consistent across tasks.
- Scope: one cohesive homepage subsystem; no unrelated refactor is included.