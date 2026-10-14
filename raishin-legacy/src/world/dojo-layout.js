(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.DojoLayout=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const floor=Object.freeze({
    farLeft:Object.freeze({x:430,y:585}),
    farRight:Object.freeze({x:1170,y:585}),
    nearLeft:Object.freeze({x:165,y:835}),
    nearRight:Object.freeze({x:1435,y:835}),
    farScale:.72,
    nearScale:1.06
  });
  return Object.freeze({WORLD_WIDTH:1000,WORLD_HEIGHT:600,floor});
});
