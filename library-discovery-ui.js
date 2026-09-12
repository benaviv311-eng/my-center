(function(){
'use strict';
const LIBRARY_API='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1';
const D=window.LibraryDiscovery;
const state={today:'',books:[],daily:[],history:[],view:'today',extraShown:0,discoveryShown:12,discoverySeed:'',currentBook:null,bookSeed:'',sectionRefresh:{}};
const favKey='my-center-library-favorites';
const notesKey='my-center-library-notes';
let favorites=new Set(JSON.parse(localStorage.getItem(favKey)||'[]'));
let notes=JSON.parse(localStorage.getItem(notesKey)||'{}');
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const content=book=>book&&book.content?book.content:{};
function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1400)}
function materials(book){
  const c=content(book),posts=Array.isArray(c.feed_posts)?c.feed_posts.filter(Boolean):[];
  if(posts.length)return posts.slice(0,4).map((text,index)=>({key:`${book.slug}|post|${index}`,type:'📖 מתוך חומר הספר',text}));
  const ideas=Array.isArray(c.ideas)?c.ideas:[],topics=Array.isArray(c.topics)?c.topics:[];
  return [
    {key:`${book.slug}|summary`,type:'📖 תקציר קצר',text:c.summary||''},
    {key:`${book.slug}|idea|0`,type:'💡 רעיון',text:ideas[0]||''},
    {key:`${book.slug}|idea|1`,type:'🧠 עוד מחשבה',text:ideas[1]||''},
    {key:`${book.slug}|topics`,type:'🗺️ נושאים',text:topics.join(' · ')}
  ].filter(x=>x.text);
}
function favButton(key){const active=favorites.has(key);return `<button class="btn small feed-fav ${active?'active':''}" data-library-favorite="${esc(key)}">${active?'♥ נשמר':'♡ שמור'}</button>`}
function feedCard(book,material){
  const search=(book.title+' '+(content(book).category||'')+' '+material.text).toLowerCase();
  return `<article class="feed-card library-open-book" data-book-id="${esc(book.id)}" data-library-search="${esc(search)}">
    <div class="label">${esc(material.type)}</div><h3>${esc(book.title)}</h3><p>${esc(material.text)}</p>
    <div class="book-linkline">לחץ על הפוסט כדי לפתוח את הספר</div>
    <div class="feed-actions"><button class="btn small library-open-book" data-book-id="${esc(book.id)}">📚 לספר</button>${favButton(material.key)}</div></article>`;
}
function discoveryCard(post){
  const isRelated=post.sourceKind==='related-concept';
  const search=(post.bookTitle+' '+post.title+' '+post.text+' '+(post.sourceLabel||'')).toLowerCase();
  return `<article class="discovery-card library-open-book" data-book-id="${esc(post.bookId)}" data-library-search="${esc(search)}">
    <div class="discovery-card-top"><span class="source-badge ${isRelated?'':'book'}">${esc(post.sourceLabel)}</span><span class="label">${esc(post.type)}</span></div>
    <h3>${esc(post.title)}</h3><p>${esc(post.text)}</p>
    ${post.example?`<div class="concept-extra"><strong>דוגמה מהחיים</strong>${esc(post.example)}</div>`:''}
    ${post.application?`<div class="concept-extra"><strong>יישום</strong>${esc(post.application)}</div>`:''}
    <div class="book-linkline">מקושר ל־${esc(post.bookTitle)} · לחץ כדי להיכנס לספר</div>
    <div class="feed-actions"><button class="btn small library-open-book" data-book-id="${esc(post.bookId)}">📚 פתח את הספר</button>${favButton(post.id)}</div></article>`;
}
function bookCard(book){const c=content(book),search=(book.title+' '+(c.category||'')+' '+(c.summary||'')).toLowerCase();return `<article class="book-card library-open-book" data-book-id="${esc(book.id)}" data-library-search="${esc(search)}"><span class="category">${esc(c.category||'ספר')}</span><h3>${esc(book.title)}</h3><p class="meta">${esc(c.summary||'')}</p><button class="btn small library-open-book" data-book-id="${esc(book.id)}">פתח ספר</button></article>`}
function dailyBooks(){const map=new Map(state.books.map(b=>[b.id,b]));return state.daily.slice().sort((a,b)=>a.position-b.position).map(r=>map.get(r.item_id)).filter(Boolean)}
function renderToday(){
  const books=dailyBooks();
  $('daily-books').innerHTML=books.map(book=>`<article class="daily-book library-open-book" data-book-id="${esc(book.id)}"><span class="category">${esc(content(book).category||'ספר')}</span><strong>${esc(book.title)}</strong><span class="meta">פתח את הספר</span></article>`).join('');
  const posts=[];for(let round=0;round<4;round++)books.forEach(book=>{const m=materials(book)[round];if(m)posts.push(feedCard(book,m))});
  $('daily-feed').innerHTML=posts.join('');state.extraShown=0;updateLoadMore();
}
function extraPool(){const ids=new Set(dailyBooks().map(b=>b.id)),pool=[];state.books.filter(b=>!ids.has(b.id)).forEach(book=>materials(book).forEach(material=>pool.push({book,material})));return pool.sort((a,b)=>D.hash(state.today+a.material.key)-D.hash(state.today+b.material.key))}
function updateLoadMore(){$('library-load-more').classList.toggle('hidden',state.extraShown>=extraPool().length)}
function loadMore(){const pool=extraPool().slice(state.extraShown,state.extraShown+12);$('daily-feed').insertAdjacentHTML('beforeend',pool.map(x=>feedCard(x.book,x.material)).join(''));state.extraShown+=pool.length;updateLoadMore();applySearch()}
function renderDiscovery(){
  const posts=D.buildRandomFeed({books:state.books,seed:state.discoverySeed,count:state.discoveryShown});
  $('library-discovery-feed').innerHTML=posts.map(discoveryCard).join('');
  $('library-discovery-count').textContent=`${posts.length} פוסטים מוצגים`;
  $('library-discovery-more').classList.toggle('hidden',posts.length>=D.buildDiscoveryPool(state.books).length);
  applySearch();
}
function randomizeDiscovery(surprise){state.discoverySeed=`${state.today}|${surprise?'surprise':'mix'}|${Date.now()}|${Math.random()}`;state.discoveryShown=12;renderDiscovery();$('library-random-section').scrollIntoView({behavior:'smooth',block:'start'});toast(surprise?'מצאתי חיבורים חדשים':'הפיד עורבב מחדש')}
function renderBooks(){$('library-book-count').textContent=`${state.books.length} ספרים`;$('library-books-grid').innerHTML=state.books.map(bookCard).join('')}
function historyMap(){const map=new Map();state.history.forEach(row=>{if(!map.has(row.feed_date))map.set(row.feed_date,[]);map.get(row.feed_date).push(row)});return map}
function renderArchive(){
  const byId=new Map(state.books.map(b=>[b.id,b]));
  $('library-history').innerHTML=[...historyMap().entries()].map(([date,rows],index)=>{const books=rows.slice().sort((a,b)=>a.position-b.position).map(r=>byId.get(r.item_id)).filter(Boolean);return `<details class="history-day" ${index===0?'open':''}><summary>${esc(date)} · ${books.length} ספרים</summary><div class="history-books">${books.map(b=>`<button class="history-pill library-open-book" data-book-id="${esc(b.id)}">${esc(b.title)}</button>`).join('')}</div></details>`}).join('');
  const appeared=new Set(state.history.map(r=>r.item_id)),posts=[];state.books.filter(b=>appeared.has(b.id)).forEach(book=>materials(book).forEach(m=>posts.push(feedCard(book,m))));$('library-archive-feed').innerHTML=posts.length?posts.join(''):'<div class="library-empty">הארכיון מתחיל להצטבר מהיום.</div>';
}
function renderFavorites(){
  const cards=[];state.books.forEach(book=>materials(book).forEach(m=>{if(favorites.has(m.key))cards.push(feedCard(book,m))}));
  D.buildDiscoveryPool(state.books).forEach(post=>{if(favorites.has(post.id))cards.push(discoveryCard(post))});
  $('library-favorites-feed').innerHTML=cards.length?cards.join(''):'<div class="library-empty">עדיין לא שמרת פוסטים למועדפים.</div>';
}
function sourceClass(label){return /ChatGPT|הרחבה|מושג מקצועי|יישום|דוגמה/.test(label)?'ai':'book'}
function sectionCard(section){return `<article class="learning-card" data-book-section="${esc(section.kind)}"><div class="learning-card-head"><div><h3>${esc(section.title)}</h3></div><button class="learning-refresh" data-refresh-section="${esc(section.kind)}">↻ רענן</button></div><p>${esc(section.text)}</p><div class="source-row"><span class="source-badge ${sourceClass(section.sourceLabel)}">${esc(section.sourceLabel)}</span></div></article>`}
function renderBookDynamic(book,seed){const sections=D.buildBookSections(book,seed);$('library-book-dynamic').innerHTML=sections.map(sectionCard).join('')}
function openBook(id){
  const book=state.books.find(x=>x.id===id);if(!book)return;state.currentBook=book;state.bookSeed=`${state.today}|${book.slug||book.id}|0`;state.sectionRefresh={};
  const c=content(book);$('library-book-category').textContent=c.category||'ספר';$('library-book-title').textContent=book.title;$('library-book-summary').textContent=c.summary||'';
  const ideas=Array.isArray(c.ideas)?c.ideas:[],topics=Array.isArray(c.topics)?c.topics:[];$('library-book-ideas').innerHTML=ideas.map(x=>`<li>${esc(x)}</li>`).join('');$('library-book-topics').innerHTML=topics.map(x=>`<li>${esc(x)}</li>`).join('');
  const dates=[...new Set(state.history.filter(r=>r.item_id===book.id).map(r=>r.feed_date))];$('library-book-history').innerHTML=dates.length?dates.map(d=>`<span class="pill">${esc(d)}</span>`).join(' '):'<span class="meta">הספר עדיין לא הופיע בפיד היומי.</span>';
  $('library-book-note').value=notes[book.slug]||'';renderBookDynamic(book,state.bookSeed);$('library-book-sheet').classList.remove('hidden');$('library-book-sheet').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
function closeBook(){$('library-book-sheet').classList.add('hidden');$('library-book-sheet').setAttribute('aria-hidden','true');document.body.style.overflow=''}
function refreshBookAll(random){if(!state.currentBook)return;state.bookSeed=`${state.today}|${state.currentBook.slug||state.currentBook.id}|${random?'random':'refresh'}|${Date.now()}|${Math.random()}`;state.sectionRefresh={};renderBookDynamic(state.currentBook,state.bookSeed);toast(random?'נוצר מסלול רנדומלי חדש':'כל חלקי הספר רועננו')}
function refreshSection(kind){if(!state.currentBook)return;state.sectionRefresh[kind]=(state.sectionRefresh[kind]||0)+1;const seed=`${state.bookSeed}|${kind}|${state.sectionRefresh[kind]}|${Date.now()}`;const next=D.buildBookSections(state.currentBook,seed).find(x=>x.kind===kind);const current=document.querySelector(`[data-book-section="${CSS.escape(kind)}"]`);if(next&&current)current.outerHTML=sectionCard(next)}
function switchView(view){state.view=view;document.querySelectorAll('.library-tab').forEach(b=>b.classList.toggle('active',b.dataset.libraryView===view));['today','books','archive','favorites'].forEach(name=>$('library-view-'+name).classList.toggle('hidden',name!==view));if(view==='favorites')renderFavorites();applySearch()}
function applySearch(){const input=$('library-search'),query=input.value.trim().toLowerCase(),current=$('library-view-'+state.view);if(!current)return;current.querySelectorAll('[data-library-search]').forEach(el=>el.classList.toggle('hidden',Boolean(query&&!el.dataset.librarySearch.includes(query))))}
function toggleFavorite(key){if(favorites.has(key)){favorites.delete(key);toast('הוסר מהמועדפים')}else{favorites.add(key);toast('נשמר במועדפים')}localStorage.setItem(favKey,JSON.stringify([...favorites]));document.querySelectorAll('[data-library-favorite]').forEach(btn=>{const active=favorites.has(btn.dataset.libraryFavorite);btn.classList.toggle('active',active);btn.textContent=active?'♥ נשמר':'♡ שמור'});if(state.view==='favorites')renderFavorites()}
async function loadLibrary(){
  const status=$('library-status');try{const response=await fetch(LIBRARY_API,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const data=await response.json();state.today=data.today||'';state.books=Array.isArray(data.books)?data.books:[];state.daily=Array.isArray(data.daily)?data.daily:[];state.history=Array.isArray(data.history)?data.history:[];state.discoverySeed=`${state.today}|smart`; $('library-date').textContent=state.today;status.textContent=`${state.books.length} ספרים בבנק · ${state.history.length} רשומות בארכיון`;renderToday();renderDiscovery();renderBooks();renderArchive();renderFavorites()}catch(error){console.error(error);status.textContent='לא ניתן כרגע לטעון את ספריית הלמידה.';$('daily-feed').innerHTML='<div class="library-empty">הבנק לא זמין כרגע.</div>'}}

document.addEventListener('click',event=>{
  const fav=event.target.closest('[data-library-favorite]');if(fav){event.preventDefault();event.stopPropagation();toggleFavorite(fav.dataset.libraryFavorite);return}
  const refresh=event.target.closest('[data-refresh-section]');if(refresh){event.preventDefault();event.stopPropagation();refreshSection(refresh.dataset.refreshSection);return}
  const tab=event.target.closest('[data-library-view]');if(tab){switchView(tab.dataset.libraryView);return}
  const open=event.target.closest('.library-open-book');if(open){openBook(open.dataset.bookId);return}
});
$('library-load-more').addEventListener('click',loadMore);
$('library-search').addEventListener('input',applySearch);
$('library-randomize').addEventListener('click',()=>randomizeDiscovery(false));
$('library-random-top').addEventListener('click',()=>randomizeDiscovery(true));
$('library-discovery-more').addEventListener('click',()=>{state.discoveryShown+=12;renderDiscovery()});
$('library-book-close').addEventListener('click',closeBook);
$('library-book-sheet').addEventListener('click',event=>{if(event.target.id==='library-book-sheet')closeBook()});
$('library-book-refresh-all').addEventListener('click',()=>refreshBookAll(false));
$('library-book-random').addEventListener('click',()=>refreshBookAll(true));
$('library-save-note').addEventListener('click',()=>{if(!state.currentBook)return;notes[state.currentBook.slug]=$('library-book-note').value;localStorage.setItem(notesKey,JSON.stringify(notes));toast('ההערה נשמרה')});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('library-book-sheet').classList.contains('hidden'))closeBook()});
loadLibrary();
})();
