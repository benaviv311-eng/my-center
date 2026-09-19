(()=>{
'use strict';
if(window.SiteChat)return;
const CHAT_URL='https://iwemlxvjyhffumzcqrxf.supabase.co';
const CHAT_KEY='sb_publishable_pU7OWc6Yoba6xQIYYROAxg_pJAliQDk';
const CHAT_FUNCTION=CHAT_URL+'/functions/v1/site-chat';
const EDITOR_FUNCTION=CHAT_URL+'/functions/v1/site-editor';
const state={client:null,session:null,mode:localStorage.getItem('site-chat-mode')||'global',threadId:null,messages:[],open:false,busy:false,abort:null,consultOnly:localStorage.getItem('site-chat-consult-only')==='1',view:'chat',pendingImages:[]};
const MAX_CHAT_IMAGES=4;
const MAX_CHAT_IMAGE_BYTES=6*1024*1024;
const CHAT_IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function currentArea(){
  const p=location.pathname.split('/').pop()||'index.html';
  if(p.startsWith('raika'))return {key:'raika',label:'ראיקה'};
  if(p.startsWith('coach'))return {key:'coach',label:'מאמן'};
  if(p.startsWith('volleyball'))return {key:'volleyball',label:'כדורעף'};
  if(p.startsWith('language')||p==='languages.html'||p==='four-languages.html')return {key:'languages',label:'שפות'};
  if(p.startsWith('book')||p==='library.html'||p==='content-hub.html'||p==='bank.html')return {key:'library',label:'ספרייה'};
  if(p.startsWith('music'))return {key:'music',label:'מוזיקה'};
  if(p==='memory.html')return {key:'memory',label:'זיכרון'};
  return {key:'home',label:'המרכז שלי'};
}
function pageContext(){
  const active=document.activeElement?.closest?.('[data-rp-type][data-rp-id],[data-bank-id],[data-id]')||null;
  const area=currentArea();
  const bodyText=(document.querySelector('main')?.innerText||document.querySelector('.app')?.innerText||document.body.innerText||'').replace(/\s+/g,' ').trim().slice(0,14000);
  return {pathname:location.pathname,title:document.title,heading:document.querySelector('h1')?.innerText||'',area:area.key,area_label:area.label,active_item:active?{type:active.dataset.rpType||'',id:active.dataset.rpId||active.dataset.bankId||active.dataset.id||'',text:(active.innerText||'').slice(0,1800)}:null,visible_text:bodyText};
}
function scope(){const area=currentArea();return state.mode==='global'?{scope_kind:'global',scope_key:'global'}:{scope_kind:'area',scope_key:area.key}}
async function api(body){
  if(!state.client)throw new Error('החיבור עדיין נטען');
  const {data:{session}}=await state.client.auth.getSession();
  state.session=session;
  if(!session)throw new Error('צריך להתחבר');
  const controller=new AbortController();state.abort=controller;
  const r=await fetch(CHAT_FUNCTION,{method:'POST',signal:controller.signal,headers:{apikey:CHAT_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||'הבקשה נכשלה');
  return data;
}
async function editorApi(body){
  if(!state.client)throw new Error('החיבור עדיין נטען');
  const {data:{session}}=await state.client.auth.getSession();
  state.session=session;
  if(!session)throw new Error('צריך להתחבר');
  const r=await fetch(EDITOR_FUNCTION,{method:'POST',headers:{apikey:CHAT_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){const err=new Error(data.error||'הבקשה נכשלה');err.code=data.code||'editor_unavailable';throw err}
  return data;
}
function installSiteEditorUI(){
  if(window.SiteEditorUI?.install)window.SiteEditorUI.install({chatState:state,api:editorApi,pageContext});
}
function shell(){
  if(document.getElementById('site-chat-drawer'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <button id="site-chat-fab" class="site-chat-fab" type="button" aria-label="פתח צ׳אט">💬</button>
    <div id="site-chat-backdrop" class="site-chat-backdrop"></div>
    <aside id="site-chat-drawer" class="site-chat-drawer" aria-label="צ׳אט המרכז שלי" aria-hidden="true">
      <div class="site-chat-head">
        <div class="site-chat-title-row"><div><div class="site-chat-title">העוזר שלי</div><div id="site-chat-area" class="site-chat-area"></div></div><button id="site-chat-close" class="site-chat-close" type="button">✕</button></div>
        <div class="site-chat-tabs"><button class="site-chat-tab" data-chat-mode="global" type="button">צ׳אט כללי</button><button class="site-chat-tab" data-chat-mode="area" type="button">צ׳אט האזור</button></div>
        <div class="site-chat-toolbar"><button data-chat-new type="button">＋ שיחה חדשה</button><button data-chat-threads type="button">🕘 שיחות</button><button data-chat-memory type="button">🧠 מה אתה זוכר?</button><a href="memory.html">מרכז הזיכרון</a><button data-chat-consult type="button">🛡️ ייעוץ בלבד</button></div>
      </div>
      <div id="site-chat-body" class="site-chat-body"></div>
      <form id="site-chat-form" class="site-chat-composer">
        <div id="site-chat-image-preview" class="site-chat-image-preview" aria-live="polite"></div>
        <textarea id="site-chat-input" placeholder="כתוב לי כאן…" aria-label="הודעה לצ׳אט"></textarea>
        <input id="site-chat-image-input" type="file" accept="image/*" multiple hidden>
        <div class="site-chat-send-row"><span id="site-chat-status" class="site-chat-status"></span><div class="site-chat-send-actions"><button id="site-chat-image-button" class="site-chat-attach" type="button" aria-label="צרף תמונה">📎 תמונה</button> <button id="site-chat-stop" class="site-chat-stop" type="button" hidden>עצור</button> <button class="site-chat-send" type="submit">שלח</button></div></div>
      </form>
    </aside>`);
  bind();
  updateChrome();
}
function bind(){
  document.getElementById('site-chat-fab').onclick=()=>openChat();
  document.getElementById('site-chat-close').onclick=closeChat;
  document.getElementById('site-chat-backdrop').onclick=closeChat;
  document.querySelectorAll('[data-chat-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.chatMode));
  document.querySelector('[data-chat-new]').onclick=newThread;
  document.querySelector('[data-chat-threads]').onclick=showThreads;
  document.querySelector('[data-chat-memory]').onclick=showWhatIRemember;
  document.querySelector('[data-chat-consult]').onclick=toggleConsult;
  document.getElementById('site-chat-form').onsubmit=sendMessage;
  const imageInput=document.getElementById('site-chat-image-input');
  const composer=document.getElementById('site-chat-form');
  document.getElementById('site-chat-image-button').onclick=()=>imageInput.click();
  imageInput.onchange=async()=>{await addImageFiles(imageInput.files);imageInput.value='';};
  document.getElementById('site-chat-input').addEventListener('paste',async e=>{const direct=[...(e.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));const itemFiles=[...(e.clipboardData?.items||[])].filter(i=>i.kind==='file'&&i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean);const files=[...direct,...itemFiles].filter((f,i,a)=>a.findIndex(x=>x.name===f.name&&x.size===f.size&&x.type===f.type)===i);if(files.length){e.preventDefault();await addImageFiles(files);}});
  composer.addEventListener('dragover',e=>{e.preventDefault();composer.classList.add('is-dragging');});
  composer.addEventListener('dragleave',()=>composer.classList.remove('is-dragging'));
  composer.addEventListener('drop',async e=>{e.preventDefault();composer.classList.remove('is-dragging');const files=[...(e.dataTransfer?.files||[])].filter(f=>f.type.startsWith('image/'));if(files.length)await addImageFiles(files);});
  document.getElementById('site-chat-stop').onclick=()=>{state.abort?.abort();state.busy=false;setBusy(false,'נעצר');};
  document.addEventListener('click',actionClicks);
}
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('לא הצלחתי לקרוא את התמונה'));reader.readAsDataURL(file);});
}
async function addImageFiles(files){
  for(const file of [...(files||[])]){
    if(state.pendingImages.length>=MAX_CHAT_IMAGES){setStatus('אפשר לצרף עד 4 תמונות להודעה.');break}
    if(!CHAT_IMAGE_TYPES.has(file.type)){setStatus('פורמט התמונה אינו נתמך.');continue}
    if(file.size>MAX_CHAT_IMAGE_BYTES){setStatus('כל תמונה יכולה להיות עד 6MB.');continue}
    const data_url=await fileToDataUrl(file);
    state.pendingImages.push({id:crypto.randomUUID?.()||String(Date.now()+Math.random()),name:file.name||'image',mime_type:file.type,size_bytes:file.size,data_url});
  }
  renderImagePreviews();
}
function renderImagePreviews(){
  const host=document.getElementById('site-chat-image-preview');if(!host)return;
  host.innerHTML=state.pendingImages.map(x=>`<div class="site-chat-image-preview-item"><img src="${esc(x.data_url)}" alt="תמונה מצורפת"><button type="button" data-chat-remove-image="${esc(x.id)}" aria-label="הסר תמונה">✕</button></div>`).join('');
  host.classList.toggle('has-images',state.pendingImages.length>0);
}
function messageImages(m){
  const images=m.attachments||m.image_attachments||[];
  if(!images.length)return '';
  return `<div class="site-chat-message-images">${images.map(a=>{const src=a.signed_url||a.data_url||'';return src?`<img class="site-chat-message-image" src="${esc(src)}" alt="${esc(a.file_name||a.name||'תמונה מצורפת')}" loading="lazy">`:''}).join('')}</div>`;
}
function updateChrome(){
  const area=currentArea();
  const el=document.getElementById('site-chat-area');if(el)el.textContent=state.mode==='global'?'שיחה אחת בכל האתר':'אזור: '+area.label;
  document.querySelectorAll('[data-chat-mode]').forEach(b=>b.classList.toggle('active',b.dataset.chatMode===state.mode));
  document.querySelector('[data-chat-consult]')?.classList.toggle('active',state.consultOnly);
}
async function openChat(){state.open=true;document.getElementById('site-chat-drawer')?.classList.add('open');document.getElementById('site-chat-backdrop')?.classList.add('open');document.getElementById('site-chat-drawer')?.setAttribute('aria-hidden','false');await ensureAuthView();}
function closeChat(){state.open=false;document.getElementById('site-chat-drawer')?.classList.remove('open');document.getElementById('site-chat-backdrop')?.classList.remove('open');document.getElementById('site-chat-drawer')?.setAttribute('aria-hidden','true')}
async function setMode(mode){state.mode=mode==='area'?'area':'global';localStorage.setItem('site-chat-mode',state.mode);state.threadId=null;state.view='chat';updateChrome();if(state.session)await loadHistory()}
function loginView(){
  const body=document.getElementById('site-chat-body');if(!body)return;
  body.innerHTML='<form id="site-chat-login" class="site-chat-login"><b>התחברות לצ׳אט הפרטי</b><span>השיחות והזיכרון נשמרים בענן לחשבון שלך.</span><input id="site-chat-email" type="email" autocomplete="email" placeholder="כתובת המייל שלך" required><button type="submit">שלח קישור כניסה</button><small id="site-chat-login-status"></small></form>';
  document.getElementById('site-chat-login').onsubmit=async e=>{e.preventDefault();const email=document.getElementById('site-chat-email').value.trim();const status=document.getElementById('site-chat-login-status');const {error}=await state.client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});status.textContent=error?'לא ניתן לשלוח קישור כניסה.':'קישור כניסה נשלח למייל.';};
}
async function ensureAuthView(){if(!state.client)return;const {data:{session}}=await state.client.auth.getSession();state.session=session;if(!session){loginView();return}await loadHistory()}
function renderMessages(){
  const body=document.getElementById('site-chat-body');if(!body)return;
  if(!state.messages.length){body.innerHTML='<div class="site-chat-empty">אפשר לדבר איתי על מה שמופיע בעמוד הזה, או על כל דבר ששמור באתר.</div>';return}
  body.innerHTML=state.messages.map(m=>`<div class="site-chat-message ${m.role==='user'?'user':'assistant'}"><div class="who">${m.role==='user'?'אתה':'אני'}</div>${messageImages(m)}<div>${esc(m.content).replace(/\n/g,'<br>')}</div></div>`).join('');
  const pending=state.messages.filter(m=>m.pending_action).map(m=>m.pending_action);
  pending.forEach(a=>body.insertAdjacentHTML('beforeend',actionCard(a)));
  body.scrollTop=body.scrollHeight;
}
function actionCard(a){return `<div class="site-chat-action-card" data-action-id="${esc(a.id)}"><b>שינוי שמחכה לאישור</b><div>${esc(a.label||a.kind||'פעולה באתר')}</div><div class="site-chat-action-buttons"><button type="button" data-chat-approve="${esc(a.id)}">מאשר</button><button type="button" data-chat-cancel="${esc(a.id)}">בטל</button></div></div>`}
async function loadHistory(){
  const s=scope();try{const r=await api({action:'history',...s,thread_id:state.threadId});state.threadId=r.thread_id;state.messages=(r.messages||[]).map(m=>({...m,pending_action:m.pending_action||null}));renderMessages()}catch(e){if(String(e.message).includes('להתחבר'))loginView();else setStatus(e.message)}
}
function setBusy(on,msg=''){state.busy=on;document.querySelector('.site-chat-send')?.toggleAttribute('disabled',on);document.getElementById('site-chat-stop')?.toggleAttribute('hidden',!on);setStatus(msg)}
function setStatus(msg){const el=document.getElementById('site-chat-status');if(el)el.textContent=msg||''}
async function sendMessage(e){
  e.preventDefault();if(state.busy)return;const input=document.getElementById('site-chat-input');const q=input.value.trim();if(!q&&!state.pendingImages.length)return;
  const images=state.pendingImages.map(x=>({...x}));input.value='';
  state.messages.push({role:'user',content:q||'📷 תמונה',attachments:images.map(x=>({file_name:x.name,mime_type:x.mime_type,size_bytes:x.size_bytes,data_url:x.data_url,signed_url:x.data_url}))});renderMessages();setBusy(true,'חושב…');
  try{
    const s=scope();const r=await api({action:'ask',...s,thread_id:state.threadId,message:q,image_attachments:images.map(x=>({file_name:x.name,mime_type:x.mime_type,size_bytes:x.size_bytes,data_url:x.data_url})),page_context:pageContext(),consult_only:state.consultOnly});
    state.threadId=r.thread_id;state.pendingImages=[];renderImagePreviews();
    const localUser=[...state.messages].reverse().find(m=>m.role==='user'&&m.attachments?.some(a=>a.data_url));
    if(localUser&&r.user_attachments?.length)localUser.attachments=r.user_attachments;
    state.messages.push({...r.message,pending_action:r.pending_action||null});renderMessages();setStatus(r.model?'מודל: '+r.model.replace('gpt-5.6-',''):'');
  }catch(err){if(err.name!=='AbortError')state.messages.push({role:'assistant',content:'לא הצלחתי להשלים את הבקשה: '+err.message});renderMessages()}finally{setBusy(false)}
}
async function newThread(){if(!state.session)return loginView();const r=await api({action:'new_thread',...scope(),page_context:pageContext()});state.threadId=r.thread_id;state.messages=[];state.pendingImages=[];renderImagePreviews();state.view='chat';renderMessages();setStatus('שיחה חדשה')}
async function showThreads(){
  if(!state.session)return loginView();const r=await api({action:'threads',...scope()});const body=document.getElementById('site-chat-body');body.innerHTML='<div class="site-chat-thread-list">'+(r.threads||[]).map(t=>`<button class="site-chat-thread" type="button" data-thread-id="${t.id}"><b>${esc(t.title||'שיחה')}</b><small>${new Date(t.updated_at).toLocaleString('he-IL')}</small></button>`).join('')+'</div>';body.querySelectorAll('[data-thread-id]').forEach(b=>b.onclick=async()=>{state.threadId=b.dataset.threadId;state.view='chat';await loadHistory()})}
async function showWhatIRemember(){
  if(!state.session)return loginView();const area=state.mode==='global'?'global':currentArea().key;const r=await api({action:'memories',area,limit:40});const list=r.memories||[];state.messages.push({role:'assistant',content:list.length?'אני זוכר כרגע:\n'+list.map(x=>'• '+x.content).join('\n'):'עדיין אין לי זיכרונות קבועים בנושא הזה.'});renderMessages()
}
function toggleConsult(){state.consultOnly=!state.consultOnly;localStorage.setItem('site-chat-consult-only',state.consultOnly?'1':'0');updateChrome();setStatus(state.consultOnly?'מצב ייעוץ בלבד פעיל':'מצב פעולות פעיל')}
async function actionClicks(e){
  const removeImage=e.target.closest('[data-chat-remove-image]');if(removeImage){state.pendingImages=state.pendingImages.filter(x=>x.id!==removeImage.dataset.chatRemoveImage);renderImagePreviews();return}
  const approve=e.target.closest('[data-chat-approve]'),cancel=e.target.closest('[data-chat-cancel]');
  if(!approve&&!cancel)return;
  const id=(approve||cancel).dataset.chatApprove||(approve||cancel).dataset.chatCancel;
  try{const r=await api({action:approve?'approve_action':'cancel_action',action_id:id,page_context:pageContext()});state.messages.push({role:'assistant',content:r.message|| (approve?'הפעולה בוצעה.':'הפעולה בוטלה.')});await loadHistory()}catch(err){state.messages.push({role:'assistant',content:'הפעולה לא הושלמה: '+err.message});renderMessages()}
}
async function renderMemoryCenter(){
  const host=document.getElementById('site-memory-center');if(!host||!state.client)return;
  const {data:{session}}=await state.client.auth.getSession();state.session=session;if(!session){host.innerHTML='<div class="site-chat-login"><b>כדי לראות את הזיכרון צריך להתחבר דרך כפתור הצ׳אט 💬.</b></div>';return}
  const r=await api({action:'memories',area:'all',limit:250});const items=r.memories||[];
  host.innerHTML=items.length?'<div class="site-memory-list">'+items.map(m=>`<article class="site-memory-card" data-memory-id="${m.id}"><div class="site-memory-meta">${esc(m.area||'global')} · ${esc(m.topic||'כללי')} ${m.pinned?'· 📌':''}</div><textarea rows="3">${esc(m.content)}</textarea><div class="site-memory-actions"><button data-memory-save type="button">שמור שינוי</button><button data-memory-pin type="button">${m.pinned?'הסר נעיצה':'נעץ'}</button><button data-memory-delete type="button">מחק</button></div></article>`).join('')+'</div>':'<div class="site-chat-empty">עדיין אין זיכרונות שמורים.</div>';
  host.querySelectorAll('[data-memory-save]').forEach(b=>b.onclick=async()=>{const c=b.closest('[data-memory-id]');await api({action:'memory_update',memory_id:c.dataset.memoryId,content:c.querySelector('textarea').value});b.textContent='נשמר ✓'});
  host.querySelectorAll('[data-memory-pin]').forEach(b=>b.onclick=async()=>{const c=b.closest('[data-memory-id]'),m=items.find(x=>x.id===c.dataset.memoryId);await api({action:'memory_update',memory_id:c.dataset.memoryId,pinned:!m.pinned});await renderMemoryCenter()});
  host.querySelectorAll('[data-memory-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('למחוק את הזיכרון הזה?'))return;const c=b.closest('[data-memory-id]');await api({action:'memory_delete',memory_id:c.dataset.memoryId});await renderMemoryCenter()});
}
async function init(){
  shell();
  const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  state.client=mod.createClient(CHAT_URL,CHAT_KEY);
  installSiteEditorUI();
  const {data:{session}}=await state.client.auth.getSession();state.session=session;
  state.client.auth.onAuthStateChange((_event,s)=>{state.session=s;setTimeout(()=>{if(state.open)ensureAuthView();renderMemoryCenter()},0)});
  if(state.open)await ensureAuthView();
  await renderMemoryCenter();
}
window.SiteChat={open:openChat,currentArea,page_context:pageContext};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();