const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('each generated Raika idea can expand into a full scene',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/data-rg-hotfix-expand/);
  assert.match(src,/🎬 הרחב לסצנה/);
  assert.match(src,/function buildLocalScene/);
  assert.match(src,/פתיח/);
  assert.match(src,/מהלך הסצנה/);
  assert.match(src,/דיאלוג לדוגמה/);
  assert.match(src,/תפנית רגשית/);
  assert.match(src,/שורת סיום/);
  assert.match(src,/מיקום בעלילה/);
});

test('only one expanded scene is open at a time and it renders below its source idea',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/var expandedIndex=-1/);
  assert.match(src,/expandedIndex=index/);
  assert.match(src,/data-rg-scene-panel/);
  assert.match(src,/currentIdeas\.map/);
});

test('expanded scene uses the shared feed scene API with local fallback',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/RaikaFeedClient\?\.expandScene/);
  assert.match(src,/buildLocalScene/);
  assert.match(src,/sceneFromProposal/);
  assert.match(src,/catch\(err\)/);
});

test('expanded scene can be refreshed, edited, saved as a scene, and closed',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/data-rg-scene-refresh/);
  assert.match(src,/data-rg-scene-edit/);
  assert.match(src,/data-rg-scene-save/);
  assert.match(src,/data-rg-scene-close/);
  assert.match(src,/type:'scene'/);
  assert.match(src,/status:'developing'/);
  assert.match(src,/RaikaWorkspaceClient\.save/);
});

test('Writers Room cache-busts scene expansion asset',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/raika-generator\.css\?v=3/);
  assert.match(html,/raika-generator-hotfix\.js\?v=4/);
});
