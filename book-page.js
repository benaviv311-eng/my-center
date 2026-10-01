(function(){
'use strict';

const LIBRARY_API='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/library-feed?json=1';
const D=window.LibraryDiscovery;
const F=window.BookInfiniteFeed;
const R=window.BookReading;
const notesKey='my-center-library-notes';
const savedFeedKey='my-center-book-feed-saved';
const PROTOTYPE_READER_BOOK_ID='c8596613-aa90-49f3-8410-09d305926710';
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const state={
  today:'',book:null,history:[],seed:'',readingChapters:[],
  notes:JSON.parse(localStorage.getItem(notesKey)||'{}'),
  feedSeed:'',feedOffset:0,feedFilter:'all',feedLoading:false,feedObserver:null,
  chapterObserver:null,progressBound:false,progressRaf:0,activeChapterId:'',
  speechUtterance:null,speechPaused:false,speechWords:[],speechWord:null,
  keyPointsExpanded:false,
  savedFeed:new Set(JSON.parse(localStorage.getItem(savedFeedKey)||'[]'))
};

const content=book=>book&&book.content?book.content:{};
function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1500)}
function sourceClass(label){return /ChatGPT|הרחבה|מושג מקצועי|יישום|דוגמה/.test(label||'')?'ai':'book'}
function sourceBadge(label){const value=label||'הרחבה מקצועית';return `<span class="source-badge ${sourceClass(value)}" data-source-expand role="button" tabindex="0" aria-expanded="false">${esc(value)}</span>`}

