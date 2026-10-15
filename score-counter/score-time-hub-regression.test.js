const assert=require('assert');
const fs=require('fs');
const path=require('path');
const hub=require('./score-time-hub.js');

function rootBase(){
  return {
    Date,
    localStorage:{getItem(){return null},setItem(){},removeItem(){}},
    dispatchEvent(){},
    CustomEvent:function(type,init){this.type=type;this.detail=init&&init.detail}
  };
}

{
  const root=rootBase();
  root.TeamScoreTimeCenter={state:{mode:'timer',running:false,anchorValueMs:60000,durationMs:60000,ended:false,overtimeActive:false,interval:{phase:'work',round:1,rounds:8}},start(){this.started=true},pause(){this.paused=true},reset(){this.resetCalled=true},open(){this.opened=true}};
  root.TeamScoreGameSuite={getSession:()=>({mode:'timed-rounds',modeName:'Timed Rounds',config:{duration:120000}}),timer:{mode:'timer',running:false,baseMs:120000,durationMs:120000,startedWall:0,interval:{phase:'work',round:1,rounds:1}}};
  root.TeamScoreTimedRounds={getTimingSnapshot:()=>({phase:'turn',running:true,remainingMs:45000,activeTeam:1,activeTeamName:'כחול',round:2,rounds:4,tiebreak:false,golden:false,finished:false}),pause(){this.pauseCalled=true},startNow(){this.startCalled=true},skip(){this.skipCalled=true},addBreak(){this.breakCalled=true}};
  const core=hub.createCore(root);
  const snap=core.getSnapshot(1000);
  assert.equal(snap.id,'timed-rounds','Timed Rounds must have highest priority');
  assert.equal(snap.valueMs,45000);
  assert.match(snap.context,/כחול/);
  assert.match(snap.context,/2\/4/);
  assert.equal(core.perform('pause'),true);
  assert.equal(root.TeamScoreTimedRounds.pauseCalled,true);
}

{
  const root=rootBase();
  root.TeamScoreTimeCenter={state:{mode:'timer',running:false,anchorValueMs:60000,durationMs:60000,ended:false,overtimeActive:false,interval:{}},start(){},pause(){},reset(){},open(){}};
  root.TeamScoreGameSuite={getSession:()=>({mode:'countdown-target',modeName:'Countdown Target',config:{duration:90000,target:10}}),timer:{mode:'timer',running:false,baseMs:90000,durationMs:90000,startedWall:0,interval:{}}};
  const core=hub.createCore(root);
  assert.equal(core.getSnapshot(1000).id,'game-suite','Game Suite must beat Time Center');
}

{
  const root=rootBase();
  root.TeamScoreTimeCenter={state:{mode:'stopwatch',running:true,anchorValueMs:5000,anchorWall:1000,ended:false,overtimeActive:false,interval:{}},start(){this.started=true},pause(){this.paused=true},reset(){},lap(){},split(){},open(){}};
  const core=hub.createCore(root);
  const snap=core.getSnapshot(4000);
  assert.equal(snap.id,'time-center');
  assert.equal(snap.valueMs,8000,'standalone stopwatch must derive from provider wall clock');
  assert.equal(core.perform('pause'),true);
  assert.equal(root.TeamScoreTimeCenter.paused,true);
}

{
  const core=hub.createCore(rootBase());
  const snap=core.getSnapshot(1000);
  assert.equal(snap.id,'idle');
  assert.equal(snap.status,'idle');
}

{
  const root=rootBase();
  const suite={getSession:()=>({mode:'timed-game',modeName:'Timed Game',config:{duration:60000}}),timer:{mode:'timer',running:false,baseMs:60000,durationMs:60000,startedWall:0,interval:{}}};
  root.TeamScoreGameSuite=suite;
  const core=hub.createCore(root);
  assert.equal(core.perform('start',1000),true);
  assert.equal(suite.timer.running,true);
  assert.equal(suite.timer.startedWall,1000);
  assert.equal(core.getSnapshot(4000).valueMs,57000);
  assert.equal(core.perform('pause',4000),true);
  assert.equal(suite.timer.running,false);
  assert.equal(suite.timer.baseMs,57000);
}

const source=fs.readFileSync(path.join(__dirname,'score-time-hub.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'score-time-hub.css'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const token of ['score-time-hub','data-time-hub-clock','data-time-hub-label','data-time-hub-context','data-time-hub-action','teamScoreTimeHub.ui.v1','teamscore:timechange']){
  assert(source.includes(token),`missing ${token}`);
}
assert(!/teamScoreTimeHub\.ui\.v1[^\n]*(valueMs|baseMs|deadline|running)/.test(source),'UI persistence must not store timer state');
assert(css.includes('body.score-time-hub-ready .score-live-timer'),'legacy compact timer must be hidden only after hub ready');
assert(!css.includes('body.score-time-hub-ready .score-time-center-panel{display:none'),'full Time Center must remain usable');
assert(css.includes('min-height:44px'),'touch actions must be at least 44px high');
assert(index.includes('score-time-hub.css?v=1'),'loader missing hub css');
assert(index.includes('score-time-hub.js?v=1'),'loader missing hub js');
for(const provider of ['score-game-suite.js','score-time-center.js','score-timed-rounds.js']){
  assert(index.indexOf(provider)<index.indexOf('score-time-hub.js'),`${provider} must load before time hub`);
}
console.log('score-time-hub regression checks passed');
