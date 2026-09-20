(()=>{
'use strict';
if(window.SiteEditorUI)return;

const MODE_KEY='site-editor-mode';
const MODES=['consult','edit','work'];
const EDITOR_ERRORS={
  owner_required:'אין הרשאת עריכת אתר.',
  stale_plan:'הקבצים השתנו מאז האישור. צריך להכין הצעה חדשה.',
  unsafe_plan:'השינוי המוצע נחסם מטעמי בטיחות.',
  editor_unavailable:'עורך האתר אינו זמין כרגע.'
};
const TERMINAL_STATUSES=new Set(['deployed','failed','cancelled','rolled_back']);
const STOP_POLL_STATUSES=new Set(['awaiting_plan_approval','preview_ready','awaiting_publish_approval','deployed','failed','cancelled','rolled_back','needs_replan']);
const STATUS_STAGE={
  planning:'מנתח',
  needs_replan:'מוצא קבצים',
  approved:'מכין שינוי',
  applying:'שומר Branch',
  testing:'מריץ בדיקות',
  repairing:'מריץ בדיקות',
  preview_ready:'מכין Preview',
  awaiting_plan_approval:'ממתין לאישור',
  awaiting_publish_approval:'ממתין לאישור',
  merging:'מפרסם',
  deploying:'מפרסם',
  deployed:'פורסם',
  failed:'נכשל',
  cancelled:'בוטל',
  rolled_back:'הוחזר'
};
let currentMode=MODES.includes(localStorage.getItem(MODE_KEY))?localStorage.getItem(MODE_KEY):'edit';
let activeRequest=null;
let activeRequestData=null;
let pollTimer=null;
let selectedElement=null;
let inspecting=false;
let inspectHover=null;
let installed=false;
let ctx={chatState:null,api:null,pageContext:null};

function setMode(mode,{persist=true}={}){
  currentMode=MODES.includes(mode)?mode:'edit';
  if(persist)localStorage.setItem(MODE_KEY,currentMode);
  if(ctx.chatState){
    ctx.chatState.consultOnly=currentMode==='consult';
    localStorage.setItem('site-chat-consult-only',ctx.chatState.consultOnly?'1':'0');
  }
  document.querySelectorAll('[data-site-editor-mode]').forEach(btn=>{
    const active=btn.dataset.siteEditorMode===currentMode;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',active?'true':'false');
  });
  document.dispatchEvent(new CustomEvent('site-editor-mode-change',{detail:{mode:currentMode}}));
  return currentMode;
}

function renderModeControls(){
  const toolbar=document.querySelector('.site-chat-toolbar');
  if(!toolbar)return;
  const legacy=toolbar.querySelector('[data-chat-consult]');
  if(legacy)legacy.hidden=true;
  let host=toolbar.querySelector('[data-site-editor-modes]');
  if(!host){
    host=document.createElement('div');
    host.className='site-editor-modes';
    host.dataset.siteEditorModes='1';
    host.setAttribute('role','group');
    host.setAttribute('aria-label','מצב עבודה בצ׳אט');
    host.innerHTML=[
      '<button type="button" data-site-editor-mode="consult" aria-pressed="false">🛡️ ייעוץ בלבד</button>',
      '<button type="button" data-site-editor-mode="edit" aria-pressed="false">✏️ עריכה</button>',
      '<button type="button" data-site-editor-mode="work" aria-pressed="false">⚡ עבודה</button>',
      '<button type="button" class="site-editor-inspect-btn" data-site-editor-inspect>🎯 בחר מהעמוד</button>',
      '<button type="button" data-site-editor-history>🧾 שינויים באתר</button>'
    ].join('');
    toolbar.appendChild(host);
    host.addEventListener('click',event=>{
      const modeBtn=event.target.closest('[data-site-editor-mode]');
      if(modeBtn){setMode(modeBtn.dataset.siteEditorMode);return}
      const inspectBtn=event.target.closest('[data-site-editor-inspect]');
      if(inspectBtn){beginInspect();return}
      const historyBtn=event.target.closest('[data-site-editor-history]');
      if(historyBtn)showChanges();
    });
  }
  setMode(currentMode,{persist:false});
}

function cssEscape(value){
  if(window.CSS?.escape)return CSS.escape(String(value));
  return String(value).replace(/[^a-zA-Z0-9_-]/g,ch=>'\\'+ch);
}

function stableDomPath(element){
  if(!element||element.nodeType!==1)return '';
  if(element.id)return '#'+cssEscape(element.id);
  const preferred=['rpId','bankId','id'];
  for(const key of preferred){
    const value=element.dataset?.[key];
    if(value){
      const attr=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
      return '[data-'+attr+'="'+String(value).replace(/"/g,'\\\"')+'"]';
    }
  }
  const segments=[];
  let node=element;
  while(node&&node.nodeType===1&&node!==document.body&&segments.length<6){
    let segment=node.tagName.toLowerCase();
    const classes=[...node.classList].filter(x=>!x.startsWith('site-editor-inspect')).slice(0,2);
    if(classes.length)segment+='.'+classes.map(cssEscape).join('.');
    const parent=node.parentElement;
    if(parent){
      const same=[...parent.children].filter(child=>child.tagName===node.tagName);
      if(same.length>1)segment+=':nth-of-type('+(same.indexOf(node)+1)+')';
    }
    segments.unshift(segment);
    node=parent;
  }
  return segments.join(' > ');
}

function selectedElementContext(element){
  const rect=element.getBoundingClientRect();
  const style=getComputedStyle(element);
  const container=element.closest('article,section,main,[data-rp-type],[data-bank-id],.card');
  return {
    tag:element.tagName.toLowerCase(),
    id:element.id||'',
    classes:[...element.classList].filter(x=>x!=='site-editor-inspect-hover'),
    data:{...element.dataset},
    visible_text:(element.innerText||element.textContent||'').replace(/\s+/g,' ').trim().slice(0,2400),
    dom_path:stableDomPath(element),
    container:container?{
      tag:container.tagName.toLowerCase(),
      id:container.id||'',
      classes:[...container.classList].filter(x=>x!=='site-editor-inspect-hover'),
      dom_path:stableDomPath(container)
    }:null,
    bounds:{
      x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height),
      top:Math.round(rect.top),right:Math.round(rect.right),bottom:Math.round(rect.bottom),left:Math.round(rect.left)
    },
    computed_style:{
      display:style.display,
      position:style.position,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight,
      color:style.color,
      backgroundColor:style.backgroundColor,
      margin:style.margin,
      padding:style.padding,
      gap:style.gap
    }
  };
}

function clearInspectHover(){
  inspectHover?.classList?.remove('site-editor-inspect-hover');
  inspectHover=null;
}

function endInspect(){
  if(!inspecting)return;
  inspecting=false;
  clearInspectHover();
  document.body.classList.remove('site-editor-inspecting');
  document.removeEventListener('pointerover',inspectPointerOver,true);
  document.removeEventListener('pointerout',inspectPointerOut,true);
  document.removeEventListener('click',inspectClick,true);
  document.querySelector('[data-site-editor-inspect]')?.classList.remove('active');
}

function inspectPointerOver(event){
  const target=event.target?.closest?.('*');
  if(!target||target.closest('#site-chat-drawer,#site-chat-fab'))return;
  clearInspectHover();
  inspectHover=target;
  inspectHover.classList.add('site-editor-inspect-hover');
}

function inspectPointerOut(event){
  if(event.target===inspectHover)clearInspectHover();
}

function inspectClick(event){
  const target=event.target?.closest?.('*');
  if(!target||target.closest('#site-chat-drawer,#site-chat-fab'))return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  selectedElement=selectedElementContext(target);
  endInspect();
  renderSelectionChip();
  document.dispatchEvent(new CustomEvent('site-editor-element-selected',{detail:selectedElement}));
}

function beginInspect(){
  if(inspecting){endInspect();return}
  inspecting=true;
  document.body.classList.add('site-editor-inspecting');
  document.querySelector('[data-site-editor-inspect]')?.classList.add('active');
  document.addEventListener('pointerover',inspectPointerOver,true);
  document.addEventListener('pointerout',inspectPointerOut,true);
  document.addEventListener('click',inspectClick,true);
}

function clearSelectedElement(){
  selectedElement=null;
  renderSelectionChip();
}

function renderSelectionChip(){
  const composer=document.getElementById('site-chat-form');
  if(!composer)return;
  let host=composer.querySelector('[data-site-editor-selection]');
  if(!selectedElement){
    host?.remove();
    return;
  }
  if(!host){
    host=document.createElement('div');
    host.className='site-editor-selection';
    host.dataset.siteEditorSelection='1';
    composer.insertBefore(host,composer.firstChild);
  }
  host.innerHTML='<span>נבחר: <b>'+escapeHtml(selectedElement.dom_path||selectedElement.tag)+'</b></span><button type="button" aria-label="נקה בחירה">×</button>';
  host.querySelector('button').onclick=clearSelectedElement;
}

function editorErrorMessage(error){
  return EDITOR_ERRORS[error?.code]||'הפעולה לא הושלמה. נסה שוב.';
}

function riskText(level){
  return level==='high'?'סיכון גבוה':level==='medium'?'סיכון בינוני':'סיכון נמוך';
}

function requestCardMarkup(request){
  const operations=Array.isArray(request?.operations)?request.operations:[];
  const files=[...new Set(operations.map(op=>op?.path).filter(Boolean))];
  const awaiting=request?.status==='awaiting_plan_approval';
  const cancellable=request?.status&&!TERMINAL_STATUSES.has(request.status);
  const warning=request?.public_asset_warning?'<div class="site-edit-warning">⚠️ קובץ פרטי יהפוך לנכס ציבורי באתר רק לאחר אישור מפורש.</div>':'';
  const preview=request?.requires_preview?'<div class="site-edit-requirement">🔎 נדרש Preview לפני פרסום.</div>':'<div class="site-edit-requirement">✓ אפשר להמשיך ללא Preview חובה בשלב התכנון.</div>';
  const fileHtml=files.length?'<ul class="site-edit-files">'+files.map(path=>'<li>'+escapeHtml(path)+'</li>').join('')+'</ul>':'<div class="site-edit-files-empty">לא צוינו קבצים.</div>';
  return `<article class="site-edit-card" data-site-edit-request="${escapeHtml(request?.id||'')}">
    <div class="site-edit-card-head">
      <strong>שינוי מוצע באתר</strong>
      <span class="site-edit-risk site-edit-risk-${escapeHtml(request?.risk_level||'low')}">${riskText(request?.risk_level)}</span>
    </div>
    <p class="site-edit-summary">${escapeHtml(request?.summary||'שינוי באתר')}</p>
    <div class="site-edit-meta">סטטוס: ${escapeHtml(request?.status||'לא ידוע')} · ${escapeHtml(STATUS_STAGE[request?.status]||'מנתח')}</div>
    <div class="site-edit-files-title">קבצים מושפעים</div>
    ${fileHtml}
    ${preview}
    ${warning}
    <div class="site-edit-card-error" data-site-edit-error hidden></div>
    <div class="site-edit-actions">
      <button type="button" data-site-edit-action="approve_plan" ${awaiting?'':'disabled'}>מאשר</button>
      <button type="button" data-site-edit-action="request_revision" ${awaiting?'':'disabled'}>שנה את ההצעה</button>
      <button type="button" data-site-edit-action="cancel" ${cancellable?'':'disabled'}>בטל</button>
    </div>
  </article>`;
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

async function handleRequestAction(card,request,action){
  if(!ctx.api||card.dataset.busy==='1')return;
  card.dataset.busy='1';
  card.querySelectorAll('button').forEach(btn=>btn.disabled=true);
  const errorHost=card.querySelector('[data-site-edit-error]');
  if(errorHost){errorHost.hidden=true;errorHost.textContent=''}
  try{
    const payload={action,request_id:request.id};
    if(action==='request_revision'){
      const instructions=window.prompt('מה לשנות בהצעה?','');
      if(!instructions){card.dataset.busy='0';showRequest(request,{replace:true});return}
      payload.instructions=instructions;
    }
    const result=await ctx.api(payload);
    const next=result?.request||request;
    if(next?.id)setActiveRequestId(next.id);
    showRequest(next,{replace:true});
  }catch(error){
    card.dataset.busy='0';
    card.querySelectorAll('button').forEach(btn=>btn.disabled=false);
    if(errorHost){errorHost.textContent=editorErrorMessage(error);errorHost.hidden=false}
  }
}

function clearPoll(){
  if(pollTimer){clearTimeout(pollTimer);pollTimer=null}
}

function scheduleRequestPoll(request){
  clearPoll();
  if(!request?.id||!request?.status||STOP_POLL_STATUSES.has(request.status)||!ctx.api)return;
  pollTimer=setTimeout(async()=>{
    try{
      const result=await ctx.api({action:'refresh_status',request_id:request.id});
      const fresh=result?.request;
      if(!fresh)return;
      activeRequestData=fresh;
      showRequest(fresh,{replace:true,poll:false});
      scheduleRequestPoll(fresh);
    }catch{
      clearPoll();
    }
  },3000);
}

function ensureHistoryPanel(){
  const drawer=document.getElementById('site-chat-drawer');
  if(!drawer)return null;
  let panel=drawer.querySelector('[data-site-editor-history-panel]');
  if(panel)return panel;
  panel=document.createElement('section');
  panel.className='site-editor-history-panel';
  panel.dataset.siteEditorHistoryPanel='1';
  panel.hidden=true;
  panel.innerHTML='<div class="site-editor-history-head"><strong>שינויים באתר</strong><button type="button" data-site-editor-history-close>חזרה לצ׳אט</button></div><div class="site-editor-history-list" data-site-editor-history-list></div>';
  const head=drawer.querySelector('.site-chat-head');
  head?.insertAdjacentElement('afterend',panel);
  panel.querySelector('[data-site-editor-history-close]').onclick=()=>{
    panel.hidden=true;
    drawer.classList.remove('site-editor-history-open');
  };
  return panel;
}

async function showChanges(){
  const panel=ensureHistoryPanel();
  const drawer=document.getElementById('site-chat-drawer');
  const list=panel?.querySelector('[data-site-editor-history-list]');
  if(!panel||!drawer||!list||!ctx.api)return;
  panel.hidden=false;
  drawer.classList.add('site-editor-history-open');
  list.innerHTML='<div class="site-edit-files-empty">טוען שינויים…</div>';
  try{
    const result=await ctx.api({action:'list_requests'});
    const requests=Array.isArray(result?.requests)?result.requests:[];
    list.innerHTML='';
    if(!requests.length){
      list.innerHTML='<div class="site-edit-files-empty">עדיין אין שינויים באתר.</div>';
      return;
    }
    for(const request of requests)renderRequestCard(request,list);
    const running=requests.find(request=>request?.status&&!STOP_POLL_STATUSES.has(request.status));
    if(running){
      activeRequestData=running;
      setActiveRequestId(running.id);
      scheduleRequestPoll(running);
    }
  }catch(error){
    list.innerHTML='<div class="site-edit-card-error">'+escapeHtml(editorErrorMessage(error))+'</div>';
  }
}

function renderRequestCard(request,host){
  if(!request?.id||!host)return null;
  const wrap=document.createElement('div');
  wrap.innerHTML=requestCardMarkup(request);
  const card=wrap.firstElementChild;
  card.querySelectorAll('[data-site-edit-action]').forEach(btn=>{
    btn.addEventListener('click',()=>handleRequestAction(card,request,btn.dataset.siteEditAction));
  });
  host.appendChild(card);
  return card;
}

function showRequest(request,{replace=false,poll=true}={}){
  if(!request?.id)return null;
  activeRequestData=request;
  setActiveRequestId(request.id);
  const historyList=document.querySelector('[data-site-editor-history-list]');
  const historyOpen=!document.querySelector('[data-site-editor-history-panel]')?.hidden;
  const host=historyOpen&&historyList?historyList:document.getElementById('site-chat-body');
  if(!host)return null;
  const selector='[data-site-edit-request="'+CSS.escape(String(request.id))+'"]';
  const existing=host.querySelector(selector);
  if(existing&&replace)existing.remove();
  else if(existing){if(poll)scheduleRequestPoll(request);return existing}
  const card=renderRequestCard(request,host);
  if(poll)scheduleRequestPoll(request);
  return card;
}

function install({chatState,api,pageContext}={}){
  ctx={chatState:chatState||null,api:api||null,pageContext:pageContext||null};
  installed=true;
  renderModeControls();
  renderSelectionChip();
  ensureHistoryPanel();
  const observer=new MutationObserver(()=>{
    if(!document.querySelector('[data-site-editor-modes]'))renderModeControls();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  return window.SiteEditorUI;
}

function setActiveRequestId(id){
  activeRequest=id?String(id):null;
  return activeRequest;
}

window.SiteEditorUI={
  install,
  mode:()=>currentMode,
  setMode,
  activeRequestId:()=>activeRequest,
  setActiveRequestId,
  installed:()=>installed,
  renderRequestCard,
  showRequest,
  editorErrorMessage,
  showChanges,
  selectedElementContext,
  selectedElement:()=>selectedElement,
  beginInspect,
  clearSelectedElement
};
})();