(() => {
  'use strict';

  const HERO_IMAGE='https://images.unsplash.com/photo-1743300873236-39e755465c7a?auto=format&fit=crop&fm=jpg&q=82&w=1800';
  const EDITORIAL_IMAGES=[
    'https://images.unsplash.com/photo-1756037020659-6f9d3418f6b6?auto=format&fit=crop&fm=jpg&q=76&w=1000',
    'https://images.unsplash.com/photo-1767102060241-130cb9260718?auto=format&fit=crop&fm=jpg&q=76&w=1000',
    HERO_IMAGE
  ];
  const recentKey='library-premium-recent';
  const $=id=>document.getElementById(id);
  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function imageFor(key,offset=0){
    return EDITORIAL_IMAGES[(hash(key)+offset)%EDITORIAL_IMAGES.length];
  }
  function coverHtml(key,title,offset=0){
    return '<div class="library-cover" aria-hidden="true"><img loading="lazy" decoding="async" alt="" src="'+imageFor(key,offset)+'"></div>';
  }
  function protectImage(img){
    if(!img||img.dataset.libraryImageGuard)return;
    img.dataset.libraryImageGuard='1';
    img.addEventListener('error',()=>{img.hidden=true;img.parentElement?.classList.add('is-fallback')},{once:true});
  }
  function decorateBookCard(card,index){
    if(!card||card.dataset.premiumDecorated)return;
    const id=card.dataset.bookId||'book-'+index;
    const title=(card.querySelector('h3,strong')?.textContent||'ספר').trim();
    card.dataset.premiumDecorated='1';
    card.insertAdjacentHTML('afterbegin',coverHtml(id,title,index));
    protectImage(card.querySelector('.library-cover img'));
  }
  function decorateCards(){
    document.querySelectorAll('#daily-books .daily-book').forEach(decorateBookCard);
    document.querySelectorAll('#library-books-grid .book-card').forEach(decorateBookCard);
  }

  function shelfFor(text){
    const value=String(text||'').toLowerCase();
    if(/coach|sport|performance|practice|skill|אימון|ביצוע|מיומנות/.test(value)) return 'אימון ומומחיות';
    if(/psych|behavior|habit|mind|emotion|reinforcement|פסיכ|התנהגות|הרגל|רגש/.test(value)) return 'פסיכולוגיה והתנהגות';
    if(/learn|education|teach|study|למיד|חינוך|הוראה/.test(value)) return 'למידה וחינוך';
    return 'לחשוב אחרת';
  }
  function renderShelves(){
    const root=$('library-shelves');
    const cards=[...document.querySelectorAll('#library-books-grid .book-card')];
    if(!root||!cards.length)return;
    const groups=new Map();
    cards.forEach((card,index)=>{
      const id=card.dataset.bookId;
      const title=(card.querySelector('h3')?.textContent||'ספר').trim();
      const category=(card.querySelector('.category')?.textContent||'').trim();
      let shelf=shelfFor(category+' '+title);
      if(shelf==='לחשוב אחרת'&&cards.length>=3){
        const fallbacks=['אימון ומומחיות','פסיכולוגיה והתנהגות','למידה וחינוך'];
        shelf=fallbacks[hash(id||title)%fallbacks.length];
      }
      if(!groups.has(shelf))groups.set(shelf,[]);
      groups.get(shelf).push({id,title,category,index});
    });
    const order=['אימון ומומחיות','פסיכולוגיה והתנהגות','למידה וחינוך','לחשוב אחרת'];
    root.innerHTML=order.filter(name=>groups.has(name)).map(name=>{
      const books=groups.get(name);
      return '<section class="library-shelf"><div class="library-shelf-head"><div><h3>'+esc(name)+'</h3><small>'+books.length+' ספרים ורעיונות</small></div></div><div class="library-shelf-track">'+books.map(book=>
        '<button type="button" class="library-shelf-book library-open-book" data-book-id="'+esc(book.id)+'">'+
          coverHtml(book.id,book.title,book.index+1)+
          '<span class="library-shelf-book-copy"><strong>'+esc(book.title)+'</strong><small>'+esc(book.category||'ספר')+'</small></span>'+
        '</button>'
      ).join('')+'</div></section>';
    }).join('');
    root.querySelectorAll('img').forEach(protectImage);
  }

  function readRecent(){
    try{
      const parsed=JSON.parse(localStorage.getItem(recentKey)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch(_){return []}
  }
  function writeRecent(items){
    try{localStorage.setItem(recentKey,JSON.stringify(items.slice(0,8)))}catch(_){}
  }
  function rememberBook(el){
    const id=el?.dataset?.bookId;
    if(!id)return;
    const source=el.closest('.book-card,.daily-book,.library-shelf-book,.library-continue-card')||document.querySelector('.book-card[data-book-id="'+CSS.escape(id)+'"]');
    const title=(source?.querySelector('h3,strong')?.textContent||source?.textContent||'ספר').trim().replace(/\s+/g,' ').slice(0,120);
    const category=(source?.querySelector('.category,small')?.textContent||'').trim().slice(0,80);
    const next=[{id,title,category,openedAt:Date.now()},...readRecent().filter(item=>item.id!==id)];
    writeRecent(next);
    renderContinue();
  }
  function renderContinue(){
    const section=$('library-continue-section');
    const list=$('library-continue-list');
    if(!section||!list)return;
    const recent=readRecent().slice(0,6);
    section.hidden=!recent.length;
    list.innerHTML=recent.map((book,index)=>
      '<button type="button" class="library-continue-card library-open-book" data-book-id="'+esc(book.id)+'">'+
        coverHtml(book.id,book.title,index+2)+
        '<span><strong>'+esc(book.title)+'</strong><small>'+(esc(book.category)||'נפתח לאחרונה')+'</small><small>המשך לקרוא ←</small></span>'+
      '</button>'
    ).join('');
    list.querySelectorAll('img').forEach(protectImage);
  }

  function decorateSheet(){
    const sheet=$('library-book-sheet');
    const card=sheet?.querySelector('.book-sheet-card');
    if(!sheet||!card||sheet.classList.contains('hidden'))return;
    const title=($('library-book-title')?.textContent||'ספר').trim();
    const category=($('library-book-category')?.textContent||'ספר').trim();
    let hero=card.querySelector('.library-book-premium-hero');
    if(!hero){
      hero=document.createElement('section');
      hero.className='library-book-premium-hero';
      card.insertBefore(hero,card.firstChild);
    }
    hero.innerHTML=coverHtml(title,title,3)+'<div class="library-book-premium-copy"><span class="category">'+esc(category)+'</span><h2>'+esc(title)+'</h2><p>תקציר, רעיונות, יישומים וחיבורים — במקום אחד.</p></div>';
    protectImage(hero.querySelector('img'));
  }

  function installHeroActions(){
    document.addEventListener('click',event=>{
      const action=event.target.closest('[data-library-hero-action]');
      if(action){
        const kind=action.dataset.libraryHeroAction;
        if(kind==='learn'){
          document.querySelector('[data-library-view="books"]')?.click();
          setTimeout(()=>$('library-view-books')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
        }else if(kind==='practical'){
          $('library-randomize')?.click();
        }else if(kind==='surprise'){
          $('library-random-top')?.click();
        }
        return;
      }
      const open=event.target.closest('.library-open-book');
      if(open)rememberBook(open);
    },true);
  }

  function installObservers(){
    const daily=$('daily-books'),grid=$('library-books-grid'),sheet=$('library-book-sheet');
    const refresh=()=>{decorateCards();renderShelves()};
    if(daily)new MutationObserver(refresh).observe(daily,{childList:true});
    if(grid)new MutationObserver(refresh).observe(grid,{childList:true});
    if(sheet)new MutationObserver(decorateSheet).observe(sheet,{attributes:true,attributeFilter:['class','aria-hidden']});
    refresh();
  }

  function addPhotoStrip(){
    const random=$('library-random-section');
    if(!random||document.querySelector('.library-photo-strip'))return;
    const strip=document.createElement('section');
    strip.className='library-photo-strip';
    strip.setAttribute('aria-label','אווירת קריאה ולמידה');
    strip.innerHTML=
      '<figure><img loading="lazy" alt="חלל קריאה חם עם ספרים" src="'+EDITORIAL_IMAGES[2]+'"><figcaption>Brooke Balentine · Unsplash</figcaption></figure>'+
      '<figure><img loading="lazy" alt="ספרייה מודרנית עם מדפי ספרים" src="'+EDITORIAL_IMAGES[1]+'"><figcaption>Fer Troulik · Unsplash</figcaption></figure>';
    random.insertAdjacentElement('afterend',strip);
    strip.querySelectorAll('img').forEach(protectImage);
  }

  renderContinue();
  installHeroActions();
  installObservers();
  addPhotoStrip();
})();