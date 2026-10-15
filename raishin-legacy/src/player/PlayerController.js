(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.PlayerController=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function inputFromKeys(keys){
    const has=(code)=>keys&&typeof keys.has==='function'&&keys.has(code);
    const left=has('KeyA')||has('ArrowLeft'),right=has('KeyD')||has('ArrowRight');
    const up=has('KeyW')||has('ArrowUp'),down=has('KeyS')||has('ArrowDown');
    return{x:(right?1:0)-(left?1:0),y:(down?1:0)-(up?1:0)};
  }

  function normalizeInput(input){
    const x=Number(input&&input.x)||0,y=Number(input&&input.y)||0,length=Math.hypot(x,y);
    if(length<=1)return{x,y};
    return{x:x/length,y:y/length};
  }

  function moveToward(value,target,amount){
    if(value<target)return Math.min(value+amount,target);
    if(value>target)return Math.max(value-amount,target);
    return target;
  }

  function chooseFacing(vector,current,hysteresis){
    const ax=Math.abs(vector.x),ay=Math.abs(vector.y);
    if(ax<=1e-9&&ay<=1e-9)return current;
    const horizontal=current==='left'||current==='right';
    const vertical=current==='up'||current==='down';
    if(horizontal&&ay<=ax+hysteresis)return vector.x>=0?'right':'left';
    if(vertical&&ax<=ay+hysteresis)return vector.y>=0?'down':'up';
    if(ax>ay)return vector.x>=0?'right':'left';
    return vector.y>=0?'down':'up';
  }

  function createPlayerController(options={}){
    const spawn=options.spawn||{x:500,y:420};
    const maxSpeed=Number(options.maxSpeed)||210;
    const acceleration=Number(options.acceleration)||1000;
    const deceleration=Number(options.deceleration)||950;
    const reversalBrake=Number(options.reversalBrake)||1700;
    const reversalThreshold=Number(options.reversalThreshold)||-.6;
    const reversalMinSpeed=Number(options.reversalMinSpeed)||30;
    const facingHysteresis=Math.max(0,Number(options.facingHysteresis)||.08);
    const radius=Number(options.radius)||24;
    const maxDt=Number(options.maxDt)||.05;
    let state={worldX:Number(spawn.x),worldY:Number(spawn.y),vx:0,vy:0,facing:options.facing||'down',moving:false,movedDistance:0,totalDistance:0,speed:0,speedRatio:0,turning:false,inputX:0,inputY:0};

    function snapshot(){return{...state};}

    function step({input,dt,resolveMotion}={}){
      const vector=normalizeInput(input||{x:0,y:0});
      const safeDt=Math.max(0,Math.min(maxDt,Number(dt)||0));
      const inputMagnitude=Math.hypot(vector.x,vector.y);
      const active=inputMagnitude>1e-9;
      const speedBefore=Math.hypot(state.vx,state.vy);
      let reversing=false;
      if(active&&speedBefore>reversalMinSpeed){
        const dot=(state.vx/speedBefore)*vector.x+(state.vy/speedBefore)*vector.y;
        reversing=dot<reversalThreshold;
      }

      if(reversing){
        const brake=reversalBrake*safeDt;
        state.vx=moveToward(state.vx,0,brake);
        state.vy=moveToward(state.vy,0,brake);
      }else{
        const amount=(active?acceleration:deceleration)*safeDt;
        const targetX=active?vector.x*maxSpeed:0,targetY=active?vector.y*maxSpeed:0;
        state.vx=moveToward(state.vx,targetX,amount);
        state.vy=moveToward(state.vy,targetY,amount);
      }

      let speed=Math.hypot(state.vx,state.vy);
      if(speed>maxSpeed){state.vx=state.vx/speed*maxSpeed;state.vy=state.vy/speed*maxSpeed;speed=maxSpeed;}

      if(active&&!reversing)state.facing=chooseFacing(vector,state.facing,facingHysteresis);

      const current={x:state.worldX,y:state.worldY};
      const proposed={x:current.x+state.vx*safeDt,y:current.y+state.vy*safeDt};
      const legal=typeof resolveMotion==='function'?resolveMotion(current,proposed,radius):proposed;
      const nextX=Number.isFinite(legal&&legal.x)?legal.x:current.x;
      const nextY=Number.isFinite(legal&&legal.y)?legal.y:current.y;
      state.movedDistance=Math.hypot(nextX-current.x,nextY-current.y);
      state.totalDistance+=state.movedDistance;
      state.worldX=nextX;state.worldY=nextY;
      state.speed=speed;
      state.speedRatio=maxSpeed>0?Math.min(1,speed/maxSpeed):0;
      state.turning=reversing;
      state.inputX=vector.x;state.inputY=vector.y;
      state.moving=speed>1e-6&&state.movedDistance>1e-9;
      if(!active&&speed<=1e-6){state.vx=0;state.vy=0;state.speed=0;state.speedRatio=0;state.moving=false;}
      return snapshot();
    }

    return Object.freeze({step,snapshot,radius,maxSpeed});
  }

  return Object.freeze({inputFromKeys,normalizeInput,chooseFacing,createPlayerController});
});
