(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function rows(){
    if(!window.RaikaPrivate?.authorized)return [];
    return [...window.RaikaPrivate.edits.values()].filter(row=>{
      const p=row.payload||{},tags=Array.isArray(p.tags)?p.tags.map(String):[];
      return row.item_type==='philosophy'||String(row.item_id||'').startsWith('verses-')||tags.includes('writers-verse')||tags.some(t=>t.includes('פסוק'))||String(p.title||'').includes('פסוק');
    }).sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  }
  function card(row){
    const p=row.payload||{};
    return '<article class="card writer-card"><div class="writer-card-head"><span class="status-badge status-idea">📖 פסוק / השראה</span><span class="meta">'+esc(row.status==='canon'?'קאנון':'הצעה')+'</span></div><h3>'+esc(p.title||'פסוק שמור')+'</h3><div class="writer-summary">'+esc(p.summary||'').replace(/\n/g,'<br>')+'</div>'+(p.tags?.length?'<div class="pill-row">'+p.tags.map(t=>'<span class="pill">'+esc(t)+'</span>').join('')+'</div>':'')+'</article>';
  }
  function render(){
    const host=document.getElementById('raika-verses-grid');if(!host)return;
    if(!window.RaikaPrivate?.authorized){host.innerHTML='<div class="card meta">התחבר בחדר הכותבים כדי לראות את הפסוקים ששמרת.</div>';return;}
    const items=rows();
    host.innerHTML=items.length?items.map(card).join(''):'<div class="card meta">עדיין אין פסוקים שמורים. שמור פסוק או השראה מתוך הצ׳אט בחדר הכותבים.</div>';
  }
  document.addEventListener('raika:private-ready',render);
  document.addEventListener('raika:private-rendered',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();