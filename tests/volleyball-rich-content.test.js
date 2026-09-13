const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=require('../volleyball-data.js');
const {buildInfiniteBatch}=require('../volleyball.js');

const populations=['elementary','youth-boys','youth-girls','women','men'];
const trustedHosts=['fivb.com','www.fivb.com','usavolleyball.org','www.usavolleyball.org','volleyball.ca','www.volleyball.ca'];

function loadRich(){
  delete require.cache[require.resolve('../volleyball-rich-content.js')];
  return require('../volleyball-rich-content.js');
}

test('every population receives a sourced drill library from professional organizations',()=>{
  const {VOLLEYBALL_DRILL_LIBRARY}=loadRich();
  for(const population of populations){
    const drills=VOLLEYBALL_DRILL_LIBRARY.filter(d=>d.population===population);
    assert.ok(drills.length>=3,`${population} needs at least three sourced drills`);
    for(const drill of drills){
      assert.ok(drill.goal&&drill.setup&&drill.execution&&drill.coachingPoints,`${drill.id} needs full coaching structure`);
      assert.ok(drill.sourceName&&drill.sourceUrl,`${drill.id} needs a source`);
      const host=new URL(drill.sourceUrl).hostname;
      assert.ok(trustedHosts.includes(host),`${drill.id} source is not on the trusted list: ${host}`);
      assert.ok(drill.adaptationNote,`${drill.id} must state how the source was adapted for its population`);
    }
  }
});

test('every population and every professional topic has enough dedicated content for an endless feed',()=>{
  const {buildEnrichedVolleyballCards}=loadRich();
  const cards=buildEnrichedVolleyballCards(data.VOLLEYBALL_FEED_CARDS,data.VOLLEYBALL_POPULATIONS,data.VOLLEYBALL_TOPICS);
  for(const population of populations){
    for(const topic of data.VOLLEYBALL_TOPICS.map(t=>t.id)){
      const matching=cards.filter(card=>card.topic===topic&&(card.populations.includes(population)||card.populations.includes('all')));
      assert.ok(matching.length>=2,`${population}/${topic} needs at least two relevant posts`);
      const page0=buildInfiniteBatch(cards,{population,topic},`coverage-${population}-${topic}`,0,8);
      const page7=buildInfiniteBatch(cards,{population,topic},`coverage-${population}-${topic}`,7,8);
      assert.ok(page0.length>0&&page7.length>0,`${population}/${topic} must keep loading`);
      assert.ok(page0.every(card=>card.topic===topic&&(card.populations.includes(population)||card.populations.includes('all'))));
    }
  }
});

test('generated population content is written for that population rather than cross-labelled',()=>{
  const {buildEnrichedVolleyballCards}=loadRich();
  const cards=buildEnrichedVolleyballCards(data.VOLLEYBALL_FEED_CARDS,data.VOLLEYBALL_POPULATIONS,data.VOLLEYBALL_TOPICS);
  for(const population of populations){
    const dedicated=cards.filter(card=>card.generatedForPopulation===population);
    assert.ok(dedicated.length>=data.VOLLEYBALL_TOPICS.length,`${population} needs dedicated writing across the topic map`);
    assert.ok(dedicated.every(card=>card.populations.length===1&&card.populations[0]===population));
    assert.ok(dedicated.every(card=>card.populationRationale&&card.populationRationale.length>35));
  }
});

test('professional women gallery has rotating licensed action photography',()=>{
  const {PROFESSIONAL_WOMEN_GALLERY}=loadRich();
  assert.ok(PROFESSIONAL_WOMEN_GALLERY.length>=6);
  for(const image of PROFESSIONAL_WOMEN_GALLERY){
    assert.equal(image.professional,true);
    assert.match(image.imageUrl,/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//);
    assert.match(image.creditUrl,/commons\.wikimedia\.org\/wiki\/File/);
    assert.match(image.license,/CC BY|CC BY-SA/);
    assert.ok(image.action&&image.playerName);
  }
});

test('volleyball page loads the enrichment and gallery layers',()=>{
  const html=fs.readFileSync(path.join(root,'volleyball.html'),'utf8');
  assert.match(html,/volleyball-rich-content\.js/);
  assert.match(html,/volleyball-rich-content\.css/);
});
