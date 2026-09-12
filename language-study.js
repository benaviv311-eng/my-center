(function(){
  const C=window.LanguageCore;
  if(!C)return;
  const params=C.qs();
  const lang=params.lang;
  const topic=params.topic;
  const language=C.LANGUAGES[lang];
  const topicMeta=C.TOPIC_META[topic];
  const course=C.course(lang,topic);
  const state=C.loadState();
  state.selectedTopicByLanguage[lang]=topic;
  C.saveState(state);

  const offsets={vocabulary:0,recognition:0,reverse:0,builder:0,missing:0,truefalse:0,situation:0,translation:0,dialogue:0,say:0,previous:0,mistakes:0,challenge:0};
  const baseSeed=C.today()+':'+lang+':'+topic;
  const $=id=>document.getElementById(id);
  const primary=item=>C.primary(lang,item);
  const secondary=item=>C.secondary(lang,item);
  const normalise=text=>String(text||'').toLowerCase().replace(/[.,!?¿؟،؛:׳״'"־-]/g,'').replace(/\s+/g,' ').trim();
  const esc=text=>String(text??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  document.title=language.name+' | שפות';
  $('study-language-code').textContent=language.code;
  $('study-language-name').textContent=language.name;
  $('study-language-note').textContent=language.native+' · '+language.primaryNote+(language.secondaryNote?' · '+language.secondaryNote+' משני':'');
  $('study-topic-chip').textContent=topicMeta.icon+' '+topicMeta.name;
  $('topics-link').href='language-topics.html?lang='+lang;
  $('archive-link').href='language-archive.html?lang='+lang;
  $('study-language-switch').innerHTML=Object.entries(C.LANGUAGES).map(([code,item])=>`<a class="btn small ${code===lang?'active':''}" href="language-study.html?lang=${code}&topic=${topic}">${item.code} · ${item.name}</a>`).join('');

  function remember(words){C.rememberWords(state,lang,topic,words);}
  function wordsFor(section){return C.shuffled(course.words,baseSeed+':'+section+':'+offsets[section]).slice(0,5);}
  function sentencesFor(section,count=3){return C.shuffled(course.sentences,baseSeed+':'+section+':'+offsets[section]).slice(0,count);}
  function mistake(item,type){C.markMistake(state,lang+':'+topic+':'+item.id+':'+type,{code:lang,topic,type,target:item.target,pron:item.pron||'',he:item.he||'',label:primary(item)});}
  function optionButton(label,correct){return `<button class="quiz-option" type="button" data-correct="${correct?'1':'0'}">${esc(label)}</button>`;}
  function wireQuiz(containerId,onWrong){const root=$(containerId);if(!root)return;root.querySelectorAll('.quiz-card').forEach(card=>{card.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{if(card.dataset.answered==='1')return;card.dataset.answered='1';const correct=btn.dataset.correct==='1';card.querySelectorAll('.quiz-option').forEach(b=>{b.disabled=true;if(b.dataset.correct==='1')b.classList.add('correct');});if(!correct){btn.classList.add('wrong');onWrong&&onWrong(card);}const feedback=card.querySelector('.quiz-feedback');if(feedback)feedback.textContent=correct?'נכון ✓':'לא. התשובה הנכונה מסומנת.';}));});}

  function renderVocabulary(){
    const words=wordsFor('vocabulary');remember(words);
    $('vocabulary-content').innerHTML=`<div class="vocab-grid">${words.map(w=>`<div class="vocab-card"><div class="vocab-primary">${esc(primary(w))}</div>${secondary(w)?`<div class="vocab-secondary">${esc(secondary(w))}</div>`:''}<button class="btn small vocab-reveal" type="button">הצג פירוש</button><div class="vocab-meaning hidden">${esc(w.he)}</div></div>`).join('')}</div>`;
    $('vocabulary-content').querySelectorAll('.vocab-card').forEach(card=>{const btn=card.querySelector('.vocab-reveal');const meaning=card.querySelector('.vocab-meaning');btn.addEventListener('click',()=>{const show=meaning.classList.contains('hidden');meaning.classList.toggle('hidden',!show);btn.textContent=show?'הסתר פירוש':'הצג פירוש';});});
  }

  function renderRecognition(){
    const words=wordsFor('recognition');remember(words);
    $('recognition-content').innerHTML=`<div class="quiz-list">${words.map((w,i)=>{const opts=C.options(w,course.words,4,baseSeed+':rec:'+offsets.recognition+':'+i,x=>x.id);return `<div class="quiz-card" data-item="${w.id}"><p>מה פירוש <span class="quiz-prompt">${esc(primary(w))}</span>?</p><div class="quiz-options">${opts.map(o=>optionButton(o.he,o.id===w.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('recognition-content',card=>{const item=course.words.find(w=>w.id===card.dataset.item);if(item)mistake(item,'recognition');});
  }

  function renderReverse(){
    const words=wordsFor('reverse');remember(words);
    $('reverse-content').innerHTML=`<div class="quiz-list">${words.map((w,i)=>{const opts=C.options(w,course.words,4,baseSeed+':rev:'+offsets.reverse+':'+i,x=>x.id);return `<div class="quiz-card" data-item="${w.id}"><p>איך אומרים <span class="quiz-prompt">${esc(w.he)}</span>?</p><div class="quiz-options">${opts.map(o=>optionButton(primary(o),o.id===w.id)).join('')}</div><div class="quiz-feedback"></div>${secondary(w)?`<div class="vocab-secondary">הכתב המקורי יופיע אחרי בחירה.</div>`:''}</div>`;}).join('')}</div>`;
    wireQuiz('reverse-content',card=>{const item=course.words.find(w=>w.id===card.dataset.item);if(item)mistake(item,'reverse');});
  }

  function tokenise(text){return String(text).replace(/[.,!?¿؟،؛:]/g,'').split(/\s+/).filter(Boolean);}
  function renderBuilderInto(targetId,section='builder',count=3){
    const sentences=sentencesFor(section,count);
    $(targetId).innerHTML=`<div class="quiz-list">${sentences.map((s,i)=>{const correct=tokenise(primary(s));const shuffled=C.shuffled(correct,baseSeed+':builder:'+section+':'+offsets[section]+':'+i);return `<div class="builder-card" data-sentence="${esc(s.id)}" data-correct="${esc(correct.join(' '))}"><p><b>${esc(s.scenario||s.he)}</b></p><div class="builder-zone" aria-label="המשפט שבנית"></div><div class="token-bank">${shuffled.map((t,n)=>`<button class="word-token" type="button" data-index="${n}">${esc(t)}</button>`).join('')}</div><div class="builder-actions"><button class="btn small" type="button" data-action="check">בדוק</button><button class="btn small" type="button" data-action="reset">נקה</button></div><div class="quiz-feedback"></div>${secondary(s)?`<div class="vocab-secondary">${esc(secondary(s))}</div>`:''}</div>`;}).join('')}</div>`;
    $(targetId).querySelectorAll('.builder-card').forEach(card=>{
      const zone=card.querySelector('.builder-zone');const bank=card.querySelector('.token-bank');
      bank.querySelectorAll('.word-token').forEach(btn=>btn.addEventListener('click',()=>{if(btn.classList.contains('used'))return;btn.classList.add('used');const chip=document.createElement('button');chip.type='button';chip.className='word-token';chip.textContent=btn.textContent;chip.addEventListener('click',()=>{btn.classList.remove('used');chip.remove();});zone.appendChild(chip);}));
      card.querySelector('[data-action="reset"]').addEventListener('click',()=>{zone.innerHTML='';bank.querySelectorAll('.word-token').forEach(b=>b.classList.remove('used'));card.querySelector('.quiz-feedback').textContent='';});
      card.querySelector('[data-action="check"]').addEventListener('click',()=>{const built=[...zone.querySelectorAll('.word-token')].map(x=>x.textContent).join(' ');const ok=normalise(built)===normalise(card.dataset.correct);card.querySelector('.quiz-feedback').textContent=ok?'מצוין ✓':'עוד לא. נסה לשנות את הסדר.';if(!ok){const item=course.sentences.find(s=>s.id===card.dataset.sentence);if(item)mistake(item,'builder');}});
    });
  }
  function renderBuilder(){renderBuilderInto('builder-content','builder',3);}

  function renderMissing(){
    const sentences=sentencesFor('missing',4);
    const allTokens=course.sentences.flatMap(s=>tokenise(primary(s)));
    $('missing-content').innerHTML=`<div class="quiz-list">${sentences.map((s,i)=>{const tokens=tokenise(primary(s));const ix=(i+offsets.missing)%tokens.length;const answer=tokens[ix];const display=tokens.map((t,n)=>n===ix?'_____':t).join(' ');const distractors=C.shuffled(allTokens.filter(t=>normalise(t)!==normalise(answer)),baseSeed+':miss:'+i+':'+offsets.missing).slice(0,3);const opts=C.shuffled([answer,...distractors],baseSeed+':missopts:'+i+':'+offsets.missing);return `<div class="quiz-card" data-sentence="${s.id}"><p><span class="quiz-prompt">${esc(display)}</span></p><small>${esc(s.he)}</small><div class="compact-options">${opts.map(o=>optionButton(o,normalise(o)===normalise(answer))).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('missing-content',card=>{const item=course.sentences.find(s=>s.id===card.dataset.sentence);if(item)mistake(item,'missing');});
  }

  function renderTrueFalse(){
    const words=wordsFor('truefalse');
    $('truefalse-content').innerHTML=`<div class="quiz-list">${words.map((w,i)=>{const shouldBeCorrect=(i+offsets.truefalse)%2===0;const wrong=course.words.find(x=>x.id!==w.id&&x.he!==w.he);const shown=shouldBeCorrect?w.he:wrong.he;return `<div class="quiz-card" data-item="${w.id}"><p><span class="quiz-prompt">${esc(primary(w))}</span> = <b>${esc(shown)}</b></p><div class="quiz-options">${optionButton('נכון',shouldBeCorrect)}${optionButton('לא נכון',!shouldBeCorrect)}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('truefalse-content',card=>{const item=course.words.find(w=>w.id===card.dataset.item);if(item)mistake(item,'truefalse');});
  }

  function renderSituation(){
    const sentences=sentencesFor('situation',3);
    $('situation-content').innerHTML=`<div class="quiz-list">${sentences.map((s,i)=>{const opts=C.options(s,course.sentences,3,baseSeed+':sit:'+offsets.situation+':'+i,x=>x.id);return `<div class="quiz-card" data-sentence="${s.id}"><p><b>${esc(s.scenario)}</b></p><div class="quiz-options">${opts.map(o=>optionButton(primary(o),o.id===s.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    wireQuiz('situation-content',card=>{const item=course.sentences.find(s=>s.id===card.dataset.sentence);if(item)mistake(item,'situation');});
  }

  function renderTranslation(){
    const sentences=sentencesFor('translation',3);
    $('translation-content').innerHTML=sentences.map(s=>`<div class="translation-row" data-sentence="${s.id}"><p><span class="quiz-prompt">${esc(primary(s))}</span>${secondary(s)?` <small class="vocab-secondary">${esc(secondary(s))}</small>`:''}</p><div class="answer-line"><input class="study-input" type="text" placeholder="כתוב את המשמעות בעברית"><button class="btn small" type="button">בדוק</button></div><div class="quiz-feedback"></div></div>`).join('');
    $('translation-content').querySelectorAll('.translation-row').forEach(row=>{const s=course.sentences.find(x=>x.id===row.dataset.sentence);const input=row.querySelector('input');row.querySelector('button').addEventListener('click',()=>{const typed=normalise(input.value);const expected=normalise(s.he);const ok=typed===expected||typed.includes(expected)||expected.includes(typed)&&typed.length>3;row.querySelector('.quiz-feedback').textContent=ok?'נכון ✓':'התשובה: '+s.he;if(!ok)mistake(s,'translation');});});
  }

  function renderDialogue(){
    const sentences=sentencesFor('dialogue',3);
    $('dialogue-content').innerHTML=`<div class="dialogue-thread" id="dialogue-thread"><div class="dialogue-bubble">אני אתן לך מצב. בחר את התגובה המתאימה.</div></div><div class="dialogue-row" id="dialogue-step"></div>`;
    let step=0;const thread=$('dialogue-thread');const stepBox=$('dialogue-step');
    function draw(){if(step>=sentences.length){stepBox.innerHTML='<strong>סיימת את השיחה ✓</strong>';return;}const s=sentences[step];const opts=C.options(s,course.sentences,3,baseSeed+':dialogue:'+offsets.dialogue+':'+step,x=>x.id);stepBox.innerHTML=`<p><b>${esc(s.scenario)}</b></p><div class="compact-options">${opts.map(o=>optionButton(primary(o),o.id===s.id)).join('')}</div><div class="quiz-feedback"></div>`;stepBox.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{const ok=btn.dataset.correct==='1';if(!ok){btn.classList.add('wrong');stepBox.querySelector('.quiz-feedback').textContent='נסה תשובה אחרת.';mistake(s,'dialogue');return;}thread.insertAdjacentHTML('beforeend',`<div class="dialogue-bubble user">${esc(primary(s))}</div>`);step++;draw();}));}
    draw();
  }

  function renderSay(){renderBuilderInto('say-content','say',1);}

  function displaySeen(item){if(lang==='ar'||lang==='ru')return item.pron||item.transliteration||item.target;return item.target;}
  function renderPrevious(){
    const seen=C.shuffled(C.seenForLanguage(state,lang).filter(x=>x.topic!==topic),baseSeed+':previous:'+offsets.previous).slice(0,5);
    if(!seen.length){$('previous-content').innerHTML='<p class="mistakes-empty">עדיין אין מספיק חומר קודם. אחרי שתלמד עוד נושא, המילים ייכנסו לכאן אוטומטית.</p>';return;}
    $('previous-content').innerHTML=`<div class="vocab-grid">${seen.map(w=>`<div class="vocab-card"><div class="vocab-primary">${esc(displaySeen(w))}</div>${(lang==='ar'||lang==='ru')&&w.target?`<div class="vocab-secondary">${esc(w.target)}</div>`:''}<button class="btn small vocab-reveal" type="button">הצג פירוש</button><div class="vocab-meaning hidden">${esc(w.he||'')}</div></div>`).join('')}</div>`;
    $('previous-content').querySelectorAll('.vocab-card').forEach(card=>{const btn=card.querySelector('button');const ans=card.querySelector('.vocab-meaning');btn.addEventListener('click',()=>{ans.classList.toggle('hidden');});});
  }

  function renderMistakes(){
    const items=Object.values(state.mistakes||{}).filter(x=>x.code===lang).sort((a,b)=>(b.count||0)-(a.count||0));
    if(!items.length){$('mistakes-content').innerHTML='<p class="mistakes-empty">אין כרגע טעויות שמורות בשפה הזאת. מצוין.</p>';return;}
    $('mistakes-content').innerHTML=items.slice(0,12).map(m=>`<div class="mistake-card"><div class="mistake-text"><strong>${esc(m.label||m.pron||m.target)}</strong><small>${esc(m.he||'')} · ${esc(m.type||'תרגול')} · ${m.count||1} פעמים</small></div><button class="btn small" type="button" data-clear="${esc(m.key)}">ידעתי ✓</button></div>`).join('');
    $('mistakes-content').querySelectorAll('[data-clear]').forEach(btn=>btn.addEventListener('click',()=>{C.clearMistake(state,btn.dataset.clear);renderMistakes();}));
  }

  function renderChallenge(){
    const words=C.shuffled(course.words,baseSeed+':challenge:'+offsets.challenge).slice(0,8);const sentences=C.shuffled(course.sentences,baseSeed+':challenges:'+offsets.challenge).slice(0,2);let score=0,answered=0;
    $('challenge-content').innerHTML=`<div class="challenge-score" id="challenge-score">0/10</div><div class="quiz-list">${words.map((w,i)=>{const reverse=i%2===1;const opts=C.options(w,course.words,4,baseSeed+':ch:'+offsets.challenge+':'+i,x=>x.id);return `<div class="quiz-card" data-item="${w.id}"><p>${reverse?`איך אומרים <b>${esc(w.he)}</b>?`:`מה פירוש <span class="quiz-prompt">${esc(primary(w))}</span>?`}</p><div class="quiz-options">${opts.map(o=>optionButton(reverse?primary(o):o.he,o.id===w.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}${sentences.map((s,i)=>{const opts=C.options(s,course.sentences,3,baseSeed+':chs:'+i+':'+offsets.challenge,x=>x.id);return `<div class="quiz-card" data-sentence="${s.id}"><p><b>${esc(s.scenario)}</b></p><div class="quiz-options">${opts.map(o=>optionButton(primary(o),o.id===s.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div>`;
    const root=$('challenge-content');root.querySelectorAll('.quiz-card').forEach(card=>card.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{if(card.dataset.answered==='1')return;card.dataset.answered='1';answered++;const ok=btn.dataset.correct==='1';if(ok)score++;else{btn.classList.add('wrong');const item=card.dataset.item?course.words.find(w=>w.id===card.dataset.item):course.sentences.find(s=>s.id===card.dataset.sentence);if(item)mistake(item,'challenge');}card.querySelectorAll('.quiz-option').forEach(b=>{b.disabled=true;if(b.dataset.correct==='1')b.classList.add('correct');});$('challenge-score').textContent=score+'/'+answered+(answered===10?' · סיום':'');}))); 
  }

  function renderExtraBatch(index){
    const words=C.shuffled(course.words,baseSeed+':extra:'+index).slice(0,5);
    const wrapper=document.createElement('section');wrapper.className='section';wrapper.innerHTML=`<article class="card study-section-card"><div class="study-section-head"><div><h2>עוד תרגול ${index}</h2><p class="meta">חמישה תרגילים נוספים בגלילה.</p></div></div><div class="quiz-list">${words.map((w,i)=>{const opts=C.options(w,course.words,4,baseSeed+':extraopts:'+index+':'+i,x=>x.id);return `<div class="quiz-card" data-item="${w.id}"><p>מה פירוש <span class="quiz-prompt">${esc(primary(w))}</span>?</p><div class="quiz-options">${opts.map(o=>optionButton(o.he,o.id===w.id)).join('')}</div><div class="quiz-feedback"></div></div>`;}).join('')}</div></article>`;$('extra-batches').appendChild(wrapper);wrapper.querySelectorAll('.quiz-card').forEach(card=>card.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{if(card.dataset.answered==='1')return;card.dataset.answered='1';const ok=btn.dataset.correct==='1';card.querySelectorAll('.quiz-option').forEach(b=>{b.disabled=true;if(b.dataset.correct==='1')b.classList.add('correct');});if(!ok){btn.classList.add('wrong');const item=course.words.find(w=>w.id===card.dataset.item);if(item)mistake(item,'extra');}card.querySelector('.quiz-feedback').textContent=ok?'נכון ✓':'התשובה הנכונה מסומנת.';})));
  }

  const renderers={vocabulary:renderVocabulary,recognition:renderRecognition,reverse:renderReverse,builder:renderBuilder,missing:renderMissing,truefalse:renderTrueFalse,situation:renderSituation,translation:renderTranslation,dialogue:renderDialogue,say:renderSay,previous:renderPrevious,mistakes:renderMistakes,challenge:renderChallenge};
  document.querySelectorAll('[data-refresh]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.refresh;offsets[key]=(offsets[key]||0)+1;renderers[key]&&renderers[key]();if(typeof toast==='function')toast('התרגיל רוענן');}));

  let batch=0;$('append-more').addEventListener('click',()=>{batch++;renderExtraBatch(batch);setTimeout(()=>$('extra-batches').lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'}),20);});
  $('complete-language').addEventListener('click',()=>{C.setCompleted(state,lang,true);$('complete-language').textContent='הושלם להיום ✓';if(typeof toast==='function')toast(language.name+' הושלמה להיום');});

  Object.values(renderers).forEach(fn=>fn());
  if(C.completedToday(state).includes(lang))$('complete-language').textContent='הושלם להיום ✓';
})();
