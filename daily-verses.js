function jerusalemDateParts(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Jerusalem',
    year:'numeric',
    month:'2-digit',
    day:'2-digit'
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

function verseCardHtml(item,index){
  const content=item.content||{};
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  return `
    <article class="card">
      <div class="label">פסוק ${index+1}</div>
      <div class="verse">“${esc(content.verse||item.title)}”</div>
      <div class="meta">${esc(content.reference||'')}</div>
      <details><summary>פירוש ספרותי</summary><p>${esc(content.literary||'')}</p></details>
      <details><summary>מבט אנושי</summary><p>${esc(content.human||'')}</p></details>
      <details><summary>החיבור לעולם ראיקה</summary><p>${esc(content.raika_context||'')}</p></details>
      <details><summary>משפט שהדמות הייתה אומרת</summary><p>${esc(content.character_quote||'')}</p></details>
      <div class="card-actions">
        <button class="btn small fav" data-id="verse-${esc(item.id)}">♡ שמור</button>
      </div>
    </article>`;
}

async function fetchPublicVerses(){
  const url=
    `${BANK_URL}/rest/v1/content_items`+
    `?item_type=eq.verse`+
    `&status=eq.published`+
    `&visibility=eq.public`+
    `&select=id,slug,title,content,created_at,updated_at`;

  const response=await fetch(url,{headers:{apikey:BANK_PUBLISHABLE_KEY}});
  if(!response.ok) throw new Error(`Verse bank failed (${response.status})`);
  return response.json();
}

async function renderDailyVersesFromBank(){
  const wrap=document.getElementById('daily-verses');
  if(!wrap) return;

  try{
    const items=await fetchPublicVerses();
    const picked=dailyVerseSelection(items);
    if(picked.length!==3) return;
    wrap.innerHTML=picked.map(verseCardHtml).join('');
    if(typeof refreshFavs==='function') refreshFavs();
  }catch(err){
    console.error(err);
  }
}

window.jerusalemDateString=jerusalemDateString;
window.dailyVerseSelection=dailyVerseSelection;
window.fetchPublicVerses=fetchPublicVerses;
window.verseCardHtml=verseCardHtml;

renderDailyVersesFromBank();
