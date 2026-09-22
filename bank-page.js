const bankPageState={
  items:[],
  query:'',
  type:'',
  favoritesOnly:false,
  folderId:'',
  manager:false,
  editingId:null
};

function bankTypeName(type){
  const names={
    verse:'פסוק',quote:'ציטוט',book:'ספר',idea:'רעיון',scene:'סצנה',
    character:'דמות',exercise:'תרגיל',language:'שפה',music:'מוזיקה'
  };
  return names[type]||type||'תוכן';
}

function bankTypeIcon(type){
  const icons={verse:'📖',quote:'💬',book:'📚',idea:'💡',scene:'🎬',character:'🐇',exercise:'🏐',language:'🌍',music:'🎵'};
  return icons[type]||'🗂️';
}

function itemSearchText(item){
  return [item.title,item.slug,item.item_type,JSON.stringify(item.content||{})].join(' ').toLowerCase();
}

function selectedFolderItemIds(){
  if(!bankPageState.folderId) return null;
  return new Set(
    bankState.folderItems
      .filter(x=>x.folder_id===bankPageState.folderId)
      .map(x=>x.item_id)
  );
}

function bankPageMatches(item){
  if(bankPageState.type && item.item_type!==bankPageState.type) return false;
  if(bankPageState.favoritesOnly && !bankState.favorites.has(item.id)) return false;
  const folderIds=selectedFolderItemIds();
  if(folderIds && !folderIds.has(item.id)) return false;
  const q=bankPageState.query.trim().toLowerCase();
  return !q || itemSearchText(item).includes(q);
}

function bankManagerControls(item){
  if(!bankPageState.manager) return '';
  return `
    <button class="bank-btn" data-manage-action="edit" data-item-id="${bankEsc(item.id)}">✏️ ערוך</button>
    <button class="bank-btn danger" data-manage-action="archive" data-item-id="${bankEsc(item.id)}">🗄️ ארכב</button>`;
}

function bankBaseActions(item){
  const favorited=bankState.favorites.has(item.id);
  return `
    <div class="bank-actions">
      <button class="bank-btn ${favorited?'active':''}" data-bank-action="favorite">${favorited?'♥ מועדף':'♡ מועדף'}</button>
      <button class="bank-btn" data-bank-action="folder">📁 תיקייה</button>
      ${bankManagerControls(item)}
    </div>`;
}

function bankNoteHtml(item){
  const note=bankState.notes.get(item.id)||'';
  return `
    <div class="bank-note-row">
      <textarea class="bank-input" rows="2" data-bank-note placeholder="✍️ הערה אישית">${bankEsc(note)}</textarea>
      <div><button class="bank-btn" data-bank-action="save-note">שמור הערה</button></div>
    </div>`;
}

function bankVerseCard(item,index){
  const c=item.content||{};
  return `
    <article class="card" data-bank-id="${bankEsc(item.id)}">
      <div class="label">📖 פסוק ${index+1}</div>
      <div class="verse">“${bankEsc(c.verse||item.title)}”</div>
      <div class="meta">${bankEsc(c.reference||'')}</div>
      ${c.literary?`<details><summary>פירוש ספרותי</summary><p>${bankEsc(c.literary)}</p></details>`:''}
      ${c.human?`<details><summary>מבט אנושי</summary><p>${bankEsc(c.human)}</p></details>`:''}
      ${c.raika_context?`<details><summary>החיבור לעולם ראיקה</summary><p>${bankEsc(c.raika_context)}</p></details>`:''}
      ${c.character_quote?`<details><summary>משפט הדמות</summary><p>${bankEsc(c.character_quote)}</p></details>`:''}
      ${bankBaseActions(item)}
      ${bankNoteHtml(item)}
    </article>`;
}

function genericPreview(item){
  const c=item.content||{};
  const value=c.text||c.description||c.summary||c.body||c.category||'';
  if(Array.isArray(value)) return value.join(' · ');
  return String(value||'');
}

function bankGenericCard(item){
  const preview=genericPreview(item);
  return `
    <article class="card" data-bank-id="${bankEsc(item.id)}">
      <div class="label">${bankTypeIcon(item.item_type)} ${bankEsc(bankTypeName(item.item_type))}</div>
      <h3>${bankEsc(item.title||'ללא כותרת')}</h3>
      ${preview?`<p class="meta bank-preview">${bankEsc(preview)}</p>`:''}
      ${bankBaseActions(item)}
      ${bankNoteHtml(item)}
    </article>`;
}

