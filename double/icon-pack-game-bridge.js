(()=>{
  'use strict';
  const P=window.DoubleIconPacks;
  const frame=document.getElementById('core');
  if(!P||!frame)return;
  let observer=null;
  const currentChoice=()=>P.getChoice?P.getChoice():P.getSelected();
  function ensureStyle(doc){
    if(!doc.getElementById('double-premium-theme-link')){
      const link=doc.createElement('link');link.id='double-premium-theme-link';link.rel='stylesheet';link.href='double/premium-theme.css?v=12';doc.head.appendChild(link);
    }
    doc.body?.classList.add('double-premium-game');
    if(doc.getElementById('double-icon-pack-game-style'))return;
    const style=doc.createElement('style');style.id='double-icon-pack-game-style';
    style.textContent=`.glyph.double-pack-sprite{display:inline-block!important;width:1.2em!important;height:1.2em!important;border-radius:22%;background-repeat:no-repeat!important;box-shadow:0 2px 8px rgba(0,0,0,.18);vertical-align:middle}.sym:has(.double-pack-sprite){padding:4px!important}`;
    doc.head.appendChild(style);
  }
  function restoreGlyph(glyph){
    if(!glyph?.dataset?.iconPack)return;
    glyph.classList.remove('double-pack-sprite');delete glyph.dataset.iconPack;delete glyph.dataset.iconIndex;
    ['backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','width','height','borderRadius','boxShadow','display'].forEach(k=>glyph.style[k]='');
  }
  function apply(doc){
    if(!doc?.body)return;
    const selected=currentChoice(),pack=P.packs[selected]||P.packs.default;
    ensureStyle(doc);
    doc.querySelectorAll('.glyph').forEach(glyph=>{
      const button=glyph.closest('.sym'),id=button?.dataset?.symbolId;if(id==null)return;
      if(pack.kind!=='sprite'){restoreGlyph(glyph);return;}
      const index=String(((Number(id)||0)%57+57)%57);
      if(glyph.dataset.iconPack===selected&&glyph.dataset.iconIndex===index)return;
      P.applyGlyph(glyph,Number(id));button?.setAttribute('aria-label',`${pack.label} ${Number(id)+1}`);
    });
  }
  function watch(doc){observer?.disconnect();apply(doc);observer=new MutationObserver(()=>apply(doc));observer.observe(doc.body,{subtree:true,childList:true})}
  frame.addEventListener('load',()=>{try{watch(frame.contentDocument)}catch(_){}});
  try{if(frame.contentDocument?.body)watch(frame.contentDocument)}catch(_){}
})();