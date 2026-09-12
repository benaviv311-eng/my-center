const VERSE_HISTORY_KEY='my-center-verse-history-v2';
const VERSE_NOTES_KEY='my-center-verse-notes-v2';
const MAX_VERSE_HISTORY=24;

const VERSE_CHARACTERS=[
  {id:'raika',name:'ראיקה',emoji:'⚡',lens:'התנסות, אומץ וכישלון',lines:[
    c=>`אני שומעת כאן משהו שאפשר לבדוק במעשה, לא רק להבין בראש. ${c.human||''}`,
    c=>`מבחינתי השאלה היא מה עושים אחרי הרגע הקשה. ${c.raika_context||c.human||''}`
  ]},
  {id:'rai',name:'סנסיי ראי',emoji:'🥋',lens:'משמעת, אחריות והגנה',lines:[
    c=>`הפסוק הזה מזכיר שכוח בלי משמעת אינו מספיק. ${c.human||''}`,
    c=>`כשאתה אחראי לאחרים, השאלה איננה רק מה אתה מסוגל לעשות — אלא מה נכון לעשות. ${c.raika_context||c.human||''}`
  ]},
  {id:'hikari',name:'היקארי',emoji:'🌸',lens:'חמלה, משפחה ואומץ',lines:[
    c=>`אני קוראת את הפסוק דרך היחסים שבין אנשים. ${c.human||''}`,
    c=>`לפעמים האומץ נמצא דווקא בדרך שבה אנחנו שומרים על אדם אחר. ${c.raika_context||c.human||''}`
  ]},
  {id:'medoshi',name:'מדושי',emoji:'🔮',lens:'חכמה, מוסר וכוח',lines:[
    c=>`מעניין אותי הגבול שהפסוק מציב לכוח. ${c.human||''}`,
    c=>`הפסוק אינו רק עצה; הוא שאלה מוסרית: מי אנחנו הופכים להיות כשאנחנו פועלים לפיו? ${c.literary||c.human||''}`
  ]},
  {id:'nazo',name:'נזו יוקאן',emoji:'🗡️',lens:'מורשת, נאמנות ובחירה',lines:[
    c=>`אני רואה כאן מבחן של נאמנות למה שלמדנו, במיוחד כשהבחירה קשה. ${c.human||''}`,
    c=>`מורשת אינה משהו שמקבלים בלבד; היא משהו שבוחרים אם לשאת הלאה. ${c.raika_context||c.human||''}`
  ]},
  {id:'seiran',name:'סייראן',emoji:'⛰️',lens:'סבלנות, דרך ופרספקטיבה',lines:[
    c=>`לא כל תשובה צריכה להגיע מיד. הפסוק מבקש ממני להביט בדרך הארוכה. ${c.human||''}`,
    c=>`הצעד הנכון נעשה ברור יותר כשלא ממהרים להכריע. ${c.literary||c.human||''}`
  ]},
  {id:'dokuren',name:'דוקורן',emoji:'🐍',lens:'כוח, שליטה וקריאה מנוגדת',lines:[
    c=>`אפשר לקרוא את הפסוק גם ככלי של שליטה: מי שמבין את העיקרון הזה יודע מתי לפעול ומתי להמתין. ${c.human||''}`,
    c=>`אני לא מניח שהמסר בהכרח רך. לפעמים אותו רעיון יכול להפוך ליתרון בידי מי שיודע להשתמש בו. ${c.literary||c.human||''}`
  ]}
];

let verseItems=[];
let currentVerses=[];
let cardPerspectives=[];

function jerusalemDateParts(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(date);
  const get=type=>parts.find(p=>p.type===type)?.value||'';
  return {year:Number(get('year')),month:Number(get('month')),day:Number(get('day'))};
}

function jerusalemDateString(date=new Date()){
  const p=jerusalemDateParts(date);
  return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;
}

function verseDayNumber(date=new Date()){
  const p=jerusalemDateParts(date);
  return Math.floor(Date.UTC(p.year,p.month-1,p.day)/86400000);
}

function stableVersePool(items){
  return [...items].sort((a,b)=>String(a.slug||'').localeCompare(String(b.slug||''),'en'));
}

