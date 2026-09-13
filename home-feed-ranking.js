(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.HomeFeedRanking=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function hash(input){
    let h=2166136261;
    for(const ch of String(input||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function profileOf(state){
    const p=state&&state.profile||{};
    return {seen:p.seen||{},sourceAffinity:p.sourceAffinity||{},typeAffinity:p.typeAffinity||{},saved:Array.isArray(p.saved)?p.saved:[]};
  }
  function hiddenSet(state){return new Set(Array.isArray(state&&state.day&&state.day.hidden)?state.day.hidden:[])}
  function scoreItem(item,state,seed){
    const profile=profileOf(state),seen=profile.seen[item.id];
    let score=100+(Number(item.weight)||0);
    if(!seen) score+=35; else score-=Math.min(20,(seen.count||0)*4);
    if(profile.saved.includes(item.id)) score+=25;
    score+=(profile.sourceAffinity[item.source]||0)*4;
    score+=(profile.typeAffinity[item.type]||0)*3;
    if(seen&&seen.opens) score+=Math.min(8,seen.opens*2);
    if(seen&&seen.dwellMs) score+=Math.min(8,seen.dwellMs/5000);
    score+=(hash(`${seed}|${item.id}`)%500)/100;
    return score;
  }
  function seededShuffle(items,seed){
    return (items||[]).slice().map((value,index)=>({value,key:hash(`${seed}|${value.id}|${index}`)})).sort((a,b)=>a.key-b.key).map(x=>x.value);
  }
  function diversify(items,{windowSize=7,maxPerSource=2}={}){
    const remaining=(items||[]).slice(),out=[];
    while(remaining.length){
      const counts={};
      let added=0;
      while(added<windowSize&&remaining.length){
        let pick=remaining.findIndex(candidate=>(counts[candidate.source]||0)<maxPerSource);
        if(pick<0) pick=0;
        const [chosen]=remaining.splice(pick,1);
        out.push(chosen);
        counts[chosen.source]=(counts[chosen.source]||0)+1;
        added+=1;
      }
    }
    return out;
  }
  function rankForMode(items,state,mode='for-you',seed){
    const profile=profileOf(state),hidden=hiddenSet(state),baseSeed=seed||(state&&state.day&&state.day.seed)||'home';
    let list=(items||[]).filter(item=>item&&item.id&&!hidden.has(item.id));
    if(mode==='saved') list=list.filter(item=>profile.saved.includes(item.id));
    else if(mode!=='for-you'&&mode!=='all') list=list.filter(item=>item.source===mode);
    if(mode==='all') return diversify(seededShuffle(list,`${baseSeed}|all`),{windowSize:7,maxPerSource:2});
    const ranked=list.slice().sort((a,b)=>{
      const diff=scoreItem(b,state,baseSeed)-scoreItem(a,state,baseSeed);
      return diff||hash(`${baseSeed}|${a.id}`)-hash(`${baseSeed}|${b.id}`);
    });
    if(mode==='for-you'||mode==='saved') return diversify(ranked,{windowSize:7,maxPerSource:2});
    return ranked;
  }
  function buildDailyOrder(items,state,mode='for-you'){
    const seed=(state&&state.day&&state.day.seed)||'home';
    const ranked=rankForMode(items,state,mode,seed);
    if(mode==='saved') return ranked.map(x=>x.id);
    const seen=profileOf(state).seen;
    const fresh=ranked.filter(item=>!seen[item.id]);
    const old=ranked.filter(item=>seen[item.id]);
    return diversify([...fresh,...old],{windowSize:7,maxPerSource:2}).map(x=>x.id);
  }
  function buildRecycleCycle(items,state,mode='for-you',cycleIndex=1){
    const seed=`${(state&&state.day&&state.day.seed)||'home'}|cycle:${Number(cycleIndex)||1}`;
    const hidden=hiddenSet(state);
    const profile=profileOf(state);
    let list=(items||[]).filter(item=>item&&item.id&&!hidden.has(item.id));
    if(mode==='saved') list=list.filter(item=>profile.saved.includes(item.id));
    else if(mode!=='for-you'&&mode!=='all') list=list.filter(item=>item.source===mode);
    const shuffled=seededShuffle(list,seed);
    if(mode==='for-you'){
      shuffled.sort((a,b)=>scoreItem(b,state,seed)-scoreItem(a,state,seed)||hash(`${seed}|${a.id}`)-hash(`${seed}|${b.id}`));
    }
    return diversify(shuffled,{windowSize:7,maxPerSource:2}).map(x=>x.id);
  }
  return {hash,scoreItem,seededShuffle,diversify,rankForMode,buildDailyOrder,buildRecycleCycle};
});
