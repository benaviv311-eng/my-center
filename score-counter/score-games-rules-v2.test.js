const assert=require('assert');
const games=require('./score-games-rules-v2.js');

(function bestOfResetsSetsAndWinsMatch(){
  let g=games.createGame('best-of',{teams:['A','B'],bestOf:3,target:3,winBy2:false});
  g=games.applyScore(g,0,3);
  assert.deepEqual(g.meta.setWins,[1,0]);
  assert.equal(g.finished,false);
  assert.deepEqual(g.teams.map(t=>t.score),[0,0]);
  g=games.applyScore(g,0,3);
  assert.equal(g.finished,true);
  assert.equal(g.winnerId,g.teams[0].id);
})();

(function eliminationUsesLives(){
  let g=games.createGame('elimination',{teams:['A','B','C'],lives:2});
  assert.deepEqual(g.teams.map(t=>t.score),[2,2,2]);
  g=games.applyScore(g,1,-1);
  g=games.applyScore(g,1,-1);
  assert.equal(g.teams[1].eliminated,true);
  g=games.applyScore(g,2,-2);
  assert.equal(g.finished,true);
  assert.equal(g.winnerId,g.teams[0].id);
})();

(function sideoutTracksAttemptsAndSuccessRate(){
  let g=games.createGame('sideout',{teams:['A'],attempts:3,target:99});
  g=games.applyScore(g,0,1);
  g=games.applyScore(g,0,-1);
  g=games.applyScore(g,0,1);
  assert.equal(g.meta.attemptsByTeam[g.teams[0].id],3);
  assert.equal(g.meta.successByTeam[g.teams[0].id],2);
  assert.equal(g.finished,true);
  assert.equal(g.teams[0].score,2);
})();

(function kingWinnerStaysAndNextTeamRotatesIn(){
  let g=games.createGame('king-rotation',{teams:['A','B','C'],target:2,maxStreak:3});
  assert.deepEqual(g.meta.activePair,[0,1]);
  g=games.applyScore(g,0,1);
  g=games.applyScore(g,0,1);
  assert.equal(g.meta.wins[g.teams[0].id],1);
  assert.deepEqual(g.meta.activePair,[0,2]);
  assert.deepEqual(g.teams.map(t=>t.score),[0,0,0]);
})();

(function statsTrackTiesLeadsAndStreaks(){
  let g=games.createGame('free-score',{teams:['A','B']});
  g=games.applyScore(g,0,1);
  g=games.applyScore(g,1,1);
  g=games.applyScore(g,1,1);
  const s=g.meta.stats;
  assert(s.leadChanges>=1);
  assert(s.ties>=1);
  assert.equal(s.longestStreak[g.teams[1].id],2);
})();

(function tournamentRoundRobinBuildsScheduleAndStandings(){
  let t=games.createTournament(['A','B','C'],{format:'round-robin'});
  assert.equal(t.matches.length,3);
  t=games.recordTournamentResult(t,0,10,7);
  assert.equal(t.standings.find(x=>x.name==='A').wins,1);
  assert.equal(t.standings.find(x=>x.name==='B').losses,1);
})();

(function tiebreakPlanHasTimedThenGoldenDefault(){
  const p=games.tiebreakPlan({timedMs:60000});
  assert.equal(p[0].mode,'timed-rounds');
  assert.equal(p[1].mode,'golden-point');
})();

console.log('score-games-rules-v2 tests passed');
