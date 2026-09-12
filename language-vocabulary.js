(function(){
  const B=window.LanguageVocabularyBank;
  if(!B)return;

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const params=new URLSearchParams(location.search);
  let lang=B.LANGUAGES[params.get('lang')]?params.get('lang'):'ar';

  const arMap={'ا':'א','أ':'א','إ':'א','آ':'א','ب':'ב','ت':'ת','ث':'ת׳','ج':'ג׳','ح':'ח','خ':'ח׳','د':'ד','ذ':'ד׳','ر':'ר','ز':'ז','س':'ס','ش':'ש','ص':'צ','ض':'ד׳','ط':'ט','ظ':'ז׳','ع':'ע','غ':'ע׳','ف':'פ','ق':'ק','ك':'כ','ل':'ל','م':'מ','ن':'נ','ه':'ה','ة':'ה','و':'ו','ي':'י','ى':'א','ء':'א','ئ':'י','ؤ':'ו'};
  const ruMap={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  function transliterateArabic(text){return String(text).split('').map(ch=>arMap[ch]??ch).join('').replace(/\s+/g,' ').trim();}
  function transliterateRussian(text){return String(text).split('').map(ch=>{const low=ch.toLowerCase();const out=ruMap[low];if(out===undefined)return ch;return ch===ch.toUpperCase()&&ch!==low?out.charAt(0).toUpperCase()+out.slice(1):out;}).join('');}

  function display(word){
    const target=word[lang]?.target||'';
    if(lang==='ar')return{primary:transliterateArabic(target),secondary:target};
    if(lang==='ru')return{primary:transliterateRussian(target),secondary:target};
    return{primary:target,secondary:''};
  }

  function renderHeader(){
    const language=B.LANGUAGES[lang];
    document.title=`אוצר מילים · ${language.name}`;
    $('vocab-language-code').textContent=language.code;
    $('vocab-language-name').textContent=lang==='ar'?`${language.name} · תעתיק עברי + כתב ערבי`:lang==='ru'?`${language.name} · תעתיק לטיני + קירילית`:language.name;
    $('vocab-language-switch').innerHTML=Object.entries(B.LANGUAGES).map(([code,item])=>`<a class="study-switch ${code===lang?'active':''}" href="language-vocabulary.html?lang=${code}">${item.code} · ${item.name}</a>`).join('');
  }

  function renderTopicNav(){
    $('vocab-topic-nav').innerHTML=Object.entries(B.TOPICS).map(([id,topic])=>`<a class="vocab-topic-chip" href="#vocab-topic-${id}">${topic.icon} ${esc(topic.name)} · ${topic.words.length}</a>`).join('');
  }

  function wordCard(word,topic){
    const d=display(word);
    const search=[word.he,d.primary,d.secondary,topic.name].join(' ').toLowerCase();
    return `<article class="vocab-word" data-vocab-word data-vocab-search="${esc(search)}"><div class="vocab-word-primary">${esc(d.primary)}</div>${d.secondary?`<div class="vocab-word-secondary">${esc(d.secondary)}</div>`:''}<div class="vocab-word-hebrew">${esc(word.he)}</div></article>`;
  }

  function renderSections(){
    $('vocab-sections').innerHTML=Object.entries(B.TOPICS).map(([id,topic])=>`<section id="vocab-topic-${id}" class="vocab-topic-section" data-vocab-topic><article class="card vocab-topic-card"><div class="vocab-topic-head"><div class="vocab-topic-title"><span class="vocab-topic-icon">${topic.icon}</span><div><h2>${esc(topic.name)}</h2><p>${esc(topic.description)}</p><div class="vocab-topic-count" data-topic-count>${topic.words.length} מילים</div></div></div></div><div class="vocab-word-grid">${topic.words.map(word=>wordCard(word,topic)).join('')}</div></article></section>`).join('');
  }

  function updateSummary(){
    const topics=Object.values(B.TOPICS);
    const total=topics.reduce((sum,topic)=>sum+topic.words.length,0);
    $('vocab-summary').textContent=`מאגר פתוח · ${topics.length} נושאים · ${total} פריטי אוצר מילים · 100 בכל נושא`;
  }

  function applyFilters(){
    const query=$('vocab-search').value.trim().toLowerCase();
    let visibleTotal=0;
    document.querySelectorAll('[data-vocab-topic]').forEach(section=>{
      let visible=0;
      section.querySelectorAll('[data-vocab-word]').forEach(card=>{
        const show=!query||card.dataset.vocabSearch.includes(query);
        card.classList.toggle('vocab-hidden',!show);
        if(show){visible++;visibleTotal++;}
      });
      section.classList.toggle('vocab-hidden',visible===0);
      const count=section.querySelector('[data-topic-count]');
      if(count)count.textContent=query?`${visible} תוצאות`:`${section.querySelectorAll('[data-vocab-word]').length} מילים`;
    });
    let empty=$('vocab-sections').querySelector('.vocab-empty');
    if(!visibleTotal){if(!empty){empty=document.createElement('div');empty.className='card vocab-empty';empty.textContent='לא נמצאו מילים שמתאימות לחיפוש.';$('vocab-sections').appendChild(empty);}}else empty?.remove();
  }

  renderHeader();
  renderTopicNav();
  renderSections();
  updateSummary();
  $('vocab-search').addEventListener('input',applyFilters);
})();
