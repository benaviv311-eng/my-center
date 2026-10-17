(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.RaishinMovement)api.install(root.RaishinMovement);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DEFAULTS=Object.freeze({maxSpeed:210,acceleration:1000,deceleration:950,reversalBrake:1700,reversalThreshold:-.6,reversalMinSpeed:30,facingHysteresis:.08});
  function moveVectorToward(x,y,targetX,targetY,maxDelta){const dx=targetX-x,dy=targetY-y,distance=Math.hypot(dx,dy);if(distance<=maxDelta||distance<=1e-9)return{x:targetX,y:targetY};const ratio=maxDelta/distance;return{x:x+dx*ratio,y:y+dy*ratio};}
  function normalize(input){let x=Number(input&&input.x)||0,y=Number(input&&input.y)||0;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}return{x,y};}
  function chooseFacing(vector,current,hysteresis=DEFAULTS.facingHysteresis){
    const x=Number(vector&&vector.x)||0,y=Number(vector&&vector.y)||0,ax=Math.abs(x),ay=Math.abs(y),h=Math.max(0,Number(hysteresis)||0);
    if(ax<=1e-9&&ay<=1e-9)return current||'down';
    const horizontal=current==='left'||current==='right',vertical=current==='up'||current==='down';
    if(horizontal&&ay<=ax+h)return x>=0?'right':'left';
    if(vertical&&ax<=ay+h)return y>=0?'down':'up';
    if(ax>ay)return x>=0?'right':'left';
    return y>=0?'down':'up';
  }
  function install(movement,options={}){
    if(!movement||typeof movement.smoothVelocity!=='function')throw new Error('RaishinMovement is required');
    if(movement.__professionalMovementLive)return movement;
    const config={...DEFAULTS,...options};
    movement.chooseFacing=chooseFacing;
    movement.smoothVelocity=function(current,input,dt,_acceleration,_deceleration,_maxSpeed){
      const safeDt=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05)),vector=normalize(input),hasInput=Math.hypot(vector.x,vector.y)>1e-9;
      const cx=Number(current&&current.x)||0,cy=Number(current&&current.y)||0,currentSpeed=Math.hypot(cx,cy);
      let reversing=false;
      if(hasInput&&currentSpeed>config.reversalMinSpeed){
        const dot=(cx/currentSpeed)*vector.x+(cy/currentSpeed)*vector.y;
        reversing=dot<config.reversalThreshold;
      }
      let result;
      if(reversing){
        result=moveVectorToward(cx,cy,0,0,config.reversalBrake*safeDt);
      }else{
        const targetX=hasInput?vector.x*config.maxSpeed:0,targetY=hasInput?vector.y*config.maxSpeed:0;
        result=moveVectorToward(cx,cy,targetX,targetY,(hasInput?config.acceleration:config.deceleration)*safeDt);
      }
      let speed=Math.hypot(result.x,result.y);
      if(speed>config.maxSpeed){result.x=result.x/speed*config.maxSpeed;result.y=result.y/speed*config.maxSpeed;speed=config.maxSpeed;}
      return{x:result.x,y:result.y,reversing,speed,speedRatio:config.maxSpeed>0?Math.min(1,speed/config.maxSpeed):0};
    };
    Object.defineProperty(movement,'__professionalMovementLive',{value:true,enumerable:false});
    return movement;
  }
  return Object.freeze({DEFAULTS,chooseFacing,install});
});
