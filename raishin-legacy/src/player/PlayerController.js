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

  function createPlayerController(options={}){
    const spawn=options.spawn||{x:500,y:420};
    const maxSpeed=Number(options.maxSpeed)||300;
    const acceleration=Number(options.acceleration)||1000;
    const deceleration=Number(options.deceleration)||1300;
    const radius=Number(options.radius)||24;
    const maxDt=Number(options.maxDt)||.05;
    let state={worldX:Number(spawn.x),worldY:Number(spawn.y),vx:0,vy:0,facing:options.facing||'down',moving:false,movedDistance:0,totalDistance:0};

    function snapshot(){return{...state};}

    function step({input,dt,resolveMotion}={}){
      const vector=normalizeInput(input||{x:0,y:0});
      const safeDt=Math.max(0,Math.min(maxDt,Number(dt)||0));
      const active=Math.hypot(vector.x,vector.y)>0;
      const amount=(active?acceleration:deceleration)*safeDt;
      const targetX=active?vector.x*maxSpeed:0,targetY=active?vector.y*maxSpeed:0;
      state.vx=moveToward(state.vx,targetX,amount);
      state.vy=moveToward(state.vy,targetY,amount);
      const speed=Math.hypot(state.vx,state.vy);
      if(speed>maxSpeed){state.vx=state.vx/speed*maxSpeed;state.vy=state.vy/speed*maxSpeed;}

      if(active){
        if(Math.abs(vector.x)>Math.abs(vector.y))state.facing=vector.x>0?'right':'left';
        else if(Math.abs(vector.y)>0)state.facing=vector.y>0?'down':'up';
      }

      const current={x:state.worldX,y:state.worldY};
      const proposed={x:current.x+state.vx*safeDt,y:current.y+state.vy*safeDt};
      const legal=typeof resolveMotion==='function'?resolveMotion(current,proposed,radius):proposed;
      const nextX=Number.isFinite(legal&&legal.x)?legal.x:current.x;
      const nextY=Number.isFinite(legal&&legal.y)?legal.y:current.y;
      state.movedDistance=Math.hypot(nextX-current.x,nextY-current.y);
      state.totalDistance+=state.movedDistance;
      state.worldX=nextX;state.worldY=nextY;
      state.moving=Math.hypot(state.vx,state.vy)>1e-6&&state.movedDistance>1e-9;
      if(!active&&Math.hypot(state.vx,state.vy)<=1e-6){state.vx=0;state.vy=0;state.moving=false;}
      return snapshot();
    }

    return Object.freeze({step,snapshot,radius,maxSpeed});
  }

  return Object.freeze({inputFromKeys,normalizeInput,createPlayerController});
});
