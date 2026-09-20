(function(root,factory){
  const api=factory(
    root&&root.HomeFeedSources,
    root&&root.HomeFeedRanking,
    root&&root.HomeFeedState
  );
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.HomeFeed=api;
})(typeof window!=='undefined'?window:globalThis,function(Sources,Ranking,State){
  'use strict';
  const BATCH_SIZE=12;
  const SOURCE_LABELS={raika:'⚡ ראיקה',coach:'🧠 מאמן',volleyball:'🏐 כדורעף',languages:'🌍 שפות',music:'🎵 מוזיקה',library:'📚 ספרייה',verses:'📖 פסוקים'};
  const STATUS_LABELS={canon:'✅ קאנון',developing:'📝 בפיתוח',idea:'💡 הצעה',parked:'🗄️ בצד'};
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function shortText(value,limit=420){const s=String(value||'').trim();return s.length>limit?`${s.slice(0,limit).trim()}…`:s;}
  function renderCard(item,{saved=false,recycled=false}={}){
    const languageLabels={ar:'🌍 ערבית',it:'🌍 איטלקית',ru:'🌍 רוסית',es:'🌍 ספרדית'};\n    const source=item.source==='languages'&&item.metadata&&languageLabels[item.metadata.lang]?languageLabels[item.metadata.lang]:(SOURCE_LABELS[item.source]||item.source||'תוכן');
    const status=item.source==='raika'&&item.metadata&&item.metadata.status?STATUS_LABELS[item.metadata.status]||esc(item.metadata.status):'';
    const summary=shortText(item.summary||item.fullText||'');
    const expanded=item.fullText&&item.fullText!==item.summary?`<div class="home-card-expanded" hidden>${esc(item.fullText).replace(/\n/g,'<br>')}</div>`:'';
    const link=item.deepLink?`<a class="home-deep-link" data-home-open href="${esc(item.deepLink)}">פתח לעומק ←</a>`:'';
    return `<article class="home-feed-card" data-home-item="${esc(item.id)}" data-home-source="${esc(item.source)}" data-home-expandable="${item.expandable?'true':'false'}">
      <div class="home-card-head"><span class="home-source-badge" data-source="${esc(item.source)}">${esc(source)}</span><span class="home-card-type">${esc(item.type||'')}</span>${status?`<span class="home-card-status">${status}</span>`:''}${recycled?'<span class="home-recycled-badge">↻ חזרה חכמה</span>':''}</div>
      <h2>${esc(item.title||source)}</h2>
      <p class="home-card-summary">${esc(summary)}</p>
      ${expanded}
      <div class="home-card-links">${link}</div>
      <div class="home-card-actions">
        <button type="button" data-home-action="save">${saved?'♥ נשמר':'♡ שמור'}</button>
        <button type="button" data-home-action="more">＋ יותר מזה</button>
        <button type="button" data-home-action="less">－ פחות מזה</button>
        <button type="button" data-home-action="hide">× לא להציג כרגע</button>
      </div>
    </article>`;
  }
  function filterMode(items,mode,savedIds=[]){
    const saved=new Set(savedIds||[]),list=Array.isArray(items)?items:[];
    if(mode==='saved') return list.filter(item=>saved.has(item.id));
    if(mode==='for-you'||mode==='all') return list.slice();
    return list.filter(item=>item.source===mode);
  }
  function sourceErrorText(errors){
    return (errors||[]).map(error=>`${SOURCE_LABELS[error.source]||error.source} לא נטען כרגע`).join(' · ');
  }
  function fallbackFavorites(win){
    const KEY='my-center-favorites';
    function read(){try{return new Set(JSON.parse(win.localStorage.getItem(KEY)||'[]'))}catch(_){return new Set()}}
    return {
      has:id=>read().has(id),
      all:()=>[...read()],
      toggle:id=>{const set=read(),saved=!set.has(id);if(saved)set.add(id);else set.delete(id);win.localStorage.setItem(KEY,JSON.stringify([...set]));return saved;}
    };
  }
  async function init(doc,env={}){
    if(!doc||!Sources||!Ranking||!State) return null;
    const listEl=doc.getElementById('home-feed-list');
    const toolbar=doc.getElementById('home-feed-toolbar');
    const statusEl=doc.getElementById('home-feed-status');
    const sentinel=doc.getElementById('home-feed-sentinel');
    if(!listEl||!toolbar||!sentinel) return null;
    const win=doc.defaultView||root||globalThis;
    const storage=env.storage||win.localStorage;
    const favorites=env.favorites||win.MyCenterFavorites||fallbackFavorites(win);
    let state=State.load(storage,new Date());
    state=State.setSaved?State.setSaved(state,favorites.all()):(state.profile.saved=favorites.all(),state);
    const collected=await Sources.collectAll(Object.assign({},env,{seed:state.day.seed}));
    const items=collected.items||[];
    const byId=new Map(items.map(item=>[item.id,item]));
    let mode='for-you';
    let cycleIndex=0;
    let order=[];
    let cursor=0;
    let recycled=false;
    let loading=false;
    let scrollTimer=null;
    const cardStart=new Map();
    const seenCards=new WeakSet();

    function persist(){State.save(storage,state);}
    function syncSaved(){state=State.setSaved?State.setSaved(state,favorites.all()):(state.profile.saved=favorites.all(),state);persist();}
    function validIds(ids){return (ids||[]).filter(id=>byId.has(id)&&!state.day.hidden.includes(id));}
    function buildOrder(resetDaily=false){
      syncSaved();
      if(mode==='for-you'){
        const existing=!resetDaily?validIds(state.day.order):[];
        const fresh=Ranking.buildDailyOrder(items,state,mode);
        const merged=[...existing,...fresh.filter(id=>!existing.includes(id))];
        order=merged;
        if(resetDaily||!state.day.order.length||merged.length!==state.day.order.length){state=State.setDailyOrder(state,merged);persist();}
        cursor=0;
      }else{
        order=Ranking.buildDailyOrder(items,state,mode);
        cursor=0;
      }
      cycleIndex=0;recycled=false;
    }
    function currentItem(id){return byId.get(id)||null;}
    function observeCard(article){
      if(!article||seenCards.has(article)) return;
      seenCards.add(article);
      if(dwellObserver) dwellObserver.observe(article);
    }
    function nextIds(count){
      const ids=[];
      while(ids.length<count&&items.length){
        if(cursor>=order.length){
          if(ids.length) break;
          cycleIndex+=1;
          order=Ranking.buildRecycleCycle(items,state,mode,cycleIndex);
          cursor=0;
          recycled=true;
          if(!order.length) break;
        }
        const id=order[cursor++];
        if(!id||state.day.hidden.includes(id)||!byId.has(id)) continue;
        ids.push(id);
      }
      return ids;
    }
    function appendBatch(options={}){
      if(loading) return [];
      const mark=options.markShown!==false;
      loading=true;
      const ids=nextIds(BATCH_SIZE);
      const batch=ids.map(currentItem).filter(Boolean);
      if(batch.length){
        listEl.insertAdjacentHTML('beforeend',batch.map(item=>renderCard(item,{saved:favorites.has(item.id),recycled})).join(''));
        listEl.querySelectorAll('.home-feed-card').forEach(observeCard);
        if(mark) state=State.markShown(state,batch,new Date());
        if(mode==='for-you'){state=State.setCursor?State.setCursor(state,cursor):(state.day.cursor=cursor,state);persist();}
      }
      if(statusEl){
        const errorText=sourceErrorText(collected.errors);
        statusEl.textContent=`${mode==='for-you'?'בשבילי':mode==='saved'?'שמורים':SOURCE_LABELS[mode]||'הכול'} · ${items.length} פריטים${errorText?` · ${errorText} · שאר הפיד ממשיך`:''}`;
      }
      loading=false;
      return batch;
    }
    function clearFeed(){listEl.innerHTML='';cardStart.clear();}
    function setMode(nextMode){
      mode=nextMode||'for-you';
      toolbar.querySelectorAll('[data-home-filter]').forEach(button=>{
        const active=button.dataset.homeFilter===mode;
        button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');
      });
      clearFeed();buildOrder(mode==='for-you'?false:true);appendBatch();
      return mode;
    }
    function refreshFutureOrder(){
      if(mode==='for-you'){
        const rendered=[...listEl.querySelectorAll('[data-home-item]')].map(el=>el.dataset.homeItem);
        const fresh=Ranking.buildDailyOrder(items,state,mode).filter(id=>!rendered.includes(id));
        order=[...rendered,...fresh];cursor=rendered.length;
        state=State.setDailyOrder(state,order);state=State.setCursor?State.setCursor(state,cursor):state;persist();
      }
    }
    function refreshOrder(){clearFeed();buildOrder(true);appendBatch();}
    function updateSavedButtons(id){
      listEl.querySelectorAll(`[data-home-item="${typeof CSS!=='undefined'&&CSS.escape?CSS.escape(id):id}"] [data-home-action="save"]`).forEach(btn=>{btn.textContent=favorites.has(id)?'♥ נשמר':'♡ שמור'});
    }
    function record(item,signal,value){state=State.recordSignal(state,item,signal,value,new Date());persist();}
    function handleClick(event){
      const filter=event.target.closest('[data-home-filter]');
      if(filter){setMode(filter.dataset.homeFilter);return;}
      const article=event.target.closest('[data-home-item]');
      if(!article) return;
      const item=currentItem(article.dataset.homeItem);if(!item)return;
      const action=event.target.closest('[data-home-action]');
      if(action){
        event.preventDefault();event.stopPropagation();
        const kind=action.dataset.homeAction;
        if(kind==='save'){
          favorites.toggle(item.id);syncSaved();updateSavedButtons(item.id);if(mode==='saved')setMode('saved');return;
        }
        if(kind==='more'||kind==='less'){record(item,kind,1);refreshFutureOrder();action.classList.add('selected');return;}
        if(kind==='hide'){
          record(item,'hide',1);article.remove();refreshFutureOrder();appendBatch();return;
        }
      }
      const openLink=event.target.closest('[data-home-open]');
      if(openLink){record(item,'open',1);return;}
      if(event.target.closest('a,button')) return;
      if(item.expandable){
        const panel=article.querySelector('.home-card-expanded');
        if(panel){panel.hidden=!panel.hidden;article.classList.toggle('expanded',!panel.hidden)}
      }else if(item.deepLink){record(item,'open',1);win.location.href=item.deepLink;}
    }
    toolbar.addEventListener('click',handleClick);
    listEl.addEventListener('click',handleClick);

    const Observer=env.IntersectionObserver||win.IntersectionObserver;
    let loadObserver=null,dwellObserver=null;
    if(Observer){
      loadObserver=new Observer(entries=>{if(entries.some(entry=>entry.isIntersecting))appendBatch();},{rootMargin:'700px 0px'});
      loadObserver.observe(sentinel);
      dwellObserver=new Observer(entries=>{
        const now=win.performance&&typeof win.performance.now==='function'?win.performance.now():Date.now();
        entries.forEach(entry=>{
          const id=entry.target&&entry.target.dataset&&entry.target.dataset.homeItem;if(!id)return;
          const visible=entry.isIntersecting&&entry.intersectionRatio>=0.6;
          if(visible&&!cardStart.has(id)) cardStart.set(id,now);
          if(!visible&&cardStart.has(id)){
            const started=cardStart.get(id);cardStart.delete(id);
            const item=currentItem(id);if(item&&now>started){record(item,'dwell',now-started)}
          }
        });
      },{threshold:[0,0.6,1]});
    }else{
      sentinel.addEventListener('click',appendBatch);sentinel.classList.add('fallback');sentinel.textContent='טען עוד';
    }
    function onScroll(){
      if(scrollTimer) win.clearTimeout(scrollTimer);
      scrollTimer=win.setTimeout(()=>{state=State.setScroll(state,win.scrollY||0);persist();},250);
    }
    win.addEventListener('scroll',onScroll,{passive:true});
    function onFavoriteChange(event){
      syncSaved();
      if(event&&event.detail&&event.detail.id) updateSavedButtons(event.detail.id);
      if(mode==='saved') setMode('saved');
    }
    doc.addEventListener('mycenter:favorites-changed',onFavoriteChange);

    const restoreCount=Math.max(0,Number(state.day.cursor)||0);
    buildOrder(false);
    if(restoreCount>0){
      const target=Math.min(restoreCount,order.length);
      while(cursor<target) appendBatch({markShown:false});
    }else appendBatch();
    const savedY=state.day.scrollY||0;
    if(savedY>0){const raf=win.requestAnimationFrame||((fn)=>win.setTimeout(fn,0));raf(()=>win.scrollTo(0,savedY));}

    function destroy(){
      if(loadObserver)loadObserver.disconnect();if(dwellObserver)dwellObserver.disconnect();
      toolbar.removeEventListener('click',handleClick);listEl.removeEventListener('click',handleClick);
      doc.removeEventListener('mycenter:favorites-changed',onFavoriteChange);win.removeEventListener('scroll',onScroll);
      if(scrollTimer)win.clearTimeout(scrollTimer);
    }
    return {appendBatch,setMode,refreshOrder,destroy,getState:()=>state,getMode:()=>mode,getItems:()=>items.slice()};
  }
  function browserEnv(){
    return {
      raikaData:typeof RAIKA_DATA!=='undefined'?RAIKA_DATA:null,
      coachData:globalThis.CoachFeedData,
      volleyballCards:typeof VOLLEYBALL_FEED_CARDS!=='undefined'?VOLLEYBALL_FEED_CARDS:[],
      languageModel:globalThis.LanguageFeedModel,
      libraryDiscovery:globalThis.LibraryDiscovery,
      fetchVerses:typeof fetchPublicVerses==='function'?fetchPublicVerses:null,
      fetchLibraryPayload:()=>fetch('https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Library ${r.status}`);return r.json()}),
      fetchMusicHtml:()=>fetch('music.html',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Music ${r.status}`);return r.text()})
    };
  }
  const api={BATCH_SIZE,renderCard,filterMode,sourceErrorText,init,browserEnv};
  if(typeof document!=='undefined'){
    const boot=()=>init(document,browserEnv()).catch(error=>{const status=document.getElementById('home-feed-status');if(status)status.textContent='הפיד לא נטען כרגע.';console.error(error)});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  }
  return api;
});
