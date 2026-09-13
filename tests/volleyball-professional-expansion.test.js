const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {VOLLEYBALL_FEED_CARDS}=require('../volleyball-data.js');
const {buildCardExpansion,buildProfessionalTermExpansion,isPopulationLabel,classifyCardTags}=require('../volleyball-professional-feed.js');

const populationLabels=['יסודי','נוער בנים','נוער בנות','נשים','גברים'];

test('population labels stay as context instead of professional glossary targets',()=>{
  for(const label of populationLabels)assert.equal(isPopulationLabel(label),true);
  assert.equal(isPopulationLabel('הגשה'),false);
  const card=VOLLEYBALL_FEED_CARDS.find(item=>item.id==='men-serve-pressure');
  const tags=classifyCardTags(card.tags);
  assert.deepEqual(tags.context,['גברים']);
  assert.deepEqual(tags.professional,['הגשה']);
});

test('post title opens a long explanation of the professional idea',()=>{
  const card=VOLLEYBALL_FEED_CARDS.find(item=>item.id==='men-serve-pressure');
  const entry=buildCardExpansion(card,VOLLEYBALL_FEED_CARDS);
  assert.equal(entry.term,card.title);
  assert.equal(entry.type,'concept');
  assert.ok(entry.sections.length>=6);
  const words=entry.sections.map(section=>section.text).join(' ').trim().split(/\s+/).filter(Boolean).length;
  assert.ok(words>=160,`concept expansion is too short: ${words}`);
  assert.doesNotMatch(entry.sections.map(section=>section.title).join(' '),/התאמה ל|נשים|גברים|נוער|יסודי/);
  assert.ok(entry.related.every(term=>!isPopulationLabel(term)));
});

test('professional tag expansions stay focused on the volleyball term',()=>{
  const entry=buildProfessionalTermExpansion('הגשה',VOLLEYBALL_FEED_CARDS,{population:'men'});
  assert.equal(entry.term,'הגשה');
  assert.ok(entry.sections.length>=6);
  assert.doesNotMatch(entry.sections.map(section=>section.title).join(' '),/התאמה ל|נשים|גברים|נוער|יסודי/);
  assert.ok(entry.related.every(term=>!isPopulationLabel(term)));
});

test('browser enhancement wires clickable titles and inert population chips',()=>{
  const source=fs.readFileSync(path.resolve(__dirname,'../volleyball-professional-feed.js'),'utf8');
  assert.match(source,/vb-card-title-button/);
  assert.match(source,/dataset\.cardConcept/);
  assert.match(source,/vb-context-chip/);
  assert.match(source,/replacePopulationTermButton/);
});
