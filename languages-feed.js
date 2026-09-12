(function(){
  const M=window.LanguageFeedModel;
  if(!M)return;

  const STORAGE_KEY='my-center-language-feed-v1';
  const TYPE_LABELS={word:'מילה',sentence:'משפט',joke:'בדיחה',story:'סיפור קצר',dialogue:'מיני־דיאלוג',challenge:'אתגר מהיר',culture:'תרבות ושפה'};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {filter:raw.filter||'all',refresh:Number(raw.refresh)||0,reactions:raw.reactions||{},more:Number(raw.more)||0};
    }catch(e){return {filter:'all',refresh:0,reactions:{},more:0};}
  }
  const state=load();
  if(!['all',...M.LANGUAGE_CODES].includes(state.filter))state.filter='all';
  let batch=0;

  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function itemDisplay(lang,row){return M.getDisplay({lang,target:row[0],pron:row[1]||'',he:row[2]||''});}
  function displayBlock(display,translationVisible=true){
    return `<div class="feed-primary">${esc(display.primary)}</div>${display.secondary?`<div class="feed-secondary">${esc(display.secondary)}</div>`:''}${translationVisible?`<div class="feed-translation">${esc(display.translation)}</div>`:''}`;
  }
  function cardHeader(card){
    const lang=M.LANGUAGES[card.lang];
    return `<div class="feed-card-header"><div class="feed-card-language"><span class="feed-lang-code">${lang.code}</span><div class="feed-lang-meta"><strong>${lang.name}</strong><small>${esc(lang.primary)}${lang.secondary?' · '+esc(lang.secondary)+' משני':''}</small></div></div><span class="feed-type">${TYPE_LABELS[card.type]||'פוסט'}</span></div>`;
  }
  function reaction(card,kind){return !!state.reactions[card.id]?.[kind];}
  function actions(card){
    return `<div class="feed-actions">
      <button class="feed-action ${reaction(card,'know')?'active':''}" type="button" data-feed-action="know">✓ ידעתי</button>
      <button class="feed-action ${reaction(card,'practice')?'active':''}" type="button" data-feed-action="practice">↻ לתרגול</button>
      <button class="feed-action ${reaction(card,'save')?'active':''}" type="button" data-feed-action="save">♡ שמור</button>
      <button class="feed-action" type="button" data-feed-action="more">＋ עוד כזה</button>
      <a class="feed-action feed-study-link" href="language-study.html?lang=${card.lang}&topic=basics">לשיעור המלא ←</a>
    </div>`;
  }
  function linesHtml(lang,lines,revealTranslations){
    return `<div class="feed-lines">${lines.map((row,i)=>{const d=itemDisplay(lang,row);return `<div class="feed-line">${displayBlock(d,false)}<div class="feed-line-translation ${revealTranslations?'feed-hidden':''}" data-translation>${esc(d.translation)}</div></div>`;}).join('')}</div>`;
  }
  function revealButton(label='הצג תרגום'){
    return `<div class="feed-reveal-row"><button class="feed-reveal" type="button" data-feed-reveal>${label}</button></div>`;
  }
  function bodyFor(card){
    if(card.type==='word'||card.type==='sentence'){
      return displayBlock(M.getDisplay(card.item),true);
    }
    if(card.type==='joke'){
      return `<h2 class="feed-title">😄 ${esc(card.title)}</h2>${linesHtml(card.lang,card.lines,true)}${revealButton()}`;
    }
    if(card.type==='story'){
      return `<h2 class="feed-title">📖 ${esc(card.title)}</h2>${linesHtml(card.lang,card.lines,true)}${revealButton()}<div class="feed-question"><strong>${esc(card.question)}</strong><button class="feed-reveal" type="button" data-answer-reveal>הצג תשובה</button><div class="feed-answer feed-hidden" data-answer>${esc(card.answer)}</div></div>`;
    }
    if(card.type==='dialogue'){
      return `<h2 class="feed-title">💬 ${esc(card.title)}</h2>${linesHtml(card.lang,card.lines,true)}${revealButton('הצג את השיחה בעברית')}`;
    }
    if(card.type==='culture'){
      const d=itemDisplay(card.lang,card.phrase);
      return `<h2 class="feed-title">🌍 ${esc(card.title)}</h2><p class="feed-copy">${esc(card.body)}</p><div class="feed-line">${displayBlock(d,true)}</div>`;
    }
    if(card.type==='challenge'){
      const d=M.getDisplay(card.correct);
      return `<div class="feed-question"><strong>${esc(card.prompt)}</strong>${displayBlock({...d,translation:''},false)}<div class="feed-options">${card.options.map(opt=>`<button class="feed-option" type="button" data-challenge-option data-correct="${opt.id===card.correct.id?'1':'0'}">${esc(opt.he)}</button>`).join('')}</div><div class="feed-answer" data-challenge-feedback></div></div>`;
    }
    return '';
  }
  function cardHtml(card){
    return `<article class="feed-card" data-card-id="${esc(card.id)}" data-card-lang="${card.lang}" data-card-type="${card.type}"><div class="feed-card-inner">${cardHeader(card)}${bodyFor(card)}${actions(card)}</div></article>`;
  }

  function fourLanguageMoment(seed){
    const concepts=['coffee','thanks','friend','home'];
    const concept=concepts[(state.refresh+batch+seed)%concepts.length];
    const items=M.LANGUAGE_CODES.map(lang=>{
      const row=M.BANK[lang].words.find(w=>w[0]===concept)||M.BANK[lang].words[0];
      const d=M.getDisplay({lang,target:row[1],pron:row[2],he:row[3]});
      return {lang,d};
    });
    const title=items[0].d.translation;
    return `<section class="feed-moment"><div><span class="feed-type">רגע של 4 שפות</span><h2>אותו רעיון, ארבע שפות: ${esc(title)}</h2></div><div class="feed-moment-grid">${items.map(({lang,d})=>`<div class="feed-moment-item"><strong>${M.LANGUAGES[lang].code} · ${M.LANGUAGES[lang].name}</strong><span>${esc(d.primary)}</span>${d.secondary?`<small>${esc(d.secondary)}</small>`:''}</div>`).join('')}</div></section>`;
  }

  function travellingStoryMoment(){
    const picks={ar:M.BANK.ar.stories[0].lines[0],it:M.BANK.it.stories[0].lines[1],ru:M.BANK.ru.stories[0].lines[2],es:M.BANK.es.sentences[4].slice(1)};
    return `<section class="feed-moment"><div><span class="feed-type">סיפור עובר שפה</span><h2>ארבע שורות, ארבע שפות</h2><p class="meta">נסה להבין את הכיוון לפני שאתה מסתכל על התרגום.</p></div><div class="feed-lines">${M.LANGUAGE_CODES.map(lang=>{const d=itemDisplay(lang,picks[lang]);return `<div class="feed-line"><strong>${M.LANGUAGES[lang].code}</strong>${displayBlock(d,false)}<div class="feed-line-translation feed-hidden" data-translation>${esc(d.translation)}</div></div>`;}).join('')}</div>${revealButton('הצג את כל התרגומים')}</section>`;
  }

  function seedForBatch(n){return `${today()}:home:${state.filter}:${state.refresh}:${n}`;}
  function buildBatch(n,count){return M.buildFeed({filter:state.filter,seed:seedForBatch(n),count});}
  function insertBatch(n,count=12){
    const root=$('language-feed');
    const cards=buildBatch(n,count);
    const html=[];
    cards.forEach((card,index)=>{
      html.push(cardHtml(card));
      if(state.filter==='all'&&n===0&&index===3)html.push(fourLanguageMoment(index));
      if(state.filter==='all'&&n===0&&index===8)html.push(travellingStoryMoment());
    });
    root.insertAdjacentHTML('beforeend',html.join(''));
    wire(root);
  }

  function setContextLinks(){
    const root=$('feed-context-links');
    if(state.filter==='all'){
      root.innerHTML=M.LANGUAGE_CODES.map(code=>`<a class="btn small" href="language-study.html?lang=${code}&topic=basics">${M.LANGUAGES[code].code} · שיעור</a>`).join('');
    }else{
      root.innerHTML=`<a class="btn small" href="language-study.html?lang=${state.filter}&topic=basics">שיעור מלא</a><a class="btn small" href="language-topics.html?lang=${state.filter}">נושאים</a><a class="btn small" href="language-archive.html?lang=${state.filter}">מאגר וחזרות</a>`;
    }
  }
  function updateFilters(){
    document.querySelectorAll('[data-feed-filter]').forEach(btn=>{
      const active=btn.dataset.feedFilter===state.filter;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
    const label=$('feed-mode-label');
    label.textContent=state.filter==='all'?'כל ארבע השפות מעורבבות':`רק ${M.LANGUAGES[state.filter].name}`;
    setContextLinks();
  }
  function resetFeed(){
    batch=0;
    $('language-feed').innerHTML='';
    insertBatch(0,12);
    $('feed-status').textContent='';
    updateFilters();
  }

  function toggleReaction(article,kind){
    const id=article.dataset.cardId;
    state.reactions[id] ||= {};
    state.reactions[id][kind]=!state.reactions[id][kind];
    if(kind==='know'&&state.reactions[id].know)state.reactions[id].practice=false;
    if(kind==='practice'&&state.reactions[id].practice)state.reactions[id].know=false;
    save();
    article.querySelectorAll('[data-feed-action]').forEach(btn=>{
      const k=btn.dataset.feedAction;
      if(['know','practice','save'].includes(k))btn.classList.toggle('active',!!state.reactions[id][k]);
    });
  }
  function moreLike(article){
    const lang=article.dataset.cardLang;
    const type=article.dataset.cardType;
    state.more++;
    save();
    const candidates=M.buildFeed({filter:lang,seed:`more:${article.dataset.cardId}:${state.more}`,count:24});
    const card=candidates.find(x=>x.type===type)||candidates[0];
    article.insertAdjacentHTML('afterend',cardHtml(card));
    const next=article.nextElementSibling;
    wire(next);
    next?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function wire(scope){
    scope.querySelectorAll?.('[data-feed-reveal]:not([data-wired])').forEach(btn=>{
      btn.dataset.wired='1';
      btn.addEventListener('click',()=>{
        const box=btn.closest('.feed-card,.feed-moment');
        const translations=box.querySelectorAll('[data-translation]');
        const opening=[...translations].some(el=>el.classList.contains('feed-hidden'));
        translations.forEach(el=>el.classList.toggle('feed-hidden',!opening));
        btn.textContent=opening?'הסתר תרגום':'הצג תרגום';
      });
    });
    scope.querySelectorAll?.('[data-answer-reveal]:not([data-wired])').forEach(btn=>{
      btn.dataset.wired='1';
      btn.addEventListener('click',()=>{const answer=btn.parentElement.querySelector('[data-answer]');answer.classList.toggle('feed-hidden');btn.textContent=answer.classList.contains('feed-hidden')?'הצג תשובה':'הסתר תשובה';});
    });
    scope.querySelectorAll?.('[data-challenge-option]:not([data-wired])').forEach(btn=>{
      btn.dataset.wired='1';
      btn.addEventListener('click',()=>{
        const question=btn.closest('.feed-question');
        if(question.dataset.answered==='1')return;
        question.dataset.answered='1';
        const ok=btn.dataset.correct==='1';
        question.querySelectorAll('[data-challenge-option]').forEach(option=>{option.disabled=true;if(option.dataset.correct==='1')option.classList.add('correct');});
        if(!ok)btn.classList.add('wrong');
        question.querySelector('[data-challenge-feedback]').textContent=ok?'נכון ✓':'לא נורא — התשובה הנכונה מסומנת.';
      });
    });
    scope.querySelectorAll?.('[data-feed-action]:not([data-wired])').forEach(btn=>{
      btn.dataset.wired='1';
      btn.addEventListener('click',()=>{
        const article=btn.closest('.feed-card');
        const action=btn.dataset.feedAction;
        if(action==='more')moreLike(article);else toggleReaction(article,action);
      });
    });
  }

  document.querySelectorAll('[data-feed-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    state.filter=btn.dataset.feedFilter;
    save();
    resetFeed();
    window.scrollTo({top:0,behavior:'smooth'});
  }));
  $('feed-refresh').addEventListener('click',()=>{
    state.refresh++;
    save();
    resetFeed();
    $('feed-status').textContent='הפיד התחלף ✨';
  });
  $('feed-load-more').addEventListener('click',()=>{
    batch++;
    insertBatch(batch,10);
    $('feed-status').textContent='נוספו עוד 10 פוסטים';
  });

  updateFilters();
  resetFeed();
})();
