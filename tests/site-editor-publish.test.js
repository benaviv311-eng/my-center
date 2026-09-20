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
