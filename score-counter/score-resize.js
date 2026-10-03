(function(){
  const SIZE_STORAGE_KEY='team-score-card-sizes-v1';
  const DRAG_STORAGE_KEY='team-score-card-positions-v1';
  const MIN_SCALE=0.55;
  const MAX_SCALE=1.6;
  const RESIZE_CORNER='bottom-left';
  const PRESET_SCALES=[0.7,0.85,1,1.2,1.4];
  const teams=document.getElementById('teams');
  if(!teams) return;

  let sizes={normal:{},projection:{}};
  try{
    const saved=JSON.parse(localStorage.getItem(SIZE_STORAGE_KEY)||'{}');
    sizes={
      normal:saved && saved.normal && typeof saved.normal==='object' ? saved.normal : {},
      projection:saved && saved.projection && typeof saved.projection==='object' ? saved.projection : {}
    };
  }catch{}

  const mode=()=>document.body.classList.contains('projection-mode')?'projection':'normal';
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const persist=()=>{try{localStorage.setItem(SIZE_STORAGE_KEY,JSON.stringify(sizes));}catch{}};
  const cardId=card=>card.querySelector('.delete-team')?.dataset.teamId || card.dataset.dragTeamId || '';
  const scaleOf=card=>clamp(Number(card.dataset.scoreScale)||1,MIN_SCALE,MAX_SCALE);

  function applyTransform(card){
    const x=Number(card.dataset.dragX)||0;
    const y=Number(card.dataset.dragY)||0;
    const scale=scaleOf(card);
    card.dataset.scoreScale=String(scale);
    card.style.setProperty('--score-resize-inverse',(1/scale).toFixed(4));
    card.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0) scale('+scale.toFixed(3)+')';
  }

  function updateResizeValue(card){
    const value=card.querySelector('.score-resize-value');
    if(value) value.textContent=Math.round(scaleOf(card)*100)+'%';
    card.querySelectorAll('.score-size-option').forEach(button=>{
      const preset=Number(button.dataset.scorePreset);
      button.classList.toggle('active',Math.abs(preset-scaleOf(card))<0.005);
    });
  }

  function applyScale(card,id,scale){
    const next=clamp(Number(scale)||1,MIN_SCALE,MAX_SCALE);
    card.dataset.scoreScale=String(next);
    applyTransform(card);
    updateResizeValue(card);
    sizes[mode()][id]={scale:next};
    persist();
  }

  function closeAllMenus(except){
    document.querySelectorAll('.score-size-menu.open').forEach(menu=>{
      if(menu!==except) menu.classList.remove('open');
    });
  }

  function createPresetMenu(card,id,handle){
    let menu=card.querySelector('.score-size-menu');
    if(menu) return menu;
    menu=document.createElement('div');
    menu.className='score-size-menu';
    menu.setAttribute('role','menu');
    menu.setAttribute('aria-label','גדלים מהירים לכרטיס');
    PRESET_SCALES.forEach(scale=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='score-size-option';
      button.setAttribute('data-score-preset',String(scale));
      button.dataset.scorePreset=String(scale);
      button.textContent=Math.round(scale*100)+'%';
      button.addEventListener('pointerdown',e=>{e.stopPropagation();});
      button.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        applyScale(card,id,scale);
        menu.classList.remove('open');
      });
      menu.appendChild(button);
    });
    card.appendChild(menu);
    handle.setAttribute('aria-haspopup','menu');
    handle.setAttribute('aria-expanded','false');
    return menu;
  }

  function bindHandle(card,id,handle){
    if(handle.dataset.scoreResizeBound==='1') return;
    handle.dataset.scoreResizeBound='1';
    const menu=createPresetMenu(card,id,handle);
    let pointerId=null;
    let resizing=false;
    let moved=false;
    let startClientX=0,startClientY=0;
    let centerX=0,centerY=0,startDistance=1,startScale=1;

    function finish(e){
      if(pointerId===null || (e && e.pointerId!==pointerId)) return;
      if(resizing && moved){
        sizes[mode()][id]={scale:scaleOf(card)};
        persist();
      }else if(!moved){
        const open=!menu.classList.contains('open');
        closeAllMenus(menu);
        menu.classList.toggle('open',open);
        handle.setAttribute('aria-expanded',open?'true':'false');
      }
      handle.classList.remove('score-resize-active');
      card.classList.remove('score-card-resizing');
      document.body.classList.remove('score-card-resizing');
      if(handle.releasePointerCapture){try{handle.releasePointerCapture(pointerId);}catch{}}
      pointerId=null;
      resizing=false;
      moved=false;
    }

    handle.addEventListener('pointerdown',e=>{
      if(e.button!==undefined && e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      closeAllMenus();
      const rect=card.getBoundingClientRect();
      centerX=rect.left+rect.width/2;
      centerY=rect.top+rect.height/2;
      startClientX=e.clientX;
      startClientY=e.clientY;
      startDistance=Math.max(24,Math.hypot(e.clientX-centerX,e.clientY-centerY));
      startScale=scaleOf(card);
      pointerId=e.pointerId;
      resizing=true;
      moved=false;
      handle.classList.add('score-resize-active');
      card.classList.add('score-card-resizing');
      document.body.classList.add('score-card-resizing');
      if(handle.setPointerCapture){try{handle.setPointerCapture(pointerId);}catch{}}
    });

    handle.addEventListener('pointermove',e=>{
      if(!resizing || e.pointerId!==pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      if(Math.hypot(e.clientX-startClientX,e.clientY-startClientY)<4) return;
      moved=true;
      const distance=Math.max(8,Math.hypot(e.clientX-centerX,e.clientY-centerY));
      const next=clamp(startScale*(distance/startDistance),MIN_SCALE,MAX_SCALE);
      card.dataset.scoreScale=String(next);
      applyTransform(card);
      updateResizeValue(card);
    });

    handle.addEventListener('pointerup',finish);
    handle.addEventListener('pointercancel',finish);
    handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  }

  function bindResize(card,id){
    if(!id) return;
    card.querySelectorAll('.score-resize-handle').forEach(old=>{
      if(old.dataset.corner!==RESIZE_CORNER) old.remove();
    });
    if(card.getAttribute('data-score-resize-ready')!=='1'){
      card.setAttribute('data-score-resize-ready','1');
      const saved=sizes[mode()][id];
      const scale=saved && Number.isFinite(Number(saved.scale)) ? Number(saved.scale) : 1;
      card.dataset.scoreScale=String(clamp(scale,MIN_SCALE,MAX_SCALE));
      applyTransform(card);
    }
    let handle=card.querySelector('.score-resize-handle[data-corner="'+RESIZE_CORNER+'"]');
    if(!handle){
      handle=document.createElement('button');
      handle.type='button';
      handle.className='score-resize-handle';
      handle.dataset.corner=RESIZE_CORNER;
      handle.setAttribute('aria-label','שינוי גודל כרטיס');
      handle.setAttribute('title','גרור לשינוי גודל או לחץ לבחירת גודל');
      handle.innerHTML='<span class="score-resize-grip" aria-hidden="true"></span><b class="score-resize-value">100%</b>';
      card.appendChild(handle);
    }
    bindHandle(card,id,handle);
    createPresetMenu(card,id,handle);
    updateResizeValue(card);
  }

  function attachCards(){
    teams.querySelectorAll(':scope > .card').forEach(card=>{
      const id=cardId(card);
      if(id) bindResize(card,id);
    });
  }

  function normalizeCards(){
    sizes[mode()]={};
    persist();
    teams.querySelectorAll(':scope > .card').forEach(card=>{
      card.dataset.scoreScale='1';
      applyTransform(card);
      updateResizeValue(card);
    });
    closeAllMenus();
    window.dispatchEvent(new CustomEvent('scorecards:autoarrange'));
  }

  function resetDragStorageCurrentMode(){
    try{
      const all=JSON.parse(localStorage.getItem(DRAG_STORAGE_KEY)||'{}');
      all[mode()]={};
      localStorage.setItem(DRAG_STORAGE_KEY,JSON.stringify(all));
    }catch{}
  }

  function layoutSignature(){
    const s=getComputedStyle(teams);
    return [teams.className,teams.getAttribute('style')||'',s.display,s.gridTemplateColumns,s.flexDirection,s.columnCount].join('|');
  }

  function looksLikeLayoutControl(button){
    const text=[button.textContent,button.getAttribute('title'),button.getAttribute('aria-label'),button.id,button.className]
      .filter(Boolean).join(' ').toLowerCase();
    return /(רשימה|טור|עמוד|פריסה|תצוגה|list|column|grid|layout|view|one-column|single)/i.test(text);
  }

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest && e.target.closest('.score-size-menu,.score-resize-handle')) return;
    closeAllMenus();
  },true);

  document.addEventListener('click',e=>{
    const button=e.target.closest && e.target.closest('button');
    if(!button || button.closest('.card')) return;
    const before=layoutSignature();
    const candidate=looksLikeLayoutControl(button);
    setTimeout(()=>{
      const after=layoutSignature();
      if(candidate || after!==before){
        resetDragStorageCurrentMode();
        normalizeCards();
      }
    },80);
  },true);

  function addResetControl(){
    const form=document.getElementById('settingsForm');
    if(!form || document.getElementById('scoreResizeReset')) return;
    const actions=form.querySelector('.dialog-actions');
    if(!actions) return;
    const line=document.createElement('div');
    line.className='setting-line';
    line.innerHTML='<div class="setting-copy"><strong>גודל כרטיסי הקבוצות</strong><span>גרור את הידית בפינה לשינוי חופשי, או לחץ עליה ובחר 70%, 85%, 100%, 120% או 140%.</span></div><div class="setting-control"><button type="button" class="btn ghost" id="scoreResizeReset">↺ איפוס גודל הכרטיסים</button></div>';
    actions.before(line);
    document.getElementById('scoreResizeReset').addEventListener('click',normalizeCards);
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(attachCards));
  observer.observe(teams,{childList:true});
  addResetControl();
  attachCards();
})();
