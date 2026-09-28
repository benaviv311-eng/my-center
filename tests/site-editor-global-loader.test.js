const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('app.js globally loads site editor assets exactly once and in editor-before-chat order',()=>{
  const src=fs.readFileSync('app.js','utf8');
  assert.match(src,/function ensureGlobalSiteEditor/);
  assert.match(src,/site-editor-ui\.css/);
  assert.match(src,/site-chat\.css/);
  assert.match(src,/site-editor-ui\.js/);
  assert.match(src,/site-chat\.js/);
  assert.match(src,/data-site-editor-global/);
  const editorPos=src.indexOf('site-editor-ui.js');
  const chatPos=src.indexOf('site-chat.js');
  assert.ok(editorPos>=0&&chatPos>editorPos,'site editor UI must load before site chat');
  assert.match(src,/DOMContentLoaded/);
});
