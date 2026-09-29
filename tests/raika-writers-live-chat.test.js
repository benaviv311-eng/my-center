const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Writers Room exposes a central live creative chat',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  for(const id of ['raika-live-chat','rwc-messages','rwc-input','rwc-send','rwc-new-chat']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/צ׳אט יצירתי חי/);
  assert.match(html,/raika-writers-chat\.css\?v=1/);
  assert.match(html,/raika-writers-chat\.js\?v=1/);
  assert.ok(html.indexOf('id="raika-live-chat"')<html.indexOf('id="raika-feed"'),'chat should appear before the idea feed');
});

test('live writers chat keeps thread context and calls a dedicated server endpoint',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  assert.match(src,/raika-writers-chat-v1/);
  assert.match(src,/localStorage/);
  assert.match(src,/history/);
  assert.match(src,/functions\/v1\/raika-writers-chat/);
  assert.match(src,/base_context/);
  assert.match(src,/RaikaFeedContext/);
  assert.match(src,/rwc-new-chat/);
});

test('chat responses can be saved as idea, scene, noncanon plotline, or verse',()=>{
  const src=fs.readFileSync('raika-writers-chat.js','utf8');
  for(const kind of ['idea','scene','plotline','verse']){
    assert.match(src,new RegExp("data-rwc-save=."+kind));
  }
  assert.match(src,/RaikaWorkspaceClient\.save/);
  assert.match(src,/noncanon-plotline/);
  assert.match(src,/writers-verse/);
  assert.match(src,/status:'developing'/);
});

test('writers chat edge function is canon-aware and creates on-demand content',()=>{
  const src=fs.readFileSync('supabase/functions/raika-writers-chat/index.ts','utf8');
  assert.match(src,/gpt-5\.6-sol/);
  assert.match(src,/history/);
  assert.match(src,/base_context/);
  assert.match(src,/raika_item_edits/);
  assert.match(src,/הצעה בלבד/);
  assert.match(src,/לא קאנון/);
  assert.match(src,/json_schema/);
  assert.match(src,/items/);
});
