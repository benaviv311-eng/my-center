# Raika Sheets Task 1 — Row Contract and Bridge

### Task 1: Define the managed A:H row contract

**Files:**
- Create: `integrations/raika-sheets-bridge.js`
- Create: `tests/raika-sheet-bridge.test.js`

**Interfaces:**
- `buildRaikaSheetRow(item, syncedAt)` returns eight cell values.
- `findManagedRow(idValues, stableId, firstDataRow=2)` returns a one-based Sheet row or `-1`.

- [ ] **Step 1: Write the failing tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const {buildRaikaSheetRow,findManagedRow}=require('../integrations/raika-sheets-bridge.js');

test('canon maps to A:H',()=>{
  const row=buildRaikaSheetRow({item_id:'r1',item_type:'scene',status:'canon',payload:{title:'רגע',summary:'טקסט'}},'now');
  assert.deepEqual(row,['רגע','טקסט','✅ קאנון','scene','אושר בחדר הכותבים','','r1','now']);
});

test('archive keeps the same stable id',()=>{
  const row=buildRaikaSheetRow({item_id:'r1',item_type:'scene',status:'archived',payload:{title:'רגע'}},'now');
  assert.equal(row[2],'🗄️ ארכיון');
  assert.equal(row[6],'r1');
});

test('existing id resolves to its existing row',()=>{
  assert.equal(findManagedRow([['r1'],['r2']],'r2',2),3);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/raika-sheet-bridge.test.js`

Expected: FAIL because the bridge module does not exist.

- [ ] **Step 3: Implement the pure helpers**

```js
function clean(v,max=12000){return String(v??'').trim().slice(0,max)}
function buildRaikaSheetRow(item,time){
  const p=item.payload||{};
  return [clean(p.title||item.title,200),clean(p.fullText||p.summary||p.body||''),item.status==='archived'?'🗄️ ארכיון':'✅ קאנון',clean(item.item_type||item.type,80),'אושר בחדר הכותבים',clean(p.opens||'',2000),clean(item.item_id||item.id,200),clean(time,80)];
}
function findManagedRow(values,id,startRow=2){
  const i=values.findIndex(r=>String(r?.[0]||'')===String(id));
  return i<0?-1:startRow+i;
}
if(typeof module!=='undefined')module.exports={buildRaikaSheetRow,findManagedRow};
```

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/raika-sheet-bridge.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add integrations/raika-sheets-bridge.js tests/raika-sheet-bridge.test.js
git commit -m "test: define Raika Sheets row contract"
```

### Task 2: Add Google-side upsert/archive behavior

**Files:**
- Modify: `integrations/raika-sheets-bridge.js`
- Test: `tests/raika-sheet-bridge.test.js`

**Interfaces:** accepted operations are `upsert` and `archive`; successful responses include `ok`, `row`, and `synced_at`.

- [ ] **Step 1: Add a failing validator test**

```js
test('only upsert and archive are accepted',()=>{
  assert.equal(validateBridgeRequest({action:'upsert',item:{item_id:'r1'}}).action,'upsert');
  assert.throws(()=>validateBridgeRequest({action:'delete',item:{item_id:'r1'}}));
});
```

- [ ] **Step 2: Implement request validation**

Require one of the two supported operations and a non-empty stable `item_id`. Archive forces status `archived` before row construction.

- [ ] **Step 3: Implement the Google Apps Script handler**

Target workbook ID `1S-qM2SZtR7xRQvDc_OH5WdEk3jZZxHn2IJjhT8CUnI0`, tab `עולם ראיקה`. Before writing, validate the server-side bridge configuration. Read only column G from row 2 through the last data row; update A:H when the stable ID exists and append one A:H row when it does not.

- [ ] **Step 4: Verify idempotency**

Use one temporary verification ID. Submit the same upsert twice and confirm exactly one row exists for it. Archive it and confirm the same row changes to `🗄️ ארכיון`.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/raika-sheet-bridge.test.js`

```bash
git add integrations/raika-sheets-bridge.js tests/raika-sheet-bridge.test.js
git commit -m "feat: add Raika Sheets upsert bridge"
```
