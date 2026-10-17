(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.WorldModel=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const copyPoint=(point)=>Object.freeze({x:Number(point.x),y:Number(point.y)});
  const copyPolygon=(polygon)=>Object.freeze(polygon.map(copyPoint));
  const copyItem=(item)=>Object.freeze({...item});

  function create(layout){
    if(!layout)throw new Error('WorldModel requires dojo layout');
    const width=Number(layout.WORLD_WIDTH),height=Number(layout.WORLD_HEIGHT);
    if(!(width>0&&height>0))throw new Error('WorldModel requires positive dimensions');
    if(!layout.spawn)throw new Error('WorldModel requires spawn');
    if(!Array.isArray(layout.walkablePolygons)||!layout.walkablePolygons.length)throw new Error('WorldModel requires walkable polygons');
    if(!Array.isArray(layout.solids))throw new Error('WorldModel requires solids');
    if(!Array.isArray(layout.renderObjects))throw new Error('WorldModel requires render objects');
    if(!Array.isArray(layout.interactions))throw new Error('WorldModel requires interactions');
    if(!layout.renderBounds)throw new Error('WorldModel requires render bounds');

    return Object.freeze({
      width,
      height,
      spawn:copyPoint(layout.spawn),
      walkablePolygons:Object.freeze(layout.walkablePolygons.map(copyPolygon)),
      solids:Object.freeze(layout.solids.map(copyItem)),
      renderObjects:Object.freeze(layout.renderObjects.map(copyItem)),
      interactions:Object.freeze(layout.interactions.map(copyItem)),
      renderBounds:Object.freeze({...layout.renderBounds})
    });
  }

  return Object.freeze({create});
});
