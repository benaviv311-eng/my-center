// ===== הבנק המרכזי: פסוקים, עריכות, מועדפים ותיקיות =====
const BANK_URL='https://iwemlxvjyhffumzcqrxf.supabase.co';
const BANK_PUBLISHABLE_KEY='sb_publishable_pU7OWc6Yoba6xQIYYROAxg_pJAliQDk';
const BANK_FUNCTION=`${BANK_URL}/functions/v1/content-bank`;
const BANK_EDITOR_KEY='my-center-editor-key';
const localRenderDailyVerses=renderDailyVerses;
const bankState={items:[],favorites:new Set(),folders:[],folderItems:[],notes:new Map(),snapshotLoaded:false};

function bankEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function bankCss(){
  if(document.getElementById('bank-css')) return;
  const style=document.createElement('style');
  style.id='bank-css';
  style.textContent=`
  .bank-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
  .bank-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
  .bank-btn{border:1px solid #ddd3c4;background:#fffdf8;border-radius:10px;padding:8px 10px;font:inherit;cursor:pointer}
  .bank-btn.active{background:#ffe8ec;border-color:#efbdc6}
  .bank-note-row{margin-top:12px;padding-top:12px;border-top:1px dashed #ded4c5;display:grid;gap:7px}
  .bank-input,.bank-edit textarea{width:100%;box-sizing:border-box;border:1px solid #ded4c5;background:#fffefb;border-radius:11px;padding:9px 10px;font:inherit;line-height:1.45;resize:vertical}
  .bank-edit{margin-top:10px;padding:11px;background:#faf7ff;border:1px solid #ded4ef;border-radius:12px;display:grid;gap:9px}
  .bank-edit[hidden]{display:none}
  .bank-edit label{display:grid;gap:5px;font-size:13px;font-weight:700}
  .bank-sync{font-size:11px;opacity:.65}
  .bank-loading{padding:18px;text-align:center;opacity:.7}`;
  document.head.appendChild(style);
}

async function bankPublicVerses(){
  const url=`${BANK_URL}/rest/v1/content_items?item_type=eq.verse&status=eq.published&visibility=eq.public&select=id,slug,title,content,updated_at&order=created_at.asc`;
  const r=await fetch(url,{headers:{apikey:BANK_PUBLISHABLE_KEY}});
  if(!r.ok) throw new Error(`קריאת הבנק נכשלה (${r.status})`);
  return r.json();
}

function bankStoredKey(){
  return localStorage.getItem(BANK_EDITOR_KEY)||'';
}

async function bankGetEditorKey(){
  let key=bankStoredKey();
  if(!key){
    key=(prompt('הכנס קוד עריכה פרטי כדי לשמור בענן:')||'').trim();
    if(!key) throw new Error('לא הוזן קוד עריכה');
    localStorage.setItem(BANK_EDITOR_KEY,key);
  }
  return key;
}

async function bankWrite(payload){
  const key=await bankGetEditorKey();
  const r=await fetch(BANK_FUNCTION,{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'apikey':BANK_PUBLISHABLE_KEY,
      'x-editor-key':key
    },
    body:JSON.stringify(payload)
  });

  const data=await r.json().catch(()=>({}));

  if(r.status===401){
    localStorage.removeItem(BANK_EDITOR_KEY);
    bankState.snapshotLoaded=false;
    throw new Error('קוד העריכה אינו תקין. נסה שוב.');
  }

  if(!r.ok||data.error)
    throw new Error(data.error||`שמירה נכשלה (${r.status})`);

  return data;
}

async function bankSnapshot(force=false){
  if(bankState.snapshotLoaded&&!force) return;
  if(!bankStoredKey()) return;

  const s=await bankWrite({action:'snapshot'});

  bankState.favorites=new Set((s.favorites||[]).map(x=>x.item_id));
  bankState.folders=s.folders||[];
  bankState.folderItems=s.folder_items||[];
  bankState.notes=new Map((s.notes||[]).map(x=>[x.item_id,x.note_text||'']));
  bankState.snapshotLoaded=true;
}

