const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));
const sectionPages=[
  ['raika-characters.html','characters-grid'],
  ['raika-scenes.html','scenes-grid'],
  ['raika-plotlines.html','plotlines-grid'],
  ['raika-history.html','history-grid'],
  ['raika-world.html','world-grid'],
  ['raika-relationships.html','relationships-grid'],
  ['raika-writers-room.html','ideas-grid']
];
const privateScripts=['raika-private-auth.js','raika-private-editor.js','raika-edit-ui.js','raika-versions-ui.js','raika-ai.js'];

function loadFeedModule(){
  assert.equal(exists('raika-feed.js'),true,'raika-feed.js must exist');
  assert.equal(exists('raika-feed-data.js'),true,'raika-feed-data.js must exist');
  delete require.cache[require.resolve('../raika-feed.js')];
  delete require.cache[require.resolve('../raika-feed-data.js')];
  return {...require('../raika-feed.js'),...require('../raika-feed-data.js')};
}

test('frozen Raika navigation opens topic pages instead of anchors',()=>{
  const html=read('raika.html');
  for(const [page] of sectionPages) assert.match(html,new RegExp(`href=["']${page.replace('.','\\.')}["']`));
  for(const anchor of ['characters','scenes','plotlines','history','world','relationships','writers-room']) assert.doesNotMatch(html,new RegExp(`href=["']#${anchor}["']`));
});

test('all seven Raika topic pages exist with their collection container and shared private assets',()=>{
  for(const [page,containerId] of sectionPages){
    assert.equal(exists(page),true,`${page} must exist`);
    if(!exists(page)) continue;
    const html=read(page);
    assert.match(html,new RegExp(`id=["']${containerId}["']`),`${page} must contain #${containerId}`);
    assert.match(html,/class=["'][^"']*raika-hub[^"']*["']/);
    assert.match(html,/raika-data\.js/);
    assert.match(html,/raika-app\.js/);
    for(const script of privateScripts) assert.match(html,new RegExp(script.replace('.','\\.')),`${page} must load ${script}`);
    for(const [targetPage] of sectionPages) assert.match(html,new RegExp(`href=["']${targetPage.replace('.','\\.')}["']`));
  }
});

test('Raika home is a daily feed with a manual refresh control',()=>{
  const html=read('raika.html');
  assert.match(html,/id=["']raika-daily-feed["']/);
  assert.match(html,/id=["']raika-refresh-feed["']/);
  assert.match(html,/raika-feed\.js/);
  assert.match(html,/raika-feed-data\.js/);
  assert.match(html,/raika-feed-state\.js/);
  assert.match(html,/רענן פיד/);
});

test('daily feed is deterministic for the same date and refresh seed',()=>{
  const {dailyFeed}=loadFeedModule();
  assert.equal(typeof dailyFeed,'function');
  const items=Array.from({length:12},(_,i)=>({key:`item-${i}`,title:`Item ${i}`}));
  const first=dailyFeed(items,'2026-09-12',0,12).map(x=>x.key);
  const second=dailyFeed(items,'2026-09-12',0,12).map(x=>x.key);
  assert.deepEqual(second,first);
});

test('manual refresh seed changes daily feed order',()=>{
  const {dailyFeed}=loadFeedModule();
  const items=Array.from({length:20},(_,i)=>({key:`item-${i}`,title:`Item ${i}`}));
  const first=dailyFeed(items,'2026-09-12',0,20).map(x=>x.key);
  const refreshed=dailyFeed(items,'2026-09-12',1,20).map(x=>x.key);
  assert.notDeepEqual(refreshed,first);
});

test('feed candidates preserve source status and include character attributes',()=>{
  const {buildFeedCandidates}=loadFeedModule();
  assert.equal(typeof buildFeedCandidates,'function');
  const data={
    characters:[{id:'raika',title:'ראיקה',type:'character',status:'canon',summary:'סיכום',traits:['אמיצה'],wants:['להגן'],fears:['לאכזב'],beliefs:['כוח להגנה'],contradictions:['חזקה ופגיעה'],thinking:'חושבת דרך פעולה'}],
    scenes:[{id:'s1',title:'סצנה',type:'scene',status:'developing',summary:'סצנה בפיתוח'}],
    plotlines:[],history:[],world:[],relationships:[],ideas:[{id:'i1',title:'רעיון',type:'idea',status:'idea',summary:'רעיון בלבד'}]
  };
  const cards=buildFeedCandidates(data);
  assert.ok(cards.some(x=>x.title==='ראיקה'&&x.status==='canon'&&x.category==='פחד'));
  assert.ok(cards.some(x=>x.title==='סצנה'&&x.status==='developing'));
  assert.ok(cards.some(x=>x.title==='רעיון'&&x.status==='idea'));
  assert.ok(cards.every(x=>['canon','developing','idea','parked'].includes(x.status)));
});

test('feed card target pages map to the correct Raika topic page',()=>{
  const {targetPageForType}=loadFeedModule();
  assert.equal(targetPageForType('character'),'raika-characters.html');
  assert.equal(targetPageForType('scene'),'raika-scenes.html');
  assert.equal(targetPageForType('plotline'),'raika-plotlines.html');
  assert.equal(targetPageForType('history'),'raika-history.html');
  assert.equal(targetPageForType('world'),'raika-world.html');
  assert.equal(targetPageForType('relationship'),'raika-relationships.html');
  assert.equal(targetPageForType('idea'),'raika-writers-room.html');
  assert.equal(targetPageForType('conversation'),'raika-writers-room.html');
});

test('Raika feed browser scripts have valid JavaScript syntax',()=>{
  for(const file of ['raika-feed.js','raika-feed-data.js','raika-feed-state.js']){
    assert.equal(exists(file),true,`${file} must exist`);
    if(!exists(file)) continue;
    const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,`${file}: ${result.stderr}`);
  }
});
