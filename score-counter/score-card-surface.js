(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const CARD_MEGA_BOTTOM_GAP_PX=38;
  let frame=0;

  const cards=()=>Array.from(teams.querySelectorAll(':scope > .card.score-card-professional'));

  function rgbSamples(text){
    const result=[];
    const source=String(text||'');
    for(const match of source.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)/gi)){
      result.push({r:Number(match[1]),g:Number(match[2]),b:Number(match[3]),a:match[4]===undefined?1:Number(match[4])});
    }
    return result;
  }

  function isBluePlusButton(button){
    if(!button) return false;
    const style=getComputedStyle(button);
    const sample=[
      style.backgroundColor,
      style.backgroundImage,
      style.borderTopColor,
      style.borderRightColor,
      style.boxShadow,
      button.getAttribute('style')||''
    ].join(' ');

    return rgbSamples(sample).some(({r,g,b,a})=>
      a>0.05 && b>=145 && b>=r+28 && b>=g+10
    );
  }

  function markBlueTeamCards(){
    cards().forEach(card=>{
      const plus=card.querySelector('.score-board-plus');
      card.classList.toggle('score-card-tint-blue',isBluePlusButton(plus));
    });
  }

  function tightenCardsToMega(){
    cards().forEach(card=>{
      const mega=card.querySelector('.score-card-mega');
      if(!mega){
        card.style.removeProperty('--score-card-tight-height');
        return;
      }

      const cardRect=card.getBoundingClientRect();
      const megaRect=mega.getBoundingClientRect();
      if(!(cardRect.height>0) || !(megaRect.height>0)) return;

      const contentBottom=Math.max(0,megaRect.bottom-cardRect.top);
      const tightHeight=Math.ceil(contentBottom+CARD_MEGA_BOTTOM_GAP_PX);
      card.style.setProperty('--score-card-tight-height',tightHeight+'px');
    });
  }

  function refreshCardSurface(){
    markBlueTeamCards();
    tightenCardsToMega();
  }

  function scheduleRefresh(){
    if(frame) cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      frame=0;
      refreshCardSurface();
    });
  }

  refreshCardSurface();
  requestAnimationFrame(refreshCardSurface);
  setTimeout(scheduleRefresh,200);
  setTimeout(scheduleRefresh,800);
  window.addEventListener('resize',scheduleRefresh,{passive:true});
  document.addEventListener('click',scheduleRefresh,true);
  document.addEventListener('change',scheduleRefresh,true);
  document.addEventListener('input',scheduleRefresh,true);
})();
