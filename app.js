const favoriteKey='my-center-favorites';
const favorites=new Set(JSON.parse(localStorage.getItem(favoriteKey)||'[]'));

function toast(msg){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=msg;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1400);
}

function refreshFavs(){
  document.querySelectorAll('.fav').forEach(btn=>{
    const id=btn.dataset.id;
    if(favorites.has(id)){
      btn.classList.add('active');
      btn.textContent='♥ נשמר';
    }else{
      btn.classList.remove('active');
      btn.textContent='♡ שמור';
    }
  });
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('.fav');
  if(!btn || btn.hasAttribute('data-bank-action')) return;

  const id=btn.dataset.id;

  if(favorites.has(id)){
    favorites.delete(id);
    toast('הוסר מהמועדפים');
  }else{
    favorites.add(id);
    toast('נשמר במועדפים');
  }

  localStorage.setItem(
    favoriteKey,
    JSON.stringify([...favorites])
  );

  refreshFavs();
});

document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.music-panel').forEach(p=>p.classList.remove('active'));

    tab.classList.add('active');

    const target=document.getElementById(tab.dataset.target);
    if(target) target.classList.add('active');
  });
});

const fallbackVerses=[
  {
    v:'"שבע יפול צדיק וקם"',
    r:'משלי כ״ד, ט״ז',
    l:'המשפט בנוי על ניגוד בין נפילה לקימה. הכוח שלו אינו בהבטחה שלא ניפול, אלא בתנועה החוזרת מן הנפילה אל העמידה.',
    h:'חוסן אינו חיים בלי כישלונות; הוא היכולת לא להפוך כישלון להגדרה עצמית.',
    c:'מתאים במיוחד לרגעים שבהם ראיקה נכשלת, מתביישת או נפגעת, אבל ממשיכה לפעול.',
    q:'ראיקה: "נפלתי. זה לא אומר שסיימתי."'
  },
  {
    v:'"טוב ארך אפים מגיבור"',
    r:'משלי ט״ז, ל״ב',
    l:'הפסוק הופך את מושג הגבורה: הכוח הגדול אינו רק לכבוש אויב, אלא לשלוט בעצמך.',
    h:'איפוק, סבלנות ושליטה עצמית יכולים להיות קשים יותר מהפעלת כוח ישיר.',
    c:'מתאים לדמות שמבינה שכוח אמיתי אינו רק יכולת לפגוע, אלא לדעת מתי לא לעשות זאת.',
    q:'נאזו: "מי שלא שולט בעצמו, לא באמת שולט בקרב."'
  },
  {
    v:'"נר לרגלי דברך ואור לנתיבתי"',
    r:'תהילים קי״ט, ק״ה',
    l:'האור אינו מאיר את כל הדרך בבת אחת; הוא מספיק לצעד הבא.',
    h:'לא תמיד צריך לדעת איך תיראה כל הדרך. לפעמים די בעקרון אחד שמכוון את ההחלטה הבאה.',
    c:'מתאים למסע שבו הדרך אינה ברורה, אבל הדמות מחזיקה בערך שמכוון אותה.',
    q:'מדושי: "לא צריך לראות את סוף הדרך כדי לדעת לאן לצעוד עכשיו."'
  },
  {
    v:'"מים עמוקים עצה בלב איש"',
    r:'משלי כ׳, ה׳',
    l:'העצה מתוארת כמים עמוקים: היא קיימת, אך דורשת ירידה פנימה כדי להגיע אליה.',
    h:'לא כל תשובה מגיעה מיד. לפעמים צריך זמן, הקשבה ושאלה טובה.',
    c:'מתאים למדושי, שמעדיף להבין לפני שהוא פועל.',
    q:'מדושי: "התשובה לא תמיד רחוקה. לפעמים היא פשוט עמוקה."'
  },
  {
    v:'"עץ חיים היא למחזיקים בה"',
    r:'משלי ג׳, י״ח',
    l:'החכמה מוצגת כעץ: דבר חי, שורשי ומזין שאפשר להיאחז בו.',
    h:'ידע הופך למשמעותי כשהוא נעשה דרך חיים ולא רק מידע.',
    c:'מתאים למסורת הלימוד והאימון שעוברת בין הדורות בעולם ראיקה.',
    q:'ראי: "מה שלמדת צריך להחזיק אותך גם כשהמורה איננו."'
  },
  {
    v:'"טובים השנים מן האחד"',
    r:'קהלת ד׳, ט׳',
    l:'הפסוק מדגיש את יתרון השותפות על פני פעולה לבד.',
    h:'חברות ועבודת צוות אינן חולשה; הן מכפילות יכולת ומקטינות בדידות.',
    c:'מתאים לקשר בין ראיקה לטומו ולרגעים שבהם עזרה הדדית משנה את התוצאה.',
    q:'טומו: "את לא חייבת לעשות הכול לבד כדי להוכיח שאת חזקה."'
  },
  {
    v:'"לב שמח ייטיב גהה"',
    r:'משלי י״ז, כ״ב',
    l:'שמחה מוצגת ככוח שמיטיב עם האדם מבפנים.',
    h:'מצב רוח אינו פותר הכול, אבל תקווה, משחק וקשר אנושי יכולים לשנות את הדרך שבה אנו נושאים קושי.',
    c:'מתאים לרגעים הקלים שטומו מביא אל תוך עולמה הרציני של ראיקה.',
    q:'טומו: "גם באמצע בלגן מותר לנו לצחוק."'
  },
  {
    v:'"כי האדם יראה לעיניים וה׳ יראה ללבב"',
    r:'שמואל א׳ ט״ז, ז׳',
    l:'הפסוק יוצר ניגוד בין מראה חיצוני לבין מה שנמצא בלב.',
    h:'רושם ראשוני, כוח ומעמד אינם מספרים לנו מי האדם באמת.',
    c:'מתאים לדמויות שנשפטות לפי מראה, משפחה או מוניטין לפני שמכירים אותן.',
    q:'ראיקה: "תסתכל עוד פעם. הפעם לא על מה שרואים מבחוץ."'
  },
  {
    v:'"לכל זמן ועת לכל חפץ"',
    r:'קהלת ג׳, א׳',
    l:'הפסוק מתאר את החיים כרצף של זמנים משתנים, שלכל אחד מהם מקום.',
    h:'לא כל שלב צריך להימשך לנצח; שינוי הוא חלק טבעי מהחיים.',
    c:'מתאים למסעות, פרידות והתחלות חדשות בעולם ראיקה.',
    q:'היקארי: "גם רגע קשה הוא רגע. הוא לא כל החיים."'
  },
  {
    v:'"חנוך לנער על פי דרכו"',
    r:'משלי כ״ב, ו׳',
    l:'הדגש הוא על דרך שמתאימה ללומד, לא רק על יעד אחיד.',
    h:'למידה טובה מתחילה מהאדם שמולנו — היכולת, הקצב והמוטיבציה שלו.',
    c:'מתאים לדרך שבה מורה טוב בעולם ראיקה אינו מנסה ליצור עותק של עצמו.',
    q:'ראי: "אני לא מלמד אותך להיות אני. אני מלמד אותך להיות את, טוב יותר."'
  },
  {
    v:'"ברזל בברזל יחד"',
    r:'משלי כ״ז, י״ז',
    l:'הדימוי הוא של חיכוך שמחדד כלי אחד באמצעות כלי אחר.',
    h:'אנשים חזקים עוזרים זה לזה להשתפר דרך אתגר, משוב ונוכחות אמיתית.',
    c:'מתאים לאימונים שבהם יריב או חבר מאלץ את ראיקה לגדול.',
    q:'ראיקה: "אם זה לא מאתגר אותי, זה גם לא מחדד אותי."'
  },
  {
    v:'"מענה רך ישיב חמה"',
    r:'משלי ט״ו, א׳',
    l:'הפסוק מציג רכות לא כחולשה אלא כדרך לשנות את כיוון העימות.',
    h:'תגובה רגועה יכולה לעצור הסלמה במקום להזין אותה.',
    c:'מתאים לדמות שבוחרת במילים מדויקות במקום בכוח מיידי.',
    q:'נאזו: "לא כל מכה עוצרים במכה."'
  }
];

