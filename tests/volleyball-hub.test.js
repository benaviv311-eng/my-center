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

test('feed filtering combines population and topic without leakage',()=>{
  const {VOLLEYBALL_FEED_CARDS,filterVolleyballFeed}=loadModules();
  const filtered=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{topic:'technique',population:'elementary'});
  assert.ok(filtered.length>0);
  assert.ok(filtered.every(x=>(x.topic==='technique'||x.topic==='all')&&(x.populations.includes('all')||x.populations.includes('elementary'))));
});

test('infinite feed batch respects both selected population and selected topic',()=>{
  const {VOLLEYBALL_FEED_CARDS,buildInfiniteBatch}=loadModules();
  const batch=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,{population:'elementary',topic:'technique'},'seed-elementary',0,8);
  assert.ok(batch.length>0);
  assert.ok(batch.every(x=>(x.populations.includes('all')||x.populations.includes('elementary'))&&(x.topic==='technique'||x.topic==='all')));
});

test('discovery pick is deterministic by seed and respects requested kind',()=>{
  const {VOLLEYBALL_FEED_CARDS,pickDiscovery}=loadModules();
  const a=pickDiscovery(VOLLEYBALL_FEED_CARDS,'drill','seed-1');
  const b=pickDiscovery(VOLLEYBALL_FEED_CARDS,'drill','seed-1');
  assert.equal(a.id,b.id);
  assert.equal(a.kind,'drill');
});

test('every feed term opens a half-page expansion and cards use clickable terms instead of a generic deepen button',()=>{
  const {VOLLEYBALL_FEED_CARDS,buildTermExpansion,renderCard}=loadModules();
  assert.equal(typeof buildTermExpansion,'function');
  assert.equal(typeof renderCard,'function');
  const terms=[...new Set(VOLLEYBALL_FEED_CARDS.flatMap(card=>card.tags||[]))];
  assert.ok(terms.length>=20,'expected a broad volleyball term set');
  for(const term of terms){
    const entry=buildTermExpansion(term,VOLLEYBALL_FEED_CARDS,{population:'all'});
    assert.equal(entry.term,term);
    assert.ok(Array.isArray(entry.sections)&&entry.sections.length>=6,`${term} needs structured sections`);
    const words=entry.sections.map(section=>`${section.title||''} ${section.text||''}`).join(' ').trim().split(/\s+/).filter(Boolean).length;
    assert.ok(words>=160,`${term} expansion is too short: ${words} words`);
  }
  const sample=VOLLEYBALL_FEED_CARDS.find(card=>(card.tags||[]).length);
  const html=renderCard(sample);
  assert.match(html,/data-term=/);
  assert.doesNotMatch(html,/להעמיק|<details/i);
});

test('volleyball page exposes population selection then sticky topic tabs and infinite feed',()=>{
  assert.equal(exists('volleyball.html'),true);
  const html=read('volleyball.html');
  const css=read('volleyball.css');
  for(const id of ['volleyball-population-tabs','volleyball-population-topics','volleyball-topic-shell','volleyball-population-visual','volleyball-discovery','volleyball-feed','volleyball-feed-sentinel','volleyball-search']) assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(css,/\.vb-topic-shell\s*\{[^}]*position:sticky/s);
  assert.doesNotMatch(html,/id=["']volleyball-topic-filter["']/);
  assert.doesNotMatch(html,/id=["']volleyball-population-filter["']/);
  assert.doesNotMatch(html,/id=["']volleyball-level-filter["']/);
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
