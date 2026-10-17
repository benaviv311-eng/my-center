(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.RaishinMovement&&root.RaishinDojoEffects)api.install(root.RaishinMovement,root.RaishinDojoEffects);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const PROFILE=Object.freeze({
    playerScale:1.18,
    contactCorrectionPx:6.5,
    shadowAlphaFloor:.38,
    shadowWidthFloor:1.03,
    camera:Object.freeze({
      centerX:800,
      centerY:632,
      deadZoneX:105,
      deadZoneY:46,
      maxX:88,
      maxY:54,
      followStrength:6.8
    })
  });

  function install(movement,effects,profile=PROFILE){
    if(!movement||!effects)throw new Error('Raishin movement and dojo effects are required');
    if(movement.__openWorldPresentation)return profile;

    const baseScaleForDepth=movement.scaleForDepth.bind(movement);
    const baseGroundingMotion=effects.groundingMotion.bind(effects);
    const baseUpdateCamera=effects.updateCamera.bind(effects);

    movement.scaleForDepth=function openWorldScaleForDepth(y,minY,maxY){
      return baseScaleForDepth(y,minY,maxY)*profile.playerScale;
    };

    effects.groundingMotion=function openWorldGroundingMotion(walkTime,moving,speed,scale=1){
      const base=baseGroundingMotion(walkTime,moving,speed,scale);
      const speedRatio=Math.max(0,Math.min(1,(Number(speed)||0)/245));
      const correction=profile.contactCorrectionPx*Math.max(.78,Math.min(1.28,Number(scale)||1));
      return{
        ...base,
        bobY:correction,
        shadowAlpha:Math.max(profile.shadowAlphaFloor,base.shadowAlpha||0),
        shadowScaleX:Math.max(profile.shadowWidthFloor,base.shadowScaleX||0),
        shadowScaleY:.96+.04*(base.footPlant??1),
        footPlant:Math.max(.88,base.footPlant??1),
        speedRatio
      };
    };

    effects.updateCamera=function openWorldCamera(camera,player,dt,options={}){
      return baseUpdateCamera(camera,player,dt,{...options,...profile.camera});
    };

    Object.defineProperty(movement,'__openWorldPresentation',{value:true,enumerable:false});
    return profile;
  }

  return Object.freeze({PROFILE,install});
});
