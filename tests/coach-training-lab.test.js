const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function load(){
  delete require.cache[require.resolve(path.join(root,'coach-training-lab-data.js'))];
  delete require.cache[require.resolve(path.join(root,'coach-training-lab.js'))];
  return {...require(path.join(root,'coach-training-lab-data.js')),...require(path.join(root,'coach-training-lab.js'))};
}

test('training-lab exports the approved vocabularies',()=>{
  const {LAB_TOPICS,LAB_TYPES,LAB_SOURCE_KINDS,LAB_EVIDENCE_STRENGTHS}=load();
  for(const topic of ['reception','defense','serve','attack','block','setting','movement','perception','motor-learning','power-jump','coaching-language','psychology']) assert.ok(LAB_TOPICS.some(item=>item.id===topic));
  assert.deepEqual(new Set(LAB_TYPES),new Set(['drill','principle','science','teaching-method','scenario','comparison']));
  assert.ok(LAB_SOURCE_KINDS.includes('research'));
  assert.ok(LAB_EVIDENCE_STRENGTHS.includes('practice-based'));
});

test('a drill cannot validate without child-facing language',()=>{
  const {validateItem}=load();
  const result=validateItem({id:'d1',title:'קבלה',type:'drill',summary:'x',topics:['reception'],grades:['ה'],levels:['beginner'],objective:'x',setup:'x',steps:['x'],sourceKind:'our-interpretation',evidenceStrength:'practice-based',tags:[]});
  assert.equal(result.valid,false); assert.ok(result.errors.includes('childExplanation')); assert.ok(result.errors.includes('sayExactly')); assert.ok(result.errors.includes('oneCue'));
});

test('research and internet sources enforce traceable metadata',()=>{
  const {validateItem}=load();
  const result=validateItem({id:'r1',title:'מחקר',type:'science',summary:'x',topics:['power-jump'],levels:['advanced'],sourceKind:'research',evidenceStrength:'strong',tags:[],sourcePublisher:'Journal',sourceTitle:'Paper',sourceUrl:'https://example.org/paper',sourceClaim:'claim',science:'science'});
  assert.equal(result.valid,false); assert.ok(result.errors.includes('sourceDate')); assert.ok(result.errors.includes('sourceAccessedAt'));
});

test('data validation rejects duplicate ids and invalid enum values',()=>{
  const {validateData}=load(); const base={title:'x',summary:'x',topics:['reception'],levels:['beginner'],sourceKind:'our-interpretation',evidenceStrength:'practice-based',tags:[]};
  const result=validateData([{id:'x',type:'principle',...base},{id:'x',type:'made-up',...base}]);
  assert.equal(result.valid,false); assert.ok(result.errors.some(x=>x.errors.includes('duplicate-id'))); assert.ok(result.errors.some(x=>x.errors.includes('type')));
});

test('starter bank has 40-50 validated entries and broad topic coverage',()=>{
  const {LAB_ITEMS,LAB_TOPICS,validateData}=load();
  assert.ok(LAB_ITEMS.length>=40&&LAB_ITEMS.length<=50,`got ${LAB_ITEMS.length}`);
  const v=validateData(LAB_ITEMS); assert.equal(v.valid,true,JSON.stringify(v.errors,null,2));
  for(const topic of LAB_TOPICS) assert.ok(LAB_ITEMS.some(item=>item.topics.includes(topic.id)),`no content for ${topic.id}`);
});

test('starter bank represents at least four source families',()=>{
  const {LAB_ITEMS}=load(); assert.ok(new Set(LAB_ITEMS.map(item=>item.sourceKind)).size>=4);
});

