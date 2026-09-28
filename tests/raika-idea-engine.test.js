const test=require('node:test');
const assert=require('node:assert/strict');

function load(){
  delete require.cache[require.resolve('../raika-idea-engine-core.js')];
  return require('../raika-idea-engine-core.js');
}

const card=(id,type='scene',character='raika',family='f1')=>({
  id,idea_id:id,card_type:type,title:id,body:`body ${id}`,characters:[character],
  signature:`sig-${id}`,semantic_fingerprint:`fp-${id}`,plot_family:family
});

test('filterBlocked removes exact fingerprints and family-wide blocks',()=>{
  const {filterBlocked}=load();
  const cards=[card('a','scene','raika','fam-a'),card('b','scene','rai','fam-b'),card('c','scene','tomo','fam-c')];
  const out=filterBlocked(cards,[
    {semantic_fingerprint:'fp-a',plot_family:'fam-a',scope:'fingerprint'},
    {semantic_fingerprint:'x',plot_family:'fam-b',scope:'family'}
  ]);
  assert.deepEqual(out.map(x=>x.id),['c']);
});

test('selectDiverseBatch avoids duplicates and prevents one type or character from dominating when alternatives exist',()=>{
  const {selectDiverseBatch}=load();
  const types=['scene','dialogue','plot_seed','worldbuilding','comedy','secret'];
  const chars=['raika','rai','hikari','tomo','nazo','medoshi','dokuren','okane'];
  const cards=Array.from({length:80},(_,i)=>card(`c${i}`,types[i%types.length],chars[i%chars.length],`fam-${i%20}`));
  const out=selectDiverseBatch(cards,{count:24,seed:'alpha'});
  assert.equal(out.length,24);
  assert.equal(new Set(out.map(x=>x.signature)).size,24);
  const byType={}; const byChar={};
  for(const x of out){byType[x.card_type]=(byType[x.card_type]||0)+1;for(const c of x.characters||[])byChar[c]=(byChar[c]||0)+1;}
  assert.ok(Math.max(...Object.values(byType))/24<=0.35);
  assert.ok(Math.max(...Object.values(byChar))/24<=0.35);
});

test('selectDiverseBatch is deterministic by seed and changes with a different seed',()=>{
  const {selectDiverseBatch}=load();
  const cards=Array.from({length:60},(_,i)=>card(`c${i}`,['scene','dialogue','worldbuilding'][i%3],['raika','rai','tomo','hikari'][i%4],`fam-${i%15}`));
  const a=selectDiverseBatch(cards,{count:20,seed:'one'}).map(x=>x.id);
  const b=selectDiverseBatch(cards,{count:20,seed:'one'}).map(x=>x.id);
  const c=selectDiverseBatch(cards,{count:20,seed:'two'}).map(x=>x.id);
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,c);
});

test('replaceRefreshableCards keeps locked cards and replaces unlocked cards',()=>{
  const {replaceRefreshableCards}=load();
  const state={cards:[card('locked'),card('old1'),card('old2')],locked:new Set(['locked']),hidden:new Set(),loading:false,error:''};
  const next=replaceRefreshableCards(state,[card('new1'),card('new2')]);
  assert.deepEqual(next.cards.map(x=>x.id),['locked','new1','new2']);
  assert.equal(next.locked.has('locked'),true);
});
