(()=>{
'use strict';
if(window.SiteEditorUI)return;

const MODE_KEY='site-editor-mode';
const MODES=['consult','edit','work'];
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
  installed:()=>installed
};
})();