(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RaikaIdeaEngineCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function text(v){return String(v??'').trim();}
  function hash(value){
    let h=2166136261;
    for(const ch of text(value)){h^=ch.codePointAt(0)||0;h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function ideaFingerprint(card={}){
    if(text(card.semantic_fingerprint))return text(card.semantic_fingerprint);
    return hash([
      text(card.card_type),
      ...(Array.isArray(card.characters)?card.characters.slice().sort():[]),
      text(card.plot_family),
      text(card.title),
      text(card.body)
    ].join('|').toLowerCase()).toString(36);
  }
  function filterBlocked(cards=[],blocked=[]){
    const exact=new Set();
    const families=new Set();
    for(const row of Array.isArray(blocked)?blocked:[]){
      if(text(row.semantic_fingerprint))exact.add(text(row.semantic_fingerprint));
      if(row.scope==='family'&&text(row.plot_family))families.add(text(row.plot_family));
    }
    return (Array.isArray(cards)?cards:[]).filter(card=>{
      if(exact.has(ideaFingerprint(card)))return false;
      if(families.has(text(card.plot_family)))return false;
      return true;
    });
  }
  function deterministicOrder(cards,seed){
    return cards.slice().sort((a,b)=>{
      const ha=hash(`${seed}|${a.signature||a.id||a.idea_id||''}`);
      const hb=hash(`${seed}|${b.signature||b.id||b.idea_id||''}`);
      return ha-hb||text(a.id||a.idea_id).localeCompare(text(b.id||b.idea_id));
    });
  }
  function selectDiverseBatch(cards=[],options={}){
    const count=Math.max(1,Number(options.count)||24);
    const blocked=(options.blocked||[]).concat(
      (options.blockedFingerprints||[]).map(x=>({semantic_fingerprint:x,scope:'fingerprint'})),
      (options.blockedFamilies||[]).map(x=>({semantic_fingerprint:'',plot_family:x,scope:'family'}))
    );
    const seen=new Set((options.seenSignatures||[]).map(text));
    const filtered=filterBlocked(cards,blocked).filter(card=>!seen.has(text(card.signature)));
    const unique=[];
    const signatures=new Set();
    for(const card of deterministicOrder(filtered,text(options.seed||'raika'))){
      const sig=text(card.signature)||`id:${text(card.id||card.idea_id)}`;
      if(signatures.has(sig))continue;
      if(options.filterType&&options.filterType!=='all'&&options.filterType!=='new'&&text(card.card_type)!==text(options.filterType))continue;
      signatures.add(sig);unique.push(card);
    }
    const cap=Math.max(1,Math.floor(count*0.35));
    const typeCounts={},charCounts={},picked=[],deferred=[];
    for(const card of unique){
      if(picked.length>=count)break;
      const type=text(card.card_type)||'idea';
      const chars=[...new Set(Array.isArray(card.characters)?card.characters.map(text).filter(Boolean):[])];
      const typeOk=(typeCounts[type]||0)+1<=cap;
      const charsOk=chars.every(id=>(charCounts[id]||0)+1<=cap);
      if(!typeOk||!charsOk){deferred.push(card);continue;}
      picked.push(card);typeCounts[type]=(typeCounts[type]||0)+1;
      chars.forEach(id=>charCounts[id]=(charCounts[id]||0)+1);
    }
    for(const card of deferred){
      if(picked.length>=count)break;
      picked.push(card);
    }
    return picked.slice(0,count);
  }
  function replaceRefreshableCards(state={},cards=[]){
    const locked=state.locked instanceof Set?new Set(state.locked):new Set(state.locked||[]);
    const existing=Array.isArray(state.cards)?state.cards:[];
    const keep=existing.filter(card=>locked.has(String(card.id)));
    const used=new Set(keep.map(card=>String(card.id)));
    const fresh=(Array.isArray(cards)?cards:[]).filter(card=>{
      const id=String(card.id);
      if(used.has(id))return false;
      used.add(id);return true;
    });
    return {...state,cards:[...keep,...fresh],locked};
  }
  return {ideaFingerprint,filterBlocked,selectDiverseBatch,replaceRefreshableCards};
});
