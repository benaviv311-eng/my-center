const assert=require('assert');
const core=require('./score-timer-v2-core.js');

(function stopwatchUsesTimestamps(){
  let s=core.createTimerState({mode:'stopwatch',now:1000});
  s=core.transition(s,{type:'START',now:1000});
  assert.equal(core.snapshot(s,3500).displayMs,2500);
  s=core.transition(s,{type:'PAUSE',now:3500});
  assert.equal(core.snapshot(s,9000).displayMs,2500);
})();

(function countdownCompletesAndCanOvertime(){
  let s=core.createTimerState({mode:'timer',durationMs:3000,now:0});
  s=core.transition(s,{type:'START',now:0});
  assert.equal(core.snapshot(s,1500).displayMs,1500);
  assert.equal(core.snapshot(s,3500).finished,true);
  s=core.transition(s,{type:'SET_OVERTIME',enabled:true,now:3500});
  const snap=core.snapshot(s,4200);
  assert.equal(snap.overtime,true);
  assert.equal(snap.overtimeMs,1200);
})();

(function intervalsAdvanceWorkRestRounds(){
  const plan=core.createIntervalPlan({workMs:1000,restMs:500,rounds:2,startDelayMs:500});
  let s=core.createTimerState({mode:'intervals',intervalPlan:plan,now:0});
  s=core.transition(s,{type:'START',now:0});
  assert.equal(core.snapshot(s,250).phase,'delay');
  assert.equal(core.snapshot(s,750).phase,'work');
  assert.equal(core.snapshot(s,1600).phase,'rest');
  assert.equal(core.snapshot(s,2200).phase,'work');
  assert.equal(core.snapshot(s,3300).finished,true);
})();

(function restoreUsesSavedTimestamps(){
  let s=core.createTimerState({mode:'timer',durationMs:10000,now:1000});
  s=core.transition(s,{type:'START',now:1000});
  const saved=core.serialize(s);
  const restored=core.restoreTimer(saved,5000);
  assert.equal(core.snapshot(restored,5000).displayMs,6000);
})();

(function formatClockSupportsHours(){
  assert.equal(core.formatClock(65000),'01:05');
  assert.equal(core.formatClock(3661000),'1:01:01');
})();

console.log('score-timer-v2-core tests passed');
