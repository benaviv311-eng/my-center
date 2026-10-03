(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleMusicState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function sceneFor(s={}){
    if(s.phase==='end') return 'victory';
    if(s.phase==='landing'||!s.phase) return 'lobby';
    if(s.phase==='game'){
      const t=Number(s.time);
      const timed=['classic','levels','knockout','survival','sprint'];
      if(timed.includes(s.mode)&&Number.isFinite(t)&&t<=10) return 'tension';
      return 'play';
    }
    return 'lobby';
  }
  function tempoFor(scene){return scene==='tension'?140:scene==='play'?126:scene==='victory'?132:112;}
  function layersFor(scene,streak=0){
    if(scene==='tension') return {beat:true,bass:true,lead:true,tick:true};
    if(scene==='play') return {beat:true,bass:true,lead:Number(streak)>=3,tick:false};
    if(scene==='victory') return {beat:false,bass:false,lead:true,tick:false};
    return {beat:true,bass:false,lead:false,tick:false};
  }
  return {sceneFor,tempoFor,layersFor};
});
