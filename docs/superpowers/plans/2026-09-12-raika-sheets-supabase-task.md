# Raika Sheets Task 2 — Supabase Sync and Retry

### Task 3: Add server-side sync helper

**Files:**
- Create: `supabase/functions/_shared/raika-sheet-sync.mjs`
- Create: `tests/raika-sheet-sync.test.mjs`
- Modify: `supabase/functions/raika-workspace/index.ts`

**Interfaces:**
- `syncWithBridge(url, bridgeValue, item, fetchImpl)` returns `{status:'synced',synced_at,row}` or `{status:'pending',error}`.
- `raika-workspace` gains action `retry_sync`.

- [ ] **Step 1: Write failing success/failure tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {syncWithBridge} from '../supabase/functions/_shared/raika-sheet-sync.mjs';

test('successful bridge response becomes synced',async()=>{
  const fake=async()=>({ok:true,json:async()=>({ok:true,row:8,synced_at:'now'})});
  const result=await syncWithBridge('https://example.invalid','x',{item_id:'r1',status:'canon'},fake);
  assert.deepEqual(result,{status:'synced',synced_at:'now',row:8});
});

test('network error becomes pending rather than throwing',async()=>{
  const fake=async()=>{throw new Error('network')};
  const result=await syncWithBridge('https://example.invalid','x',{item_id:'r1',status:'canon'},fake);
  assert.equal(result.status,'pending');
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/raika-sheet-sync.test.mjs`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the helper**

The production wrapper obtains its bridge endpoint and server-side authorization value from Supabase function configuration. `syncWithBridge()` posts an `archive` operation when `item.status==='archived'`, otherwise `upsert`. A non-OK response or exception is converted into a bounded `pending` result instead of escaping into the approval flow.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/raika-sheet-sync.test.mjs`

Expected: PASS.

- [ ] **Step 5: Trigger sync only after Supabase state is durable**

Modify `raika-workspace` so the database write/version snapshot happens first. Then sync after:
- `approve`
- `save` when resulting status is `canon`
- `archive`
- `restore` when restored status is `canon` or `archived`

Write the result into the active payload:

```js
payload._sync=result.status==='synced'
  ? {status:'synced',last_synced_at:result.synced_at,row:result.row}
  : {status:'pending',last_error:result.error,last_synced_at:payload._sync?.last_synced_at||null};
```

A Google failure must never change the already-persisted canon/archive status.

- [ ] **Step 6: Add `retry_sync`**

Require an existing active row whose status is `canon` or `archived`. Reuse its stable item ID, perform no content/status mutation, call the same sync helper, and update only `payload._sync`.

- [ ] **Step 7: Run full tests**

Run: `node --test tests/raika-sheet-sync.test.mjs tests/raika-workspace-core.test.mjs tests/raika-*.test.js`

Expected: PASS.

- [ ] **Step 8: Deploy and verify**

Deploy the updated Edge Function only after its Google-bridge server configuration is present. Approve one temporary item and inspect the returned `_sync`; force one development failure and confirm the response remains canon with `_sync.status==='pending'`.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/_shared/raika-sheet-sync.mjs supabase/functions/raika-workspace/index.ts tests/raika-sheet-sync.test.mjs
git commit -m "feat: sync approved Raika items to Sheets"
```
