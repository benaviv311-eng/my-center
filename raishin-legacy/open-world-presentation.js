(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.RaishinMovement&&root.RaishinDojoEffects)api.install(root.RaishinMovement,root.RaishinDojoEffects);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const PROFILE=Object.freeze({
    // Third-person framing: the hero must read as the subject of the scene,
    // not as a small token moving over a large background.
    playerScale:1.45,
    contactCorrectionPx:15,
    shadowAlphaFloor:.46,
    shadowWidthFloor:1.08,
    camera:Object.freeze({
      centerX:800,
      centerY:650,
      deadZoneX:92,
      deadZoneY:42,
      maxX:58,
      maxY:30,
      followStrength:8.2
    })
  });

  function install(movement,effects,profile=PROFILE){
    if(!movement||!effects)throw new Error('Raishin movement and dojo effects are required');
    if(movement.__openWorldPresentationV2)return profile;

    const baseScaleForDepth=movement.scaleForDepth.bind(movement);
    const baseGroundingMotion=effects.groundingMotion.bind(effects);
    const baseUpdateCamera=effects.updateCamera.bind(effects);

    movement.scaleForDepth=function openWorldScaleForDepth(y,minY,maxY){
      return baseScaleForDepth(y,minY,maxY)*profile.playerScale;
    };

    effects.groundingMotion=function openWorldGroundingMotion(walkTime,moving,speed,scale=1){
      const base=baseGroundingMotion(walkTime,moving,speed,scale);
      const speedRatio=Math.max(0,Math.min(1,(Number(speed)||0)/245));
      const correction=profile.contactCorrectionPx*Math.max(.82,Math.min(1.24,Number(scale)||1));
      return{
        ...base,
        // Keep the rendered feet visually planted instead of applying a vertical walk bounce.
        bobY:correction,
        shadowAlpha:Math.max(profile.shadowAlphaFloor,base.shadowAlpha||0),
        shadowScaleX:Math.max(profile.shadowWidthFloor,base.shadowScaleX||0),
        shadowScaleY:.98,
        footPlant:1,
        speedRatio
      };
    };

    effects.updateCamera=function openWorldCamera(camera,player,dt,options={}){
      return baseUpdateCamera(camera,player,dt,{...options,...profile.camera});
    };

    Object.defineProperty(movement,'__openWorldPresentationV2',{value:true,enumerable:false});
    return profile;
  }

  return Object.freeze({PROFILE,install});
});