function renderBankDashboard(){
  const wrap=document.getElementById('bank-dashboard');
  if(!wrap) return;
  const counts={};
  bankPageState.items.forEach(item=>counts[item.item_type]=(counts[item.item_type]||0)+1);
  const cards=[{type:'',label:'כל הבנק',count:bankPageState.items.length},...Object.keys(counts).sort().map(type=>({type,label:bankTypeName(type),count:counts[type]}))];
  wrap.innerHTML=cards.map(x=>`
    <button class="bank-stat ${bankPageState.type===x.type?'active':''}" data-dashboard-type="${bankEsc(x.type)}">
      <span class="bank-stat-number">${x.count}</span>
      <span class="bank-stat-label">${x.type?bankTypeIcon(x.type)+' ':''}${bankEsc(x.label)}</span>
    </button>`).join('');
}

function renderBankFilters(){
  const typeSelect=document.getElementById('bank-type');
  if(typeSelect && typeSelect.options.length===1){
    [...new Set(bankPageState.items.map(x=>x.item_type).filter(Boolean))].sort().forEach(type=>{
      const o=document.createElement('option');o.value=type;o.textContent=bankTypeName(type);typeSelect.appendChild(o);
    });
  }
  if(typeSelect) typeSelect.value=bankPageState.type;

  const folderSelect=document.getElementById('bank-folder-filter');
  if(folderSelect){
    folderSelect.innerHTML='<option value="">כל התיקיות</option>'+bankState.folders.map(f=>`<option value="${bankEsc(f.id)}">${bankEsc(f.name)}</option>`).join('');
    folderSelect.value=bankPageState.folderId;
  }

  const fav=document.getElementById('bank-favorites-filter');
  if(fav) fav.classList.toggle('active',bankPageState.favoritesOnly);
  const clear=document.getElementById('bank-clear');
  if(clear) clear.classList.toggle('show',Boolean(bankPageState.query||bankPageState.type||bankPageState.favoritesOnly||bankPageState.folderId));
}

function renderBankList(){
  const list=document.getElementById('bank-list');
  const status=document.getElementById('bank-status');
  const filtered=bankPageState.items.filter(bankPageMatches);
  if(status) status.textContent=`${filtered.length} פריטים מוצגים מתוך ${bankPageState.items.length}`;
  if(!list) return;
  if(!filtered.length){
    list.innerHTML='<article class="card">לא נמצאו פריטים מתאימים.</article>';
    return;
  }
  list.innerHTML=filtered.map((item,index)=>item.item_type==='verse'?bankVerseCard(item,index):bankGenericCard(item)).join('');
}

function parseJerusalemDate(dateString){
  const [y,m,d]=dateString.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d,12));
}

function addDays(dateString,delta){
  const d=parseJerusalemDate(dateString);
  d.setUTCDate(d.getUTCDate()+delta);
  const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,'0'),day=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function dailyVerseSelectionForDate(items,dateString){
  return dailyVerseSelection(items,parseJerusalemDate(dateString));
}

function miniVerse(item){
  const c=item.content||{};
  return `<article class="card compact-verse"><div class="verse">“${bankEsc(c.verse||item.title)}”</div><div class="meta">${bankEsc(c.reference||'')}</div></article>`;
}

function renderTodayAndHistory(){
  const verses=bankPageState.items.filter(x=>x.item_type==='verse');
  const today=jerusalemDateString();
  const todayWrap=document.getElementById('bank-today-verses');
  if(todayWrap){
    const picked=dailyVerseSelectionForDate(verses,today);
    todayWrap.innerHTML=picked.length?picked.map((x,i)=>bankVerseCard(x,i)).join(''):'<article class="card">אין מספיק פסוקים בבנק.</article>';
  }

  const history=document.getElementById('verse-history');
  if(history){
    const days=[];
    for(let i=1;i<=14;i++){
      const date=addDays(today,-i);
      const items=dailyVerseSelectionForDate(verses,date);
      days.push({date,items});
    }
    history.innerHTML=days.map((day,index)=>`
      <details class="history-day" ${index===0?'open':''}>
        <summary>${bankEsc(day.date)} · ${day.items.length} פסוקים</summary>
        <div class="history-verse-grid">${day.items.map(miniVerse).join('')}</div>
      </details>`).join('');
  }
}

function renderManagerState(){
  const status=document.getElementById('manager-status');
  const add=document.getElementById('bank-add-item');
  const login=document.getElementById('bank-manager-login');
  if(status) status.textContent=bankPageState.manager?'🔓 מצב ניהול פעיל':'🔒 צפייה בלבד';
  if(add) add.hidden=!bankPageState.manager;
  if(login) login.textContent=bankPageState.manager?'🔓 ניהול פעיל':'🔐 מצב ניהול';
}

function renderAll(){
  renderBankDashboard();
  renderBankFilters();
  renderBankList();
  renderTodayAndHistory();
  renderManagerState();
}

