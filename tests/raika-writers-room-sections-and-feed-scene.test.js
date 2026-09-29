const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika navigation exposes verses and non-canon plotlines everywhere via shared nav setup',()=>{
  const src=fs.readFileSync('raika-app.js','utf8');
  assert.match(src,/raika-verses\.html/);
  assert.match(src,/📖 פסוקים/);
  assert.match(src,/raika-noncanon-plotlines\.html/);
  assert.match(src,/קווי עלילה לא.?קאנוניים/);
});

test('verses page exists and renders verse-like saved Writers Room items',()=>{
  const html=fs.readFileSync('raika-verses.html','utf8');
  const js=fs.readFileSync('raika-verses.js','utf8');
  assert.match(html,/id="verses-grid"/);
  assert.match(html,/📖 פסוקים/);
  assert.match(js,/פסוק/);
  assert.match(js,/RaikaPrivate/);
  assert.match(js,/verses-grid/);
});

test('non-canon plotlines page exists and keeps canon separate',()=>{
  const html=fs.readFileSync('raika-noncanon-plotlines.html','utf8');
  const js=fs.readFileSync('raika-noncanon-plotlines.js','utf8');
  assert.match(html,/קווי עלילה לא.?קאנוניים/);
  assert.match(html,/id="noncanon-plotlines-grid"/);
  assert.match(js,/status.*canon/);
  assert.match(js,/plotline/);
  assert.match(js,/RaikaPrivate/);
});

test('feed scene action previews a proposed scene before saving it',()=>{
  const src=fs.readFileSync('raika-feed-ui.js','utf8');
  assert.match(src,/🎬 הצע סצנה/);
  assert.match(src,/data-rf-scene-preview/);
  assert.match(src,/data-rf-scene-save/);
  assert.match(src,/data-rf-scene-close/);
  assert.match(src,/scenePreviews/);
  const sceneAction=src.indexOf("if(action==='scene')");
  const expand=src.indexOf('RaikaFeedClient.expandScene',sceneAction);
  const save=src.indexOf('RaikaWorkspaceClient.save',sceneAction);
  assert.ok(expand>=0,'scene action should call scene proposal API');
  assert.ok(save<0||save>src.indexOf('data-rf-scene-save'),'scene action must not immediately save');
});

test('feed scene proposals save as developing scenes, not generic ideas',()=>{
  const src=fs.readFileSync('raika-feed-actions-core.js','utf8');
  assert.match(src,/type:'scene'/);
  assert.match(src,/status:'developing'/);
});
