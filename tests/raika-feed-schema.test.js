const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const path = 'supabase/migrations/20260913_raika_feed.sql';

test('Raika feed migration defines private card and feedback storage', () => {
  assert.equal(fs.existsSync(path), true);
  const sql = fs.readFileSync(path, 'utf8');
  assert.match(sql, /create table if not exists public\.raika_feed_cards/i);
  assert.match(sql, /create table if not exists public\.raika_feed_feedback/i);
  assert.match(sql, /creativity_distance[\s\S]*close[\s\S]*natural[\s\S]*wild/i);
  assert.match(sql, /signature text not null/i);
  assert.match(sql, /promoted_item_id text/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)\s*=\s*user_id/i);
  assert.match(sql, /more_like/i);
  assert.match(sql, /converted_scene/i);
});
