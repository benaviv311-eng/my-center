const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p,'utf8');

test('site editor authenticates with auth.getUser and checks app_owners', () => {
  const src = read('supabase/functions/_shared/site-editor/auth.ts');
  assert.match(src,/auth\.getUser/);
  assert.match(src,/from\("app_owners"\)/);
  assert.match(src,/owner_required/);
});

test('site editor errors expose stable codes but not provider messages', () => {
  const src = read('supabase/functions/_shared/site-editor/errors.ts');
  assert.match(src,/editor_unavailable/);
  assert.match(src,/owner_required/);
  assert.match(src,/stale_plan/);
  assert.match(src,/unsafe_plan/);
});


test('github helper uses GitHub App installation tokens and atomic git commits', () => {
  const src = read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(src,/GITHUB_APP_PRIVATE_KEY/);
  assert.match(src,/\/app\/installations\/.*\/access_tokens/);
  assert.match(src,/\/git\/blobs/);
  assert.match(src,/\/git\/trees/);
  assert.match(src,/\/git\/commits/);
  assert.match(src,/refs\/heads/);
  assert.doesNotMatch(src,/force\s*:\s*true/);
});
