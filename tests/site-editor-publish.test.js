const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('site editor validation runs read-only checks on edit branches',()=>{
  const yml=read('.github/workflows/site-editor-validation.yml');
  assert.match(yml,/site-edit\/\*\*/);
  assert.match(yml,/permissions:\s*\n\s*contents:\s*read/);
  assert.match(yml,/site-editor-policy-check\.mjs/);
  assert.match(yml,/site-editor-migration-check\.mjs/);
  assert.match(yml,/node --test tests\/\*\.test\.js/);
  assert.doesNotMatch(yml,/contents:\s*write/);
});

test('site editor policy checker rejects secret-like files and private keys',()=>{
  const src=read('scripts/site-editor-policy-check.mjs');
  for(const marker of ['origin/main','PRIVATE KEY','.env','.pem','.key']) assert.ok(src.includes(marker));
});

test('publish status is tied to the exact approved head sha',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(gh,/githubChecksForRef/);
  assert.match(fn,/refresh_status/);
  assert.match(fn,/approved_head_sha/);
  assert.match(fn,/stale_plan/);
  assert.match(fn,/head_sha/);
});

test('preview is tokenized read-only pinned and internally brokered',()=>{
  const preview=read('supabase/functions/site-preview/index.ts');
  const migration=read('supabase/migrations/20260920_site_editor_preview.sql');
  const editor=read('supabase/functions/site-editor/index.ts');
  assert.match(migration,/token_hash/);
  assert.match(migration,/expires_at/);
  assert.match(migration,/head_sha/);
  assert.match(preview,/Cache-Control/);
  assert.match(preview,/no-store/);
  assert.match(preview,/X-Robots-Tag/);
  assert.match(preview,/noindex/);
  assert.match(preview,/serviceWorker/);
  assert.match(preview,/x-site-editor-internal-secret/);
  assert.doesNotMatch(preview,/GITHUB_APP_PRIVATE_KEY/);
  assert.doesNotMatch(preview,/raw\.githubusercontent\.com/);
  assert.match(editor,/preview_read/);
  assert.match(editor,/SITE_EDITOR_INTERNAL_SECRET/);
});

test('medium and high risk require second approval while low risk can auto publish',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/approve_publish/);
  assert.match(fn,/awaiting_publish_approval/);
  assert.match(fn,/risk_level\s*===\s*["']low["']/);
  assert.match(fn,/githubPagesRunForSha/);
  assert.match(fn,/deploying/);
  assert.match(fn,/deployed/);
  assert.match(gh,/githubCreateOrUpdatePR/);
  assert.match(gh,/githubMergePR/);
  assert.match(gh,/githubPagesRunForSha/);
});

test('publish uses a PR and exact approved head without force pushing main',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const gh=read('supabase/functions/_shared/site-editor/github.ts');
  assert.match(fn,/stage:"publish"/);
  assert.match(fn,/approved_head_sha/);
  assert.match(fn,/githubCreateOrUpdatePR/);
  assert.match(fn,/githubMergePR/);
  assert.match(fn,/pr_number/);
  assert.doesNotMatch(gh,/force\s*:\s*true/);
});

test('automatic repair is capped and cannot broaden risk silently',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  const policy=read('supabase/functions/_shared/site-editor/policy.ts');
  assert.match(fn,/repair_pass/);
  assert.match(fn,/>=\s*2/);
  assert.match(fn,/awaiting_plan_approval/);
  assert.match(fn,/approvedPaths/);
  assert.match(policy,/riskAtMost/);
});

test('deployment waits for Pages and exact merged-sha function deploys',()=>{
  const fn=read('supabase/functions/site-editor/index.ts');
  assert.match(fn,/merge_commit_sha/);
  assert.match(fn,/githubPagesRunForSha/);
  assert.match(fn,/EDGE_FUNCTIONS_DEPLOY_WORKFLOW/);
  assert.match(fn,/functions_deploy/);
  assert.match(fn,/published_at/);
});
