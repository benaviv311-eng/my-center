const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Writers Room exposes a persistent live AI chat before the idea feed',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/id="raika-writers-chat"/);
  assert.match(html,/id="rwc-messages"/);
  assert.match(html,/id="rwc-form"/);
  assert.match(html,/id="rwc-input"/);
  assert.match(html,/שיחה חדשה/);
  assert.ok(html.indexOf('id="raika-writers-chat"')<html.indexOf('id="raika-feed"'));
  assert.match(html,/raika-writers-chat\.js\?v=1/);
  assert.match(html,/raika-writers-chat\.css\?v=1/);
});

test('live Writers Room chat uses raika-consult with a persistent thread and canon context',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  assert.match(src,/window\.raiCall/);
  assert.match(src,/action:'history'/);
  assert.match(src,/action:'ask'/);
  assert.match(src,/raika-writers-chat-thread-v1/);
  assert.match(src,/buildCanonContext/);
  assert.match(src,/RAIKA_DATA/);
});

test('assistant chat answers can be saved as idea, scene, or non-canon plotline',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  assert.match(src,/data-rwc-save="idea"/);
  assert.match(src,/data-rwc-save="scene"/);
  assert.match(src,/data-rwc-save="plotline"/);
  assert.match(src,/RaikaWorkspaceClient\.save/);
  assert.match(src,/type:'scene'/);
  assert.match(src,/type:'plotline'/);
  assert.match(src,/לא קאנון/);
});

test('chat supports follow-up requests in the same thread and a deliberate new conversation',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  assert.match(src,/currentThreadId/);
  assert.match(src,/newConversation/);
  assert.match(src,/localStorage\.setItem/);
  assert.match(src,/rwc-messages/);
});