function dailyVerseSelection(items,date=new Date()){
  const pool=stableVersePool(items);
  if(!pool.length) return [];
  const start=(verseDayNumber(date)*3)%pool.length;
  return [0,1,2].map(i=>pool[(start+i)%pool.length]).filter(Boolean);
}

function esc(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

function getVerseKey(item){
  return String(item?.id||item?.slug||item?.title||'');
}

function loadHistory(){
  try{return JSON.parse(localStorage.getItem(VERSE_HISTORY_KEY)||'[]');}catch{return [];}
}

function saveHistory(items){
  const next=[...items.map(getVerseKey),...loadHistory()].filter(Boolean);
  const unique=[...new Set(next)].slice(0,MAX_VERSE_HISTORY);
  localStorage.setItem(VERSE_HISTORY_KEY,JSON.stringify(unique));
}

function loadNotes(){
  try{return JSON.parse(localStorage.getItem(VERSE_NOTES_KEY)||'{}');}catch{return {};}
}

function chooseCharacter(excluded=[]){
  const candidates=VERSE_CHARACTERS.filter(c=>!excluded.includes(c.id));
  const pool=candidates.length?candidates:VERSE_CHARACTERS;
  return pool[Math.floor(Math.random()*pool.length)];
}

function perspectiveText(character,item,variant=0){
  const content=item?.content||{};
  const fn=character.lines[variant%character.lines.length];
  return fn(content).trim();
}

function perspectiveHtml(character,item,variant=0){
  return `<div class="perspective-block" data-character="${esc(character.id)}">
    <div class="meta"><b>${esc(character.emoji)} דרך העיניים של ${esc(character.name)}</b> · ${esc(character.lens)}</div>
    <p>${esc(perspectiveText(character,item,variant))}</p>
  </div>`;
}

function getCardPerspective(slot){
  if(!cardPerspectives[slot]){
    const used=cardPerspectives.map(p=>p?.primary?.id).filter(Boolean);
    cardPerspectives[slot]={primary:chooseCharacter(used),variant:Math.floor(Math.random()*2),extras:[]};
  }
  return cardPerspectives[slot];
}

function verseCardHtml(item,index){
  const content=item.content||{};
  const p=getCardPerspective(index);
  const notes=loadNotes();
  const note=notes[getVerseKey(item)]||'';

  return `
    <article class="card verse-card" data-slot="${index}">
      <div class="label">פסוק ${index+1}</div>
      <div class="verse">“${esc(content.verse||item.title)}”</div>
      <div class="meta">${esc(content.reference||'')}</div>
      <details><summary>פירוש ספרותי</summary><p>${esc(content.literary||'')}</p></details>
      <details><summary>מבט אנושי</summary><p>${esc(content.human||'')}</p></details>
      <details><summary>החיבור לעולם ראיקה</summary><p>${esc(content.raika_context||'')}</p></details>
      <details open class="character-perspective"><summary>דרך העיניים של ${esc(p.primary.name)}</summary>
        <div class="perspective-list">${perspectiveHtml(p.primary,item,p.variant)}${p.extras.map((x,i)=>perspectiveHtml(x,item,i+1)).join('')}</div>
        <div class="card-actions">
          <button class="btn small" onclick="refreshPerspective(${index})">🔄 רענן נקודת מבט</button>
          <button class="btn small" onclick="addPerspective(${index})">＋ עוד נקודת מבט</button>
        </div>
      </details>
      <details><summary>הערה אישית</summary>
        <textarea class="verse-note" id="verse-note-${index}" placeholder="שורת עריכה / הערה אישית">${esc(note)}</textarea>
        <div class="card-actions"><button class="btn small" onclick="saveVerseNote(${index})">שמור הערה</button></div>
      </details>
      <div class="card-actions">
        <button class="btn small fav" data-id="verse-${esc(item.id)}">♡ שמור</button>
        <button class="btn small" onclick="refreshVerse(${index})">🎲 פסוק אחר</button>
      </div>
    </article>`;
}

function renderCurrentVerses(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;
  wrap.innerHTML=currentVerses.map(verseCardHtml).join('');
  ensureRefreshAllButton();
  if(typeof refreshFavs==='function') refreshFavs();
}

function ensureRefreshAllButton(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;
  const section=wrap.closest('.section');
  const head=section?.querySelector('.section-head');
  if(!head||head.querySelector('#refresh-all-verses')) return;
  const button=document.createElement('button');
  button.id='refresh-all-verses';
  button.className='btn small';
  button.textContent='✨ רענן את שלושת הפסוקים';
  button.addEventListener('click',refreshAllVerses);
  head.appendChild(button);
}

function randomVerse(excludedKeys=[]){
  const recent=new Set(loadHistory());
  const strict=verseItems.filter(v=>!excludedKeys.includes(getVerseKey(v))&&!recent.has(getVerseKey(v)));
  const relaxed=verseItems.filter(v=>!excludedKeys.includes(getVerseKey(v)));
  const pool=strict.length?strict:relaxed;
  return pool[Math.floor(Math.random()*pool.length)]||null;
}

function refreshPerspective(slot){
  const p=getCardPerspective(slot);
  const excluded=[p.primary.id,...p.extras.map(x=>x.id)];
  p.primary=chooseCharacter(excluded);
  p.variant=(p.variant+1)%2;
  p.extras=[];
  renderCurrentVerses();
}

function addPerspective(slot){
  const p=getCardPerspective(slot);
  if(p.extras.length>=2) p.extras=[];
  const excluded=[p.primary.id,...p.extras.map(x=>x.id)];
  p.extras.push(chooseCharacter(excluded));
  renderCurrentVerses();
}

function refreshVerse(slot){
  const excluded=currentVerses.map(getVerseKey);
  const next=randomVerse(excluded);
  if(!next) return;
  currentVerses[slot]=next;
  const used=cardPerspectives.map((p,i)=>i===slot?null:p?.primary?.id).filter(Boolean);
  cardPerspectives[slot]={primary:chooseCharacter(used),variant:Math.floor(Math.random()*2),extras:[]};
  saveHistory([next]);
  renderCurrentVerses();
}

function refreshAllVerses(){
  const chosen=[];
  for(let i=0;i<3;i++){
    const next=randomVerse(chosen.map(getVerseKey));
    if(next) chosen.push(next);
  }
  if(chosen.length!==3) return;
  currentVerses=chosen;
  cardPerspectives=[];
  saveHistory(chosen);
  renderCurrentVerses();
}

function saveVerseNote(slot){
  const item=currentVerses[slot];
  const field=document.getElementById(`verse-note-${slot}`);
  if(!item||!field) return;
  const notes=loadNotes();
  notes[getVerseKey(item)]=field.value;
  localStorage.setItem(VERSE_NOTES_KEY,JSON.stringify(notes));
  if(typeof toast==='function') toast('ההערה נשמרה');
}

async function fetchPublicVerses(){
  const url=`${BANK_URL}/rest/v1/content_items`+
    `?item_type=eq.verse&status=eq.published&visibility=eq.public`+
    `&select=id,slug,title,content,created_at,updated_at`;
  const response=await fetch(url,{headers:{apikey:BANK_PUBLISHABLE_KEY}});
  if(!response.ok) throw new Error(`Verse bank failed (${response.status})`);
  return response.json();
}

async function renderDailyVersesFromBank(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;
  try{
    verseItems=await fetchPublicVerses();
    currentVerses=dailyVerseSelection(verseItems);
    if(currentVerses.length!==3) return;
    cardPerspectives=[];
    saveHistory(currentVerses);
    renderCurrentVerses();
  }catch(err){
    console.error(err);
  }
}

window.jerusalemDateString=jerusalemDateString;
window.dailyVerseSelection=dailyVerseSelection;
window.fetchPublicVerses=fetchPublicVerses;
window.verseCardHtml=verseCardHtml;
window.refreshPerspective=refreshPerspective;
window.addPerspective=addPerspective;
window.refreshVerse=refreshVerse;
window.refreshAllVerses=refreshAllVerses;
window.saveVerseNote=saveVerseNote;

renderDailyVersesFromBank();
