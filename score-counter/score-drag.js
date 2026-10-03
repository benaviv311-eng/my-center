(function(){
  const DRAG_STORAGE_KEY='team-score-card-positions-v1';
  const LONG_PRESS_MS=450;
  const MOVE_CANCEL_PX=12;
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
  const isInteractive=target=>!!target.closest('button,input,select,textarea,a,label,[contenteditable="true"]');
  const transform=(card,x,y)=>{
    card.dataset.dragX=String(Math.round(x));
    card.dataset.dragY=String(Math.round(y));
    const scale=Math.max(.55,Math.min(1.6,Number(card.dataset.scoreScale)||1));
    card.setAttribute('data-score-scale',String(scale));
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
    let startClientX=0,startClientY=0;
    let baseX=0,baseY=0;
    let baseRect=null;
    let pointerId=null;

    function arm(clientX,clientY){
      clearTimeout(pressTimer);
      active=false;
      startClientX=clientX;
      startClientY=clientY;
      pressTimer=setTimeout(()=>{
        pressTimer=null;
        active=true;
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
    function move(clientX,clientY,prevent){
      const dx=clientX-startClientX,dy=clientY-startClientY;
      if(!active){
        if(Math.hypot(dx,dy)>MOVE_CANCEL_PX) cancelArm();
        return;
      }
      if(prevent) prevent();
      if(!baseRect) return;
      const visibleWidth=Math.min(baseRect.width,window.innerWidth-EDGE*2);
      const visibleHeight=Math.min(baseRect.height,window.innerHeight-EDGE*2);
      const maxLeft=Math.max(EDGE,window.innerWidth-visibleWidth-EDGE);
      const maxTop=Math.max(EDGE,window.innerHeight-visibleHeight-EDGE);
      const wantedLeft=baseRect.left+dx;
      const wantedTop=baseRect.top+dy;
      const left=Math.min(maxLeft,Math.max(EDGE,wantedLeft));
      const top=Math.min(maxTop,Math.max(EDGE,wantedTop));
      transform(card,baseX+(left-baseRect.left),baseY+(top-baseRect.top));
    }
    function finish(){
      cancelArm();
      if(active){
        positions[mode()][id]={
          x:Number(card.dataset.dragX)||0,
          y:Number(card.dataset.dragY)||0
        };
        persist();
      }
      if(pointerId!==null && card.releasePointerCapture){try{card.releasePointerCapture(pointerId);}catch{}}
      active=false;
      baseRect=null;
      card.classList.remove('score-card-dragging');
      document.body.classList.remove('score-card-dragging');
    }

    card.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch' || isInteractive(e.target)) return;
      if(e.button!==undefined && e.button!==0) return;
      pointerId=e.pointerId;
      arm(e.clientX,e.clientY);
    });
    card.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch' || pointerId!==e.pointerId) return;
      move(e.clientX,e.clientY,()=>e.preventDefault());
    });
    card.addEventListener('pointerup',e=>{
      if(e.pointerType==='touch' || pointerId!==e.pointerId) return;
      finish();
      pointerId=null;
    });
    card.addEventListener('pointercancel',e=>{
      if(e.pointerType==='touch' || pointerId!==e.pointerId) return;
      finish();
      pointerId=null;
    });
    card.addEventListener('pointerleave',e=>{
      if(e.pointerType!=='touch' && !active) cancelArm();
    });

    card.addEventListener('touchstart',e=>{
      if(e.touches.length!==1 || isInteractive(e.target)) return;
      const t=e.touches[0];
      arm(t.clientX,t.clientY);
    },{passive:true});
    card.addEventListener('touchmove',e=>{
      if(e.touches.length!==1){cancelArm();return;}
      const t=e.touches[0];
      move(t.clientX,t.clientY,()=>e.preventDefault());
    },{passive:false});
    card.addEventListener('touchend',finish,{passive:true});
    card.addEventListener('touchcancel',finish,{passive:true});
    card.addEventListener('contextmenu',e=>{
      if(card.classList.contains('score-card-dragging')) e.preventDefault();
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
    line.innerHTML='<div class="setting-copy"><strong>מיקום כרטיסי הניקוד</strong><span>לחיצה ארוכה על כרטיס קבוצה ואז גרירה לכל מקום במסך.</span></div><div class="setting-control"><button type="button" class="btn ghost" id="scoreDragReset">↺ איפוס מיקום הכרטיסים</button></div>';
    actions.before(line);
    document.getElementById('scoreDragReset').addEventListener('click',()=>{
      positions={normal:{},projection:{}};
      persist();
      teams.querySelectorAll(':scope > .card').forEach(card=>{
        transform(card,0,0);
      });
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
