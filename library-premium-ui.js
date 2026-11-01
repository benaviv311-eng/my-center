(() => {
  'use strict';

  const recentKey='library-premium-recent';
  const $=id=>document.getElementById(id);
  const THEMES=[
    {bg:'#18362b',accent:'#d4b06a',ink:'#fff9ed'},
    {bg:'#242946',accent:'#e7b77c',ink:'#fffaf2'},
    {bg:'#5b2f2c',accent:'#e6c394',ink:'#fff8ef'},
    {bg:'#243742',accent:'#9fc5c9',ink:'#f6fbfa'},
    {bg:'#584928',accent:'#ead99d',ink:'#fffced'},
    {bg:'#312d36',accent:'#c8a7d3',ink:'#fff8ff'},
    {bg:'#6b4b38',accent:'#d8b28c',ink:'#fff7ef'},
    {bg:'#1f4a4a',accent:'#aad2c6',ink:'#f2fffb'},
    {bg:'#40462c',accent:'#d4d59a',ink:'#fbfce9'},
    {bg:'#44312d',accent:'#d6a58e',ink:'#fff7f3'}
  ];

  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0;
  };
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function titleParts(value){
    const raw=String(value||'ספר').trim();
    const parts=raw.split(/\s+[—–-]\s+/);
    return {title:(parts[0]||raw).trim(),author:(parts.slice(1).join(' — ')||'').trim()};
  }
  function coverTheme(key){
    return THEMES[hash(key)%THEMES.length];
  }
  function coverInitials(title){
    const clean=titleParts(title).title.replace(/[^\p{L}\p{N}\s]/gu,' ').trim();
    const words=clean.split(/\s+/).filter(Boolean);
    return words.slice(0,2).map(word=>word[0]||'').join('').toUpperCase()||'BK';
  }
  function bookCoverHtml(key,title,category='',size=''){
    const theme=coverTheme(key||title);
    const parts=titleParts(title);
    return '<div class="library-book-cover '+esc(size)+'" style="--cover-bg:'+theme.bg+';--cover-accent:'+theme.accent+';--cover-ink:'+theme.ink+'" aria-label="כריכה מעוצבת של '+esc(parts.title)+'">'+
      '<span class="library-book-cover-mark">'+esc(coverInitials(parts.title))+'</span>'+
      '<span class="library-book-cover-category">'+esc(category||'MY LIBRARY')+'</span>'+
      '<strong class="library-book-cover-title">'+esc(parts.title)+'</strong>'+
      (parts.author?'<span class="library-book-cover-author">'+esc(parts.author)+'</span>':'')+
    '</div>';
  }

  function cardInfo(card){
    const id=card?.dataset?.bookId||'book';
    const title=(card?.querySelector('h3,strong')?.textContent||'ספר').trim();
    const category=(card?.querySelector('.category')?.textContent||'ספר').trim();
    return {id,title,category};
  }
  function decorateBookCard(card,index){
    if(!card||card.dataset.editorialDecorated)return;
    const {id,title,category}=cardInfo(card);
    card.dataset.editorialDecorated='1';
    card.insertAdjacentHTML('afterbegin',bookCoverHtml(id,title,category,card.classList.contains('daily-book')&&index===0?'large':''));
  }
  function decorateCards(){
    document.querySelectorAll('#daily-books .daily-book').forEach(decorateBookCard);
    document.querySelectorAll('#library-books-grid .book-card').forEach(decorateBookCard);
  }
  function enhanceDailySelection(){
    const cards=[...document.querySelectorAll('#daily-books .daily-book')];
    if(!cards.length)return;
    cards.forEach((card,index)=>{
      card.classList.toggle('library-featured-book',index===0);
      card.classList.toggle('library-supporting-book',index>0);
      if(index===0&&!card.querySelector('.library-featured-label')){
        const label=document.createElement('div');
        label.className='library-featured-label';
        label.textContent='הספר המרכזי של היום';
        const category=card.querySelector('.category');
        if(category)category.insertAdjacentElement('beforebegin',label);
        else card.appendChild(label);
      }
      if(index===0&&!card.querySelector('.library-featured-summary')){
        const id=card.dataset.bookId;
        const source=id?document.querySelector('#library-books-grid .book-card[data-book-id="'+CSS.escape(id)+'"] p'):null;
        const p=document.createElement('p');
        p.className='library-featured-summary';
        p.textContent=(source?.textContent||'ספר שכדאי לפתוח היום ולבחור ממנו רעיון אחד לקחת הלאה.').trim();
        const meta=card.querySelector('.meta');
        if(meta)meta.insertAdjacentElement('beforebegin',p); else card.appendChild(p);
      }
    });
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
      const info=cardInfo(card);
      let shelf=shelfFor(info.category+' '+info.title);
      if(shelf==='לחשוב אחרת'&&cards.length>=3){
        const fallbacks=['אימון ומומחיות','פסיכולוגיה והתנהגות','למידה וחינוך'];
        shelf=fallbacks[hash(info.id||info.title)%fallbacks.length];
      }
      if(!groups.has(shelf))groups.set(shelf,[]);
      groups.get(shelf).push({...info,index});
    });
    const order=['אימון ומומחיות','פסיכולוגיה והתנהגות','למידה וחינוך','לחשוב אחרת'];
    root.innerHTML=order.filter(name=>groups.has(name)).map(name=>{
      const books=groups.get(name);
      return '<section class="library-shelf"><div class="library-shelf-head"><div><h3>'+esc(name)+'</h3><small>'+books.length+' ספרים</small></div></div>'+
        '<div class="library-shelf-track">'+books.map(book=>
          '<button type="button" class="library-shelf-book library-open-book" data-book-id="'+esc(book.id)+'">'+
            bookCoverHtml(book.id,book.title,book.category,'compact')+
            '<span class="library-shelf-book-copy"><strong>'+esc(titleParts(book.title).title)+'</strong><small>'+esc(titleParts(book.title).author||book.category)+'</small></span>'+
          '</button>'
        ).join('')+'</div></section>';
    }).join('');
  }

  function readRecent(){
    try{const parsed=JSON.parse(localStorage.getItem(recentKey)||'[]');return Array.isArray(parsed)?parsed:[]}catch(_){return []}
  }
  function writeRecent(items){try{localStorage.setItem(recentKey,JSON.stringify(items.slice(0,8)))}catch(_){}}
  function rememberBook(el){
    const id=el?.dataset?.bookId;
    if(!id)return;
    const source=el.closest('.book-card,.daily-book,.library-shelf-book,.library-continue-card')||document.querySelector('.book-card[data-book-id="'+CSS.escape(id)+'"]');
    const title=(source?.querySelector('h3,strong')?.textContent||source?.textContent||'ספר').trim().replace(/\s+/g,' ').slice(0,140);
    const category=(source?.querySelector('.category,small')?.textContent||'').trim().slice(0,80);
    writeRecent([{id,title,category,openedAt:Date.now()},...readRecent().filter(item=>item.id!==id)]);
    renderContinue();
  }
  function renderContinue(){
    const section=$('library-continue-section'),list=$('library-continue-list');
    if(!section||!list)return;
    const recent=readRecent().slice(0,6);
    section.hidden=!recent.length;
    list.innerHTML=recent.map(book=>
      '<button type="button" class="library-continue-card library-open-book" data-book-id="'+esc(book.id)+'">'+
        bookCoverHtml(book.id,book.title,book.category,'compact')+
        '<span><strong>'+esc(titleParts(book.title).title)+'</strong><small>'+esc(titleParts(book.title).author||book.category||'נפתח לאחרונה')+'</small><small>המשך לקרוא ←</small></span>'+
      '</button>'
    ).join('');
  }

  function decorateEditorialInsight(){
    const first=document.querySelector('#daily-feed .nugget-card');
    if(!first||first.classList.contains('library-editorial-insight'))return;
    first.classList.add('library-editorial-insight');
    const label=document.createElement('span');
    label.className='editorial-insight-label';
    label.textContent='רעיון שכדאי לקחת היום';
    first.insertAdjacentElement('afterbegin',label);
  }

  function ensureBookNav(card){
    if(card.querySelector('.library-book-internal-nav'))return;
    const nav=document.createElement('nav');
    nav.className='library-book-internal-nav';
    nav.innerHTML=
      '<button type="button" data-book-nav="dynamic">רעיונות</button>'+
      '<button type="button" data-book-nav="summary">סקירה</button>'+
      '<button type="button" data-book-nav="ideas">עיקרי הספר</button>'+
      '<button type="button" data-book-nav="topics">נושאים</button>'+
      '<button type="button" data-book-nav="notes">ההערות שלי</button>';
    const tools=card.querySelector('.book-tools');
    if(tools)tools.insertAdjacentElement('afterend',nav);
  }
  function decorateSheet(){
    const sheet=$('library-book-sheet'),card=sheet?.querySelector('.book-sheet-card');
    if(!sheet||!card||sheet.classList.contains('hidden'))return;
    const rawTitle=($('library-book-title')?.textContent||'ספר').trim();
    const category=($('library-book-category')?.textContent||'ספר').trim();
    const id=document.querySelector('.library-open-book[data-book-id][data-active-book]')?.dataset.bookId||rawTitle;
    const parts=titleParts(rawTitle);
    let hero=card.querySelector('.library-book-premium-hero');
    if(!hero){hero=document.createElement('section');hero.className='library-book-premium-hero';card.insertBefore(hero,card.firstChild)}
    hero.innerHTML=
      bookCoverHtml(id,rawTitle,category,'large')+
      '<div class="library-book-premium-copy"><span class="category">'+esc(category)+'</span><h2>'+esc(parts.title)+'</h2>'+
      (parts.author?'<div class="library-book-author">'+esc(parts.author)+'</div>':'')+
      '<p>תקציר, רעיונות מרכזיים, יישומים והערות אישיות — מסודרים לקריאה ולא רק לאחסון.</p></div>';
    ensureBookNav(card);
  }
  function scrollBookSection(kind){
    let target=null;
    if(kind==='dynamic')target=$('library-book-dynamic');
    else target=document.querySelector('[data-book-static="'+CSS.escape(kind)+'"]');
    target?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function installActions(){
    document.addEventListener('click',event=>{
      const action=event.target.closest('[data-library-hero-action]');
      if(action){
        const kind=action.dataset.libraryHeroAction;
        if(kind==='learn'){
          document.querySelector('[data-library-view="books"]')?.click();
          setTimeout(()=>$('library-view-books')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
        }else if(kind==='practical') $('library-randomize')?.click();
        else if(kind==='surprise') $('library-random-top')?.click();
        return;
      }
      const nav=event.target.closest('[data-book-nav]');
      if(nav){scrollBookSection(nav.dataset.bookNav);return}
      const open=event.target.closest('.library-open-book');
      if(open)rememberBook(open);
    },true);
  }

  function refreshPresentation(){
    decorateCards();
    enhanceDailySelection();
    renderShelves();
    decorateEditorialInsight();
  }
  function installObservers(){
    const targets=[$('daily-books'),$('library-books-grid'),$('daily-feed')].filter(Boolean);
    targets.forEach(target=>new MutationObserver(refreshPresentation).observe(target,{childList:true}));
    const sheet=$('library-book-sheet');
    if(sheet)new MutationObserver(decorateSheet).observe(sheet,{attributes:true,attributeFilter:['class','aria-hidden']});
    refreshPresentation();
  }

  renderContinue();
  installActions();
  installObservers();
})();