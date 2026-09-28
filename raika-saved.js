function collectSavedItems(data={}){
  const keys=['characters','scenes','plotlines','history','world','relationships','ideas'];
  const cloud=keys.flatMap(k=>(data[k]||[]).filter(x=>x.saved===true));
  const local=window.RaikaFeedSave?.all?.()||[];
  const merged=new Map();
  [...cloud,...local].forEach(item=>{if(item?.id)merged.set(String(item.id),item)});
  return [...merged.values()];
}
function rsPage(item){const map={character:'raika-characters.html',scene:'raika-scenes.html',plotline:'raika-plotlines.html',history:'raika-history.html',world:'raika-world.html',relationship:'raika-relationships.html'};return map[item.type]||'raika-writers-room.html';}
function rsRender(){
  const host=document.getElementById('saved-grid');if(!host)return;
  const s=getFilterState(),items=filterItems(collectSavedItems(window.RAIKA_DATA||{}),s.query,s.status,s.type);
  host.innerHTML=items.length?items.map(item=>{
    const html=itemCardHtml({...item,feedPage:rsPage(item)});
    const feedSaved=Boolean(item._feed_saved_snapshot);
    const actions=feedSaved
      ?'<div class="private-card-actions"><button class="btn small" data-rs="unsave">📌 הסר מהשמורים</button></div>'
      :`<div class="private-card-actions"><button class="btn small" data-rpe="edit">✏️ ערוך</button><button class="btn small" data-rpe="versions">🕘 גרסאות</button><button class="btn small" data-rpe="consult">💬 התייעץ</button><button class="btn small" data-rs="unsave">📌 הסר מהשמורים</button>${item.status!=='canon'?'<button class="btn small" data-rs="approve">✅ אשר</button>':''}</div>`;
    return html.replace('<article ','<article data-rp-type="'+esc(item.type||'idea')+'" data-rp-id="'+esc(item.id)+'" ').replace('</article>',actions+'</article>');
  }).join(''):'<div class="card meta">עדיין לא שמרת פריטים. בפיד של ראיקה לחץ 💾 שמור.</div>';
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-rs]');if(!b)return;
  const card=b.closest('.writer-card');if(!card)return;
  const id=card.dataset.rpId,type=card.dataset.rpType||'idea';
  let item=window.RaikaPrivateAPI?.find?.(type,id)||collectSavedItems(window.RAIKA_DATA||{}).find(x=>String(x.id)===String(id));
  if(!item)return;
  e.preventDefault();
  try{
    if(b.dataset.rs==='unsave'){
      if(item._feed_saved_snapshot){
        await window.RaikaFeedSave?.remove?.(item.id);
        rsRender();
        return;
      }
      if(!window.RaikaPrivate?.authorized){toast('כדי להסיר פריט ענן צריך להתחבר.');return;}
      const payload=RaikaWorkspaceClient.payload({...item,saved:false});
      await RaikaPrivateAPI.save(item.type||'idea',item.id,item.status,payload);
      toast('הוסר מהשמורים.');
    }else if(b.dataset.rs==='approve'){
      if(!window.RaikaPrivate?.authorized){toast('כדי לאשר לקאנון צריך להתחבר.');return;}
      if(confirm('להפוך את הפריט הזה לקאנון?')){await RaikaWorkspaceActions.approve(item);toast('אושר כקאנון.')}
    }
  }catch{toast('הפעולה נכשלה.')}
});
function rsInit(){['raika-search','raika-status-filter','raika-type-filter'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener(el.tagName==='INPUT'?'input':'change',rsRender)});document.getElementById('clear-raika-filters')?.addEventListener('click',()=>setTimeout(rsRender,0));rsRender();}
document.addEventListener('raika:private-ready',rsRender);document.addEventListener('raika:private-rendered',rsRender);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rsInit);else rsInit();
if(typeof module!=='undefined')module.exports={collectSavedItems};
