(function(root,factory){
  const base=typeof module==='object'&&module.exports?require('./score-games-rules-v2.js'):(root&&root.ScoreGamesCore);
  const api=factory(base);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&base)root.ScoreGamesCore=api;
})(typeof window!=='undefined'?window:null,function(base){
  if(!base||base._customRulesV2Enhanced)return base;
  const create=base.createGame.bind(base),score=base.applyScore.bind(base),action=base.applyAction.bind(base);
  function configure(g,options={}){
    if(g.mode!=='custom')return g;g.settings.target=Math.max(1,Number(options.target)||10);g.settings.winBy2=!!options.winBy2;g.settings.rules=Object.assign({},options.rules||{});g.settings.customWinCondition=options.customWinCondition||'target';g.settings.customName=String(options.name||'Custom Game');g.definition=Object.assign({},g.definition,{name:g.settings.customName});return g;
  }
  function createGame(modeId,options={}){return configure(create(modeId,options),options)}
  function resolveWinner(g){
    if(g.mode!=='custom'||g.finished||g.settings.customWinCondition!=='target')return g;const target=g.settings.target||10,sorted=g.teams.slice().sort((a,b)=>b.score-a.score),leader=sorted[0],second=sorted[1];if(!leader||leader.score<target)return g;if(g.settings.winBy2&&second&&leader.score-second.score<2)return g;g.finished=true;g.winnerId=leader.id;g.lastEvent={type:'winner',teamId:leader.id};return g;
  }
  function applyScore(g,target,delta=1,detail={}){return resolveWinner(score(g,target,delta,detail))}
  function applyAction(g,target,act){return resolveWinner(action(g,target,act))}
  Object.assign(base,{createGame,applyScore,applyAction,_customRulesV2Enhanced:true});return base;
});
