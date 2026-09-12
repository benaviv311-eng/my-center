# Raika Sheets Task 3 — UI State and End-to-End Verification

### Task 4: Show synchronization state in the writers room

**Files:**
- Modify: `raika-private.js`
- Modify: `styles.css`
- Test: `tests/raika-private.test.js`

**Interfaces:**
- `syncStatusHtml(item)` returns no Google badge for drafts.
- Canon/archive items show either `☁️ סונכרן לשיטס` or `⚠️ ממתין לסנכרון`.
- Pending state exposes `נסה סנכרון שוב` and calls workspace action `retry_sync`.

- [ ] **Step 1: Write failing badge tests**

```js
const {syncStatusHtml}=require('../raika-private.js');

test('pending canon exposes retry state',()=>{
  const html=syncStatusHtml({status:'canon',_sync:{status:'pending'}});
  assert.match(html,/ממתין לסנכרון/);
  assert.match(html,/נסה סנכרון שוב/);
});

test('synced canon shows success without retry',()=>{
  const html=syncStatusHtml({status:'canon',_sync:{status:'synced'}});
  assert.match(html,/סונכרן לשיטס/);
  assert.doesNotMatch(html,/נסה סנכרון שוב/);
});

test('draft does not claim Google sync',()=>{
  assert.equal(syncStatusHtml({status:'idea'}),'');
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/raika-private.test.js`

- [ ] **Step 3: Implement badge rendering and retry handler**

`retry_sync` updates only the local `_sync` object from the workspace response. Failure leaves the card content and canon/archive status unchanged and displays the bounded error message.

- [ ] **Step 4: Run all Raika tests**

Run: `node --test tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raika-private.js styles.css tests/raika-private.test.js
git commit -m "feat: show Raika Sheets sync state"
```

### Task 5: End-to-end production verification

**Files:**
- Modify only if verification reveals a defect.

- [ ] **Step 1: Ground the live Sheet immediately before writes**

Read workbook `העולם שלי` metadata and exact A:H cells in tab `עולם ראיקה`. Confirm G/H remain available for managed sync metadata and preserve all unrelated rows.

- [ ] **Step 2: Verify drafts remain private**

Create one temporary writers-room item with a unique stable ID, save it as `idea`, and search column G. Expected: no matching row.

- [ ] **Step 3: Verify approval creates exactly one managed row**

Approve the temporary item. Expected: one G match, C=`✅ קאנון`, and the UI reports either synced immediately or pending with a retry option if Google is temporarily unavailable.

- [ ] **Step 4: Verify approved edits update the same row**

Change title/body and Save while status remains canon. Expected: still one G match; A/B reflect the new content.

- [ ] **Step 5: Verify archive preserves history**

Use Delete on the approved item. Expected: Supabase status `archived`; the same Sheet row remains; C=`🗄️ ארכיון`.

- [ ] **Step 6: Verify retry idempotency**

Invoke sync retry twice for the same item. Expected: column G still contains exactly one managed row for that ID.

- [ ] **Step 7: Clean only verification data**

Remove only the temporary test item and its test row. Do not alter any pre-existing Raika records.

- [ ] **Step 8: Final verification before completion claim**

Run: `node --test tests/raika-*.test.js`

Run Supabase security advisors. Verify GitHub CI and Pages deployment. Open live `raika.html` and confirm public read-only mode still works and authenticated mode shows the correct Sheet sync badge.