function setToday(){
  const el=document.getElementById('today-date');
  if(!el) return;

  el.textContent=new Intl.DateTimeFormat('he-IL',{
    weekday:'long',
    day:'numeric',
    month:'long',
    year:'numeric'
  }).format(new Date());
}

function surpriseMe(){
  const items=[
    'רעיון: בנה אימון שבו השחקנים צריכים לבחור, לא רק לבצע.',
    'ערבית: شو بدك؟ — שו בַּדַּכּ? — מה אתה רוצה?',
    'מוזיקה: נגן פראזה של 3 צלילים בלבד וחזור עליה עם שינוי קצב.',
    'ראיקה: פתח דמות אקראית — אבל הצג רק מידע קאנוני.',
    'ספרייה: בחר רעיון אחד ושאל: איפה אני כבר משתמש בו בלי לשים לב?',
    'אימון: מעט חזרות איכותיות עם מנוחה מלאה עדיפות על הרבה חזרות עייפות כשמטרתך כוח מתפרץ.'
  ];

  const out=document.getElementById('surpriseResult');

  if(out){
    out.textContent=items[Math.floor(Math.random()*items.length)];
  }
}

function filterCards(query){
  const q=(query||'').trim().toLowerCase();

  document.querySelectorAll('[data-search]').forEach(card=>{
    card.classList.toggle(
      'hidden',
      q && !card.textContent.toLowerCase().includes(q)
    );
  });
}

