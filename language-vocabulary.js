(function(){
  const B=window.LanguageVocabularyBank;
  const createView=window.LanguageVocabularyViewModel;
  if(!B||!createView)return;

  const view=createView(B);
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const params=new URLSearchParams(location.search);
  let lang=B.LANGUAGES[params.get('lang')]?params.get('lang'):'ar';
  let activeTopic=B.TOPICS[params.get('topic')]?params.get('topic'):view.defaultTopic;
  let arabicRegister=params.get('register')==='msa'?'msa':'spoken';
  const SEARCH_RENDER_LIMIT=100;

  const arMap={'ا':'א','أ':'א','إ':'א','آ':'א','ب':'ב','ت':'ת','ث':'ת׳','ج':'ג׳','ح':'ח','خ':'ח׳','د':'ד','ذ':'ד׳','ر':'ר','ز':'ז','س':'ס','ش':'ש','ص':'צ','ض':'ד׳','ط':'ט','ظ':'ז׳','ع':'ע','غ':'ע׳','ف':'פ','ق':'ק','ك':'כ','ل':'ל','م':'מ','ن':'נ','ه':'ה','ة':'ה','و':'ו','ي':'י','ى':'א','ء':'א','ئ':'י','ؤ':'ו'};
  const ruMap={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','ל':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya','л':'l'};
  function transliterateArabic(text){return String(text).split('').map(ch=>arMap[ch]??ch).join('').replace(/\s+/g,' ').trim();}
  function transliterateRussian(text){return String(text).split('').map(ch=>{const low=ch.toLowerCase();const out=ruMap[low];if(out===undefined)return ch;return ch===ch.toUpperCase()&&ch!==low?out.charAt(0).toUpperCase()+out.slice(1):out;}).join('');}

  function arabicTarget(word){
    if(arabicRegister==='msa')return word.ar?.target||'';
    return word.ar?.spoken||word.ar?.target||'';
  }

  function display(word){
    const target=lang==='ar'?arabicTarget(word):(word[lang]?.target||'');
    if(lang==='ar')return{primary:transliterateArabic(target),secondary:target};
    if(lang==='ru')return{primary:transliterateRussian(target),secondary:target};
    return{primary:target,secondary:''};
  }

  function pageHref(code,topic=activeTopic){
    const p=new URLSearchParams({lang:code,topic});
    if(code==='ar')p.set('register',arabicRegister);
    return `language-vocabulary.html?${p.toString()}`;
  }

  function replaceCurrentUrl(){
    history.replaceState(null,'',pageHref(lang,activeTopic));
  }

  function renderArabicRegister(){
    const box=$('vocab-arabic-register');
    if(!box)return;
    box.hidden=lang!=='ar';
    box.querySelectorAll('[data-arabic-register]').forEach(btn=>{
      const active=btn.dataset.arabicRegister===arabicRegister;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function renderHeader(){
    const language=B.LANGUAGES[lang];
    const isArabic=lang==='ar';
    document.body.classList.toggle('arabic-vocabulary',isArabic);
    document.title=`אוצר מילים · ${language.name}`;
    $('vocab-language-code').textContent=language.code;
    const pageTitle=$('vocab-page-title');
    if(pageTitle)pageTitle.innerHTML=isArabic
      ?'<span class="arabic-title-script" lang="ar" dir="rtl">العربية</span><span class="arabic-title-divider"> · </span><span>ערבית</span>'
      :'📚 אוצר מילים';
    $('vocab-language-name').textContent=isArabic
      ?`${language.name} · ${arabicRegister==='spoken'?'מדוברת פלסטינית/לבנטינית':'ספרותית (MSA)'} · תעתיק עברי + כתב ערבי`
      :lang==='ru'?`${language.name} · תעתיק לטיני + קירילית`:language.name;
    $('vocab-language-switch').innerHTML=Object.entries(B.LANGUAGES).map(([code,item])=>`<a class="study-switch ${code===lang?'active':''}" href="${pageHref(code)}">${item.code} · ${item.name}</a>`).join('');
    renderArabicRegister();
  }

  function renderTopicNav(){
    $('vocab-topic-nav').innerHTML=Object.entries(B.TOPICS).map(([id,topic])=>`<button class="vocab-topic-chip ${id===activeTopic?'active':''}" type="button" data-vocab-topic-select="${id}" aria-pressed="${id===activeTopic?'true':'false'}"><span class="vocab-topic-emoji">${topic.icon}</span><span>${esc(topic.name)} · ${topic.words.length}</span></button>`).join('');
  }

  function wordCard(entry,showTopic){
    const d=display(entry.word);
    const audioTarget=lang==='ar'?arabicTarget(entry.word):(entry.word[lang]?.target||'');
    return `<article class="vocab-word" data-vocab-word><div class="language-audio-inline"><div class="vocab-word-primary" data-audio-decorated="1">${esc(d.primary)}</div><button class="language-audio-btn" type="button" data-audio-lang="${esc(lang)}" data-audio-text="${esc(audioTarget)}" aria-label="השמע הגייה" title="השמע הגייה">🔊</button></div>${d.secondary?`<div class="vocab-word-secondary">${esc(d.secondary)}</div>`:''}<div class="vocab-word-hebrew">${esc(entry.word.he)}</div>${showTopic?`<div class="vocab-word-topic">${entry.topic.icon} ${esc(entry.topic.name)}</div>`:''}</article>`;
  }

  function renderEntryList(entries,title,description,countText,showTopic){
    if(!entries.length){
      $('vocab-sections').innerHTML='<div class="card vocab-empty">לא נמצאו מילים שמתאימות לחיפוש.</div>';
      return;
    }
    $('vocab-sections').innerHTML=`<section class="vocab-topic-section"><article class="card vocab-topic-card"><div class="vocab-topic-head"><div class="vocab-topic-title"><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}<div class="vocab-topic-count">${esc(countText)}</div></div></div></div><div class="vocab-word-grid">${entries.map(entry=>wordCard(entry,showTopic)).join('')}</div></article></section>`;
  }

  function renderTopic(topicId){
    const topic=B.TOPICS[topicId];
    if(!topic)return;
    activeTopic=topicId;
    const entries=view.topicEntries(topicId);
    renderEntryList(entries,`${topic.icon} ${topic.name}`,topic.description,`${entries.length} מילים`,false);
    renderTopicNav();
    renderHeader();
  }

  function updateSummary(){
    const topics=Object.values(B.TOPICS);
    const total=topics.reduce((sum,topic)=>sum+topic.words.length,0);
    $('vocab-summary').textContent=`מאגר פתוח · ${topics.length} נושאים · ${total} פריטי אוצר מילים · 100 בכל נושא`;
  }

  function allEntries(){return view.topicIds.flatMap(topicId=>view.topicEntries(topicId));}

  function searchEntries(query){
    const q=query.trim().toLowerCase();
    if(!q)return[];
    const direct=view.search(q);
    const seen=new Set(direct.map(entry=>entry.topicId+'|'+entry.word.id));
    const results=direct.slice();
    allEntries().forEach(entry=>{
      const d=display(entry.word);
      const key=entry.topicId+'|'+entry.word.id;
      if(seen.has(key))return;
      const text=[entry.word.he,d.primary,d.secondary,entry.topic.name,entry.word.ar?.target,entry.word.ar?.spoken].filter(Boolean).join(' ').toLowerCase();
      if(text.includes(q)){seen.add(key);results.push(entry);}
    });
    return results;
  }

  function renderSearchNow(){
    const query=$('vocab-search').value.trim();
    if(!query){renderTopic(activeTopic);return;}
    const results=searchEntries(query);
    const shown=results.slice(0,SEARCH_RENDER_LIMIT);
    const countText=results.length>SEARCH_RENDER_LIMIT?`${results.length} תוצאות · מוצגות ${SEARCH_RENDER_LIMIT} הראשונות`:`${results.length} תוצאות`;
    renderEntryList(shown,`🔎 ${query}`,'חיפוש בכל נושאי המאגר',countText,true);
    renderHeader();
  }

  let searchTimer=0;
  function applySearch(){
    clearTimeout(searchTimer);
    searchTimer=setTimeout(renderSearchNow,80);
  }

  $('vocab-topic-nav').addEventListener('click',event=>{
    const button=event.target.closest('[data-vocab-topic-select]');
    if(!button)return;
    $('vocab-search').value='';
    renderTopic(button.dataset.vocabTopicSelect);
    replaceCurrentUrl();
  });
  $('vocab-search').addEventListener('input',applySearch);
  $('vocab-arabic-register')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-arabic-register]');
    if(!button)return;
    const next=button.dataset.arabicRegister==='msa'?'msa':'spoken';
    if(next===arabicRegister)return;
    arabicRegister=next;
    renderSearchNow();
    replaceCurrentUrl();
  });

  updateSummary();
  renderTopic(activeTopic);
})();
