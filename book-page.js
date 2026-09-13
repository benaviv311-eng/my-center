(function(){
'use strict';

const LIBRARY_API='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1';
const D=window.LibraryDiscovery;
const F=window.BookInfiniteFeed;
const notesKey='my-center-library-notes';
const savedFeedKey='my-center-book-feed-saved';
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const state={
  today:'',book:null,history:[],seed:'',sectionRefresh:{},
  notes:JSON.parse(localStorage.getItem(notesKey)||'{}'),
  feedSeed:'',feedOffset:0,feedFilter:'all',feedLoading:false,feedObserver:null,
  savedFeed:new Set(JSON.parse(localStorage.getItem(savedFeedKey)||'[]'))
};

const content=book=>book&&book.content?book.content:{};
function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1500)}
function sourceClass(label){return /ChatGPT|הרחבה|מושג מקצועי|יישום|דוגמה/.test(label)?'ai':'book'}
function sectionCard(section){return `<article class="learning-card" data-book-section="${esc(section.kind)}"><div class="learning-card-head"><div><h3>${esc(section.title)}</h3></div><button class="learning-refresh" data-refresh-section="${esc(section.kind)}">↻ רענן</button></div><p>${esc(section.text)}</p><div class="source-row"><span class="source-badge ${sourceClass(section.sourceLabel)}" data-source-expand role="button" tabindex="0" aria-expanded="false">${esc(section.sourceLabel)}</span></div></article>`}
function renderLearning(seed){const sections=D.buildBookSections(state.book,seed);$('book-learning-scroll').innerHTML=sections.length?sections.map(sectionCard).join(''):'<div class="book-page-empty">אין עדיין חומר דינמי לספר הזה.</div>'}

function feedCard(item){
  const saved=state.savedFeed.has(item.id);
  const deepParts=[];
  if(item.example) deepParts.push(`<p><strong>דוגמה:</strong> ${esc(item.example)}</p>`);
  if(item.deepText) deepParts.push(`<p>${esc(item.deepText)}</p>`);
  return `<article class="book-feed-card" data-feed-card="${esc(item.id)}" data-feed-kind="${esc(item.kind)}">
    <div class="book-feed-card-top"><span class="book-feed-kind">${esc(item.typeLabel||item.kind)}</span><span class="source-badge ${sourceClass(item.sourceLabel)}" data-source-expand role="button" tabindex="0" aria-expanded="false">${esc(item.sourceLabel||'הרחבה מקצועית')}</span></div>
    <h3>${esc(item.title)}${item.englishTitle?` <small>${esc(item.englishTitle)}</small>`:''}</h3>
    <p>${esc(item.text)}</p>
    <div class="book-feed-deep hidden">${deepParts.length?deepParts.join(''):'<p>נסה לחבר את הרעיון למקרה אמיתי אחד מתוך החיים שלך.</p>'}</div>
    <div class="book-feed-actions">
      <button class="btn small" data-feed-deepen>העמק</button>
      <button class="btn small" data-feed-more-like>עוד כזה</button>
      <button class="btn small" data-feed-refresh>↻ רענן</button>
      <button class="btn small ${saved?'active':''}" data-feed-save>${saved?'♥ נשמר':'♡ שמור'}</button>
    </div>
  </article>`;
}
function buildFeedBatch(options){return F.buildBookFeedBatch(state.book,Object.assign({seed:state.feedSeed,offset:state.feedOffset,count:12,filter:state.feedFilter},options||{}))}
function appendFeed(){
  if(!state.book||state.feedLoading)return;
  state.feedLoading=true;
  const batch=buildFeedBatch();
  $('book-infinite-feed').insertAdjacentHTML('beforeend',batch.map(feedCard).join(''));
  state.feedOffset+=batch.length;
  state.feedLoading=false;
}
function resetFeed(filter){
  state.feedFilter=filter||'all';state.feedOffset=0;state.feedSeed=`${state.today}|${state.book.slug||state.book.id}|feed|${state.feedFilter}|${Date.now()}|${Math.random()}`;
  $('book-infinite-feed').innerHTML='';
  document.querySelectorAll('[data-book-feed-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.bookFeedFilter===state.feedFilter));
  appendFeed();
}
function moreLike(card){
  const kind=card.dataset.feedKind;
  const batch=F.buildBookFeedBatch(state.book,{seed:`${state.feedSeed}|more|${Date.now()}|${Math.random()}`,offset:0,count:4,filter:kind});
  card.insertAdjacentHTML('afterend',batch.map(feedCard).join(''));
  toast('הוספתי עוד מאותו סוג');
}
function refreshFeedCard(card){
  const kind=card.dataset.feedKind;
  const next=F.buildBookFeedBatch(state.book,{seed:`${state.feedSeed}|refresh|${Date.now()}|${Math.random()}`,offset:0,count:1,filter:kind})[0];
  if(next)card.outerHTML=feedCard(next);
}
function toggleFeedSave(card){
  const id=card.dataset.feedCard;
  if(state.savedFeed.has(id)){state.savedFeed.delete(id);toast('הוסר מהשמורים')}else{state.savedFeed.add(id);toast('נשמר')}
  localStorage.setItem(savedFeedKey,JSON.stringify([...state.savedFeed]));
  const btn=card.querySelector('[data-feed-save]');if(btn){const active=state.savedFeed.has(id);btn.classList.toggle('active',active);btn.textContent=active?'♥ נשמר':'♡ שמור'}
}
function setupInfiniteFeed(){
  if(state.feedObserver)state.feedObserver.disconnect();
  if('IntersectionObserver' in window){
    state.feedObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))appendFeed()},{rootMargin:'700px 0px'});
    state.feedObserver.observe($('book-feed-sentinel'));
  }
}

