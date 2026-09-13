const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=require('../raika-app.js');
const generator=require('../raika-generator-core.js');
const workspace=require('../raika-workspace.js');

test('writers room shows proposals/parked only, not developing or canon items',()=>{
  assert.equal(typeof app.writersRoomVisibleItems,'function');
  const items=[
    {id:'idea',status:'idea'},
    {id:'parked',status:'parked'},
    {id:'dev',status:'developing'},
    {id:'canon',status:'canon'}
  ];
  assert.deepEqual(app.writersRoomVisibleItems(items).map(x=>x.id),['idea','parked']);
});

test('related-character suggestions prefer characters already connected in scenes',()=>{
  assert.equal(typeof generator.relatedCharacters,'function');
  const data={
    characters:[
      {id:'a',title:'A',tags:['family']},
      {id:'b',title:'B',tags:['family']},
      {id:'c',title:'C',tags:['enemy']}
    ],
    scenes:[{characters:['a','b']},{characters:['a','b']}],
    relationships:[]
  };
  const result=generator.relatedCharacters(data,'a');
  assert.equal(result[0].id,'b');
});

test('workspace payload preserves explicit saved state',()=>{
  assert.equal(workspace.editablePayload({title:'x',saved:true}).saved,true);
  assert.equal(workspace.editablePayload({title:'x',saved:false}).saved,false);
});

test('Raika has a dedicated saved-items page',()=>{
  assert.equal(fs.existsSync('raika-saved.html'),true);
  const html=fs.readFileSync('raika-saved.html','utf8');
  assert.match(html,/id="saved-grid"/);
  assert.match(html,/📌\s*שמורים/);
});

test('Raika desktop feeds are forced to one column without changing global grids',()=>{
  const css=fs.readFileSync('styles.css','utf8');
  assert.match(css,/\.raika-sticky-tools\s*~\s*\.section\s+\.grid-2\s*\{[^}]*grid-template-columns\s*:\s*1fr/s);
});

test('writers room generator exposes a broad set of scene idea modes',()=>{
  const ui=fs.readFileSync('raika-generator-ui.js','utf8');
  for(const mode of ['related','relationship','theme','conflict','comedy','flashback','secret','family','surprise','mentor','rivalry','dilemma','quiet','training','aftermath','misunderstanding','promise','foreshadow','school','journey','villain','legacy']){
    assert.match(ui,new RegExp(`value="${mode}"`));
  }
});

test('writers room lets the user ask for 1, 3, or 5 ideas',()=>{
  const ui=fs.readFileSync('raika-generator-ui.js','utf8');
  assert.match(ui,/id="rg-count"/);
  for(const n of ['1','3','5'])assert.match(ui,new RegExp(`value="${n}"`));
  const actions=fs.readFileSync('raika-generator-actions.js','utf8');
  assert.match(actions,/rg-count/);
  assert.match(actions,/distinct/i);
});

test('additional modes use dedicated scene prompts',()=>{
  assert.match(generator.buildSceneIdeaPrompt('theme','ראיקה','טומו','שייכות'),/theme/i);
  assert.match(generator.buildSceneIdeaPrompt('family','ראיקה','היקארי',''),/family/i);
  assert.match(generator.buildSceneIdeaPrompt('mentor','ראיקה','ראי',''),/mentor/i);
  assert.match(generator.buildSceneIdeaPrompt('dilemma','ראיקה','טומו',''),/dilemma/i);
  assert.match(generator.buildSceneIdeaPrompt('foreshadow','ראיקה','',''),/foreshadow/i);
});

test('AI failures preserve backend detail and show a persistent generator error',()=>{
  const ai=fs.readFileSync('raika-ai.js','utf8');
  assert.match(ai,/j\.detail/);
  const actions=fs.readFileSync('raika-generator-actions.js','utf8');
  assert.match(actions,/rg-error/);
  assert.match(actions,/ai_not_configured/);
});

test('AI save paths keep items in the saved collection',()=>{
  const js=fs.readFileSync('raika-ai.js','utf8');
  assert.match(js,/saved\s*:\s*Boolean\(item\.saved\)/);
  assert.match(js,/tags:\['ייעוץ AI'\][^}]*saved:true/s);
});
