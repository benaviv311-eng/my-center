(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

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

    const left=rect.left+(offsetX*scaleX);
    const top=rect.top+(offsetY*scaleY);
    const width=contentWidth*scaleX;
    const height=contentHeight*scaleY;
    return {left,top,right:left+width,bottom:top+height,width,height};
  }

  function computedTwoColumns(){
    if(teams.classList.contains('score-two-column-fit')) return true;
    const style=getComputedStyle(teams);
    const columns=(style.gridTemplateColumns||'').trim();
    if(columns && columns!=='none'){
      const tracks=columns.split(/\s+/).filter(Boolean);
      if(tracks.length===2) return true;
    }
    const count=parseInt(style.columnCount,10);
    if(count===2) return true;

    const cards=Array.from(teams.querySelectorAll(':scope > .card.score-card-professional')).filter(card=>{
      const rect=card.getBoundingClientRect();
      return rect.width>0&&rect.height>0;
    });
    if(cards.length<2) return false;
    const rects=cards.map(card=>card.getBoundingClientRect());
    const firstTop=Math.min(...rects.map(rect=>rect.top));
    return rects.filter(rect=>Math.abs(rect.top-firstTop)<=8).length===2;
  }

  function clearContainment(){
    teams.classList.remove('score-image-contained');
    teams.style.removeProperty('--score-image-width');
    teams.style.removeProperty('--score-image-left');
    teams.style.removeProperty('--score-image-shift');
  }

  function fitToImage(){
    if(!computedTwoColumns()){
      clearContainment();
      return;
    }

    const img=document.querySelector('#sharpBg img.active')||document.querySelector('#sharpBg img');
    if(!img){
      clearContainment();
      return;
    }

    const painted=visibleImageRect(img);
    const left=Math.max(4,Math.ceil(painted.left)+3);
    const right=Math.min(window.innerWidth-4,Math.floor(painted.right)-3);
    const width=Math.max(0,right-left);
    if(width<150){
      clearContainment();
      return;
    }

    teams.classList.add('score-two-column-fit','score-image-contained');
    teams.style.setProperty('--score-image-width',Math.floor(width)+'px');
    teams.style.setProperty('--score-image-left',Math.floor(left)+'px');
    teams.style.setProperty('--score-image-shift','0px');

    void teams.offsetWidth;
    const current=teams.getBoundingClientRect();
    const targetCenter=left+(width/2);
    const currentCenter=current.left+(current.width/2);
    const shift=Math.round(targetCenter-currentCenter);
    teams.style.setProperty('--score-image-shift',shift+'px');
  }

  function scheduleFit(){
    if(frame) cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      frame=requestAnimationFrame(()=>{
        frame=0;
        fitToImage();
      });
    });
  }

  scheduleFit();
  window.addEventListener('resize',scheduleFit,{passive:true});
  document.addEventListener('click',scheduleFit,true);
  document.addEventListener('change',scheduleFit,true);
  document.addEventListener('input',scheduleFit,true);
  document.querySelectorAll('#sharpBg img').forEach(img=>img.addEventListener('load',scheduleFit,{passive:true}));
})();
