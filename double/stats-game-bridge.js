(()=>{
  'use strict';
  const S=window.DoubleStatsStore;
  const frame=document.getElementById('core');
  if(!S||!frame)return;
  let observer=null,boardObserver=null,doc=null,roundStart=0,lastFingerprint='',singleCombo=0;
  const params=new URLSearchParams(location.search);
  function modeKey(){
    const launch=params.get('launch')||'classic';
    if(launch==='sprint')return 'sprint:'+(Math.max(1,Number(params.get('target'))||5));
    if(launch==='versus')return 'versus:'+(params.get('variant')||'duel');
    return launch;
  }
  function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
  function fingerprint(){
    const cards=[...(doc?.querySelectorAll('#board .card')||[])];
    if(cards.length<2)return '';
    return cards.map(card=>[...card.querySelectorAll('.sym')].map(x=>x.dataset.symbolId||'').sort((a,b)=>Number(a)-Number(b)).join(',')).join('|');
  }
  function refreshRound(){
    const key=fingerprint();
    if(!key||key===lastFingerprint)return;
    lastFingerprint=key;roundStart=now();
  }
  function commonSymbol(){
    const cards=[...(doc?.querySelectorAll('#board .card')||[])];
    if(cards.length<2)return null;
    const a=new Set([...cards[0].querySelectorAll('.sym')].map(x=>x.dataset.symbolId));
    return [...cards[1].querySelectorAll('.sym')].map(x=>x.dataset.symbolId).find(id=>a.has(id))??null;
  }
  function reaction(){const ms=roundStart?now()-roundStart:null;return Number.isFinite(ms)&&ms>0?Math.round(ms):null}
  function recordCorrect(combo){S.recordEvent({type:'correct',mode:modeKey(),reactionMs:reaction(),combo:combo||0,at:Date.now()})}
  function recordWrong(){S.recordEvent({type:'wrong',mode:modeKey(),at:Date.now()})}
  function onClick(event){
    if(!doc||modeKey().startsWith('versus:'))return;
    const sym=event.target?.closest?.('.sym');
    if(!sym||!doc.getElementById('board')?.contains(sym))return;
    const common=commonSymbol();
    if(common==null)return;
    if(sym.dataset.symbolId===String(common)){singleCombo++;recordCorrect(singleCombo)}else{singleCombo=0;recordWrong()}
  }
  function onMutations(list){
    refreshRound();
    if(!modeKey().startsWith('versus:'))return;
    for(const m of list){
      if(m.type!=='attributes'||m.attributeName!=='class')continue;
      const el=m.target;if(!(el instanceof Element))continue;
      const before=String(m.oldValue||'');
      if(el.classList.contains('versus-winner')&&!before.includes('versus-winner'))recordCorrect(0);
      if(el.classList.contains('versus-wrong')&&!before.includes('versus-wrong'))recordWrong();
    }
  }
  function watch(nextDoc){
    observer?.disconnect();boardObserver?.disconnect();doc=nextDoc;singleCombo=0;lastFingerprint='';roundStart=0;
    if(!doc?.body)return;
    doc.addEventListener('click',onClick,true);
    const board=doc.getElementById('board');
    if(board){boardObserver=new MutationObserver(refreshRound);boardObserver.observe(board,{childList:true,subtree:true});}
    observer=new MutationObserver(onMutations);
    observer.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
    refreshRound();
  }
  frame.addEventListener('load',()=>{try{watch(frame.contentDocument)}catch(_){}});
  try{if(frame.contentDocument?.body)watch(frame.contentDocument)}catch(_){ }
})();
