(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DoubleClassicModeRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TARGET=20;
  const DIFFICULTIES=new Set(['easy','normal','hard']);
  function normalizeDifficulty(value){return DIFFICULTIES.has(value)?value:'normal'}
  function isComplete(matches){return Math.max(0,Number(matches)||0)>=TARGET}
  function nextBestSeconds(previous,current){
    const cur=Number(current),prev=Number(previous);
    if(!Number.isFinite(cur)||cur<=0)return Number.isFinite(prev)&&prev>0?prev:null;
    if(!Number.isFinite(prev)||prev<=0)return Number(cur.toFixed(2));
    return Number(Math.min(prev,cur).toFixed(2));
  }
  function formatSeconds(seconds){
    const value=Math.max(0,Number(seconds)||0);
    return value.toFixed(2)+' שנ׳';
  }
  return {TARGET,normalizeDifficulty,isComplete,nextBestSeconds,formatSeconds};
});
