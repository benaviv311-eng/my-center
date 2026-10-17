(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.CameraRig=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  function create(options={}){
    const viewportWidth=Math.max(1,Number(options.viewportWidth)||1600);
    const viewportHeight=Math.max(1,Number(options.viewportHeight)||900);
    const worldBounds=options.worldBounds||{x:0,y:0,width:viewportWidth,height:viewportHeight};
    const boundsX=Number(worldBounds.x)||0,boundsY=Number(worldBounds.y)||0;
    const boundsWidth=Math.max(1,Number(worldBounds.width)||viewportWidth);
    const boundsHeight=Math.max(1,Number(worldBounds.height)||viewportHeight);
    const zoom=Math.max(.1,Number(options.zoom)||1);
    const frameX=Number.isFinite(options.frameX)?Number(options.frameX):viewportWidth*.5;
    const frameY=Number.isFinite(options.frameY)?Number(options.frameY):viewportHeight*.62;
    const deadZoneX=Math.max(0,Number(options.deadZoneX)||viewportWidth*.06);
    const deadZoneY=Math.max(0,Number(options.deadZoneY)||viewportHeight*.06);
    const smoothing=Math.max(.001,Number(options.smoothing)||8);
    const lookAheadX=Math.max(0,Number(options.lookAheadX)||120);
    const lookAheadY=Math.max(0,Number(options.lookAheadY)||70);
    const visibleWidth=viewportWidth/zoom,visibleHeight=viewportHeight/zoom;
    const maxScrollX=Math.max(boundsX,boundsX+boundsWidth-visibleWidth);
    const maxScrollY=Math.max(boundsY,boundsY+boundsHeight-visibleHeight);
    let state={scrollX:boundsX,scrollY:boundsY,zoom,targetX:boundsX,targetY:boundsY};

    function clampScrollX(value){return clamp(value,boundsX,maxScrollX);}
    function clampScrollY(value){return clamp(value,boundsY,maxScrollY);}
    function snapshot(){return Object.freeze({...state});}

    function reset(groundProjection){
      const x=Number(groundProjection&&groundProjection.x)||boundsX;
      const y=Number(groundProjection&&groundProjection.y)||boundsY;
      state={
        scrollX:clampScrollX(x-frameX/zoom),
        scrollY:clampScrollY(y-frameY/zoom),
        zoom,
        targetX:x,
        targetY:y
      };
      return snapshot();
    }

    function desiredScroll(targetX,targetY){
      const screenX=(targetX-state.scrollX)*zoom;
      const screenY=(targetY-state.scrollY)*zoom;
      const deltaX=screenX-frameX,deltaY=screenY-frameY;
      let scrollX=state.scrollX,scrollY=state.scrollY;
      if(deltaX>deadZoneX)scrollX+=(deltaX-deadZoneX)/zoom;
      else if(deltaX<-deadZoneX)scrollX+=(deltaX+deadZoneX)/zoom;
      if(deltaY>deadZoneY)scrollY+=(deltaY-deadZoneY)/zoom;
      else if(deltaY<-deadZoneY)scrollY+=(deltaY+deadZoneY)/zoom;
      return{x:clampScrollX(scrollX),y:clampScrollY(scrollY)};
    }

    function update({groundProjection,velocity,dt}={}){
      const groundX=Number(groundProjection&&groundProjection.x);
      const groundY=Number(groundProjection&&groundProjection.y);
      const safeGroundX=Number.isFinite(groundX)?groundX:state.targetX;
      const safeGroundY=Number.isFinite(groundY)?groundY:state.targetY;
      const vx=Number(velocity&&velocity.x)||0,vy=Number(velocity&&velocity.y)||0;
      const aheadX=clamp(vx*.18,-lookAheadX,lookAheadX);
      const aheadY=clamp(vy*.12,-lookAheadY,lookAheadY);
      const targetX=safeGroundX+aheadX,targetY=safeGroundY+aheadY;
      const desired=desiredScroll(targetX,targetY);
      const safeDt=Math.max(0,Math.min(.05,Number(dt)||0));
      const alpha=1-Math.exp(-smoothing*safeDt);
      state={
        scrollX:clampScrollX(state.scrollX+(desired.x-state.scrollX)*alpha),
        scrollY:clampScrollY(state.scrollY+(desired.y-state.scrollY)*alpha),
        zoom,
        targetX,
        targetY
      };
      return snapshot();
    }

    return Object.freeze({update,reset,snapshot});
  }

  return Object.freeze({create});
});
