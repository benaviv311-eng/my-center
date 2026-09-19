const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');

test('site chat loads editor UI and exposes three modes',()=>{
  const js=read('site-editor-ui.js');
  const app=read('app.js');
  assert.match(app,/site-editor-ui\.js\?v=1/);
  assert.match(app,/site-editor-ui\.css\?v=1/);
  assert.match(js,/consult/);
  assert.match(js,/edit/);
  assert.match(js,/work/);
  assert.match(js,/✏️ עריכה/);
  assert.match(js,/⚡ עבודה/);
});

test('standalone chat pages load site editor assets',()=>{
  for(const path of ['book.html','four-languages.html','language-archive.html','language-topics.html','language-vocabulary.html','library.html']){
    const html=read(path);
    assert.match(html,/site-editor-ui\.css\?v=1/);
    assert.match(html,/site-editor-ui\.js\?v=1/);
  }
});

test('site chat installs editor UI with authenticated editor API',()=>{
  const chat=read('site-chat.js');
  assert.match(chat,/SiteEditorUI\.install/);
  assert.match(chat,/site-editor/);
  assert.match(chat,/chatState:state/);
  assert.match(chat,/pageContext/);
});


test('change cards show risk files and approval controls',()=>{
  const js=read('site-editor-ui.js');
  for(const marker of ['מאשר','שנה את ההצעה','בטל','risk_level','requires_preview','public_asset_warning']) assert.ok(js.includes(marker));
  assert.match(js,/approve_plan/);
  assert.match(js,/request_revision/);
  assert.match(js,/cancel/);
  for(const code of ['owner_required','stale_plan','unsafe_plan','editor_unavailable']) assert.ok(js.includes(code));
});
