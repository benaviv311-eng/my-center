(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.CameraFollow=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  function desiredAxis(value,center,deadZone,maxOffset){
    const delta=(Number(value)||0)-center;
    const magnitude=Math.abs(delta);
    if(magnitude<=deadZone)return 0;
    const excess=magnitude-deadZone;
    return Math.sign(delta)*Math.min(maxOffset,excess);
  }

  function create(options={}){
    const centerX=Number.isFinite(options.centerX)?options.centerX:800;
    const centerY=Number.isFinite(options.centerY)?options.centerY:790;
    const maxX=Math.max(0,Number(options.maxX)||18);
    const maxY=Math.max(0,Number(options.maxY)||8);
    const deadZoneX=Math.max(0,Number(options.deadZoneX)||170);
    const deadZoneY=Math.max(0,Number(options.deadZoneY)||22);
    const smoothing=Math.max(.001,Number(options.smoothing)||7.5);
    let state={x:0,y:0};

    function update(target,dt){
      const safeDt=Math.max(0,Math.min(.05,Number(dt)||0));
      const desiredX=desiredAxis(target&&target.x,centerX,deadZoneX,maxX);
      const desiredY=desiredAxis(target&&target.y,centerY,deadZoneY,maxY);
      const alpha=1-Math.exp(-smoothing*safeDt);
      state.x=clamp(state.x+(desiredX-state.x)*alpha,-maxX,maxX);
      state.y=clamp(state.y+(desiredY-state.y)*alpha,-maxY,maxY);
      if(Math.abs(state.x)<1e-4)state.x=0;
      if(Math.abs(state.y)<1e-4)state.y=0;
      return Object.freeze({x:state.x,y:state.y});
    }

    function reset(){state={x:0,y:0};return Object.freeze({x:0,y:0});}
    function snapshot(){return Object.freeze({x:state.x,y:state.y});}
    return Object.freeze({update,reset,snapshot});
  }

  return Object.freeze({create});
});
