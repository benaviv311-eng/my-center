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
