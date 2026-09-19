# Coach Training Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, data-driven "מעבדת האימון" page that turns diverse volleyball/coaching sources into searchable, source-aware, child-friendly practice tools linked from both the Coach Hub and Volleyball Hub.

**Architecture:** The feature is static-first and has no new backend. `coach-training-lab-data.js` owns curated content and vocabularies; `coach-training-lab.js` exposes pure validation/search/matching/comparison functions in Node and progressively enhances the browser UI; `coach-training-lab.html` is a thin shell; `coach-training-lab.css` provides mobile-first presentation. Favorites and "האימון הבא" use guarded `localStorage`.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript (UMD/CommonJS-compatible for Node tests), Node 24 built-in `node:test`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-19-coach-training-lab-design.md`

## Global Constraints

- No new backend or Supabase dependency in v1.
- Content and UI remain separate; large content banks live in `coach-training-lab-data.js`, not HTML.
- v1 ships approximately 40–50 high-quality entries, not a shallow bulk dump.
- Every `drill` must include non-empty `childExplanation`, `sayExactly`, and `oneCue`.
- Research-marked items must include a real source publisher, title, URL, source claim, science summary, and identifiable publication date/year.
- Every internet source stores `sourceUrl` and `sourceAccessedAt`; unknown publication dates are left unknown rather than invented.
- Source claim, our interpretation, and practical application remain separate fields.
- At least four source families must be represented in the starter bank.
- Copyrighted source material is summarized/paraphrased; no long copied passages.
- Comparison UI never invents filler: 5+ approaches renders "אותו רעיון — 5 דרכים"; 2–4 renders the actual count; 0–1 renders no comparison control.
- Mobile cards are one column, controls are touch-friendly, and no core view requires horizontal table scrolling.
- Search/viewing work without network access once static assets are loaded.
- Development follows TDD: each production behavior is preceded by a failing test.

## Review Focus

1. **Mixed Hebrew grade notation:** queries such as `קבלה כיתה ה`, `הגנה ז׳`, and `כיתות ה-ו` should map to the correct `grades` without confusing them with free-text tags.
2. **Partial quick-match fallback:** when no item satisfies every constraint, results must explicitly report mismatched constraints rather than silently pretending to be exact.
3. **Broken/unavailable localStorage:** save/next-practice actions must still work in-memory for the current page session and must not crash rendering.
4. **Internet source metadata drift:** an item with an HTTP(S) source but no `sourceAccessedAt` must fail validation; a research item with no publication date/year must fail validation.
5. **Comparison duplication:** cards from the same publisher with materially identical titles within one `comparisonGroup` must not count as distinct approaches.

---

### Task 1: Define the data contract and validation engine

**Files:**
- Create: `coach-training-lab-data.js`
- Create: `coach-training-lab.js`
- Create: `tests/coach-training-lab.test.js`

**Interfaces:**
- Produces `CoachTrainingLabData` with `LAB_TOPICS`, `LAB_LEVELS`, `LAB_TYPES`, `LAB_SOURCE_KINDS`, `LAB_EVIDENCE_STRENGTHS`, `LAB_ITEMS`.
- Produces `CoachTrainingLab.validateItem(item)`, `validateData(items)`, `isValidHttpUrl(value)`, and `normalizeText(value)`.
- Later tasks consume the exact item field names from the spec.

- [ ] **Step 1: Write failing schema tests**

Create `tests/coach-training-lab.test.js` with:

```js
const test=require('node:test');
const assert=require('node:assert/strict');

function load(){
  delete require.cache[require.resolve('../coach-training-lab-data.js')];
  delete require.cache[require.resolve('../coach-training-lab.js')];
  return {
    ...require('../coach-training-lab-data.js'),
    ...require('../coach-training-lab.js')
  };
}

test('training-lab exports the approved vocabularies',()=>{
  const {LAB_TOPICS,LAB_TYPES,LAB_SOURCE_KINDS,LAB_EVIDENCE_STRENGTHS}=load();
  for(const topic of ['reception','defense','serve','attack','block','setting','movement','perception','motor-learning','power-jump','coaching-language','psychology']){
    assert.ok(LAB_TOPICS.some(item=>item.id===topic), `missing topic ${topic}`);
  }
  assert.deepEqual(new Set(LAB_TYPES),new Set(['drill','principle','science','teaching-method','scenario','comparison']));
  assert.ok(LAB_SOURCE_KINDS.includes('research'));
  assert.ok(LAB_EVIDENCE_STRENGTHS.includes('practice-based'));
});

test('a drill cannot validate without child-facing language',()=>{
  const {validateItem}=load();
  const result=validateItem({
    id:'d1',title:'קבלה',type:'drill',summary:'x',topics:['reception'],
    grades:['ה'],levels:['beginner'],objective:'x',setup:'x',steps:['x'],
    sourceKind:'training-idea',evidenceStrength:'practice-based',tags:[]
  });
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('childExplanation'));
  assert.ok(result.errors.includes('sayExactly'));
  assert.ok(result.errors.includes('oneCue'));
});

