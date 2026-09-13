const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');

function load(){
  for(const m of ['../volleyball-data.js','../volleyball.js','../volleyball-professional-visuals.js']) delete require.cache[require.resolve(m)];
  const modules={...require('../volleyball-data.js'),...require('../volleyball.js')};
  require('../volleyball-professional-visuals.js').applyProfessionalFemaleVisuals(modules.VOLLEYBALL_VISUALS);
  return modules;
}

test('population and topic navigation stay as two sticky layers',()=>{
  const html=read('volleyball.html'),css=read('volleyball.css');
  for(const id of ['volleyball-population-tabs','volleyball-topic-shell','volleyball-population-topics']) assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(css,/\.vb-population-shell\s*\{[^}]*position:sticky/s);
  assert.match(css,/\.vb-topic-shell\s*\{[^}]*position:sticky/s);
});

test('every population/topic feed uses the same single-column magazine layout',()=>{
  const html=read('volleyball.html'),loader=read('volleyball-professional-visuals.js'),css=read('volleyball-magazine.css');
  assert.ok(/volleyball-magazine\.css/.test(html)||/volleyball-magazine\.css/.test(loader));
  assert.match(css,/\.vb-feed\s*\{[^}]*grid-template-columns:1fr[^}]*max-width:8\d{2}px[^}]*margin-inline:auto/s);
  assert.doesNotMatch(css,/repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(css,/\.vb-feed-card\s*\{[^}]*border-radius:2\dpx[^}]*padding:2\dpx/s);
  assert.match(css,/\.vb-feed-card h3\s*\{[^}]*font-size:2\dpx/s);
});

test('population visuals are attributed and female visuals are named professionals',()=>{
  const {VOLLEYBALL_POPULATIONS,VOLLEYBALL_VISUALS}=load();
  for(const p of VOLLEYBALL_POPULATIONS){
    const v=VOLLEYBALL_VISUALS[p.id];
    assert.ok(v&&/^https:\/\//.test(v.imageUrl)&&/^https:\/\//.test(v.creditUrl)&&v.alt.length>10);
  }
  for(const id of ['women','youth-girls']){
    const v=VOLLEYBALL_VISUALS[id];
    assert.equal(v.professional,true);
    assert.ok(v.playerName&&v.creditUrl.includes('commons.wikimedia.org'));
  }
});

test('all topics remain available inside every population',()=>{
  const {VOLLEYBALL_TOPICS,VOLLEYBALL_POPULATIONS,getPopulationTopics}=load();
  for(const p of VOLLEYBALL_POPULATIONS) assert.deepEqual(getPopulationTopics(VOLLEYBALL_TOPICS,p.id).map(x=>x.id),VOLLEYBALL_TOPICS.map(x=>x.id));
});

test('population and topic filtering stay strict',()=>{
  const {VOLLEYBALL_FEED_CARDS,filterVolleyballFeed}=load();
  const elementary=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{population:'elementary'});
  assert.ok(elementary.length&&elementary.every(c=>c.populations.includes('elementary')&&!c.populations.includes('all')));
  const technique=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{population:'elementary',topic:'technique'});
  assert.ok(technique.length&&technique.every(c=>c.populations.includes('elementary')&&(c.topic==='technique'||c.topic==='all')));
});

test('infinite feed remains deterministic',()=>{
  const {VOLLEYBALL_FEED_CARDS,buildInfiniteBatch}=load();
  const f={population:'elementary',topic:'all'};
  const a=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,f,'2026-09-13',0,8).map(x=>x.id);
  const b=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,f,'2026-09-13',0,8).map(x=>x.id);
  assert.deepEqual(a,b);assert.ok(a.length);
});

test('page keeps player stage and infinite-scroll sentinel',()=>{
  const html=read('volleyball.html');
  assert.match(html,/id=["']volleyball-population-visual["']/);
  assert.match(html,/id=["']volleyball-feed-sentinel["']/);
});
