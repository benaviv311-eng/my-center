(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.CollisionMap=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function create(layout){
    if(!layout||!layout.bounds)throw new Error('CollisionMap requires dojo layout');
    const bounds=layout.bounds,obstacles=layout.obstacles||[];

    function insideBounds(point,radius){
      const r=Math.max(0,Number(radius)||0),x=Number(point.x),y=Number(point.y);
      return x>=bounds.minX+r&&x<=bounds.maxX-r&&y>=bounds.minY+r&&y<=bounds.maxY-r;
    }

    function clearsObstacles(point,radius){
      const r=Math.max(0,Number(radius)||0),x=Number(point.x),y=Number(point.y);
      return obstacles.every((item)=>Math.hypot(x-item.x,y-item.y)>=r+item.radius);
    }

    function isWalkable(point,radius=0){
      return insideBounds(point,radius)&&clearsObstacles(point,radius);
    }

    function resolveMotion(current,proposed,radius=0){
      if(isWalkable(proposed,radius))return{x:proposed.x,y:proposed.y};
      const xOnly={x:proposed.x,y:current.y};
      if(isWalkable(xOnly,radius))return xOnly;
      const yOnly={x:current.x,y:proposed.y};
      if(isWalkable(yOnly,radius))return yOnly;
      return{x:current.x,y:current.y};
    }

    return Object.freeze({isWalkable,resolveMotion});
  }

  return Object.freeze({create});
});
