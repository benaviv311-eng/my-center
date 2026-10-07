(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const TIMER_STORAGE_KEY='score-live-timer-layout-v1';
  const TIMER_MIN_SCALE=0.65;
  const TIMER_MAX_SCALE=2.2;
  const EDGE=8;

  function restoreLayoutChoice(){
    teams.classList.remove('score-final-column');
  }

  restoreLayoutChoice();
  const layoutObserver=new MutationObserver(()=>restoreLayoutChoice());
  layoutObserver.observe(teams,{attributes:true,attributeFilter:['class'],childList:true});

  function scoreText(value){
    const text=String(value ?? '0').trim();
    return text || '0';
  }

  function syncScoreBoxWidths(){
    document.querySelectorAll('.score-board-value').forEach(input=>{
      const text=scoreText(input.value);
      const fontSize=parseFloat(getComputedStyle(input).fontSize)||58;
      const digitCount=Math.max(1,text.length);
      const width=Math.ceil(Math.max(fontSize*.82,digitCount*fontSize*.62+12));
      input.style.setProperty('--score-width',width+'px');
      input.style.setProperty('--score-digits',String(digitCount));
    });
  }

  syncScoreBoxWidths();
  document.addEventListener('input',e=>{
    if(e.target && e.target.matches && e.target.matches('.score-board-value')) syncScoreBoxWidths();
  },true);
  document.addEventListener('change',e=>{
    if(e.target && e.target.matches && e.target.matches('.score-board-value')) syncScoreBoxWidths();
  },true);
  document.addEventListener('click',()=>requestAnimationFrame(syncScoreBoxWidths),true);
  const scoreObserver=new MutationObserver(()=>requestAnimationFrame(syncScoreBoxWidths));
  scoreObserver.observe(teams,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value']});

  function readTimerLayout(){
    try{
      const saved=JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY)||'null');
      if(!saved || typeof saved!=='object') return null;
      const x=Number(saved.x), y=Number(saved.y), scale=Number(saved.scale);
      if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(scale)) return null;
      return {x,y,scale:Math.min(TIMER_MAX_SCALE,Math.max(TIMER_MIN_SCALE,scale))};
    }catch{return null;}
  }

  function saveTimerLayout(layout){
    try{localStorage.setItem(TIMER_STORAGE_KEY,JSON.stringify(layout));}catch{}
  }

  function clampTimerPosition(bar,x,y,scale){
    const baseWidth=Math.max(1,bar.offsetWidth);
    const baseHeight=Math.max(1,bar.offsetHeight);
    const width=baseWidth*scale;
    const height=baseHeight*scale;
    return {
      x:Math.min(Math.max(EDGE,x),Math.max(EDGE,window.innerWidth-width-EDGE)),
      y:Math.min(Math.max(EDGE,y),Math.max(EDGE,window.innerHeight-height-EDGE))
    };
  }

  function applyTimerLayout(bar,state,persist){
    state.scale=Math.min(TIMER_MAX_SCALE,Math.max(TIMER_MIN_SCALE,Number(state.scale)||1));
    const next=clampTimerPosition(bar,Number(state.x)||0,Number(state.y)||0,state.scale);
    state.x=Math.round(next.x);
    state.y=Math.round(next.y);
    bar.style.setProperty('--timer-x',state.x+'px');
    bar.style.setProperty('--timer-y',state.y+'px');
    bar.style.setProperty('--timer-scale',state.scale.toFixed(3));
    bar.dataset.freeLayout='1';
    if(persist) saveTimerLayout(state);
  }

  function bindTimer(){
    const bar=document.querySelector('.score-live-timer');
    if(!bar || bar.dataset.freeTimerReady==='1') return;
    bar.dataset.freeTimerReady='1';

    const initialRect=bar.getBoundingClientRect();
    const saved=readTimerLayout();
    const state=saved || {x:initialRect.left,y:initialRect.top,scale:1};

    const moveHandle=document.createElement('button');
    moveHandle.type='button';
    moveHandle.className='score-timer-move-handle';
    moveHandle.setAttribute('aria-label','גרירת הטיימר');
    moveHandle.setAttribute('title','גרור כדי להזיז את הטיימר');
    moveHandle.textContent='⠿';

    const resizeHandle=document.createElement('button');
    resizeHandle.type='button';
    resizeHandle.className='score-timer-resize-handle';
    resizeHandle.setAttribute('aria-label','שינוי גודל הטיימר');
    resizeHandle.setAttribute('title','גרור כדי להגדיל או להקטין את הטיימר');
    resizeHandle.textContent='↘';

    bar.prepend(moveHandle);
    bar.appendChild(resizeHandle);
    applyTimerLayout(bar,state,false);

    let dragPointer=null;
    let dragStartX=0,dragStartY=0,dragBaseX=0,dragBaseY=0;
    moveHandle.addEventListener('pointerdown',e=>{
      if(e.button!==undefined && e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      dragPointer=e.pointerId;
      dragStartX=e.clientX;
      dragStartY=e.clientY;
      dragBaseX=state.x;
      dragBaseY=state.y;
      try{moveHandle.setPointerCapture(dragPointer);}catch{}
      bar.classList.add('score-timer-moving');
    });
    moveHandle.addEventListener('pointermove',e=>{
      if(e.pointerId!==dragPointer) return;
      e.preventDefault();
      state.x=dragBaseX+(e.clientX-dragStartX);
      state.y=dragBaseY+(e.clientY-dragStartY);
      applyTimerLayout(bar,state,false);
    });
    const finishMove=e=>{
      if(dragPointer===null || (e && e.pointerId!==dragPointer)) return;
      try{moveHandle.releasePointerCapture(dragPointer);}catch{}
      dragPointer=null;
      bar.classList.remove('score-timer-moving');
      applyTimerLayout(bar,state,true);
    };
    moveHandle.addEventListener('pointerup',finishMove);
    moveHandle.addEventListener('pointercancel',finishMove);

    let resizePointer=null;
    let resizeStartX=0,resizeStartY=0,resizeBaseScale=1;
    resizeHandle.addEventListener('pointerdown',e=>{
      if(e.button!==undefined && e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      resizePointer=e.pointerId;
      resizeStartX=e.clientX;
      resizeStartY=e.clientY;
      resizeBaseScale=state.scale;
      try{resizeHandle.setPointerCapture(resizePointer);}catch{}
      bar.classList.add('score-timer-resizing');
    });
    resizeHandle.addEventListener('pointermove',e=>{
      if(e.pointerId!==resizePointer) return;
      e.preventDefault();
      const delta=Math.max(e.clientX-resizeStartX,e.clientY-resizeStartY);
      state.scale=resizeBaseScale+(delta/180);
      applyTimerLayout(bar,state,false);
    });
    const finishResize=e=>{
      if(resizePointer===null || (e && e.pointerId!==resizePointer)) return;
      try{resizeHandle.releasePointerCapture(resizePointer);}catch{}
      resizePointer=null;
      bar.classList.remove('score-timer-resizing');
      applyTimerLayout(bar,state,true);
    };
    resizeHandle.addEventListener('pointerup',finishResize);
    resizeHandle.addEventListener('pointercancel',finishResize);

    window.addEventListener('resize',()=>applyTimerLayout(bar,state,true));
  }

  bindTimer();
  const timerObserver=new MutationObserver(bindTimer);
  timerObserver.observe(document.body,{childList:true,subtree:true});
})();
