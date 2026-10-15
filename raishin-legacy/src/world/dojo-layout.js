(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.DojoLayout=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const floor=Object.freeze({
    farLeft:Object.freeze({x:430,y:742}),
    farRight:Object.freeze({x:1170,y:742}),
    nearLeft:Object.freeze({x:165,y:835}),
    nearRight:Object.freeze({x:1435,y:835}),
    farScale:.72,
    nearScale:1.06
  });
  const bounds=Object.freeze({minX:35,maxX:965,minY:45,maxY:575});
  const obstacles=Object.freeze([
    Object.freeze({id:'training-bag',x:150,y:220,radius:42}),
    Object.freeze({id:'left-column',x:90,y:330,radius:34}),
    Object.freeze({id:'right-column',x:910,y:330,radius:34})
  ]);
  const interactions=Object.freeze([
    Object.freeze({id:'training-bag',label:'Training Bag',x:150,y:220,radius:110,prompt:'Practice',type:'practice'}),
    Object.freeze({id:'weapons-wall',label:'Weapons Wall',x:780,y:70,radius:130,prompt:'Examine',type:'examine'}),
    Object.freeze({id:'training-center',label:'Training Center',x:500,y:270,radius:120,prompt:'Begin Drill',type:'training'}),
    Object.freeze({id:'courtyard-exit',label:'Courtyard Exit',x:900,y:230,radius:130,prompt:'Go to Courtyard',type:'transition'}),
    Object.freeze({id:'seika-point',label:'Seika Meditation Point',x:160,y:455,radius:115,prompt:'Focus',type:'seika'})
  ]);
  return Object.freeze({WORLD_WIDTH:1000,WORLD_HEIGHT:600,floor,bounds,obstacles,interactions});
});
