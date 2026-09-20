const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('site editor validation runs read-only checks on edit branches',()=>{
  const yml=read('.github/workflows/site-editor-validation.yml');
  assert.match(yml,/site-edit\/\*\*/);
  assert.match(yml,/permissions:\s*\n\s*contents:\s*read/);
  assert.match(yml,/node --test tests\/\*\.test\.js/);
  assert.match(yml,/site-editor-policy-check\.mjs/);
  assert.doesNotMatch(yml,/contents:\s*write/);
});

test('site editor policy checker rejects secret-like files and private keys',()=>{
  const src=read('scripts/site-editor-policy-check.mjs');
  for(const marker of ['origin/main','PRIVATE KEY','.env','.pem','.key']) assert.ok(src.includes(marker));
});


test('publish status is tied to the exact approved head sha',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(gh,/check-runs/);
  assert.match(fn,/refresh_status/);
  assert.match(fn,/head_sha/);
  assert.match(fn,/stale_plan/);
  assert.match(fn,/preview_ready/);
  assert.match(fn,/site_edit_runs/);
});
