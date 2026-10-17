(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.DojoLayout=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const WORLD_WIDTH=2400,WORLD_HEIGHT=1500;
  const floor=Object.freeze({
    farLeft:Object.freeze({x:300,y:360}),
    farRight:Object.freeze({x:3300,y:360}),
    nearLeft:Object.freeze({x:0,y:1600}),
    nearRight:Object.freeze({x:3600,y:1600}),
    farScale:.72,
    nearScale:1.1
  });
  const spawn=Object.freeze({x:1200,y:1050});
  const walkablePolygons=Object.freeze([
    Object.freeze([
      Object.freeze({x:140,y:160}),
      Object.freeze({x:2260,y:160}),
      Object.freeze({x:2360,y:1380}),
      Object.freeze({x:40,y:1380})
    ])
  ]);
  const solids=Object.freeze([
    Object.freeze({id:'training-bag',type:'circle',x:430,y:600,radius:72}),
    Object.freeze({id:'left-column',type:'rect',x:260,y:820,width:110,height:220}),
    Object.freeze({id:'right-column',type:'rect',x:2030,y:820,width:110,height:220}),
    Object.freeze({id:'weapons-rack',type:'obox',x:1780,y:340,width:360,height:100,rotation:-.04})
  ]);
  const renderObjects=Object.freeze([
    Object.freeze({id:'rear-wall',layer:'rear',type:'architecture',x:1200,y:170,groundY:170,depthBias:-900}),
    Object.freeze({id:'dojo-floor',layer:'floor',type:'floor',x:1200,y:800,groundY:800,depthBias:-500}),
    Object.freeze({id:'training-bag',layer:'prop',type:'training',x:430,y:600,groundY:600,depthBias:0}),
    Object.freeze({id:'left-column',layer:'foreground',type:'architecture',x:260,y:930,groundY:930,depthBias:4}),
    Object.freeze({id:'right-column',layer:'foreground',type:'architecture',x:2030,y:930,groundY:930,depthBias:4}),
    Object.freeze({id:'courtyard-frame',layer:'foreground',type:'exit',x:2200,y:520,groundY:520,depthBias:6})
  ]);
  const interactions=Object.freeze([
    Object.freeze({id:'training-bag',label:'Training Bag',x:430,y:600,radius:150,prompt:'Practice',type:'practice'}),
    Object.freeze({id:'weapons-wall',label:'Weapons Wall',x:1780,y:340,radius:165,prompt:'Examine',type:'examine'}),
    Object.freeze({id:'training-center',label:'Training Center',x:1200,y:760,radius:160,prompt:'Begin Drill',type:'training'}),
    Object.freeze({id:'courtyard-exit',label:'Courtyard Exit',x:2200,y:520,radius:175,prompt:'Go to Courtyard',type:'transition'}),
    Object.freeze({id:'seika-point',label:'Seika Meditation Point',x:520,y:1180,radius:150,prompt:'Focus',type:'seika'})
  ]);
  const renderBounds=Object.freeze({x:0,y:0,width:3600,height:1800});

  // Compatibility data used only by the pre-world-core v2 preview until later tasks migrate systems.
  const bounds=Object.freeze({minX:35,maxX:965,minY:45,maxY:575});
  const obstacles=Object.freeze([
    Object.freeze({id:'training-bag',x:150,y:220,radius:42}),
    Object.freeze({id:'left-column',x:90,y:330,radius:34}),
    Object.freeze({id:'right-column',x:910,y:330,radius:34})
  ]);

  return Object.freeze({
    WORLD_WIDTH,WORLD_HEIGHT,floor,spawn,walkablePolygons,solids,renderObjects,interactions,renderBounds,
    bounds,obstacles
  });
});
