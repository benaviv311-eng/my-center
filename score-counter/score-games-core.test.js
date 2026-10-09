const assert=require('assert');
const core=require('./score-games-core.js');

(function catalogContainsApprovedModes(){
  const ids=new Set(core.catalog.map(x=>x.id));
  ['free-score','first-to','timed-game','timed-rounds','pressure','target-chase','streak','comeback','sideout','serve-pressure','training','race','random','team-battle','king-rotation','elimination','countdown-target','tournament','custom','four-team','spiegel','weighted-drill','player-tracking','multi-team','individual'].forEach(id=>assert(ids.has(id),id));
})();

(function firstToHonorsWinByTwo(){
  let g=core.createGame('first-to',{teams:['A','B'],target:5,winBy2:true,startScores:[4,4]});
  g=core.applyScore(g,0,1);
  assert.equal(g.finished,false);
  g=core.applyScore(g,0,1);
  assert.equal(g.finished,true);
  assert.equal(g.winnerId,g.teams[0].id);
})();

(function pressureStartsAtChosenScore(){
  const g=core.createGame('pressure',{teams:['A','B'],startScores:[22,23],target:25,winBy2:true});
  assert.deepEqual(g.teams.map(t=>t.score),[22,23]);
})();

(function timedRoundsAlternatesOrderAndTotals(){
  let g=core.createGame('timed-rounds',{teams:['A','B'],rounds:2,turnMs:180000});
  g=core.applyScore(g,0,7);
  g=core.nextTimedRoundTurn(g);
  assert.equal(g.activeTeamIndex,1);
  g=core.applyScore(g,1,5);
  g=core.nextTimedRoundTurn(g);
  assert.equal(g.round,2);
  assert.equal(g.activeTeamIndex,1);
  assert.deepEqual(g.meta.roundResults[0],[7,5]);
})();

(function fourTeamRegroupsAtFirstTenWithoutReset(){
  let g=core.createGame('four-team',{teams:['A','B','C','D'],halfway:10,target:20});
  g=core.applyScore(g,2,10);
  assert.equal(g.meta.regrouped,true);
  assert.equal(g.teams[2].score,10);
  const sides=g.meta.sides;
  assert.equal(sides.length,2);
  assert.equal(new Set(sides.flat()).size,4);
  const ranks=core.rankTeams(g);
  assert.equal(ranks[0].name,'C');
  assert(sides.some(side=>side.includes(ranks[0].id)&&side.includes(ranks[3].id)));
})();

(function spiegelTracksBadPointsCategoriesAndUndo(){
  let g=core.createGame('spiegel',{players:['Dana','Noa'],badPointLimit:3});
  g=core.applyBadPoint(g,0,'reception');
  g=core.applyBadPoint(g,0,'net');
  assert.equal(g.teams[0].badPoints,2);
  assert.deepEqual(g.teams[0].errors,{reception:1,net:1});
  g=core.undo(g);
  assert.equal(g.teams[0].badPoints,1);
  assert.deepEqual(g.teams[0].errors,{reception:1});
  g=core.redo(g);
  assert.equal(g.teams[0].badPoints,2);
})();

(function spiegelEliminatesAtLimit(){
  let g=core.createGame('spiegel',{players:['Dana','Noa'],badPointLimit:2});
  g=core.applyBadPoint(g,0,'other');
  g=core.applyBadPoint(g,0,'other');
  assert.equal(g.teams[0].eliminated,true);
  assert.equal(g.finished,true);
  assert.equal(g.winnerId,g.teams[1].id);
})();

(function streakEndsAtTarget(){
  let g=core.createGame('streak',{teams:['A','B'],streakTarget:3});
  g=core.applyScore(g,0,1);g=core.applyScore(g,0,1);g=core.applyScore(g,0,1);
  assert.equal(g.finished,true);
  assert.equal(g.meta.streak,3);
})();

(function weightedCustomScoringUsesRulePoints(){
  let g=core.createGame('weighted-drill',{teams:['A'],rules:{perfect:3,good:2,error:-1}});
  g=core.applyAction(g,0,'perfect');
  g=core.applyAction(g,0,'error');
  assert.equal(g.teams[0].score,2);
})();

(function customModeCanBeCreated(){
  const mode=core.createCustomMode({id:'pressure-serve-60',name:'Pressure Serve 60',target:10,winBy2:false});
  assert.equal(mode.id,'pressure-serve-60');
  assert.equal(mode.kind,'custom');
})();

console.log('score-games-core tests passed');
