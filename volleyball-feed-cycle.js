function vbHashSeed(seed){
  let h=2166136261;
  for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}
function vbSeededShuffle(items,seed){
  const arr=items.slice();
  let state=vbHashSeed(seed)||1;
  const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}
function vbFilter(cards,{topic='all',population='all',level='all',query=''}={}){
  if(typeof window!=='undefined'&&typeof window.filterVolleyballFeed==='function')return window.filterVolleyballFeed(cards,{topic,population,level,query});
  const q=String(query||'').trim().toLowerCase();
  const out=[];
  for(const card of cards){
    const topicOk=topic==='all'||card.topic===topic||card.topic==='all';
    const levelOk=level==='all'||(card.levels||[]).includes('all')||(card.levels||[]).includes(level);
    const hay=[card.title,card.text,card.detail,...(card.tags||[])].join(' ').toLowerCase();
    if(!topicOk||!levelOk||(q&&!hay.includes(q)))continue;
    if(population==='all'||(card.populations||[]).includes(population)||(card.populations||[]).includes('all'))out.push(card);
  }
  return out;
}
function buildInfiniteBatchNoRepeat(cards,filters={},seed='volleyball',page=0,size=8){
  const population=filters.population||'all';
  const topic=filters.topic||'all';
  const query=filters.query||'';
  const pool=vbFilter(cards,{...filters,population,topic,query});
  if(!pool.length)return [];
  const safeSize=Math.max(1,Math.min(Number(size)||8,pool.length));
  const absoluteStart=Math.max(0,Number(page)||0)*safeSize;
  const batch=[];
  const cycleCache=new Map();
  for(let i=0;i<safeSize;i++){
    const absolute=absoluteStart+i;
    const cycle=Math.floor(absolute/pool.length);
    const index=absolute%pool.length;
    if(!cycleCache.has(cycle))cycleCache.set(cycle,vbSeededShuffle(pool,`${seed}|${population}|${topic}|${query}|${cycle}`));
    batch.push(cycleCache.get(cycle)[index]);
  }
  return batch;
}
if(typeof window!=='undefined')window.buildInfiniteBatch=buildInfiniteBatchNoRepeat;
if(typeof module!=='undefined'&&module.exports)module.exports={buildInfiniteBatchNoRepeat,vbSeededShuffle,vbHashSeed,vbFilter};
