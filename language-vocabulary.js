(function(){
  const C=window.LanguageCore;
  if(!C)return;

  const {lang}=C.qs();
  const language=C.LANGUAGES[lang];
  const state=C.loadState();
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function availableTopics(){
    return Object.entries(C.TOPIC_META).filter(([topic])=>C.COURSES[lang]?.[topic]?.words?.length);
  }

  function allWords(){
    return availableTopics().flatMap(([topic,meta])=>C.course(lang,topic).words.map(word=>({word,topic,meta})));
  }

  function statusFor(word){return state.wordStatus[word.id]||'new';}

  function setStatus(wordId,next){
    state.wordStatus[wordId]=next;
    C.saveState(state);
  }

  function displayWord(word){
    return {
      primary:C.primary(lang,word),
      secondary:C.secondary(lang,word),
      hebrew:word.he
    };
  }

  function renderLanguageHeader(){
    document.title=`אוצר מילים · ${language.name}`;
    $('vocab-language-code').textContent=language.code;
    $('vocab-language-name').textContent=`${language.name} · ${language.primaryNote}${language.secondaryNote?' · '+language.secondaryNote+' משני':''}`;
    $('vocab-language-switch').innerHTML=Object.entries(C.LANGUAGES).map(([code,item])=>`<a class="study-switch ${code===lang?'active':''}" href="language-vocabulary.html?lang=${code}">${item.code} · ${item.name}</a>`).join('');
  }

  function renderTopicNav(){
    $('vocab-topic-nav').innerHTML=availableTopics().map(([topic,meta])=>{
      const count=C.course(lang,topic).words.length;
      return `<a class="vocab-topic-chip" href="#vocab-topic-${topic}">${meta.icon} ${esc(meta.name)} · ${count}</a>`;
    }).join('');
  }

  function wordCard(word,topic,meta){
    const d=displayWord(word);
    const status=statusFor(word);
    const search=[d.primary,d.secondary,d.hebrew,meta.name].join(' ').toLowerCase();
    return `<article class="vocab-word ${status==='known'?'is-known':''} ${status==='practice'?'is-practice':''}" data-vocab-word="${esc(word.id)}" data-vocab-status="${status}" data-vocab-search="${esc(search)}">
      <div class="vocab-word-primary">${esc(d.primary)}</div>
      ${d.secondary?`<div class="vocab-word-secondary">${esc(d.secondary)}</div>`:''}
      <div class="vocab-word-hebrew">${esc(d.hebrew)}</div>
      <div class="vocab-word-actions">
        <button class="vocab-word-action ${status==='known'?'active':''}" type="button" data-set-status="known">✓ יודע</button>
        <button class="vocab-word-action ${status==='practice'?'active':''}" type="button" data-set-status="practice">↻ לתרגול</button>
        <a class="vocab-word-action" href="language-games.html?lang=${lang}">🎮 תרגל</a>
      </div>
    </article>`;
  }

  function renderSections(){
    $('vocab-sections').innerHTML=availableTopics().map(([topic,meta])=>{
      const words=C.course(lang,topic).words;
      return `<section id="vocab-topic-${topic}" class="vocab-topic-section" data-vocab-topic="${topic}">
        <article class="card vocab-topic-card">
          <div class="vocab-topic-head">
            <div class="vocab-topic-title"><span class="vocab-topic-icon">${meta.icon}</span><div><h2>${esc(meta.name)}</h2><p>${esc(meta.description)}</p><div class="vocab-topic-count" data-topic-count>${words.length} מילים</div></div></div>
            <div class="vocab-topic-actions"><a class="btn small" href="language-study.html?lang=${lang}&topic=${topic}">ללמוד את הנושא</a><a class="btn small" href="language-games.html?lang=${lang}">🎮 משחקים</a></div>
          </div>
          <div class="vocab-word-grid">${words.map(word=>wordCard(word,topic,meta)).join('')}</div>
        </article>
      </section>`;
    }).join('');
  }

  function updateSummary(){
    const words=allWords().map(x=>x.word);
    const known=words.filter(w=>statusFor(w)==='known').length;
    const practice=words.filter(w=>statusFor(w)==='practice').length;
    $('vocab-summary').textContent=`${words.length} מילים · ${availableTopics().length} נושאים · ${known} יודע · ${practice} לתרגול`;
  }

  function applyFilters(){
    const query=$('vocab-search').value.trim().toLowerCase();
    const wanted=$('vocab-status').value;
    let visibleTotal=0;

    document.querySelectorAll('[data-vocab-topic]').forEach(section=>{
      let visibleInTopic=0;
      section.querySelectorAll('[data-vocab-word]').forEach(card=>{
        const matchesText=!query||card.dataset.vocabSearch.includes(query);
        const matchesStatus=wanted==='all'||card.dataset.vocabStatus===wanted;
        const show=matchesText&&matchesStatus;
        card.classList.toggle('vocab-hidden',!show);
        if(show){visibleInTopic++;visibleTotal++;}
      });
      section.classList.toggle('vocab-hidden',visibleInTopic===0);
      const count=section.querySelector('[data-topic-count]');
      if(count)count.textContent=query||wanted!=='all'?`${visibleInTopic} תוצאות`:`${section.querySelectorAll('[data-vocab-word]').length} מילים`;
    });

    let empty=$('vocab-sections').querySelector('.vocab-empty');
    if(!visibleTotal){
      if(!empty){empty=document.createElement('div');empty.className='card vocab-empty';empty.textContent='לא נמצאו מילים שמתאימות לחיפוש.';$('vocab-sections').appendChild(empty);}
    }else empty?.remove();
  }

  function refreshWordCard(card,next){
    card.dataset.vocabStatus=next;
    card.classList.toggle('is-known',next==='known');
    card.classList.toggle('is-practice',next==='practice');
    card.querySelectorAll('[data-set-status]').forEach(btn=>btn.classList.toggle('active',btn.dataset.setStatus===next));
  }

  function wire(){
    $('vocab-search').addEventListener('input',applyFilters);
    $('vocab-status').addEventListener('change',applyFilters);
    $('vocab-sections').addEventListener('click',event=>{
      const button=event.target.closest('[data-set-status]');
      if(!button)return;
      const card=button.closest('[data-vocab-word]');
      const requested=button.dataset.setStatus;
      const next=card.dataset.vocabStatus===requested?'new':requested;
      setStatus(card.dataset.vocabWord,next);
      refreshWordCard(card,next);
      updateSummary();
      applyFilters();
    });
  }

  renderLanguageHeader();
  renderTopicNav();
  renderSections();
  updateSummary();
  wire();
})();
