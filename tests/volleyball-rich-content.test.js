const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=require('../volleyball-data.js');
const {buildInfiniteBatchNoRepeat:buildInfiniteBatch}=require('../volleyball-feed-cycle.js');

const populations=['elementary','youth-boys','youth-girls','women','men'];
const trustedHosts=['fivb.com','www.fivb.com','usavolleyball.org','www.usavolleyball.org','volleyball.ca','www.volleyball.ca'];

function loadRich(){
  delete require.cache[require.resolve('../volleyball-rich-content.js')];
  return require('../volleyball-rich-content.js');
}

function loadDrillPriority(){
  delete require.cache[require.resolve('../volleyball-drill-tab-priority.js')];
  return require('../volleyball-drill-tab-priority.js');
}

function loadExpandedGallery(){
  const rich=loadRich();
  delete require.cache[require.resolve('../volleyball-gallery-extension.js')];
  const extra=require('../volleyball-gallery-extension.js');
  const gallery=rich.PROFESSIONAL_WOMEN_GALLERY.slice();
  extra.extendProfessionalWomenGallery(gallery);
  return gallery;
}

function loadDeepContent(){
  delete require.cache[require.resolve('../volleyball-deep-content.js')];
  return require('../volleyball-deep-content.js');
}

test('every population receives a sourced drill library from professional organizations',()=>{
  const {VOLLEYBALL_DRILL_LIBRARY}=loadRich();
  for(const population of populations){
    const drills=VOLLEYBALL_DRILL_LIBRARY.filter(d=>d.population===population);
    assert.ok(drills.length>=3,`${population} needs at least three sourced drills`);
    for(const drill of drills){
      assert.ok(drill.goal&&drill.setup&&drill.execution&&drill.coachingPoints,`${drill.id} needs full coaching structure`);
      assert.ok(drill.players&&drill.equipment&&drill.commonErrors&&drill.progression,`${drill.id} needs practical drill details`);
      assert.ok(drill.sourceName&&drill.sourceUrl,`${drill.id} needs a source`);
      const host=new URL(drill.sourceUrl).hostname;
      assert.ok(trustedHosts.includes(host),`${drill.id} source is not on the trusted list: ${host}`);
      assert.ok(drill.adaptationNote,`${drill.id} must state how the source was adapted for its population`);
    }
  }
});

test('drills are pinned first in the characteristic strip for every population',()=>{
  const {prioritizeDrillTopics}=loadDrillPriority();
  assert.equal(typeof prioritizeDrillTopics,'function');
  for(const population of populations){
    const ordered=prioritizeDrillTopics(data.VOLLEYBALL_TOPICS,population);
    assert.equal(ordered[0].id,'drills',`${population} should show drills immediately after all`);
    assert.equal(new Set(ordered.map(item=>item.id)).size,data.VOLLEYBALL_TOPICS.length);
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

test('infinite feed does not repeat a card before the filtered pool is exhausted',()=>{
  const cards=Array.from({length:25},(_,i)=>({id:`unique-${i}`,kind:'concept',topic:'technique',populations:['elementary'],levels:['all'],title:`כותרת ${i}`,text:`טקסט ${i}`,detail:'',tags:[]}));
  const seen=[];
  for(let page=0;page<3;page++)seen.push(...buildInfiniteBatch(cards,{population:'elementary',topic:'technique'},'no-repeat',page,8));
  assert.equal(seen.length,24);
  assert.equal(new Set(seen.map(card=>card.id)).size,24);
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

test('deep researched feed has at least forty genuinely varied posts for every population',()=>{
  assert.equal(fs.existsSync(path.join(root,'volleyball-deep-content.js')),true,'deep content file must exist');
  const {VOLLEYBALL_DEEP_CARDS,applyDeepVolleyballContent}=loadDeepContent();
  assert.equal(typeof applyDeepVolleyballContent,'function');
  for(const population of populations){
    const cards=VOLLEYBALL_DEEP_CARDS.filter(card=>card.populations.length===1&&card.populations[0]===population);
    assert.ok(cards.length>=40,`${population} needs at least 40 deep posts`);
    assert.ok(new Set(cards.map(card=>card.title.trim().toLowerCase())).size===cards.length,`${population} titles must be unique`);
    assert.ok(new Set(cards.map(card=>card.text.trim().toLowerCase())).size===cards.length,`${population} texts must be unique`);
    assert.ok(new Set(cards.map(card=>card.topic)).size>=10,`${population} needs broad topic variety`);
    assert.ok(new Set(cards.map(card=>card.kind)).size>=6,`${population} needs varied post formats`);
    assert.ok(cards.filter(card=>card.sourceUrl).length>=8,`${population} needs multiple sourced posts`);
    assert.ok(cards.every(card=>card.deepResearch===true));
  }
  const base=[...data.VOLLEYBALL_FEED_CARDS,{id:'rich-elementary-technique-1',topic:'technique',populations:['elementary'],title:'template',text:'template',detail:'template',kind:'concept',tags:[],generatedForPopulation:'elementary'}];
  const applied=applyDeepVolleyballContent(base);
  assert.equal(applied.some(card=>/^rich-(elementary|youth-boys|youth-girls|women|men)-/.test(card.id)),false,'template population cards should be removed');
  assert.ok(applied.filter(card=>card.deepResearch).length>=200);
});

test('professional women gallery has a large rotating set of licensed intense match photography',()=>{
  const gallery=loadExpandedGallery();
  assert.ok(gallery.length>=14,'gallery should be large enough to avoid repetitive rotation');
  assert.ok(new Set(gallery.map(image=>image.playerName)).size>=9,'gallery should feature a broad mix of professional players or teams');
  const intense=/הנחתה|חסימה|הצלה|הגנה|הגשה|קפיצה|מאבק|ראלי|התקפה|רשת/;
  assert.ok(gallery.filter(image=>intense.test(image.action)).length>=10,'most gallery images should describe intense in-play moments');
  for(const image of gallery){
    assert.equal(image.professional,true);
    assert.match(image.imageUrl,/commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\//);
    assert.match(image.creditUrl,/commons\.wikimedia\.org\/wiki\/File/);
    assert.match(image.license,/CC BY|CC BY-SA|Public Domain/);
    assert.ok(image.action&&image.playerName);
  }
});

test('volleyball page loads the enrichment, deep feed, gallery, pinned drills and full drill-detail layers',()=>{
  const html=fs.readFileSync(path.join(root,'volleyball.html'),'utf8');
  assert.match(html,/volleyball-rich-content\.js/);
  assert.match(html,/volleyball-deep-content\.js/);
  assert.match(html,/volleyball-rich-content\.css/);
  assert.match(html,/volleyball-gallery-extension\.js/);
  assert.match(html,/volleyball-drill-tab-priority\.js/);
  assert.match(html,/volleyball-drill-details\.js/);
  assert.equal(fs.existsSync(path.join(root,'volleyball-drill-details.js')),true);
  const details=fs.readFileSync(path.join(root,'volleyball-drill-details.js'),'utf8');
  for(const label of ['מספר שחקנים','ציוד','ביצוע','דגשים','טעויות נפוצות','התקדמות'])assert.match(details,new RegExp(label));
});
