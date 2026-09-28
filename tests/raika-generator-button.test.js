const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika generator uses one direct trigger and current cache versions',()=>{
  const ui=fs.readFileSync('raika-generator-ui.js','utf8');
  const actions=fs.readFileSync('raika-generator-actions.js','utf8');
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(ui,/onclick="return window\.RaikaGeneratorActions\.generate\(\)"/);
  assert.match(actions,/window\.RaikaGeneratorActions=\{generate:rgGenerate/);
  assert.doesNotMatch(actions,/function rgBindGenerateButton/);
  assert.match(html,/raika-generator-ui\.js\?v=4/);
  assert.match(html,/raika-generator-actions\.js\?v=6/);
});
