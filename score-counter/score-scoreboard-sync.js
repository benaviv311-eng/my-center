(function(){
  'use strict';

  const EVENT='scoreboard:scorechange';
  const teams=document.getElementById('teams');
  if(!teams) return;

  const isValueNode=node=>!!node && /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName||'');

  function normalize(value){
    const match=String(value==null?'0':value).match(/-?\d+/u);
    if(!match) return '0';
    return String(Math.max(0,Number(match[0])||0));
  }

  function readNode(node){
    if(!node) return '0';
    if(isValueNode(node)) return normalize(node.value);
    return normalize(node.textContent||'0');
  }

  function directCards(){
    return Array.from(teams.children).filter(el=>el.nodeType===1);
  }

  function cardIndex(card){
    return directCards().indexOf(card);
  }

  function syncDigits(display){
    const digits=Math.max(1,String(display.value||'0').trim().length);
    display.style.setProperty('--score-digits',String(digits));
  }

  function publish(card,display,origin){
    card.dispatchEvent(new CustomEvent(EVENT,{
      bubbles:true,
      detail:{index:cardIndex(card),score:Number(normalize(display.value)),origin:origin||'sync'}
    }));
  }

  function updateActiveGame(){
    const cards=directCards();
    const liveRows=Array.from(document.querySelectorAll('.score-suite-live-team'));
    liveRows.forEach((row,index)=>{
      const display=cards[index]&&cards[index].querySelector('.score-board-value');
      if(!display) return;
      const score=Array.from(row.children).find(el=>el.tagName==='SPAN');
      if(score) score.textContent=normalize(display.value);
    });
  }

  function installCard(card){
    if(card.dataset.scoreboardSync==='1') return;
    const display=card.querySelector('.score-board-value');
    const source=card.querySelector('.score-board-source');
    if(!display||!source) return;

    let syncing=false;
    let last=normalize(display.value);

    function commit(next,origin){
      next=normalize(next);
      display.value=next;
      syncDigits(display);
      if(next!==last){
        last=next;
        publish(card,display,origin);
      }
    }

    function syncDisplayFromSource(origin){
      if(syncing) return;
      syncing=true;
      const next=readNode(source);
      commit(next,origin||'source');
      syncing=false;
    }

    function syncSourceFromDisplay(origin){
      if(syncing) return;
      syncing=true;
      const next=normalize(display.value);
      display.value=next;
      syncDigits(display);
      if(isValueNode(source)) source.value=next;
      else source.textContent=next;
      try{source.dispatchEvent(new Event('blur'))}catch(_){ }
      if(next!==last){
        last=next;
        publish(card,display,origin||'display');
      }
      syncing=false;
    }

    try{
      Object.defineProperty(display,'textContent',{
        configurable:true,
        get(){return String(display.value==null?'0':display.value)},
        set(value){
          display.value=normalize(value);
          syncSourceFromDisplay('legacy-write');
        }
      });
    }catch(_){ }

    display.addEventListener('input',()=>syncDigits(display));
    display.addEventListener('change',()=>syncSourceFromDisplay('display'));
    display.addEventListener('blur',()=>{
      syncSourceFromDisplay('display');
      setTimeout(()=>syncDisplayFromSource('display'),0);
    });

    ['input','change','blur'].forEach(type=>{
      source.addEventListener(type,()=>syncDisplayFromSource('source'));
    });

    card.querySelectorAll('.score-board-plus,.score-board-minus,.score-card-mega').forEach(button=>{
      button.addEventListener('click',()=>{
        requestAnimationFrame(()=>syncDisplayFromSource('game'));
      });
    });

    if(!isValueNode(source)){
      const observer=new MutationObserver(()=>syncDisplayFromSource('source'));
      observer.observe(source,{childList:true,characterData:true,subtree:true});
      card._scoreboardSyncObserver=observer;
    }

    card.dataset.scoreboardSync='1';
    syncDisplayFromSource('init');
  }

  function installAll(){
    directCards().forEach(installCard);
    updateActiveGame();
  }

  document.addEventListener(EVENT,updateActiveGame);
  const observer=new MutationObserver(()=>requestAnimationFrame(installAll));
  observer.observe(teams,{childList:true,subtree:true});
  requestAnimationFrame(installAll);

  window.ScoreboardScoreSync={event:EVENT,installAll};
})();
