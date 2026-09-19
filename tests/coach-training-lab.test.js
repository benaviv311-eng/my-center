const test=require('node:test');
const assert=require('node:assert/strict');

function load(){
  delete require.cache[require.resolve('../coach-training-lab-data.js')];
  delete require.cache[require.resolve('../coach-training-lab.js')];
  return {
    ...require('../coach-training-lab-data.js'),
    ...require('../coach-training-lab.js')
  };
}

test('training-lab exports the approved vocabularies',()=>{
  const {LAB_TOPICS,LAB_TYPES,LAB_SOURCE_KINDS,LAB_EVIDENCE_STRENGTHS}=load();
  for(const topic of ['reception','defense','serve','attack','block','setting','movement','perception','motor-learning','power-jump','coaching-language','psychology']){
    assert.ok(LAB_TOPICS.some(item=>item.id===topic), `missing topic ${topic}`);
  }
  assert.deepEqual(new Set(LAB_TYPES),new Set(['drill','principle','science','teaching-method','scenario','comparison']));
  assert.ok(LAB_SOURCE_KINDS.includes('research'));
  assert.ok(LAB_EVIDENCE_STRENGTHS.includes('practice-based'));
});

test('a drill cannot validate without child-facing language',()=>{
  const {validateItem}=load();
  const result=validateItem({
    id:'d1',title:'קבלה',type:'drill',summary:'x',topics:['reception'],
    grades:['ה'],levels:['beginner'],objective:'x',setup:'x',steps:['x'],
    sourceKind:'training-idea',evidenceStrength:'practice-based',tags:[]
  });
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('childExplanation'));
  assert.ok(result.errors.includes('sayExactly'));
  assert.ok(result.errors.includes('oneCue'));
});

test('research and internet sources enforce traceable metadata',()=>{
  const {validateItem}=load();
  const result=validateItem({
    id:'r1',title:'מחקר',type:'science',summary:'x',topics:['power-jump'],
    levels:['advanced'],sourceKind:'research',evidenceStrength:'strong',tags:[],
    sourcePublisher:'Journal',sourceTitle:'Paper',sourceUrl:'https://example.org/paper',
    sourceClaim:'claim',science:'science'
  });
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('sourceDate'));
  assert.ok(result.errors.includes('sourceAccessedAt'));
});

test('data validation rejects duplicate ids and invalid enum values',()=>{
  const {validateData}=load();
  const base={
    title:'x',summary:'x',topics:['reception'],levels:['beginner'],
    sourceKind:'training-idea',evidenceStrength:'practice-based',tags:[]
  };
  const result=validateData([
    {id:'x',type:'principle',...base},
    {id:'x',type:'made-up',...base}
  ]);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(x=>x.errors.includes('duplicate-id')));
  assert.ok(result.errors.some(x=>x.errors.includes('type')));
});
