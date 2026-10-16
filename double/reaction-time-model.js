(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DoubleReactionTimeModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function formatSeconds(seconds){
    const s=Math.max(0,Number(seconds)||0);
    return s.toFixed(2)+' שנ׳';
  }
  function playerLabel(player){return Number(player)===1?'שחקן 2':'שחקן 1'}
  function badgeText(seconds,player){return '⚡ '+formatSeconds(seconds)+' · '+playerLabel(player)}
  return {formatSeconds,playerLabel,badgeText};
});
