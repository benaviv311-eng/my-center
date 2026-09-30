(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function normalizeEdit(row){
    const p=row?.payload&&typeof row.payload==='object'?row.payload:{};
    return {id:row.item_id||row.id||'',type:row.item_type||'idea',status:row.status||'idea',...p};
  }
  function isVerse(item={}){
    const tags=Array.isArray(item.tags)?item.tags.join(' '):'';
    const hay=[item.type,item.title,item.summary,tags].join(' ').toLowerCase();
    return item.type==='philosophy'||item.type==='verse'||/פסוק|פסוקים|משלי|תהילים|קהלת|תנ״ך|תנ"ך/.test(hay);
  }
  function collectVerses(){
    const map=new Map();
    for(const item of window.RAIKA_DATA?.ideas||[])if(isVerse(item)&&item.id)map.set(String(item.id),item);
    if(window.RaikaPrivate?.edits instanceof Map){
      for(const row of window.RaikaPrivate.edits.values()){
        const item=normalizeEdit(row);
        if(isVerse(item)&&item.id)map.set(String(item.id),item);
      }
    }
    return [...map.values()].sort((a,b)=>String(b.id).localeCompare(String(a.id)));
  }
  function card(item){
    return '<article class="card writer-card status-'+esc(item.status||'idea')+'"><div class="writer-card-head"><span class="status-badge status-idea">📖 פסוק / השראה</span></div><h3>'+esc(item.title||'פסוק')+'</h3><div class="writer-summary" style="white-space:pre-wrap;line-height:1.8">'+esc(item.summary||'')+'</div>'+(item.tags?.length?'<div class="pill-row raika-tags">'+item.tags.map(t=>'<span class="pill">'+esc(t)+'</span>').join('')+'</div>':'')+'</article>';
  }
  function render(){
    const host=document.getElementById('verses-grid');if(!host)return;
    const q=(document.getElementById('raika-search')?.value||'').trim().toLowerCase();
    const items=collectVerses().filter(x=>!q||[x.title,x.summary,...(x.tags||[])].join(' ').toLowerCase().includes(q));
    host.innerHTML=items.length?items.map(card).join(''):'<div class="card meta">עדיין אין פסוקים שמורים. שמור פסוקים מחדר הכותבים והם יופיעו כאן.</div>';
  }
  function init(){
    document.getElementById('raika-search')?.addEventListener('input',render);
    document.getElementById('clear-raika-filters')?.addEventListener('click',()=>{const q=document.getElementById('raika-search');if(q)q.value='';render();});
    document.addEventListener('raika:private-ready',render);
    document.addEventListener('raika:private-rendered',render);
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.RaikaVerses={collect:collectVerses,render};
})();