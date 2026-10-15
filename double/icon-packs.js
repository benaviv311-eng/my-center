(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleIconPacks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='double-icon-pack-v1';
  const gabbyParts=(typeof globalThis!=='undefined'&&globalThis.__DOUBLE_GABBY_SPRITE_PARTS)||[];
  const dragonParts=(typeof globalThis!=='undefined'&&globalThis.__DOUBLE_DRAGONBALL_SPRITE_PARTS)||[];
  const packs={
    default:{id:'default',label:'רגיל',icon:'🎲',kind:'emoji',playable:57,total:57},
    'gabby-cats':{id:'gabby-cats',label:'חתולי גבי',icon:'🐱',kind:'sprite',sprite:'data:image/webp;base64,'+gabbyParts.join(''),columns:8,rows:8,playable:57,total:64},
    'dragon-ball':{id:'dragon-ball',label:'דרגון בול',icon:'🐉',kind:'sprite',sprite:'data:image/webp;base64,'+dragonParts.join(''),columns:8,rows:8,playable:57,total:64}
  };
  function normalize(id){return packs[id]?id:'default'}
  function getChoice(){try{return normalize(localStorage.getItem(KEY)||'default')}catch(_){return 'default'}}
  function getSelected(){const id=getChoice();return id==='dragon-ball'?'gabby-cats':id}
  function setSelected(id){
    id=normalize(id);
    try{localStorage.setItem(KEY,id)}catch(_){}
    try{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('double-icon-pack-change',{detail:{id}}))}catch(_){}
    return id;
  }
  function playableCount(id=getChoice()){const p=packs[normalize(id)];return Number(p.playable)||57}
  function tileFor(symbolId,id=getChoice()){
    const p=packs[normalize(id)],count=Number(p.playable)||57;
    const n=((Number(symbolId)||0)%count+count)%count;
    return {index:n,col:n%(p.columns||8),row:Math.floor(n/(p.columns||8))};
  }
  function hashKey(value,count=57){
    const s=String(value??'');let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return Math.abs(h>>>0)%count;
  }
  function backgroundPosition(index,pack){
    const cols=pack.columns||8,rows=pack.rows||8,col=index%cols,row=Math.floor(index/cols);
    return `${(col/Math.max(1,cols-1))*100}% ${(row/Math.max(1,rows-1))*100}%`;
  }
  function clearSpriteStyle(el){
    if(!el)return;
    el.classList.remove('double-pack-sprite');
    delete el.dataset.iconPack;delete el.dataset.iconIndex;
    ['backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','width','height','borderRadius','boxShadow','display'].forEach(k=>el.style[k]='');
  }
  function applySprite(el,index,id=getChoice()){
    if(!el)return false;
    const pack=packs[normalize(id)];
    if(pack.kind!=='sprite'||!pack.sprite||pack.sprite.endsWith(','))return false;
    el.textContent='';
    el.classList.add('double-pack-sprite');
    el.dataset.iconPack=pack.id;
    el.dataset.iconIndex=String(index);
    el.style.backgroundImage=`url("${pack.sprite}")`;
    el.style.backgroundSize=`${(pack.columns||8)*100}% ${(pack.rows||8)*100}%`;
    el.style.backgroundPosition=backgroundPosition(index,pack);
    el.style.backgroundRepeat='no-repeat';
    el.style.display='inline-block';
    el.style.width='1.18em';
    el.style.height='1.18em';
    el.style.borderRadius='22%';
    el.style.boxShadow='0 2px 7px rgba(0,0,0,.18)';
    return true;
  }
  function applyGlyph(el,symbolId){
    const id=getChoice(),pack=packs[id];
    if(pack.kind!=='sprite')return false;
    return applySprite(el,tileFor(symbolId,id).index,id);
  }
  function applyPreview(el,key){
    const id=getChoice(),pack=packs[id];
    if(pack.kind!=='sprite')return false;
    return applySprite(el,hashKey(key,pack.playable||57),id);
  }
  function restorePreview(el){
    if(!el)return;
    const source=el.dataset.packSource;
    if(source!=null)el.textContent=source;
    clearSpriteStyle(el);
  }
  return {KEY,packs,normalize,getChoice,getSelected,setSelected,playableCount,tileFor,hashKey,applySprite,applyGlyph,applyPreview,restorePreview};
});