async function loadBankPage(){
  ensureBankCss();
  try{
    const url=`${BANK_URL}/rest/v1/content_items?status=eq.published&visibility=eq.public&select=id,item_type,slug,title,content,updated_at,created_at&order=created_at.desc`;
    const response=await fetch(url,{headers:{apikey:BANK_PUBLISHABLE_KEY}});
    if(!response.ok) throw new Error(`קריאת הבנק נכשלה (${response.status})`);
    const items=await response.json();
    bankPageState.items=items;
    bankState.items=items;
    bankPageState.manager=false;

    if(bankStoredKey()){
      try{
        await bankWrite({action:'ping'});
        bankPageState.manager=true;
        await bankSnapshot(true).catch(()=>{});
      }catch(err){
        localStorage.removeItem(BANK_EDITOR_KEY);
        bankState.snapshotLoaded=false;
      }
    }else{
      await bankSnapshot().catch(()=>{});
    }

    renderAll();
  }catch(err){
    console.error(err);
    document.getElementById('bank-status').textContent='לא ניתן כרגע לקרוא את הבנק.';
    document.getElementById('bank-list').innerHTML='<article class="card">הבנק אינו זמין כרגע.</article>';
  }
}

async function refreshBank(){
  bankState.snapshotLoaded=false;
  await loadBankPage();
}

function openManagerAccess(message=''){
  const overlay=document.getElementById('bank-manager-access');
  const input=document.getElementById('manager-key');
  const error=document.getElementById('manager-access-error');

  if(!overlay) return;

  if(input) input.value='';
  if(error){
    error.textContent=message;
    error.hidden=!message;
  }

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');

  setTimeout(()=>input?.focus(),0);
}

function closeManagerAccess(){
  const overlay=document.getElementById('bank-manager-access');
  if(!overlay) return;

  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}

async function submitManagerAccess(){
  const input=document.getElementById('manager-key');
  const error=document.getElementById('manager-access-error');
  const button=document.getElementById('manager-access-submit');
  const key=(input?.value||'').trim();

  if(!key){
    if(error){
      error.textContent='צריך להכניס קוד עריכה.';
      error.hidden=false;
    }
    input?.focus();
    return;
  }

  if(button){
    button.disabled=true;
    button.textContent='מתחבר…';
  }

  localStorage.setItem(BANK_EDITOR_KEY,key);
  bankState.snapshotLoaded=false;

  try{
    await bankWrite({action:'ping'});
    bankPageState.manager=true;
    await bankSnapshot(true).catch(()=>{});
    closeManagerAccess();
    renderAll();
    toast('מצב עריכה הופעל');
  }catch(err){
    localStorage.removeItem(BANK_EDITOR_KEY);
    bankPageState.manager=false;
    renderManagerState();

    if(error){
      error.textContent=err.message||'קוד העריכה אינו תקין';
      error.hidden=false;
    }

    input?.focus();
  }finally{
    if(button){
      button.disabled=false;
      button.textContent='🔓 כניסה לעריכה';
    }
  }
}

async function enableManager(){
  if(bankPageState.manager){
    localStorage.removeItem(BANK_EDITOR_KEY);
    bankState.snapshotLoaded=false;
    bankPageState.manager=false;
    renderAll();
    toast('מצב עריכה נסגר');
    return;
  }

  const stored=bankStoredKey();

  if(!stored){
    openManagerAccess();
    return;
  }

  try{
    await bankWrite({action:'ping'});
    bankPageState.manager=true;
    await bankSnapshot(true).catch(()=>{});
    renderAll();
    toast('מצב עריכה הופעל');
  }catch(err){
    localStorage.removeItem(BANK_EDITOR_KEY);
    bankState.snapshotLoaded=false;
    bankPageState.manager=false;
    renderManagerState();
    openManagerAccess('הקוד השמור כבר אינו תקין. הכנס את קוד העריכה החדש.');
  }
}

function formValue(id){return document.getElementById(id)?.value.trim()||'';}

function updateEditorVisibility(){
  const type=formValue('editor-type');
  document.querySelectorAll('[data-editor-for]').forEach(el=>{
    const allowed=el.dataset.editorFor.split(',');
    el.hidden=!allowed.includes(type);
  });
}

