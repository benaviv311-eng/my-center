(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function rows(){
    if(!window.RaikaPrivate?.authorized)return [];
    return [...window.RaikaPrivate.edits.values()].filter(row=>{
      const p=row.payload||{},tags=Array.isArray(p.tags)?p.tags.map(String):[];
      const marked=tags.includes('noncanon-plotline')||tags.some(t=>t.includes('לא קאנוני'));
      return row.status!=='canon'&&(marked||row.item_type==='plotline');
    }).sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  }
  function card(row){
    const p=row.payload||{};
    return '<article class="card writer-card"><div class="writer-card-head"><span class="status-badge status-idea">🧭 לא קאנון</span><span class="meta">'+esc(row.status||'idea')+'</span></div><h3>'+esc(p.title||'קו עלילה')+'</h3><div class="writer-summary">'+esc(p.summary||'').replace(/\n/g,'<br>')+'</div>'+(p.tags?.length?'<div class="pill-row">'+p.tags.map(t=>'<span class="pill">'+esc(t)+'</span>').join('')+'</div>':'')+'<div class="meta">קו עלילה לא קאנוני — הצעה בלבד.</div></article>';
  }
  function render(){
    const host=document.getElementById('raika-noncanon-grid');if(!host)return;
    if(!window.RaikaPrivate?.authorized){host.innerHTML='<div class="card meta">התחבר בחדר הכותבים כדי לראות קווי עלילה ששמרת.</div>';return;}
    const items=rows();
    host.innerHTML=items.length?items.map(card).join(''):'<div class="card meta">עדיין אין קווי עלילה לא־קאנוניים שמורים. צור אחד בצ׳אט החי ושמור אותו.</div>';
  }
  document.addEventListener('raika:private-ready',render);
  document.addEventListener('raika:private-rendered',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();