function bankToolbar(){
  const wrap=document.getElementById('daily-verses');

  if(!wrap||document.getElementById('bank-toolbar')) return;

  const bar=document.createElement('div');
  bar.id='bank-toolbar';
  bar.className='bank-toolbar';

  bar.innerHTML=`
    <button class="bank-btn" id="bank-folders-btn">📁 התיקיות שלי</button>
    <button class="bank-btn" id="bank-favs-btn">♥ המועדפים שלי</button>
    <span class="bank-sync">☁ נשמר בבנק המרכזי</span>
  `;

  wrap.parentNode.insertBefore(bar,wrap);
}

function bankRenderCard(x,i){
  const c=x.content||{};
  const fav=bankState.favorites.has(x.id);
  const note=bankState.notes.get(x.id)||'';

  return `<article class="card" data-bank-id="${x.id}">
    <div class="label">פסוק ${i+1}</div>

    <div class="verse">“${bankEsc(c.verse||x.title)}”</div>
    <div class="meta">${bankEsc(c.reference||'')}</div>

    <details>
      <summary>פירוש ספרותי</summary>
      <p>${bankEsc(c.literary||'')}</p>
    </details>

    <details>
      <summary>מבט אנושי</summary>
      <p>${bankEsc(c.human||'')}</p>
    </details>

    <details>
      <summary>החיבור לעולם ראיקה</summary>
      <p class="bank-context">${bankEsc(c.raika_context||'')}</p>
    </details>

    <details>
      <summary>משפט שהדמות הייתה אומרת</summary>
      <p class="bank-quote">${bankEsc(c.character_quote||'')}</p>
    </details>

    <div class="bank-actions">
      <button class="bank-btn bank-fav ${fav?'active':''}" data-bank-action="favorite">
        ${fav?'♥ מועדף':'♡ מועדף'}
      </button>

      <button class="bank-btn" data-bank-action="folder">📁 תיקייה</button>

      <button class="bank-btn" data-bank-action="edit">✏️ ערוך הקשר</button>
    </div>

    <div class="bank-edit" hidden>
      <label>
        החיבור לעולם ראיקה
        <textarea rows="3" data-bank-field="raika_context">${bankEsc(c.raika_context||'')}</textarea>
      </label>

      <label>
        משפט שהדמות הייתה אומרת
        <textarea rows="2" data-bank-field="character_quote">${bankEsc(c.character_quote||'')}</textarea>
      </label>

      <div>
        <button class="bank-btn" data-bank-action="save-edit">💾 שמור שינוי</button>
      </div>
    </div>

    <div class="bank-note-row">
      <textarea
        class="bank-input"
        rows="2"
        data-bank-note
        placeholder="✍️ שורת עריכה / הערה אישית">${bankEsc(note)}</textarea>

      <div>
        <button class="bank-btn" data-bank-action="save-note">שמור הערה</button>
      </div>
    </div>
  </article>`;
}

renderDailyVerses=async function(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;

  bankCss();
  bankToolbar();

  wrap.innerHTML='<div class="bank-loading">טוען פסוקים מהבנק…</div>';

  try{
    const all=await bankPublicVerses();
    bankState.items=all;

    await bankSnapshot().catch(()=>{});

    if(!all.length)
      throw new Error('אין פסוקים בבנק');

    const now=new Date();

    const day=Math.floor(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )/86400000
    );

    const start=(day*3)%all.length;

    const picked=[0,1,2].map(
      j=>all[(start+j)%all.length]
    );

    wrap.innerHTML=picked.map(bankRenderCard).join('');

  }catch(err){
    console.error(err);

    toast('הבנק לא זמין — מוצגת גרסה מקומית');

    localRenderDailyVerses();
  }
};

