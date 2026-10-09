(function(){
  const teams=document.getElementById('teams');
  if(!teams) return;

  const MODE_KEY='team-score-layout-mode-v2';
  const FREE_KEY='team-score-layout-free-v2';
  const SAFE=6;
  const GAP=8;
  const MIN_CARD=128;
  const MODES=new Set(['auto','one','two','three','row','free']);
  let currentMode='auto';
  let menu=null;
  let trigger=null;
  let freePositions={};
  let freePointer=null;
  let freeCard=null;
  let dragStart=null;
  let freeBase=null;
  let refreshFrame=0;

  try{
    const saved=localStorage.getItem(MODE_KEY);
    if(MODES.has(saved)) currentMode=saved;
    const stored=JSON.parse(localStorage.getItem(FREE_KEY)||'{}');
    if(stored && typeof stored==='object') freePositions=stored;
  }catch{}

  function persistMode(){try{localStorage.setItem(MODE_KEY,currentMode)}catch{}}
  function persistFree(){try{localStorage.setItem(FREE_KEY,JSON.stringify(freePositions))}catch{}}

  function visibleImageRect(img){
    const rect=img.getBoundingClientRect();
    const boxWidth=img.clientWidth||0;
    const boxHeight=img.clientHeight||0;
    const naturalWidth=img.naturalWidth||0;
    const naturalHeight=img.naturalHeight||0;
    if(!boxWidth||!boxHeight||!naturalWidth||!naturalHeight) return rect;
    const style=getComputedStyle(img);
    if(style.objectFit!=='contain') return rect;
    const fit=Math.min(boxWidth/naturalWidth,boxHeight/naturalHeight);
    const contentWidth=naturalWidth*fit;
    const contentHeight=naturalHeight*fit;
    const scaleX=rect.width/boxWidth;
    const scaleY=rect.height/boxHeight;
    const offsetX=(boxWidth-contentWidth)/2;
    const offsetY=(boxHeight-contentHeight)/2;
    const left=rect.left+offsetX*scaleX;
    const top=rect.top+offsetY*scaleY;
    const width=contentWidth*scaleX;
    const height=contentHeight*scaleY;
    return {left,top,right:left+width,bottom:top+height,width,height};
  }

  function imageRect(){
    const img=document.querySelector('#sharpBg img.active')||document.querySelector('#sharpBg img');
    if(img){
      const r=visibleImageRect(img);
      const left=Math.max(SAFE,Math.ceil(r.left)+SAFE);
      const top=Math.max(SAFE,Math.ceil(r.top)+SAFE);
      const right=Math.min(window.innerWidth-SAFE,Math.floor(r.right)-SAFE);
      const bottom=Math.min(window.innerHeight-SAFE,Math.floor(r.bottom)-SAFE);
      if(right-left>=140 && bottom-top>=180) return {left,top,right,bottom,width:right-left,height:bottom-top};
    }
    const width=Math.max(140,Math.min(window.innerWidth-2*SAFE,Math.round(window.innerWidth*.65)));
    const left=Math.round((window.innerWidth-width)/2);
    return {left,top:SAFE,right:left+width,bottom:window.innerHeight-SAFE,width,height:window.innerHeight-2*SAFE};
  }

  function cards(){
    return Array.from(teams.querySelectorAll(':scope > .card.score-card-professional')).filter(card=>{
      const s=getComputedStyle(card);
      return s.display!=='none' && s.visibility!=='hidden';
    });
  }

  function cardId(card,index){
    return card.dataset.dragTeamId || card.querySelector('.delete-team')?.dataset.teamId || `card-${index}`;
  }

  function clearLegacyLayout(){
    teams.classList.remove('score-final-column','score-two-column-fit','score-image-contained');
    teams.style.removeProperty('--score-two-column-width');
    teams.style.removeProperty('--score-image-width');
    teams.style.removeProperty('--score-image-left');
    teams.style.removeProperty('--score-image-shift');
  }

  function maxColumnsFor(frame,count){
    const possible=Math.max(1,Math.floor((frame.width+GAP)/(MIN_CARD+GAP)));
    return Math.max(1,Math.min(count||1,possible));
  }

  function desiredColumns(mode,frame,count){
    const max=maxColumnsFor(frame,count);
    if(mode==='one') return 1;
    if(mode==='two') return Math.min(2,max);
    if(mode==='three') return Math.min(3,max);
    if(mode==='row') return Math.min(Math.max(1,count),max);
    if(frame.width>=620 && count>=3) return Math.min(3,max);
    if(frame.width>=330 && count>=2) return Math.min(2,max);
    return 1;
  }

  function preferredTop(frame){
    const now=teams.getBoundingClientRect();
    const leader=document.querySelector('[data-score-leader-banner="1"]');
    const leaderBottom=leader ? leader.getBoundingClientRect().bottom+10 : frame.top+72;
    const minTop=Math.max(frame.top+6,leaderBottom);
    const maxTop=Math.max(minTop,frame.bottom-120);
    if(Number.isFinite(now.top) && now.top>=minTop && now.top<=maxTop) return Math.round(now.top);
    return Math.round(minTop);
  }

  function clearFreeInline(){
    cards().forEach(card=>{
      card.style.removeProperty('--score-free-x');
      card.style.removeProperty('--score-free-y');
      card.removeAttribute('data-score-free-card');
    });
  }

  function updateActiveOption(){
    if(!menu) return;
    menu.querySelectorAll('[data-layout-mode]').forEach(button=>{
      button.classList.toggle('active',button.dataset.layoutMode===currentMode);
      button.setAttribute('aria-pressed',button.dataset.layoutMode===currentMode?'true':'false');
    });
  }

  function applyManaged(mode){
    const list=cards();
    const frame=imageRect();
    const columns=desiredColumns(mode,frame,list.length);
    const top=preferredTop(frame);
    const availableHeight=Math.max(120,frame.bottom-top);
    clearFreeInline();
    clearLegacyLayout();
    teams.classList.remove('score-layout-free');
    teams.classList.add('score-layout-managed',`score-layout-${mode}`);
    ['auto','one','two','three','row'].forEach(name=>{if(name!==mode) teams.classList.remove(`score-layout-${name}`)});
    teams.dataset.scoreLayoutMode=mode;
    teams.style.setProperty('--score-layout-left',Math.round(frame.left)+'px');
    teams.style.setProperty('--score-layout-top',Math.round(top)+'px');
    teams.style.setProperty('--score-layout-width',Math.round(frame.width)+'px');
    teams.style.setProperty('--score-layout-height',Math.round(availableHeight)+'px');
    teams.style.setProperty('--score-layout-columns',String(columns));
    teams.style.setProperty('--score-layout-gap',GAP+'px');
  }

  function defaultFreePositions(list,frame){
    const width=Math.min(224,Math.max(150,frame.width-8));
    const perRow=Math.max(1,Math.floor((frame.width+GAP)/(width+GAP)));
    list.forEach((card,index)=>{
      const id=cardId(card,index);
      if(freePositions[id]) return;
      const col=index%perRow;
      const row=Math.floor(index/perRow);
      freePositions[id]={x:Math.round(col*(width+GAP)),y:Math.round(row*150)};
    });
    persistFree();
  }

  function clampFreeCard(card,x,y){
    const box=teams.getBoundingClientRect();
    const rect=card.getBoundingClientRect();
    const reserveRank=28;
    const maxX=Math.max(0,box.width-Math.max(1,rect.width));
    const maxY=Math.max(0,box.height-Math.max(1,rect.height)-reserveRank);
    return {x:Math.round(Math.min(maxX,Math.max(0,Number(x)||0))),y:Math.round(Math.min(maxY,Math.max(0,Number(y)||0)))};
  }

  function applyFreePositions(){
    const list=cards();
    list.forEach((card,index)=>{
      const id=cardId(card,index);
      const saved=freePositions[id]||{x:0,y:index*150};
      const pos=clampFreeCard(card,saved.x,saved.y);
      freePositions[id]=pos;
      card.dataset.scoreFreeCard='1';
      card.style.setProperty('--score-free-x',pos.x+'px');
      card.style.setProperty('--score-free-y',pos.y+'px');
    });
    persistFree();
  }

  function applyFree(){
    const list=cards();
    const frame=imageRect();
    clearLegacyLayout();
    teams.classList.remove('score-layout-managed','score-layout-auto','score-layout-one','score-layout-two','score-layout-three','score-layout-row');
    teams.classList.add('score-layout-free');
    teams.dataset.scoreLayoutMode='free';
    teams.style.setProperty('--score-layout-left',Math.round(frame.left)+'px');
    teams.style.setProperty('--score-layout-top',Math.round(frame.top)+'px');
    teams.style.setProperty('--score-layout-width',Math.round(frame.width)+'px');
    teams.style.setProperty('--score-layout-height',Math.round(frame.height)+'px');
    defaultFreePositions(list,frame);
    requestAnimationFrame(applyFreePositions);
  }

  function applyLayout(mode=currentMode){
    if(!MODES.has(mode)) mode='auto';
    currentMode=mode;
    persistMode();
    if(mode==='free') applyFree(); else applyManaged(mode);
    updateActiveOption();
    requestAnimationFrame(()=>{
      clearLegacyLayout();
      if(mode==='free') applyFreePositions();
    });
  }

  function resetLayout(){
    currentMode='auto';
    freePositions={};
    try{localStorage.removeItem(FREE_KEY)}catch{}
    document.dispatchEvent(new CustomEvent('scorecards:autoarrange'));
    applyLayout('auto');
  }

  function buildMenu(){
    if(menu) return menu;
    menu=document.createElement('div');
    menu.className='score-layout-menu';
    menu.hidden=true;
    menu.setAttribute('role','dialog');
    menu.setAttribute('aria-label','פריסת כרטיסים');
    menu.innerHTML=`
      <div class="score-layout-menu-title">פריסת כרטיסים</div>
      <div class="score-layout-menu-grid">
        <button type="button" data-layout-mode="auto"><span>✦</span><b>אוטומטי</b><small>המערכת מתאימה למסך</small></button>
        <button type="button" data-layout-mode="one"><span>▯</span><b>טור 1</b><small>כרטיס מתחת לכרטיס</small></button>
        <button type="button" data-layout-mode="two"><span>▯▯</span><b>2 טורים</b><small>בתוך גבולות התמונה</small></button>
        <button type="button" data-layout-mode="three"><span>▯▯▯</span><b>3 טורים</b><small>רק כשיש מספיק רוחב</small></button>
        <button type="button" data-layout-mode="row"><span>▭▭▭</span><b>שורה</b><small>נפרס לרוחב ככל שניתן</small></button>
        <button type="button" data-layout-mode="free"><span>✥</span><b>חופשי</b><small>גרירה בתוך התמונה בלבד</small></button>
      </div>
      <button type="button" class="score-layout-reset">↺ איפוס פריסה</button>`;
    document.body.appendChild(menu);
    menu.querySelectorAll('[data-layout-mode]').forEach(button=>{
      button.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        applyLayout(button.dataset.layoutMode);
        closeMenu();
      });
    });
    menu.querySelector('.score-layout-reset').addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();resetLayout();closeMenu();
    });
    updateActiveOption();
    return menu;
  }

  function descriptor(button){
    return [button.textContent,button.getAttribute('aria-label'),button.getAttribute('title'),button.id,button.className]
      .filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  }

  function looksLikeLayoutGlyph(text){
    const compact=String(text||'').replace(/\s+/g,'');
    if(!compact || compact.length>8) return false;
    if(/[▯□▭▮▥▦▤▧▨▣]{1,4}/u.test(compact)) return true;
    const boxCount=(compact.match(/[\[\]┃│|]/g)||[]).length;
    return boxCount>=4;
  }

  function isLegacyLayoutButton(button){
    if(!button || button.dataset.scoreLayoutIgnore==='1' || button.closest('.score-layout-menu,.score-card-menu,.score-live-timer,.card')) return false;
    const text=descriptor(button);
    if(/פריס|טור|עמוד|layout|columns?|grid|arrange/i.test(text)) return true;
    const rect=button.getBoundingClientRect();
    const nearRight=rect.right>=window.innerWidth-120;
    const nearTop=rect.top<=190;
    const compact=rect.width>0&&rect.width<=88&&rect.height>0&&rect.height<=88;
    return nearRight&&nearTop&&compact&&looksLikeLayoutGlyph(button.textContent||'');
  }

  function findLayoutButton(){
    const all=Array.from(document.querySelectorAll('button')).filter(isLegacyLayoutButton);
    if(!all.length) return null;
    all.sort((a,b)=>{
      const ad=/פריס|טור|layout|column|grid/i.test(descriptor(a))?0:1;
      const bd=/פריס|טור|layout|column|grid/i.test(descriptor(b))?0:1;
      if(ad!==bd) return ad-bd;
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return (window.innerWidth-ar.right)-(window.innerWidth-br.right) || ar.top-br.top;
    });
    return all[0];
  }

  function bindTrigger(button){
    if(!button) return false;
    trigger=button;
    trigger.dataset.scoreLayoutTrigger='1';
    trigger.setAttribute('aria-label','פריסת כרטיסים');
    trigger.setAttribute('title','פריסת כרטיסים');
    return true;
  }

  function ensureTrigger(){
    if(trigger&&trigger.isConnected) return trigger;
    const found=findLayoutButton();
    if(found){bindTrigger(found);return found;}
    return null;
  }

  function positionMenu(){
    if(!menu||menu.hidden) return;
    const button=ensureTrigger();
    const rect=button?button.getBoundingClientRect():{left:window.innerWidth-64,right:window.innerWidth-12,top:70,bottom:118};
    const menuRect=menu.getBoundingClientRect();
    let right=Math.max(8,window.innerWidth-rect.right);
    let top=rect.bottom+8;
    if(top+menuRect.height>window.innerHeight-8) top=Math.max(8,rect.top-menuRect.height-8);
    if(menuRect.width>window.innerWidth-16) right=8;
    menu.style.right=Math.round(right)+'px';
    menu.style.top=Math.round(top)+'px';
  }

  function openMenu(){
    buildMenu();
    menu.hidden=false;
    updateActiveOption();
    requestAnimationFrame(positionMenu);
  }
  function closeMenu(){if(menu) menu.hidden=true;}
  function toggleMenu(){if(menu&&!menu.hidden) closeMenu(); else openMenu();}

  document.addEventListener('click',e=>{
    const button=e.target&&e.target.closest?e.target.closest('button'):null;
    if(button && (button.dataset.scoreLayoutTrigger==='1' || isLegacyLayoutButton(button))){
      if(button.dataset.scoreLayoutTrigger!=='1') bindTrigger(button);
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggleMenu();
      return;
    }
    if(menu&&!menu.hidden&&!e.target.closest('.score-layout-menu')) closeMenu();
  },true);

  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu()});

  teams.addEventListener('pointerdown',e=>{
    if(currentMode!=='free') return;
    if(e.button!==undefined&&e.button!==0) return;
    if(e.target.closest('button,input,.score-card-menu,.score-card-menu-toggle')) return;
    const card=e.target.closest(':scope > .card.score-card-professional')||e.target.closest('.card.score-card-professional');
    if(!card||card.parentElement!==teams) return;
    const list=cards();
    const index=list.indexOf(card);
    const id=cardId(card,index);
    const pos=freePositions[id]||{x:0,y:0};
    freePointer=e.pointerId;
    freeCard=card;
    dragStart={x:e.clientX,y:e.clientY,id};
    freeBase={x:pos.x,y:pos.y};
    try{card.setPointerCapture(freePointer)}catch{}
    card.classList.add('score-layout-dragging');
    e.preventDefault();
  });
  teams.addEventListener('pointermove',e=>{
    if(currentMode!=='free'||e.pointerId!==freePointer||!freeCard||!dragStart) return;
    const next=clampFreeCard(freeCard,freeBase.x+(e.clientX-dragStart.x),freeBase.y+(e.clientY-dragStart.y));
    freePositions[dragStart.id]=next;
    freeCard.style.setProperty('--score-free-x',next.x+'px');
    freeCard.style.setProperty('--score-free-y',next.y+'px');
    e.preventDefault();
  });
  function finishFreeDrag(e){
    if(freePointer===null || (e&&e.pointerId!==freePointer)) return;
    if(freeCard){try{freeCard.releasePointerCapture(freePointer)}catch{} freeCard.classList.remove('score-layout-dragging');}
    persistFree();
    freePointer=null;freeCard=null;dragStart=null;freeBase=null;
  }
  teams.addEventListener('pointerup',finishFreeDrag);
  teams.addEventListener('pointercancel',finishFreeDrag);

  function scheduleRefresh(){
    if(refreshFrame) cancelAnimationFrame(refreshFrame);
    refreshFrame=requestAnimationFrame(()=>{
      refreshFrame=0;
      applyLayout(currentMode);
      ensureTrigger();
      positionMenu();
    });
  }

  window.addEventListener('resize',scheduleRefresh,{passive:true});
  document.querySelectorAll('#sharpBg img').forEach(img=>img.addEventListener('load',scheduleRefresh,{passive:true}));
  const observer=new MutationObserver(()=>requestAnimationFrame(()=>{
    ensureTrigger();
    applyLayout(currentMode);
  }));
  observer.observe(teams,{childList:true});

  ensureTrigger();
  setTimeout(ensureTrigger,250);
  setTimeout(ensureTrigger,900);
  applyLayout(currentMode);
  window.ScoreLayoutMenu={applyLayout,resetLayout,imageRect,clampFreeCard};
})();
