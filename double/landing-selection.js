(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleLandingSelection=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function normalizeDifficulty(value){return ['easy','normal','hard'].includes(value)?value:'normal'}
  function createState(){return {players:1,difficulty:'normal',mode:'classic',variant:null,target:null,locked:false}}
  function selectGame(_state,next){
    return {
      players:Number(next.players)===2?2:1,
      difficulty:normalizeDifficulty(next.difficulty),
      mode:next.mode||'classic',
      variant:next.variant||null,
      target:next.target==null?null:Number(next.target),
      locked:true
    };
  }
  function previewKey(state){
    if(state.mode==='versus') return 'versus:'+(state.variant||'deck');
    if(state.mode==='sprint') return 'sprint:'+(state.target||5);
    return state.mode;
  }
  function launchQuery(state){
    const p=new URLSearchParams();
    p.set('launch',state.mode||'classic');
    p.set('difficulty',normalizeDifficulty(state.difficulty));
    if(state.variant) p.set('variant',state.variant);
    if(state.target!=null) p.set('target',String(state.target));
    return p.toString();
  }
  return {createState,selectGame,previewKey,launchQuery};
});

(function(){
  if(typeof document==='undefined') return;
  const V='15';
  const head=document.head||document.documentElement;
  document.querySelector('.landing')?.classList.add('toy-arcade');
  function ensureCss(href,attr){
    if(document.querySelector(`link[${attr}]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(attr,'1');head.appendChild(link);
  }
  ensureCss('double/menu-lobby.css?v='+V,'data-double-lobby');
  ensureCss('double/premium-theme.css?v='+V,'data-double-premium-theme');
  function load(src,attr,ready,next){
    if(ready&&ready()){next?.();return;}
    const existing=document.querySelector(`script[${attr}]`);
    if(existing){
      if(existing.dataset.loaded==='1'){next?.();return;}
      existing.addEventListener('load',()=>next?.(),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=src;
    s.setAttribute(attr,'1');
    s.onload=()=>{s.dataset.loaded='1';next?.()};
    document.body.appendChild(s);
  }
  function loadSprite(next){
    load('double/icon-sprite-0.js?v='+V,'data-double-icon-sprite-0',()=>false,()=>
      load('double/icon-sprite-1.js?v='+V,'data-double-icon-sprite-1',()=>false,()=>
        load('double/icon-sprite-2.js?v='+V,'data-double-icon-sprite-2',()=>false,()=>
          load('double/icon-sprite-3.js?v='+V,'data-double-icon-sprite-3',()=>false,()=>
            load('double/dragonball-sprite-0.js?v='+V,'data-double-dragon-sprite-0',()=>false,()=>
              load('double/dragonball-sprite-1.js?v='+V,'data-double-dragon-sprite-1',()=>false,()=>
                load('double/icon-packs.js?v='+V,'data-double-icon-packs',()=>!!window.DoubleIconPacks,next)))))));
  }
  function syncClassicCopy(){
    const tag=document.getElementById('previewTag');
    if(tag?.textContent?.includes('קלאסי')){
      const title=document.getElementById('selectedTitle'),sub=document.getElementById('selectedSub');
      if(title)title.textContent='קלאסי מהיר';
      if(sub)sub.textContent='20 התאמות · הזמן המהיר ביותר';
    }
    document.querySelectorAll('.lobby-mode').forEach(card=>{
      const label=(card.querySelector('b')?.textContent||'').trim();
      if(label==='קלאסי'){
        const small=card.querySelector('small');
        if(small)small.textContent='20 התאמות · הזמן המהיר ביותר';
      }
    });
  }
  let copyQueued=false;
  new MutationObserver(()=>{
    if(copyQueued)return;copyQueued=true;
    requestAnimationFrame(()=>{copyQueued=false;syncClassicCopy()});
  }).observe(document.querySelector('.landing')||document.body,{subtree:true,childList:true,characterData:true});
  document.addEventListener('click',event=>{
    if(!event.target?.closest?.('#playSelected'))return;
    setTimeout(()=>{
      const frame=document.getElementById('gameFrame');
      if(!frame?.src||frame.src==='about:blank')return;
      try{
        const url=new URL(frame.src,location.href);
        if(!url.pathname.endsWith('/double-game.html'))return;
        url.searchParams.set('v','15');
        frame.src=url.toString();
      }catch(_){ }
    },0);
  });
  syncClassicCopy();
  const loadBridge=()=>load('double/landing-music-bridge.js?v='+V,'data-double-landing-music-bridge',()=>false);
  const loadEncouragementLaunch=()=>load('double/encouragement-launch-bridge.js?v='+V,'data-double-encouragement-launch',()=>false,loadBridge);
  const loadCompetitiveFix=()=>load('double/competitive-landing-fix.js?v='+V,'data-double-competitive-landing-fix',()=>false,loadEncouragementLaunch);
  const loadDailyUi=()=>load('double/daily-challenge-ui.js?v='+V,'data-double-daily-ui',()=>false,loadCompetitiveFix);
  const loadDailyCore=()=>load('double/daily-challenge-core.js?v='+V,'data-double-daily-core',()=>!!window.DoubleDailyChallenge,loadDailyUi);
  const loadStatsUi=()=>load('double/stats-ui.js?v='+V,'data-double-stats-ui',()=>false,loadDailyCore);
  const loadStatsStore=()=>load('double/stats-store.js?v='+V,'data-double-stats-store',()=>!!window.DoubleStatsStore,loadStatsUi);
  const loadPackUi=()=>load('double/icon-pack-ui.js?v='+V,'data-double-icon-pack-ui',()=>false,loadStatsStore);
  const loadLobby=()=>load('double/menu-lobby-v3.js?v='+V,'data-double-lobby-ui',()=>false,loadPackUi);
  const loadTwoPlayerBridge=()=>load('double/two-player-default-bridge.js?v='+V,'data-double-two-player-default-bridge',()=>false,loadLobby);
  const loadTwoPlayerRules=()=>load('double/two-player-mode-rules.js?v='+V,'data-double-two-player-mode-rules',()=>!!window.DoubleTwoPlayerModeRules,loadTwoPlayerBridge);
  const loadRules=()=>load('double/competitive-rules.js?v='+V,'data-double-competitive-rules',()=>!!window.DoubleCompetitiveRules,loadTwoPlayerRules);
  const loadPacks=()=>loadSprite(loadRules);
  const loadMusicEngine=()=>load('double/toy-music-model.js?v='+V,'data-double-toy-music-model',()=>!!window.DoubleToyMusicModel,()=>
    load('double/music-engine.js?v='+V,'data-double-music-engine',()=>!!window.DoubleMusic,loadPacks));
  const loadMusic=()=>load('double/music-engine-state.js?v='+V,'data-double-music-state',()=>!!window.DoubleMusicState,loadMusicEngine);
  load('double/menu-lobby-state.js?v='+V,'data-double-lobby-state',()=>!!window.DoubleMenuLobbyState,loadMusic);
})();