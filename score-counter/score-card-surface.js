(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const CARD_MEGA_BOTTOM_GAP_PX=6;
  let frame=0;

  const cards=()=>Array.from(teams.querySelectorAll(':scope > .card.score-card-professional'));

  function rgbSamples(text){
    const result=[];
    const source=String(text||'');
    for(const match of source.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)/gi)){
      result.push({
        r:Number(match[1]),
        g:Number(match[2]),
        b:Number(match[3]),
        a:match[4]===undefined?1:Number(match[4])
      });
    }
    return result;
  }

  function colorStrength({r,g,b,a}){
    if(a<=0.05) return -1;
    const max=Math.max(r,g,b);
    const min=Math.min(r,g,b);
    const chroma=max-min;
    const brightness=(r+g+b)/3;
    if(chroma<18 || brightness<28) return -1;
    return chroma*3 + max + a*30;
  }

  function teamColorFromButton(button){
    if(!button) return null;
    const style=getComputedStyle(button);
    const direct=rgbSamples(style.backgroundColor).filter(sample=>colorStrength(sample)>=0);
    if(direct.length) return direct.sort((a,b)=>colorStrength(b)-colorStrength(a))[0];

    const sample=[
      style.backgroundImage,
      style.borderTopColor,
      style.borderRightColor,
      style.boxShadow,
      button.getAttribute('style')||''
    ].join(' ');
    const colors=rgbSamples(sample).filter(color=>colorStrength(color)>=0);
    if(!colors.length) return null;
    colors.sort((a,b)=>colorStrength(b)-colorStrength(a));
    return colors[0];
  }

  function markTeamColorCards(){
    cards().forEach(card=>{
      const plus=card.querySelector('.score-board-plus');
      const color=teamColorFromButton(plus);
      if(!color){
        card.classList.remove('score-card-team-tint');
        card.style.removeProperty('--score-team-rgb');
        return;
      }
      card.style.setProperty('--score-team-rgb',`${color.r}, ${color.g}, ${color.b}`);
      card.classList.add('score-card-team-tint');
    });
  }

  function tightenCardsToMega(){
    cards().forEach(card=>{
      const mega=card.querySelector('.score-card-mega');
      if(!mega){
        card.style.removeProperty('--score-card-tight-height');
        return;
      }

      const megaVisual=mega.querySelector('button')||mega;
      const cardRect=card.getBoundingClientRect();
      const megaRect=megaVisual.getBoundingClientRect();
      if(!(cardRect.height>0) || !(megaRect.height>0)) return;

      const contentBottom=Math.max(0,megaRect.bottom-cardRect.top);
      const tightHeight=Math.ceil(contentBottom+CARD_MEGA_BOTTOM_GAP_PX);
      card.style.setProperty('--score-card-tight-height',tightHeight+'px');
    });
  }

  function refreshCardSurface(){
    markTeamColorCards();
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
