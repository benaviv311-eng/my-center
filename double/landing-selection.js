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
    if(state.mode==='versus') return 'versus:'+(state.variant||'duel');
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
  const head=document.head||document.documentElement;
  if(!document.querySelector('link[data-double-lobby]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='double/menu-lobby.css?v=7';
    link.dataset.doubleLobby='1';
    head.appendChild(link);
  }
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
    load('double/icon-sprite-0.js?v=1','data-double-icon-sprite-0',()=>false,()=>
      load('double/icon-sprite-1.js?v=1','data-double-icon-sprite-1',()=>false,()=>
        load('double/icon-sprite-2.js?v=1','data-double-icon-sprite-2',()=>false,()=>
          load('double/icon-sprite-3.js?v=1','data-double-icon-sprite-3',()=>false,()=>
            load('double/icon-packs.js?v=1','data-double-icon-packs',()=>!!window.DoubleIconPacks,next)))));
  }
  const loadBridge=()=>load('double/landing-music-bridge.js?v=7','data-double-landing-music-bridge',()=>false);
  const loadPackUi=()=>load('double/icon-pack-ui.js?v=1','data-double-icon-pack-ui',()=>false,loadBridge);
  const loadLobby=()=>load('double/menu-lobby-v3.js?v=7','data-double-lobby-ui',()=>false,loadPackUi);
  const loadPacks=()=>loadSprite(loadLobby);
  const loadMusic=()=>load('double/music-engine-state.js?v=7','data-double-music-state',()=>!!window.DoubleMusicState,()=>
    load('double/music-engine.js?v=7','data-double-music-engine',()=>!!window.DoubleMusic,loadPacks));
  load('double/menu-lobby-state.js?v=7','data-double-lobby-state',()=>!!window.DoubleMenuLobbyState,loadMusic);
})();
