const test=require('node:test');
const assert=require('node:assert/strict');
const w=require('../raika-workspace.js');

test('workspace merge keeps base immutable',()=>{
  const base=[{id:'one',title:'old',status:'idea'}];
  const out=w.mergeWorkspaceOverrides(base,[{item_id:'one',status:'developing',payload:{title:'new'}}]);
  assert.equal(out[0].title,'new');
  assert.equal(base[0].title,'old');
});

test('approved items archive instead of delete',()=>{
  assert.equal(w.nextDeleteAction('canon'),'archive');
  assert.equal(w.nextDeleteAction('idea'),'delete');
});

test('autosave preserves status',()=>{
  assert.equal(w.buildAutosavePayload({id:'a',type:'idea',status:'idea'}).status,'idea');
  assert.equal(w.buildAutosavePayload({id:'b',type:'scene',status:'canon'}).status,'canon');
});

test('removal payload chooses archive for canon',()=>{
  assert.deepEqual(w.buildRemovalPayload({id:'a',type:'scene',status:'canon'}),{action:'archive',item_id:'a',item_type:'scene'});
});
