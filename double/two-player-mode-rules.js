(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DoubleTwoPlayerModeRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const LABELS={deck:'רגיל · חפיסה מלאה',duel:'מרוץ ל־10'};
  function defaultVariant(){return 'deck'}
  function orderVariants(list=[]){
    const arr=[...list];
    return arr.sort((a,b)=>(a==='deck'?-1:b==='deck'?1:0));
  }
  function labelFor(variant){return LABELS[variant]||variant}
  function deckRoundPairs(order=[]){
    const cards=[...order],pairs=[];
    for(let i=0;i<cards.length-1;i++)pairs.push([cards[i],cards[i+1]]);
    return pairs;
  }
  function knockoutLivesAfterRound(lives=[3,3],winner){
    const next=[Math.max(0,Number(lives[0])||0),Math.max(0,Number(lives[1])||0)];
    if(winner!==0&&winner!==1)return next;
    const loser=1-winner;
    next[loser]=Math.max(0,next[loser]-1);
    return next;
  }
  function knockoutWinner(lives=[0,0]){
    const a=Math.max(0,Number(lives[0])||0),b=Math.max(0,Number(lives[1])||0);
    if(a<=0&&b>0)return 1;
    if(b<=0&&a>0)return 0;
    return null;
  }
  function suddenWinnerOnWrong(player){return Number(player)===0?1:0}
  function suddenEndsOnCorrect(){return false}
  return {defaultVariant,orderVariants,labelFor,deckRoundPairs,knockoutLivesAfterRound,knockoutWinner,suddenWinnerOnWrong,suddenEndsOnCorrect};
});
