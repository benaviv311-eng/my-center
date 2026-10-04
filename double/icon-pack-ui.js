(()=>{
  'use strict';
  const P=window.DoubleIconPacks;
  if(!P)return;
  let pickerOpen=false;
  const STYLE_ID='double-icon-pack-ui-style';
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`.icon-pack-shell{display:grid;gap:6px}.icon-pack-setting{background:rgba(255,171,216,.075)!important;border-color:rgba(255,171,216,.18)!important}.icon-pack-options{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:7px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.icon-pack-option{min-height:48px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.045);color:#fff;padding:7px 8px;display:flex;align-items:center;gap:7px;cursor:pointer;font-weight:900;font-size:11px}.icon-pack-option span{font-size:19px}.icon-pack-option b{flex:1;text-align:right}.icon-pack-option i{font-style:normal;opacity:.55}.icon-pack-option.active{border-color:#ffd84d;background:rgba(255,216,77,.12);box-shadow:inset 0 0 0 1px rgba(255,216,77,.22)}#board .sym.double-pack-sprite{padding:0;overflow:hidden}`;
    document.head.appendChild(s);
  }
  function shellHtml(){
    const current=P.getSelected(),meta=P.packs[current]||P.packs.default;
    return `<button type="button" class="compact-setting icon-pack-setting ${pickerOpen?'open':''}" data-toggle-icon-pack><span>${meta.icon}</span><b>סט: ${meta.label}</b><i>${pickerOpen?'⌃':'⌄'}</i></button>${pickerOpen?`<div class="icon-pack-options">${Object.values(P.packs).map(pack=>`<button type="button" class="icon-pack-option ${current===pack.id?'active':''}" data-icon-pack="${pack.id}"><span>${pack.icon}</span><b>${pack.label}</b><i>${current===pack.id?'✓':'›'}</i></button>`).join('')}</div>`:''}`;
  }
  function renderShell(shell){
    shell.innerHTML=shellHtml();
    shell.querySelector('[data-toggle-icon-pack]')?.addEventListener('click',()=>{pickerOpen=!pickerOpen;renderAll()});
    shell.querySelectorAll('[data-icon-pack]').forEach(btn=>btn.addEventListener('click',()=>{P.setSelected(btn.dataset.iconPack);pickerOpen=false;renderAll();applyLandingPack()}));
  }
  function injectSettings(){
    document.querySelectorAll('.lobby-settings').forEach(settings=>{
      let shell=settings.querySelector(':scope > .icon-pack-shell');
      if(shell)return;
      shell=document.createElement('div');shell.className='icon-pack-shell';
      const row=settings.querySelector('.compact-settings-row');settings.insertBefore(shell,row||null);
      renderShell(shell);
    });
  }
  function renderAll(){document.querySelectorAll('.icon-pack-shell').forEach(renderShell)}
  function applyLandingPack(){
    const gabby=P.getSelected()==='gabby-cats';
    document.querySelectorAll('#board .sym').forEach(el=>{
      const source=el.dataset.packSource??el.textContent;
      if(el.dataset.packSource==null)el.dataset.packSource=source;
      if(gabby){
        if(el.dataset.iconPack==='gabby-cats')return;
        P.applyPreview(el,source);
      }else{
        if(el.dataset.iconPack!=='gabby-cats')return;
        P.restorePreview(el);
      }
    });
  }
  function refresh(){ensureStyle();injectSettings();applyLandingPack()}
  const root=document.querySelector('.landing')||document.body;
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;refresh()});
  });
  observer.observe(root,{subtree:true,childList:true});
  window.addEventListener('double-icon-pack-change',()=>{renderAll();applyLandingPack()});
  refresh();
})();