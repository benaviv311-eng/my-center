const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));

test('training lab page contains the required work areas',()=>{
  assert.equal(exists('coach-training-lab.html'),true);
  const html=read('coach-training-lab.html');
  for(const id of ['training-lab-search','training-lab-filters','training-lab-results','training-lab-count','training-lab-detail','training-lab-now-form','training-lab-now-results','training-lab-favorites','training-lab-next-practice']) assert.match(html,new RegExp(`id=["']${id}["']`),id);
  assert.match(html,/מעבדת האימון/);
});

test('data loads before lab logic and page has no backend dependency',()=>{
  const html=read('coach-training-lab.html'); const dataIndex=html.indexOf('coach-training-lab-data.js'); const appIndex=html.indexOf('coach-training-lab.js');
  assert.ok(dataIndex>=0&&appIndex>dataIndex); assert.doesNotMatch(html,/supabase/i); assert.doesNotMatch(html,/functions\/v1/);
});

test('training lab scripts have valid JavaScript syntax',()=>{
  for(const file of ['coach-training-lab-data.js','coach-training-lab.js']){const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,`${file}: ${result.stderr}`);}
});

test('mobile CSS keeps the core results as one column',()=>{
  const css=read('coach-training-lab.css'); assert.match(css,/\.training-lab-results[^\{]*\{[^}]*grid-template-columns\s*:\s*1fr/s); assert.match(css,/@media\s*\(max-width:\s*640px\)/);
});

test('browser controller wires search, quick match, favorites and next-practice actions',()=>{
  const js=read('coach-training-lab.js'); for(const token of ['initTrainingLab','recommendNow','favorite','next-practice','training-lab-now-form']) assert.match(js,new RegExp(token.replace('-','\\-')));
});

test('coach and volleyball hubs both link prominently to the training lab',()=>{
  for(const file of ['coach.html','volleyball.html']){
    const html=read(file);
    assert.match(html,/href=["']coach-training-lab\.html["']/,`${file} missing lab link`);
    assert.match(html,/מעבדת האימון/,`${file} missing lab label`);
  }
});
