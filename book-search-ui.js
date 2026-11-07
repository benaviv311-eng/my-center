(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.BookSearchUI=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';

  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const groups={guide:'טיפוסי אישיות והעמקה',chapter:'פרקים', 'chapter-source':'פרקים נוספים במאגר',topic:'נושאים',idea:'רעיונות מרכזיים',passage:'קטעי תוכן',point:'נקודות ללמידה',concept:'מושגים מקצועיים'};
  const order=['guide','chapter','chapter-source','topic','idea','concept','point','passage'];

  function makeResultsMarkup(entries){
    if(!Array.isArray(entries)||!entries.length)return '<p class="book-search-empty">לא נמצאו תוצאות. נסה ביטוי אחר או מונח קצר יותר.</p>';
    const kinds=[...new Set(entries.map(entry=>entry.kind))].sort((a,b)=>{
      const first=order.indexOf(a),second=order.indexOf(b);
      return (first<0?99:first)-(second<0?99:second);
    });
    return kinds.map(kind=>{
      const items=entries.filter(entry=>entry.kind===kind);
      return `<section class="book-search-group"><h3>${esc(groups[kind]||'תוצאות נוספות')} <span>${items.length}</span></h3><div class="book-search-items">${items.map(entry=>{
        const description=String(entry.description||'').trim();
        const preview=description.length>172?description.slice(0,169).trim()+'…':description;
        return `<button class="book-search-item" type="button" data-book-search-result="${esc(entry.id)}"><strong>${esc(entry.title)}</strong>${preview?`<span>${esc(preview)}</span>`:''}<small>${entry.chapterId?'עבור לפרק ←':'פתח פירוט ←'}</small></button>`;
      }).join('')}</div></section>`;
    }).join('');
  }

  function makeDetailMarkup(entry){
    const blocks=[['הסבר',entry.detail||entry.description],['דוגמה',entry.example],['איך להשתמש ברעיון',entry.application],['הבחנה חשובה',entry.distinction]]
      .filter(([,value])=>String(value||'').trim());
    const body=blocks.length?blocks.map(([label,value])=>`<section><h4>${esc(label)}</h4><p>${esc(value)}</p></section>`).join('')
      :'<p>הנושא מופיע במפת הספר, אך עדיין אין לו הסבר מפורט במאגר. אפשר לאתר אותו ברשימת הנושאים ולחזור אליו בהמשך.</p>';
    const source=String(entry.sourceUrl||'');
    const link=/^https:\/\//i.test(source)?` · <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">לטקסט המקור</a>`:'';
    return `<div class="book-search-detail-head"><span class="reading-eyebrow">${esc(groups[entry.kind]||'מושג')}</span><button type="button" data-book-search-detail-close aria-label="חזור לתוצאות">×</button></div><h3>${esc(entry.title)}</h3>${body}<footer>מקור: ${esc(entry.sourceLabel||'חומר הספר')}${link}</footer>`;
  }

  function install(){
    if(!root.document)return;
    const doc=root.document;
    const $=id=>doc.getElementById(id);
    const toggle=$('book-search-toggle'),panel=$('book-search-panel'),input=$('book-search-input');
    const results=$('book-search-results'),count=$('book-search-count'),detail=$('book-search-detail');
    if(!toggle||!panel||!input||!results||!detail)return;
    let index=[],byId=new Map();

    function renderResults(){
      const Search=root.BookSearch;
      const matching=Search?Search.searchBookIndex(index,input.value):[];
      count.textContent=index.length?`${matching.length} תוצאות מתוך ${index.length} פריטים במפתח הספר`:'טוען את תוכן הספר…';
      results.innerHTML=makeResultsMarkup(matching);
      detail.classList.add('hidden');
      detail.innerHTML='';
    }
    function setOpen(open){
      panel.classList.toggle('hidden',!open);
      toggle.setAttribute('aria-expanded',String(open));
      if(open){renderResults();panel.scrollIntoView({behavior:'smooth',block:'start'});input.focus({preventScroll:true})}
      else toggle.focus({preventScroll:true});
    }
    toggle.addEventListener('click',()=>setOpen(panel.classList.contains('hidden')));
    $('book-search-close')?.addEventListener('click',()=>setOpen(false));
    input.addEventListener('input',renderResults);
    panel.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
    results.addEventListener('click',event=>{
      const button=event.target.closest('[data-book-search-result]');
      if(!button)return;
      const entry=byId.get(button.getAttribute('data-book-search-result'));
      if(!entry)return;
      const chapter=entry.chapterId?doc.getElementById(`chapter-${entry.chapterId}`):null;
      if(chapter){
        panel.classList.add('hidden');
        toggle.setAttribute('aria-expanded','false');
        chapter.scrollIntoView({behavior:'smooth',block:'start'});
        const heading=chapter.querySelector('h2');
        if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
        return;
      }
      detail.innerHTML=makeDetailMarkup(entry);
      detail.classList.remove('hidden');
      detail.scrollIntoView({behavior:'smooth',block:'nearest'});
      detail.querySelector('[data-book-search-detail-close]')?.focus({preventScroll:true});
    });
    detail.addEventListener('click',event=>{
      if(event.target.closest('[data-book-search-detail-close]')){
        detail.classList.add('hidden');
        const first=results.querySelector('[data-book-search-result]');
        if(first)first.focus({preventScroll:true});
      }
    });
    root.addEventListener('book:content-ready',event=>{
      const book=event.detail&&event.detail.book;
      const chapters=event.detail&&event.detail.chapters;
      const Search=root.BookSearch,D=root.LibraryDiscovery;
      if(!Search||!book)return;
      const concepts=D&&D.matchConcepts&&Array.isArray(D.LEARNING_CONCEPTS)?D.matchConcepts(book,D.LEARNING_CONCEPTS.length):[];
      const guides=root.BookSearchGuides?root.BookSearchGuides.forBook(book):[];
      index=Search.buildBookIndex(book,chapters,concepts,guides);
      byId=new Map(index.map(entry=>[entry.id,entry]));
      if(!panel.classList.contains('hidden'))renderResults();
    });
  }

  if(root.document){
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});
    else install();
  }
  return {makeResultsMarkup,makeDetailMarkup};
});
