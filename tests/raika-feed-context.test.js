const test=require('node:test');
const assert=require('node:assert/strict');
const ctx=require('../raika-feed-context.js');

const data={
  characters:[{id:'raika',title:'ראיקה',summary:'גיבורה'},{id:'tomo',title:'טומו',summary:'חבר'}],
  scenes:[{id:'s1',title:'אימון',summary:'ראיקה מתאמנת',status:'canon',characters:['raika']}],
  plotlines:[{id:'p1',title:'חברות',summary:'ראיקה וטומו'}],
  relationships:[{id:'r1',title:'ראיקה וטומו',characters:['raika','tomo']}],
  history:[], world:[], ideas:[{id:'i1',title:'רעיון',summary:'טיוטה',status:'idea',saved:true}]
};

test('context includes canon plus private creative material without dumping whole objects',()=>{
  const out=ctx.buildFeedBaseContext(data);
  assert.equal(out.characters[0].id,'raika');
  assert.equal(out.scenes[0].status,'canon');
  assert.equal(out.ideas[0].saved,true);
  assert.equal('image' in out.scenes[0],false);
});

test('fallback creates varied proposal cards from existing material',()=>{
  const cards=ctx.buildLocalFallbackCards(data,{count:4,seen:[]});
  assert.equal(cards.length,4);
  assert.ok(new Set(cards.map(c=>c.card_type)).size>=2);
  assert.ok(cards.every(c=>c.status==='proposal' && c.fallback===true));
});

test('fallback skips signatures already seen',()=>{
  const first=ctx.buildLocalFallbackCards(data,{count:2,seen:[]});
  const next=ctx.buildLocalFallbackCards(data,{count:2,seen:first.map(c=>c.signature)});
  assert.ok(next.every(c=>!first.some(old=>old.signature===c.signature)));
});
