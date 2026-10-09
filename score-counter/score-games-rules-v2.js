(function(root,factory){
  const base=typeof module==='object'&&module.exports?require('./score-games-core.js'):(root&&root.ScoreGamesCore);
  const api=factory(base);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root&&base) root.ScoreGamesCore=api;
})(typeof window!=='undefined'?window:null,function(base){
  if(!base) return null;
  if(base._rulesV2Enhanced) return base;

  const originalCreate=base.createGame.bind(base);
  const originalApplyScore=base.applyScore.bind(base);
  const originalApplyAction=base.applyAction.bind(base);
  const originalAnnouncement=base.announcementFor.bind(base);
  const clone=v=>JSON.parse(JSON.stringify(v));

  function initStats(game){
    game.meta=game.meta||{};
    game.meta.stats=game.meta.stats||{leadChanges:0,ties:0,lastWasTie:false,leaderId:null,lastNonTieLeaderId:null,currentStreakTeamId:null,currentStreak:0,longestStreak:{},pointsByTeam:{},biggestDeficit:{},scoreEvents:0};
    game.teams.forEach(t=>{game.meta.stats.longestStreak[t.id]=game.meta.stats.longestStreak[t.id]||0;game.meta.stats.pointsByTeam[t.id]=game.meta.stats.pointsByTeam[t.id]||0;game.meta.stats.biggestDeficit[t.id]=game.meta.stats.biggestDeficit[t.id]||0});
  }

  function createGame(modeId,options={}){
    const opts=Object.assign({},options);
    if(modeId==='king-rotation'&&!Number.isFinite(Number(opts.target))) opts.target=1;
    const game=originalCreate(modeId,opts);initStats(game);
    if(modeId==='best-of'){
      game.settings.bestOf=[3,5].includes(Number(options.bestOf))?Number(options.bestOf):3;game.settings.target=Math.max(1,Number(options.target)||25);game.settings.winBy2=options.winBy2!==false;game.meta.setWins=game.teams.map(()=>0);game.meta.setResults=[];game.meta.currentSet=1;
    }
    if(modeId==='elimination'){
      const lives=Math.max(1,Number(options.lives)||3);game.settings.lives=lives;game.teams.forEach(t=>{t.lives=lives;t.score=lives;t.eliminated=false});
    }
    if(modeId==='sideout'){
      game.settings.attempts=Math.max(1,Number(options.attempts)||10);game.settings.target=Math.max(1,Number(options.target)||game.settings.attempts);game.meta.attemptsByTeam={};game.meta.successByTeam={};game.teams.forEach(t=>{game.meta.attemptsByTeam[t.id]=0;game.meta.successByTeam[t.id]=0;t.score=0});
    }
    if(modeId==='serve-pressure'){
      game.settings.attempts=Math.max(1,Number(options.attempts)||10);game.meta.attemptsByTeam={};game.meta.successByTeam={};game.teams.forEach(t=>{game.meta.attemptsByTeam[t.id]=0;game.meta.successByTeam[t.id]=0});
    }
    if(modeId==='king-rotation'){
      game.settings.maxStreak=Math.max(0,Number(options.maxStreak)||0);game.meta.activePair=game.teams.length>1?[0,1]:[0];game.meta.queue=game.teams.map((_,i)=>i).slice(2);game.meta.wins={};game.meta.kingStreak={};game.teams.forEach(t=>{game.meta.wins[t.id]=0;game.meta.kingStreak[t.id]=0;t.score=0});
    }
    if(modeId==='spiegel'){game.meta.turnOrder=game.teams.map((_,i)=>i);game.meta.turnPosition=0}
    return game;
  }

  function meetsTarget(game,team){
    const target=Math.max(1,Number(game.settings.target)||1);if(team.score<target)return false;if(!game.settings.winBy2)return true;const next=Math.max(...game.teams.filter(t=>t.id!==team.id).map(t=>t.score),-Infinity);return team.score-next>=2;
  }

  function updateStats(game,targetIndex,delta,beforeScores){
    initStats(game);const s=game.meta.stats,team=game.teams[targetIndex];if(!team)return;s.scoreEvents++;
    if(delta>0){s.pointsByTeam[team.id]=(s.pointsByTeam[team.id]||0)+delta;if(s.currentStreakTeamId===team.id)s.currentStreak+=delta;else{s.currentStreakTeamId=team.id;s.currentStreak=delta}s.longestStreak[team.id]=Math.max(s.longestStreak[team.id]||0,s.currentStreak)}else if(delta<0){s.currentStreakTeamId=null;s.currentStreak=0}
    const beforeMax=Math.max(...beforeScores);game.teams.forEach((t,i)=>{s.biggestDeficit[t.id]=Math.max(s.biggestDeficit[t.id]||0,beforeMax-beforeScores[i])});
    const scores=game.teams.map(t=>t.score),max=Math.max(...scores),leaders=game.teams.filter(t=>t.score===max),tied=leaders.length>1;
    if(tied&&!s.lastWasTie)s.ties++;
    if(!tied){const leader=leaders[0].id;if(s.lastNonTieLeaderId&&s.lastNonTieLeaderId!==leader)s.leadChanges++;s.leaderId=leader;s.lastNonTieLeaderId=leader}else s.leaderId=null;s.lastWasTie=tied;
  }

  function applyBestOf(game,target,delta,detail){
    const before=game.teams.map(t=>t.score);let g=originalApplyScore(game,target,delta,detail);const i=typeof target==='number'?target:g.teams.findIndex(t=>t.id===target),team=g.teams[Math.max(0,i)];updateStats(g,Math.max(0,i),Number(delta)||0,before);
    if(team&&meetsTarget(g,team)){g.meta.setWins[i]=(g.meta.setWins[i]||0)+1;g.meta.setResults.push({set:g.meta.currentSet,scores:g.teams.map(t=>t.score),winnerId:team.id});const needed=Math.floor(g.settings.bestOf/2)+1;if(g.meta.setWins[i]>=needed){g.finished=true;g.winnerId=team.id;g.lastEvent={type:'match-win',teamId:team.id,setWins:g.meta.setWins.slice()}}else{g.meta.currentSet++;g.teams.forEach(t=>t.score=0);g.lastEvent={type:'set-win',teamId:team.id,set:g.meta.currentSet-1,setWins:g.meta.setWins.slice()}}}
    return g;
  }

  function applyElimination(game,target,delta,detail){
    const before=game.teams.map(t=>t.score);let g=originalApplyScore(game,target,delta,detail);const i=typeof target==='number'?target:g.teams.findIndex(t=>t.id===target),team=g.teams[Math.max(0,i)];if(!team)return g;team.score=Math.max(0,Math.min(g.settings.lives,team.score));team.lives=team.score;if(team.score<=0){team.eliminated=true;g.lastEvent={type:'life-eliminated',teamId:team.id}}else g.lastEvent={type:'lives',teamId:team.id,lives:team.score};const alive=g.teams.filter(t=>!t.eliminated);if(alive.length===1){g.finished=true;g.winnerId=alive[0].id;g.lastEvent={type:'winner',teamId:alive[0].id}}updateStats(g,Math.max(0,i),Number(delta)||0,before);return g;
  }

  function applySideout(game,target,delta,detail){
    const i=typeof target==='number'?target:game.teams.findIndex(t=>t.id===target),before=game.teams.map(t=>t.score),success=Number(delta)>0;let g=originalApplyScore(game,target,success?1:0,detail),team=g.teams[Math.max(0,i)];if(!team)return g;g.meta.attemptsByTeam[team.id]=(g.meta.attemptsByTeam[team.id]||0)+1;if(success)g.meta.successByTeam[team.id]=(g.meta.successByTeam[team.id]||0)+1;team.score=g.meta.successByTeam[team.id];g.lastEvent={type:'sideout',teamId:team.id,success,attempts:g.meta.attemptsByTeam[team.id],successes:team.score};if(g.meta.attemptsByTeam[team.id]>=g.settings.attempts||team.score>=g.settings.target){g.finished=true;g.winnerId=team.id;g.lastEvent={type:'sideout-finished',teamId:team.id,attempts:g.meta.attemptsByTeam[team.id],successes:team.score}}updateStats(g,Math.max(0,i),success?1:0,before);return g;
  }

  function applyKing(game,target,delta,detail){
    const i=typeof target==='number'?target:game.teams.findIndex(t=>t.id===target);if(!game.meta.activePair.includes(i))return game;const before=game.teams.map(t=>t.score);let g=originalApplyScore(game,target,delta,detail),team=g.teams[i];updateStats(g,i,Number(delta)||0,before);
    if(Number(delta)>0&&team.score>=g.settings.target){const loser=g.meta.activePair.find(x=>x!==i);g.meta.wins[team.id]=(g.meta.wins[team.id]||0)+1;g.meta.kingStreak[team.id]=(g.meta.kingStreak[team.id]||0)+1;if(loser!=null)g.meta.kingStreak[g.teams[loser].id]=0;if(loser!=null)g.meta.queue.push(loser);let next=g.meta.queue.shift();const forceRotate=g.settings.maxStreak>0&&g.meta.kingStreak[team.id]>=g.settings.maxStreak&&g.meta.queue.length>0;if(forceRotate){g.meta.queue.push(i);g.meta.kingStreak[team.id]=0;const second=g.meta.queue.shift();g.meta.activePair=[next,second].filter(x=>x!=null)}else g.meta.activePair=[i,next].filter(x=>x!=null);g.teams.forEach(t=>t.score=0);g.lastEvent={type:'king-rotation',teamId:team.id,activePair:g.meta.activePair.slice(),wins:g.meta.wins[team.id]}}
    return g;
  }

  function applyScore(game,target,delta=1,detail={}){
    if(game.mode==='best-of')return applyBestOf(game,target,delta,detail);if(game.mode==='elimination')return applyElimination(game,target,delta,detail);if(game.mode==='sideout')return applySideout(game,target,delta,detail);if(game.mode==='king-rotation')return applyKing(game,target,delta,detail);const before=game.teams.map(t=>t.score),g=originalApplyScore(game,target,delta,detail),i=typeof target==='number'?target:g.teams.findIndex(t=>t.id===target);updateStats(g,Math.max(0,i),Number(delta)||0,before);return g;
  }

  function applyAction(game,target,action){
    const beforeAttempts=game.mode==='serve-pressure'?clone(game.meta.attemptsByTeam||{}):null;let g=originalApplyAction(game,target,action);
    if(game.mode==='serve-pressure'){const i=typeof target==='number'?target:g.teams.findIndex(t=>t.id===target),team=g.teams[Math.max(0,i)];if(team){g.meta.attemptsByTeam[team.id]=(beforeAttempts[team.id]||0)+1;const points=Number((g.settings.rules||{})[action])||0;if(points>0)g.meta.successByTeam[team.id]=(g.meta.successByTeam[team.id]||0)+1;g.lastEvent={type:'serve-attempt',teamId:team.id,action,points,attempts:g.meta.attemptsByTeam[team.id]};if(g.meta.attemptsByTeam[team.id]>=g.settings.attempts){g.finished=true;g.winnerId=team.id;g.lastEvent={type:'serve-finished',teamId:team.id,attempts:g.meta.attemptsByTeam[team.id],score:team.score}}}}
    return g;
  }

  function createTournament(names,options={}){
    const teams=names.map((name,i)=>({id:`t${i+1}`,name:String(name),wins:0,losses:0,draws:0,pointsFor:0,pointsAgainst:0,tablePoints:0})),matches=[];for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++)matches.push({id:matches.length,homeId:teams[i].id,awayId:teams[j].id,played:false,homeScore:null,awayScore:null});return{version:1,format:options.format||'round-robin',teams,matches,standings:clone(teams)};
  }

  function recordTournamentResult(tournament,matchIndex,homeScore,awayScore){
    const t=clone(tournament),m=t.matches[matchIndex];if(!m||m.played)return t;m.played=true;m.homeScore=Number(homeScore)||0;m.awayScore=Number(awayScore)||0;const h=t.teams.find(x=>x.id===m.homeId),a=t.teams.find(x=>x.id===m.awayId);h.pointsFor+=m.homeScore;h.pointsAgainst+=m.awayScore;a.pointsFor+=m.awayScore;a.pointsAgainst+=m.homeScore;if(m.homeScore>m.awayScore){h.wins++;a.losses++;h.tablePoints+=3}else if(m.awayScore>m.homeScore){a.wins++;h.losses++;a.tablePoints+=3}else{h.draws++;a.draws++;h.tablePoints++;a.tablePoints++}t.standings=clone(t.teams).sort((x,y)=>(y.tablePoints-x.tablePoints)||((y.pointsFor-y.pointsAgainst)-(x.pointsFor-x.pointsAgainst))||(y.pointsFor-x.pointsFor));return t;
  }

  function tiebreakPlan(options={}){return[{mode:'timed-rounds',turnMs:Math.max(1000,Number(options.timedMs)||60000),rounds:1},{mode:'golden-point',target:1}]}
  function advanceSpiegelTurn(game){if(game.mode!=='spiegel')return game;const alive=game.meta.turnOrder.filter(i=>!game.teams[i].eliminated);if(!alive.length)return game;const current=alive.indexOf(game.meta.turnOrder[game.meta.turnPosition]);game.meta.turnPosition=game.meta.turnOrder.indexOf(alive[(Math.max(0,current)+1)%alive.length]);game.activeTeamIndex=game.meta.turnOrder[game.meta.turnPosition];return game}
  function statsSummary(game){const s=game?.meta?.stats||{};return{leadChanges:s.leadChanges||0,ties:s.ties||0,longestStreak:clone(s.longestStreak||{}),pointsByTeam:clone(s.pointsByTeam||{}),biggestDeficit:clone(s.biggestDeficit||{})}}

  function announcementFor(game){
    const e=game.lastEvent;if(!e)return originalAnnouncement(game);const team=e.teamId?game.teams.find(t=>t.id===e.teamId):null,name=team?(team.pronunciation||team.name):'';if(e.type==='set-win')return`${name} wins set ${e.set}`;if(e.type==='match-win')return`${name} wins the match`;if(e.type==='lives')return`${name}. ${e.lives} lives remaining`;if(e.type==='life-eliminated')return`${name}. Eliminated`;if(e.type==='sideout')return e.success?`${name}. Sideout successful`:`${name}. Sideout failed`;if(e.type==='sideout-finished')return`${name}. ${e.successes} successful sideouts`;if(e.type==='king-rotation')return`${name} stays. Next team`;if(e.type==='serve-finished')return`${name}. Serve challenge complete`;return originalAnnouncement(game);
  }

  Object.assign(base,{createGame,applyScore,applyAction,announcementFor,createTournament,recordTournamentResult,tiebreakPlan,advanceSpiegelTurn,statsSummary,_rulesV2Enhanced:true});return base;
});
