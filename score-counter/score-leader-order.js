(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.ScoreLeaderOrder=api;
  if(root && root.document) api.bind(root.document);
})(typeof window!=='undefined'?window:null,function(){
  function numericScore(value){
    const text=String(value??'').trim();
    const match=text.match(/-?\d+(?:\.\d+)?/u);
    if(!match) return Number.NEGATIVE_INFINITY;
    const score=Number(match[0]);
    return Number.isFinite(score)?score:Number.NEGATIVE_INFINITY;
  }

  function sortScoreEntries(entries){
    return Array.from(entries||[])
      .map((entry,index)=>({entry,index,score:numericScore(entry&&entry.score)}))
      .sort((a,b)=>{
        if(b.score!==a.score) return b.score-a.score;
        return a.index-b.index;
      })
      .map(item=>item.entry);
  }

  function valueFromElement(el){
    if(!el) return null;
    if('value' in el){
      const value=String(el.value??'').trim();
      if(value) return value;
    }
    const text=String(el.textContent||'').trim();
    return text||null;
  }

  function scoreFromCard(card){
    const source=card.querySelector('.score-board-source');
    const display=card.querySelector('.score-board-value');
    const sourceValue=valueFromElement(source);
    const displayValue=valueFromElement(display);
    const chosen=sourceValue!==null?sourceValue:displayValue;
    return numericScore(chosen);
  }

  function reorderCards(teams){
    if(!teams || teams.classList.contains('score-layout-free')) return false;

    const cards=Array.from(teams.querySelectorAll(':scope > .card.score-card-professional'));
    if(cards.length<2) return false;

    const entries=cards.map(card=>({card,score:scoreFromCard(card)}));
    const sorted=sortScoreEntries(entries);
    const changed=sorted.some((entry,index)=>entry.card!==cards[index]);
    if(!changed) return false;

    sorted.forEach(entry=>teams.appendChild(entry.card));
    teams.dataset.scoreLeaderOrdered='1';
    document.dispatchEvent(new CustomEvent('scorecards:reordered'));
    return true;
  }

  function bind(doc){
    const teams=doc.getElementById('teams');
    if(!teams || teams.dataset.scoreLeaderOrderReady==='1') return;
    teams.dataset.scoreLeaderOrderReady='1';

    let frame=0;
    let timer=0;

    function run(){
      frame=0;
      reorderCards(teams);
    }

    function schedule(){
      if(frame) cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>requestAnimationFrame(run));
      clearTimeout(timer);
      timer=setTimeout(()=>reorderCards(teams),50);
    }

    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList' || record.type==='characterData')) schedule();
    });
    observer.observe(teams,{childList:true,subtree:true,characterData:true});

    doc.addEventListener('click',schedule,true);
    doc.addEventListener('input',schedule,true);
    doc.addEventListener('change',schedule,true);
    doc.addEventListener('scorecards:autoarrange',schedule);
    window.addEventListener('resize',schedule,{passive:true});

    reorderCards(teams);
    requestAnimationFrame(schedule);
    setTimeout(schedule,180);
    setTimeout(schedule,700);
  }

  return {numericScore,sortScoreEntries,scoreFromCard,reorderCards,bind};
});
