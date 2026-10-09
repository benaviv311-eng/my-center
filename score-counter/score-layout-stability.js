(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const CARD_WIDTH=240;
  const GAP=8;
  const LAYOUT_GLYPHS={
    auto:'▦',
    one:'▯',
    two:'▯▯',
    three:'▯▯▯',
    row:'▭▭▭',
    free:'✥'
  };

  function visibleCards(){
    return Array.from(teams.querySelectorAll(':scope > .card.score-card-professional')).filter(card=>{
      const style=getComputedStyle(card);
      return style.display!=='none' && style.visibility!=='hidden';
    });
  }

  function mode(){
    return teams.dataset.scoreLayoutMode || 'auto';
  }

  function possibleColumns(width,count){
    const possible=Math.max(1,Math.floor((Math.max(0,width)+GAP)/(CARD_WIDTH+GAP)));
    return Math.max(1,Math.min(count||1,possible));
  }

  function requestedColumns(layoutMode,count,max){
    if(layoutMode==='one') return 1;
    if(layoutMode==='two') return Math.min(2,max);
    if(layoutMode==='three') return Math.min(3,max);
    if(layoutMode==='row') return Math.min(Math.max(1,count),max);
    return Math.min(Math.max(1,count),max);
  }

  function syncColumns(){
    if(!teams.classList.contains('score-layout-managed')) return;
    const list=visibleCards();
    const width=teams.getBoundingClientRect().width || parseFloat(getComputedStyle(teams).width) || 0;
    const max=possibleColumns(width,list.length);
    const columns=requestedColumns(mode(),list.length,max);
    teams.style.setProperty('--score-layout-columns',String(columns));
    teams.dataset.scoreLayoutRenderedColumns=String(columns);
  }

  function findTrigger(){
    return document.querySelector('button[data-score-layout-trigger="1"]');
  }

  function updateTriggerIcon(){
    const trigger=findTrigger();
    if(!trigger) return;
    const layoutMode=mode();
    const glyph=LAYOUT_GLYPHS[layoutMode] || LAYOUT_GLYPHS.auto;
    trigger.dataset.scoreLayoutMode=layoutMode;
    trigger.setAttribute('aria-label','פריסת כרטיסים — '+layoutMode);
    trigger.setAttribute('title','פריסת כרטיסים');
    let icon=trigger.querySelector('.score-layout-trigger-icon');
    if(!icon){
      trigger.replaceChildren();
      icon=document.createElement('span');
      icon.className='score-layout-trigger-icon';
      trigger.appendChild(icon);
    }
    icon.textContent=glyph;
  }

  function sync(){
    syncColumns();
    updateTriggerIcon();
  }

  const observer=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList' || record.attributeName==='data-score-layout-mode')){
      requestAnimationFrame(sync);
    }
  });
  observer.observe(teams,{childList:true,attributes:true,attributeFilter:['data-score-layout-mode']});

  document.addEventListener('click',()=>setTimeout(sync,0),true);
  window.addEventListener('resize',()=>requestAnimationFrame(sync),{passive:true});
  document.querySelectorAll('#sharpBg img').forEach(img=>img.addEventListener('load',()=>requestAnimationFrame(sync),{passive:true}));

  sync();
  setTimeout(sync,250);
  setTimeout(sync,900);
  window.ScoreLayoutStability={sync,syncColumns,updateTriggerIcon,LAYOUT_GLYPHS};
})();
