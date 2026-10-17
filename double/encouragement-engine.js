(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DoubleEncouragementEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const THRESHOLDS={
    easy:[.55,.85,1.30,2.10],
    normal:[.65,1.00,1.55,2.60],
    hard:[.80,1.15,1.75,2.90]
  };
  const DIFFICULTY_META={
    easy:{label:'קל',icon:'🌱'},
    normal:{label:'בינוני',icon:'⚡'},
    hard:{label:'קשה',icon:'🔥'}
  };
  const PHRASES={
    british:{1:'Good!',2:'Great!',3:'Amazing!',4:'Incredible!',5:'Legendary!'},
    american:{1:'Good!',2:'Great!',3:'Amazing!',4:'Incredible!',5:'Legendary!'},
    arcade:{1:'Nice!',2:'Great!',3:'Awesome!',4:'Incredible!',5:'LEGENDARY!'},
    russian:{1:'Хорошо!',2:'Отлично!',3:'Потрясающе!',4:'Невероятно!',5:'Легендарно!'},
    italian:{1:'Bene!',2:'Grande!',3:'Fantastico!',4:'Incredibile!',5:'Leggendario!'},
    japanese:{1:'いいね！',2:'すごい！',3:'最高！',4:'信じられない！',5:'伝説級！'}
  };

  function normalizeDifficulty(value){return THRESHOLDS[value]?value:'normal'}
  function baseLevel(seconds,difficulty='normal'){
    const s=Number(seconds),d=normalizeDifficulty(difficulty),t=THRESHOLDS[d];
    if(!Number.isFinite(s)||s<=0)return 1;
    if(s<=t[0])return 5;
    if(s<=t[1])return 4;
    if(s<=t[2])return 3;
    if(s<=t[3])return 2;
    return 1;
  }
  function nextBestMs(previousBestMs,currentMs){
    const prev=Number(previousBestMs),cur=Math.round(Number(currentMs));
    if(!Number.isFinite(cur)||cur<=0)return Number.isFinite(prev)&&prev>0?prev:null;
    if(!Number.isFinite(prev)||prev<=0)return cur;
    return Math.min(prev,cur);
  }
  function phraseFor(pack,level){
    const source=PHRASES[pack]||PHRASES.british;
    return source[Math.max(1,Math.min(5,Number(level)||1))]||source[1];
  }
  function playerLabel(player){return Number(player)===1?'שחקן 2':'שחקן 1'}
  function voiceProfile(level,pack='british'){
    const n=Math.max(1,Math.min(5,Number(level)||1));
    return {
      rate:.92+n*.04,
      volume:Math.min(1,.68+n*.064),
      pitch:pack==='arcade'?1.08+n*.045:.96+n*.025
    };
  }
  function evaluate({seconds,difficulty='normal',previousBestMs=null,player=null}={}){
    const s=Math.max(.001,Number(seconds)||0),timeMs=Math.round(s*1000),d=normalizeDifficulty(difficulty),base=baseLevel(s,d);
    const prev=Number(previousBestMs),isNewBest=Number.isFinite(prev)&&prev>0&&timeMs<prev;
    const level=Math.min(5,base+(isNewBest?1:0)),meta=DIFFICULTY_META[d];
    const playerMeta=player==null?'':' · '+playerLabel(player);
    return {
      seconds:s,
      timeMs,
      baseLevel:base,
      level,
      difficulty:d,
      difficultyLabel:meta.label,
      difficultyIcon:meta.icon,
      player:player==null?null:Number(player),
      isNewBest,
      meta:`${s.toFixed(2)} שנ׳ · ${meta.label} ${meta.icon}${playerMeta}${isNewBest?' · 🏆 NEW BEST':''}`
    };
  }

  return {THRESHOLDS,DIFFICULTY_META,normalizeDifficulty,baseLevel,nextBestMs,phraseFor,playerLabel,voiceProfile,evaluate};
});
