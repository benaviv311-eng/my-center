(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleCompetitiveRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STANDARDIZED=new Set(['sprint','versus']);
  function skipDifficulty(mode){return STANDARDIZED.has(String(mode||''))}
  function fixedDifficulty(mode){return skipDifficulty(mode)?'normal':null}
  function allowShuffle(mode){return !STANDARDIZED.has(String(mode||''))}
  return {skipDifficulty,fixedDifficulty,allowShuffle};
});