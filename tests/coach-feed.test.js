const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const exists=name=>fs.existsSync(path.join(root,name));

const topicLabels=[
  'פסיכולוגיה של הספורט',
  'פסיכולוגיית אימון',
  'פסיכולוגיה של תנועה',
  'כוח מתפרץ',
  'שפת אימון',
  'גישות לכדורעף'
];

const topicPages={
  'sport-psychology':'coach-sport-psychology.html',
  'coaching-psychology':'coach-coaching-psychology.html',
  'movement-psychology':'coach-movement-psychology.html',
  'explosive-power':'coach-explosive-power.html',
  'coaching-language':'coach-coaching-language.html',
  'volleyball-approaches':'coach-volleyball-approaches.html'
};

function loadModules(){
  assert.equal(exists('coach-feed-data.js'),true,'coach-feed-data.js must exist');
  assert.equal(exists('coach-feed.js'),true,'coach-feed.js must exist');
  delete require.cache[require.resolve('../coach-feed-data.js')];
  delete require.cache[require.resolve('../coach-feed.js')];
  return {...require('../coach-feed-data.js'),...require('../coach-feed.js')};
}

test('coach feed defines exactly six fixed learning topics',()=>{
  const {COACH_TOPICS}=loadModules();
  assert.equal(COACH_TOPICS.length,6);
  assert.deepEqual(COACH_TOPICS.map(x=>x.label),topicLabels);
  assert.equal(new Set(COACH_TOPICS.map(x=>x.id)).size,6);
});

test('every coach topic has a meaningful starter content bank',()=>{
  const {COACH_TOPICS,COACH_FEED_CARDS}=loadModules();
  for(const topic of COACH_TOPICS){
    const cards=COACH_FEED_CARDS.filter(card=>card.topic===topic.id);
    assert.ok(cards.length>=3,`${topic.id} should have at least 3 starter cards`);
    assert.ok(cards.some(card=>['concept','insight','research','summary'].includes(card.type)),`${topic.id} needs explanatory content`);
    assert.ok(cards.some(card=>['application','scenario','language','question','practice'].includes(card.type)),`${topic.id} needs applied content`);
    assert.ok(cards.some(card=>card.type==='question'),`${topic.id} needs an embedded question`);
    assert.ok(cards.some(card=>typeof card.application==='string'&&card.application.length>0),`${topic.id} needs volleyball application`);
  }
});

test('question cards have 3-4 options and complete feedback fields',()=>{
  const {COACH_FEED_CARDS}=loadModules();
  const questions=COACH_FEED_CARDS.filter(card=>card.type==='question');
  assert.ok(questions.length>=6);
  for(const card of questions){
    assert.ok(card.options.length>=3&&card.options.length<=4,`${card.id} must have 3-4 options`);
    assert.ok(Number.isInteger(card.correctOption));
    assert.ok(card.correctOption>=0&&card.correctOption<card.options.length);
    for(const key of ['question','explanation','principle','application']){
      assert.equal(typeof card[key],'string',`${card.id} missing ${key}`);
      assert.ok(card[key].length>0,`${card.id} has empty ${key}`);
    }
  }
});

test('source attribution is explicit and never silently presented as a verified quote',()=>{
  const {COACH_FEED_CARDS}=loadModules();
  const allowed=['summary','paraphrase','verified-quote','research-summary'];
  for(const card of COACH_FEED_CARDS){
    if(card.source){
      assert.ok(allowed.includes(card.sourceKind),`${card.id} has invalid sourceKind`);
      if(card.sourceKind==='verified-quote'){
        assert.ok(card.sourceUrl||card.locator,`${card.id} verified quote needs a locator`);
      }
    }
  }
});

test('topic filtering never leaks cards from another topic',()=>{
  const {COACH_FEED_CARDS,filterCards}=loadModules();
  const all=filterCards(COACH_FEED_CARDS,'all');
  assert.equal(all.length,COACH_FEED_CARDS.length);
  const topic=COACH_FEED_CARDS[0].topic;
  const filtered=filterCards(COACH_FEED_CARDS,topic);
  assert.ok(filtered.length>0);
  assert.ok(filtered.every(card=>card.topic===topic));
});

test('feed mixing is deterministic for one seed and changes for another',()=>{
  const {COACH_FEED_CARDS,mixFeed}=loadModules();
  const a=mixFeed(COACH_FEED_CARDS,'2026-09-12|all',12).map(x=>x.id);
  const b=mixFeed(COACH_FEED_CARDS,'2026-09-12|all',12).map(x=>x.id);
  const c=mixFeed(COACH_FEED_CARDS,'2026-09-13|all',12).map(x=>x.id);
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,c);
  assert.ok(new Set(a).size===a.length,'mixed feed should not duplicate cards in one batch');
});

test('answering a question returns immediate explanatory feedback without mutating the card',()=>{
  const {COACH_FEED_CARDS,answerQuestion}=loadModules();
  const card=COACH_FEED_CARDS.find(item=>item.type==='question');
  const snapshot=JSON.stringify(card);
  const correct=answerQuestion(card,card.correctOption);
  assert.equal(correct.isCorrect,true);
  assert.equal(correct.selectedOption,card.correctOption);
  assert.equal(correct.explanation,card.explanation);
  assert.equal(correct.principle,card.principle);
  assert.equal(correct.application,card.application);
  assert.equal(JSON.stringify(card),snapshot);
});

