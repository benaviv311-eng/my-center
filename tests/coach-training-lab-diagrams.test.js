const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('training lab loads a dedicated diagram data module before the renderer',()=>{
  const diagramPath=path.join(root,'coach-training-lab-diagrams.js');
  assert.equal(fs.existsSync(diagramPath),true,'diagram data module is missing');

  const html=read('coach-training-lab.html');
  const dataIndex=html.indexOf('coach-training-lab-data.js');
  const diagramIndex=html.indexOf('coach-training-lab-diagrams.js');
  const appIndex=html.indexOf('coach-training-lab.js');
  assert.ok(dataIndex>=0,'training lab data script missing');
  assert.ok(diagramIndex>dataIndex,'diagram module must load after data');
  assert.ok(appIndex>diagramIndex,'diagram module must load before renderer');
});
