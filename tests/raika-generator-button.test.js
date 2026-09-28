const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika generator button is bound directly and cache-busted in Writers Room',()=>{
  const actions=fs.readFileSync('raika-generator-actions.js','utf8');
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(actions,/function rgBindGenerateButton/);
  assert.match(actions,/getElementById\('rg-generate'\)/);
  assert.match(actions,/addEventListener\('click'/);
  assert.match(actions,/rgGenerate/);
  assert.match(html,/raika-generator-actions\.js\?v=5/);
});
