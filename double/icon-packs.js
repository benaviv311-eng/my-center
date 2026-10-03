(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleIconPacks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='double-icon-pack-v1';
  const parts=(typeof globalThis!=='undefined'&&globalThis.__DOUBLE_GABBY_SPRITE_PARTS)||[];
  const SPRITE='data:image/webp;base64,'+parts.join('');
  const packs={
    default:{id:'default',label:'רגיל',icon:'🎲',kind:'emoji'},
    'gabby-cats':{id:'gabby-cats',label:'חתולי גבי',icon:'🐱',kind:'sprite',sprite:SPRITE,columns:8,rows:8,playable:57,total:64}
  };
  function normalize(id){return packs[id]?id:'default'}
  function getSelected(){try{return normalize(localStorage.getItem(KEY)||'default')}catch(_){return 'default'}}
  function setSelected(id){
    id=normalize(id);
    try{localStorage.setItem(KEY,id)}catch(_){}
    try{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('double-icon-pack-change',{detail:{id}}))}catch(_){}
    return id;
  }
  function playableCount(id='gabby-cats'){const p=packs[normalize(id)];return p.kind==='sprite'?p.playable:57}
  function tileFor(symbolId){const n=((Number(symbolId)||0)%57+57)%57;return {index:n,col:n%8,row:Math.floor(n/8)}}
  function hashKey(value){
    const s=String(value??'');let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return Math.abs(h>>>0)%57;
  }
  function backgroundPosition(index){const col=index%8,row=Math.floor(index/8);return `${(col/7)*100}% ${(row/7)*100}%`}
  function applySprite(el,index){
    if(!el||!SPRITE)return false;
    el.textContent='';
    el.classList.add('double-pack-sprite');
    el.dataset.iconPack='gabby-cats';
    el.dataset.iconIndex=String(index);
    el.style.backgroundImage=`url("${SPRITE}")`;
    el.style.backgroundSize='800% 800%';
    el.style.backgroundPosition=backgroundPosition(index);
    el.style.backgroundRepeat='no-repeat';
    el.style.display='inline-block';
    el.style.width='1.18em';
    el.style.height='1.18em';
    el.style.borderRadius='22%';
    el.style.boxShadow='0 2px 7px rgba(0,0,0,.18)';
    return true;
  }
  function applyGlyph(el,symbolId){if(getSelected()!=='gabby-cats')return false;return applySprite(el,tileFor(symbolId).index)}
  function applyPreview(el,key){if(getSelected()!=='gabby-cats')return false;return applySprite(el,hashKey(key))}
  function restorePreview(el){
    if(!el)return;
    const source=el.dataset.packSource;
    if(source!=null)el.textContent=source;
    el.classList.remove('double-pack-sprite');
    delete el.dataset.iconPack;delete el.dataset.iconIndex;
    ['backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','width','height','borderRadius','boxShadow','display'].forEach(k=>el.style[k]='');
  }
  return {KEY,packs,normalize,getSelected,setSelected,playableCount,tileFor,hashKey,applySprite,applyGlyph,applyPreview,restorePreview,spriteData:SPRITE};
});