test('coach page is wired as a learning feed with sticky topic navigation',()=>{
  const html=read('coach.html');
  assert.match(html,/coach-feed\.css/);
  assert.match(html,/coach-feed-data\.js/);
  assert.match(html,/coach-feed\.js/);
  assert.match(html,/id=["']coach-topic-nav["']/);
  assert.match(html,/id=["']coach-feed["']/);
  assert.match(html,/id=["']coach-feed-status["']/);
  assert.match(html,/פיד המאמן/);
  assert.doesNotMatch(html,/>אימון 1</);
});

test('new coach scripts have valid JavaScript syntax',()=>{
  for(const file of ['coach-feed-data.js','coach-feed.js']){
    assert.equal(exists(file),true,`${file} must exist`);
    if(!exists(file)) continue;
    const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,`${file}: ${result.stderr}`);
  }
});

test('infinite feed cycle shows every card once before any repeat',()=>{
  const {COACH_FEED_CARDS,buildFeedCycle}=loadModules();
  assert.equal(typeof buildFeedCycle,'function');
  const cycle=buildFeedCycle(COACH_FEED_CARDS,'2026-09-13|all',0);
  assert.equal(cycle.length,COACH_FEED_CARDS.length);
  assert.equal(new Set(cycle.map(card=>card.id)).size,COACH_FEED_CARDS.length);
  assert.deepEqual(new Set(cycle.map(card=>card.id)),new Set(COACH_FEED_CARDS.map(card=>card.id)));
});

test('later infinite feed cycles reshuffle the full pool without dropping cards',()=>{
  const {COACH_FEED_CARDS,buildFeedCycle}=loadModules();
  assert.equal(typeof buildFeedCycle,'function');
  const first=buildFeedCycle(COACH_FEED_CARDS,'2026-09-13|all',0).map(card=>card.id);
  const second=buildFeedCycle(COACH_FEED_CARDS,'2026-09-13|all',1).map(card=>card.id);
  const repeated=buildFeedCycle(COACH_FEED_CARDS,'2026-09-13|all',1).map(card=>card.id);
  assert.deepEqual(second,repeated,'one cycle must be deterministic for the same seed');
  assert.notDeepEqual(first,second,'next cycle should use a fresh shuffle');
  assert.deepEqual(new Set(second),new Set(first),'every cycle must contain the same complete pool');
});

test('infinite cycles preserve the active topic filter',()=>{
  const {COACH_FEED_CARDS,filterCards,buildFeedCycle}=loadModules();
  const topic='explosive-power';
  const filtered=filterCards(COACH_FEED_CARDS,topic);
  const cycle=buildFeedCycle(filtered,'2026-09-13|explosive-power',2);
  assert.equal(cycle.length,filtered.length);
  assert.ok(cycle.length>0);
  assert.ok(cycle.every(card=>card.topic===topic));
});

test('coach page includes an infinite-scroll sentinel',()=>{
  const html=read('coach.html');
  assert.match(html,/id=["']coach-feed-sentinel["']/);
});

test('each coach topic points to its own dedicated page',()=>{
  const {COACH_TOPICS}=loadModules();
  for(const topic of COACH_TOPICS){
    assert.equal(topic.page,topicPages[topic.id],`${topic.id} needs its dedicated page href`);
  }
});

test('all six dedicated coach topic pages use the shared infinite feed engine',()=>{
  for(const [topic,page] of Object.entries(topicPages)){
    assert.equal(exists(page),true,`${page} must exist`);
    if(!exists(page)) continue;
    const html=read(page);
    assert.match(html,new RegExp(`data-coach-fixed-topic=["']${topic}["']`),`${page} must lock to ${topic}`);
    assert.match(html,/href=["']coach\.html["']/,'topic page needs a back link to coach');
    assert.match(html,/id=["']coach-feed["']/);
    assert.match(html,/id=["']coach-feed-status["']/);
    assert.match(html,/id=["']coach-feed-sentinel["']/);
    assert.match(html,/coach-feed-data\.js/);
    assert.match(html,/coach-feed\.js/);
  }
});

test('topic-page mode resolves a fixed topic instead of the all feed',()=>{
  const {resolveInitialTopic}=loadModules();
  assert.equal(typeof resolveInitialTopic,'function');
  assert.equal(resolveInitialTopic('explosive-power'),'explosive-power');
  assert.equal(resolveInitialTopic('sport-psychology'),'sport-psychology');
  assert.equal(resolveInitialTopic('not-a-topic'),'all');
});

test('application sections render as expandable controls with hidden detail',()=>{
  const {COACH_FEED_CARDS,COACH_TOPICS,renderCard}=loadModules();
  const card=COACH_FEED_CARDS.find(item=>item.type!=='question'&&item.application);
  const html=renderCard(card,COACH_TOPICS);
  assert.match(html,/data-coach-expand=["']application["']/);
  assert.match(html,/aria-expanded=["']false["']/);
  assert.match(html,/coach-expand-panel/);
  assert.match(html,/hidden/);
});
