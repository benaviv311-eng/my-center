const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('idea feed offers scene preview instead of immediately saving a scene',()=>{
  const src=fs.readFileSync('raika-feed-ui.js','utf8');
  assert.match(src,/data-rf-action="scene-preview"/);
  assert.match(src,/🎬 הצע סצנה/);
  assert.match(src,/data-rf-scene-panel/);
  assert.match(src,/RaikaFeedClient\.expandScene/);
  assert.match(src,/data-rf-scene-save/);
  assert.match(src,/data-rf-scene-refresh/);
  assert.match(src,/data-rf-scene-close/);
});

test('scene preview is only saved after explicit save action',()=>{
  const src=fs.readFileSync('raika-feed-ui.js','utf8');
  const preview=src.indexOf("action==='scene-preview'");
  const save=src.indexOf("action==='scene-save'");
  assert.ok(preview>=0&&save>preview);
  const previewChunk=src.slice(preview,save);
  assert.doesNotMatch(previewChunk,/RaikaWorkspaceClient\.save/);
  assert.match(src.slice(save),/RaikaWorkspaceClient\.save/);
});
