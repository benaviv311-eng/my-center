const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika generator has an independent last-loaded hotfix',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  const hotfix=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(html,/raika-generator-hotfix\.js\?v=1/);
  const posHotfix=html.indexOf('raika-generator-hotfix.js?v=1');
  const posActions=html.indexOf('raika-generator-actions.js?v=6');
  assert.ok(posHotfix>posActions,'hotfix must load after generator actions');
  assert.match(hotfix,/getElementById\('rg-generate'\)/);
  assert.match(hotfix,/addEventListener\('click'/);
  assert.match(hotfix,/rg-result/);
  assert.match(hotfix,/נוצרו הצעות מקומיות/);
});
