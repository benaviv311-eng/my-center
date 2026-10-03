(function(){
  const DRAG_STORAGE_KEY='team-score-card-positions-v1';
  const LONG_PRESS_MS=380;
  const MOVE_CANCEL_PX=28;
  const EDGE=8;
  const teams=document.getElementById('teams');
  if(!teams) return;

  let positions={normal:{},projection:{}};
  try{
    const saved=JSON.parse(localStorage.getItem(DRAG_STORAGE_KEY)||'{}');
    positions={
      normal:saved && saved.normal && typeof saved.normal==='object' ? saved.normal : {},
      projection:saved && saved.projection && typeof saved.projection==='object' ? saved.projection : {}
    };
  }catch{}

  const mode=()=>document.body.classList.contains('projection-mode')?'projection':'normal';
  const persist=()=>{try{localStorage.setItem(DRAG_STORAGE_KEY,JSON.stringify(positions));}catch{}};
  const isResizeHandle=target=>!!(target && target.closest && target.closest('.score-resize-handle,.score-size-menu'));
  const transform=(card,x,y)=>{
    const scale=Math.min(1.6,Math.max(0.55,Number(card.dataset.scoreScale)||1));
    card.dataset.dragX=String(Math.round(x));
    card.dataset.dragY=String(Math.round(y));
    card.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0) scale('+scale.toFixed(3)+')';
  };
  const readPos=(card,id)=>{
    const saved=positions[mode()][id]||{};
    const x=Number.isFinite(Number(saved.x))?Number(saved.x):0;
    const y=Number.isFinite(Number(saved.y))?Number(saved.y):0;
    transform(card,x,y);
  };

  function bindCard(card,id){
    if(!id || card.getAttribute('data-score-drag-ready')==='1') return;
    card.setAttribute('data-score-drag-ready','1');
    card.dataset.dragTeamId=id;
    readPos(card,id);

    let pressTimer=null;
    let active=false;
    let moved=false;
    let suppressNextClick=false;
    let startClientX=0,startClientY=0;
    let latestClientX=0,latestClientY=0;
    let baseX=0,baseY=0;
    let baseRect=null;
    let pointerId=null;

    function arm(clientX,clientY,nextPointerId){
      clearTimeout(pressTimer);
      active=false;
      moved=false;
      pointerId=nextPointerId;
      startClientX=clientX;
      startClientY=clientY;
      latestClientX=clientX;
      latestClientY=clientY;
      pressTimer=setTimeout(()=>{
        pressTimer=null;
        active=true;
        startClientX=latestClientX;
        startClientY=latestClientY;
        baseX=Number(card.dataset.dragX)||0;
        baseY=Number(card.dataset.dragY)||0;
        baseRect=card.getBoundingClientRect();
        card.classList.add('score-card-dragging');
        document.body.classList.add('score-card-dragging');
        if(pointerId!==null && card.setPointerCapture){try{card.setPointerCapture(pointerId);}catch{}}
        if(navigator.vibrate){try{navigator.vibrate(18);}catch{}}
      },LONG_PRESS_MS);
    }

    function cancelArm(){
      if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}
    }

    function move(clientX,clientY,event){
      latestClientX=clientX;
      latestClientY=clientY;
      if(!active){
        if(Math.hypot(clientX-startClientX,clientY-startClientY)>MOVE_CANCEL_PX) cancelArm();
        return;
      }
      if(event && event.cancelable) event.preventDefault();
      const dx=clientX-startClientX;
      const dy=clientY-startClientY;
      if(Math.abs(dx)>2 || Math.abs(dy)>2) moved=true;
      if(!baseRect) return;
      const visibleWidth=Math.min(baseRect.width,Math.max(1,window.innerWidth-EDGE*2));
      const visibleHeight=Math.min(baseRect.height,Math.max(1,window.innerHeight-EDGE*2));
      const maxLeft=Math.max(EDGE,window.innerWidth-visibleWidth-EDGE);
      const maxTop=Math.max(EDGE,window.innerHeight-visibleHeight-EDGE);
      const wantedLeft=baseRect.left+dx;
      const wantedTop=baseRect.top+dy;
      const left=Math.min(maxLeft,Math.max(EDGE,wantedLeft));
      const top=Math.min(maxTop,Math.max(EDGE,wantedTop));
      transform(card,baseX+(left-baseRect.left),baseY+(top-baseRect.top));
    }

    function finish(e){
      cancelArm();
      if(active){
        positions[mode()][id]={
          x:Number(card.dataset.dragX)||0,
          y:Number(card.dataset.dragY)||0
        };
        persist();
        suppressNextClick=true;
        if(e && e.cancelable) e.preventDefault();
      }
      if(pointerId!==null && card.releasePointerCapture){try{card.releasePointerCapture(pointerId);}catch{}}
      active=false;
      moved=false;
      baseRect=null;
      pointerId=null;
      card.classList.remove('score-card-dragging');
      document.body.classList.remove('score-card-dragging');
    }

    card.addEventListener('pointerdown',e=>{
      if(isResizeHandle(e.target)) return;
      if(e.button!==undefined && e.button!==0) return;
      arm(e.clientX,e.clientY,e.pointerId);
    });

    card.addEventListener('pointermove',e=>{
      if(pointerId!==e.pointerId) return;
      move(e.clientX,e.clientY,e);
    });

    card.addEventListener('pointerup',e=>{
      if(pointerId!==e.pointerId) return;
      finish(e);
    });

    card.addEventListener('pointercancel',e=>{
      if(pointerId!==e.pointerId) return;
      finish(e);
    });

    card.addEventListener('pointerleave',e=>{
      if(pointerId===e.pointerId && !active) cancelArm();
    });

    card.addEventListener('click',e=>{
      if(!suppressNextClick) return;
      suppressNextClick=false;
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);

    card.addEventListener('contextmenu',e=>{
      if(active || card.classList.contains('score-card-dragging')) e.preventDefault();
    });
  }

  function attachCards(){
    teams.querySelectorAll(':scope > .card').forEach(card=>{
      const id=card.querySelector('.delete-team')?.dataset.teamId || card.dataset.dragTeamId;
      if(id) bindCard(card,id);
    });
  }

  function addResetControl(){
    const form=document.getElementById('settingsForm');
    if(!form || document.getElementById('scoreDragReset')) return;
    const actions=form.querySelector('.dialog-actions');
    if(!actions) return;
    const line=document.createElement('div');
    line.className='setting-line';
    line.innerHTML='<div class="setting-copy"><strong>מיקום כרטיסי הניקוד</strong><span>לחיצה ארוכה על כל מקום בכרטיס ואז גרירה באותה לחיצה — גם מעל המספר או הכפתורים.</span></div><div class="setting-control"><button type="button" class="btn ghost" id="scoreDragReset">↺ איפוס מיקום הכרטיסים</button></div>';
    actions.before(line);
    document.getElementById('scoreDragReset').addEventListener('click',()=>{
      positions={normal:{},projection:{}};
      persist();
      teams.querySelectorAll(':scope > .card').forEach(card=>transform(card,0,0));
    });
  }

  window.addEventListener('scorecards:autoarrange',()=>{
    positions[mode()]={};
    persist();
    teams.querySelectorAll(':scope > .card').forEach(card=>transform(card,0,0));
  });

  const observer=new MutationObserver(()=>requestAnimationFrame(attachCards));
  observer.observe(teams,{childList:true});
  addResetControl();
  attachCards();
})();
