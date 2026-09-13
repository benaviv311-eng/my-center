const test=require('node:test');
const assert=require('node:assert/strict');
const {VOLLEYBALL_FEED_CARDS}=require('../volleyball-data.js');
const {buildTermExpansion,buildCardExpansion,renderCard}=require('../volleyball.js');

const populationLabels=['יסודי','נוער בנים','נוער בנות','נשים','גברים'];

test('population labels stay visible context but do not open glossary explanations',()=>{
  const html=VOLLEYBALL_FEED_CARDS.map(renderCard).join('');
  for(const label of populationLabels){
    assert.doesNotMatch(html,new RegExp(`data-term=["']${label}["']`),`${label} must not be expandable`);
  }
});

test('post title opens a long explanation of the professional idea',()=>{
  assert.equal(typeof buildCardExpansion,'function');
  const card=VOLLEYBALL_FEED_CARDS.find(item=>item.id==='men-serve-pressure');
  const html=renderCard(card);
  assert.match(html,/data-card-concept=["']men-serve-pressure["']/);
  assert.match(html,/vb-card-title-button/);
  const entry=buildCardExpansion(card,VOLLEYBALL_FEED_CARDS);
  assert.equal(entry.term,card.title);
  assert.equal(entry.type,'concept');
  assert.ok(entry.sections.length>=6);
  const words=entry.sections.map(section=>section.text).join(' ').trim().split(/\s+/).filter(Boolean).length;
  assert.ok(words>=160,`concept expansion is too short: ${words}`);
  assert.doesNotMatch(entry.sections.map(section=>section.title).join(' '),/התאמה ל|נשים|גברים|נוער|יסודי/);
});

test('professional tag expansions remain long and focused on the volleyball term',()=>{
  const entry=buildTermExpansion('הגשה',VOLLEYBALL_FEED_CARDS,{population:'men'});
  assert.equal(entry.term,'הגשה');
  assert.ok(entry.sections.length>=6);
  assert.doesNotMatch(entry.sections.map(section=>section.title).join(' '),/התאמה ל|נשים|גברים|נוער|יסודי/);
});
