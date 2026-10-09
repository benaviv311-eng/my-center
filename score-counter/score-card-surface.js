(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const CARD_MEGA_BOTTOM_GAP_PX=6;
  const TINT_LIGHTEN=0.46;
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

  function bestColorFromStyle(style,inlineText){
    if(!style) return null;
    const text=[
      style.backgroundColor,
      style.backgroundImage,
      style.borderTopColor,
      style.borderRightColor,
      style.borderBottomColor,
      style.borderLeftColor,
      style.outlineColor,
      style.boxShadow,
      inlineText||''
    ].join(' ');
    const colors=rgbSamples(text).filter(color=>colorStrength(color)>=0);
    if(!colors.length) return null;
    colors.sort((a,b)=>colorStrength(b)-colorStrength(a));
    return colors[0];
  }

  function teamColorFromButton(button){
    if(!button) return null;
    return bestColorFromStyle(getComputedStyle(button),button.getAttribute('style')||'');
  }

  function findTeamStripeColor(card){
    const cardRect=card.getBoundingClientRect();
    if(!(cardRect.width>0) || !(cardRect.height>0)) return null;

    const pseudoColors=['::before','::after']
      .map(pseudo=>bestColorFromStyle(getComputedStyle(card,pseudo),''))
      .filter(Boolean)
      .sort((a,b)=>colorStrength(b)-colorStrength(a));
    if(pseudoColors.length) return pseudoColors[0];

    const cardStyle=bestColorFromStyle({
      backgroundColor:'transparent',
      backgroundImage:'none',
      borderTopColor:getComputedStyle(card).borderTopColor,
      borderRightColor:'transparent',
      borderBottomColor:'transparent',
      borderLeftColor:'transparent',
      outlineColor:'transparent',
      boxShadow:'none'
    },'');
    if(cardStyle) return cardStyle;

    let best=null;
    let bestScore=-Infinity;
    const ignored='.score-board-row,.score-card-mega,.score-card-menu,.score-card-menu-toggle,.score-rank-outside,.score-board-source-host';
    Array.from(card.querySelectorAll('*')).forEach(el=>{
      if(el.closest(ignored)) return;
      const rect=el.getBoundingClientRect();
      if(!(rect.width>0) || !(rect.height>0)) return;
      if(rect.width<cardRect.width*0.5) return;
      if(rect.height<2 || rect.height>20) return;
      if(rect.top<cardRect.top-3 || rect.top>cardRect.top+72) return;
      const color=bestColorFromStyle(getComputedStyle(el),el.getAttribute('style')||'');
      if(!color) return;
      const score=colorStrength(color)+(rect.width/cardRect.width)*120-Math.max(0,rect.top-cardRect.top)*0.6;
      if(score>bestScore){
        bestScore=score;
        best=color;
      }
    });
    return best;
  }

  function teamColorFromCard(card){
    const plus=card.querySelector('.score-board-plus');
    return teamColorFromButton(plus) || findTeamStripeColor(card);
  }

  function mixWithWhite(color,amount){
    const mix=Math.max(0,Math.min(1,Number(amount)||0));
    return {
      r:Math.round(color.r+(255-color.r)*mix),
      g:Math.round(color.g+(255-color.g)*mix),
      b:Math.round(color.b+(255-color.b)*mix)
    };
  }

  function markTeamColorCards(){
    cards().forEach(card=>{
      const color=teamColorFromCard(card);
      if(!color) return;

      const light=mixWithWhite(color,TINT_LIGHTEN);
      const baseRgb=`${color.r}, ${color.g}, ${color.b}`;
      const lightRgb=`${light.r}, ${light.g}, ${light.b}`;
      const background=`linear-gradient(180deg, rgba(${lightRgb}, 0.34), rgba(${lightRgb}, 0.24))`;

      card.style.setProperty('--score-team-rgb',baseRgb);
      card.style.setProperty('--score-team-light-rgb',lightRgb);
      card.style.setProperty('background',background,'important');
      card.style.setProperty('border-color',`rgba(${lightRgb}, 0.48)`,'important');
      card.style.setProperty('box-shadow','0 8px 24px rgba(0,0,0,0.12)','important');
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
  setTimeout(scheduleRefresh,100);
  setTimeout(scheduleRefresh,350);
  setTimeout(scheduleRefresh,900);
  window.addEventListener('resize',scheduleRefresh,{passive:true});
  document.addEventListener('click',scheduleRefresh,true);
  document.addEventListener('change',scheduleRefresh,true);
  document.addEventListener('input',scheduleRefresh,true);
})();
