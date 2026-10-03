(()=>{
  'use strict';
  const Music=window.DoubleMusic;
  const gameFrame=document.getElementById('gameFrame');
  if(!Music||!gameFrame) return;

  let coreObserver=null,endObserver=null,endPlayed=false;

  function currentMode(){
    try{return new URL(gameFrame.src,location.href).searchParams.get('launch')||'classic'}catch(_){return 'classic'}
  }
  function parseState(doc){
    const stats=(doc?.getElementById('stats')?.textContent||'').replace(/\s+/g,' ');
    const tm=stats.match(/⏱️\s*([0-9]+(?:\.[0-9]+)?)/);
    const combo=doc?.querySelector('.combo-pill');
    let streak=0;
    if(combo){const m=(combo.textContent||'').match(/(\d+)/);streak=m?Number(m[1]):3;}
    return {phase:'game',mode:currentMode(),time:tm?Number(tm[1]):NaN,streak,active:true};
  }
  function watchCore(doc){
    if(!doc?.body)return;
    const sync=()=>Music.updateState(parseState(doc));
    coreObserver?.disconnect();
    coreObserver=new MutationObserver(sync);
    coreObserver.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    doc.addEventListener('pointerdown',()=>Music.unlock(),{capture:true,passive:true});
    sync();
  }
  function attachWrapper(){
    let wrapper;
    try{wrapper=gameFrame.contentDocument}catch(_){return}
    if(!wrapper?.body)return;
    const core=wrapper.getElementById('core');
    const end=wrapper.getElementById('endOverlay');
    if(core){
      core.addEventListener('load',()=>{try{watchCore(core.contentDocument)}catch(_){}},{once:false});
      try{if(core.contentDocument?.body)watchCore(core.contentDocument)}catch(_){}
    }
    endObserver?.disconnect();
    endPlayed=false;
    if(end){
      const syncEnd=()=>{
        const open=end.classList.contains('open');
        if(open&&!endPlayed){endPlayed=true;Music.updateState({phase:'end'});Music.stinger('victory');}
        if(!open&&endPlayed){endPlayed=false;Music.updateState({phase:'game',mode:currentMode(),time:60,streak:0,active:true});}
      };
      endObserver=new MutationObserver(syncEnd);
      endObserver.observe(end,{attributes:true,attributeFilter:['class']});
    }
  }

  document.addEventListener('click',event=>{
    const btn=event.target?.closest?.('[data-sound="music"]');
    if(!btn)return;
    setTimeout(()=>{
      if(Music.isEnabled()){
        Music.unlock();
        Music.preview?.();
      }
    },0);
  });

  document.getElementById('playSelected')?.addEventListener('click',()=>{Music.unlock();Music.setScene('play')});
  document.getElementById('gameClose')?.addEventListener('click',()=>{coreObserver?.disconnect();endObserver?.disconnect();Music.setScene('lobby');Music.unlock()});
  gameFrame.addEventListener('load',()=>{if(gameFrame.src&&gameFrame.src!=='about:blank')attachWrapper()});
})();