test('every internet source is dated by access and every drill is child-readable',()=>{
  const {LAB_ITEMS}=load();
  for(const item of LAB_ITEMS){
    if(item.sourceUrl){assert.match(item.sourceAccessedAt,/^\d{4}-\d{2}-\d{2}$/);assert.match(item.sourceUrl,/^https?:\/\//);}
    if(item.type==='drill'){assert.ok(item.childExplanation.length>=20,item.id);assert.ok(item.sayExactly.length>=10,item.id);assert.ok(item.oneCue.length>=3,item.id);}
    if(item.sourceClaim) assert.ok(item.sourceClaim.length<=700,item.id);
  }
});

test('comparison seed groups cover the approved six themes',()=>{
  const {LAB_ITEMS}=load(); const groups=new Set(LAB_ITEMS.map(x=>x.comparisonGroup).filter(Boolean));
  for(const group of ['reception','read-hitter','teach-serve','decision-making','feedback','jump-training']){assert.ok(groups.has(group));assert.ok(LAB_ITEMS.filter(x=>x.comparisonGroup===group).length>=2);}
});

test('comparison groups count distinct approaches, not duplicate publisher-title pairs',()=>{
  const {LAB_ITEMS}=load();
  for(const group of new Set(LAB_ITEMS.map(x=>x.comparisonGroup).filter(Boolean))){
    const items=LAB_ITEMS.filter(x=>x.comparisonGroup===group); const keys=items.map(x=>`${x.sourcePublisher||'internal'}|${x.title}`.toLowerCase()); assert.equal(new Set(keys).size,keys.length,group);
  }
});

test('search handles Hebrew grade tokens and topic text',()=>{
  const {LAB_ITEMS,searchItems}=load(); const results=searchItems(LAB_ITEMS,'קבלה כיתה ה',{});
  assert.ok(results.length>0); assert.ok(results.every(item=>item.topics.includes('reception'))); assert.ok(results.every(item=>(item.grades||[]).includes('ה')));
});

test('grade ranges require content suitable for every requested grade',()=>{
  const {searchItems}=load(); const items=[
    {id:'both',title:'קבלה',summary:'',topics:['reception'],tags:[],grades:['ה','ו'],levels:['beginner']},
    {id:'only-he',title:'קבלה',summary:'',topics:['reception'],tags:[],grades:['ה'],levels:['beginner']}
  ];
  assert.deepEqual(searchItems(items,'קבלה כיתות ה-ו',{}).map(x=>x.id),['both']);
});

test('filters combine topic level type source and evidence',()=>{
  const {LAB_ITEMS,filterItems}=load(); const source=LAB_ITEMS.find(x=>x.type==='drill'&&x.topics.includes('defense')); assert.ok(source);
  const results=filterItems(LAB_ITEMS,{topic:'defense',level:source.levels[0],type:'drill',sourceKind:source.sourceKind,evidenceStrength:source.evidenceStrength});
  assert.ok(results.length>0); assert.ok(results.every(x=>x.topics.includes('defense')));
});

test('quick match returns exact items when constraints fit',()=>{
  const {recommendNow}=load(); const items=[{id:'a',type:'drill',topics:['defense'],grades:['ז'],levels:['developing'],durationMinutes:12,minPlayers:6,maxPlayers:14},{id:'b',type:'drill',topics:['defense'],grades:['ח'],levels:['advanced'],durationMinutes:25,minPlayers:2,maxPlayers:6}];
  const results=recommendNow(items,{topic:'defense',grade:'ז',level:'developing',minutes:15,players:12},4); assert.equal(results[0].item.id,'a'); assert.equal(results[0].exact,true); assert.deepEqual(results[0].mismatches,[]);
});

test('quick match explains partial mismatch instead of pretending exact',()=>{
  const {recommendNow}=load(); const [result]=recommendNow([{id:'a',type:'drill',topics:['defense'],grades:['ז'],levels:['developing'],durationMinutes:20,minPlayers:6,maxPlayers:12}],{topic:'defense',grade:'ז',level:'developing',minutes:15,players:12},4);
  assert.equal(result.exact,false); assert.ok(result.mismatches.includes('time'));
});

test('comparison label reflects the actual number of distinct approaches',()=>{
  const {comparisonLabel}=load(); const items=[{comparisonGroup:'reception',sourcePublisher:'A',title:'one'},{comparisonGroup:'reception',sourcePublisher:'B',title:'two'},{comparisonGroup:'reception',sourcePublisher:'C',title:'three'}];
  assert.equal(comparisonLabel(items,'reception'),'אותו רעיון — 3 דרכים'); assert.equal(comparisonLabel(items,'missing'),'');
});

test('storage adapter survives unavailable localStorage and keeps session memory',()=>{
  const {createStorageAdapter}=load(); const broken={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}}; const adapter=createStorageAdapter(broken,'x'); adapter.write(['a']); assert.deepEqual(adapter.read(),['a']);
});

test('stored ids toggle without duplicates',()=>{
  const {createStorageAdapter,toggleStoredId}=load(); const map=new Map(); const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}; const adapter=createStorageAdapter(storage,'x'); toggleStoredId(adapter,'a'); toggleStoredId(adapter,'a'); assert.deepEqual(adapter.read(),[]);
});

