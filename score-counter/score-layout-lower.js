(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const LAYOUT_START_RATIO=0.75;
  const MIN_REMAINING_HEIGHT=72;
  let frame=0;

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

  function managedLayoutActive(){
    return teams.classList.contains('score-layout-managed') || teams.classList.contains('score-layout-free');
  }

  function projectionModeActive(){
    return document.body.classList.contains('projection-mode');
  }

  function applyLowerLayoutStart(){
    if(!managedLayoutActive()) return;

    const image=imageRect();
    const target=image.top+(image.height*LAYOUT_START_RATIO);
    const maxTop=Math.max(image.top,image.bottom-MIN_REMAINING_HEIGHT);
    const top=Math.round(Math.min(Math.max(image.top,target),maxTop));
    const height=Math.max(MIN_REMAINING_HEIGHT,Math.round(image.bottom-top));

    teams.style.setProperty('--score-layout-top',top+'px');
    teams.style.setProperty('--score-layout-height',height+'px');
    teams.dataset.scoreLayoutStartRatio=String(LAYOUT_START_RATIO);
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
  layoutObserver.observe(teams,{attributes:true,attributeFilter:['data-score-layout-mode','class']});

  const projectionObserver=new MutationObserver(()=>scheduleLowerLayoutStart());
  projectionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});

  document.querySelectorAll('#sharpBg img').forEach(img=>{
    img.addEventListener('load',scheduleLowerLayoutStart,{passive:true});
  });

  window.addEventListener('resize',scheduleLowerLayoutStart,{passive:true});
  document.addEventListener('click',scheduleLowerLayoutStart,true);
  document.addEventListener('scorecards:autoarrange',scheduleLowerLayoutStart);

  applyLowerLayoutStart();
  requestAnimationFrame(scheduleLowerLayoutStart);
  setTimeout(scheduleLowerLayoutStart,200);
  setTimeout(scheduleLowerLayoutStart,800);
})();
