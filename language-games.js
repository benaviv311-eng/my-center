(function(){
  const M=window.LanguageFeedModel;
  const B=window.LanguageVocabularyBank;
  const P=window.LanguageGamePool;
  if(!M||!B||!P)return;

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const LABELS={
    flashcards:['🃏','מאגר כרטיסיות','דפדף במאגר, חשוף את התרגום ושמע את ההגייה בלי ניקוד ובלי לחץ זמן.'],
    memory:['🧠','משחק זיכרון','מצא זוגות של מילה ותרגום.'],
    matching:['🔗','התאמת זוגות','בחר מילה ואז את התרגום שלה.'],
    'sentence-builder':['🧩','הרכבת משפט','בנה את המשפט לפי הסדר הנכון.'],
    recall:['👀','זיכרון רצף','זכור מה ראית ואז מצא את המילה שלא הופיעה.'],
    speed:['⏱️','אתגר 60 שניות','ענה מהר — המילים לא חוזרות עד שהמאגר כולו עובר.'],
    'translation-rush':['🎯','אתגר תרגום','מילה אחת, ארבע אפשרויות. בחר מצב: 60 שניות, נוקאאוט או הישרדות.'],
    'four-languages':['🌍','אותה משמעות ב־4 שפות','אותו רעיון מופיע בארבע השפות שלך.']
  };
  const params=new URLSearchParams(location.search);
  let filter=M.LANGUAGE_CODES.includes(params.get('lang'))?params.get('lang'):'all';
  let seedCounter=0;
  let speedTimer=null;
  let rushTimer=null;
  let rushMode='60';
  let mixIndex=-1;
  let cardTopic='all';
  let cardPool=null;
  let cardPoolKey='';
  let cardHistory=[];
  let cardIndex=-1;
  const pools=new Map();
  const mixTypes=['matching','sentence-builder','memory','recall','speed'];

  function display(item){return item?.key&&P.display?P.display(item):M.getDisplay(item);}
  function languageName(lang){return lang==='all'?'כל השפות':M.LANGUAGES[lang].name;}
  function shuffle(list){return list.slice().sort(()=>Math.random()-.5);}
  function normalise(value){return String(value||'').trim().toLowerCase();}
  function poolFor(purpose,lang=filter,topic='all'){
    const key=`${purpose}:${lang}:${topic}`;
    if(!pools.has(key))pools.set(key,P(B,{lang,topic,seed:`${key}:v1`}));
    return pools.get(key);
  }
  function takeDistinct(pool,count){
    const out=[];
    const keys=new Set();
    const meanings=new Set();
    let attempts=0;
    const maxAttempts=Math.max(pool.size*2,count*12);
    while(out.length<count&&attempts<maxAttempts){
      attempts++;
      const item=pool.take(1)[0];
      if(!item||keys.has(item.key))continue;
      const meaning=normalise(item.he);
      if(meaning&&meanings.has(meaning))continue;
      keys.add(item.key);
      if(meaning)meanings.add(meaning);
      out.push(item);
    }
    while(out.length<count&&attempts<maxAttempts*2){
      attempts++;
      const item=pool.take(1)[0];
      if(!item||keys.has(item.key))continue;
      keys.add(item.key);
      out.push(item);
    }
    return out;
  }
  function gameHead(type,game){
    const [icon,title,copy]=LABELS[type];
    return `<div class="game-stage-head"><div><span class="game-kicker">${icon} ${esc(languageName(game.lang))}</span><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><button class="game-btn" type="button" data-new-game>↻ משחק חדש</button></div>`;
  }

  function memoryHtml(game){
    const items=game.items.slice(0,4);
    const deck=shuffle(items.flatMap(item=>{const d=display(item);return [
      {key:item.key||`${item.lang}:${item.id}`,value:d.primary},
      {key:item.key||`${item.lang}:${item.id}`,value:d.translation}
    ];}));
    return `<div class="memory-grid" data-memory-board>${deck.map(card=>`<button class="memory-card" type="button" data-memory-card data-key="${esc(card.key)}" data-value="${esc(card.value)}">?</button>`).join('')}</div><div class="game-feedback" data-memory-feedback>מצא ${items.length} זוגות.</div>`;
  }
  function matchingHtml(game){
    const items=game.items.slice(0,5);
    const right=shuffle(items);
    return `<div class="matching-grid" data-matching-board><div class="matching-column">${items.map(item=>{const d=display(item);const key=item.key||`${item.lang}:${item.id}`;return `<button class="matching-chip" type="button" data-match-side="left" data-key="${esc(key)}">${esc(d.primary)}${d.secondary?`<small class="game-secondary">${esc(d.secondary)}</small>`:''}</button>`;}).join('')}</div><div class="matching-column">${right.map(item=>{const key=item.key||`${item.lang}:${item.id}`;return `<button class="matching-chip" type="button" data-match-side="right" data-key="${esc(key)}">${esc(display(item).translation)}</button>`;}).join('')}</div></div><div class="game-feedback" data-match-feedback>בחר זוג שמתאים.</div>`;
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
    return `<div class="speed-panel" data-speed-panel><div class="speed-top"><span>⏱️ <span data-speed-time>60</span> שניות</span><span>ניקוד: <span data-speed-score>0</span></span></div><button class="game-btn primary" type="button" data-speed-start>התחל</button><div data-speed-question hidden><div class="game-primary" data-speed-word></div><div class="game-secondary" data-speed-secondary></div><div class="speed-options" data-speed-options></div></div><div class="game-feedback" data-speed-feedback>כשתלחץ, השעון יתחיל. כל מילה חדשה עד לסיום המאגר.</div></div>`;
  }

  function translationRushHtml(){
    return `<div class="rush-panel" data-rush-panel>
      <div class="rush-modes" role="group" aria-label="מצב משחק">
        <button class="rush-mode active" type="button" data-rush-mode="60">⏱️ 60 שניות</button>
        <button class="rush-mode" type="button" data-rush-mode="ko">💥 נוקאאוט</button>
        <button class="rush-mode" type="button" data-rush-mode="survival">🔥 הישרדות</button>
      </div>
      <div class="rush-rules" data-rush-rules>60 שניות. כמה תשובות נכונות תצליח?</div>
      <div class="speed-top"><span data-rush-clock-wrap>⏱️ <span data-rush-time>60</span></span><span>נכון: <span data-rush-score>0</span></span></div>
      <button class="game-btn primary" type="button" data-rush-start>התחל משחק</button>
      <div class="rush-question" data-rush-question hidden>
        <div class="game-primary" data-rush-word></div>
        <div class="game-secondary" data-rush-secondary></div>
        <div class="speed-options" data-rush-options></div>
      </div>
      <div class="game-feedback" data-rush-feedback>בחר מצב והתחל.</div>
    </div>`;
  }
  function fourLanguagesHtml(game){
    return `<div class="game-board"><div><span class="game-kicker">הרעיון בעברית</span><div class="game-primary">${esc(game.prompt)}</div></div><div class="four-grid">${game.items.map(item=>{const d=display(item);return `<div class="four-card"><strong>${M.LANGUAGES[item.lang].code} · ${M.LANGUAGES[item.lang].name}</strong><span>${esc(d.primary)}</span>${d.secondary?`<small>${esc(d.secondary)}</small>`:''}</div>`;}).join('')}</div><div class="game-controls"><button class="game-btn" type="button" data-four-hide>כסה שמות שפה</button></div></div>`;
  }

  function bodyHtml(type,game){
    if(type==='memory')return memoryHtml(game);
    if(type==='matching')return matchingHtml(game);
    if(type==='sentence-builder')return sentenceHtml(game);
    if(type==='recall')return recallHtml(game);
    if(type==='speed')return speedHtml(game);
    if(type==='translation-rush')return translationRushHtml();
    return fourLanguagesHtml(game);
  }
  function wordGame(type){
    const count=type==='memory'?4:type==='matching'?5:type==='recall'?4:6;
    return{type,lang:filter,items:takeDistinct(poolFor('session'),count)};
  }

  function ensureCardPool(force=false){
    const key=`${filter}:${cardTopic}`;
    if(!force&&cardPool&&cardPoolKey===key)return;
    seedCounter++;
    cardPool=P(B,{lang:filter,topic:cardTopic,seed:`cards:${key}:${Date.now()}:${seedCounter}`});
    cardPoolKey=key;
    cardHistory=[];
    cardIndex=-1;
  }
  function cardTopicOptions(){
    const all='<option value="all">כל הנושאים</option>';
    return all+Object.entries(B.TOPICS).map(([id,topic])=>`<option value="${esc(id)}" ${id===cardTopic?'selected':''}>${topic.icon} ${esc(topic.name)}</option>`).join('');
  }
  function currentCard(){
    ensureCardPool();
    if(cardIndex<0){cardHistory.push(cardPool.take(1)[0]);cardIndex=0;}
    return cardHistory[cardIndex];
  }
  function cardViewHtml(item){
    const d=display(item);
    const language=M.LANGUAGES[item.lang]||B.LANGUAGES[item.lang];
    return `<div class="card-repository-meta"><span>${esc(language?.code||item.lang.toUpperCase())} · ${esc(language?.name||'')}</span><span>${esc(item.topicName||'')}</span></div><div class="language-audio-inline card-repository-word"><div class="game-primary" data-audio-decorated="1">${esc(d.primary)}</div><button class="language-audio-btn" type="button" data-audio-lang="${esc(item.lang)}" data-audio-text="${esc(item.target)}" aria-label="השמע הגייה" title="השמע הגייה">🔊</button></div>${d.secondary?`<div class="game-secondary">${esc(d.secondary)}</div>`:''}<div class="game-translation" data-card-answer hidden>${esc(d.translation)}</div>`;
  }
  function updateCardView(stage){
    const item=currentCard();
    stage.querySelector('[data-card-view]').innerHTML=cardViewHtml(item);
    const count=stage.querySelector('[data-card-count]');
    if(count)count.textContent=`כרטיס ${cardIndex+1} · ${cardPool.remaining()} נותרו במחזור הנוכחי`;
    const prev=stage.querySelector('[data-card-prev]');
    if(prev)prev.disabled=cardIndex<=0;
    const reveal=stage.querySelector('[data-card-reveal]');
    if(reveal)reveal.textContent='הצג תרגום';
  }
  function renderCardRepository(){
    if(speedTimer){clearInterval(speedTimer);speedTimer=null;}
    if(rushTimer){clearInterval(rushTimer);rushTimer=null;}
    ensureCardPool();
    const stage=$('games-stage');
    stage.innerHTML=`<div class="game-stage-inner"><div class="game-stage-head"><div><span class="game-kicker">🃏 ${esc(languageName(filter))}</span><h2>מאגר כרטיסיות</h2><p>דפדוף חופשי במילים. אפשר לבחור נושא, לערבב, לחשוף תרגום ולשמוע הגייה.</p></div></div><div class="card-repository-toolbar"><label>נושא<select class="game-topic-select" data-card-topic>${cardTopicOptions()}</select></label><button class="game-btn" type="button" data-card-shuffle>↻ ערבב מאגר</button></div><div class="card-repository-card" data-card-view></div><div class="card-repository-count" data-card-count></div><div class="game-controls"><button class="game-btn" type="button" data-card-prev>הקודם</button><button class="game-btn primary" type="button" data-card-reveal>הצג תרגום</button><button class="game-btn" type="button" data-card-next>הבא</button></div></div>`;
    document.querySelectorAll('.game-choice').forEach(btn=>btn.classList.toggle('active',btn.dataset.gameType==='flashcards'));
    updateCardView(stage);
    stage.querySelector('[data-card-topic]').addEventListener('change',event=>{cardTopic=event.target.value;ensureCardPool(true);updateCardView(stage);});
    stage.querySelector('[data-card-shuffle]').addEventListener('click',()=>{ensureCardPool(true);updateCardView(stage);});
    stage.querySelector('[data-card-prev]').addEventListener('click',()=>{if(cardIndex>0){cardIndex--;updateCardView(stage);}});
    stage.querySelector('[data-card-next]').addEventListener('click',()=>{if(cardIndex+1<cardHistory.length)cardIndex++;else{cardHistory.push(cardPool.take(1)[0]);cardIndex++;}updateCardView(stage);});
    stage.querySelector('[data-card-reveal]').addEventListener('click',event=>{const answer=stage.querySelector('[data-card-answer]');if(!answer)return;answer.hidden=!answer.hidden;event.currentTarget.textContent=answer.hidden?'הצג תרגום':'הסתר תרגום';});
    stage.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function render(type,{fromMix=false}={}){
    if(type==='flashcards'){renderCardRepository();return;}
    if(speedTimer){clearInterval(speedTimer);speedTimer=null;}
    seedCounter++;
    let game;
    if(type==='memory'||type==='matching'||type==='recall')game=wordGame(type);
    else if(type==='speed'||type==='translation-rush')game={type,lang:filter,items:[]};
    else game=M.buildMiniGame({type,filter,seed:`games:${Date.now()}:${seedCounter}`});
    const stage=$('games-stage');
    stage.innerHTML=`<div class="game-stage-inner">${gameHead(type,game)}${bodyHtml(type,game)}${fromMix?`<div class="game-controls"><button class="game-btn primary" type="button" data-mix-next>${mixIndex+1<mixTypes.length?'הבא במסלול ←':'סיום המסלול ✓'}</button><div class="daily-progress">${mixTypes.map((_,i)=>`<i class="${i<=mixIndex?'done':''}"></i>`).join('')}</div></div>`:''}</div>`;
    document.querySelectorAll('.game-choice').forEach(btn=>btn.classList.toggle('active',btn.dataset.gameType===type));
    wireStage(type,game,fromMix);
    stage.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function wireStage(type,game,fromMix){
    const stage=$('games-stage');
    stage.querySelector('[data-new-game]')?.addEventListener('click',()=>render(type,{fromMix}));
    stage.querySelector('[data-mix-next]')?.addEventListener('click',()=>{
      if(mixIndex>=mixTypes.length-1){mixIndex=-1;stage.innerHTML='<div class="games-stage-empty"><strong>מסלול ה־5 דקות הושלם ✓</strong><br>אפשר לבחור תרגול נוסף או להתחיל שוב.</div>';return;}
      mixIndex++;render(mixTypes[mixIndex],{fromMix:true});
    });

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

    stage.querySelector('[data-recall-ready]')?.addEventListener('click',event=>{stage.querySelector('[data-recall-list]').hidden=true;event.currentTarget.hidden=true;stage.querySelector('[data-recall-question]').hidden=false;});
    stage.querySelectorAll('[data-recall-option]').forEach(btn=>btn.addEventListener('click',()=>{stage.querySelectorAll('[data-recall-option]').forEach(x=>x.disabled=true);stage.querySelector('[data-recall-feedback]').textContent=btn.dataset.correct==='1'?'נכון — זו המילה שלא הופיעה ✓':'כמעט. נסה תרגול חדש כדי לבדוק שוב את הזיכרון.';}));

    stage.querySelector('[data-four-hide]')?.addEventListener('click',event=>{const cards=stage.querySelectorAll('.four-card strong');const hidden=[...cards].some(x=>!x.hidden);cards.forEach(x=>x.hidden=hidden);event.currentTarget.textContent=hidden?'הצג שמות שפה':'כסה שמות שפה';});
    stage.querySelector('[data-speed-start]')?.addEventListener('click',event=>startSpeed(stage,event.currentTarget));
    stage.querySelectorAll('[data-rush-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      rushMode=btn.dataset.rushMode;
      stage.querySelectorAll('[data-rush-mode]').forEach(x=>x.classList.toggle('active',x===btn));
      const rules=stage.querySelector('[data-rush-rules]');
      rules.textContent=rushMode==='60'?'60 שניות. כמה תשובות נכונות תצליח?':rushMode==='ko'?'טעות אחת והמשחק נגמר. כמה רחוק תגיע?':'מתחילים עם 15 שניות. כל תשובה נכונה מוסיפה 3 שניות.';
      stage.querySelector('[data-rush-time]').textContent=rushMode==='60'?'60':rushMode==='survival'?'15':'—';
      stage.querySelector('[data-rush-clock-wrap]').style.visibility=rushMode==='ko'?'hidden':'visible';
    }));
    stage.querySelector('[data-rush-start]')?.addEventListener('click',event=>startRush(stage,event.currentTarget));
  }

  function startSpeed(stage,startBtn){
    startBtn.hidden=true;
    const question=stage.querySelector('[data-speed-question]');question.hidden=false;
    const timeEl=stage.querySelector('[data-speed-time]');const scoreEl=stage.querySelector('[data-speed-score]');const feedback=stage.querySelector('[data-speed-feedback]');
    let remaining=60,score=0;feedback.textContent='';scoreEl.textContent='0';timeEl.textContent='60';
    const pool=poolFor('session');
    function next(){
      const options=takeDistinct(pool,4);
      const correct=options[0];
      const d=display(correct);
      stage.querySelector('[data-speed-word]').textContent=d.primary;
      stage.querySelector('[data-speed-secondary]').textContent=d.secondary||'';
      const root=stage.querySelector('[data-speed-options]');
      root.innerHTML=shuffle(options).map(item=>`<button class="speed-option" type="button" data-speed-option data-correct="${item.key===correct.key?'1':'0'}">${esc(display(item).translation)}</button>`).join('');
      root.querySelectorAll('[data-speed-option]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.correct==='1'){score++;scoreEl.textContent=score;feedback.textContent='✓';}else feedback.textContent='לא — ממשיכים';next();}));
    }
    next();
    speedTimer=setInterval(()=>{remaining--;timeEl.textContent=remaining;if(remaining<=0){clearInterval(speedTimer);speedTimer=null;question.hidden=true;feedback.textContent=`נגמר הזמן — ${score} תשובות נכונות. המילים שכבר הופיעו יישארו מחוץ לסבב עד שהמאגר ייגמר.`;startBtn.hidden=false;startBtn.textContent='שחק שוב';}},1000);
  }


  function startRush(stage,startBtn){
    if(rushTimer){clearInterval(rushTimer);rushTimer=null;}
    const question=stage.querySelector('[data-rush-question]');
    const timeEl=stage.querySelector('[data-rush-time]');
    const scoreEl=stage.querySelector('[data-rush-score]');
    const feedback=stage.querySelector('[data-rush-feedback]');
    const clockWrap=stage.querySelector('[data-rush-clock-wrap]');
    let remaining=rushMode==='60'?60:rushMode==='survival'?15:0;
    let score=0;
    let ended=false;
    startBtn.hidden=true;
    question.hidden=false;
    scoreEl.textContent='0';
    timeEl.textContent=rushMode==='ko'?'—':String(remaining);
    clockWrap.style.visibility=rushMode==='ko'?'hidden':'visible';
    feedback.textContent='';
    const pool=poolFor('rush',filter,'all');

    function endGame(message){
      if(ended)return;
      ended=true;
      if(rushTimer){clearInterval(rushTimer);rushTimer=null;}
      question.hidden=true;
      feedback.textContent=message;
      startBtn.hidden=false;
      startBtn.textContent='שחק שוב';
    }
    function next(){
      if(ended)return;
      const choices=takeDistinct(pool,4);
      const correct=choices[0];
      const d=display(correct);
      stage.querySelector('[data-rush-word]').textContent=d.primary;
      stage.querySelector('[data-rush-secondary]').textContent=d.secondary||'';
      const root=stage.querySelector('[data-rush-options]');
      root.innerHTML=shuffle(choices).map(item=>`<button class="speed-option" type="button" data-rush-option data-correct="${item.key===correct.key?'1':'0'}">${esc(display(item).translation)}</button>`).join('');
      root.querySelectorAll('[data-rush-option]').forEach(btn=>btn.addEventListener('click',()=>{
        if(ended)return;
        if(btn.dataset.correct==='1'){
          score++;
          scoreEl.textContent=score;
          if(rushMode==='survival'){remaining+=3;timeEl.textContent=remaining;feedback.textContent='+3 שניות ✓';}
          else feedback.textContent='נכון ✓';
          next();
        }else{
          if(rushMode==='ko'){endGame(`נוקאאוט — הגעת ל־${score} תשובות נכונות.`);return;}
          feedback.textContent='לא נכון — ממשיכים';
          next();
        }
      }));
    }
    next();
    if(rushMode!=='ko'){
      rushTimer=setInterval(()=>{
        remaining--;
        timeEl.textContent=Math.max(0,remaining);
        if(remaining<=0)endGame(`נגמר הזמן — ${score} תשובות נכונות.`);
      },1000);
    }
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
  const requestedGame=params.get('game');
  const requestedMode=params.get('mode');
  if(['60','ko','survival'].includes(requestedMode))rushMode=requestedMode;
  if(requestedGame==='translation-rush')render('translation-rush');
})();
