(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.PlayerAnimator=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function create(data,options={}){
    if(!data||!data.rows||!data.pivots)throw new Error('PlayerAnimator requires animation metadata');
    const stride=Math.max(.001,Number(options.stride)||24),count=data.framesPerDirection||8;
    let distance=0;

    function update({facing='down',moving=false,movedDistance=0}={}){
      const direction=Object.prototype.hasOwnProperty.call(data.rows,facing)?facing:'down';
      if(moving)distance+=Math.max(0,Number(movedDistance)||0);
      const frameIndex=moving?Math.floor(distance/stride)%count:data.idleFrames[direction];
      return Object.freeze({
        key:data.textureKey,
        frameIndex,
        row:data.rows[direction],
        pivot:data.pivots[direction][frameIndex]||data.pivots[direction][0]
      });
    }

    function reset(){distance=0;}
    return Object.freeze({update,reset});
  }

  return Object.freeze({create});
});
