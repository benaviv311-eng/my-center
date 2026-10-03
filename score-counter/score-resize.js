(function(){
  const SIZE_STORAGE_KEY='team-score-card-sizes-v1';
  const DRAG_STORAGE_KEY='team-score-card-positions-v1';
  const MIN_SCALE=0.55;
  const MAX_SCALE=1.6;
  const TEXT_FLOOR_SCALE=0.78;
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

  function markReadableText(card){
    card.querySelectorAll('*').forEach(el=>{
      if(el.classList.contains('score-resize-handle') || el.closest('.score-resize-handle')) return;
      if(el.closest('button,input,select,textarea')) return;
      const hasOwnText=Array.from(el.childNodes).some(node=>node.nodeType===3 && node.textContent.trim());
      if(hasOwnText && el.children.length===0) el.classList.add('score-card-content');
    });
  }

  function applyContentCompensation(card,scale){
    const compensation=scale>=TEXT_FLOOR_SCALE ? 1/scale : 1/TEXT_FLOOR_SCALE;
    card.style.setProperty('--score-content-compensation',compensation.toFixed(4));
    card.style.setProperty('--score-card-scale',scale.toFixed(4));
    markReadableText(card);
  }

  function applyTransform(card){
    const x=Number(card.dataset.dragX)||0;
    const y=Number(card.dataset.dragY)||0;
    const scale=scaleOf(card);
    card.dataset.scoreScale=String(scale);
    applyContentCompensation(card,scale);
    card.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0) scale('+scale.toFixed(3)+')';
  }

  function applySavedSize(card,id){
    const saved=sizes[mode()][id];
    const scale=saved && Number.isFinite(Number(saved.scale)) ? clamp(Number(saved.scale),MIN_SCALE,MAX_SCALE) : 1;
    card.dataset.scoreScale=String(scale);
    applyTransform(card);
  }

  function bindResize(card,id){
    if(!id || card.getAttribute('data-score-resize-ready')==='1') return;
    card.setAttribute('data-score-resize-ready','1');
    markReadableText(card);
    applySavedSize(card,id);

    const handle=document.createElement('button');
    handle.type='button';
    handle.className='score-resize-handle';
    handle.setAttribute('aria-label','שינוי גודל כרטיס הקבוצה');
    handle.setAttribute('title','גרור מהפינה באלכסון כדי להקטין או להגדיל');
    handle.innerHTML='<b class="score-resize-value">100%</b>';
    card.appendChild(handle);
    const value=handle.querySelector('.score-resize-value');
    value.textContent=Math.round(scaleOf(card)*100)+'%';

    let active=false;
    let pointerId=null;
    let centerX=0,centerY=0,startDistance=1,startScale=1;

    function finish(){
      if(!active) return;
      active=false;
      card.classList.remove('score-card-resizing');
      document.body.classList.remove('score-card-resizing');
      sizes[mode()][id]={scale:scaleOf(card)};
      persist();
      if(pointerId!==null && handle.releasePointerCapture){try{handle.releasePointerCapture(pointerId);}catch{}}
      pointerId=null;
    }

    handle.addEventListener('pointerdown',e=>{
      if(e.button!==undefined && e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      const r=card.getBoundingClientRect();
      centerX=r.left+r.width/2;
      centerY=r.top+r.height/2;
      startDistance=Math.max(24,Math.hypot(e.clientX-centerX,e.clientY-centerY));
      startScale=scaleOf(card);
      active=true;
      pointerId=e.pointerId;
      card.classList.add('score-card-resizing');
      document.body.classList.add('score-card-resizing');
      if(handle.setPointerCapture){try{handle.setPointerCapture(pointerId);}catch{}}
      if(navigator.vibrate){try{navigator.vibrate(12);}catch{}}
    });

    handle.addEventListener('pointermove',e=>{
      if(!active || e.pointerId!==pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      const distance=Math.max(8,Math.hypot(e.clientX-centerX,e.clientY-centerY));
      const next=clamp(startScale*(distance/startDistance),MIN_SCALE,MAX_SCALE);
      card.dataset.scoreScale=String(next);
      value.textContent=Math.round(next*100)+'%';
      applyTransform(card);
    });
    handle.addEventListener('pointerup',e=>{if(e.pointerId===pointerId) finish();});
    handle.addEventListener('pointercancel',e=>{if(e.pointerId===pointerId) finish();});
    handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  }

  function attachCards(){
    teams.querySelectorAll(':scope > .card').forEach(card=>{
      markReadableText(card);
      const id=cardId(card);
      if(id) bindResize(card,id);
    });
  }

  function normalizeCards(){
    sizes[mode()]={};
    persist();
    teams.querySelectorAll(':scope > .card').forEach(card=>{
      card.dataset.scoreScale='1';
      const value=card.querySelector('.score-resize-value');
      if(value) value.textContent='100%';
      applyTransform(card);
    });
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

  document.addEventListener('click',e=>{
    const button=e.target.closest && e.target.closest('button');
    if(!button || button.closest('.card')) return;
    const before=layoutSignature();
    const candidate=looksLikeLayoutControl(button);
    setTimeout(()=>{
      const after=layoutSignature();
      if(candidate || after!==before){
        if(after!==before || candidate){
          resetDragStorageCurrentMode();
          normalizeCards();
        }
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
    line.innerHTML='<div class="setting-copy"><strong>גודל כרטיסי הקבוצות</strong><span>גרור מהפינה האלכסונית של הכרטיס. הטקסט נשאר קריא ורק מצטמצם כשהכרטיס כבר קטן מדי.</span></div><div class="setting-control"><button type="button" class="btn ghost" id="scoreResizeReset">↺ איפוס גודל הכרטיסים</button></div>';
    actions.before(line);
    document.getElementById('scoreResizeReset').addEventListener('click',()=>{
      normalizeCards();
    });
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(attachCards));
  observer.observe(teams,{childList:true,subtree:true});
  addResetControl();
  attachCards();
})();
