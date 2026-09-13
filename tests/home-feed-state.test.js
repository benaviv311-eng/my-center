const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../home-feed-state.js');

function memoryStorage(){
  const map=new Map();
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v))};
}

test('same Jerusalem day restores order and scroll',()=>{
  const storage=memoryStorage();
  let state=S.load(storage,new Date('2026-09-13T08:00:00Z'));
  state=S.setDailyOrder(state,['a','b','c']);
  state=S.setScroll(state,812);
  S.save(storage,state);
  const again=S.load(storage,new Date('2026-09-13T18:00:00Z'));
  assert.deepEqual(again.day.order,['a','b','c']);
  assert.equal(again.day.scrollY,812);
});

test('new Jerusalem day resets daily state but keeps preferences',()=>{
  const storage=memoryStorage();
  let state=S.load(storage,new Date('2026-09-13T08:00:00Z'));
  state=S.recordSignal(state,{id:'coach:x',source:'coach',type:'concept'},'more',1,new Date('2026-09-13T08:00:00Z'));
  state.day.hidden.push('coach:x');
  state.day.order=['coach:x'];
  S.save(storage,state);
  const next=S.load(storage,new Date('2026-09-14T08:00:00Z'));
  assert.equal(next.profile.sourceAffinity.coach > 0,true);
  assert.deepEqual(next.day.hidden,[]);
  assert.deepEqual(next.day.order,[]);
});

test('hide is daily while saved bridge can be mirrored',()=>{
  let state=S.load(memoryStorage(),new Date('2026-09-13T08:00:00Z'));
  state=S.recordSignal(state,{id:'raika:scene:1',source:'raika',type:'scene'},'hide',1,new Date('2026-09-13T08:00:00Z'));
  state=S.setSaved(state,['raika:scene:1']);
  assert.deepEqual(state.day.hidden,['raika:scene:1']);
  assert.deepEqual(state.profile.saved,['raika:scene:1']);
});