/* ===== CENTRAL BANK ===== */

const BANK_URL='https://iwemlxvjyhffumzcqrxf.supabase.co';

const BANK_PUBLISHABLE_KEY=
  'sb_publishable_pU7OWc6Yoba6xQIYYROAxg_pJAliQDk';

const BANK_FUNCTION=
  `${BANK_URL}/functions/v1/content-bank`;

const BANK_EDITOR_KEY='my-center-editor-key';

const bankState={
  items:[],
  favorites:new Set(),
  folders:[],
  folderItems:[],
  notes:new Map(),
  snapshotLoaded:false
};

function bankEsc(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}

function ensureBankCss(){
  if(document.getElementById('bank-inline-css')) return;

  const style=document.createElement('style');
  style.id='bank-inline-css';

  style.textContent=`
    .bank-toolbar{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin:0 0 12px
    }

    .bank-actions{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
      margin-top:12px
    }

    .bank-btn{
      border:1px solid #ddd3c4;
      background:#fffdf8;
      border-radius:10px;
      padding:8px 10px;
      font:inherit;
      cursor:pointer
    }

    .bank-btn.active{
      background:#ffe8ec;
      border-color:#efbdc6
    }

    .bank-note-row{
      margin-top:12px;
      padding-top:12px;
      border-top:1px dashed #ded4c5;
      display:grid;
      gap:7px
    }

    .bank-input,
    .bank-edit textarea{
      width:100%;
      box-sizing:border-box;
      border:1px solid #ded4c5;
      background:#fffefb;
      border-radius:11px;
      padding:9px 10px;
      font:inherit;
      line-height:1.45;
      resize:vertical
    }

    .bank-edit{
      margin-top:10px;
      padding:11px;
      background:#faf7ff;
      border:1px solid #ded4ef;
      border-radius:12px;
      display:grid;
      gap:9px
    }

    .bank-edit[hidden]{
      display:none
    }

    .bank-edit label{
      display:grid;
      gap:5px;
      font-size:13px;
      font-weight:700
    }

    .bank-sync{
      font-size:11px;
      opacity:.65
    }

    .bank-loading{
      padding:18px;
      text-align:center;
      opacity:.7
    }
  `;

  document.head.appendChild(style);
}

