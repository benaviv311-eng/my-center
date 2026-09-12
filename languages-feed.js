(function(){
  const M=window.LanguageFeedModel;
  if(!M)return;

  const STORAGE_KEY='my-center-language-feed-v1';
  const TYPE_LABELS={word:'מילה',sentence:'משפט',joke:'בדיחה',story:'סיפור קצר',dialogue:'מיני־דיאלוג',challenge:'אתגר מהיר',culture:'תרבות ושפה'};
  const GAME_LABELS={flashcards:['🃏','כרטיסיות'],'memory':['🧠','זיכרון'],matching:['🔗','התאמת זוגות'],'sentence-builder':['🧩','הרכבת משפט'],recall:['👀','זיכרון רצף'],speed:['⏱️','אתגר בזק'],'four-languages':['🌍','4 שפות']};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {filter:raw.filter||'all',refresh:Number(raw.refresh)||0,reactions:raw.reactions||{},more:Number(raw.more)||0};
    }catch(e){return {filter:'all',refresh:0,reactions:{},more:0};}
  }
  const state=load();
  if(!['all','four',...M.LANGUAGE_CODES].includes(state.filter))state.filter='all';
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
  function fourActions(card){
    return `<div class="feed-actions">
      <button class="feed-action ${reaction(card,'know')?'active':''}" type="button" data-feed-action="know">✓ ידעתי</button>
      <button class="feed-action ${reaction(card,'practice')?'active':''}" type="button" data-feed-action="practice">↻ לתרגול</button>
      <button class="feed-action ${reaction(card,'save')?'active':''}" type="button" data-feed-action="save">♡ שמור</button>
      <button class="feed-action" type="button" data-feed-action="more">＋ עוד כזה</button>
      <a class="feed-action feed-study-link" href="four-languages.html">🌐 מילה ב־4 שפות ←</a>
    </div>`;
  }
  function linesHtml(lang,lines,revealTranslations){
    return `<div class="feed-lines">${lines.map(row=>{const d=itemDisplay(lang,row);return `<div class="feed-line">${displayBlock(d,false)}<div class="feed-line-translation ${revealTranslations?'feed-hidden':''}" data-translation>${esc(d.translation)}</div></div>`;}).join('')}</div>`;
  }
  function revealButton(label='הצג תרגום'){
    return `<div class="feed-reveal-row"><button class="feed-reveal" type="button" data-feed-reveal>${label}</button></div>`;
  }
  function bodyFor(card){
    if(card.type==='word'||card.type==='sentence')return displayBlock(M.getDisplay(card.item),true);
    if(card.type==='joke')return `<h2 class="feed-title">😄 ${esc(card.title)}</h2>${linesHtml(card.lang,card.lines,true)}${revealButton()}`;
    if(card.type==='story')return `<h2 class="feed-title">📖 ${esc(card.title)}</h2>${linesHtml(card.lang,card.lines,true)}${revealButton()}<div class="feed-question"><strong>${esc(card.question)}</strong><button class="feed-reveal" type="button" data-answer-reveal>הצג תשובה</button><div class="feed-answer feed-hidden" data-answer>${esc(card.answer)}</div></div>`;
    if(card.type==='dialogue')return `<h2 class="feed-title">💬 ${esc(card.title)}</h2>${linesHtml(card.lang,card.lines,true)}${revealButton('הצג את השיחה בעברית')}`;
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

  function fourLanguageHeader(card){
    return `<div class="feed-card-header"><div class="feed-card-language"><span class="feed-lang-code">4×</span><div class="feed-lang-meta"><strong>ארבע השפות יחד</strong><small>ערבית · איטלקית · רוסית · ספרדית</small></div></div><span class="feed-type">${TYPE_LABELS[card.type]||'פוסט'}</span></div>`;
  }
  function fourLanguageCell(lang,html){
    const meta=M.LANGUAGES[lang];
    return `<section class="feed-moment-item feed-four-cell"><strong>${meta.code} · ${meta.name}</strong>${html}</section>`;
  }
  function fourWordOrSentenceBody(card){
    const cells=M.LANGUAGE_CODES.map(lang=>{
      const item=card.variants[lang].item;
      return fourLanguageCell(lang,displayBlock(M.getDisplay(item),false));
    }).join('');
    return `<div class="feed-four-hebrew"><small>המשמעות בעברית</small><div class="feed-primary">${esc(card.hebrew)}</div></div><div class="feed-moment-grid feed-four-grid">${cells}</div>`;
  }
  function fourLinesBody(card,icon){
    const cells=M.LANGUAGE_CODES.map(lang=>{
      const v=card.variants[lang];
      return fourLanguageCell(lang,`<h3 class="feed-four-title">${icon} ${esc(v.title||'')}</h3>${linesHtml(lang,v.lines||[],false)}`);
    }).join('');
    const shared=card.hebrew?`<div class="feed-four-hebrew"><small>עברית</small><div class="feed-translation">${esc(card.hebrew)}</div></div>`:'';
    return `${shared}<div class="feed-moment-grid feed-four-grid">${cells}</div>`;
  }
  function fourCultureBody(card){
    const cells=M.LANGUAGE_CODES.map(lang=>{
      const v=card.variants[lang];
      const d=itemDisplay(lang,v.phrase||['','','']);
      return fourLanguageCell(lang,`<h3 class="feed-four-title">${esc(v.title||'')}</h3><p class="feed-copy">${esc(v.body||'')}</p>${displayBlock(d,true)}`);
    }).join('');
    return `<div class="feed-moment-grid feed-four-grid">${cells}</div>`;
  }
  function fourChallengeBody(card){
    const correct=card.variants.ar.correct;
    const cells=M.LANGUAGE_CODES.map(lang=>fourLanguageCell(lang,displayBlock({...M.getDisplay(card.variants[lang].correct),translation:''},false))).join('');
    const options=card.variants.ar.options;
    return `<div class="feed-question"><strong>מה הפירוש המשותף לארבע המילים?</strong><div class="feed-moment-grid feed-four-grid">${cells}</div><div class="feed-options">${options.map(opt=>`<button class="feed-option" type="button" data-challenge-option data-correct="${opt.id===correct.id?'1':'0'}">${esc(opt.he)}</button>`).join('')}</div><div class="feed-answer" data-challenge-feedback></div></div>`;
  }
  function fourLanguageBody(card){
    if(card.type==='word'||card.type==='sentence')return fourWordOrSentenceBody(card);
    if(card.type==='joke')return fourLinesBody(card,'😄');
    if(card.type==='story')return fourLinesBody(card,'📖');
    if(card.type==='dialogue')return fourLinesBody(card,'💬');
    if(card.type==='culture')return fourCultureBody(card);
    if(card.type==='challenge')return fourChallengeBody(card);
    return fourWordOrSentenceBody(card);
  }
  function fourLanguageCardHtml(card){
    return `<article class="feed-card feed-four-card" data-card-id="${esc(card.id)}" data-card-lang="four" data-card-type="${card.type}"><div class="feed-card-inner">${fourLanguageHeader(card)}${fourLanguageBody(card)}${fourActions(card)}</div></article>`;
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

  function miniGameBody(game){
    const first=game.items?.[0];
    if(game.type==='flashcards'){
      const d=M.getDisplay(first);
      return `<div class="feed-mini-flash"><div class="feed-primary">${esc(d.primary)}</div>${d.secondary?`<div class="feed-secondary">${esc(d.secondary)}</div>`:''}<div class="feed-translation feed-hidden" data-mini-answer>${esc(d.translation)}</div><button class="feed-reveal" type="button" data-mini-reveal>הצג תשובה</button></div>`;
    }
    if(game.type==='memory'){
      const pair=game.items.slice(0,2);const deck=[{item:pair[0],side:'a'},{item:pair[1],side:'b'},{item:pair[0],side:'b'},{item:pair[1],side:'a'}];
      return `<div class="feed-mini-memory" data-mini-memory>${deck.map(({item,side})=>{const d=M.getDisplay(item);const value=side==='a'?d.primary:d.translation;return `<button type="button" class="feed-memory-tile" data-mini-memory-card data-key="${item.lang}:${esc(item.id)}" data-value="${esc(value)}">?</button>`;}).join('')}</div><div class="feed-mini-feedback" data-mini-feedback>מצא שני זוגות.</div>`;
    }
    if(game.type==='sentence-builder'){
      return `<div class="feed-mini-sentence" data-mini-sentence data-answer="${esc(game.answer.join(' '))}"><div class="feed-line"><strong>המשמעות:</strong> ${esc(M.getDisplay(game.sentence).translation)}</div><div class="feed-mini-built" data-mini-built></div><div class="feed-mini-chips">${game.words.map(word=>`<button type="button" class="feed-mini-chip" data-mini-word data-word="${esc(word)}">${esc(word)}</button>`).join('')}</div><button class="feed-reveal" type="button" data-mini-check>בדוק משפט</button><div class="feed-mini-feedback" data-mini-feedback></div></div>`;
    }
    if(game.type==='recall'){
      const shown=game.items.slice(0,3), outsider=game.items[3];const opts=[outsider,shown[1],shown[0],shown[2]];
      return `<div data-mini-recall><div class="feed-mini-recall-list" data-mini-recall-list>${shown.map(item=>`<span>${esc(M.getDisplay(item).primary)}</span>`).join('')}</div><button class="feed-reveal" type="button" data-mini-recall-ready>זכרתי — שאל אותי</button><div class="feed-hidden" data-mini-recall-q><strong>איזו מילה לא הופיעה?</strong><div class="feed-options">${opts.map(item=>`<button class="feed-option" type="button" data-mini-recall-option data-correct="${item===outsider?'1':'0'}">${esc(M.getDisplay(item).primary)}</button>`).join('')}</div></div><div class="feed-mini-feedback" data-mini-feedback></div></div>`;
    }
    if(game.type==='four-languages'){
      return `<div><div class="feed-primary">${esc(game.prompt)}</div><div class="feed-moment-grid">${game.items.map(item=>{const d=M.getDisplay(item);return `<div class="feed-moment-item"><strong>${M.LANGUAGES[item.lang].code}</strong><span>${esc(d.primary)}</span>${d.secondary?`<small>${esc(d.secondary)}</small>`:''}</div>`;}).join('')}</div></div>`;
    }
    const d=M.getDisplay(first);const options=game.items.slice(0,4);
    return `<div class="feed-question"><strong>${game.type==='speed'?'שאלת בזק — מה הפירוש?':'התאם את המילה לתרגום'}</strong>${displayBlock({...d,translation:''},false)}<div class="feed-options">${options.map(item=>`<button class="feed-option" type="button" data-mini-option data-correct="${item.lang===first.lang&&item.id===first.id?'1':'0'}">${esc(M.getDisplay(item).translation)}</button>`).join('')}</div><div class="feed-mini-feedback" data-mini-feedback></div></div>`;
  }

  function miniGameMoment(type,seed){
    const game=M.buildMiniGame({type,filter:state.filter,seed});
    const [icon,label]=GAME_LABELS[type];
    const langText=game.lang==='all'?'כל השפות':M.LANGUAGES[game.lang].name;
    const suffix=state.filter==='all'?'':`?lang=${state.filter}`;
    return `<section class="feed-moment feed-game" data-feed-mini-game="${type}"><div class="feed-game-head"><div><span class="feed-type">${icon} משחק בתוך הפיד</span><h2>${label}</h2><p class="meta">${esc(langText)}</p></div><a class="feed-game-link" href="language-games.html${suffix}">לכל המשחקים ←</a></div>${miniGameBody(game)}</section>`;
  }
  function fourLanguageMiniGameMoment(type,seed){
    const safeType=type==='four-languages'?'flashcards':type;
    const game=M.buildFourLanguageMiniGame({type:safeType,seed});
    const [icon,label]=GAME_LABELS[safeType]||['🎮','משחק'];
    const cells=M.LANGUAGE_CODES.map(lang=>{
      const variant={type:safeType,...game.variants[lang]};
      return `<div class="feed-moment-item feed-four-game-cell feed-game"><strong>${M.LANGUAGES[lang].code} · ${M.LANGUAGES[lang].name}</strong>${miniGameBody(variant)}</div>`;
    }).join('');
    return `<section class="feed-moment feed-game feed-four-game" data-feed-mini-game="${safeType}"><div class="feed-game-head"><div><span class="feed-type">${icon} משחק ב־4 שפות</span><h2>${label}</h2><p class="meta">אותו סוג תרגול בערבית, איטלקית, רוסית וספרדית.</p></div><a class="feed-game-link" href="language-games.html">לכל המשחקים ←</a></div><div class="feed-moment-grid feed-four-grid">${cells}</div></section>`;
  }

  function seedForBatch(n){return `${today()}:home:${state.filter}:${state.refresh}:${n}`;}
  function buildBatch(n,count){return state.filter==='four'?M.buildFourLanguageFeed({seed:seedForBatch(n),count}):M.buildFeed({filter:state.filter,seed:seedForBatch(n),count});}
  function insertBatch(n,count=12){
    const root=$('language-feed');
    const cards=buildBatch(n,count);
    const html=[];
    const fourGameTypes=M.GAME_TYPES.filter(type=>type!=='four-languages');
    cards.forEach((card,index)=>{
      if(state.filter==='four'){
        html.push(fourLanguageCardHtml(card));
        if(index===5){const type=fourGameTypes[(state.refresh+n*2)%fourGameTypes.length];html.push(fourLanguageMiniGameMoment(type,`${seedForBatch(n)}:four-game:1`));}
        if((count>10&&index===10)||(count<=10&&index===8)){const type=fourGameTypes[(state.refresh+n*2+1)%fourGameTypes.length];html.push(fourLanguageMiniGameMoment(type,`${seedForBatch(n)}:four-game:2`));}
        return;
      }
      html.push(cardHtml(card));
      if(state.filter==='all'&&n===0&&index===3)html.push(fourLanguageMoment(index));
      if(index===5){const type=M.GAME_TYPES[(state.refresh+n*2)%M.GAME_TYPES.length];html.push(miniGameMoment(type,`${seedForBatch(n)}:game:1`));}
      if(state.filter==='all'&&n===0&&index===8)html.push(travellingStoryMoment());
      if((count>10&&index===10)||(count<=10&&index===8)){const type=M.GAME_TYPES[(state.refresh+n*2+1)%M.GAME_TYPES.length];html.push(miniGameMoment(type,`${seedForBatch(n)}:game:2`));}
    });
    root.insertAdjacentHTML('beforeend',html.join(''));
    wire(root);
  }

  function setContextLinks(){
    const root=$('feed-context-links');
    if(state.filter==='four'){
      root.innerHTML=`<a class="btn small" href="four-languages.html">🌐 מילה ב־4 שפות</a><a class="btn small" href="language-games.html">🎮 משחקים ותרגול</a>`;
    }else if(state.filter==='all'){
      root.innerHTML=`<a class="btn small" href="language-games.html">🎮 משחקים ותרגול</a>`+M.LANGUAGE_CODES.map(code=>`<a class="btn small" href="language-study.html?lang=${code}&topic=basics">${M.LANGUAGES[code].code} · שיעור</a>`).join('');
    }else{
      root.innerHTML=`<a class="btn small" href="language-games.html?lang=${state.filter}">🎮 משחקים</a><a class="btn small" href="language-study.html?lang=${state.filter}&topic=basics">שיעור מלא</a><a class="btn small" href="language-topics.html?lang=${state.filter}">נושאים</a><a class="btn small" href="language-archive.html?lang=${state.filter}">מאגר וחזרות</a>`;
    }
  }
  function updateFilters(){
    document.querySelectorAll('[data-feed-filter]').forEach(btn=>{
      const active=btn.dataset.feedFilter===state.filter;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
    const label=$('feed-mode-label');
    label.textContent=state.filter==='all'?'כל ארבע השפות מעורבבות':state.filter==='four'?'כל פוסט מוצג בארבע השפות + עברית':`רק ${M.LANGUAGES[state.filter].name}`;
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
    const candidates=lang==='four'?M.buildFourLanguageFeed({seed:`more:${article.dataset.cardId}:${state.more}`,count:24}):M.buildFeed({filter:lang,seed:`more:${article.dataset.cardId}:${state.more}`,count:24});
    const card=candidates.find(x=>x.type===type)||candidates[0];
    article.insertAdjacentHTML('afterend',lang==='four'?fourLanguageCardHtml(card):cardHtml(card));
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

    scope.querySelectorAll?.('[data-mini-reveal]:not([data-wired])').forEach(btn=>{btn.dataset.wired='1';btn.addEventListener('click',()=>{const answer=btn.closest('.feed-game').querySelector('[data-mini-answer]');answer.classList.toggle('feed-hidden');btn.textContent=answer.classList.contains('feed-hidden')?'הצג תשובה':'הסתר תשובה';});});
    scope.querySelectorAll?.('[data-mini-option]:not([data-wired])').forEach(btn=>{btn.dataset.wired='1';btn.addEventListener('click',()=>{const box=btn.closest('.feed-game');if(box.dataset.answered)return;box.dataset.answered='1';box.querySelectorAll('[data-mini-option]').forEach(x=>{x.disabled=true;if(x.dataset.correct==='1')x.classList.add('correct');});if(btn.dataset.correct!=='1')btn.classList.add('wrong');box.querySelector('[data-mini-feedback]').textContent=btn.dataset.correct==='1'?'נכון ✓':'התשובה הנכונה מסומנת.';});});
    scope.querySelectorAll?.('[data-mini-memory]:not([data-wired])').forEach(board=>{board.dataset.wired='1';let open=[];let matches=0;board.querySelectorAll('[data-mini-memory-card]').forEach(card=>card.addEventListener('click',()=>{if(card.classList.contains('matched')||open.includes(card)||open.length===2)return;card.textContent=card.dataset.value;card.classList.add('open');open.push(card);if(open.length===2){const[a,b]=open;if(a.dataset.key===b.dataset.key){a.classList.add('matched');b.classList.add('matched');open=[];matches++;board.parentElement.querySelector('[data-mini-feedback]').textContent=matches===2?'כל הזוגות נמצאו ✓':'זוג אחד נמצא!';}else setTimeout(()=>{a.textContent='?';b.textContent='?';a.classList.remove('open');b.classList.remove('open');open=[];},600);}}));});
    scope.querySelectorAll?.('[data-mini-sentence]:not([data-wired])').forEach(box=>{box.dataset.wired='1';const picked=[];box.querySelectorAll('[data-mini-word]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.classList.contains('used'))return;btn.classList.add('used');picked.push(btn.dataset.word);box.querySelector('[data-mini-built]').textContent=picked.join(' ');}));box.querySelector('[data-mini-check]').addEventListener('click',()=>{box.querySelector('[data-mini-feedback]').textContent=picked.join(' ')===box.dataset.answer?'מצוין — המשפט נכון ✓':'עוד לא. נסה לרענן את הפיד או להמשיך למשחק המלא.';});});
    scope.querySelectorAll?.('[data-mini-recall]:not([data-wired])').forEach(box=>{box.dataset.wired='1';box.querySelector('[data-mini-recall-ready]').addEventListener('click',btn=>{box.querySelector('[data-mini-recall-list]').classList.add('feed-hidden');btn.currentTarget.classList.add('feed-hidden');box.querySelector('[data-mini-recall-q]').classList.remove('feed-hidden');});box.querySelectorAll('[data-mini-recall-option]').forEach(btn=>btn.addEventListener('click',()=>{box.querySelectorAll('[data-mini-recall-option]').forEach(x=>x.disabled=true);box.querySelector('[data-mini-feedback]').textContent=btn.dataset.correct==='1'?'נכון — זכרת ✓':'כמעט. במשחק המלא אפשר לנסות שוב.';}));});
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
    $('feed-status').textContent=state.filter==='four'?'נוספו עוד 10 פוסטים בארבע שפות':'נוספו עוד 10 פוסטים ומשחקים';
  });

  updateFilters();
  resetFeed();
})();