function openItemEditor(item=null){
  bankPageState.editingId=item?.id||null;
  const c=item?.content||{};
  document.getElementById('editor-title-text').textContent=item?'עריכת פריט':'הוספת פריט';
  document.getElementById('editor-type').value=item?.item_type||'verse';
  document.getElementById('editor-type').disabled=Boolean(item);
  document.getElementById('editor-title').value=item?.title||'';
  document.getElementById('editor-reference').value=c.reference||'';
  document.getElementById('editor-literary').value=c.literary||'';
  document.getElementById('editor-human').value=c.human||'';
  document.getElementById('editor-raika').value=c.raika_context||'';
  document.getElementById('editor-quote').value=c.character_quote||'';
  document.getElementById('editor-generic').value=c.summary||c.text||c.description||c.body||'';
  updateEditorVisibility();
  document.getElementById('bank-editor').classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeItemEditor(){
  document.getElementById('bank-editor').classList.add('hidden');
  document.body.classList.remove('modal-open');
  bankPageState.editingId=null;
}

function editorContent(type,existing={}){
  if(type==='verse'){
    return {...existing,
      verse:formValue('editor-title'),
      reference:formValue('editor-reference'),
      literary:formValue('editor-literary'),
      human:formValue('editor-human'),
      raika_context:formValue('editor-raika'),
      character_quote:formValue('editor-quote')
    };
  }
  const value=formValue('editor-generic');
  if(type==='book') return {...existing,summary:value};
  return {...existing,text:value};
}

async function saveEditor(){
  const type=formValue('editor-type');
  const title=formValue('editor-title');
  if(!title){toast('צריך כותרת');return;}
  const existing=bankPageState.items.find(x=>x.id===bankPageState.editingId);
  const content=editorContent(type,existing?.content||{});
  try{
    if(existing){
      await bankWrite({action:'update_item',item_id:existing.id,title,content});
      toast('הפריט עודכן');
    }else{
      await bankWrite({action:'create_item',item_type:type,title,content});
      toast('הפריט נוסף לבנק');
    }
    closeItemEditor();
    await refreshBank();
  }catch(err){
    console.error(err);toast(err.message||'השמירה נכשלה');
  }
}

async function archiveItem(itemId){
  const item=bankPageState.items.find(x=>x.id===itemId);
  if(!item) return;
  if(!confirm(`להעביר לארכיון את “${item.title}”?`)) return;
  try{
    await bankWrite({action:'archive_item',item_id:itemId});
    toast('הפריט הועבר לארכיון');
    await refreshBank();
  }catch(err){
    console.error(err);toast(err.message||'הארכוב נכשל');
  }
}

document.addEventListener('click',async e=>{
  const dash=e.target.closest('[data-dashboard-type]');
  if(dash){bankPageState.type=dash.dataset.dashboardType||'';renderAll();return;}

  const manage=e.target.closest('[data-manage-action]');
  if(manage){
    const action=manage.dataset.manageAction,itemId=manage.dataset.itemId;
    if(action==='edit') openItemEditor(bankPageState.items.find(x=>x.id===itemId));
    if(action==='archive') await archiveItem(itemId);
    return;
  }
});

document.getElementById('bank-search')?.addEventListener('input',e=>{bankPageState.query=e.target.value;renderBankList();renderBankFilters();});
document.getElementById('bank-type')?.addEventListener('change',e=>{bankPageState.type=e.target.value;renderAll();});
document.getElementById('bank-folder-filter')?.addEventListener('change',e=>{bankPageState.folderId=e.target.value;renderBankList();renderBankFilters();});
document.getElementById('bank-favorites-filter')?.addEventListener('click',()=>{bankPageState.favoritesOnly=!bankPageState.favoritesOnly;renderBankList();renderBankFilters();});
document.getElementById('bank-clear')?.addEventListener('click',()=>{
  bankPageState.query='';bankPageState.type='';bankPageState.favoritesOnly=false;bankPageState.folderId='';
  document.getElementById('bank-search').value='';renderAll();
});
document.getElementById('bank-manager-login')?.addEventListener('click',enableManager);
document.getElementById('manager-access-submit')?.addEventListener('click',submitManagerAccess);
document.getElementById('manager-access-close')?.addEventListener('click',closeManagerAccess);
document.getElementById('manager-access-cancel')?.addEventListener('click',closeManagerAccess);
document.getElementById('manager-key')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    submitManagerAccess();
  }
});
document.getElementById('bank-manager-access')?.addEventListener('click',e=>{
  if(e.target.id==='bank-manager-access') closeManagerAccess();
});
document.getElementById('bank-add-item')?.addEventListener('click',()=>openItemEditor());
document.getElementById('editor-close')?.addEventListener('click',closeItemEditor);
document.getElementById('editor-cancel')?.addEventListener('click',closeItemEditor);
document.getElementById('editor-save')?.addEventListener('click',saveEditor);
document.getElementById('editor-type')?.addEventListener('change',updateEditorVisibility);
document.getElementById('bank-editor')?.addEventListener('click',e=>{if(e.target.id==='bank-editor')closeItemEditor();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    closeManagerAccess();
    closeItemEditor();
  }
});

loadBankPage();
