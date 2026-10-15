(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.PlayerView=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function compute({projection,pivot}){
    if(!projection||!pivot)throw new Error('PlayerView requires projection and pivot');
    return Object.freeze({
      x:projection.x,
      y:projection.y,
      originX:pivot.x,
      originY:pivot.y,
      scale:projection.scale,
      depth:projection.depth+1,
      shadowX:projection.x,
      shadowY:projection.y,
      shadowDepth:projection.depth-1
    });
  }

  return Object.freeze({compute});
});
