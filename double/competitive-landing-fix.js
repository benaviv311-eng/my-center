(()=>{
  'use strict';
  const R=window.DoubleCompetitiveRules;
  if(!R)return;
  const root=document.documentElement;
  function playerCount(){return Number(root.dataset.doublePlayers)||1}
  function originalFor(index){
    const selector=playerCount()===2?'#twoSection .mode-choice':'#oneSection .mode-choice';
    return [...document.querySelectorAll(selector)][Number(index)]||null;
  }
  document.addEventListener('click',event=>{
    const player=event.target?.closest?.('[data-lobby-players]');
    if(player){root.dataset.doublePlayers=String(Number(player.dataset.lobbyPlayers)===2?2:1);return;}
    const modeCard=event.target?.closest?.('[data-lobby-mode-index]');
    if(!modeCard)return;
    const original=originalFor(modeCard.dataset.lobbyModeIndex);
    if(!original||!R.skipDifficulty(original.dataset.mode))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{localStorage.setItem('double-difficulty-v1',R.fixedDifficulty(original.dataset.mode))}catch(_){ }
    original.click();
  },true);
})();