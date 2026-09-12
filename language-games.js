(function(){
  const M=window.LanguageFeedModel;
  if(!M)return;

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const LABELS={
    flashcards:['🃏','כרטיסיות חכמות','הפוך את הכרטיס ונסה לזכור לפני שאתה חושף את התשובה.'],
    memory:['🧠','משחק זיכרון','מצא זוגות של מילה ותרגום.'],
    matching:['🔗','התאמת זוגות','בחר מילה ואז את התרגום שלה.'],
    'sentence-builder':['🧩','הרכבת משפט','בנה את המשפט לפי הסדר הנכון.'],
    recall:['👀','זיכרון רצף','זכור מה ראית ואז מצא את המילה שלא הופיעה.'],
    speed:['⏱️','אתגר 60 שניות','ענה מהר וצבור כמה שיותר נקודות.'],
    'four-languages':['🌍','אותה משמעות ב־4 שפות','אותו רעיון מופיע בארבע השפות שלך.']
  };
  const params=new URLSearchParams(location.search);
  let filter=M.LANGUAGE_CODES.includes(params.get('lang'))?params.get('lang'):'all';
  let seedCounter=0;
  let speedTimer=null;
  let mixIndex=-1;
  const mixTypes=['flashcards','matching','sentence-builder','memory','recall'];

  function display(item){return M.getDisplay(item);}
  function languageName(lang){return lang==='all'?'כל השפות':M.LANGUAGES[lang].name;}
  function shuffle(list){return list.slice().sort(()=>Math.random()-.5);}
  function gameHead(type,game){
    const [icon,title,copy]=LABELS[type];
    return `<div class="game-stage-head"><div><span class="game-kicker">${icon} ${esc(languageName(game.lang))}</span><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><button class="game-btn" type="button" data-new-game>↻ משחק חדש</button></div>`;
  }
  function displayCard(item,showTranslation=true){
    const d=display(item);
    return `<div class="game-primary">${esc(d.primary)}</div>${d.secondary?`<div class="game-secondary">${esc(d.secondary)}</div>`:''}${showTranslation?`<div class="game-translation">${esc(d.translation)}</div>`:''}`;
  }

  function flashcardsHtml(game){
    return `<div class="game-board">${game.items.slice(0,4).map((item,i)=>{const d=display(item);return `<button class="flash-card" type="button" data-flash-card><span class="game-kicker">כרטיס ${i+1}</span><span class="game-primary">${esc(d.primary)}</span>${d.secondary?`<span class="game-secondary">${esc(d.secondary)}</span>`:''}<span class="game-translation" data-flash-answer hidden>${esc(d.translation)}</span><small data-flash-hint>לחץ לחשיפת התשובה</small></button>`;}).join('')}</div>`;
  }
  function memoryHtml(game){
    const items=game.items.slice(0,4);
    const deck=shuffle(items.flatMap(item=>{const d=display(item);return [
      {key:`${item.lang}:${item.id}`,value:d.primary},
      {key:`${item.lang}:${item.id}`,value:d.translation}
    ];}));
    return `<div class="memory-grid" data-memory-board>${deck.map(card=>`<button class="memory-card" type="button" data-memory-card data-key="${esc(card.key)}" data-value="${esc(card.value)}">?</button>`).join('')}</div><div class="game-feedback" data-memory-feedback>מצא ${items.length} זוגות.</div>`;
  }
  function matchingHtml(game){
    const items=game.items.slice(0,5);
    const right=shuffle(items);
    return `<div class="matching-grid" data-matching-board><div class="matching-column">${items.map(item=>{const d=display(item);return `<button class="matching-chip" type="button" data-match-side="left" data-key="${item.lang}:${esc(item.id)}">${esc(d.primary)}${d.secondary?`<small class="game-secondary">${esc(d.secondary)}</small>`:''}</button>`;}).join('')}</div><div class="matching-column">${right.map(item=>`<button class="matching-chip" type="button" data-match-side="right" data-key="${item.lang}:${esc(item.id)}">${esc(display(item).translation)}</button>`).join('')}</div></div><div class="game-feedback" data-match-feedback>בחר זוג שמתאים.</div>`;
  }
  function sentenceHtml(game){
    const d=display(game.sentence);
    return `<div class="game-board"><div class="feed-line"><strong>המשמעות:</strong> ${esc(d.translation)}</div><div class="sentence-answer" data-sentence-answer><span class="meta">המשפט שלך יופיע כאן</span></div><div class="word-bank">${game.words.map((word,i)=>`<button class="word-chip" type="button" data-sentence-word data-index="${i}" data-word="${esc(word)}">${esc(word)}</button>`).join('')}</div><div class="game-controls"><button class="game-btn primary" type="button" data-sentence-check>בדוק</button><button class="game-btn" type="button" data-sentence-clear>נקה</button></div><div class="game-feedback" data-sentence-feedback></div></div>`;
  }
  function recallHtml(game){
    const shown=game.items.slice(0,3);
    const outsider=game.items[3];
    const options=shuffle([...shown,outsider]);
    return `<div class="game-board" data-recall-board><p><strong>זכור את שלוש המילים:</strong></p><div class="recall-list" data-recall-list>${shown.map(item=>{const d=display(item);return `<div class="recall-item">${esc(d.primary)}${d.secondary?`<small class="game-secondary">${esc(d.secondary)}</small>`:''}</div>`;}).join('')}</div><button class="game-btn primary" type="button" data-recall-ready>זכרתי — שאל אותי</button><div data-recall-question hidden><p><strong>איזו מילה לא הופיעה קודם?</strong></p><div class="word-bank">${options.map(item=>`<button class="word-chip" type="button" data-recall-option data-correct="${item===outsider?'1':'0'}">${esc(display(item).primary)}</button>`).join('')}</div></div><div class="game-feedback" data-recall-feedback></div></div>`;
  }
  function speedHtml(){
    return `<div class="speed-panel" data-speed-panel><div class="speed-top"><span>⏱️ <span data-speed-time>60</span> שניות</span><span>ניקוד: <span data-speed-score>0</span></span></div><button class="game-btn primary" type="button" data-speed-start>התחל</button><div data-speed-question hidden><div class="game-primary" data-speed-word></div><div class="speed-options" data-speed-options></div></div><div class="game-feedback" data-speed-feedback>כשתלחץ, השעון יתחיל.</div></div>`;
  }
  function fourLanguagesHtml(game){
    return `<div class="game-board"><div><span class="game-kicker">הרעיון בעברית</span><div class="game-primary">${esc(game.prompt)}</div></div><div class="four-grid">${game.items.map(item=>{const d=display(item);return `<div class="four-card"><strong>${M.LANGUAGES[item.lang].code} · ${M.LANGUAGES[item.lang].name}</strong><span>${esc(d.primary)}</span>${d.secondary?`<small>${esc(d.secondary)}</small>`:''}</div>`;}).join('')}</div><div class="game-controls"><button class="game-btn" type="button" data-four-hide>כסה שמות שפה</button></div></div>`;
  }

  function bodyHtml(type,game){
    if(type==='flashcards')return flashcardsHtml(game);
    if(type==='memory')return memoryHtml(game);
    if(type==='matching')return matchingHtml(game);
    if(type==='sentence-builder')return sentenceHtml(game);
    if(type==='recall')return recallHtml(game);
    if(type==='speed')return speedHtml(game);
    return fourLanguagesHtml(game);
  }

  function render(type,{fromMix=false}={}){
    if(speedTimer){clearInterval(speedTimer);speedTimer=null;}
    seedCounter++;
    const game=M.buildMiniGame({type,filter,seed:`games:${Date.now()}:${seedCounter}`});
    const stage=$('games-stage');
    stage.innerHTML=`<div class="game-stage-inner">${gameHead(type,game)}${bodyHtml(type,game)}${fromMix?`<div class="game-controls"><button class="game-btn primary" type="button" data-mix-next>${mixIndex+1< mixTypes.length?'הבא במסלול ←':'סיום המסלול ✓'}</button><div class="daily-progress">${mixTypes.map((_,i)=>`<i class="${i<=mixIndex?'done':''}"></i>`).join('')}</div></div>`:''}</div>`;
    document.querySelectorAll('.game-choice').forEach(btn=>btn.classList.toggle('active',btn.dataset.gameType===type));
    wireStage(type,game,fromMix);
    stage.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function wireStage(type,game,fromMix){
    const stage=$('games-stage');
    stage.querySelector('[data-new-game]')?.addEventListener('click',()=>render(type,{fromMix}));
    stage.querySelector('[data-mix-next]')?.addEventListener('click',()=>{
      if(mixIndex>=mixTypes.length-1){mixIndex=-1;stage.innerHTML='<div class="games-stage-empty"><strong>מסלול ה־5 דקות הושלם ✓</strong><br>אפשר לבחור משחק נוסף או להתחיל שוב.</div>';return;}
      mixIndex++;render(mixTypes[mixIndex],{fromMix:true});
    });

    stage.querySelectorAll('[data-flash-card]').forEach(card=>card.addEventListener('click',()=>{
      const answer=card.querySelector('[data-flash-answer]');const hint=card.querySelector('[data-flash-hint]');
      answer.hidden=!answer.hidden;hint.textContent=answer.hidden?'לחץ לחשיפת התשובה':'לחץ שוב להסתרה';
    }));

    let memoryOpen=[];let memoryMatches=0;
    stage.querySelectorAll('[data-memory-card]').forEach(card=>card.addEventListener('click',()=>{
      if(card.classList.contains('matched')||memoryOpen.includes(card)||memoryOpen.length===2)return;
      card.textContent=card.dataset.value;card.classList.add('open');memoryOpen.push(card);
      if(memoryOpen.length===2){
        const [a,b]=memoryOpen;
        if(a.dataset.key===b.dataset.key){a.classList.add('matched');b.classList.add('matched');memoryOpen=[];memoryMatches++;stage.querySelector('[data-memory-feedback]').textContent=memoryMatches===game.items.slice(0,4).length?'מצאת את כל הזוגות ✓':`יפה — ${memoryMatches} זוגות נמצאו.`;}
        else setTimeout(()=>{a.textContent='?';b.textContent='?';a.classList.remove('open');b.classList.remove('open');memoryOpen=[];},650);
      }
    }));

    let selectedLeft=null,selectedRight=null,matched=0;
    stage.querySelectorAll('[data-match-side]').forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.classList.contains('matched'))return;
      const side=btn.dataset.matchSide;
      stage.querySelectorAll(`[data-match-side="${side}"]`).forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected');if(side==='left')selectedLeft=btn;else selectedRight=btn;
      if(selectedLeft&&selectedRight){
        if(selectedLeft.dataset.key===selectedRight.dataset.key){selectedLeft.classList.add('matched');selectedRight.classList.add('matched');selectedLeft.classList.remove('selected');selectedRight.classList.remove('selected');matched++;stage.querySelector('[data-match-feedback]').textContent=matched>=game.items.slice(0,5).length?'כל הזוגות הותאמו ✓':'התאמה נכונה ✓';selectedLeft=selectedRight=null;}
        else{stage.querySelector('[data-match-feedback]').textContent='לא מתאים — נסה שוב.';}
      }
    }));

    const picked=[];
    stage.querySelectorAll('[data-sentence-word]').forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.classList.contains('used'))return;btn.classList.add('used');picked.push({word:btn.dataset.word,btn});
      stage.querySelector('[data-sentence-answer]').innerHTML=picked.map(x=>`<span class="word-chip">${esc(x.word)}</span>`).join('');
    }));
    stage.querySelector('[data-sentence-clear]')?.addEventListener('click',()=>{picked.splice(0);stage.querySelectorAll('[data-sentence-word]').forEach(x=>x.classList.remove('used'));stage.querySelector('[data-sentence-answer]').innerHTML='<span class="meta">המשפט שלך יופיע כאן</span>';stage.querySelector('[data-sentence-feedback]').textContent='';});
    stage.querySelector('[data-sentence-check]')?.addEventListener('click',()=>{const ok=picked.map(x=>x.word).join(' ')===game.answer.join(' ');stage.querySelector('[data-sentence-feedback]').textContent=ok?'מצוין — המשפט נכון ✓':'עוד לא. אפשר לשנות את הסדר ולנסות שוב.';});

    stage.querySelector('[data-recall-ready]')?.addEventListener('click',btn=>{stage.querySelector('[data-recall-list]').hidden=true;btn.currentTarget.hidden=true;stage.querySelector('[data-recall-question]').hidden=false;});
    stage.querySelectorAll('[data-recall-option]').forEach(btn=>btn.addEventListener('click',()=>{stage.querySelectorAll('[data-recall-option]').forEach(x=>x.disabled=true);stage.querySelector('[data-recall-feedback]').textContent=btn.dataset.correct==='1'?'נכון — זו המילה שלא הופיעה ✓':'כמעט. נסה משחק חדש כדי לבדוק שוב את הזיכרון.';}));

    stage.querySelector('[data-four-hide]')?.addEventListener('click',btn=>{const cards=stage.querySelectorAll('.four-card strong');const hidden=[...cards].some(x=>!x.hidden);cards.forEach(x=>x.hidden=hidden);btn.currentTarget.textContent=hidden?'הצג שמות שפה':'כסה שמות שפה';});

    stage.querySelector('[data-speed-start]')?.addEventListener('click',btn=>startSpeed(stage,game,btn.currentTarget));
  }

  function startSpeed(stage,game,startBtn){
    startBtn.hidden=true;
    const question=stage.querySelector('[data-speed-question]');question.hidden=false;
    const timeEl=stage.querySelector('[data-speed-time]');const scoreEl=stage.querySelector('[data-speed-score]');const feedback=stage.querySelector('[data-speed-feedback]');
    let remaining=60,score=0,q=0;feedback.textContent='';
    function next(){
      const fresh=M.buildMiniGame({type:'speed',filter,seed:`speed:${Date.now()}:${q++}`});
      const correct=fresh.items[0];const d=display(correct);stage.querySelector('[data-speed-word]').textContent=d.primary;
      const options=shuffle(fresh.items.slice(0,4));const root=stage.querySelector('[data-speed-options]');root.innerHTML=options.map(item=>`<button class="speed-option" type="button" data-speed-option data-correct="${item.lang===correct.lang&&item.id===correct.id?'1':'0'}">${esc(display(item).translation)}</button>`).join('');
      root.querySelectorAll('[data-speed-option]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.correct==='1'){score++;scoreEl.textContent=score;feedback.textContent='✓';}else feedback.textContent='נסה שוב';next();}));
    }
    next();
    speedTimer=setInterval(()=>{remaining--;timeEl.textContent=remaining;if(remaining<=0){clearInterval(speedTimer);speedTimer=null;question.hidden=true;feedback.textContent=`נגמר הזמן — ${score} תשובות נכונות.`;startBtn.hidden=false;startBtn.textContent='שחק שוב';}},1000);
  }

  function setFilter(lang){
    filter=M.LANGUAGE_CODES.includes(lang)?lang:'all';
    document.querySelectorAll('[data-game-lang]').forEach(btn=>{const active=btn.dataset.gameLang===filter;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active?'true':'false');});
    const url=new URL(location.href);if(filter==='all')url.searchParams.delete('lang');else url.searchParams.set('lang',filter);history.replaceState({},'',url);
  }

  document.querySelectorAll('[data-game-lang]').forEach(btn=>btn.addEventListener('click',()=>{setFilter(btn.dataset.gameLang);if(document.querySelector('.game-choice.active'))render(document.querySelector('.game-choice.active').dataset.gameType);}));
  document.querySelectorAll('[data-game-type]').forEach(btn=>btn.addEventListener('click',()=>{mixIndex=-1;render(btn.dataset.gameType);}));
  $('daily-mix-start').addEventListener('click',()=>{mixIndex=0;render(mixTypes[0],{fromMix:true});});
  setFilter(filter);
})();