function renderStatic(){
  const book=state.book,c=content(book),ideas=Array.isArray(c.ideas)?c.ideas:[],topics=Array.isArray(c.topics)?c.topics:[];
  $('book-category').textContent=c.category||'ספר';$('book-title').textContent=book.title;document.title=`${book.title} | ספריית הלמידה שלי`;$('book-intro').textContent=c.summary||'עמוד למידה מתחלף: תיאוריה, פסיכולוגיה, גישות, יישום ודוגמאות.';$('book-summary').textContent=c.summary||'';
  $('book-ideas').innerHTML=ideas.length?ideas.map(x=>`<li>${esc(x)}</li>`).join(''):'<li class="meta">נוסיף רעיונות בהמשך.</li>';
  $('book-topics').innerHTML=topics.length?topics.map(x=>`<li>${esc(x)}</li>`).join(''):'<li class="meta">נוסיף נושאים בהמשך.</li>';
  const dates=[...new Set(state.history.filter(r=>r.item_id===book.id).map(r=>r.feed_date))];$('book-history').innerHTML=dates.length?dates.map(d=>`<span class="pill">${esc(d)}</span>`).join(' '):'<span class="meta">הספר עדיין לא הופיע בפיד היומי.</span>';
  $('book-note').value=state.notes[book.slug||book.id]||'';
}
function newSeed(mode){return `${state.today}|${state.book.slug||state.book.id}|${mode}|${Date.now()}|${Math.random()}`}
function refreshAll(mode){
  state.seed=newSeed(mode);state.sectionRefresh={};renderLearning(state.seed);resetFeed('all');
  toast(mode==='surprise'?'פתחתי זוויות חדשות':mode==='random'?'נוצר מסלול רנדומלי חדש':'כל חלקי הספר רועננו');
  if(mode==='surprise')$('book-learning-scroll').scrollIntoView({behavior:'smooth',block:'start'});
}
function refreshSection(kind){state.sectionRefresh[kind]=(state.sectionRefresh[kind]||0)+1;const seed=`${state.seed}|${kind}|${state.sectionRefresh[kind]}|${Date.now()}`;const next=D.buildBookSections(state.book,seed).find(x=>x.kind===kind);const current=document.querySelector(`[data-book-section="${CSS.escape(kind)}"]`);if(next&&current)current.outerHTML=sectionCard(next)}
function resolveBook(books){const params=new URLSearchParams(window.location.search),key=params.get('book');if(!key)return null;return books.find(book=>String(book.id)===key||String(book.slug||'')===key)||null}

