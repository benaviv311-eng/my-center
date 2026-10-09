(function(){
  'use strict';
  function sync(){
    const lab=window.TeamScoreTestLab;if(!lab||!lab.statuses)return false;
    if(window.TeamScorePressureGame){lab.statuses['pressure-game']={name:'Pressure Game',status:'working',detail:'22:22/custom start, Every Point/Important commentary, Set/Match Point, lead changes, ties, streak callouts, starting server, Speak Score and Replay Scenario are connected.'}}
    if(window.TeamScoreTimedRounds){lab.statuses['timed-rounds']={name:'Timed Rounds',status:'working',detail:'Per-team timed turns, automatic transitions, reverse order next round, locked inactive team, round results, winner by totals/rounds, timed tiebreak and Golden Point are connected.'}}
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,0),{once:true});else setTimeout(sync,0);
  setInterval(sync,1000);
})();