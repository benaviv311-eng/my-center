(function(){
'use strict';

const S=window.BookStructure;
if(!S||typeof S.buildBookStructure!=='function')return;

const LIBRARY_PATH='/functions/v1/library-feed';
let currentBook=null;
let expandedLearning=false;

const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const $=id=>document.getElementById(id);

function isLibraryRequest(input){
  const value=typeof input==='string'?input:(input&&typeof input.url==='string'?input.url:'');
  try{
    const url=new URL(value,window.location.href);
    return url.pathname.endsWith(LIBRARY_PATH)&&url.searchParams.get('json')==='1';
  }catch(_error){
    return false;
  }
}

function resolveBook(books){
  const key=new URLSearchParams(window.location.search).get('book');
  if(!key)return null;
  return (Array.isArray(books)?books:[]).find(book=>String(book&&book.id||'')===key||String(book&&book.slug||'')===key)||null;
}

function pointHtml(point,index,numberClass){
  return `<li><span class="${numberClass}">${String(index+1).padStart(2,'0')}</span><div>${point.title?`<strong>${esc(point.title.replace(/^\d+\.\s*/,''))}</strong>`:''}<p>${esc(point.text)}</p></div></li>`;
}

function renderKeyPoints(structure){
  const section=$('book-key-points-section');
  const list=$('book-key-points-list');
  const count=$('book-key-points-count');
  const toggle=$('book-key-points-toggle');
  if(!section||!list||!count||!toggle)return;
  section.classList.remove('hidden');
  list.innerHTML=structure.keyPoints.length
    ? structure.keyPoints.map((point,index)=>pointHtml(point,index,'book-key-point-number')).join('')
    : '<li class="meta">נוסיף נקודות מפתח בהמשך.</li>';
  count.textContent=structure.keyPoints.length?`${structure.keyPoints.length} נקודות שחייבים לקחת מהספר`:'אין עדיין נקודות מפתח מסודרות.';
  toggle.classList.remove('active');
  toggle.textContent='⭐ לנקודות החשובות';
  const legacyMore=$('book-key-points-more');
  if(legacyMore)legacyMore.classList.add('hidden');
}

function renderLearningPoints(structure){
  const section=$('book-learning-points-section');
  const list=$('book-learning-points-list');
  const count=$('book-learning-points-count');
  const toggle=$('book-learning-points-toggle');
  if(!section||!list||!count||!toggle)return;

  const all=structure.learningPoints;
  const previewLimit=8;
  const shown=expandedLearning?all:all.slice(0,previewLimit);
  count.textContent=all.length
    ? `${all.length} נקודות במאגר הלמידה של הספר`
    : 'נוסיף שכבת למידה מורחבת בהמשך.';

  if(!all.length){
    list.innerHTML='<li class="book-learning-points-note">עדיין אין חומר מורחב נוסף לספר הזה.</li>';
  }else if(!structure.hasExtendedLearning){
    list.innerHTML='<li class="book-learning-points-note">כרגע מאגר הלמידה המלא זהה לנקודות החשובות שמופיעות למעלה. כשהספר יורחב, שכבת העומק תופיע כאן.</li>';
  }else{
    list.innerHTML=shown.map((point,index)=>pointHtml(point,index,'book-learning-point-number')).join('');
  }

  const canExpand=structure.hasExtendedLearning&&all.length>previewLimit;
  toggle.classList.toggle('hidden',!canExpand);
  toggle.textContent=expandedLearning?'הצג פחות':`הצג את כל ${all.length} הנקודות`;
  section.dataset.expanded=expandedLearning?'true':'false';
}

function renderUniversalBookStructure(book){
  if(!book)return;
  currentBook=book;
  const structure=S.buildBookStructure(book);
  renderKeyPoints(structure);
  renderLearningPoints(structure);
}

function scheduleRender(book){
  currentBook=book||currentBook;
  if(!currentBook)return;
  setTimeout(()=>renderUniversalBookStructure(currentBook),0);
  setTimeout(()=>renderUniversalBookStructure(currentBook),120);
}

function installFetchBridge(){
  if(typeof window.fetch!=='function'||window.__bookStructureFetchInstalled)return;
  const nativeFetch=window.fetch.bind(window);
  window.__bookStructureFetchInstalled=true;
  window.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    if(!isLibraryRequest(input)||!response||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const book=resolveBook(data&&data.books);
      if(book){
        expandedLearning=false;
        scheduleRender(book);
      }
    }catch(_error){
      /* Keep the original response untouched if structure enrichment fails. */
    }
    return response;
  };
}

function setupControls(){
  document.addEventListener('click',event=>{
    const keyToggle=event.target.closest&&event.target.closest('#book-key-points-toggle');
    if(keyToggle){
      event.preventDefault();
      event.stopImmediatePropagation();
      const section=$('book-key-points-section');
      if(section)section.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    const learningToggle=event.target.closest&&event.target.closest('#book-learning-points-toggle');
    if(learningToggle){
      event.preventDefault();
      event.stopImmediatePropagation();
      expandedLearning=!expandedLearning;
      if(currentBook)renderUniversalBookStructure(currentBook);
    }
  },true);
}

window.renderUniversalBookStructure=renderUniversalBookStructure;
installFetchBridge();
setupControls();
})();
