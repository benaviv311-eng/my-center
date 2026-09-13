const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));

const populationLabels=['יסודי','נוער בנים','נוער בנות','נשים','גברים'];
const requiredTopics=['טכניקה','טקטיקה','עמדות ותפקידים','מערכות משחק','רוטציות','קבלת החלטות','תרגילים','למידה מוטורית','ניתוח וידאו','סטטיסטיקה ומדדים','פיזיולוגיה','קפיצה וכוח מתפרץ','מהירות ותנועה','נחיתה ועומסים','כתף ומניעת פציעות','חוקי המשחק','היסטוריה והתפתחות','כדורעף בעולם'];

function loadModules(){
  assert.equal(exists('volleyball-data.js'),true,'volleyball-data.js must exist');
  assert.equal(exists('volleyball.js'),true,'volleyball.js must exist');
  delete require.cache[require.resolve('../volleyball-data.js')];
  delete require.cache[require.resolve('../volleyball.js')];
  return {...require('../volleyball-data.js'),...require('../volleyball.js')};
}

test('volleyball hub defines the five approved populations',()=>{
  const {VOLLEYBALL_POPULATIONS}=loadModules();
  assert.deepEqual(VOLLEYBALL_POPULATIONS.map(x=>x.label),populationLabels);
  assert.equal(new Set(VOLLEYBALL_POPULATIONS.map(x=>x.id)).size,5);
  for(const p of VOLLEYBALL_POPULATIONS) assert.ok(p.summary.length>20);
});

test('volleyball hub covers the broad professional topic map',()=>{
  const {VOLLEYBALL_TOPICS}=loadModules();
  const labels=VOLLEYBALL_TOPICS.map(x=>x.label);
  for(const label of requiredTopics) assert.ok(labels.includes(label),`missing ${label}`);
  assert.ok(VOLLEYBALL_TOPICS.length>=22);
});

test('starter feed mixes technique tactics science and population-specific content',()=>{
  const {VOLLEYBALL_FEED_CARDS}=loadModules();
  assert.ok(VOLLEYBALL_FEED_CARDS.length>=24);
  const kinds=new Set(VOLLEYBALL_FEED_CARDS.map(x=>x.kind));
  for(const kind of ['concept','drill','scenario','research','myth','problem-solution','question']) assert.ok(kinds.has(kind),`missing kind ${kind}`);
  for(const population of ['elementary','youth-boys','youth-girls','women','men']) assert.ok(VOLLEYBALL_FEED_CARDS.some(x=>x.populations.includes(population)),`missing content for ${population}`);
});

test('feed filtering combines topic population and level without leakage',()=>{
  const {VOLLEYBALL_FEED_CARDS,filterVolleyballFeed}=loadModules();
  const filtered=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{topic:'technique',population:'youth-girls',level:'competitive'});
  assert.ok(filtered.length>0);
  assert.ok(filtered.every(x=>(x.topic==='technique'||x.topic==='all')&&(x.populations.includes('all')||x.populations.includes('youth-girls'))&&(x.levels.includes('all')||x.levels.includes('competitive'))));
});

test('discovery pick is deterministic by seed and respects requested kind',()=>{
  const {VOLLEYBALL_FEED_CARDS,pickDiscovery}=loadModules();
  const a=pickDiscovery(VOLLEYBALL_FEED_CARDS,'drill','seed-1');
  const b=pickDiscovery(VOLLEYBALL_FEED_CARDS,'drill','seed-1');
  assert.equal(a.id,b.id);
  assert.equal(a.kind,'drill');
});

test('volleyball page exposes topic map population tracks filters discovery and feed',()=>{
  assert.equal(exists('volleyball.html'),true);
  const html=read('volleyball.html');
  for(const id of ['volleyball-topic-map','volleyball-populations','volleyball-discovery','volleyball-feed','volleyball-topic-filter','volleyball-population-filter','volleyball-level-filter']) assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(html,/volleyball\.css/);
  assert.match(html,/volleyball-data\.js/);
  assert.match(html,/volleyball\.js/);
  assert.match(html,/כדורעף/);
});

test('home page links into the new volleyball hub',()=>{assert.match(read('index.html'),/href=["']volleyball\.html["']/);});

test('volleyball scripts have valid JavaScript syntax',()=>{
  for(const file of ['volleyball-data.js','volleyball.js']){
    assert.equal(exists(file),true,`${file} must exist`);
    const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,`${file}: ${result.stderr}`);
  }
});