function fallbackRender(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;

  const now=new Date();

  const day=Math.floor(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )/86400000
  );

  const start=(day*3)%fallbackVerses.length;

  const picked=[0,1,2].map(
    i=>fallbackVerses[(start+i)%fallbackVerses.length]
  );

  wrap.innerHTML=picked.map((x,i)=>`
    <article class="card">
      <div class="label">פסוק ${i+1}</div>
      <div class="verse">${x.v}</div>
      <div class="meta">${x.r}</div>

      <details>
        <summary>פירוש ספרותי</summary>
        <p>${x.l}</p>
      </details>

      <details>
        <summary>מבט אנושי</summary>
        <p>${x.h}</p>
      </details>

      <details>
        <summary>החיבור לעולם ראיקה</summary>
        <p>${x.c}</p>
      </details>

      <details>
        <summary>משפט שהדמות הייתה אומרת</summary>
        <p>${x.q}</p>
      </details>

      <div class="card-actions">
        <button
          class="btn small fav"
          data-id="daily-${day}-${i}">
          ♡ שמור
        </button>
      </div>
    </article>
  `).join('');

  refreshFavs();
}

async function bankPublicVerses(){
  const url=
    `${BANK_URL}/rest/v1/content_items`+
    `?item_type=eq.verse`+
    `&status=eq.published`+
    `&visibility=eq.public`+
    `&select=id,slug,title,content,updated_at,created_at`+
    `&order=created_at.asc`;

  const response=await fetch(url,{
    headers:{
      apikey:BANK_PUBLISHABLE_KEY
    }
  });

  if(!response.ok){
    throw new Error(
      `קריאת הבנק נכשלה (${response.status})`
    );
  }

  return response.json();
}

function bankStoredKey(){
  return localStorage.getItem(BANK_EDITOR_KEY)||'';
}

async function bankGetEditorKey(){
  let key=bankStoredKey();

  if(!key){
    key=(
      prompt(
        'הכנס קוד עריכה פרטי כדי לשמור בענן:'
      )||''
    ).trim();

    if(!key){
      throw new Error('לא הוזן קוד עריכה');
    }

    localStorage.setItem(
      BANK_EDITOR_KEY,
      key
    );
  }

  return key;
}

async function bankWrite(payload){
  const key=await bankGetEditorKey();

  const response=await fetch(
    BANK_FUNCTION,
    {
      method:'POST',
      headers:{
        'content-type':'application/json',
        'apikey':BANK_PUBLISHABLE_KEY,
        'x-editor-key':key
      },
      body:JSON.stringify(payload)
    }
  );

  const data=await response
    .json()
    .catch(()=>({}));

  if(response.status===401){
    localStorage.removeItem(BANK_EDITOR_KEY);
    bankState.snapshotLoaded=false;

    throw new Error('קוד העריכה אינו תקין');
  }

  if(!response.ok || data.error){
    throw new Error(
      data.error||
      `שמירה נכשלה (${response.status})`
    );
  }

  return data;
}

async function bankSnapshot(force=false){
  if(
    bankState.snapshotLoaded &&
    !force
  ){
    return;
  }

  if(!bankStoredKey()){
    return;
  }

  const snapshot=await bankWrite({
    action:'snapshot'
  });

  bankState.favorites=
    new Set(
      (snapshot.favorites||[])
        .map(x=>x.item_id)
    );

  bankState.folders=
    snapshot.folders||[];

  bankState.folderItems=
    snapshot.folder_items||[];

  bankState.notes=
    new Map(
      (snapshot.notes||[])
        .map(x=>[
          x.item_id,
          x.note_text||''
        ])
    );

  bankState.snapshotLoaded=true;
}

function bankToolbar(){
  const wrap=document.getElementById('daily-verses');

  if(
    !wrap ||
    document.getElementById('bank-toolbar')
  ){
    return;
  }

  const bar=document.createElement('div');

  bar.id='bank-toolbar';
  bar.className='bank-toolbar';

  bar.innerHTML=`
    <button
      class="bank-btn"
      id="bank-folders-btn">
      📁 התיקיות שלי
    </button>

    <button
      class="bank-btn"
      id="bank-favs-btn">
      ♥ המועדפים שלי
    </button>

    <span class="bank-sync">
      ☁ נשמר בבנק המרכזי
    </span>
  `;

  wrap.parentNode.insertBefore(
    bar,
    wrap
  );
}

