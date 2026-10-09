(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const HEADER_GAP_PX=8;
  const FALLBACK_CARD_GAP_PX=140;
  const MIN_REMAINING_HEIGHT=72;
  let frame=0;

  const cleanText=el=>(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();

  function visibleImageRect(img){
    const rect=img.getBoundingClientRect();
    const boxWidth=img.clientWidth||0;
    const boxHeight=img.clientHeight||0;
    const naturalWidth=img.naturalWidth||0;
    const naturalHeight=img.naturalHeight||0;
    if(!boxWidth||!boxHeight||!naturalWidth||!naturalHeight) return rect;

    const style=getComputedStyle(img);
    if(style.objectFit!=='contain') return rect;

    const fit=Math.min(boxWidth/naturalWidth,boxHeight/naturalHeight);
    const contentWidth=naturalWidth*fit;
    const contentHeight=naturalHeight*fit;
    const scaleX=rect.width/boxWidth;
    const scaleY=rect.height/boxHeight;
    const offsetX=(boxWidth-contentWidth)/2;
    const offsetY=(boxHeight-contentHeight)/2;
    const left=rect.left+offsetX*scaleX;
    const top=rect.top+offsetY*scaleY;
    const width=contentWidth*scaleX;
    const height=contentHeight*scaleY;
    return {left,top,right:left+width,bottom:top+height,width,height};
  }

  function imageRect(){
    const img=document.querySelector('#sharpBg img.active')||document.querySelector('#sharpBg img');
    if(img){
      const rect=visibleImageRect(img);
      if(rect.width>0 && rect.height>0) return rect;
    }

    const stage=document.getElementById('sharpBg');
    if(stage){
      const rect=stage.getBoundingClientRect();
      if(rect.width>0 && rect.height>0) return rect;
    }

    return {left:0,top:0,right:window.innerWidth,bottom:window.innerHeight,width:window.innerWidth,height:window.innerHeight};
  }

  function smallestVisibleMatch(needle){
    const candidates=Array.from(document.querySelectorAll('h1,h2,h3,h4,p,span,strong,b,div')).filter(el=>{
      if(el===document.body || el===document.documentElement) return false;
      if(el.closest('#teams,.score-live-timer,.score-layout-menu')) return false;
      if(!cleanText(el).includes(needle)) return false;
      const rect=el.getBoundingClientRect();
      const style=getComputedStyle(el);
      return rect.width>0 && rect.height>0 && style.display!=='none' && style.visibility!=='hidden';
    });
    candidates.sort((a,b)=>{
      const childDelta=a.querySelectorAll('*').length-b.querySelectorAll('*').length;
      if(childDelta) return childDelta;
      return cleanText(a).length-cleanText(b).length;
    });
    return candidates[0]||null;
  }

  function findHeaderBottom(){
    const title=smallestVisibleMatch('TeamScore');
    const subtitle=smallestVisibleMatch('ספירת נקודות לקבוצות');
    const rects=[title,subtitle]
      .filter(Boolean)
      .map(el=>el.getBoundingClientRect())
      .filter(rect=>rect.width>0 && rect.height>0 && Number.isFinite(rect.bottom));
    if(!rects.length) return imageRect().top;
    return Math.max(...rects.map(rect=>rect.bottom));
  }

  function measureCardGap(){
    const heights=Array.from(teams.querySelectorAll(':scope > .card.score-card-professional'))
      .map(card=>card.getBoundingClientRect())
      .filter(rect=>rect.width>0 && rect.height>0)
      .map(rect=>rect.height);
    if(!heights.length) return FALLBACK_CARD_GAP_PX;
    return Math.max(...heights);
  }

  function managedLayoutActive(){
    return teams.classList.contains('score-layout-managed') || teams.classList.contains('score-layout-free');
  }

  function projectionModeActive(){
    return document.body.classList.contains('projection-mode');
  }

  function applyLowerLayoutStart(){
    if(!managedLayoutActive()) return;

    const image=imageRect();
    const headerBottom=findHeaderBottom();
    const cardGap=measureCardGap();
    const target=headerBottom + cardGap + HEADER_GAP_PX;
    const minimumTop=Math.max(image.top,target);
    const maxTop=Math.max(image.top,image.bottom-MIN_REMAINING_HEIGHT);
    const top=Math.round(Math.min(minimumTop,maxTop));
    const height=Math.max(MIN_REMAINING_HEIGHT,Math.round(image.bottom-top));

    teams.style.setProperty('--score-layout-top',top+'px');
    teams.style.setProperty('--score-layout-height',height+'px');
    teams.dataset.scoreLayoutStartSource='header-plus-card';
    teams.dataset.scoreLayoutHeaderBottom=String(Math.round(headerBottom));
    teams.dataset.scoreLayoutCardGap=String(Math.round(cardGap));
    teams.dataset.scoreLayoutProjection=projectionModeActive()?'1':'0';
  }

  function scheduleLowerLayoutStart(){
    if(frame) cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      frame=requestAnimationFrame(()=>{
        frame=0;
        applyLowerLayoutStart();
      });
    });
  }

  const layoutObserver=new MutationObserver(()=>scheduleLowerLayoutStart());
  layoutObserver.observe(teams,{attributes:true,attributeFilter:['data-score-layout-mode','class'],childList:true});

  const projectionObserver=new MutationObserver(()=>scheduleLowerLayoutStart());
  projectionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});

  document.querySelectorAll('#sharpBg img').forEach(img=>{
    img.addEventListener('load',scheduleLowerLayoutStart,{passive:true});
  });

  window.addEventListener('resize',scheduleLowerLayoutStart,{passive:true});
  document.addEventListener('click',scheduleLowerLayoutStart,true);
  document.addEventListener('change',scheduleLowerLayoutStart,true);
  document.addEventListener('scorecards:autoarrange',scheduleLowerLayoutStart);

  applyLowerLayoutStart();
  requestAnimationFrame(scheduleLowerLayoutStart);
  setTimeout(scheduleLowerLayoutStart,120);
  setTimeout(scheduleLowerLayoutStart,350);
  setTimeout(scheduleLowerLayoutStart,900);
})();