async function loadBook(){
  try{
    if(!D||typeof D.buildBookSections!=='function')throw new Error('LibraryDiscovery unavailable');
    if(!F||typeof F.buildBookFeedBatch!=='function')throw new Error('BookInfiniteFeed unavailable');
    const response=await fetch(LIBRARY_API,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const data=await response.json(),books=Array.isArray(data.books)?data.books:[];
    state.today=data.today||'';state.history=Array.isArray(data.history)?data.history:[];state.book=resolveBook(books);
    if(!state.book){$('book-status').textContent='הספר לא נמצא';$('book-title').textContent='הספר לא נמצא';$('book-learning-scroll').innerHTML='<div class="book-page-empty book-page-error">חזור לספרייה ובחר ספר מחדש.</div>';return}
    state.seed=`${state.today}|${state.book.slug||state.book.id}|daily`;renderStatic();renderLearning(state.seed);resetFeed('all');setupInfiniteFeed();$('book-status').textContent='עמוד למידה דינמי · פיד אינסופי';
  }catch(error){console.error(error);$('book-status').textContent='שגיאה בטעינת הספר';$('book-learning-scroll').innerHTML='<div class="book-page-empty book-page-error">לא ניתן כרגע לטעון את הספר.</div>'}
}


function sourceExpansion(card,label){
  const book=state.book||{};
  const c=content(book);
  const bookTitle=book.title||'הספר';

  const titleNode=card.querySelector('h3');
  const title=titleNode?titleNode.textContent.trim():'הנושא';

  const textNode=card.querySelector(':scope > p');
  const text=textNode?textNode.textContent.trim():'';

  const summary=c.summary||'';
  const ideas=Array.isArray(c.ideas)?c.ideas:[];
  const topics=Array.isArray(c.topics)?c.topics:[];

  let sourceTitle='הרחבה על מקור התוכן';
  let explanation='';
  let context='';

  if(label.includes('מתוך חומר הספר')){
    sourceTitle='📖 הרחבה מתוך חומר הספר';
    explanation=`הכרטיס הזה מבוסס על חומר שכבר משויך ל־${bookTitle}. המטרה כאן היא לפרק את הרעיון, להבין מה עומד מאחוריו ולחבר אותו לשאר הנושאים בספר.`;
    context=summary
      ? `בהקשר הרחב של הספר: ${summary}`
      : `כדאי לקרוא את הרעיון כחלק מהמסר הרחב של ${bookTitle}, ולא כמשפט מבודד.`;
  }
  else if(label.includes('מושג מקצועי')){
    sourceTitle='🧠 הרחבת המושג המקצועי';
    explanation=`זהו מושג מקצועי אמיתי שמתחבר לנושא של ${bookTitle}. הוא אינו בהכרח מושג שהמחבר משתמש בו במפורש, אלא כלי שעוזר להבין את הרעיון דרך ידע מקצועי נוסף.`;
    context=`נסה לבדוק כיצד המושג מסביר, מחזק או אפילו מערער את הרעיון שמוצג בכרטיס.`;
  }
  else if(label.includes('הרחבה מקצועית')){
    sourceTitle='🔬 הרחבה מקצועית';
    explanation=`זהו ידע נוסף שמחובר לנושא של ${bookTitle} כדי להרחיב את הלמידה מעבר לטקסט הבסיסי.`;
    context=`הערך של ההרחבה הוא בחיבור בין הרעיון שבספר לבין תיאוריה, מחקר, פסיכולוגיה או יישום מהעולם האמיתי.`;
  }
  else if(label.includes('ChatGPT')){
    sourceTitle='✨ הרחבת ההצעה';
    explanation=`זהו חיבור לימודי שנוצר כדי לפתוח זווית נוספת על ${bookTitle}. הוא אינו מוצג כטענה שהרעיון מופיע במפורש בספר.`;
    context=`המטרה היא להשתמש ברעיון שבספר כנקודת מוצא ולבדוק לאילו תחומים נוספים אפשר לחבר אותו.`;
  }
  else{
    sourceTitle=`🔎 הרחבה — ${label}`;
    explanation=`זהו מקור תוכן נוסף שמרחיב את הנושא שמופיע בכרטיס.`;
    context=`בדוק כיצד התוכן הזה מתחבר לרעיון המרכזי של ${bookTitle}.`;
  }

  const related=[
    ...topics,
    ...ideas
  ].filter(Boolean).find(x=>{
    const value=String(x);
    return value!==text && !text.includes(value) && !value.includes(text);
  });

  const relatedHtml=related
    ? `<p><strong>🔗 חיבור נוסף:</strong> ${esc(related)}</p>`
    : '';

  return `
    <div class="source-expansion-panel">
      <div class="source-expansion-head">
        <strong>${esc(sourceTitle)}</strong>
        <button class="source-expansion-close" data-source-expansion-close aria-label="סגור הרחבה">×</button>
      </div>

      <p>${esc(explanation)}</p>

      ${text
        ? `<p><strong>הרעיון בהרחבה:</strong> ${esc(text)}</p>`
        : ''
      }

      <p><strong>הקשר לספר:</strong> ${esc(context)}</p>

      ${relatedHtml}

      <p><strong>🌍 איך זה יכול להתבטא בחיים?</strong>
      חפש מצב אמיתי שבו הרעיון הזה משפיע על החלטה, התנהגות, למידה, אימון, מערכת יחסים או דרך חשיבה.</p>

      <p><strong>💭 שאלה להעמקה:</strong>
      מה משתנה בהבנה שלך כאשר מסתכלים על "${esc(title)}" דרך ההרחבה הזאת?</p>
    </div>
  `;
}

function toggleSourceExpansion(badge){
  const card=badge.closest('.learning-card,.book-feed-card');
  if(!card)return;

  const current=card.querySelector('.source-expansion-panel');

  if(current){
    current.remove();
    badge.setAttribute('aria-expanded','false');
    return;
  }

  document.querySelectorAll('.source-expansion-panel').forEach(panel=>{
    const parent=panel.closest('.learning-card,.book-feed-card');
    if(parent && parent!==card){
      const otherBadge=parent.querySelector('[data-source-expand]');
      if(otherBadge)otherBadge.setAttribute('aria-expanded','false');
      panel.remove();
    }
  });

  card.insertAdjacentHTML(
    'beforeend',
    sourceExpansion(card,badge.textContent.trim())
  );

  badge.setAttribute('aria-expanded','true');
}

document.addEventListener('click',event=>{
  const closeExpansion=event.target.closest('[data-source-expansion-close]');
  if(closeExpansion){
    const card=closeExpansion.closest('.learning-card,.book-feed-card');
    if(card){
      const badge=card.querySelector('[data-source-expand]');
      const panel=card.querySelector('.source-expansion-panel');
      if(panel)panel.remove();
      if(badge)badge.setAttribute('aria-expanded','false');
    }
    return;
  }

  const sourceBadge=event.target.closest('[data-source-expand]');
  if(sourceBadge){
    toggleSourceExpansion(sourceBadge);
    return;
  }

  const refresh=event.target.closest('[data-refresh-section]');if(refresh){refreshSection(refresh.dataset.refreshSection);return}
  const filter=event.target.closest('[data-book-feed-filter]');if(filter){resetFeed(filter.dataset.bookFeedFilter);return}
  const card=event.target.closest('[data-feed-card]');if(!card)return;
  if(event.target.closest('[data-feed-deepen]')){const deep=card.querySelector('.book-feed-deep'),btn=event.target.closest('[data-feed-deepen]');deep.classList.toggle('hidden');btn.textContent=deep.classList.contains('hidden')?'העמק':'סגור';return}
  if(event.target.closest('[data-feed-more-like]')){moreLike(card);return}
  if(event.target.closest('[data-feed-refresh]')){refreshFeedCard(card);return}
  if(event.target.closest('[data-feed-save]')){toggleFeedSave(card);return}
});



document.addEventListener('keydown',event=>{
  const badge=event.target.closest&&event.target.closest('[data-source-expand]');
  if(badge && (event.key==='Enter'||event.key===' ')){
    event.preventDefault();
    toggleSourceExpansion(badge);
  }
});

$('book-refresh-all').addEventListener('click',()=>refreshAll('refresh'));
$('book-random').addEventListener('click',()=>refreshAll('random'));
$('book-surprise').addEventListener('click',()=>refreshAll('surprise'));
$('book-feed-more').addEventListener('click',appendFeed);
$('book-save-note').addEventListener('click',()=>{if(!state.book)return;state.notes[state.book.slug||state.book.id]=$('book-note').value;localStorage.setItem(notesKey,JSON.stringify(state.notes));toast('ההערה נשמרה')});

loadBook();
})();
