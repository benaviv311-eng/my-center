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


test('risk classifier promotes sensitive paths and broad edits', () => {
  const src = read('supabase/functions/_shared/site-editor/policy.ts');
  for (const marker of ['supabase/migrations/','supabase/functions/','.github/workflows/','sw.js']) assert.ok(src.includes(marker));
  assert.match(src,/operations\.length\s*>\s*10/);
  assert.match(src,/unknown_operation/);
  assert.match(src,/blocked_path/);
});

test('replace_text requires exact text count and expected sha', () => {
  const src = read('supabase/functions/_shared/site-editor/operations.ts');
  assert.match(src,/expected_occurrences/);
  assert.match(src,/expected_sha/);
  assert.match(src,/stale_plan/);
});


test('site editor exposes proposal and plan approval actions with model configuration', () => {
  const src = read('supabase/functions/site-editor/index.ts');
  for (const marker of ["requireOwner","action==='propose'","action==='get'","action==='approve_plan'","action==='cancel'","site_edit_requests","site_edit_operations","site_edit_events","site-edit/","SITE_EDITOR_MODEL_STRONG","SITE_EDITOR_MODEL_FAST"]) assert.ok(src.includes(marker));
  assert.match(src,/response_format|json_schema|strict/i);
  assert.match(src,/githubCreateEditBranch/);
  assert.match(src,/githubCommitFiles/);
  assert.match(src,/awaiting_plan_approval/);
  assert.match(src,/needs_replan/);
});

test('site chat can route source edits to the site editor instead of forbidding them', () => {
  const src = read('supabase/functions/site-chat/index.ts');
  assert.match(src,/site_edit_request/);
  assert.match(src,/site-editor/);
  assert.doesNotMatch(src,/אין לבצע שינויי קוד מקור מתוך הצ׳אט החי/);
});


test('github helper converts GitHub RSA PEM format', () => {
  const src = read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(src,/pkcs1ToPkcs8/);
  assert.match(src,/RSA PRIVATE KEY/);
});


test('site editor supports request revisions for work mode', () => {
  const src = read('supabase/functions/site-editor/index.ts');
  assert.match(src,/action==='request_revision'/);
  assert.match(src,/revision_requested/);
  assert.match(src,/awaiting_plan_approval/);
});


test('site editor lists and restores owned requests', () => {
  const src = read('supabase/functions/site-editor/index.ts');
  assert.match(src,/action==='list_requests'/);
  assert.match(src,/action==='get_request'/);
  assert.match(src,/site_edit_requests/);
  assert.match(src,/site_edit_operations/);
});
