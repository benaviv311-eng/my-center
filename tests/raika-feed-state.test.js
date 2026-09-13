const test=require('node:test');
const assert=require('node:assert/strict');
const s=require('../raika-creative-feed-state.js');

test('append dedupes ids and loading guard blocks duplicate requests',()=>{
  let st=s.createFeedState();
  st=s.appendCards(st,[{id:'a'},{id:'a'},{id:'b'}]);
  assert.deepEqual(st.cards.map(x=>x.id),['a','b']);
  st=s.setLoading(st,true);
  assert.equal(s.canLoadMore(st),false);
});

test('more-like inserts after seed without deleting seed',()=>{
  let st=s.appendCards(s.createFeedState(),[{id:'a'},{id:'b'}]);
  st=s.insertCardsAfter(st,'a',[{id:'x'},{id:'y'}]);
  assert.deepEqual(st.cards.map(x=>x.id),['a','x','y','b']);
});

test('surprise refresh preserves locked saved/developed cards',()=>{
  let st=s.appendCards(s.createFeedState(),[{id:'a'},{id:'b'}]);
  st=s.lockCard(st,'a');
  st=s.replaceUnlockedCards(st,[{id:'c'}]);
  assert.deepEqual(st.cards.map(x=>x.id),['a','c']);
});

test('hidden cards stay in history but are marked hidden',()=>{
  let st=s.appendCards(s.createFeedState(),[{id:'a'},{id:'b'}]);
  st=s.hideCard(st,'a');
  assert.deepEqual(st.cards.map(x=>x.id),['a','b']);
  assert.equal(st.hidden.has('a'),true);
});
