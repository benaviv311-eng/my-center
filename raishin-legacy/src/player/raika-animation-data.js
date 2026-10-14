(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.RaikaAnimationData=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const pivot=()=>Object.freeze({x:.5,y:.985});
  const set=()=>Object.freeze(Array.from({length:8},pivot));
  return Object.freeze({
    textureKey:'raika-walk',
    asset:'./assets/player/raika-walk-4dir-8f.png',
    framesPerDirection:8,
    rows:Object.freeze({down:0,up:1,left:2,right:3}),
    idleFrames:Object.freeze({down:0,up:0,left:0,right:0}),
    pivots:Object.freeze({down:set(),up:set(),left:set(),right:set()})
  });
});
