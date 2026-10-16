(()=>{
  'use strict';
  const M=window.DoubleReactionTimeModel;
  if(!M||window.__doubleReactionTimeBridge)return;
  window.__doubleReactionTimeBridge=true;

  let roundStartedAt=now(),lastFingerprint='',lastShownKey='';
  function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
  function bodyMode(){return document.body?.dataset?.mode||''}
  function fingerprint(){
    const cards=[...document.querySelectorAll('#board .card')];
    if(cards.length<2)return '';
    return cards.map(card=>[...card.querySelectorAll('.sym')].map(x=>x.dataset.symbolId||'').sort((a,b)=>Number(a)-Number(b)).join(',')).join('|');
  }
  function refreshRound(){
    const fp=fingerprint();
    if(!fp||fp===lastFingerprint)return;
    lastFingerprint=fp;
    roundStartedAt=now();
    lastShownKey='';
  }
  function commonSymbol(){
    const cards=[...document.querySelectorAll('#board .card')];
    if(cards.length<2)return null;
    const first=new Set([...cards[0].querySelectorAll('.sym')].map(x=>x.dataset.symbolId));
    return [...cards[1].querySelectorAll('.sym')].map(x=>x.dataset.symbolId).find(id=>first.has(id))??null;
  }
  function ensureBadge(){
    let badge=document.getElementById('reactionTimePill');
    if(badge)return badge;
    badge=document.createElement('div');
    badge.id='reactionTimePill';
    badge.className='pill reaction-time-pill';
    badge.textContent='⚡ תגובה —';
    const stats=document.getElementById('stats');
    if(stats)stats.appendChild(badge);else document.body.appendChild(badge);
    return badge;
  }
  function ensureStyle(){
    if(document.getElementById('double-reaction-time-style'))return;
    const s=document.createElement('style');s.id='double-reaction-time-style';
    s.textContent='.reaction-time-pill{border-color:rgba(255,216,77,.34)!important;background:linear-gradient(180deg,rgba(255,216,77,.13),rgba(255,255,255,.055))!important;box-shadow:0 0 20px rgba(255,216,77,.08);transition:.18s ease}.reaction-time-pill.flash-time{transform:scale(1.08);box-shadow:0 0 28px rgba(255,216,77,.24)}';
    document.head.appendChild(s);
  }
  function show(seconds,player=null){
    const badge=ensureBadge();
    const text=player==null?'⚡ '+M.formatSeconds(seconds):M.badgeText(seconds,player);
    const key=text+'|'+lastFingerprint;
    if(key===lastShownKey)return;
    lastShownKey=key;
    badge.textContent=text;
    badge.classList.remove('flash-time');void badge.offsetWidth;badge.classList.add('flash-time');
    setTimeout(()=>badge.classList.remove('flash-time'),260);
  }
  function seconds(){return Math.max(.001,(now()-roundStartedAt)/1000)}
  function onClick(event){
    if(bodyMode()==='versus')return;
    const sym=event.target?.closest?.('.sym');
    if(!sym||!document.getElementById('board')?.contains(sym))return;
    const common=commonSymbol();
    if(common==null||String(sym.dataset.symbolId)!==String(common))return;
    show(seconds(),null);
  }
  function scanVersusWinner(){
    if(bodyMode()!=='versus')return;
    const winner=document.querySelector('#board .versus-winner:not([data-reaction-time-shown])');
    if(!winner)return;
    winner.dataset.reactionTimeShown='1';
    const card=winner.closest('.card[data-card-index]');
    const player=Number(card?.dataset?.cardIndex||0);
    show(seconds(),player);
  }
  function refresh(){refreshRound();scanVersusWinner();ensureBadge()}

  ensureStyle();ensureBadge();refreshRound();
  const board=document.getElementById('board');
  if(board)new MutationObserver(refresh).observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-symbol-id']});
  document.addEventListener('click',onClick,true);
})();
