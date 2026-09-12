const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('Raika page wires private writers room assets',()=>{
  const html=fs.readFileSync('raika.html','utf8');
  for(const file of ['raika-private.css','raika-private-auth.js','raika-private-editor.js','raika-edit-ui.js','raika-versions-ui.js','raika-ai.js']) assert.match(html,new RegExp(file.replace('.','\\.')));
});

test('private UI never exposes the authorized email address',()=>{
  const files=['raika.html','raika-private-auth.js','raika-private-editor.js','raika-edit-ui.js','raika-versions-ui.js','raika-ai.js'];
  const text=files.map(f=>fs.readFileSync(f,'utf8')).join('\n').toLowerCase();
  assert.doesNotMatch(text,/benaviv311@gmail\.com/);
});

test('canon promotion requires explicit confirmation',()=>{
  const js=fs.readFileSync('raika-edit-ui.js','utf8');
  assert.match(js,/status==='canon'/);
  assert.match(js,/confirm\(/);
});

test('AI output is described as proposal-only in the UI',()=>{
  const js=fs.readFileSync('raika-ai.js','utf8');
  assert.match(js,/הצעה בלבד/);
  assert.match(js,/אינה משנה קאנון אוטומטית/);
});