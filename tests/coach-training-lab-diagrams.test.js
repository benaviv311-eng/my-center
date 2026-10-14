const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function load(){
  for(const file of ['../coach-training-lab-data.js','../coach-training-lab-diagrams.js','../coach-training-lab.js']){
    try{ delete require.cache[require.resolve(file)]; }catch(_error){}
  }
  return {
    ...require('../coach-training-lab-data.js'),
    ...require('../coach-training-lab-diagrams.js'),
    ...require('../coach-training-lab.js')
  };
}

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

test('starter diagram bank contains at least ten valid volleyball diagrams',()=>{
  const {DIAGRAMS}=load();
  const entries=Object.entries(DIAGRAMS);
  assert.ok(entries.length>=10,`expected at least 10 diagrams, got ${entries.length}`);
  for(const [id,diagram] of entries){
    assert.match(id,/^[a-z0-9-]+$/);
    assert.ok(['full','half','mini'].includes(diagram.courtType),`${id}: invalid court type`);
    assert.ok(Array.isArray(diagram.players)&&diagram.players.length>=2,`${id}: players missing`);
    const ids=new Set();
    for(const player of diagram.players){
      assert.ok(player.id,`${id}: player id missing`);
      assert.ok(!ids.has(player.id),`${id}: duplicate player ${player.id}`);
      ids.add(player.id);
      assert.ok(Number.isFinite(player.x)&&player.x>=0&&player.x<=100,`${id}: player x out of range`);
      assert.ok(Number.isFinite(player.y)&&player.y>=0&&player.y<=60,`${id}: player y out of range`);
    }
    for(const zone of diagram.targetZones||[]){
      assert.ok(zone.id,`${id}: target zone id missing`);
      ids.add(zone.id);
    }
    for(const pathItem of [...(diagram.ballPaths||[]),...(diagram.movementPaths||[])]){
      assert.ok(ids.has(pathItem.from),`${id}: path source ${pathItem.from} missing`);
      const hasTarget=pathItem.to&&ids.has(pathItem.to);
      const hasCoordinates=Number.isFinite(pathItem.toX)&&Number.isFinite(pathItem.toY);
      assert.ok(hasTarget||hasCoordinates,`${id}: path target missing`);
    }
  }
});

test('diagram renderer draws court players paths targets and an expand control',()=>{
  const {DIAGRAMS,renderDiagram}=load();
  assert.equal(typeof renderDiagram,'function');
  const html=renderDiagram(DIAGRAMS['reception-read-server-01'],'קוראים את המגיש לפני שזזים');
  assert.match(html,/training-lab-diagram/);
  assert.match(html,/<svg/);
  assert.match(html,/training-lab-court-net/);
  assert.match(html,/<circle/);
  assert.match(html,/training-lab-ball-path/);
  assert.match(html,/training-lab-target-zone/);
  assert.match(html,/data-lab-action="expand-diagram"/);
  assert.match(html,/aria-label="תרשים התרגיל/);
});

test('diagram renderer shows an explicit placeholder when a drill has no diagram',()=>{
  const {renderDiagram}=load();
  const html=renderDiagram(null,'תרגיל ללא תרשים');
  assert.match(html,/תרשים יתווסף בהמשך/);
  assert.doesNotMatch(html,/<svg/);
});

test('drill detail places the diagram before setup and renders numbered steps',()=>{
  const {LAB_ITEMS,renderDetail}=load();
  const item=LAB_ITEMS.find(x=>x.id==='reception-read-server-01');
  assert.ok(item);
  const html=renderDetail(item,[]);
  assert.ok(html.indexOf('training-lab-diagram')>=0,'diagram is missing from detail');
  assert.ok(html.indexOf('training-lab-diagram')<html.indexOf('איך מארגנים'),'diagram should appear before setup');
  assert.match(html,/<ol class="training-lab-steps">/);
  assert.match(html,/המגיש בוחר אחד משני אזורים/);
});
