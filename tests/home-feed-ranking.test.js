const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('../home-feed-ranking.js');

const items=['raika','coach','volleyball','languages','library','music','verses'].flatMap(source=>[
  {id:`${source}:1`,source,type:'concept',weight:0},
  {id:`${source}:2`,source,type:'concept',weight:0}
]);
const state={profile:{seen:{'raika:1':{count:2}},sourceAffinity:{coach:3},typeAffinity:{},saved:['library:1']},day:{seed:'home|2026-09-13',hidden:['music:2']}};

test('unseen, saved and preferred content outrank ordinary seen content',()=>{
  assert.ok(R.scoreItem(items.find(x=>x.id==='coach:1'),state,state.day.seed) > R.scoreItem(items.find(x=>x.id==='raika:1'),state,state.day.seed));
  assert.ok(R.scoreItem(items.find(x=>x.id==='library:1'),state,state.day.seed) > R.scoreItem(items.find(x=>x.id==='raika:1'),state,state.day.seed));
});

test('diversity prevents one source owning the recent window',()=>{
  const biased=[...Array(6)].map((_,i)=>({id:`coach:${i}`,source:'coach'})).concat(items.filter(x=>x.source!=='coach'));
  const out=R.diversify(biased,{windowSize:6,maxPerSource:2});
  for(let i=0;i<out.length;i+=6){
    const block=out.slice(i,i+6),counts={};block.forEach(x=>counts[x.source]=(counts[x.source]||0)+1);
    assert.ok(Math.max(...Object.values(counts))<=2 || new Set(block.map(x=>x.source)).size===1);
  }
});

test('same seed yields stable order and hidden-today items are excluded',()=>{
  const a=R.buildDailyOrder(items,state,'for-you');
  const b=R.buildDailyOrder(items,state,'for-you');
  assert.deepEqual(a,b);
  assert.equal(a.includes('music:2'),false);
});

test('first daily order puts unseen before seen and recycle order changes by cycle',()=>{
  const order=R.buildDailyOrder(items,state,'for-you');
  assert.ok(order.indexOf('raika:1')>0);
  const c1=R.buildRecycleCycle(items,state,'all',1);
  const c2=R.buildRecycleCycle(items,state,'all',2);
  assert.notDeepEqual(c1,c2);
});
