const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../home-feed-sources.js');

test('adapters create stable globally namespaced ids',()=>{
  const raika=S.fromRaika({characters:[{id:'raika',title:'ראיקה',summary:'גיבורה',status:'canon',type:'character',tags:['מורשת']}],scenes:[]});
  assert.equal(raika[0].id,'raika:character:raika');
  assert.equal(raika[0].source,'raika');
  assert.equal(raika[0].metadata.status,'canon');
  const coach=S.fromCoach({COACH_FEED_CARDS:[{id:'sp-1',topic:'sport-psychology',type:'concept',title:'מסוגלות',body:'טקסט',application:'יישום'}],COACH_TOPICS:[{id:'sport-psychology',page:'coach-sport-psychology.html'}]});
  assert.equal(coach[0].deepLink,'coach-sport-psychology.html');
  assert.equal(coach[0].fullText.includes('יישום'),true);
});

test('library and verse adapters use existing payload content',()=>{
  const discovery={buildDiscoveryPool:books=>[{id:'b1|post|0',bookId:'b1',bookTitle:'Book',title:'רעיון',text:'טקסט',type:'📖',sourceKind:'book'}]};
  const lib=S.fromLibraryPayload({books:[{id:'b1',slug:'book',title:'Book',content:{summary:'Summary'}}]},discovery);
  assert.equal(lib[0].source,'library');
  const verses=S.fromVerseRows([{id:'v1',slug:'v1',title:'פסוק',content:{verse:'שבע יפול צדיק וקם',reference:'משלי',human:'חוסן'}}]);
  assert.equal(verses[0].id,'verses:v1');
  assert.equal(verses[0].expandable,true);
});

test('music adapter extracts existing cards rather than a hand-authored bank',()=>{
  const html='<article class="card"><div class="label music">עוד</div><h3>מקאם</h3><p>תרגול קצר</p></article>';
  const out=S.fromMusicHtml(html);
  assert.equal(out.length,1);
  assert.equal(out[0].title,'מקאם');
  assert.equal(out[0].summary.includes('תרגול קצר'),true);
});

test('collectAll isolates failed async sources',async()=>{
  const result=await S.collectAll({
    coachData:{COACH_FEED_CARDS:[{id:'x',type:'concept',title:'X',body:'Y'}],COACH_TOPICS:[]},
    fetchLibraryPayload:async()=>{throw new Error('down')},
    fetchVerses:async()=>[{id:'v',content:{verse:'פסוק'}}],
    fetchMusicHtml:async()=>'<article class="card"><h3>גיטרה</h3><p>פראזה</p></article>'
  });
  assert.ok(result.items.some(x=>x.source==='coach'));
  assert.ok(result.items.some(x=>x.source==='verses'));
  assert.ok(result.items.some(x=>x.source==='music'));
  assert.deepEqual(result.errors.map(x=>x.source),['library']);
});
