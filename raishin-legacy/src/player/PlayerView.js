(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.PlayerView=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function compute({projection,pivot,motion}={}){
    if(!projection||!pivot)throw new Error('PlayerView requires projection and pivot');
    const vx=Number(motion&&motion.vx)||0,vy=Number(motion&&motion.vy)||0;
    const speed=Math.hypot(vx,vy),speedRatio=Math.max(0,Math.min(1,Number(motion&&motion.speedRatio)||0));
    const horizontalShare=speed>1e-9?Math.abs(vx)/speed:0;
    const maxLean=.03;
    const rotation=speedRatio>0&&horizontalShare>0?Math.sign(vx)*maxLean*speedRatio*horizontalShare:0;
    return Object.freeze({
      x:projection.x,
      y:projection.y,
      originX:pivot.x,
      originY:pivot.y,
      scale:projection.scale,
      shadowX:projection.x,
      shadowY:projection.y,
      rotation
    });
  }

  return Object.freeze({compute});
});
