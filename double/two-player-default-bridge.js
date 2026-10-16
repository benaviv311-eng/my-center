(()=>{
  'use strict';
  const R=window.DoubleTwoPlayerModeRules;
  if(!R||window.__doubleTwoPlayerDefaultBridge)return;
  window.__doubleTwoPlayerDefaultBridge=true;

  function updateLegacy(){
    const section=document.getElementById('twoSection');
    if(!section)return;
    const grid=section.querySelector('.grid');
    if(!grid)return;
    const buttons=[...grid.querySelectorAll('.mode-choice[data-mode="versus"]')];
    const byVariant=new Map(buttons.map(btn=>[btn.dataset.variant,btn]));
    const deck=byVariant.get('deck');
    const duel=byVariant.get('duel');
    if(deck){
      grid.insertBefore(deck,grid.firstElementChild);
      const b=deck.querySelector('b'),s=deck.querySelector('small');
      if(b)b.textContent='🃏 '+R.labelFor('deck');
      if(s)s.textContent='המצב הרגיל · משחקים על כל החפיסה';
    }
    if(duel){
      const b=duel.querySelector('b'),s=duel.querySelector('small');
      if(b)b.textContent='🏁 '+R.labelFor('duel');
      if(s)s.textContent='הראשון ל־10 נקודות';
    }
  }

  function updateEnhanced(){
    const originals=[...document.querySelectorAll('#twoSection .mode-choice[data-mode="versus"]')];
    document.querySelectorAll('.lobby-mode[data-lobby-mode-index]').forEach(card=>{
      const original=originals[Number(card.dataset.lobbyModeIndex)];
      if(!original)return;
      const variant=original.dataset.variant;
      const title=card.querySelector('b'),sub=card.querySelector('small'),icon=card.querySelector('.mode-icon');
      if(variant==='deck'){
        if(icon)icon.textContent='🃏';
        if(title)title.textContent=R.labelFor('deck');
        if(sub)sub.textContent='המצב הרגיל · כל החפיסה';
      }else if(variant==='duel'){
        if(icon)icon.textContent='🏁';
        if(title)title.textContent=R.labelFor('duel');
        if(sub)sub.textContent='הראשון ל־10 נקודות';
      }
    });
  }

  function refresh(){updateLegacy();updateEnhanced()}
  refresh();
  const target=document.getElementById('dropdown')||document.body;
  const observer=new MutationObserver(refresh);
  observer.observe(target,{subtree:true,childList:true});
})();