function bankRenderCard(item,index){
  const content=item.content||{};

  const favorited=
    bankState.favorites.has(item.id);

  const note=
    bankState.notes.get(item.id)||'';

  return `
    <article
      class="card"
      data-bank-id="${item.id}">

      <div class="label">
        פסוק ${index+1}
      </div>

      <div class="verse">
        “${bankEsc(
          content.verse||item.title
        )}”
      </div>

      <div class="meta">
        ${bankEsc(
          content.reference||''
        )}
      </div>

      <details>
        <summary>
          פירוש ספרותי
        </summary>

        <p>
          ${bankEsc(
            content.literary||''
          )}
        </p>
      </details>

      <details>
        <summary>
          מבט אנושי
        </summary>

        <p>
          ${bankEsc(
            content.human||''
          )}
        </p>
      </details>

      <details>
        <summary>
          החיבור לעולם ראיקה
        </summary>

        <p class="bank-context">
          ${bankEsc(
            content.raika_context||''
          )}
        </p>
      </details>

      <details>
        <summary>
          משפט שהדמות הייתה אומרת
        </summary>

        <p class="bank-quote">
          ${bankEsc(
            content.character_quote||''
          )}
        </p>
      </details>

      <div class="bank-actions">

        <button
          class="bank-btn ${favorited?'active':''}"
          data-bank-action="favorite">

          ${
            favorited
              ?'♥ מועדף'
              :'♡ מועדף'
          }

        </button>

        <button
          class="bank-btn"
          data-bank-action="folder">
          📁 תיקייה
        </button>

        <button
          class="bank-btn"
          data-bank-action="edit">
          ✏️ ערוך הקשר
        </button>

      </div>

      <div class="bank-edit" hidden>

        <label>
          החיבור לעולם ראיקה

          <textarea
            rows="3"
            data-bank-field="raika_context">${bankEsc(
              content.raika_context||''
            )}</textarea>
        </label>

        <label>
          משפט שהדמות הייתה אומרת

          <textarea
            rows="2"
            data-bank-field="character_quote">${bankEsc(
              content.character_quote||''
            )}</textarea>
        </label>

        <div>
          <button
            class="bank-btn"
            data-bank-action="save-edit">
            💾 שמור שינוי
          </button>
        </div>

      </div>

      <div class="bank-note-row">

        <textarea
          class="bank-input"
          rows="2"
          data-bank-note
          placeholder="✍️ שורת עריכה / הערה אישית">${bankEsc(
            note
          )}</textarea>

        <div>
          <button
            class="bank-btn"
            data-bank-action="save-note">
            שמור הערה
          </button>
        </div>

      </div>
    </article>
  `;
}

async function renderDailyVerses(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;

  ensureBankCss();
  bankToolbar();

  wrap.innerHTML=
    '<div class="bank-loading">טוען פסוקים מהבנק…</div>';

  try{
    const all=await bankPublicVerses();

    bankState.items=all;

    await bankSnapshot()
      .catch(()=>{});

    if(!all.length){
      throw new Error('אין פסוקים בבנק');
    }

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
      i=>all[(start+i)%all.length]
    );

    wrap.innerHTML=
      picked
        .map(bankRenderCard)
        .join('');

  }catch(err){
    console.error(err);

    toast(
      'הבנק לא זמין — מוצגת גרסה מקומית'
    );

    fallbackRender();
  }
}

async function bankChooseFolder(itemId){
  await bankSnapshot(true);

  const list=
    bankState.folders
      .map(
        (folder,index)=>
          `${index+1}. ${folder.name}`
      )
      .join('\n');

  const answer=(
    prompt(
`${list||'אין עדיין תיקיות.'}

כתוב מספר תיקייה,
או +שם כדי ליצור תיקייה חדשה:`
    )||''
  ).trim();

  if(!answer) return;

  let folder;

  if(answer.startsWith('+')){
    const name=
      answer.slice(1).trim();

    if(!name) return;

    const result=
      await bankWrite({
        action:'create_folder',
        name
      });

    folder=result.folder;

    bankState.folders.push(folder);

  }else{
    const number=Number(answer);

    if(
      !Number.isInteger(number) ||
      number<1 ||
      number>bankState.folders.length
    ){
      throw new Error(
        'מספר תיקייה לא תקין'
      );
    }

    folder=
      bankState.folders[number-1];
  }

  await bankWrite({
    action:'add_to_folder',
    item_id:itemId,
    folder_id:folder.id
  });

  bankState.snapshotLoaded=false;

  toast(
    `נשמר בתיקייה: ${folder.name}`
  );
}

