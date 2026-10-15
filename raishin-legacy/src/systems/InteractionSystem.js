(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.InteractionSystem=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function create(layout,worldPlane){
    if(!layout||!Array.isArray(layout.interactions))throw new Error('InteractionSystem requires dojo interactions');
    if(!worldPlane||typeof worldPlane.project!=='function')throw new Error('InteractionSystem requires WorldPlane');
    const items=layout.interactions.slice();

    function nearest(point,maxDistance=Infinity){
      let best=null,bestDistance=Infinity;
      for(const item of items){
        const distance=Math.hypot(Number(point.x)-item.x,Number(point.y)-item.y);
        const allowed=Math.min(Number.isFinite(maxDistance)?maxDistance:Infinity,item.radius);
        if(distance<=allowed&&distance<bestDistance){best=item;bestDistance=distance;}
      }
      return best;
    }

    function projectPrompt(item){
      if(!item)return null;
      return worldPlane.project({x:item.x,y:item.y});
    }

    return Object.freeze({items:Object.freeze(items),nearest,projectPrompt});
  }

  return Object.freeze({create});
});
