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
  return {defaultVariant,orderVariants,labelFor};
});
