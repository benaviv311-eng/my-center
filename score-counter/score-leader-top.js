(function(){
  const LEADER_TOP_PX=4;
  let banner=null;
  let scheduled=false;
  let originalParent=null;
  let originalNextSibling=null;

  const cleanText=el=>(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
  const matchesLeader=el=>{
    const text=cleanText(el);
    return /מובילה/.test(text) && /נקודות/.test(text);
  };

  function findLeaderBanner(){
    const candidates=Array.from(document.querySelectorAll('div,section,aside,header')).filter(el=>{
      if(el===document.body || el===document.documentElement) return false;
      if(!matchesLeader(el)) return false;
      return !Array.from(el.children).some(child=>matchesLeader(child));
    });
    candidates.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length);
    return candidates[0]||null;
  }

  function findLeaderVisualTop(el){
    const candidates=Array.from(el.querySelectorAll('*')).filter(node=>{
      const text=cleanText(node);
      if(!/(מובילה|נקודות)/u.test(text)) return false;
      return !Array.from(node.children).some(child=>/(מובילה|נקודות)/u.test(cleanText(child)));
    });
    const rects=candidates
      .map(node=>node.getBoundingClientRect())
      .filter(rect=>rect.width>0 && rect.height>0 && Number.isFinite(rect.top));
    if(!rects.length) return el.getBoundingClientRect().top;
    return Math.min(...rects.map(rect=>rect.top));
  }

  function restoreBanner(el){
    if(!el) return;
    const original=el.dataset.scoreLeaderOriginalStyle;
    if(original) el.setAttribute('style',original);
    else el.removeAttribute('style');

    if(originalParent && originalParent.isConnected && el.parentElement!==originalParent){
      if(originalNextSibling && originalNextSibling.parentElement===originalParent){
        originalParent.insertBefore(el,originalNextSibling);
      }else{
        originalParent.appendChild(el);
      }
    }

    delete el.dataset.scoreLeaderCeiling;
    delete el.dataset.scoreLeaderOriginalStyle;
    delete el.dataset.scoreLeaderLeft;
    delete el.dataset.scoreLeaderWidth;
    delete el.dataset.scoreLeaderVisualOffset;
    originalParent=null;
    originalNextSibling=null;
  }

  function pinLeaderBannerTop(force){
    if(!banner || !banner.isConnected) banner=findLeaderBanner();
    if(!banner) return;

    if(banner.dataset.scoreLeaderCeiling!=='1'){
      const rect=banner.getBoundingClientRect();
      banner.dataset.scoreLeaderOriginalStyle=banner.getAttribute('style')||'';
      banner.dataset.scoreLeaderCeiling='1';
      banner.dataset.scoreLeaderLeft=String(Math.max(0,Math.round(rect.left)));
      banner.dataset.scoreLeaderWidth=String(Math.max(1,Math.round(rect.width)));
      originalParent=banner.parentElement;
      originalNextSibling=banner.nextSibling;
      document.body.appendChild(banner);
    }

    const width=Math.max(1,Number(banner.dataset.scoreLeaderWidth)||banner.getBoundingClientRect().width||1);
    const savedLeft=Math.max(0,Number(banner.dataset.scoreLeaderLeft)||0);
    const left=Math.min(savedLeft,Math.max(0,window.innerWidth-width));

    banner.style.setProperty('position','fixed','important');
    banner.style.setProperty('top','0px','important');
    banner.style.setProperty('left',Math.round(left)+'px','important');
    banner.style.setProperty('right','auto','important');
    banner.style.setProperty('bottom','auto','important');
    banner.style.setProperty('margin','0','important');
    banner.style.setProperty('margin-top','0','important');
    banner.style.setProperty('transform','none','important');
    banner.style.setProperty('z-index','180','important');

    const bannerTop=banner.getBoundingClientRect().top;
    const visualTop=findLeaderVisualTop(banner);
    const visualOffset=Math.max(0,Math.round(visualTop-bannerTop));
    banner.dataset.scoreLeaderVisualOffset=String(visualOffset);
    banner.style.setProperty('top',(LEADER_TOP_PX-visualOffset)+'px','important');
  }

  function schedulePin(force){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      pinLeaderBannerTop(!!force);
    });
  }

  pinLeaderBannerTop(true);
  requestAnimationFrame(()=>pinLeaderBannerTop(true));
  window.addEventListener('resize',()=>schedulePin(true));
  document.addEventListener('click',()=>schedulePin(false),true);
  document.addEventListener('change',()=>schedulePin(false),true);
  document.addEventListener('input',()=>schedulePin(false),true);
})();
