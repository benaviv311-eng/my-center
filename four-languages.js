(function(){
  const C=window.LanguageCore;
  if(!C)return;

  const LANGS=['ar','it','ru','es'];
  const STORAGE_KEY='my-center-four-languages-v1';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {mode:raw.mode==='sentence'?'sentence':'word',topic:C.validTopic(raw.topic||'verbs'),index:Number(raw.index)||0,saved:raw.saved||{}};
    }catch(e){return {mode:'word',topic:'verbs',index:0,saved:{}};}
  }
  const state=load();

  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function course(lang){return C.course(lang,state.topic);}
  function currentWord(lang){const words=course(lang).words;return words[state.index%words.length];}
  function currentSentence(lang){const sentences=course(lang).sentences;return sentences[state.index%sentences.length];}
  function currentKey(){
    const item=state.mode==='word'?currentWord('ar'):currentSentence('ar');
    return `${state.mode}:${state.topic}:${item.id}`;
  }
  function display(lang,item){return {primary:C.primary(lang,item),secondary:C.secondary(lang,item)};}
  function audioButton(lang,item){
    if(!item?.target)return'';
    return `<button class="language-audio-btn" type="button" data-audio-lang="${esc(lang)}" data-audio-text="${esc(item.target)}" aria-label="השמע הגייה" title="השמע הגייה">🔊</button>`;
  }

  function renderTopics(){
    $('four-topic').innerHTML=Object.entries(C.TOPIC_META).map(([id,meta])=>`<option value="${id}" ${id===state.topic?'selected':''}>${meta.icon} ${esc(meta.name)}</option>`).join('');
  }

  function wordCard(lang){
    const word=currentWord(lang);
    const d=display(lang,word);
    const example=currentSentence(lang);
    const ed=display(lang,example);
    const info=C.LANGUAGES[lang];
    return `<article class="four-card">
      <div class="four-card-head"><div><strong>${info.name}</strong><div class="meta">${esc(info.primaryNote)}${info.secondaryNote?' · '+esc(info.secondaryNote)+' משני':''}</div></div><span class="four-code">${info.code}</span></div>
      <div class="language-audio-inline"><div class="four-primary" data-audio-decorated="1">${esc(d.primary)}</div>${audioButton(lang,word)}</div>
      ${d.secondary?`<div class="four-secondary">${esc(d.secondary)}</div>`:''}
      <div class="four-example"><span>משפט לדוגמה</span><span class="language-audio-inline"><strong data-audio-decorated="1">${esc(ed.primary)}</strong>${audioButton(lang,example)}</span>${ed.secondary?`<span>${esc(ed.secondary)}</span>`:''}<span>${esc(example.he)}</span></div>
    </article>`;
  }

  function sentenceCard(lang){
    const sentence=currentSentence(lang);
    const d=display(lang,sentence);
    const info=C.LANGUAGES[lang];
    return `<article class="four-card">
      <div class="four-card-head"><div><strong>${info.name}</strong><div class="meta">${esc(info.primaryNote)}${info.secondaryNote?' · '+esc(info.secondaryNote)+' משני':''}</div></div><span class="four-code">${info.code}</span></div>
      <div class="language-audio-inline"><div class="four-primary" data-audio-decorated="1">${esc(d.primary)}</div>${audioButton(lang,sentence)}</div>
      ${d.secondary?`<div class="four-secondary">${esc(d.secondary)}</div>`:''}
      ${sentence.situation?`<div class="four-example"><span>מתי משתמשים?</span><strong>${esc(sentence.situation)}</strong></div>`:''}
    </article>`;
  }

  function updateSaveButton(){
    const saved=!!state.saved[currentKey()];
    $('four-save').textContent=saved?'♥ נשמר':'♡ שמור';
    $('four-save').classList.toggle('study-primary',saved);
  }

  function render(){
    state.topic=C.validTopic(state.topic);
    const meta=C.TOPIC_META[state.topic];
    const arItem=state.mode==='word'?currentWord('ar'):currentSentence('ar');
    $('four-focus-label').textContent=state.mode==='word'?'המילה בעברית':'המשפט בעברית';
    $('four-hebrew').textContent=arItem.he;
    $('four-topic-label').textContent=`${meta.icon} ${meta.name}`;
    $('four-grid').innerHTML=LANGS.map(lang=>state.mode==='word'?wordCard(lang):sentenceCard(lang)).join('');
    $('four-mode-word').classList.toggle('active',state.mode==='word');
    $('four-mode-word').setAttribute('aria-pressed',state.mode==='word'?'true':'false');
    $('four-mode-sentence').classList.toggle('active',state.mode==='sentence');
    $('four-mode-sentence').setAttribute('aria-pressed',state.mode==='sentence'?'true':'false');
    $('four-refresh').textContent=state.mode==='word'?'↻ מילה אחרת':'↻ משפט אחר';
    updateSaveButton();
    save();
  }

  $('four-mode-word').addEventListener('click',()=>{state.mode='word';state.index=0;render();});
  $('four-mode-sentence').addEventListener('click',()=>{state.mode='sentence';state.index=0;render();});
  $('four-topic').addEventListener('change',()=>{state.topic=C.validTopic($('four-topic').value);state.index=0;render();});
  $('four-refresh').addEventListener('click',()=>{state.index++;render();$('four-note').textContent=state.mode==='word'?'מילה חדשה ✨':'משפט חדש ✨';});
  $('four-save').addEventListener('click',()=>{
    const key=currentKey();
    if(state.saved[key])delete state.saved[key];
    else state.saved[key]={topic:state.topic,mode:state.mode,savedAt:new Date().toISOString()};
    save();updateSaveButton();$('four-note').textContent=state.saved[key]?'נשמר למועדפים':'הוסר מהמועדפים';
  });

  renderTopics();
  render();
})();
