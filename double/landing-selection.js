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

// Load the richer lobby UI without changing the landing-page game logic above.
(function(){
  if(typeof document==='undefined') return;
  const head=document.head||document.documentElement;
  if(!document.querySelector('link[data-double-lobby]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='double/menu-lobby.css?v=3';
    link.dataset.doubleLobby='1';
    head.appendChild(link);
  }
  const loadLobby=()=>{
    if(document.querySelector('script[data-double-lobby-ui]')) return;
    const ui=document.createElement('script');
    ui.src='double/menu-lobby.js?v=3';
    ui.dataset.doubleLobbyUi='1';
    document.body.appendChild(ui);
  };
  if(window.DoubleMenuLobbyState){loadLobby();return;}
  const state=document.createElement('script');
  state.src='double/menu-lobby-state.js?v=3';
  state.dataset.doubleLobbyState='1';
  state.onload=loadLobby;
  document.body.appendChild(state);
})();
