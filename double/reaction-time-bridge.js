(()=>{
  'use strict';
  const M=window.DoubleReactionTimeModel;
  if(!M||window.__doubleReactionTimeBridge)return;
  window.__doubleReactionTimeBridge=true;

  const SYMBOL_SELECTOR='.sym,.symbol';
  let roundStartedAt=now(),lastFingerprint='',lastShownKey='',lastText='⚡ תגובה —';
  function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
  function bodyMode(){return document.body?.dataset?.mode||''}
  function board(){return document.getElementById('board')||document.getElementById('cards')}
  function cards(){return [...(board()?.querySelectorAll('.card')||[])]}
  function fingerprint(){
    const list=cards();if(list.length<2)return '';
    return list.map(card=>[...card.querySelectorAll(SYMBOL_SELECTOR)].map(x=>x.dataset.symbolId||'').sort((a,b)=>Number(a)-Number(b)).join(',')).join('|');
  }
  function refreshRound(){
    const fp=fingerprint();if(!fp||fp===lastFingerprint)return;
    lastFingerprint=fp;roundStartedAt=now();lastShownKey='';
  }
  function commonSymbol(){
    const list=cards();if(list.length<2)return null;
    const first=new Set([...list[0].querySelectorAll(SYMBOL_SELECTOR)].map(x=>x.dataset.symbolId));
    return [...list[1].querySelectorAll(SYMBOL_SELECTOR)].map(x=>x.dataset.symbolId).find(id=>first.has(id))??null;
  }
  function ensureBadge(){
    let badge=document.getElementById('reactionTimePill');if(badge)return badge;
    badge=document.createElement('div');badge.id='reactionTimePill';badge.className='pill reaction-time-pill';badge.textContent=lastText;
    const stats=document.getElementById('stats');
    if(stats?.parentElement)stats.parentElement.appendChild(badge);
    else{const hud=document.querySelector('.hud');if(hud)hud.appendChild(badge);else document.body.appendChild(badge)}
    return badge;
  }
  function ensureStyle(){
    if(document.getElementById('double-reaction-time-style'))return;
    const s=document.createElement('style');s.id='double-reaction-time-style';
    s.textContent='.reaction-time-pill{border-color:rgba(255,216,77,.45)!important;background:linear-gradient(180deg,rgba(255,245,190,.96),rgba(255,226,126,.92))!important;color:#5a477c!important;box-shadow:0 5px 0 rgba(117,82,163,.12);transition:.18s ease;white-space:nowrap}.reaction-time-pill.flash-time{transform:scale(1.08);box-shadow:0 0 28px rgba(255,216,77,.34)}';
    document.head.appendChild(s);
  }
  function show(seconds,player=null){
    const text=player==null?'⚡ '+M.formatSeconds(seconds):M.badgeText(seconds,player),key=text+'|'+lastFingerprint;
    if(key===lastShownKey)return;lastShownKey=key;lastText=text;const badge=ensureBadge();badge.textContent=text;
    badge.classList.remove('flash-time');void badge.offsetWidth;badge.classList.add('flash-time');setTimeout(()=>badge.classList.remove('flash-time'),260);
  }
  function seconds(){return Math.max(.001,(now()-roundStartedAt)/1000)}
  function onClick(event){
    if(bodyMode()==='versus')return;
    const sym=event.target?.closest?.(SYMBOL_SELECTOR),root=board();if(!sym||!root?.contains(sym))return;
    const common=commonSymbol();if(common==null||String(sym.dataset.symbolId)!==String(common))return;show(seconds(),null);
  }
  function scanVersusWinner(){
    if(bodyMode()!=='versus')return;
    const winner=board()?.querySelector('.versus-winner:not([data-reaction-time-shown])');if(!winner)return;
    winner.dataset.reactionTimeShown='1';const card=winner.closest('.card[data-card-index]'),player=Number(card?.dataset?.cardIndex||0);show(seconds(),player);
  }
  function refresh(){refreshRound();scanVersusWinner();ensureBadge()}

  ensureStyle();ensureBadge();refreshRound();const root=board();
  if(root)new MutationObserver(refresh).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-symbol-id']});
  document.addEventListener('click',onClick,true);
})();
