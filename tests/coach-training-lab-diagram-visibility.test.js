const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('training lab cache-busts diagram assets and loads visibility enhancer',()=>{
  const html=read('coach-training-lab.html');
  assert.match(html,/coach-training-lab\.css\?v=2/);
  assert.match(html,/coach-training-lab-data\.js\?v=2/);
  assert.match(html,/coach-training-lab-diagrams\.js\?v=2/);
  assert.match(html,/coach-training-lab\.js\?v=2/);
  assert.match(html,/coach-training-lab-diagram-visibility\.css\?v=1/);
  assert.match(html,/coach-training-lab-diagram-visibility\.js\?v=1/);
});

test('diagram visibility enhancer marks and previews diagrammed cards',()=>{
  const js=read('coach-training-lab-diagram-visibility.js');
  assert.match(js,/🗺️ יש תרשים/);
  assert.match(js,/training-lab-card-diagram-preview/);
  assert.match(js,/CoachTrainingLabDiagrams/);
  assert.match(js,/MutationObserver/);
});

test('diagram visibility enhancer provides a diagram-only control',()=>{
  const js=read('coach-training-lab-diagram-visibility.js');
  assert.match(js,/רק עם תרשים/);
  assert.match(js,/data-diagram-only/);
  assert.match(js,/has-diagram/);
});
