const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const edgePath='supabase/functions/raika-feed/index.ts';
const migrationPath='supabase/migrations/20260928_raika_idea_engine.sql';

test('Raika idea engine migration stores base pool and permanent user blocks securely',()=>{
  assert.equal(fs.existsSync(migrationPath),true);
  const sql=fs.readFileSync(migrationPath,'utf8');
  assert.match(sql,/create table if not exists public\.raika_idea_pool/i);
  assert.match(sql,/create table if not exists public\.raika_idea_blocks/i);
  assert.match(sql,/unique \(user_id, semantic_fingerprint\)/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/\(select auth\.uid\(\)\) = user_id/i);
  assert.match(sql,/revoke all on table public\.raika_idea_pool from anon, authenticated/i);
});

test('Raika feed edge function implements refresh_all with base fallback and permanent blocking',()=>{
  const src=fs.readFileSync(edgePath,'utf8');
  assert.match(src,/requestData\.action==='block_forever'/);
  assert.match(src,/raika_idea_blocks/);
  assert.match(src,/requestData\.action==='refresh_all'/);
  assert.match(src,/raika_idea_pool/);
  assert.match(src,/source_mix/);
  assert.match(src,/dynamic/);
  assert.match(src,/base/);
  assert.match(src,/if\(!apiKey&&requestData\.action==='refresh_all'\)/);
});

test('refresh inserts source metadata so later permanent blocking can identify the premise',()=>{
  const src=fs.readFileSync(edgePath,'utf8');
  assert.match(src,/semantic_fingerprint/);
  assert.match(src,/plot_family/);
  assert.match(src,/source_type/);
  assert.match(src,/idea_id/);
});