test('safeLocalStorage survives a throwing property getter',()=>{
  const {safeLocalStorage}=load(); const win={}; Object.defineProperty(win,'localStorage',{get(){throw new Error('privacy');}}); assert.equal(safeLocalStorage(win),null);
});

test('drill detail exposes child language and source/interpretation separately',()=>{
  const {LAB_ITEMS,renderDetail}=load(); const item=LAB_ITEMS.find(x=>x.type==='drill'); const html=renderDetail(item,[]);
  assert.match(html,/מה אני אומר לילדים/); assert.match(html,/תגיד בדיוק כך/); assert.match(html,/משפט מפתח/); assert.match(html,/מה המקור אומר/); assert.match(html,/הפרשנות שלנו/); assert.match(html,/יישום באימון/);
});

test('partial quick-match output names the mismatched constraint',()=>{
  const {renderQuickMatchResult}=load(); const html=renderQuickMatchResult({item:{id:'x',title:'תרגיל'},exact:false,mismatches:['time'],score:3}); assert.match(html,/זמן/); assert.doesNotMatch(html,/התאמה מלאה/);
});

test('age filter returns only items suitable for the requested age',()=>{
  const {LAB_ITEMS,filterItems}=load();
  const results=filterItems(LAB_ITEMS,{age:'10'});
  assert.ok(results.length>0);
  assert.ok(results.every(item=>(item.ages||[]).includes(10)));
});

test('rendered cards and details show age audience explicitly',()=>{
  const {LAB_ITEMS,renderCard,renderDetail}=load();
  const item=LAB_ITEMS.find(x=>x.type==='drill'&&x.ages?.length);
  assert.ok(item);
  const card=renderCard(item,{allItems:LAB_ITEMS,favorites:[],nextPractice:[]});
  const detail=renderDetail(item,[]);
  assert.match(card,/גיל/);
  assert.match(detail,/למי מתאים/);
  assert.match(detail,/גיל/);
});

test('drill card exposes simplify progress and variation actions with anchored detail sections',()=>{
  const {LAB_ITEMS,renderCard,renderDetail}=load();
  const item=LAB_ITEMS.find(x=>x.type==='drill'&&x.simplify?.length&&x.progressions?.length&&x.variations?.length);
  assert.ok(item);
  const card=renderCard(item,{allItems:LAB_ITEMS,favorites:[],nextPractice:[]});
  assert.match(card,/data-lab-action="simplify"/);
  assert.match(card,/data-lab-action="progress"/);
  assert.match(card,/data-lab-action="variation"/);
  const detail=renderDetail(item,[]);
  assert.match(detail,/training-lab-simplify/);
  assert.match(detail,/training-lab-progressions/);
  assert.match(detail,/training-lab-variations/);
});

test('quick match never reports exact when requested time or player metadata is unknown',()=>{
  const {recommendNow}=load();
  const [result]=recommendNow([
    {id:'unknown',type:'scenario',topics:['defense'],grades:['ז'],levels:['developing']}
  ],{topic:'defense',grade:'ז',level:'developing',minutes:15,players:12},4);
  assert.equal(result.exact,false);
  assert.ok(result.mismatches.includes('time'));
  assert.ok(result.mismatches.includes('players'));
});
