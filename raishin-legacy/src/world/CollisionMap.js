(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.CollisionMap=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  function pointInPolygon(point,polygon){
    let inside=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];
      const crosses=((a.y>point.y)!==(b.y>point.y))&&
        (point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x);
      if(crosses)inside=!inside;
    }
    return inside;
  }

  function distanceToSegment(point,a,b){
    const vx=b.x-a.x,vy=b.y-a.y;
    const length2=vx*vx+vy*vy;
    if(length2<=1e-12)return Math.hypot(point.x-a.x,point.y-a.y);
    const t=clamp(((point.x-a.x)*vx+(point.y-a.y)*vy)/length2,0,1);
    const px=a.x+t*vx,py=a.y+t*vy;
    return Math.hypot(point.x-px,point.y-py);
  }

  function fitsPolygon(point,polygon,radius){
    if(!pointInPolygon(point,polygon))return false;
    if(radius<=0)return true;
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length];
      if(distanceToSegment(point,a,b)<radius)return false;
    }
    return true;
  }

  function hitsCircle(point,radius,item){
    return Math.hypot(point.x-item.x,point.y-item.y)<=radius+Math.max(0,Number(item.radius)||0);
  }

  function hitsBox(point,radius,item){
    const rotation=Number(item.rotation)||0;
    const cos=Math.cos(-rotation),sin=Math.sin(-rotation);
    const dx=point.x-item.x,dy=point.y-item.y;
    const localX=dx*cos-dy*sin,localY=dx*sin+dy*cos;
    const halfW=Math.max(0,Number(item.width)||0)/2;
    const halfH=Math.max(0,Number(item.height)||0)/2;
    const closestX=clamp(localX,-halfW,halfW);
    const closestY=clamp(localY,-halfH,halfH);
    const gapX=localX-closestX,gapY=localY-closestY;
    return gapX*gapX+gapY*gapY<=radius*radius;
  }

  function hitsSolid(point,radius,item){
    if(item.type==='circle')return hitsCircle(point,radius,item);
    if(item.type==='rect'||item.type==='obox')return hitsBox(point,radius,item);
    throw new Error(`Unsupported collision primitive: ${item.type}`);
  }

  function create(world){
    if(!world||!Array.isArray(world.walkablePolygons)||!world.walkablePolygons.length)throw new Error('CollisionMap requires walkable polygons');
    if(!Array.isArray(world.solids))throw new Error('CollisionMap requires solids');
    const polygons=world.walkablePolygons;
    const solids=world.solids;

    function isWalkable(point,radius=0){
      const x=Number(point&&point.x),y=Number(point&&point.y);
      if(!Number.isFinite(x)||!Number.isFinite(y))return false;
      const r=Math.max(0,Number(radius)||0),candidate={x,y};
      if(!polygons.some((polygon)=>fitsPolygon(candidate,polygon,r)))return false;
      return solids.every((item)=>!hitsSolid(candidate,r,item));
    }

    function pathClear(current,target,radius){
      const dx=target.x-current.x,dy=target.y-current.y;
      const distance=Math.hypot(dx,dy);
      const maxStep=Math.max(4,Math.min(16,Math.max(8,radius)));
      const steps=Math.max(1,Math.ceil(distance/maxStep));
      for(let i=1;i<=steps;i++){
        const t=i/steps;
        if(!isWalkable({x:current.x+dx*t,y:current.y+dy*t},radius))return false;
      }
      return true;
    }

    function resolveMotion(current,proposed,radius=0){
      const start={x:Number(current.x),y:Number(current.y)};
      const target={x:Number(proposed.x),y:Number(proposed.y)};
      const r=Math.max(0,Number(radius)||0);
      if(pathClear(start,target,r))return target;
      const xOnly={x:target.x,y:start.y};
      if(pathClear(start,xOnly,r))return xOnly;
      const yOnly={x:start.x,y:target.y};
      if(pathClear(start,yOnly,r))return yOnly;
      return start;
    }

    return Object.freeze({isWalkable,resolveMotion});
  }

  return Object.freeze({create});
});
