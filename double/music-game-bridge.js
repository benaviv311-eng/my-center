(()=>{
  'use strict';
  const Music=window.DoubleMusic;
  const frame=document.getElementById('core');
  if(!Music||!frame) return;

  const params=new URLSearchParams(location.search);
  const mode=params.get('launch')||'classic';
  let observer=null,endObserver=null,endPlayed=false;

  function unlock(){Music.unlock()}
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,true);

  function stateFromDoc(doc){
    const stats=(doc?.getElementById('stats')?.textContent||'').replace(/\s+/g,' ');
    const timeMatch=stats.match(/⏱️\s*([0-9]+(?:\.[0-9]+)?)/);
    const combo=doc?.querySelector('.combo-pill');
    let streak=0;
    if(combo){const m=(combo.textContent||'').match(/(\d+)/);streak=m?Number(m[1]):3;}
    return {phase:'game',mode,time:timeMatch?Number(timeMatch[1]):NaN,streak,active:true};
  }
  function watchCore(doc){
    if(!doc?.body)return;
    doc.addEventListener('pointerdown',unlock,{capture:true,passive:true});
    doc.addEventListener('keydown',unlock,true);
    const sync=()=>Music.updateState(stateFromDoc(doc));
    observer?.disconnect();
    observer=new MutationObserver(sync);
    observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    sync();
  }
  frame.addEventListener('load',()=>{try{watchCore(frame.contentDocument)}catch(_){}});

  const end=document.getElementById('endOverlay');
  if(end){
    const syncEnd=()=>{
      const open=end.classList.contains('open');
      if(open&&!endPlayed){endPlayed=true;Music.updateState({phase:'end'});Music.stinger('victory');}
      if(!open&&endPlayed){endPlayed=false;Music.updateState({phase:'game',mode,time:60,streak:0,active:true});}
    };
    endObserver=new MutationObserver(syncEnd);
    endObserver.observe(end,{attributes:true,attributeFilter:['class']});
  }
})();
