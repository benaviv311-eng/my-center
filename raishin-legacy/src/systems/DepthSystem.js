(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.RaishinV2=root.RaishinV2||{};root.RaishinV2.DepthSystem=api;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const bands=Object.freeze({background:-10000,floor:-5000,foreground:10000});

  function depthFor(projection,depthBias=0){
    if(!projection||!Number.isFinite(Number(projection.y)))throw new Error('DepthSystem requires a projected ground point');
    return Number(projection.y)+(Number(depthBias)||0);
  }

  function fixedBand(name){
    if(!Object.prototype.hasOwnProperty.call(bands,name))throw new Error(`Unknown depth band: ${name}`);
    return bands[name];
  }

  return Object.freeze({depthFor,fixedBand});
});