test('research and internet sources enforce traceable metadata',()=>{
  const {validateItem}=load();
  const result=validateItem({
    id:'r1',title:'מחקר',type:'science',summary:'x',topics:['power-jump'],
    levels:['advanced'],sourceKind:'research',evidenceStrength:'strong',tags:[],
    sourcePublisher:'Journal',sourceTitle:'Paper',sourceUrl:'https://example.org/paper',
    sourceClaim:'claim',science:'science'
  });
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('sourceDate'));
  assert.ok(result.errors.includes('sourceAccessedAt'));
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test tests/coach-training-lab.test.js
```

Expected: FAIL because `coach-training-lab-data.js` and `coach-training-lab.js` do not exist.

- [ ] **Step 3: Add the minimal data vocabulary module**

Create `coach-training-lab-data.js` using the repository's UMD pattern:

```js
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachTrainingLabData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const LAB_TOPICS=[
    {id:'reception',label:'קבלה'},
    {id:'defense',label:'הגנה'},
    {id:'serve',label:'הגשה'},
    {id:'attack',label:'התקפה'},
    {id:'block',label:'חסימה'},
    {id:'setting',label:'הרמה'},
    {id:'movement',label:'תנועה'},
    {id:'perception',label:'תפיסה וקבלת החלטות'},
    {id:'motor-learning',label:'למידה מוטורית'},
    {id:'power-jump',label:'כוח וקפיצה'},
    {id:'coaching-language',label:'שפת אימון'},
    {id:'psychology',label:'פסיכולוגיה'}
  ];
  const LAB_LEVELS=['beginner','developing','intermediate','advanced'];
  const LAB_TYPES=['drill','principle','science','teaching-method','scenario','comparison'];
  const LAB_SOURCE_KINDS=['research','official-body','coaching-organization','professional-practice','training-idea','our-interpretation'];
  const LAB_EVIDENCE_STRENGTHS=['strong','moderate','limited','practice-based','interpretation'];
  const LAB_ITEMS=[];

  return {LAB_TOPICS,LAB_LEVELS,LAB_TYPES,LAB_SOURCE_KINDS,LAB_EVIDENCE_STRENGTHS,LAB_ITEMS};
});
```

- [ ] **Step 4: Add minimal validation implementation**

Create `coach-training-lab.js` with UMD exports and implement:

```js
function normalizeText(value){
  return String(value==null?'':value).normalize('NFKD').replace(/[׳’']/g,'').trim().toLowerCase();
}

function isValidHttpUrl(value){
  try{
    const url=new URL(value);
    return url.protocol==='http:'||url.protocol==='https:';
  }catch(_error){
    return false;
  }
}

function validateItem(item,data){
  const errors=[];
  const required=['id','title','type','summary','topics','levels','sourceKind','evidenceStrength','tags'];
  for(const key of required){
    const value=item?.[key];
    if(value==null||value===''||(Array.isArray(value)&&value.length===0)) errors.push(key);
  }
  if(item?.type==='drill'){
    for(const key of ['objective','setup','steps','childExplanation','sayExactly','oneCue']){
      const value=item[key];
      if(value==null||value===''||(Array.isArray(value)&&value.length===0)) errors.push(key);
    }
    if((!item.ages||item.ages.length===0)&&(!item.grades||item.grades.length===0)) errors.push('ages|grades');
  }
  if(item?.sourceKind==='research'){
    for(const key of ['sourcePublisher','sourceTitle','sourceUrl','sourceClaim','science','sourceDate']){
      if(!item[key]) errors.push(key);
    }
  }
  if(item?.sourceUrl){
    if(!isValidHttpUrl(item.sourceUrl)) errors.push('sourceUrl');
    if(!item.sourceAccessedAt) errors.push('sourceAccessedAt');
  }
  return {valid:errors.length===0,errors:[...new Set(errors)]};
}

function validateData(items,data){
  const errors=[];
  const ids=new Set();
  for(const item of items||[]){
    const result=validateItem(item,data);
    if(!result.valid) errors.push({id:item?.id||null,errors:result.errors});
    if(ids.has(item.id)) errors.push({id:item.id,errors:['duplicate-id']});
    ids.add(item.id);
  }
  return {valid:errors.length===0,errors};
}
```

Pass the vocabulary arrays from `window.CoachTrainingLabData` in the browser or `require('./coach-training-lab-data.js')` in Node.

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
node --test tests/coach-training-lab.test.js
node --check coach-training-lab-data.js
node --check coach-training-lab.js
```

Expected: PASS.

- [ ] **Step 6: Add validation tests for duplicate IDs and allowed enums**

Append:

```js
test('data validation rejects duplicate ids and invalid enum values',()=>{
  const {validateData}=load();
  const base={
    title:'x',summary:'x',topics:['reception'],levels:['beginner'],
    sourceKind:'training-idea',evidenceStrength:'practice-based',tags:[]
  };
  const result=validateData([
    {id:'x',type:'principle',...base},
    {id:'x',type:'made-up',...base}
  ]);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(x=>x.errors.includes('duplicate-id')));
  assert.ok(result.errors.some(x=>x.errors.includes('type')));
});
```

Update `validateItem` to verify `type`, `topics`, `levels`, `sourceKind`, and `evidenceStrength` against the exported vocabularies.

- [ ] **Step 7: Run Task 1 suite**

Run:

```bash
node --test tests/coach-training-lab.test.js
```

Expected: all Task 1 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add coach-training-lab-data.js coach-training-lab.js tests/coach-training-lab.test.js
git commit -m "feat: define training lab data contract"
```

---

### Task 2: Curate and validate the 40–50 item starter bank

**Files:**
- Modify: `coach-training-lab-data.js`
- Modify: `tests/coach-training-lab.test.js`

**Interfaces:**
- Consumes the Task 1 schema.
- Produces a static `LAB_ITEMS` bank containing 40–50 source-aware entries.
- Comparison-capable entries use `comparisonGroup`.

- [ ] **Step 1: Add failing starter-bank quality tests**

Append:

```js
test('starter bank has 40-50 validated entries and broad topic coverage',()=>{
  const {LAB_ITEMS,LAB_TOPICS,validateData}=load();
  assert.ok(LAB_ITEMS.length>=40&&LAB_ITEMS.length<=50, `got ${LAB_ITEMS.length}`);
  assert.equal(validateData(LAB_ITEMS).valid,true);
  for(const topic of LAB_TOPICS){
    assert.ok(LAB_ITEMS.some(item=>item.topics.includes(topic.id)), `no content for ${topic.id}`);
  }
});

test('starter bank represents at least four source families',()=>{
  const {LAB_ITEMS}=load();
  const families=new Set(LAB_ITEMS.map(item=>item.sourceKind));
  assert.ok(families.size>=4,[...families].join(', '));
});

test('every internet source is dated by access and every drill is child-readable',()=>{
  const {LAB_ITEMS}=load();
  for(const item of LAB_ITEMS){
    if(item.sourceUrl){
      assert.match(item.sourceAccessedAt,/^\d{4}-\d{2}-\d{2}$/);
      assert.match(item.sourceUrl,/^https?:\/\//);
    }
    if(item.type==='drill'){
      assert.ok(item.childExplanation.length>=20,item.id);
      assert.ok(item.sayExactly.length>=10,item.id);
      assert.ok(item.oneCue.length>=3,item.id);
    }
  }
});

test('comparison seed groups cover the approved six themes',()=>{
  const {LAB_ITEMS}=load();
  const groups=new Set(LAB_ITEMS.map(x=>x.comparisonGroup).filter(Boolean));
  for(const group of ['reception','read-hitter','teach-serve','decision-making','feedback','jump-training']){
    assert.ok(groups.has(group),`missing comparison group ${group}`);
    assert.ok(LAB_ITEMS.filter(x=>x.comparisonGroup===group).length>=2,`${group} needs multiple approaches`);
  }
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test tests/coach-training-lab.test.js
```

Expected: FAIL because `LAB_ITEMS` is empty.

- [ ] **Step 3: Curate sources before writing entries**

Use current web research, not memory alone. For each source family below, open the primary/official page and capture only the claim needed for a card:

- USA Volleyball — coach tools, game-like learning, reading/decision drills.
- FIVB — coaching manuals/tools and volleyball teaching progressions.
- Volleyball England / Volleyball Canada — youth and beginner progressions.
- AVCA / JVA — coaching education, drills, practice design.
- The Art of Coaching Volleyball / Gold Medal Squared — practice concepts and coach education that are publicly accessible.
- NSCA and peer-reviewed research — jump load, plyometrics, strength/power, motor learning, feedback, external focus, variability.

For every internet-backed item, record:
- `sourcePublisher`
- `sourceTitle`
- `sourceUrl`
- `sourceDate` when known
- `sourceAccessedAt:'2026-09-19'`
- concise `sourceClaim` in original paraphrase
- `ourInterpretation`
- `application`

Do not copy long passages. Do not infer a research strength from a coaching article.

- [ ] **Step 4: Populate the first 20–24 entries**

Add a balanced first half covering:
- reception/defense
- serve/block
- perception/game-like
- motor learning

Use a consistent object shape. A representative item should look like:

```js
{
  id:'reception-read-server-01',
  title:'לקרוא את המגיש לפני שהכדור יוצא',
  type:'drill',
  summary:'תרגיל קבלה שבו המקבל אינו יודע מראש לאיזה אזור תגיע ההגשה.',
  topics:['reception','perception'],
  ages:[10,11,12,13,14],
  grades:['ה','ו','ז','ח'],
  levels:['developing','intermediate'],
  durationMinutes:12,
  minPlayers:4,
  maxPlayers:12,
  objective:'לחבר בין קריאת המגיש לתנועה מוקדמת לקבלה.',
  gameContext:'במשחק המקבל צריך להגיב למידע מהמגיש, לא למסלול ידוע מראש.',
  setup:'מגיש בצד אחד, 2–3 מקבלים ואזור מטרה.',
  steps:['המגיש בוחר בין שני אזורי יעד','המקבלים קוראים את ההגשה','הכדור מתקבל לאזור המטרה'],
  scoring:'נקודה לקבלה שמאפשרת הרמה יציבה.',
  coachLooksFor:['מבט למגיש לפני היציאה','צעד ראשון מוקדם','פלטפורמה יציבה'],
  commonMistakes:['יציאה לפני קריאת ההגשה','מבט רק בכדור אחרי המגע'],
  simplify:['להגביל את המגיש לשני אזורים רחבים'],
  progressions:['להוסיף אזור שלישי','להוסיף מעבר להתקפה'],
  variations:['ניקוד כפול על קבלה מכדור קשה'],
  whenNotToUse:'כששחקנים עדיין אינם מסוגלים לשלוט בקבלה בסיסית בצורה בטוחה.',
  science:'התרגיל שומר מידע תפיסתי שקיים במשחק ומחבר אותו לפעולה.',
  evidenceStrength:'practice-based',
  sourcePublisher:'USA Volleyball',
  sourceTitle:'Coaches Tools',
  sourceUrl:'https://usavolleyball.org/resources-for-coaches/coaches-tools/',
  sourceDate:null,
  sourceAccessedAt:'2026-09-19',
  sourceKind:'official-body',
  sourceClaim:'USA Volleyball מדגישה תרגול שבו השחקן קורא את סביבת המשחק ומקבל החלטה ולא רק משחזר תנועה קבועה.',
  ourInterpretation:'בקבלה, אי-ודאות מבוקרת מחזירה את הקשר בין תפיסה לתנועה.',
  application:'התחל בשתי אפשרויות הגשה והרחב את הבחירה בהדרגה.',
  childExplanation:'המגיש יכול לבחור לאן לשלוח. אתם מסתכלים עליו, מזהים לאן הכדור מתחיל ללכת וזזים אליו.',
  sayExactly:'אל תנחשו. תסתכלו על המגיש. הכדור יוצא — עכשיו זזים אליו ומביאים אותו למטרה.',
  oneCue:'רואים — זזים — מוסרים.',
  comparisonGroup:'reception',
  tags:['קבלה','קריאת מגיש','game-like']
}
```

- [ ] **Step 5: Populate the remaining entries to 40–50**

Add the second half covering:
- attack/setting
- power/jump
- coaching language
- psychology
- children/beginners
- six comparison groups

Keep at least two distinct source publishers in every comparison group where public sources allow it. If a group cannot support five high-quality entries, stop below five.

- [ ] **Step 6: Add a test preventing fake comparison diversity**

Append:

```js
test('comparison groups count distinct approaches, not duplicate publisher-title pairs',()=>{
  const {LAB_ITEMS}=load();
  for(const group of new Set(LAB_ITEMS.map(x=>x.comparisonGroup).filter(Boolean))){
    const items=LAB_ITEMS.filter(x=>x.comparisonGroup===group);
    const keys=items.map(x=>`${x.sourcePublisher||'internal'}|${x.title}`.toLowerCase());
    assert.equal(new Set(keys).size,keys.length,`duplicate approach in ${group}`);
  }
});
```

- [ ] **Step 7: Run Task 2 suite**

Run:

```bash
node --test tests/coach-training-lab.test.js
node --check coach-training-lab-data.js
```

Expected: PASS with 40–50 validated entries.

- [ ] **Step 8: Commit**

```bash
git add coach-training-lab-data.js tests/coach-training-lab.test.js
git commit -m "content: add training lab starter bank"
```

---

### Task 3: Implement search, filters, comparisons, and quick matching

**Files:**
- Modify: `coach-training-lab.js`
- Modify: `tests/coach-training-lab.test.js`

**Interfaces:**
- Produces `parseGradeTokens(query)`.
- Produces `filterItems(items, filters)`.
- Produces `searchItems(items, query, filters)`.
- Produces `getComparison(items, group)`.
- Produces `comparisonLabel(items, group)`.
- Produces `recommendNow(items, request, limit=4)` returning `[{item, exact, mismatches, score}]`.

- [ ] **Step 1: Write failing search/filter tests**

Append:

```js
test('search handles Hebrew grade tokens and topic text',()=>{
  const {LAB_ITEMS,searchItems}=load();
  const results=searchItems(LAB_ITEMS,'קבלה כיתה ה',{});
  assert.ok(results.length>0);
  assert.ok(results.every(item=>item.topics.includes('reception')));
  assert.ok(results.some(item=>(item.grades||[]).includes('ה')));
});

test('filters combine topic level type source and evidence',()=>{
  const {LAB_ITEMS,filterItems}=load();
  const source=LAB_ITEMS.find(x=>x.type==='drill'&&x.topics.includes('defense'));
  assert.ok(source);
  const results=filterItems(LAB_ITEMS,{
    topic:'defense',
    level:source.levels[0],
    type:'drill',
    sourceKind:source.sourceKind,
    evidenceStrength:source.evidenceStrength
  });
  assert.ok(results.length>0);
  assert.ok(results.every(x=>x.topics.includes('defense')));
});
```

- [ ] **Step 2: Write failing quick-match and comparison tests**

Append:

```js
test('quick match returns exact items when constraints fit',()=>{
  const {recommendNow}=load();
  const items=[
    {id:'a',topics:['defense'],grades:['ז'],levels:['developing'],durationMinutes:12,minPlayers:6,maxPlayers:14},
    {id:'b',topics:['defense'],grades:['ח'],levels:['advanced'],durationMinutes:25,minPlayers:2,maxPlayers:6}
  ];
  const results=recommendNow(items,{topic:'defense',grade:'ז',level:'developing',minutes:15,players:12},4);
  assert.equal(results[0].item.id,'a');
  assert.equal(results[0].exact,true);
  assert.deepEqual(results[0].mismatches,[]);
});

test('quick match explains partial mismatch instead of pretending exact',()=>{
  const {recommendNow}=load();
  const items=[{id:'a',topics:['defense'],grades:['ז'],levels:['developing'],durationMinutes:20,minPlayers:6,maxPlayers:12}];
  const [result]=recommendNow(items,{topic:'defense',grade:'ז',level:'developing',minutes:15,players:12},4);
  assert.equal(result.exact,false);
  assert.ok(result.mismatches.includes('time'));
});

test('comparison label reflects the actual number of distinct approaches',()=>{
  const {comparisonLabel}=load();
  const items=[
    {comparisonGroup:'reception',sourcePublisher:'A',title:'one'},
    {comparisonGroup:'reception',sourcePublisher:'B',title:'two'},
    {comparisonGroup:'reception',sourcePublisher:'C',title:'three'}
  ];
  assert.equal(comparisonLabel(items,'reception'),'אותו רעיון — 3 דרכים');
  assert.equal(comparisonLabel(items,'missing'),'');
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
node --test tests/coach-training-lab.test.js
```

Expected: FAIL because the search/match/comparison functions do not exist.

- [ ] **Step 4: Implement Hebrew grade parsing and searchable haystacks**

Implement:

```js
const GRADE_ALIASES={
  'ג':'ג','ד':'ד','ה':'ה','ו':'ו','ז':'ז','ח':'ח','ט':'ט',
  'י':'י','יא':'יא','יב':'יב'
};

function parseGradeTokens(query){
  const raw=normalizeText(query)
    .replace(/כיתות?/g,' ')
    .replace(/כיתה/g,' ')
    .replace(/[״"]/g,'')
    .replace(/[-–—]/g,' ');
  return raw.split(/\s+/).map(x=>GRADE_ALIASES[x]).filter(Boolean);
}

function searchableText(item){
  return normalizeText([
    item.title,item.summary,...(item.topics||[]),...(item.tags||[]),
    item.childExplanation,item.oneCue,item.sourcePublisher,item.application
  ].filter(Boolean).join(' '));
}
```

Then implement `filterItems` and `searchItems` so grade tokens constrain `grades` and remaining terms search the haystack.

- [ ] **Step 5: Implement comparison grouping**

`getComparison(items, group)`:
- filters by `comparisonGroup`
- removes duplicate `sourcePublisher|title` keys
- returns at most 5
- preserves source-bank order

`comparisonLabel`:
- 0–1 -> `''`
- 2–4 -> `אותו רעיון — X דרכים`
- 5+ -> `אותו רעיון — 5 דרכים`

- [ ] **Step 6: Implement quick-match scoring**

Use hard exact checks first. For each item calculate mismatches:
- `topic`
- `grade`
- `level`
- `time`
- `players`

Return exact matches first, then closest partial matches. Score exact dimensions positively, but never erase the `mismatches` array. Limit to 2–4 when the caller passes `limit=4`.

- [ ] **Step 7: Run Task 3 tests**

Run:

```bash
node --test tests/coach-training-lab.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add coach-training-lab.js tests/coach-training-lab.test.js
git commit -m "feat: add training lab discovery logic"
```

---

### Task 4: Implement guarded persistence and rendering helpers

**Files:**
- Modify: `coach-training-lab.js`
- Modify: `tests/coach-training-lab.test.js`

**Interfaces:**
- Produces `createStorageAdapter(storage,key)`, `toggleStoredId(adapter,id)`, `readStoredIds(adapter)`.
- Produces `renderCard(item, state)`, `renderDetail(item, comparisonItems)`, `renderQuickMatchResult(result)`.
- Browser state uses keys `coachTrainingLab:favorites:v1` and `coachTrainingLab:nextPractice:v1`.

- [ ] **Step 1: Write failing storage tests**

Append:

```js
test('storage adapter survives unavailable localStorage and keeps session memory',()=>{
  const {createStorageAdapter}=load();
  const broken={
    getItem(){throw new Error('blocked');},
    setItem(){throw new Error('blocked');}
  };
  const adapter=createStorageAdapter(broken,'x');
  adapter.write(['a']);
  assert.deepEqual(adapter.read(),['a']);
});

test('stored ids toggle without duplicates',()=>{
  const {createStorageAdapter,toggleStoredId}=load();
  const map=new Map();
  const storage={
    getItem:k=>map.get(k)||null,
    setItem:(k,v)=>map.set(k,v)
  };
  const adapter=createStorageAdapter(storage,'x');
  toggleStoredId(adapter,'a');
  toggleStoredId(adapter,'a');
  assert.deepEqual(adapter.read(),[]);
});
```

- [ ] **Step 2: Write failing render-helper tests**

Append:

```js
test('drill detail exposes child language and source/interpretation separately',()=>{
  const {LAB_ITEMS,renderDetail}=load();
  const item=LAB_ITEMS.find(x=>x.type==='drill');
  const html=renderDetail(item,[]);
  assert.match(html,/מה אני אומר לילדים/);
  assert.match(html,/תגיד בדיוק כך/);
  assert.match(html,/משפט מפתח/);
  assert.match(html,/מה המקור אומר/);
  assert.match(html,/הפרשנות שלנו/);
  assert.match(html,/יישום באימון/);
});

test('partial quick-match output names the mismatched constraint',()=>{
  const {renderQuickMatchResult}=load();
  const html=renderQuickMatchResult({item:{id:'x',title:'תרגיל'},exact:false,mismatches:['time'],score:3});
  assert.match(html,/זמן/);
  assert.doesNotMatch(html,/התאמה מלאה/);
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
node --test tests/coach-training-lab.test.js
```

Expected: FAIL because storage/render helpers do not exist.

- [ ] **Step 4: Implement guarded storage**

Implement `createStorageAdapter` with:
- an internal in-memory array initialized from valid JSON if possible
- `read()` returning a copy
- `write(ids)` deduping string IDs and attempting `storage.setItem`
- caught storage errors never escaping

Implement `toggleStoredId(adapter,id)`.

- [ ] **Step 5: Implement semantic render helpers**

Escape all user/content strings with the same safe HTML helper pattern used elsewhere in the repo.

`renderCard` includes:
- type
- title
- summary
- age/grade/level summary
- duration/player summary when available
- source publisher
- evidence label
- oneCue when present
- buttons with `data-lab-action`

`renderDetail` includes independent sections for:
- objective/game context
- setup/steps/scoring
- coach looks for/common mistakes
- simplify/progressions/variations
- "מה אני אומר לילדים"
- science/evidence
- source claim
- our interpretation
- application
- when not to use
- source link only when `isValidHttpUrl` returns true

- [ ] **Step 6: Run Task 4 tests**

Run:

```bash
node --test tests/coach-training-lab.test.js
node --check coach-training-lab.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add coach-training-lab.js tests/coach-training-lab.test.js
git commit -m "feat: add training lab card actions"
```

---

### Task 5: Build the page shell, browser controller, and mobile design

**Files:**
- Create: `coach-training-lab.html`
- Create: `coach-training-lab.css`
- Modify: `coach-training-lab.js`
- Create: `tests/coach-training-lab-integration.test.js`

**Interfaces:**
- HTML IDs consumed by the browser controller:
  - `training-lab-search`
  - `training-lab-filters`
  - `training-lab-results`
  - `training-lab-count`
  - `training-lab-detail`
  - `training-lab-now-form`
  - `training-lab-now-results`
  - `training-lab-favorites`
  - `training-lab-next-practice`
- Browser controller exposes no new global API beyond `window.CoachTrainingLab`.

- [ ] **Step 1: Write failing integration tests**

Create `tests/coach-training-lab-integration.test.js`:

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));

test('training lab page contains the required work areas',()=>{
  assert.equal(exists('coach-training-lab.html'),true);
  const html=read('coach-training-lab.html');
  for(const id of [
    'training-lab-search','training-lab-filters','training-lab-results',
    'training-lab-count','training-lab-detail','training-lab-now-form',
    'training-lab-now-results','training-lab-favorites','training-lab-next-practice'
  ]){
    assert.match(html,new RegExp(`id=["']${id}["']`),id);
  }
  assert.match(html,/מעבדת האימון/);
});

test('data loads before lab logic and page has no backend dependency',()=>{
  const html=read('coach-training-lab.html');
  const dataIndex=html.indexOf('coach-training-lab-data.js');
  const appIndex=html.indexOf('coach-training-lab.js');
  assert.ok(dataIndex>=0&&appIndex>dataIndex);
  assert.doesNotMatch(html,/supabase/i);
  assert.doesNotMatch(html,/functions\/v1/);
});

test('training lab scripts have valid JavaScript syntax',()=>{
  for(const file of ['coach-training-lab-data.js','coach-training-lab.js']){
    const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,`${file}: ${result.stderr}`);
  }
});

test('mobile CSS keeps the core results as one column',()=>{
  const css=read('coach-training-lab.css');
  assert.match(css,/\.training-lab-results[^\{]*\{[^}]*grid-template-columns\s*:\s*1fr/s);
  assert.match(css,/@media\s*\(max-width:\s*640px\)/);
});
```

- [ ] **Step 2: Run integration tests and verify RED**

Run:

```bash
node --test tests/coach-training-lab-integration.test.js
```

Expected: FAIL because the HTML/CSS do not exist.

- [ ] **Step 3: Create the HTML shell**

Build `coach-training-lab.html` with:
- back links to `coach.html` and `volleyball.html`
- hero/title
- search input
- filter controls populated by JS
- "אני צריך משהו עכשיו" form with players, grade, level, minutes, topic
- results count
- one-column results container
- detail dialog/panel
- favorites section
- next-practice section
- bottom navigation consistent with the site
- scripts in order: `coach-training-lab-data.js`, `coach-training-lab.js`, `app.js`, `mobile-app-shell.js?v=1`

Use native labels and accessible buttons; every form control gets a `label` or `aria-label`.

- [ ] **Step 4: Implement browser initialization in `coach-training-lab.js`**

Add `initTrainingLab(doc,data)` that:
- renders filter choices from vocabulary arrays
- renders initial items
- updates count
- responds to search/filter input
- opens details on card click
- handles `favorite`, `next-practice`, `child-language`, `why`, `compare`
- runs quick-match form through `recommendNow`
- renders favorites and next-practice from storage adapters
- never runs DOM code in Node

Initialize on `DOMContentLoaded` only when the expected root element exists.

- [ ] **Step 5: Add mobile-first CSS**

Create `coach-training-lab.css` with:
- visual language compatible with `coach-hub.css`
- `.training-lab-results{display:grid;grid-template-columns:1fr;gap:...}`
- sticky/compact filter bar where practical
- large `min-height:44px` interactive controls
- prominent child-language panel
- distinct evidence/source panel
- modal/detail layout without horizontal overflow
- mobile breakpoint at `max-width:640px`
- desktop max-width readable content, but results remain one column

- [ ] **Step 6: Add a browser-controller behavior test by source inspection**

Append to the integration test:

```js
test('browser controller wires search, quick match, favorites and next-practice actions',()=>{
  const js=read('coach-training-lab.js');
  for(const token of ['initTrainingLab','recommendNow','favorite','next-practice','training-lab-now-form']){
    assert.match(js,new RegExp(token.replace('-','\\-')));
  }
});
```

- [ ] **Step 7: Run Task 5 tests**

Run:

```bash
node --test tests/coach-training-lab*.test.js
node --check coach-training-lab.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add coach-training-lab.html coach-training-lab.css coach-training-lab.js tests/coach-training-lab-integration.test.js
git commit -m "feat: build training lab interface"
```

---

### Task 6: Link the lab from Coach and Volleyball and add CI coverage

**Files:**
- Modify: `coach.html`
- Modify: `volleyball.html`
- Modify: `tests/coach-training-lab-integration.test.js`
- Create: `.github/workflows/coach-training-lab-test.yml`

**Interfaces:**
- Produces stable link target `coach-training-lab.html`.
- CI runs all training-lab tests on pushes to `main`, `feature/coach-*`, and relevant pull requests.

- [ ] **Step 1: Add failing navigation tests**

Append:

```js
test('coach and volleyball hubs both link prominently to the training lab',()=>{
  for(const file of ['coach.html','volleyball.html']){
    const html=read(file);
    assert.match(html,/href=["']coach-training-lab\.html["']/,`${file} missing lab link`);
    assert.match(html,/מעבדת האימון/,`${file} missing lab label`);
  }
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node --test tests/coach-training-lab-integration.test.js
```

Expected: FAIL because the hub links do not yet exist.

- [ ] **Step 3: Add the Coach Hub link**

In `coach.html`, add a visually prominent CTA or card near the existing "מהתיאוריה למגרש" / world navigation, linking to `coach-training-lab.html` and labeled `🧪 מעבדת האימון`.

Do not remove or rename the six existing coach worlds.

- [ ] **Step 4: Add the Volleyball Hub link**

In `volleyball.html`, add a prominent `🧪 מעבדת האימון` link near the hero/root actions or discovery tools. Keep the existing volleyball app link and population/topic feed behavior unchanged.

- [ ] **Step 5: Add CI workflow**

Create `.github/workflows/coach-training-lab-test.yml`:

```yaml
name: Coach training lab tests

on:
  push:
    branches:
      - main
      - 'feature/coach-*'
  pull_request:
    paths:
      - 'coach-training-lab.*'
      - 'coach.html'
      - 'volleyball.html'
      - 'tests/coach-training-lab*.test.js'
      - '.github/workflows/coach-training-lab-test.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: node --test tests/coach-training-lab*.test.js
```

- [ ] **Step 6: Run focused and existing Coach tests**

Run:

```bash
node --test tests/coach-training-lab*.test.js
node --test tests/coach-feed.test.js tests/coach-performance-hub.test.js
```

Expected: PASS with no regressions to the existing Coach Hub.

- [ ] **Step 7: Commit**

```bash
git add coach.html volleyball.html tests/coach-training-lab-integration.test.js .github/workflows/coach-training-lab-test.yml
git commit -m "feat: link training lab across coaching hubs"
```

---

### Task 7: Final source audit, full verification, and deployment readiness

**Files:**
- Modify only if verification reveals a failing test or metadata defect in:
  - `coach-training-lab-data.js`
  - `coach-training-lab.js`
  - `coach-training-lab.html`
  - `coach-training-lab.css`
  - tests

**Interfaces:**
- No new interfaces.
- This task proves the spec is met and the branch is ready for integration.

- [ ] **Step 1: Audit every sourced item**

Programmatically print or inspect every item with `sourceUrl` and verify:
- URL is HTTP(S)
- publisher/title are present
- access date is `2026-09-19` or later if refreshed during execution
- research items have source date/year
- sourceClaim is a concise paraphrase
- evidenceStrength matches the nature of the evidence
- no long copied source passage exists

If a source cannot be verified, downgrade/remove the claim rather than keeping uncertain attribution.

- [ ] **Step 2: Check starter-bank distribution**

Run a small Node command:

```bash
node - <<'NODE'
const d=require('./coach-training-lab-data.js');
const byTopic={};
const bySource={};
for(const x of d.LAB_ITEMS){
  for(const t of x.topics) byTopic[t]=(byTopic[t]||0)+1;
  bySource[x.sourceKind]=(bySource[x.sourceKind]||0)+1;
}
console.log({count:d.LAB_ITEMS.length,byTopic,bySource});
NODE
```

Expected:
- count 40–50
- all 12 topics non-zero
- at least four source kinds represented

- [ ] **Step 3: Run the complete relevant test suite**

Run:

```bash
node --test tests/coach-training-lab*.test.js
node --test tests/coach-feed.test.js tests/coach-performance-hub.test.js
node --check coach-training-lab-data.js
node --check coach-training-lab.js
```

Expected: all PASS.

- [ ] **Step 4: Verify branch scope**

Compare the feature branch to `main`. Expected changed paths are limited to:
- spec and plan docs
- `coach-training-lab.html`
- `coach-training-lab.css`
- `coach-training-lab-data.js`
- `coach-training-lab.js`
- `coach.html`
- `volleyball.html`
- `tests/coach-training-lab*.test.js`
- `.github/workflows/coach-training-lab-test.yml`

If unrelated files appear, stop and remove them from the feature branch before integration.

- [ ] **Step 5: Verify GitHub Actions**

Confirm the latest `Coach training lab tests` run for the feature branch is successful. If it fails, fix via TDD and re-run before declaring completion.

- [ ] **Step 6: Commit any verification-only corrections**

Only if Step 1–5 required corrections:

```bash
git add coach-training-lab-data.js coach-training-lab.js coach-training-lab.html coach-training-lab.css tests/coach-training-lab*.test.js
git commit -m "fix: finalize training lab verification"
```

- [ ] **Step 7: Use finishing-development-branch workflow**

After the branch is green, invoke `superpowers:finishing-a-development-branch` and present the integration choices required by that workflow. Do not merge the branch without the user's integration choice.
