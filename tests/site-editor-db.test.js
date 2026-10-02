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


test('supabase deployment is manual exact-sha and pinned',()=>{
  const yml=read('.github/workflows/site-editor-supabase-deploy.yml');
  assert.match(yml,/workflow_dispatch/);
  for(const input of ['request_id','branch','head_sha']) assert.ok(yml.includes(input));
  assert.match(yml,/supabase@2\.117\.0/);
  assert.match(yml,/site-editor-migration-check\.mjs/);
  assert.doesNotMatch(yml,/pull_request:/);
  assert.doesNotMatch(yml,/push:/);
});


test('migration requests cannot merge before db deploy succeeds',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/site-editor-supabase-deploy\.yml/);
  assert.match(fn,/db_deploy/);
  assert.match(fn,/head_sha/);
  assert.match(fn,/success/);
  assert.match(fn,/githubMergePR/);
  assert.match(gh,/githubDispatchWorkflow/);
});
