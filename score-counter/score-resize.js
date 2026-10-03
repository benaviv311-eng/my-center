(function(){
  const SIZE_STORAGE_KEY='team-score-card-sizes-v1';
  const DRAG_STORAGE_KEY='team-score-card-positions-v1';
  const MIN_SCALE_LIMIT=0.08;
  const MAX_SCALE=1.6;
  const RESIZE_CORNERS=['top-left','top-right','bottom-left','bottom-right'];
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
  const scaleOf=card=>clamp(Number(card.dataset.scoreScale)||1,MIN_SCALE_LIMIT,MAX_SCALE);

  function composeScoreControls(card){
    const controls=card.querySelector('.score-controls');
    if(!controls || controls.classList.contains('score-controls-composed')) return;
    const plus=controls.querySelector('.score-btn.plus');
    const minus=controls.querySelector('.score-btn.minus');
    const mega=controls.querySelector('.score-btn.mega');
    const reset=controls.querySelector('.score-btn.reset-score');
    if(plus) plus.classList.add('score-plus-btn');
    if(minus) minus.classList.add('score-minus-btn');
    if(mega) mega.classList.add('score-mega-btn');
    if(reset) reset.classList.add('score-reset-btn');
    const plusStack=controls.querySelector('.plus-stack');
    if(plus) controls.appendChild(plus);
    if(minus) controls.appendChild(minus);
    if(mega) controls.appendChild(mega);
    if(reset) controls.appendChild(reset);
    if(plusStack && !plusStack.children.length) plusStack.remove();
    controls.classList.add('score-controls-composed');
  }

  function baseDimensions(card){
    let width=Number(card.dataset.scoreBaseWidth);
    let height=Number(card.dataset.scoreBaseHeight);
    if(width>0 && height>0) return {width,height};

    const previousWidth=card.style.width;
    const previousHeight=card.style.height;
    card.style.removeProperty('width');
    card.style.removeProperty('height');
    card.classList.add('score-measuring-natural');
    const rect=card.getBoundingClientRect();
    width=Math.max(1,rect.width);
    height=Math.max(1,rect.height,card.scrollHeight);
    card.dataset.scoreBaseWidth=String(width);
    card.dataset.scoreBaseHeight=String(height);
    card.style.width=previousWidth;
    card.style.height=previousHeight;
    card.classList.remove('score-measuring-natural');
    return {width,height};
  }

  function measureContentFloor(card){
    const controls=card.querySelector('.score-controls-composed') || card.querySelector('.score-controls');
    if(!controls){
      card.style.setProperty('--score-content-min-width','1px');
      return {width:1};
    }

    card.style.removeProperty('--score-content-min-width');
    const cardRect=card.getBoundingClientRect();
    const controlsWidthBefore=Math.max(1,controls.getBoundingClientRect().width);
    const horizontalChrome=Math.max(0,cardRect.width-controlsWidthBefore);

    card.classList.add('score-measuring-content-floor');
    void controls.offsetWidth;
    const intrinsicControlsWidth=Math.max(
      1,
      Math.ceil(controls.getBoundingClientRect().width),
      Math.ceil(controls.scrollWidth)
    );
    card.classList.remove('score-measuring-content-floor');

    const width=Math.max(1,Math.ceil(horizontalChrome+intrinsicControlsWidth));
    card.style.setProperty('--score-content-min-width',width+'px');
    return {width};
  }

  function measureNaturalHeight(card,width){
    const previousWidth=card.style.width;
    const previousHeight=card.style.height;
    card.classList.add('score-measuring-natural');
    card.style.width=Math.round(width)+'px';
    card.style.height='auto';
    void card.offsetHeight;
    const rect=card.getBoundingClientRect();
    const naturalHeight=Math.max(1,Math.ceil(rect.height),Math.ceil(card.scrollHeight));
    card.style.width=previousWidth;
    card.style.height=previousHeight;
    card.classList.remove('score-measuring-natural');
    return naturalHeight;
  }

  function applyCardBox(card,scale){
    const base=baseDimensions(card);
    const contentFloor=measureContentFloor(card);
    const next=clamp(scale,MIN_SCALE_LIMIT,MAX_SCALE);
    const targetWidth=Math.max(contentFloor.width,Math.round(base.width*next));
    const naturalHeight=measureNaturalHeight(card,targetWidth);
    const targetHeight=Math.max(Math.round(base.height*next),naturalHeight);

    card.dataset.scoreScale=String(next);
    card.style.width=targetWidth+'px';
    card.style.height=targetHeight+'px';
  }

  function updateResizeValues(card){
    const label=Math.round(scaleOf(card)*100)+'%';
    card.querySelectorAll('.score-resize-value').forEach(value=>{
      if(value.textContent!==label) value.textContent=label;
    });
  }

  function applySavedSize(card,id){
    composeScoreControls(card);
    baseDimensions(card);
    const saved=sizes[mode()][id];
    const wanted=saved && Number.isFinite(Number(saved.scale)) ? Number(saved.scale) : 1;
    applyCardBox(card,wanted);
    updateResizeValues(card);
  }

  function bindHandle(card,id,handle){
    if(handle.dataset.scoreResizeBound==='1') return;
    handle.dataset.scoreResizeBound='1';
    let active=false;
    let pointerId=null;
    let centerX=0,centerY=0,startDistance=1,startScale=1;

    function finish(){
      if(!active) return;
      active=false;
      handle.classList.remove('score-resize-active');
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
      composeScoreControls(card);
      const r=card.getBoundingClientRect();
      centerX=r.left+r.width/2;
      centerY=r.top+r.height/2;
      startDistance=Math.max(20,Math.hypot(e.clientX-centerX,e.clientY-centerY));
      startScale=scaleOf(card);
      active=true;
      pointerId=e.pointerId;
      handle.classList.add('score-resize-active');
      card.classList.add('score-card-resizing');
      document.body.classList.add('score-card-resizing');
      updateResizeValues(card);
      if(handle.setPointerCapture){try{handle.setPointerCapture(pointerId);}catch{}}
      if(navigator.vibrate){try{navigator.vibrate(12);}catch{}}
    });

    handle.addEventListener('pointermove',e=>{
      if(!active || e.pointerId!==pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      const distance=Math.max(8,Math.hypot(e.clientX-centerX,e.clientY-centerY));
      const next=startScale*(distance/startDistance);
      applyCardBox(card,next);
      updateResizeValues(card);
    });
    handle.addEventListener('pointerup',e=>{if(e.pointerId===pointerId) finish();});
    handle.addEventListener('pointercancel',e=>{if(e.pointerId===pointerId) finish();});
    handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  }

  function ensureResizeHandles(card,id){
    RESIZE_CORNERS.forEach(corner=>{
      let handle=card.querySelector('.score-resize-handle[data-corner="'+corner+'"]');
      if(!handle){
        handle=document.createElement('button');
        handle.type='button';
        handle.className='score-resize-handle';
        handle.dataset.corner=corner;
        handle.setAttribute('aria-label','שינוי גודל כרטיס הקבוצה מהפינה');
        handle.setAttribute('title','גרור את הפינה באלכסון כדי להקטין או להגדיל');
        handle.innerHTML='<b class="score-resize-value">100%</b>';
        card.appendChild(handle);
      }
      bindHandle(card,id,handle);
    });
    updateResizeValues(card);
  }

  function bindResize(card,id){
    if(!id) return;
    composeScoreControls(card);
    if(card.getAttribute('data-score-resize-ready')!=='1'){
      card.setAttribute('data-score-resize-ready','1');
      applySavedSize(card,id);
    }
    ensureResizeHandles(card,id);
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
      card.style.removeProperty('width');
      card.style.removeProperty('height');
      card.style.removeProperty('--score-content-min-width');
      card.style.removeProperty('--score-content-min-height');
      delete card.dataset.scoreBaseWidth;
      delete card.dataset.scoreBaseHeight;
      updateResizeValues(card);
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
    line.innerHTML='<div class="setting-copy"><strong>גודל כרטיסי הקבוצות</strong><span>גרור אחת מארבע הפינות. הכרטיס מצטמצם עד גודל הטקסט והכפתורים בלבד; Mega תמיד נשאר מתחת ל־+ ול־−.</span></div><div class="setting-control"><button type="button" class="btn ghost" id="scoreResizeReset">↺ איפוס גודל הכרטיסים</button></div>';
    actions.before(line);
    document.getElementById('scoreResizeReset').addEventListener('click',normalizeCards);
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(attachCards));
  observer.observe(teams,{childList:true});
  addResetControl();
  attachCards();
})();
