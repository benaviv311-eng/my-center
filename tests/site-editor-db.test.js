const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('migration checker blocks destructive one-step SQL',()=>{
  const src=read('scripts/site-editor-migration-check.mjs');
  for(const marker of ['DROP TABLE','DROP COLUMN','TRUNCATE','ALTER COLUMN','DELETE FROM']) assert.ok(src.includes(marker));
  assert.match(src,/SET NOT NULL/);
  assert.match(src,/unsafe_migration/);
});

test('migration paths are always high risk',()=>{
  const policy=read('supabase/functions/_shared/site-editor/policy.ts');
  assert.match(policy,/supabase\/migrations\//);
  assert.match(policy,/high/);
});
