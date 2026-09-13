const test=require('node:test');
const assert=require('node:assert/strict');

test('workspace core validates actions and payloads',async()=>{
  const core=await import('../supabase/functions/_shared/raika-workspace-core.mjs');
  assert.equal(core.validateAction('approve'),'approve');
  assert.throws(()=>core.validateAction('publish_all'));
  assert.equal(core.validateStatus('canon'),'canon');
  assert.throws(()=>core.validateStatus('unknown'));
  const p=core.sanitizeWorkspacePayload({title:'  title  ',summary:'x'.repeat(13000),tags:['a','b']});
  assert.equal(p.title,'title');
  assert.equal(p.summary.length,12000);
  assert.deepEqual(p.tags,['a','b']);
});
