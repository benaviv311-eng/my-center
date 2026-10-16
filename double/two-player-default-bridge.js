(()=>{
  'use strict';
  const R=window.DoubleTwoPlayerModeRules;
  if(!R||window.__doubleTwoPlayerDefaultBridge)return;
  window.__doubleTwoPlayerDefaultBridge=true;

  function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}

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
      if(grid.firstElementChild!==deck)grid.insertBefore(deck,grid.firstElementChild);
      setText(deck.querySelector('b'),'🃏 '+R.labelFor('deck'));
      setText(deck.querySelector('small'),'המצב הרגיל · משחקים על כל החפיסה');
    }
    if(duel){
      setText(duel.querySelector('b'),'🏁 '+R.labelFor('duel'));
      setText(duel.querySelector('small'),'הראשון ל־10 נקודות');
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
        setText(icon,'🃏');
        setText(title,R.labelFor('deck'));
        setText(sub,'המצב הרגיל · כל החפיסה');
      }else if(variant==='duel'){
        setText(icon,'🏁');
        setText(title,R.labelFor('duel'));
        setText(sub,'הראשון ל־10 נקודות');
      }
    });
  }

  function refresh(){updateLegacy();updateEnhanced()}
  refresh();
  const target=document.getElementById('dropdown')||document.body;
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;refresh()});
  });
  observer.observe(target,{subtree:true,childList:true});
})();
