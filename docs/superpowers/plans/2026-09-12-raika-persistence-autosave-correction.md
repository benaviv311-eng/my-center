# Raika Persistence Plan Correction — Canon Autosave

This correction is mandatory when executing `2026-09-12-raika-writers-room-persistence-plan.md` and supersedes the original `buildAutosavePayload` status line.

## Correct rule
Autosave preserves the item's current persisted story status. It must never demote existing `canon` to `developing`, and it must never promote a draft to `canon`.

Use:

```js
function buildAutosavePayload(item){
  return {
    action:'autosave',
    item_type:item.type || 'idea',
    item_id:item.id,
    status:item.status || 'idea',
    payload:{title:item.title||'',summary:item.summary||'',placement:item.placement||'',why:item.why||'',opens:item.opens||'',tags:item.tags||[],characters:item.characters||[]}
  };
}
```

Required test:

```js
test('autosave preserves current status',()=>{
  assert.equal(buildAutosavePayload({id:'a',type:'scene',status:'idea'}).status,'idea');
  assert.equal(buildAutosavePayload({id:'b',type:'scene',status:'canon'}).status,'canon');
});
```

When the Sheets-sync phase is installed, autosaving edits to an already-canon item may mark its sync metadata pending, but it still remains canon. Manual Save/retry performs the Sheet synchronization.
