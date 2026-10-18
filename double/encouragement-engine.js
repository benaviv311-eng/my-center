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
    british:{1:'Nicely done.',2:'Well played!',3:'Brilliant!',4:'Outstanding!',5:'Absolutely legendary!'},
    american:{1:'Nice!',2:"Let's go!",3:'Awesome!',4:'Unreal!',5:'That was legendary!'},
    arcade:{1:'Good hit!',2:'Combo up!',3:'Power play!',4:'MEGA MATCH!',5:'ULTRA LEGEND!'},
    russian:{1:'Хорошо!',2:'Отлично!',3:'Потрясающе!',4:'Невероятно!',5:'Легендарно!'},
    italian:{1:'Bene!',2:'Grande!',3:'Fantastico!',4:'Incredibile!',5:'Leggendario!'},
    japanese:{1:'いいね！',2:'すごい！',3:'最高！',4:'信じられない！',5:'伝説級！'}
  };
  const ANNOUNCER_PROFILES={
    british:{rateBase:.84,rateStep:.045,volumeBase:.68,volumeStep:.055,pitchBase:.88,pitchStep:.020},
    american:{rateBase:.91,rateStep:.055,volumeBase:.72,volumeStep:.056,pitchBase:.96,pitchStep:.026},
    arcade:{rateBase:.96,rateStep:.060,volumeBase:.76,volumeStep:.050,pitchBase:1.12,pitchStep:.050},
    russian:{rateBase:.76,rateStep:.044,volumeBase:.75,volumeStep:.050,pitchBase:.72,pitchStep:.028},
    italian:{rateBase:.88,rateStep:.055,volumeBase:.72,volumeStep:.054,pitchBase:1.00,pitchStep:.032},
    japanese:{rateBase:.87,rateStep:.048,volumeBase:.69,volumeStep:.050,pitchBase:.99,pitchStep:.030}
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
  function normalizePack(value){return PHRASES[value]?value:'british'}
  function phraseFor(pack,level){
    const source=PHRASES[normalizePack(pack)];
    return source[Math.max(1,Math.min(5,Number(level)||1))]||source[1];
  }
  function playerLabel(player){return Number(player)===1?'שחקן 2':'שחקן 1'}
  function voiceProfile(level,pack='british'){
    const n=Math.max(1,Math.min(5,Number(level)||1)),p=ANNOUNCER_PROFILES[normalizePack(pack)];
    return {
      rate:Math.min(2,Number((p.rateBase+n*p.rateStep).toFixed(3))),
      volume:Math.min(1,Number((p.volumeBase+n*p.volumeStep).toFixed(3))),
      pitch:Math.max(.5,Math.min(2,Number((p.pitchBase+n*p.pitchStep).toFixed(3))))
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

  return {THRESHOLDS,DIFFICULTY_META,PHRASES,ANNOUNCER_PROFILES,normalizeDifficulty,normalizePack,baseLevel,nextBestMs,phraseFor,playerLabel,voiceProfile,evaluate};
});
