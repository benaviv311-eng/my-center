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


test('inspect mode captures one element without activating it',()=>{
  const js=read('site-editor-ui.js');
  assert.match(js,/בחר מהעמוד/);
  assert.match(js,/preventDefault\(\)/);
  assert.match(js,/stopPropagation\(\)/);
  assert.match(js,/stopImmediatePropagation\(\)/);
  assert.match(js,/selectedElementContext/);
  for(const key of ['display','position','fontSize','fontWeight','color','backgroundColor','margin','padding','gap']) assert.ok(js.includes(key));
  for(const key of ['tag','id','classes','data','visible_text','dom_path','container','bounds','computed_style']) assert.ok(js.includes(key));
});


test('edit mode can receive a structured site edit request from site-chat',()=>{
  const chat=read('site-chat.js');
  const fn=read('supabase/functions/site-chat/index.ts');
  assert.match(chat,/site_edit_request/);
  assert.match(fn,/site_edit_request/);
  assert.match(fn,/selected_element/);
  assert.match(fn,/attachment_ids/);
  assert.match(chat,/selected_element/);
  assert.match(chat,/active_request_id/);
  assert.match(chat,/editor_mode/);
});


test('site changes view restores request history and active progress',()=>{
  const js=read('site-editor-ui.js');
  assert.match(js,/שינויים באתר/);
  assert.match(js,/list_requests/);
  assert.match(js,/refresh_status/);
  assert.match(js,/3000/);
  for(const stage of ['מנתח','מוצא קבצים','מכין שינוי','שומר Branch','מריץ בדיקות','Preview מוכן','ממתין לאישור','מפרסם']) assert.ok(js.includes(stage));
  const css=read('site-editor-ui.css');
  assert.match(css,/@media\(max-width:620px\)/);
  assert.match(css,/min-height:44px/);
});


test('preview action opens an expiring branch preview',()=>{
  const js=read('site-editor-ui.js');
  assert.match(js,/פתח Preview/);
  assert.match(js,/create_preview/);
  assert.match(js,/preview_url/);
  assert.match(js,/Preview מוכן/);
});


test('publish button requires explicit approval for preview-ready edits',()=>{
  const js=read('site-editor-ui.js');
  assert.match(js,/פרסם באתר/);
  assert.match(js,/publish_site/);
  assert.match(js,/approve_publish/);
  assert.match(js,/action:'publish'/);
});
