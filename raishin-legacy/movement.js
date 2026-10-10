(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RaishinMovement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY_MAP={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
  function inputVector(keys){let x=0,y=0;for(const code of keys){const d=KEY_MAP[code];if(!d)continue;x+=d[0];y+=d[1];}return{x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};}
  function directionFromVector(v,last){if(!v.x&&!v.y)return last||'down';if(Math.abs(v.x)>Math.abs(v.y))return v.x>0?'right':'left';if(Math.abs(v.y)>Math.abs(v.x))return v.y>0?'down':'up';if(v.y)return v.y>0?'down':'up';return v.x>0?'right':'left';}
  function stepPlayer(p,v,dt,b,speed){let x=v.x,y=v.y;const l=Math.hypot(x,y)||1;if(l>1){x/=l;y/=l;}const nx=p.x+x*speed*dt,ny=p.y+y*speed*dt;return{x:Math.max(b.minX,Math.min(b.maxX,nx)),y:Math.max(b.minY,Math.min(b.maxY,ny))};}
  function frameAt(t,m,c,fps){if(!m)return 0;return Math.floor(t*fps)%c;}
  function scaleForDepth(y,minY,maxY){const r=Math.max(1,maxY-minY),t=Math.max(0,Math.min(1,(y-minY)/r));return .72+.34*t;}
  function moveToward(current,target,maxDelta){if(current<target)return Math.min(current+maxDelta,target);if(current>target)return Math.max(current-maxDelta,target);return current;}
  function smoothVelocity(current,input,dt,acceleration,decelleration,maxSpeed){
    dt=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05));
    let ix=input.x||0,iy=input.y||0;const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
    const hasInput=!!(ix||iy),targetX=ix*maxSpeed,targetY=iy*maxSpeed,rate=(hasInput?acceleration:decelleration)*dt;
    let x=moveToward(current.x||0,targetX,rate),y=moveToward(current.y||0,targetY,rate);const speed=Math.hypot(x,y);if(speed>maxSpeed){x=x/speed*maxSpeed;y=y/speed*maxSpeed;}return{x,y};
  }
  return{inputVector,directionFromVector,stepPlayer,frameAt,scaleForDepth,smoothVelocity};
});