function supportBlock(block){
  return `<aside class="reading-support-block reading-support-${esc(block.kind||'note')}">
    <div class="reading-support-head"><strong>${esc(block.title||'הרחבה')}</strong>${sourceBadge(block.sourceLabel)}</div>
    <p>${esc(block.text||'')}</p>
  </aside>`;
}
function deepSection(section){
  const paragraphs=Array.isArray(section.paragraphs)?section.paragraphs:[];
  return `<section class="reading-deep-section"><h4>${esc(section.heading||'העמקה')}</h4>${paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}</section>`;
}
function readingChapter(chapter,index){
  const paragraphs=Array.isArray(chapter.bodyParagraphs)?chapter.bodyParagraphs:[];
  const supports=Array.isArray(chapter.supportBlocks)?chapter.supportBlocks:[];
  const deep=chapter.deep||{sections:[]};
  const deepSections=Array.isArray(deep.sections)?deep.sections:[];
  return `<article class="reading-chapter" id="chapter-${esc(chapter.id)}" data-reading-chapter="${esc(chapter.id)}">
    <div class="reading-chapter-head"><span class="reading-eyebrow">${esc(chapter.kicker||`פרק ${index+1}`)}</span><span class="reading-chapter-number">${String(index+1).padStart(2,'0')}</span></div>
    <h2>${esc(chapter.title)}</h2>
    <div class="reading-chapter-copy">${paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}</div>
    ${supports.length?`<div class="reading-supports">${supports.map(supportBlock).join('')}</div>`:''}
    <div class="reading-chapter-footer">
      ${sourceBadge(chapter.sourceLabel)}
      <button class="reading-deepen-button" data-reading-deepen aria-expanded="false">העמק בפרק</button>
    </div>
    <div class="reading-deep-panel hidden" data-reading-deep>
      <div class="reading-deep-head"><div><span class="reading-eyebrow">שכבת עומק</span><h3>${esc(deep.title||`העמקה · ${chapter.title}`)}</h3></div><button class="reading-deep-close" data-reading-close aria-label="סגור העמקה">×</button></div>
      ${deepSections.map(deepSection).join('')}
      ${deep.takeaway?`<div class="reading-deep-takeaway"><strong>מה לקחת מכאן</strong><p>${esc(deep.takeaway)}</p></div>`:''}
    </div>
  </article>`;
}
function isReaderPrototype(){
  return Boolean(state.book&&String(state.book.id)===PROTOTYPE_READER_BOOK_ID);
}
function compactSummaryText(value,max){
  const clean=String(value||'').replace(/\s+/g,' ').trim();
  if(!clean)return '';
  const first=(clean.split(/(?<=[.!?])\s+/)[0]||clean).trim();
  const limit=Math.max(70,Number(max)||150);
  if(first.length<=limit)return first;
  const sliced=first.slice(0,limit);
  const cut=sliced.lastIndexOf(' ');
  return (cut>70?sliced.slice(0,cut):sliced).trim()+'…';
}
function chapterSummaryPoints(chapter){
  if(!chapter)return [];
  const candidates=Array.isArray(chapter.keySentences)?chapter.keySentences:[];
  const seen=new Set(),points=[];
  for(const value of candidates){
    const point=compactSummaryText(value,88);
    const key=point.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if(!point||!key||seen.has(key))continue;
    seen.add(key);points.push(point);
    if(points.length===6)break;
  }
  return points;
}
function renderChapterSummary(chapterId){
  if(!isReaderPrototype())return;
  const chapters=state.readingChapters||[];
  const index=Math.max(0,chapters.findIndex(ch=>String(ch.id)===String(chapterId)));
  const chapter=chapters[index]||chapters[0];
  if(!chapter)return;
  state.activeChapterId=String(chapter.id);
  const title=$('book-summary-title'),position=$('book-summary-position'),list=$('book-summary-points');
  if(title){title.textContent='';title.hidden=true}
  if(position)position.textContent='';
  const points=chapterSummaryPoints(chapter);
  if(list)list.innerHTML=points.length?points.map(point=>`<li>${esc(point)}</li>`).join(''):'<li>אין עדיין משפטי מפתח לפרק הזה.</li>';
}
function setActiveReadingChapter(chapterId){
  state.activeChapterId=String(chapterId||'');
  document.querySelectorAll('[data-toc-target]').forEach(link=>link.classList.toggle('active',link.dataset.tocTarget===state.activeChapterId));
  renderChapterSummary(state.activeChapterId);
}
function currentReadingChapter(){
  const chapters=state.readingChapters||[];
  return chapters.find(ch=>String(ch.id)===String(state.activeChapterId))||chapters[0]||null;
}
function chapterSpeechText(chapter){
  if(!chapter)return '';
  const parts=[chapter.title];
  (Array.isArray(chapter.bodyParagraphs)?chapter.bodyParagraphs:[]).forEach(text=>parts.push(text));
  (Array.isArray(chapter.supportBlocks)?chapter.supportBlocks:[]).forEach(block=>{
    if(block?.title)parts.push(block.title);
    if(block?.text)parts.push(block.text);
  });
  return parts.filter(Boolean).join('. ');
}
function clearSpeechHighlight(){
  if(state.speechWord)state.speechWord.classList.remove('is-speaking-word');
  document.querySelectorAll('.speech-word.is-speaking-word').forEach(word=>word.classList.remove('is-speaking-word'));
  state.speechWord=null;
}
function wrapSpeechElement(element,baseOffset){
  const raw=String(element.textContent||'').trim();
  if(!raw)return {text:'',length:0};
  let html='',last=0;
  for(const match of raw.matchAll(/\S+/gu)){
    const start=match.index||0;
    const word=match[0];
    html+=esc(raw.slice(last,start));
    html+=`<span class="speech-word" data-speech-start="${baseOffset+start}" data-speech-end="${baseOffset+start+word.length}">${esc(word)}</span>`;
    last=start+word.length;
  }
  html+=esc(raw.slice(last));
  element.innerHTML=html;
  return {text:raw,length:raw.length};
}
function prepareSpeechTracking(chapter){
  clearSpeechHighlight();
  state.speechWords=[];
  const root=chapter?document.getElementById(`chapter-${chapter.id}`):null;
  if(!root)return {text:chapterSpeechText(chapter),words:[]};
  const elements=[...root.querySelectorAll(':scope > h2,.reading-chapter-copy p,.reading-support-head strong,.reading-support-block p')];
  let text='',cursor=0;
  elements.forEach(element=>{
    const raw=String(element.textContent||'').trim();
    if(!raw)return;
    if(text){text+='. ';cursor+=2}
    const wrapped=wrapSpeechElement(element,cursor);
    text+=wrapped.text;
    cursor+=wrapped.length;
  });
  state.speechWords=[...root.querySelectorAll('[data-speech-start]')];
  return {text,words:state.speechWords};
}
function highlightSpeechWord(charIndex){
  const words=state.speechWords||[];
  if(!words.length||!Number.isFinite(Number(charIndex)))return;
  const index=Number(charIndex);
  let selected=null;
  for(const word of words){
    const start=Number(word.dataset.speechStart||0);
    if(start>index)break;
    selected=word;
  }
  if(!selected)return;
  if(state.speechWord===selected)return;
  clearSpeechHighlight();
  state.speechWord=selected;
  selected.classList.add('is-speaking-word');
  const rect=selected.getBoundingClientRect();
  const upper=window.innerHeight*.28;
  const lower=window.innerHeight*.72;
  if(rect.top<upper||rect.bottom>lower){
    selected.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
  }
}
function readRate(){
  const control=$('book-read-rate');
  const value=control?Number(control.value):1;
  return Number.isFinite(value)&&value>0?value:1;
}
function readLanguage(){
  const control=$('book-read-language');
  return control&&control.value?control.value:'he-IL';
}
function setReadStatus(message){
  const status=$('book-read-status');if(status)status.textContent=message||'';
}
function setReadControls(active,paused){
  const pause=$('book-read-pause'),stop=$('book-read-stop'),floating=$('book-read-floating');
  if(pause){pause.disabled=!active;pause.textContent=paused?'המשך':'השהה'}
  if(stop)stop.disabled=!active;
  if(floating){
    floating.classList.toggle('is-active',!!active);
    floating.textContent=active?(paused?'▶':'⏸'):'🔊';
    floating.setAttribute('aria-label',active?(paused?'המשך הקראה':'השהה הקראה'):'הקרא את הפרק');
    floating.title=active?(paused?'המשך הקראה':'השהה הקראה'):'הקרא את הפרק';
  }
}
function stopReadAloud(message){
  if('speechSynthesis' in window)window.speechSynthesis.cancel();
  state.speechUtterance=null;state.speechPaused=false;state.speechWords=[];
  clearSpeechHighlight();
  setReadControls(false,false);
  setReadStatus(message||'');
}
function speakCurrentChapter(){
  if(!isReaderPrototype())return;
  if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
    setReadStatus('הקראה אינה נתמכת בדפדפן הזה.');
    return;
  }
  const chapter=currentReadingChapter();
  const tracking=prepareSpeechTracking(chapter);
  const text=tracking.text||chapterSpeechText(chapter);
  if(!text)return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang=readLanguage();
  utterance.rate=readRate();
  const voices=window.speechSynthesis.getVoices?window.speechSynthesis.getVoices():[];
  const selectedLang=readLanguage().toLowerCase();
  const matchingVoice=voices.find(voice=>String(voice.lang||'').toLowerCase()===selectedLang)
    || voices.find(voice=>String(voice.lang||'').toLowerCase().startsWith(selectedLang.split('-')[0]));
  if(matchingVoice)utterance.voice=matchingVoice;
  utterance.onstart=()=>{state.speechPaused=false;setReadControls(true,false);setReadStatus(`מקריא את הפרק הנוכחי · ${readRate()}×`)};
  utterance.onboundary=event=>{if(Number.isFinite(Number(event.charIndex)))highlightSpeechWord(Number(event.charIndex))};
  utterance.onend=()=>{clearSpeechHighlight();state.speechWords=[];state.speechUtterance=null;state.speechPaused=false;setReadControls(false,false);setReadStatus('ההקראה הסתיימה.')};
  utterance.onerror=()=>{clearSpeechHighlight();state.speechWords=[];state.speechUtterance=null;state.speechPaused=false;setReadControls(false,false);setReadStatus('לא הצלחתי להפעיל את ההקראה.')};
  state.speechUtterance=utterance;
  window.speechSynthesis.speak(utterance);
}
function toggleReadPause(){
  if(!state.speechUtterance||!('speechSynthesis' in window))return;
  if(state.speechPaused){
    window.speechSynthesis.resume();state.speechPaused=false;setReadControls(true,false);setReadStatus('ממשיך להקריא…');
  }else{
    window.speechSynthesis.pause();state.speechPaused=true;setReadControls(true,true);setReadStatus('ההקראה מושהית.');
  }
}
function setupReaderPrototype(){
  const summary=$('book-chapter-summary');
  const enabled=isReaderPrototype();
  document.body.classList.toggle('book-prototype-reading',enabled);
  if(summary)summary.classList.toggle('hidden',!enabled);
  if(enabled&&state.readingChapters.length)setActiveReadingChapter(state.activeChapterId||state.readingChapters[0].id);
  if(!enabled)stopReadAloud('');
}
function renderReading(seed,options){
  const chapters=R.buildReadingChapters(state.book,Object.assign({seed},options||{}));
  state.readingChapters=chapters;
  $('book-reading-toc').innerHTML=chapters.map(ch=>`<a href="#chapter-${esc(ch.id)}" data-toc-target="${esc(ch.id)}">${esc(ch.title)}</a>`).join('');
  $('book-reading-body').innerHTML=chapters.length?chapters.map(readingChapter).join(''):'<div class="book-page-empty">אין עדיין חומר קריאה לספר הזה.</div>';
  const takeaways=R.buildTakeaways(state.book,chapters);
  $('book-takeaways').innerHTML=takeaways.length?takeaways.map(item=>`<li>${esc(item)}</li>`).join(''):'<li>נוסיף סיכום בהמשך.</li>';
  setupChapterObserver();
  setupReaderPrototype();
  updateReadingProgress();
}
function setupChapterObserver(){
  if(state.chapterObserver)state.chapterObserver.disconnect();
  if(!('IntersectionObserver' in window))return;
  state.chapterObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    const id=visible.target.dataset.readingChapter;
    setActiveReadingChapter(id);
  },{rootMargin:'-20% 0px -60% 0px',threshold:[0,.1,.3,.6]});
  document.querySelectorAll('[data-reading-chapter]').forEach(chapter=>state.chapterObserver.observe(chapter));
}
function updateReadingProgress(){
  const section=document.querySelector('.book-reading-section');
  const bar=$('book-reading-progress');
  if(!section||!bar)return;
  const rect=section.getBoundingClientRect();
  const start=window.scrollY+rect.top;
  const distance=Math.max(1,section.offsetHeight-window.innerHeight);
  const progress=Math.max(0,Math.min(1,(window.scrollY-start)/distance));
  bar.style.width=`${Math.round(progress*100)}%`;
}
function setupReadingProgress(){
  if(state.progressBound)return;
  state.progressBound=true;
  window.addEventListener('scroll',()=>{
    if(state.progressRaf)return;
    state.progressRaf=requestAnimationFrame(()=>{state.progressRaf=0;updateReadingProgress()});
  },{passive:true});
  window.addEventListener('resize',updateReadingProgress,{passive:true});
}

