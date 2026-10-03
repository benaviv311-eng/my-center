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
