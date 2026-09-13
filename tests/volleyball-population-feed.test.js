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

test('top volleyball navigation selects population and topic navigation is a second sticky layer',()=>{
  const html=read('volleyball.html');
  const css=read('volleyball.css');
  assert.match(html,/id=["']volleyball-population-tabs["']/);
  assert.match(html,/id=["']volleyball-topic-shell["']/);
  assert.match(html,/id=["']volleyball-population-topics["']/);
  assert.match(css,/\.vb-population-shell\s*\{[^}]*position:sticky/s);
  assert.match(css,/\.vb-topic-shell\s*\{[^}]*position:sticky/s);
  assert.doesNotMatch(html,/id=["']volleyball-topic-filter["']/);
  assert.doesNotMatch(html,/id=["']volleyball-level-filter["']/);
  assert.doesNotMatch(html,/id=["']volleyball-population-filter["']/);
});

test('every approved population has a real volleyball visual with attribution',()=>{
  const {VOLLEYBALL_POPULATIONS,VOLLEYBALL_VISUALS}=loadModules();
  for(const population of VOLLEYBALL_POPULATIONS){
    const visual=VOLLEYBALL_VISUALS[population.id];
    assert.ok(visual,`missing visual for ${population.id}`);
    assert.match(visual.imageUrl,/^https:\/\//);
    assert.match(visual.creditUrl,/^https:\/\//);
    assert.ok(visual.credit&&visual.credit.length>2);
    assert.ok(visual.alt.length>10);
  }
});

test('female population visuals use named professional volleyball players from Wikimedia Commons',()=>{
  const {VOLLEYBALL_VISUALS}=loadModules();
  for(const id of ['women','youth-girls']){
    const visual=VOLLEYBALL_VISUALS[id];
    assert.equal(visual.professional,true,`${id} must be explicitly professional`);
    assert.ok(visual.playerName&&visual.playerName.length>4,`${id} needs a named player`);
    assert.match(visual.creditUrl,/commons\.wikimedia\.org\/wiki\/File/);
    assert.match(visual.imageUrl,/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//);
    assert.match(`${visual.alt} ${visual.credit}`,new RegExp(visual.playerName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));
  }
  const html=read('volleyball.html');
  assert.match(html,/Paola Egonu/);
  assert.match(html,/commons\.wikimedia\.org/);
  assert.doesNotMatch(html,/female-volleyball-player-in-indoor-gym-holding-ball-30446999/);
});

test('all professional topics remain available inside every population',()=>{
  const {VOLLEYBALL_TOPICS,VOLLEYBALL_POPULATIONS,getPopulationTopics}=loadModules();
  for(const population of VOLLEYBALL_POPULATIONS){
    const topics=getPopulationTopics(VOLLEYBALL_TOPICS,population.id);
    assert.deepEqual(topics.map(x=>x.id),VOLLEYBALL_TOPICS.map(x=>x.id));
  }
});

test('selected population feed is strict and contains no cards from all or other populations',()=>{
  const {VOLLEYBALL_FEED_CARDS,filterVolleyballFeed}=loadModules();
  const elementary=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{population:'elementary'});
  assert.ok(elementary.length>0);
  assert.ok(elementary.every(card=>card.populations.includes('elementary')));
  assert.ok(elementary.every(card=>!card.populations.includes('all')),'generic all-population cards must not leak into elementary feed');
});

test('topic selection narrows only within the active population',()=>{
  const {VOLLEYBALL_FEED_CARDS,filterVolleyballFeed}=loadModules();
  const elementaryTechnique=filterVolleyballFeed(VOLLEYBALL_FEED_CARDS,{population:'elementary',topic:'technique'});
  assert.ok(elementaryTechnique.length>0);
  assert.ok(elementaryTechnique.every(card=>card.populations.includes('elementary')&&(card.topic==='technique'||card.topic==='all')));
});

test('infinite feed batches are deterministic per population and topic and advance by page',()=>{
  const {VOLLEYBALL_FEED_CARDS,buildInfiniteBatch}=loadModules();
  const filters={population:'elementary',topic:'all'};
  const a=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,filters,'2026-09-13',0,8).map(x=>x.id);
  const b=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,filters,'2026-09-13',0,8).map(x=>x.id);
  const c=buildInfiniteBatch(VOLLEYBALL_FEED_CARDS,filters,'2026-09-13',1,8).map(x=>x.id);
  assert.deepEqual(a,b);
  assert.ok(a.length>0);
  assert.ok(c.length>0);
});

test('page includes player visual stage and infinite-scroll sentinel',()=>{
  const html=read('volleyball.html');
  assert.match(html,/id=["']volleyball-population-visual["']/);
  assert.match(html,/id=["']volleyball-feed-sentinel["']/);
  const css=read('volleyball.css');
  assert.match(css,/\.vb-player-visual/);
});