async function bankShowFolders(){
  await bankSnapshot(true);

  if(!bankState.folders.length){
    alert('עדיין אין תיקיות');
    return;
  }

  const lines=
    bankState.folders.map(folder=>{
      const count=
        bankState.folderItems
          .filter(
            x=>x.folder_id===folder.id
          )
          .length;

      return `📁 ${folder.name} — ${count} פריטים`;
    });

  alert(lines.join('\n'));
}

async function bankShowFavorites(){
  await bankSnapshot(true);

  const names=
    bankState.items
      .filter(
        item=>
          bankState.favorites.has(
            item.id
          )
      )
      .map(
        item=>`♥ ${item.title}`
      );

  alert(
    names.length
      ?names.join('\n')
      :'עדיין אין פסוקים במועדפים'
  );
}

async function showFavorites(){
  try{
    if(bankStoredKey()){
      await bankShowFavorites();
    }else{
      toast(
        `שמורים כרגע ${favorites.size} פריטים`
      );
    }
  }catch(err){
    toast(
      err.message||
      'לא ניתן לפתוח מועדפים'
    );
  }
}

document.addEventListener(
  'click',
  async e=>{

    const foldersButton=
      e.target.closest(
        '#bank-folders-btn'
      );

    if(foldersButton){
      try{
        await bankShowFolders();
      }catch(err){
        toast(
          err.message||
          'לא ניתן לפתוח תיקיות'
        );
      }

      return;
    }

    const favoritesButton=
      e.target.closest(
        '#bank-favs-btn'
      );

    if(favoritesButton){
      try{
        await bankShowFavorites();
      }catch(err){
        toast(
          err.message||
          'לא ניתן לפתוח מועדפים'
        );
      }

      return;
    }

    const button=
      e.target.closest(
        '[data-bank-action]'
      );

    if(!button) return;

    const card=
      button.closest(
        '[data-bank-id]'
      );

    if(!card) return;

    const itemId=
      card.dataset.bankId;

    try{
      const action=
        button.dataset.bankAction;

      if(action==='favorite'){
        const result=
          await bankWrite({
            action:'toggle_favorite',
            item_id:itemId
          });

        if(result.favorited){
          bankState.favorites.add(itemId);
        }else{
          bankState.favorites.delete(itemId);
        }

        button.classList.toggle(
          'active',
          result.favorited
        );

        button.textContent=
          result.favorited
            ?'♥ מועדף'
            :'♡ מועדף';

        toast(
          result.favorited
            ?'נשמר במועדפים'
            :'הוסר מהמועדפים'
        );
      }

      if(action==='folder'){
        await bankChooseFolder(itemId);
      }

      if(action==='edit'){
        const panel=
          card.querySelector('.bank-edit');

        panel.hidden=
          !panel.hidden;
      }

      if(action==='save-edit'){
        const fields={};

        card
          .querySelectorAll(
            '[data-bank-field]'
          )
          .forEach(el=>{
            fields[
              el.dataset.bankField
            ]=el.value;
          });

        const result=
          await bankWrite({
            action:'update_content',
            item_id:itemId,
            fields
          });

        card
          .querySelector('.bank-context')
          .textContent=
            result.item.content
              .raika_context||'';

        card
          .querySelector('.bank-quote')
          .textContent=
            result.item.content
              .character_quote||'';

        const item=
          bankState.items.find(
            x=>x.id===itemId
          );

        if(item){
          item.content=
            result.item.content;
        }

        card
          .querySelector('.bank-edit')
          .hidden=true;

        toast('השינוי נשמר בבנק');
      }

      if(action==='save-note'){
        const note=
          card
            .querySelector(
              '[data-bank-note]'
            )
            .value;

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

      toast(
        err.message||
        'הפעולה נכשלה'
      );
    }
  }
);

setToday();
renderDailyVerses();
refreshFavs();
