(function(root){
  'use strict';

  const KEY='raika-feed-saved-v1';
  const COLLECTIONS=['ideas','scenes','plotlines','history','world','relationships','characters'];

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function read(){
    try{
      const raw=JSON.parse(root.localStorage.getItem(KEY)||'[]');
      return Array.isArray(raw)?raw:[];
    }catch(_){
      return [];
    }
  }
  function write(items){
    root.localStorage.setItem(KEY,JSON.stringify(items||[]));
  }
  function snapshotId(sourceId){
    return 'saved-feed-'+String(sourceId||'').replace(/[^a-zA-Z0-9_-]/g,'-');
  }
  function findSource(id){
    const data=root.RAIKA_DATA||{};
    for(const key of COLLECTIONS){
      const item=(data[key]||[]).find(x=>String(x.id)===String(id));
      if(item)return item;
    }
    return null;
  }
  function makeSnapshot(item={}){
    return {
      id:snapshotId(item.id),
      type:'idea',
      status:'idea',
      title:item.title||'פריט שמור מפיד ראיקה',
      summary:item.summary||item.text||item.role||'',
      placement:item.placement||'',
      why:item.why||'',
      opens:item.opens||'',
      tags:[...new Set([...(Array.isArray(item.tags)?item.tags:[]),'נשמר מפיד ראיקה',item.type||''])].filter(Boolean),
      characters:Array.isArray(item.characters)?item.characters:[],
      saved:true,
      _feed_saved_snapshot:true,
      source_id:String(item.id||''),
      source_type:String(item.type||'idea')
    };
  }
  function cloudSaved(snapshot){
    return Boolean((root.RAIKA_DATA?.ideas||[]).find(x=>x.id===snapshot.id&&x.saved===true));
  }
  function isSaved(item={}){
    const id=snapshotId(item.id);
    return read().some(x=>x.id===id&&x.saved!==false) || cloudSaved({id});
  }
  async function save(item={}){
    if(!item.id)return null;
    const snap=makeSnapshot(item);
    const items=read().filter(x=>x.id!==snap.id);
    items.unshift(snap);
    write(items);

    if(root.RaikaPrivate?.authorized && root.RaikaPrivateAPI?.save){
      try{
        await root.RaikaPrivateAPI.save('idea',snap.id,'idea',clone(snap));
      }catch(_){}
    }

    if(typeof root.toast==='function')root.toast('נשמר בשמורים של ראיקה');
    decorate();
    return snap;
  }
  async function remove(savedId){
    const id=String(savedId||'');
    const local=read().find(x=>x.id===id);
    write(read().filter(x=>x.id!==id));

    if(root.RaikaPrivate?.authorized && root.RaikaPrivateAPI?.save){
      const existing=(root.RAIKA_DATA?.ideas||[]).find(x=>x.id===id);
      if(existing){
        try{
          await root.RaikaPrivateAPI.save('idea',id,existing.status||'idea',{...existing,saved:false});
        }catch(_){}
      }else if(local){
        try{
          await root.RaikaPrivateAPI.save('idea',id,'idea',{...local,saved:false});
        }catch(_){}
      }
    }

    if(typeof root.toast==='function')root.toast('הוסר מהשמורים');
    decorate();
  }
  async function toggle(item={}){
    const id=snapshotId(item.id);
    if(isSaved(item)){
      await remove(id);
      return false;
    }
    await save(item);
    return true;
  }
  function all(){
    return read().filter(x=>x&&x.saved!==false).map(clone);
  }
  function cardItem(card){
    const id=card?.dataset?.raikaId||'';
    return findSource(id);
  }
  function decorate(){
    const host=root.document?.getElementById('raika-daily-feed');
    if(!host)return;

    host.querySelectorAll('.writer-card[data-raika-id]').forEach(card=>{
      const item=cardItem(card);
      if(!item)return;

      let bar=card.querySelector('.card-actions');
      if(!bar){
        bar=root.document.createElement('div');
        bar.className='card-actions';
        card.appendChild(bar);
      }

      let button=bar.querySelector('[data-raika-feed-save]');
      if(!button){
        button=root.document.createElement('button');
        button.type='button';
        button.className='btn small';
        button.setAttribute('data-raika-feed-save','1');
        bar.prepend(button);
      }

      const saved=isSaved(item);
      button.textContent=saved?'✅ נשמר':'💾 שמור';
      button.classList.toggle('active',saved);
      button.setAttribute('aria-pressed',saved?'true':'false');
    });
  }

  root.document?.addEventListener('click',async event=>{
    const button=event.target.closest('[data-raika-feed-save]');
    if(!button)return;
    const card=button.closest('.writer-card[data-raika-id]');
    const item=cardItem(card);
    if(!item)return;
    event.preventDefault();
    event.stopPropagation();
    button.disabled=true;
    try{await toggle(item);}finally{button.disabled=false;decorate();}
  });

  root.document?.addEventListener('raika:private-ready',()=>setTimeout(decorate,0));
  root.document?.addEventListener('raika:private-rendered',()=>setTimeout(decorate,0));

  function init(){
    const host=root.document?.getElementById('ideas-grid');
    if(!host)return;
    decorate();
    new MutationObserver(()=>decorate()).observe(host,{childList:true,subtree:true});
  }

  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  root.RaikaFeedSave={KEY,all,isSaved,save,remove,toggle,makeSnapshot,snapshotId,decorate};
})(typeof window!=='undefined'?window:globalThis);