function feedCard(item){
  const saved=state.savedFeed.has(item.id);
  const deepParts=[];
  if(item.example) deepParts.push(`<p><strong>דוגמה:</strong> ${esc(item.example)}</p>`);
  if(item.deepText) deepParts.push(`<p>${esc(item.deepText)}</p>`);
  return `<article class="book-feed-card" data-feed-card="${esc(item.id)}" data-feed-kind="${esc(item.kind)}">
    <div class="book-feed-card-top"><span class="book-feed-kind">${esc(item.typeLabel||item.kind)}</span>${sourceBadge(item.sourceLabel||'הרחבה מקצועית')}</div>
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

function normalizeBookPoint(value,index){
  if(typeof value==='string')return {title:'',text:value,index:index+1};
  if(value&&typeof value==='object')return {
    title:String(value.title||value.heading||''),
    text:String(value.text||value.description||value.summary||''),
    index:index+1
  };
  return {title:'',text:'',index:index+1};
}
function dedupeBookPoints(values){
  const seen=new Set(),result=[];
  (Array.isArray(values)?values:[]).forEach((value,index)=>{
    const point=normalizeBookPoint(value,index);
    const key=(point.title+' '+point.text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if(!key||seen.has(key))return;
    seen.add(key);result.push(point);
  });
  return result;
}
function bookPointSets(){
  const c=content(state.book);
  const curated=dedupeBookPoints(c.key_points);
  const learning=dedupeBookPoints(c.learning_points);
  const fallback=dedupeBookPoints([
    ...(Array.isArray(c.ideas)?c.ideas:[]),
    ...(Array.isArray(c.feed_posts)?c.feed_posts:[])
  ]);
  const highlights=(curated.length?curated:fallback).slice(0,10);
  const all=learning.length?learning:(curated.length?curated:fallback);
  return {highlights,all};
}
function renderBookKeyPoints(){
  const list=$('book-key-points-list'),count=$('book-key-points-count'),more=$('book-key-points-more');
  if(!list||!count||!more)return;
  const sets=bookPointSets();
  const points=state.keyPointsExpanded&&sets.all.length?sets.all:sets.highlights;
  list.innerHTML=points.length?points.map((point,index)=>`<li><span class="book-key-point-number">${String(index+1).padStart(2,'0')}</span><div>${point.title?`<strong>${esc(point.title.replace(/^\\d+\\.\\s*/,''))}</strong>`:''}<p>${esc(point.text)}</p></div></li>`).join(''):'<li class="meta">נוסיף נקודות מפתח בהמשך.</li>';
  count.textContent=state.keyPointsExpanded&&sets.all.length>sets.highlights.length?`${sets.all.length} נקודות ללמידה מעמיקה`:`${sets.highlights.length} נקודות מפתח לקריאה מהירה`;
  const hasMore=sets.all.length>sets.highlights.length;
  more.classList.toggle('hidden',!hasMore);
  more.textContent=state.keyPointsExpanded?'הצג רק את החשובות ביותר':`הצג את כל ${sets.all.length} הנקודות`;
}
function setKeyPointsOpen(open){
  const section=$('book-key-points-section'),toggle=$('book-key-points-toggle');
  if(!section||!toggle)return;
  section.classList.toggle('hidden',!open);
  toggle.classList.toggle('active',open);
  toggle.textContent=open?'⭐ סגור נקודות חשובות':'⭐ הנקודות החשובות';
  if(open)setTimeout(()=>section.scrollIntoView({behavior:'smooth',block:'start'}),20);
}
function renderStatic(){
  const book=state.book,c=content(book),ideas=Array.isArray(c.ideas)?c.ideas:[],topics=Array.isArray(c.topics)?c.topics:[];
  $('book-category').textContent=c.category||'ספר';
  $('book-title').textContent=book.title;
  document.title=`${book.title} | ספריית הלמידה שלי`;
  $('book-intro').textContent=c.summary||'קריאה רציפה: רעיונות, הקשרים, מושגים מקצועיים ויישום.';
  $('book-summary').textContent=c.summary||'';
  $('book-ideas').innerHTML=ideas.length?ideas.map(x=>`<li>${esc(x)}</li>`).join(''):'<li class="meta">נוסיף רעיונות בהמשך.</li>';
  $('book-topics').innerHTML=topics.length?topics.map(x=>`<li>${esc(x)}</li>`).join(''):'<li class="meta">נוסיף נושאים בהמשך.</li>';
  const dates=[...new Set(state.history.filter(r=>r.item_id===book.id).map(r=>r.feed_date))];
  $('book-history').innerHTML=dates.length?dates.map(d=>`<span class="pill">${esc(d)}</span>`).join(' '):'<span class="meta">הספר עדיין לא הופיע בפיד היומי.</span>';
  $('book-note').value=state.notes[book.slug||book.id]||'';
  state.keyPointsExpanded=false;
  renderBookKeyPoints();
  setKeyPointsOpen(false);
}
function newSeed(mode){return `${state.today}|${state.book.slug||state.book.id}|${mode}|${Date.now()}|${Math.random()}`}
function refreshAll(mode){
  if(isReaderPrototype())stopReadAloud('ההקראה נעצרה בגלל רענון.');
  const excludeTitles=isReaderPrototype()?state.readingChapters.map(ch=>ch.title):[];
  state.seed=newSeed(mode);
  renderReading(state.seed,isReaderPrototype()?{fullRefresh:true,excludeTitles}:null);
  resetFeed('all');
  toast(isReaderPrototype()?'קיבלת סט פרקים חדש לגמרי':mode==='surprise'?'פתחתי זוויות חדשות':mode==='random'?'נוצר מסלול קריאה רנדומלי חדש':'כל חלקי הספר רועננו');
  if(mode==='surprise')$('book-reading-body').scrollIntoView({behavior:'smooth',block:'start'});
}
function resolveBook(books){const params=new URLSearchParams(window.location.search),key=params.get('book');if(!key)return null;return books.find(book=>String(book.id)===key||String(book.slug||'')===key)||null}

async function loadBook(){
  try{
    if(!D)throw new Error('LibraryDiscovery unavailable');
    if(!F||typeof F.buildBookFeedBatch!=='function')throw new Error('BookInfiniteFeed unavailable');
    if(!R||typeof R.buildReadingChapters!=='function')throw new Error('BookReading unavailable');
    const response=await fetch(LIBRARY_API,{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json(),books=Array.isArray(data.books)?data.books:[];
    state.today=data.today||'';state.history=Array.isArray(data.history)?data.history:[];state.book=resolveBook(books);
    if(!state.book){$('book-status').textContent='הספר לא נמצא';$('book-title').textContent='הספר לא נמצא';$('book-reading-body').innerHTML='<div class="book-page-empty book-page-error">חזור לספרייה ובחר ספר מחדש.</div>';return}
    state.seed=`${state.today}|${state.book.slug||state.book.id}|daily`;
    renderStatic();renderReading(state.seed);resetFeed('all');setupInfiniteFeed();setupReadingProgress();
    $('book-status').textContent=isReaderPrototype()?'אב־טיפוס קריאה · סיכום פרק · תוכן עניינים · הקראה':'קריאה רציפה · העמקות · עוד מהספר';
  }catch(error){
    console.error(error);$('book-status').textContent='שגיאה בטעינת הספר';
    if($('book-reading-body'))$('book-reading-body').innerHTML='<div class="book-page-empty book-page-error">לא ניתן כרגע לטעון את הספר.</div>';
  }
}

function sourceExpansion(card,label){
  const book=state.book||{};
  const c=content(book);
  const bookTitle=book.title||'הספר';
  const titleNode=card.querySelector('h2,h3,h4');
  const title=titleNode?titleNode.textContent.trim():'הנושא';
  const textNode=card.querySelector(':scope > p,.reading-chapter-copy p,.reading-support-block p');
  const text=textNode?textNode.textContent.trim():'';
  const summary=c.summary||'';
  const ideas=Array.isArray(c.ideas)?c.ideas:[];
  const topics=Array.isArray(c.topics)?c.topics:[];
  let sourceTitle='הרחבה על מקור התוכן',explanation='',context='';

  if(label.includes('מתוך חומר הספר')){
    sourceTitle='📖 מה מקור החומר?';
    explanation=`החלק הזה נשען על חומר שכבר משויך ל־${bookTitle}. הניסוח כאן הוא עיבוד לימודי ופרפרזה שנועדו לאפשר קריאה רציפה, ולא העתקה ארוכה של טקסט מסחרי.`;
    context=summary?`הוא נקרא בתוך ההקשר הרחב של הספר: ${summary}`:`הוא מחובר לרעיונות ולנושאים שנשמרו במאגר של ${bookTitle}.`;
  }else if(label.includes('מושג מקצועי')){
    sourceTitle='🧠 מושג מקצועי קשור';
    explanation=`זהו מושג מקצועי שמתחבר לנושא של ${bookTitle}, אך אינו מוצג כאילו המחבר בהכרח משתמש בו במפורש.`;
    context='המטרה היא להוסיף שפה מקצועית שמסבירה מנגנון, גבול או יישום אפשרי של הרעיון.';
  }else if(label.includes('הרחבה מקצועית')){
    sourceTitle='🔬 הרחבה מקצועית';
    explanation=`זהו ידע לימודי נוסף שמחובר לנושא של ${bookTitle} כדי להרחיב את הקריאה מעבר לחומר הבסיסי.`;
    context='ההרחבה יכולה לכלול פסיכולוגיה, למידה, קבלת החלטות, אימון או יישום, בהתאם לנושא.';
  }else if(label.includes('ChatGPT')||label.includes('הצעה')){
    sourceTitle='✨ חיבור לימודי של ChatGPT';
    explanation=`זהו חיבור שנוצר כדי לפתוח זווית נוספת על ${bookTitle}. הוא מסומן בנפרד כדי שלא ייראה כטענה שמופיעה במפורש בספר.`;
    context='החיבור נועד לעזור בשאלות, ביקורת, העברה לחיים ויצירת קשרים בין רעיונות.';
  }else{
    sourceTitle=`🔎 מקור התוכן — ${label}`;
    explanation='זהו סימון שמבהיר מאיזו שכבת תוכן הגיע החלק שאתה קורא.';
    context=`אפשר לקרוא אותו לצד הרעיון המרכזי של ${bookTitle} ולבדוק מה הוא מוסיף.`;
  }

  const related=[...topics,...ideas].filter(Boolean).find(x=>{const value=String(x);return value!==text&&!text.includes(value)&&!value.includes(text)});
  return `<div class="source-expansion-panel">
    <div class="source-expansion-head"><strong>${esc(sourceTitle)}</strong><button class="source-expansion-close" data-source-expansion-close aria-label="סגור הרחבה">×</button></div>
    <p>${esc(explanation)}</p>
    ${text?`<p><strong>הקטע שאליו הסימון מתייחס:</strong> ${esc(text)}</p>`:''}
    <p><strong>הקשר:</strong> ${esc(context)}</p>
    ${related?`<p><strong>חיבור נוסף מהמאגר:</strong> ${esc(related)}</p>`:''}
    <p><strong>למה זה חשוב?</strong> סימון המקור מפריד בין חומר שמגיע ממאגר הספר, מושג מקצועי קשור וחיבור לימודי שנוסף כדי להעמיק. כך אפשר ללמוד לעומק בלי לטשטש מה שייך למה.</p>
  </div>`;
}
function sourceCardFor(element){return element.closest('.learning-card,.book-feed-card,.reading-chapter,.reading-support-block')}
function toggleSourceExpansion(badge){
  const card=sourceCardFor(badge);if(!card)return;
  const current=card.querySelector(':scope > .source-expansion-panel');
  if(current){current.remove();badge.setAttribute('aria-expanded','false');return}
  document.querySelectorAll('.source-expansion-panel').forEach(panel=>{const parent=panel.parentElement;if(parent&&parent!==card){const otherBadge=parent.querySelector('[data-source-expand]');if(otherBadge)otherBadge.setAttribute('aria-expanded','false');panel.remove()}});
  card.insertAdjacentHTML('beforeend',sourceExpansion(card,badge.textContent.trim()));
  badge.setAttribute('aria-expanded','true');
}
function closeReadingDeep(button){
  const chapter=button.closest('[data-reading-chapter]');if(!chapter)return;
  const panel=chapter.querySelector('[data-reading-deep]');
  const trigger=chapter.querySelector('[data-reading-deepen]');
  if(panel)panel.classList.add('hidden');
  if(trigger){trigger.setAttribute('aria-expanded','false');trigger.textContent='העמק בפרק'}
}

document.addEventListener('click',event=>{
  const closeDeep=event.target.closest('[data-reading-close]');if(closeDeep){closeReadingDeep(closeDeep);return}
  const deepen=event.target.closest('[data-reading-deepen]');
  if(deepen){
    const chapter=deepen.closest('[data-reading-chapter]'),panel=chapter&&chapter.querySelector('[data-reading-deep]');if(!panel)return;
    const opening=panel.classList.contains('hidden');panel.classList.toggle('hidden');deepen.setAttribute('aria-expanded',String(opening));deepen.textContent=opening?'סגור העמקה':'העמק בפרק';
    if(opening)setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}),30);
    return;
  }
  const closeExpansion=event.target.closest('[data-source-expansion-close]');
  if(closeExpansion){const card=sourceCardFor(closeExpansion);if(card){const badge=card.querySelector('[data-source-expand]');const panel=card.querySelector(':scope > .source-expansion-panel');if(panel)panel.remove();if(badge)badge.setAttribute('aria-expanded','false')}return}
  const source=event.target.closest('[data-source-expand]');if(source){toggleSourceExpansion(source);return}
  const toc=event.target.closest('[data-toc-target]');if(toc){event.preventDefault();const target=document.getElementById(`chapter-${toc.dataset.tocTarget}`);if(target){setActiveReadingChapter(toc.dataset.tocTarget);target.scrollIntoView({behavior:'smooth',block:'start'})}return}
  const filter=event.target.closest('[data-book-feed-filter]');if(filter){resetFeed(filter.dataset.bookFeedFilter);return}
  const card=event.target.closest('[data-feed-card]');if(!card)return;
  if(event.target.closest('[data-feed-deepen]')){const deep=card.querySelector('.book-feed-deep'),btn=event.target.closest('[data-feed-deepen]');deep.classList.toggle('hidden');btn.textContent=deep.classList.contains('hidden')?'העמק':'סגור';return}
  if(event.target.closest('[data-feed-more-like]')){moreLike(card);return}
  if(event.target.closest('[data-feed-refresh]')){refreshFeedCard(card);return}
  if(event.target.closest('[data-feed-save]')){toggleFeedSave(card);return}
});

document.addEventListener('keydown',event=>{
  const badge=event.target.closest&&event.target.closest('[data-source-expand]');
  if(badge&&(event.key==='Enter'||event.key===' ')){event.preventDefault();toggleSourceExpansion(badge)}
});

$('book-refresh-all').addEventListener('click',()=>refreshAll('refresh'));
$('book-random').addEventListener('click',()=>refreshAll('random'));
$('book-surprise').addEventListener('click',()=>refreshAll('surprise'));
$('book-key-points-toggle').addEventListener('click',()=>setKeyPointsOpen($('book-key-points-section').classList.contains('hidden')));
$('book-key-points-close').addEventListener('click',()=>setKeyPointsOpen(false));
$('book-key-points-more').addEventListener('click',()=>{state.keyPointsExpanded=!state.keyPointsExpanded;renderBookKeyPoints()});
$('book-feed-more').addEventListener('click',appendFeed);
$('book-save-note').addEventListener('click',()=>{if(!state.book)return;state.notes[state.book.slug||state.book.id]=$('book-note').value;localStorage.setItem(notesKey,JSON.stringify(state.notes));toast('ההערה נשמרה')});
$('book-read-aloud').addEventListener('click',speakCurrentChapter);
$('book-read-floating').addEventListener('click',()=>{state.speechUtterance?toggleReadPause():speakCurrentChapter()});
$('book-read-pause').addEventListener('click',toggleReadPause);
$('book-read-stop').addEventListener('click',()=>stopReadAloud('ההקראה נעצרה.'));
$('book-read-rate').addEventListener('change',()=>{
  setReadStatus(`קצב ההקראה נקבע ל־${readRate()}×`);
});
$('book-read-language').addEventListener('change',()=>{
  const control=$('book-read-language');
  const label=control&&control.options[control.selectedIndex]?control.options[control.selectedIndex].textContent:'';
  setReadStatus(`שפת ההקראה: ${label}`);
});
window.addEventListener('beforeunload',()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()});

loadBook();
})();
