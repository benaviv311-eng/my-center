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


test('every top-level page loads the site chat directly or through app.js', () => {
  const pages = fs.readdirSync('.').filter(name => name.endsWith('.html'));
  const missing = pages.filter(name => {
    const html = read(name);
    return !/app\.js/.test(html) && !/site-chat\.js/.test(html);
  });
  assert.deepEqual(missing, []);
});


test('site chat accepts pasted, picked and dropped images with previews', () => {
  const js = read('site-chat.js');
  const css = read('site-chat.css');
  assert.match(js, /type="file"/);
  assert.match(js, /accept="image\/\*"/);
  assert.match(js, /clipboardData/);
  assert.match(js, /dragover/);
  assert.match(js, /drop/);
  assert.match(js, /pendingImages/);
  assert.match(js, /FileReader/);
  assert.match(js, /data-chat-remove-image/);
  assert.match(css, /site-chat-image-preview/);
});

test('site chat can send an image without requiring text and renders image history', () => {
  const js = read('site-chat.js');
  assert.match(js, /image_attachments/);
  assert.match(js, /signed_url/);
  assert.match(js, /site-chat-message-image/);
  assert.match(js, /if\(!q&&!state\.pendingImages\.length\)return/);
});

test('site chat backend stores private image attachments and sends them to OpenAI vision', () => {
  const migration = 'supabase/migrations/20260919_site_chat_images.sql';
  assert.equal(fs.existsSync(migration), true);
  const sql = read(migration);
  assert.match(sql, /create table if not exists public\.site_chat_attachments/i);
  assert.match(sql, /site-chat-images/);
  assert.match(sql, /public\s*=\s*false/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)/i);

  const fn = read('supabase/functions/site-chat/index.ts');
  assert.match(fn, /site_chat_attachments/);
  assert.match(fn, /site-chat-images/);
  assert.match(fn, /createSignedUrl/);
  assert.match(fn, /input_image/);
  assert.match(fn, /image_url/);
  assert.match(fn, /MAX_IMAGE_BYTES/);
  assert.match(fn, /ALLOWED_IMAGE_TYPES/);
});


test('image-only messages give the vision model an explicit instruction', () => {
  const fn = read('supabase/functions/site-chat/index.ts');
  assert.match(fn, /המשתמש צירף תמונה ללא טקסט/);
  assert.match(fn, /questionForModel/);
});


test('paste handling supports clipboard image items as well as clipboard files', () => {
  const js = read('site-chat.js');
  assert.match(js, /clipboardData\?\.items/);
  assert.match(js, /getAsFile/);
});


test('PWA cache is refreshed for the image-enabled chat assets', () => {
  const sw = read('sw.js');
  const app = read('app.js');
  assert.match(sw, /my-center-pwa-v4/);
  assert.match(app, /site-chat\.js\?v=2/);
  assert.match(app, /site-chat\.css\?v=2/);
  const standalone = ['book.html','four-languages.html','language-archive.html','language-topics.html','language-vocabulary.html','library.html'];
  for (const page of standalone) {
    const html = read(page);
    assert.match(html, /site-chat\.js\?v=2/);
    assert.match(html, /site-chat\.css\?v=2/);
  }
});


test('site editor schema is owner-readable and client-write-closed', () => {
  const sql = read('supabase/migrations/20260919_site_editor_core.sql');
  for (const table of ['site_edit_requests','site_edit_operations','site_edit_approvals','site_edit_runs','site_edit_events']) {
    assert.match(sql, new RegExp('create table if not exists public\\.' + table, 'i'));
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security', 'i'));
  }
  assert.match(sql, /for select\s+to authenticated/i);
  assert.doesNotMatch(sql, /for all\s+to authenticated/i);
  assert.match(sql, /risk_level text not null check \(risk_level in \('low','medium','high'\)\)/i);
  assert.match(sql, /status text not null/i);
  assert.match(sql, /approved_head_sha/i);
});


test('site editor indexes cover all new foreign keys', () => {
  const sql = read('supabase/migrations/20260919_site_editor_core_indexes.sql');
  for (const marker of [
    'site_edit_approvals_user_idx',
    'site_edit_events_user_idx',
    'site_edit_requests_thread_idx',
    'site_edit_requests_undo_idx'
  ]) assert.ok(sql.includes(marker));
});
