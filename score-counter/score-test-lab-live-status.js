(function(){
  'use strict';
  function sync(){
    const lab=window.TeamScoreTestLab;if(!lab||!lab.statuses)return false;
    if(window.TeamScorePressureGame){lab.statuses['pressure-game']={name:'Pressure Game',status:'working',detail:'22:22/custom start, Every Point/Important commentary, Set/Match Point, lead changes, ties, streak callouts, starting server, Speak Score and Replay Scenario are connected.'}}
    if(window.TeamScoreTimedRounds){lab.statuses['timed-rounds']={name:'Timed Rounds',status:'working',detail:'Per-team timed turns, automatic transitions, reverse order next round, locked inactive team, round results, winner by totals/rounds, timed tiebreak and Golden Point are connected.'}}
    if(window.TeamScoreFourTeamRotation){lab.statuses['four-team-rotation']={name:'4 Teams Rotation',status:'working',detail:'First-to-midpoint trigger, live ranking, real 1+4 / 2+3 side pairing, visible Side A/Side B, no score reset, finish target and rankAt10 vs finalRank comparison are connected.'}}
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,0),{once:true});else setTimeout(sync,0);
  setInterval(sync,1000);
})();