(function(){
  const SIZE_STORAGE_KEY='team-score-card-sizes-v1';
  const DRAG_STORAGE_KEY='team-score-card-positions-v1';
  const MIN_SCALE_LIMIT=0.28;
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

  function wrapReadableText(card){
    const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let node;
    while((node=walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode=>{
      if(!textNode.textContent || !textNode.textContent.trim()) return;
      const parent=textNode.parentElement;
      if(!parent) return;
      if(parent.closest('.score-resize-handle,.score-card-text,script,style,textarea,select,option,[contenteditable="true"]')) return;
      const span=document.createElement('span');
      span.className='score-card-text';
      span.textContent=textNode.textContent;
      parent.replaceChild(span,textNode);
    });
  }

  function composeScoreControls(card){
    const buttons=Array.from(card.querySelectorAll('button')).filter(button=>!button.classList.contains('score-resize-handle'));
    const label=button=>(button.textContent||'').replace(/\s+/g,' ').trim();
    const plus=buttons.find(button=>/^[+＋]$/.test(label(button)));
    const minus=buttons.find(button=>/^[-−–]$/.test(label(button)));
    const mega=buttons.find(button=>/^(mega\b|מגה)/i.test(label(button)));

    if(plus) plus.classList.add('score-plus-btn');
    if(minus) minus.classList.add('score-minus-btn');
    if(mega) mega.classList.add('score-mega-btn');

    if(plus && minus && plus.parentElement===minus.parentElement && plus.parentElement!==card){
      const parent=plus.parentElement;
      const directButtons=Array.from(parent.children).filter(child=>child.tagName==='BUTTON');
      if(directButtons.length<=4){
        parent.classList.add('score-controls-composed');
        if(mega && mega.parentElement===parent) mega.classList.add('score-mega-in-grid');
      }
    }
  }

  function baseDimensions(card){
    let width=Number(card.dataset.scoreBaseWidth);
    let height=Number(card.dataset.scoreBaseHeight);
    if(width>0 && height>0) return {width,height};

    const previousWidth=card.style.width;
    const previousHeight=card.style.height;
    card.style.removeProperty('width');
    card.style.removeProperty('height');
    const rect=card.getBoundingClientRect();
    width=Math.max(1,rect.width);
    height=Math.max(1,rect.height);
    card.dataset.scoreBaseWidth=String(width);
    card.dataset.scoreBaseHeight=String(height);
    card.style.width=previousWidth;
    card.style.height=previousHeight;
    return {width,height};
  }

  function applyCardBox(card,scale){
    const base=baseDimensions(card);
    const next=clamp(scale,MIN_SCALE_LIMIT,MAX_SCALE);
    card.dataset.scoreScale=String(next);
    card.style.width=Math.round(base.width*next)+'px';
    card.style.height=Math.round(base.height*next)+'px';
  }

  function overflows(card){
    return card.scrollWidth>card.clientWidth+2 || card.scrollHeight>card.clientHeight+2;
  }

  function measureContentFloor(card){
    const base=baseDimensions(card);
    const previousWidth=card.style.width;
    const previousHeight=card.style.height;
    const previousScale=card.dataset.scoreScale;
    card.classList.add('score-measuring-floor');

    const test=scale=>{
      card.style.width=Math.round(base.width*scale)+'px';
      card.style.height=Math.round(base.height*scale)+'px';
      void card.offsetWidth;
      return overflows(card);
    };

    let floor=MIN_SCALE_LIMIT;
    if(test(MIN_SCALE_LIMIT)){
      let low=MIN_SCALE_LIMIT;
      let high=1;
      if(test(1)){
        floor=1;
      }else{
        for(let i=0;i<12;i++){
          const mid=(low+high)/2;
          if(test(mid)) low=mid;
          else high=mid;
        }
        floor=Math.min(1,high+0.008);
      }
    }

    card.style.width=previousWidth;
    card.style.height=previousHeight;
    if(previousScale===undefined) delete card.dataset.scoreScale;
    else card.dataset.scoreScale=previousScale;
    card.classList.remove('score-measuring-floor');
    return clamp(floor,MIN_SCALE_LIMIT,1);
  }

  function updateResizeValues(card){
    const label=Math.round(scaleOf(card)*100)+'%';
    card.querySelectorAll('.score-resize-value').forEach(value=>{value.textContent=label;});
  }

  function applySavedSize(card,id){
    composeScoreControls(card);
    wrapReadableText(card);
    baseDimensions(card);
    const floor=measureContentFloor(card);
    const saved=sizes[mode()][id];
    const wanted=saved && Number.isFinite(Number(saved.scale)) ? Number(saved.scale) : 1;
    applyCardBox(card,clamp(wanted,floor,MAX_SCALE));
    updateResizeValues(card);
  }

  function protectContent(card,id){
    if(card.classList.contains('score-card-resizing')) return;
    const current=scaleOf(card);
    if(!overflows(card)) return;
    const floor=measureContentFloor(card);
    if(current<floor){
      applyCardBox(card,floor);
      sizes[mode()][id]={scale:floor};
      persist();
      updateResizeValues(card);
    }
  }

  function bindHandle(card,id,handle){
    if(handle.dataset.scoreResizeBound==='1') return;
    handle.dataset.scoreResizeBound='1';
    let active=false;
    let pointerId=null;
    let centerX=0,centerY=0,startDistance=1,startScale=1,contentFloor=MIN_SCALE_LIMIT;

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
      wrapReadableText(card);
      contentFloor=measureContentFloor(card);
      if(scaleOf(card)<contentFloor) applyCardBox(card,contentFloor);
      const r=card.getBoundingClientRect();
      centerX=r.left+r.width/2;
      centerY=r.top+r.height/2;
      startDistance=Math.max(24,Math.hypot(e.clientX-centerX,e.clientY-centerY));
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
      const next=clamp(startScale*(distance/startDistance),contentFloor,MAX_SCALE);
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
    wrapReadableText(card);
    if(card.getAttribute('data-score-resize-ready')!=='1'){
      card.setAttribute('data-score-resize-ready','1');
      applySavedSize(card,id);
    }
    ensureResizeHandles(card,id);
    protectContent(card,id);
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
    line.innerHTML='<div class="setting-copy"><strong>גודל כרטיסי הקבוצות</strong><span>גרור מכל אחת מארבע הפינות. הכרטיס מצטמצם עד גבול התוכן בלי לדחוס את Mega או את +/−.</span></div><div class="setting-control"><button type="button" class="btn ghost" id="scoreResizeReset">↺ איפוס גודל הכרטיסים</button></div>';
    actions.before(line);
    document.getElementById('scoreResizeReset').addEventListener('click',normalizeCards);
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(attachCards));
  observer.observe(teams,{childList:true,subtree:true,characterData:true});
  addResetControl();
  attachCards();
})();
