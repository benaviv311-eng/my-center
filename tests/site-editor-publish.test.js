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


test('preview is tokenized read-only and pinned to an exact head sha',()=>{
  const preview=read('supabase/functions/site-preview/index.ts');
  const migration=read('supabase/migrations/20260920_site_editor_preview.sql');
  const editor=read('supabase/functions/site-editor/index.ts');
  assert.match(migration,/token_hash/);
  assert.match(migration,/expires_at/);
  assert.match(migration,/head_sha/);
  assert.match(preview,/raw\.githubusercontent\.com/);
  assert.match(preview,/Cache-Control/);
  assert.match(preview,/no-store/);
  assert.match(preview,/X-Robots-Tag/);
  assert.match(preview,/noindex/);
  assert.match(preview,/serviceWorker/);
  assert.doesNotMatch(preview,/GITHUB_APP_PRIVATE_KEY/);
  assert.match(editor,/create_preview/);
  assert.match(editor,/site_edit_previews/);
});


test('validated edits publish with exact-sha approval and live verification',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/approve_publish/);
  assert.match(fn,/action==='publish'/);
  assert.match(fn,/awaiting_publish_approval/);
  assert.match(fn,/risk_level==="low"/);
  assert.match(fn,/low_risk_auto_publish_approved/);
  assert.match(fn,/deploying/);
  assert.match(fn,/deployed/);
  assert.match(fn,/github_pages_content/);
  assert.match(fn,/SITE_PUBLIC_BASE_URL/);
  assert.match(gh,/githubFastForwardMain/);
  assert.match(gh,/currentMain!==expectedBaseSha/);
  assert.match(gh,/force:false/);
});
