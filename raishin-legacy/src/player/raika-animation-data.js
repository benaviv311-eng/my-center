(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.RaikaAnimationData=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const makePivots=(ys)=>Object.freeze(ys.map((y)=>Object.freeze({x:.5,y})));
  const pivots=Object.freeze({
    down:makePivots([.9870848708487084,.9981549815498155,.9981549815498155,.9981549815498155,.9981549815498155,.9981549815498155,.9944649446494465,.9981549815498155]),
    up:makePivots([.9907749077490775,.9981549815498155,.9944649446494465,.9944649446494465,.9944649446494465,.9944649446494465,.9944649446494465,.9944649446494465]),
    left:makePivots([.9686346863468634,.9686346863468634,.9686346863468634,.9686346863468634,.9686346863468634,.9686346863468634,.9649446494464945,.9686346863468634]),
    right:makePivots([.9501845018450185,.9538745387453874,.9464944649446494,.9538745387453874,.9501845018450185,.9538745387453874,.9501845018450185,.9501845018450185])
  });
  return Object.freeze({
    textureKey:'raika-walk',
    asset:'./assets/player/raika-walk-4dir-8f.png',
    framesPerDirection:8,
    rows:Object.freeze({down:0,up:1,left:2,right:3}),
    idleFrames:Object.freeze({down:0,up:0,left:0,right:0}),
    pivots
  });
});
