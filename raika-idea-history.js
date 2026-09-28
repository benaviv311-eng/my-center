(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RaikaIdeaHistory=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';

  const KEY='raika-idea-history-v1';
  const MAX=1200;

  function text(v){return String(v??'').trim();}
  function tokens(v){
    return new Set(text(v).toLowerCase().replace(/[^p{L}p{N}s]+/gu,' ').split(/s+/).filter(x=>x.length>2));
  }
  function semanticText(card={}){
    return [card.card_type,...(card.characters||[]),card.plot_family,card.title,card.body].filter(Boolean).join(' ');
  }
  function fingerprint(card={}){
    if(text(card.semantic_fingerprint))return text(card.semantic_fingerprint);
    let h=2166136261;
    const s=semanticText(card).toLowerCase();
    for(const ch of s){h^=ch.codePointAt(0)||0;h=Math.imul(h,16777619);}
    return (h>>>0).toString(36);
  }
  function similarity(a,b){
    const A=tokens(a),B=tokens(b);
    if(!A.size||!B.size)return 0;
    let common=0;
    for(const t of A)if(B.has(t))common++;
    return common/Math.max(1,Math.min(A.size,B.size));
  }
  function load(){
    try{
      const raw=root?.localStorage?.getItem(KEY);
      const data=raw?JSON.parse(raw):{};
      return {
        signatures:Array.isArray(data.signatures)?data.signatures.slice(-MAX):[],
        fingerprints:Array.isArray(data.fingerprints)?data.fingerprints.slice(-MAX):[],
        semantic:Array.isArray(data.semantic)?data.semantic.slice(-400):[]
      };
    }catch(_){return{signatures:[],fingerprints:[],semantic:[]};}
  }
  function save(state){
    try{root?.localStorage?.setItem(KEY,JSON.stringify(state));}catch(_){}
    return state;
  }
  function uniqueTail(values,max){
    return [...new Set(values.filter(Boolean).map(text))].slice(-max);
  }
  function rememberCards(cards=[]){
    const state=load();
    for(const card of cards||[]){
      if(card?.signature)state.signatures.push(text(card.signature));
      state.fingerprints.push(fingerprint(card));
      const semantic=semanticText(card);
      if(semantic)state.semantic.push(semantic.slice(0,2200));
    }
    state.signatures=uniqueTail(state.signatures,MAX);
    state.fingerprints=uniqueTail(state.fingerprints,MAX);
    state.semantic=uniqueTail(state.semantic,400);
    return save(state);
  }
  function recentSignatures(limit=240){
    const state=load();
    return state.signatures.slice(-Math.max(1,Number(limit)||240));
  }
  function filterFresh(cards=[],threshold=0.62){
    const state=load();
    const sigs=new Set(state.signatures);
    const fps=new Set(state.fingerprints);
    const accepted=[];
    const semanticSeen=state.semantic.slice(-300);
    for(const card of cards||[]){
      if(card?.signature&&sigs.has(text(card.signature)))continue;
      if(fps.has(fingerprint(card)))continue;
      const s=semanticText(card);
      if(s&&semanticSeen.some(old=>similarity(s,old)>=threshold))continue;
      if(s&&accepted.some(old=>similarity(s,semanticText(old))>=threshold))continue;
      accepted.push(card);
    }
    return accepted;
  }
  function clear(){
    try{root?.localStorage?.removeItem(KEY);}catch(_){}
  }
  return {key:KEY,rememberCards,recentSignatures,filterFresh,fingerprint,similarity,clear};
});