async function bankChooseFolder(itemId){
  await bankSnapshot(true);

  const list=bankState.folders
    .map((f,i)=>`${i+1}. ${f.name}`)
    .join('\n');

  const answer=(prompt(
`${list||'אין עדיין תיקיות.'}

כתוב מספר תיקייה,
או +שם כדי ליצור תיקייה חדשה:`
  )||'').trim();

  if(!answer) return;

  let folder;

  if(answer.startsWith('+')){
    const name=answer.slice(1).trim();

    if(!name) return;

    const r=await bankWrite({
      action:'create_folder',
      name
    });

    folder=r.folder;

    bankState.folders.push(folder);

  }else{
    const n=Number(answer);

    if(
      !Number.isInteger(n)||
      n<1||
      n>bankState.folders.length
    ){
      throw new Error('מספר תיקייה לא תקין');
    }

    folder=bankState.folders[n-1];
  }

  await bankWrite({
    action:'add_to_folder',
    item_id:itemId,
    folder_id:folder.id
  });

  toast(`נשמר בתיקייה: ${folder.name}`);
}

async function bankShowFolders(){
  await bankSnapshot(true);

  if(!bankState.folders.length){
    toast('עדיין אין תיקיות');
    return;
  }

  const lines=bankState.folders.map(f=>{
    const count=bankState.folderItems
      .filter(x=>x.folder_id===f.id).length;

    return `📁 ${f.name} — ${count} פריטים`;
  });

  alert(lines.join('\n'));
}

async function bankShowFavorites(){
  await bankSnapshot(true);

  const names=bankState.items
    .filter(x=>bankState.favorites.has(x.id))
    .map(x=>`♥ ${x.title}`);

  alert(
    names.length
      ? names.join('\n')
      : 'עדיין אין פסוקים במועדפים'
  );
}

showFavorites=async function(){
  try{
    await bankShowFavorites();
  }catch(e){
    toast(e.message);
  }
};

document.addEventListener('click',async e=>{

  const folders=e.target.closest('#bank-folders-btn');

  if(folders){
    try{
      await bankShowFolders();
    }catch(err){
      toast(err.message);
    }
    return;
  }

  const favs=e.target.closest('#bank-favs-btn');

  if(favs){                
    try{
      await bankShowFavorites();
    }catch(err){
      toast(err.message);
    }
    return;
  }

  const btn=e.target.closest('[data-bank-action]');

  if(!btn) return;

  const card=btn.closest('[data-bank-id]');

  if(!card) return;

  const itemId=card.dataset.bankId;

  try{

    if(btn.dataset.bankAction==='favorite'){

      const r=await bankWrite({
        action:'toggle_favorite',
        item_id:itemId
      });

      if(r.favorited)
        bankState.favorites.add(itemId);
      else
        bankState.favorites.delete(itemId);

      btn.classList.toggle(
        'active',
        r.favorited
      );

      btn.textContent=
        r.favorited
        ?'♥ מועדף'
        :'♡ מועדף';

      toast(
        r.favorited
        ?'נשמר במועדפים'
        :'הוסר מהמועדפים'
      );
    }

    if(btn.dataset.bankAction==='folder'){
      await bankChooseFolder(itemId);
    }

    if(btn.dataset.bankAction==='edit'){
      const panel=card.querySelector('.bank-edit');
      panel.hidden=!panel.hidden;
    }

    if(btn.dataset.bankAction==='save-edit'){

      const fields={};

      card
        .querySelectorAll('[data-bank-field]')
        .forEach(el=>{
          fields[el.dataset.bankField]=el.value;
        });

      const r=await bankWrite({
        action:'update_content',
        item_id:itemId,
        fields
      });

      card.querySelector('.bank-context').textContent=
        r.item.content.raika_context||'';

      card.querySelector('.bank-quote').textContent=
        r.item.content.character_quote||'';

      const item=bankState.items
        .find(x=>x.id===itemId);

      if(item)
        item.content=r.item.content;

      card.querySelector('.bank-edit').hidden=true;

      toast('השינוי נשמר בבנק');
    }

    if(btn.dataset.bankAction==='save-note'){

      const note=
        card.querySelector('[data-bank-note]').value;

      await bankWrite({
        action:'save_note',
        item_id:itemId,
        note_text:note
      });

      bankState.notes.set(
        itemId,
        note
      );

      toast('ההערה נשמרה');
    }

  }catch(err){
    console.error(err);
    toast(err.message||'הפעולה נכשלה');
  }
});

renderDailyVerses();
