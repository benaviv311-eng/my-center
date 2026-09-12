(function(){
  const C=window.LanguageCore;
  if(!C)return;

  const LANGS=['ar','it','ru','es'];
  const STORAGE_KEY='my-center-four-study-v1';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const norm=value=>String(value||'').toLowerCase().replace(/[.,!?¿؟،؛:׳״'"־-]/g,'').replace(/\s+/g,' ').trim();
  const offsets={vocabulary:0,recognition:0,reverse:0,builder:0,missing:0,truefalse:0,situation:0,translation:0,dialogue:0,say:0,previous:0,mistakes:0,challenge:0};

  function loadState(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {mistakes:Array.isArray(raw.mistakes)?raw.mistakes:[],completed:raw.completed||{},extras:Number(raw.extras)||0};
    }catch(e){return {mistakes:[],completed:{},extras:0};}
  }
  const state=loadState();
  function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function topic(){return C.validTopic($('four-topic')?.value||'basics');}
  function course(lang){return C.course(lang,topic());}
  function display(lang,item){return {primary:C.primary(lang,item),secondary:C.secondary(lang,item)};}
  function seed(section){return `${today()}:four:${topic()}:${section}:${offsets[section]||0}:${state.extras}`;}
  function shuffled(list,section){return C.shuffled(list,seed(section));}
  function tokenise(text){return String(text||'').replace(/[.,!?¿؟،؛:]/g,'').split(/\s+/).filter(Boolean);}
  function alignedWords(){
    const lists=Object.fromEntries(LANGS.map(lang=>[lang,course(lang).words]));
    const count=Math.min(...LANGS.map(lang=>lists[lang].length));
    return Array.from({length:count},(_,i)=>({he:lists.ar[i].he,items:Object.fromEntries(LANGS.map(lang=>[lang,lists[lang][i]]))}));
  }
  function alignedSentences(){
    const lists=Object.fromEntries(LANGS.map(lang=>[lang,course(lang).sentences]));
    const count=Math.min(...LANGS.map(lang=>lists[lang].length));
    return Array.from({length:count},(_,i)=>({he:lists.ar[i].he,scenario:lists.ar[i].scenario||lists.ar[i].situation||lists.ar[i].he,items:Object.fromEntries(LANGS.map(lang=>[lang,lists[lang][i]]))}));
  }
  function langLabel(lang){const m=C.LANGUAGES[lang];return `${m.code} · ${m.name}`;}
  function addMistake(type,lang,item){
    const d=display(lang,item);
    const entry={key:`${topic()}:${type}:${lang}:${item.id}`,type,lang,topic:topic(),he:item.he,target:d.primary,secondary:d.secondary||'',at:new Date().toISOString()};
    state.mistakes=[entry,...state.mistakes.filter(x=>x.key!==entry.key)].slice(0,40);
    saveState();
    renderMistakes();
  }
  function option(label,correct){return `<button class="quiz-option" type="button" data-correct="${correct?'1':'0'}">${esc(label)}</button>`;}
  function wireQuiz(rootId,onWrong){
    const root=$(rootId);if(!root)return;
    root.querySelectorAll('.quiz-card').forEach(card=>{
      card.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{
        if(card.dataset.answered==='1')return;
        card.dataset.answered='1';
        const ok=btn.dataset.correct==='1';
        card.querySelectorAll('.quiz-option').forEach(b=>{b.disabled=true;if(b.dataset.correct==='1')b.classList.add('correct');});
        if(!ok){btn.classList.add('wrong');if(onWrong)onWrong(card);}
        const fb=card.querySelector('.quiz-feedback');if(fb)fb.textContent=ok?'נכון ✓':'לא. התשובה הנכונה מסומנת.';
      }));
    });
  }

  function conceptGrid(rows){
    return `<div class="four-study-concepts">${rows.map(row=>`<article class="four-study-concept"><div class="four-study-he">${esc(row.he)}</div><div class="four-study-lang-grid">${LANGS.map(lang=>{const d=display(lang,row.items[lang]);return `<div class="four-study-lang"><strong>${langLabel(lang)}</strong><span>${esc(d.primary)}</span>${d.secondary?`<small>${esc(d.secondary)}</small>`:''}</div>`;}).join('')}</div></article>`).join('')}</div>`;
  }

  function renderVocabulary(){
    const rows=shuffled(alignedWords(),'vocabulary').slice(0,5);
    $('four-vocabulary-content').innerHTML=conceptGrid(rows);
  }

  function renderRecognition(){
    const rows=shuffled(alignedWords(),'recognition').slice(0,4);
    $('four-recognition-content').innerHTML=`<div class="quiz-list">${rows.map((row,i)=>{const lang=LANGS[i%LANGS.length];const item=row.items[lang];const d=display(lang,item);const distract=shuffled(alignedWords().filter(x=>x.he!==row.he),'recognition').slice(i,i+3);const opts=shuffled([{he:row.he,correct:true},...distract.map(x=>({he:x.he,correct:false}))],'recognition').slice(0,4);return `<div class="quiz-card" data-lang="${lang}" data-id="${esc(item.id)}"><p><b>${langLabel(lang)}</b> — מה פירוש <span class="quiz-prompt">${esc(d.primary)}</span>?</p>${d.secondary?`<div class="vocab-secondary">${esc(d.secondary)}</div>`:''}<div class="quiz-options">${opts.map(o=>option(o.he,o.correct)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('four-recognition-content',card=>{const item=course(card.dataset.lang).words.find(x=>x.id===card.dataset.id);if(item)addMistake('recognition',card.dataset.lang,item);});
  }

  function renderReverse(){
    const rows=shuffled(alignedWords(),'reverse').slice(0,4);
    $('four-reverse-content').innerHTML=`<div class="quiz-list">${rows.map((row,i)=>{const lang=LANGS[i%LANGS.length];const correct=row.items[lang];const choices=shuffled(alignedWords().filter(x=>x.he!==row.he),'reverse').slice(0,3).map(x=>x.items[lang]);const opts=shuffled([correct,...choices],'reverse');return `<div class="quiz-card" data-lang="${lang}" data-id="${esc(correct.id)}"><p>איך אומרים <b>${esc(row.he)}</b> ב־${C.LANGUAGES[lang].name}?</p><div class="quiz-options">${opts.map(item=>option(display(lang,item).primary,item.id===correct.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('four-reverse-content',card=>{const item=course(card.dataset.lang).words.find(x=>x.id===card.dataset.id);if(item)addMistake('reverse',card.dataset.lang,item);});
  }

  function builderCard(lang,row,idx,type){
    const item=row.items[lang];const d=display(lang,item);const correct=tokenise(d.primary);const tokens=C.shuffled(correct,seed(type)+':'+idx+':'+lang);
    return `<div class="builder-card" data-lang="${lang}" data-id="${esc(item.id)}" data-correct="${esc(correct.join(' '))}"><p><b>${langLabel(lang)}</b> · ${esc(row.he)}</p><div class="builder-zone"></div><div class="token-bank">${tokens.map((t,n)=>`<button class="word-token" type="button" data-index="${n}">${esc(t)}</button>`).join('')}</div><div class="builder-actions"><button class="btn small" type="button" data-action="check">בדוק</button><button class="btn small" type="button" data-action="reset">נקה</button></div><div class="quiz-feedback"></div>${d.secondary?`<div class="vocab-secondary">${esc(d.secondary)}</div>`:''}</div>`;
  }
  function wireBuilders(rootId,type){
    const root=$(rootId);if(!root)return;
    root.querySelectorAll('.builder-card').forEach(card=>{
      const zone=card.querySelector('.builder-zone');const bank=card.querySelector('.token-bank');
      bank.querySelectorAll('.word-token').forEach(btn=>btn.addEventListener('click',()=>{if(btn.classList.contains('used'))return;btn.classList.add('used');const chip=document.createElement('button');chip.type='button';chip.className='word-token';chip.textContent=btn.textContent;chip.addEventListener('click',()=>{btn.classList.remove('used');chip.remove();});zone.appendChild(chip);}));
      card.querySelector('[data-action="reset"]').addEventListener('click',()=>{zone.innerHTML='';bank.querySelectorAll('.word-token').forEach(b=>b.classList.remove('used'));card.querySelector('.quiz-feedback').textContent='';});
      card.querySelector('[data-action="check"]').addEventListener('click',()=>{const built=[...zone.querySelectorAll('.word-token')].map(x=>x.textContent).join(' ');const ok=norm(built)===norm(card.dataset.correct);card.querySelector('.quiz-feedback').textContent=ok?'מצוין ✓':'עוד לא. נסה לשנות את הסדר.';if(!ok){const item=course(card.dataset.lang).sentences.find(x=>x.id===card.dataset.id);if(item)addMistake(type,card.dataset.lang,item);}});
    });
  }
  function renderBuilder(){
    const row=shuffled(alignedSentences(),'builder')[0];
    $('four-builder-content').innerHTML=`<div class="quiz-list">${LANGS.map((lang,i)=>builderCard(lang,row,i,'builder')).join('')}</div>`;
    wireBuilders('four-builder-content','builder');
  }

  function renderMissing(){
    const rows=shuffled(alignedSentences(),'missing').slice(0,4);
    $('four-missing-content').innerHTML=`<div class="quiz-list">${rows.map((row,i)=>{const lang=LANGS[i%4];const item=row.items[lang];const d=display(lang,item);const tokens=tokenise(d.primary);const ix=(i+offsets.missing)%Math.max(tokens.length,1);const answer=tokens[ix]||'';const shown=tokens.map((t,n)=>n===ix?'_____':t).join(' ');const pool=course(lang).sentences.flatMap(s=>tokenise(display(lang,s).primary)).filter(t=>norm(t)!==norm(answer));const opts=C.shuffled([answer,...C.shuffled(pool,seed('missing')+i).slice(0,3)],seed('missing')+':opts:'+i);return `<div class="quiz-card" data-lang="${lang}" data-id="${esc(item.id)}"><p><b>${langLabel(lang)}</b> · <span class="quiz-prompt">${esc(shown)}</span></p><small>${esc(row.he)}</small><div class="compact-options">${opts.map(t=>option(t,norm(t)===norm(answer))).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('four-missing-content',card=>{const item=course(card.dataset.lang).sentences.find(x=>x.id===card.dataset.id);if(item)addMistake('missing',card.dataset.lang,item);});
  }

  function renderTrueFalse(){
    const rows=shuffled(alignedWords(),'truefalse').slice(0,4);
    $('four-truefalse-content').innerHTML=`<div class="quiz-list">${rows.map((row,i)=>{const lang=LANGS[i%4];const item=row.items[lang];const d=display(lang,item);const yes=(i+offsets.truefalse)%2===0;const wrong=alignedWords().find(x=>x.he!==row.he);const shown=yes?row.he:wrong.he;return `<div class="quiz-card" data-lang="${lang}" data-id="${esc(item.id)}"><p><b>${langLabel(lang)}</b> · <span class="quiz-prompt">${esc(d.primary)}</span> = <b>${esc(shown)}</b></p><div class="quiz-options">${option('נכון',yes)}${option('לא נכון',!yes)}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('four-truefalse-content',card=>{const item=course(card.dataset.lang).words.find(x=>x.id===card.dataset.id);if(item)addMistake('truefalse',card.dataset.lang,item);});
  }

  function renderSituation(){
    const rows=shuffled(alignedSentences(),'situation').slice(0,4);
    $('four-situation-content').innerHTML=`<div class="quiz-list">${rows.map((row,i)=>{const lang=LANGS[i%4];const correct=row.items[lang];const distract=shuffled(alignedSentences().filter(x=>x.he!==row.he),'situation').slice(0,2).map(x=>x.items[lang]);const opts=shuffled([correct,...distract],'situation');return `<div class="quiz-card" data-lang="${lang}" data-id="${esc(correct.id)}"><p><b>${esc(row.scenario||row.he)}</b><br><small>בחר תשובה ב־${C.LANGUAGES[lang].name}</small></p><div class="quiz-options">${opts.map(item=>option(display(lang,item).primary,item.id===correct.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('four-situation-content',card=>{const item=course(card.dataset.lang).sentences.find(x=>x.id===card.dataset.id);if(item)addMistake('situation',card.dataset.lang,item);});
  }

  function renderTranslation(){
    const rows=shuffled(alignedSentences(),'translation').slice(0,4);
    $('four-translation-content').innerHTML=rows.map((row,i)=>{const lang=LANGS[i%4];const item=row.items[lang];const d=display(lang,item);return `<div class="translation-row" data-lang="${lang}" data-id="${esc(item.id)}" data-answer="${esc(row.he)}"><p><b>${langLabel(lang)}</b> · <span class="quiz-prompt">${esc(d.primary)}</span>${d.secondary?` <small class="vocab-secondary">${esc(d.secondary)}</small>`:''}</p><div class="answer-line"><input class="study-input" type="text" placeholder="כתוב את המשמעות בעברית"><button class="btn small" type="button">בדוק</button></div><div class="quiz-feedback"></div></div>`;}).join('');
    $('four-translation-content').querySelectorAll('.translation-row').forEach(row=>row.querySelector('button').addEventListener('click',()=>{const input=row.querySelector('input');const expected=norm(row.dataset.answer);const typed=norm(input.value);const ok=typed===expected||(typed.length>3&&(typed.includes(expected)||expected.includes(typed)));row.querySelector('.quiz-feedback').textContent=ok?'נכון ✓':'התשובה: '+row.dataset.answer;if(!ok){const item=course(row.dataset.lang).sentences.find(x=>x.id===row.dataset.id);if(item)addMistake('translation',row.dataset.lang,item);}}));
  }

  function renderDialogue(){
    const rows=shuffled(alignedSentences(),'dialogue').slice(0,4);
    $('four-dialogue-content').innerHTML=`<div class="dialogue-thread">${rows.map((row,i)=>{const lang=LANGS[i%4];const item=row.items[lang];const d=display(lang,item);return `<div class="dialogue-row"><div class="dialogue-bubble">${esc(row.scenario||row.he)}</div><div class="dialogue-bubble user"><strong>${langLabel(lang)}</strong><br>${esc(d.primary)}${d.secondary?`<br><small>${esc(d.secondary)}</small>`:''}</div><div class="vocab-secondary">${esc(row.he)}</div></div>`;}).join('')}</div>`;
  }

  function renderSay(){
    const row=shuffled(alignedSentences(),'say')[0];
    $('four-say-content').innerHTML=`<p class="meta">אותה כוונה בארבע השפות: <b>${esc(row.he)}</b></p><div class="quiz-list">${LANGS.map((lang,i)=>builderCard(lang,row,i,'say')).join('')}</div>`;
    wireBuilders('four-say-content','say');
  }

  function renderPrevious(){
    const topics=Object.keys(C.TOPIC_META).filter(x=>x!==topic());
    const prevTopic=topics[(offsets.previous+state.extras)%topics.length];
    if(!prevTopic){$('four-previous-content').innerHTML='<p class="mistakes-empty">עדיין אין נושא קודם.</p>';return;}
    const current=topic();
    const select=$('four-topic');const original=select.value;select.value=prevTopic;
    const rows=shuffled(alignedWords(),'previous').slice(0,4);
    select.value=original||current;
    $('four-previous-content').innerHTML=`<p class="meta">חזרה מהנושא: <b>${esc(C.TOPIC_META[prevTopic].name)}</b></p>${conceptGrid(rows)}`;
  }

  function renderMistakes(){
    const root=$('four-mistakes-content');if(!root)return;
    if(!state.mistakes.length){root.innerHTML='<p class="mistakes-empty">עדיין אין טעויות. הן יופיעו כאן אוטומטית בזמן התרגול.</p>';return;}
    root.innerHTML=state.mistakes.slice(0,10).map(m=>`<div class="mistake-card"><div class="mistake-text"><strong>${esc(m.target)} · ${esc(m.he)}</strong><small>${esc(C.LANGUAGES[m.lang]?.name||m.lang)} · ${esc(m.type)}</small></div>${m.secondary?`<span class="vocab-secondary">${esc(m.secondary)}</span>`:''}</div>`).join('');
  }

  function renderChallenge(){
    const rows=shuffled(alignedWords(),'challenge').slice(0,8);
    $('four-challenge-content').innerHTML=`<div class="quiz-list">${rows.map((row,i)=>{const lang=LANGS[i%4];const item=row.items[lang];const d=display(lang,item);const distract=shuffled(alignedWords().filter(x=>x.he!==row.he),'challenge').slice(0,3);const opts=shuffled([{he:row.he,correct:true},...distract.map(x=>({he:x.he,correct:false}))],'challenge');return `<div class="quiz-card" data-lang="${lang}" data-id="${esc(item.id)}"><p><b>${langLabel(lang)}</b> · ${esc(d.primary)}</p><div class="quiz-options">${opts.map(o=>option(o.he,o.correct)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('four-challenge-content',card=>{const item=course(card.dataset.lang).words.find(x=>x.id===card.dataset.id);if(item)addMistake('challenge',card.dataset.lang,item);});
  }

  const renderers={vocabulary:renderVocabulary,recognition:renderRecognition,reverse:renderReverse,builder:renderBuilder,missing:renderMissing,truefalse:renderTrueFalse,situation:renderSituation,translation:renderTranslation,dialogue:renderDialogue,say:renderSay,previous:renderPrevious,mistakes:renderMistakes,challenge:renderChallenge};
  function renderAll(){Object.values(renderers).forEach(fn=>fn());const chip=$('four-study-topic-chip');if(chip){const meta=C.TOPIC_META[topic()];chip.textContent=`${meta.icon} ${meta.name} · ארבע השפות יחד`;}}

  document.querySelectorAll('[data-four-refresh]').forEach(btn=>btn.addEventListener('click',()=>{const section=btn.dataset.fourRefresh;if(offsets[section]!==undefined)offsets[section]++;renderers[section]?.();}));
  $('four-topic')?.addEventListener('change',()=>{Object.keys(offsets).forEach(k=>offsets[k]=0);renderAll();});
  $('four-append-more')?.addEventListener('click',()=>{state.extras++;saveState();offsets.challenge++;renderChallenge();$('four-extra-batches').insertAdjacentHTML('beforeend',`<article class="card"><h3>סבב נוסף ${state.extras}</h3><p class="meta">נוסף אתגר מעורב חדש מארבע השפות. גלול לאתגר המסכם כדי לפתור אותו.</p></article>`);});
  $('four-complete')?.addEventListener('click',()=>{state.completed[today()]=true;saveState();$('four-complete').textContent='הושלם היום ✓';$('four-complete').classList.add('study-primary');});

  renderAll();
  if(state.completed[today()]&&$('four-complete')){$('four-complete').textContent='הושלם היום ✓';$('four-complete').classList.add('study-primary');}
})();
