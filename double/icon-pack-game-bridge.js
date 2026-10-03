(()=>{
  'use strict';
  const P=window.DoubleIconPacks;
  const frame=document.getElementById('core');
  if(!P||!frame)return;
  let observer=null;
  function ensureStyle(doc){
    if(doc.getElementById('double-icon-pack-game-style'))return;
    const style=doc.createElement('style');style.id='double-icon-pack-game-style';
    style.textContent=`.glyph.double-pack-sprite{display:inline-block!important;width:1.2em!important;height:1.2em!important;border-radius:22%;background-repeat:no-repeat!important;box-shadow:0 2px 8px rgba(0,0,0,.18);vertical-align:middle}.sym:has(.double-pack-sprite){padding:4px!important}`;
    doc.head.appendChild(style);
  }
  function apply(doc){
    if(!doc?.body||P.getSelected()!=='gabby-cats')return;
    ensureStyle(doc);
    doc.querySelectorAll('.glyph').forEach(glyph=>{
      const button=glyph.closest('.sym'),id=button?.dataset?.symbolId;if(id==null)return;
      if(glyph.dataset.iconPack==='gabby-cats'&&glyph.dataset.iconIndex===String(Number(id)%57))return;
      P.applyGlyph(glyph,Number(id));button?.setAttribute('aria-label','דמות חתול '+(Number(id)+1));
    });
  }
  function watch(doc){observer?.disconnect();apply(doc);observer=new MutationObserver(()=>apply(doc));observer.observe(doc.body,{subtree:true,childList:true})}
  frame.addEventListener('load',()=>{try{watch(frame.contentDocument)}catch(_){}});
  try{if(frame.contentDocument?.body)watch(frame.contentDocument)}catch(_){}
})();