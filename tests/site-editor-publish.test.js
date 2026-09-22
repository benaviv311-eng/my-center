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

test('publish requires explicit approval and merges the exact validated head without force',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/action==='approve_publish'/);
  assert.match(fn,/stage:"publish"/);
  assert.match(fn,/approved_head_sha/);
  assert.match(fn,/preview_ready/);
  assert.match(fn,/awaiting_publish_approval/);
  assert.match(fn,/merging/);
  assert.match(fn,/deploying/);
  assert.match(gh,/githubMergeBranchIntoMain/);
  assert.match(gh,/parents:\[expectedMainSha,expectedHeadSha\]/);\n  assert.match(gh,/force:false/);
  assert.match(gh,/expectedHeadSha/);
  assert.match(gh,/expectedMainSha/);
  assert.doesNotMatch(gh,/force\s*:\s*true/);
});

test('deployment state is pinned to the merge sha and waits for GitHub Pages success',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/merge_commit_sha/);
  assert.match(fn,/deploy_status/);
  assert.match(fn,/published_at/);
  assert.match(fn,/deployed/);
  assert.match(gh,/githubActionsRunsForHeadSha/);
  assert.match(gh,/actions\/runs/);
  assert.match(gh,/head_sha/);
  assert.match(fn,/pages build and deployment/);
});
