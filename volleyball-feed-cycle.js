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
function buildInfiniteBatchNoRepeat(cards,filters={},seed='volleyball',page=0,size=8){
  const population=filters.population||'all';
  const topic=filters.topic||'all';
  const query=filters.query||'';
  const filterFn=(typeof window!=='undefined'&&window.filterVolleyballFeed)||((list)=>list);
  const pool=filterFn(cards,{population,topic,query});
  if(!pool.length)return [];
  const safeSize=Math.max(1,Math.min(Number(size)||8,pool.length));
  const absoluteStart=Math.max(0,Number(page)||0)*safeSize;
  const batch=[];
  for(let i=0;i<safeSize;i++){
    const absolute=absoluteStart+i;
    const cycle=Math.floor(absolute/pool.length);
    const index=absolute%pool.length;
    const shuffled=vbSeededShuffle(pool,`${seed}|${population}|${topic}|${query}|${cycle}`);
    batch.push(shuffled[index]);
  }
  return batch;
}
if(typeof window!=='undefined')window.buildInfiniteBatch=buildInfiniteBatchNoRepeat;
if(typeof module!=='undefined'&&module.exports)module.exports={buildInfiniteBatchNoRepeat,vbSeededShuffle,vbHashSeed};
