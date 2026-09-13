const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function loadModules(){
  delete require.cache[require.resolve('../volleyball-data.js')];
  delete require.cache[require.resolve('../volleyball.js')];
  return {...require('../volleyball-data.js'),...require('../volleyball.js')};
}

test('sticky volleyball navigation is population-only and starts with all',()=>{
  const html=read('volleyball.html');
  assert.match(html,/id=["']volleyball-population-tabs["']/);
  assert.match(html,/class=["'][^"']*vb-population-shell/);
  assert.doesNotMatch(html,/id=["']volleyball-topic-filter["']/);
  assert.doesNotMatch(html,/id=["']volleyball-level-filter["']/);
  assert.doesNotMatch(html,/id=["']volleyball-population-filter["']/);
});

test('every approved population has a real volleyball visual with attribution',()=>{
  const {VOLLEYBALL_POPULATIONS,VOLLEYBALL_VISUALS}=loadModules();
  for(const population of VOLLEYBALL_POPULATIONS){
    const visual=VOLLEYBALL_VISUALS[population.id];
    assert.ok(visual,`missing visual for ${population.id}`);
    assert.match(visual.imageUrl,/^https:\/\/images\.pexels\.com\//);
    assert.match(visual.creditUrl,/^https:\/\/www\.pexels\.com\//);
    assert.ok(visual.alt.length>10);
  }
});

test('all professional topics remain available inside every population',()=>{
  const {VOLLEYBALL_TOPICS,VOLLEYBALL_POPULATIONS,getPopulationTopics}=loadModules();
  for(const population of VOLLEYBALL_POPULATIONS){
    const topics=getPopulationTopics(VOLLEYBALL_TOPICS,population.id);
    assert.deepEqual(topics.map(x=>x.id),VOLLEYBALL_TOPICS.map(x=>x.id));
  }
});

test('population filtering keeps all topics mixed instead of narrowing by topic',()=>{
  const {VOLLEYBALL_FEED_CARDS,filterVolleyballFeed}=loadModules();
  const women=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{population:'women'});
  assert.ok(women.length>0);
  assert.ok(women.every(card=>card.populations.includes('all')||card.populations.includes('women')));
  assert.ok(new Set(women.map(card=>card.topic)).size>=5,'population feed should mix many topics');
  assert.equal(filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{population:'all'}).length,VOLLEYBALL_FEED_CARDS.length);
});

test('infinite feed batches are deterministic per page and advance without repeating the same batch',()=>{
  const {VOLLEYBALL_FEED_CARDS,buildInfiniteBatch}=loadModules();
  const a=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,{population:'all'},'2026-09-13',0,8).map(x=>x.id);
  const b=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,{population:'all'},'2026-09-13',0,8).map(x=>x.id);
  const c=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,{population:'all'},'2026-09-13',1,8).map(x=>x.id);
  assert.deepEqual(a,b);
  assert.equal(a.length,8);
  assert.equal(c.length,8);
  assert.notDeepEqual(a,c);
  assert.equal(new Set(a).size,a.length);
  assert.equal(new Set(c).size,c.length);
});

test('page includes population topic panel, player visual stage and infinite-scroll sentinel',()=>{
  const html=read('volleyball.html');
  assert.match(html,/id=["']volleyball-population-topics["']/);
  assert.match(html,/id=["']volleyball-population-visual["']/);
  assert.match(html,/id=["']volleyball-feed-sentinel["']/);
  const css=read('volleyball.css');
  assert.match(css,/\.vb-population-shell\s*\{[^}]*position:sticky/s);
  assert.match(css,/\.vb-player-visual/);
});
