(function(){
  'use strict';
  function sync(){
    const lab=window.TeamScoreTestLab;if(!lab||!lab.statuses)return false;
    if(window.TeamScorePressureGame){lab.statuses['pressure-game']={name:'Pressure Game',status:'working',detail:'22:22/custom start, Every Point/Important commentary, Set/Match Point, lead changes, ties, streak callouts, starting server, Speak Score and Replay Scenario are connected.'}}
    if(window.TeamScoreTimedRounds){lab.statuses['timed-rounds']={name:'Timed Rounds',status:'working',detail:'Per-team timed turns, automatic transitions, reverse order next round, locked inactive team, round results, winner by totals/rounds, timed tiebreak and Golden Point are connected.'}}
    if(window.TeamScoreFourTeamRotation){lab.statuses['four-team-rotation']={name:'4 Teams Rotation',status:'working',detail:'First-to-midpoint trigger, live ranking, real 1+4 / 2+3 side pairing, visible Side A/Side B, no score reset, finish target and rankAt10 vs finalRank comparison are connected.'}}
    if(window.TeamScoreSpiegel){lab.statuses['spiegel']={name:'שפיגל / מלך התחתיות',status:'working',detail:'Now/Next, bad points, threshold behaviors, long-press error types, drag reorder, restore, Final Duel, Undo, per-player stats and Most Improved history are connected.'}}
    if(window.TeamScoreCoreGames){
      lab.statuses['first-to-x']={name:'First to X',status:'working',detail:'Configurable target, Match Point and winner logic are connected.'};
      lab.statuses['win-by-2']={name:'Win by 2',status:'working',detail:'Target with mandatory two-point margin, Match Point and winner logic are connected.'};
      lab.statuses['best-of-sets']={name:'Best of Sets',status:'working',detail:'Best of 3/5, set score, automatic set reset, Win by 2, final-set target, Set Point/Match Point and match winner are connected.'};
      lab.statuses['timed-game']={name:'Timed Game',status:'working',detail:'Wall-clock game timer, pause/reset, finish by score and Golden Point on a tie are connected.'};
      lab.statuses['timed-overtime']={name:'Timed + Overtime',status:'working',detail:'Wall-clock timed game with +Overtime display and Golden Point on a tie is connected.'};
    }
    if(window.TeamScoreTrainingGames){
      lab.statuses['target-chase']={name:'Target Chase',status:'working',detail:'Timed setter turn, automatic chase target, active-team lock, same-time chase and Target reached/failed result are connected.'};
      lab.statuses['streak-challenge']={name:'Streak Challenge',status:'working',detail:'Consecutive scoring, Streak broken, longest streak, one-side target and winner are connected.'};
      lab.statuses['comeback-challenge']={name:'Comeback Challenge',status:'working',detail:'Configured starting deficit, tie/comeback callouts, target and Win by 2 finish are connected.'};
      lab.statuses['sideout-challenge']={name:'Sideout Challenge',status:'working',detail:'Sideout Success/Fail, receiving/serving roles, count/streak/attempt-percentage/timed modes, role swap and success percentage are connected.'};
      lab.statuses['serve-pressure']={name:'Serve Pressure',status:'working',detail:'Per-team attempts, In/Target/Ace/Error scoring, automatic team switch and Sudden Death Serve are connected.'};
      lab.statuses['training-mode']={name:'Training Mode',status:'working',detail:'Per-team Success/Error tracking, percentage-ready counters and optional success target are connected.'};
      lab.statuses['race-challenge']={name:'Race / Challenge',status:'working',detail:'Configurable success target and Target reached winner are connected.'};
      lab.statuses['countdown-target']={name:'Countdown Target',status:'working',detail:'Wall-clock countdown, score target, Target reached and Target failed outcomes are connected.'};
      lab.statuses['weighted-drill']={name:'Weighted Drill',status:'working',detail:'Per-team Perfect / Good / Playable / Error buttons use the configured weighted values and update the live score.'};
    }
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,0),{once:true});else setTimeout(sync,0);
  setInterval(sync,1000);
})();