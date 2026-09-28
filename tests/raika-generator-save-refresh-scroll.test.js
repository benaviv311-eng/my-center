const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika generator hotfix renders a save action on every proposal',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/data-rg-hotfix-save/);
  assert.match(src,/RaikaWorkspaceClient\.save/);
  assert.match(src,/נשמר ✓/);
});

test('Raika generator scrolls to proposal one after generation',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  assert.match(src,/data-rg-hotfix-card="0"/);
  assert.match(src,/scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.match(src,/scrollMarginTop/);
});

test('Raika generator adds a sticky refresh control after proposal three',()=>{
  const src=fs.readFileSync('raika-generator-hotfix.js','utf8');
  const css=fs.readFileSync('raika-generator.css','utf8');
  assert.match(src,/data-rg-hotfix-refresh/);
  assert.match(src,/rg-sticky-refresh/);
  assert.match(src,/i===2/);
  assert.match(css,/\.rg-sticky-refresh/);
  assert.match(css,/position:sticky/);
  assert.match(css,/bottom:/);
});

test('Writers Room cache-busts the updated generator assets',()=>{
  const html=fs.readFileSync('raika-writers-room.html','utf8');
  assert.match(html,/raika-generator\.css\?v=2/);
  assert.match(html,/raika-generator-hotfix\.js\?v=2/);
});
