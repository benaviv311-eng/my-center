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
let currentMode=MODES.includes(localStorage.getItem(MODE_KEY))?localStorage.getItem(MODE_KEY):'edit';
let activeRequest=null;
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
      '<button type="button" data-site-editor-mode="work" aria-pressed="false">⚡ עבודה</button>'
    ].join('');
    toolbar.appendChild(host);
    host.addEventListener('click',event=>{
      const btn=event.target.closest('[data-site-editor-mode]');
      if(btn)setMode(btn.dataset.siteEditorMode);
    });
  }
  setMode(currentMode,{persist:false});
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
    <div class="site-edit-meta">סטטוס: ${escapeHtml(request?.status||'לא ידוע')}</div>
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

function showRequest(request,{replace=false}={}){
  if(!request?.id)return null;
  setActiveRequestId(request.id);
  const host=document.getElementById('site-chat-body');
  if(!host)return null;
  const selector='[data-site-edit-request="'+CSS.escape(String(request.id))+'"]';
  const existing=host.querySelector(selector);
  if(existing&&replace)existing.remove();
  else if(existing)return existing;
  return renderRequestCard(request,host);
}

function install({chatState,api,pageContext}={}){
  ctx={chatState:chatState||null,api:api||null,pageContext:pageContext||null};
  installed=true;
  renderModeControls();
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
  editorErrorMessage
};
})();