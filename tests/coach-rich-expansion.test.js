const test=require('node:test');
const assert=require('node:assert/strict');

function loadCoach(){
  delete require.cache[require.resolve('../coach-feed-data.js')];
  delete require.cache[require.resolve('../coach-feed.js')];
  return {...require('../coach-feed-data.js'),...require('../coach-feed.js')};
}

function loadHub(){
  delete require.cache[require.resolve('../coach-hub.js')];
  return require('../coach-hub.js');
}

test('every coach topic exposes a rich expandable learning section on standard cards',()=>{
  const {COACH_TOPICS,COACH_FEED_CARDS,renderCard}=loadCoach();
  for(const topic of COACH_TOPICS){
    const card=COACH_FEED_CARDS.find(item=>item.topic===topic.id&&item.type!=='question'&&item.application);
    assert.ok(card,`missing expandable card for ${topic.id}`);
    const html=renderCard(card,COACH_TOPICS);
    assert.match(html,/coach-learning-grid/,`${topic.id} needs a rich learning grid`);
    assert.ok((html.match(/coach-learning-section/g)||[]).length>=4,`${topic.id} needs at least four deep-learning sections`);
  }
});

test('question cards also provide a deeper learning expansion',()=>{
  const {COACH_TOPICS,COACH_FEED_CARDS,renderCard}=loadCoach();
  const card=COACH_FEED_CARDS.find(item=>item.type==='question');
  const html=renderCard(card,COACH_TOPICS);
  assert.match(html,/data-coach-expand=["']deep-dive["']/);
  assert.match(html,/coach-learning-grid/);
});

test('today learning cards are full links to the matching coach topic page',()=>{
  const {COACH_TOPICS,COACH_FEED_CARDS}=loadCoach();
  const {renderTodayItem}=loadHub();
  assert.equal(typeof renderTodayItem,'function');
  const card=COACH_FEED_CARDS.find(item=>item.topic==='coaching-language');
  const html=renderTodayItem(card,COACH_TOPICS,0);
  assert.match(html,/^<a /);
  assert.match(html,/class=["']coach-today-card/);
  assert.match(html,/href=["']coach-coaching-language\.html["']/);
});

test('next-practice card is a full link to the matching coach topic page',()=>{
  const {COACH_TOPICS,COACH_FEED_CARDS}=loadCoach();
  const {renderNextPracticeItem}=loadHub();
  assert.equal(typeof renderNextPracticeItem,'function');
  const card=COACH_FEED_CARDS.find(item=>item.topic==='explosive-power'&&item.application);
  const html=renderNextPracticeItem(card,COACH_TOPICS);
  assert.match(html,/^<a /);
  assert.match(html,/class=["']coach-next-practice-link/);
  assert.match(html,/href=["']coach-explosive-power\.html["']/);
});
