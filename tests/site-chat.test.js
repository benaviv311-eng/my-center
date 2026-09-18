const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');

test('site chat client is bootstrapped globally from app.js', () => {
  assert.equal(fs.existsSync('site-chat.js'), true);
  assert.equal(fs.existsSync('site-chat.css'), true);
  const app = read('app.js');
  assert.match(app, /site-chat\.css/);
  assert.match(app, /site-chat\.js/);
});

test('site chat supports global and area conversations with current-page context', () => {
  const js = read('site-chat.js');
  assert.match(js, /צ׳אט כללי/);
  assert.match(js, /צ׳אט האזור/);
  assert.match(js, /currentArea/);
  assert.match(js, /page_context/);
  assert.match(js, /location\.pathname/);
});

test('site chat uses Supabase email auth and secure edge function, never a browser OpenAI key', () => {
  const js = read('site-chat.js');
  assert.match(js, /signInWithOtp/);
  assert.match(js, /shouldCreateUser\s*:\s*false/);
  assert.match(js, /functions\/v1\/site-chat/);
  assert.doesNotMatch(js, /OPENAI_API_KEY/);
  assert.doesNotMatch(js, /api\.openai\.com/);
});

test('site chat has approval-gated site actions and memory controls', () => {
  const js = read('site-chat.js');
  assert.match(js, /pending_action/);
  assert.match(js, /data-chat-approve/);
  assert.match(js, /data-chat-cancel/);
  assert.match(js, /מה אתה זוכר/);
  assert.match(js, /memory/i);
});

test('memory center exists and is reachable from the chat drawer', () => {
  assert.equal(fs.existsSync('memory.html'), true);
  const html = read('memory.html');
  const js = read('site-chat.js');
  assert.match(html, /מרכז הזיכרון/);
  assert.match(html, /app\.js/);
  assert.match(js, /memory\.html/);
});

test('site chat database schema is private by user and keeps history, memories, actions and revisions', () => {
  const path = 'supabase/migrations/20260918_site_chat.sql';
  assert.equal(fs.existsSync(path), true);
  const sql = read(path);
  for (const table of ['site_chat_threads','site_chat_messages','site_chat_memories','site_chat_actions','site_chat_revisions']) {
    assert.match(sql, new RegExp('create table if not exists public\\.' + table, 'i'));
  }
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /user_id/i);
});

test('site chat edge function authenticates requests, routes models, uses page and memory context, and stores messages', () => {
  const path = 'supabase/functions/site-chat/index.ts';
  assert.equal(fs.existsSync(path), true);
  const fn = read(path);
  assert.match(fn, /auth\.getUser/);
  assert.match(fn, /OPENAI_API_KEY/);
  assert.match(fn, /gpt-5\.6-luna/);
  assert.match(fn, /gpt-5\.6-sol/);
  assert.match(fn, /site_chat_messages/);
  assert.match(fn, /site_chat_memories/);
  assert.match(fn, /page_context/);
  assert.match(fn, /pending_action/);
});
