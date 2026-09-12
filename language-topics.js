(function(){
  const C=window.LanguageCore;
  if(!C)return;
  const {lang}=C.qs();
  const language=C.LANGUAGES[lang];
  const state=C.loadState();
  const current=state.selectedTopicByLanguage?.[lang]||'basics';
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  document.title='נושאים · '+language.name;
  document.getElementById('topics-language-code').textContent=language.code;
  document.getElementById('topics-language-name').textContent=language.name+' · '+language.primaryNote;
  const grid=document.getElementById('topics-grid');

  function vocabularyHtml(id){
    const course=C.course(lang,id);
    return `<details class="topic-vocab">
      <summary>📚 אוצר מילים · ${course.words.length} מילים</summary>
      <div class="topic-vocab-grid">${course.words.map(word=>{
        const primary=C.primary(lang,word);
        const secondary=C.secondary(lang,word);
        return `<div class="topic-vocab-item"><strong>${esc(primary)}</strong>${secondary?`<small>${esc(secondary)}</small>`:''}<span>${esc(word.he)}</span></div>`;
      }).join('')}</div>
    </details>`;
  }

  grid.innerHTML=Object.entries(C.TOPIC_META).map(([id,meta])=>{
    const seen=C.seenForLanguage(state,lang).filter(w=>w.topic===id).length;
    return `<article class="card topic-card ${id===current?'active':''}">
      <div class="topic-icon">${meta.icon}</div>
      <h2>${esc(meta.name)}</h2>
      <p class="meta">${esc(meta.description)}</p>
      <div class="language-progress-line"><span>${seen} מילים כבר נלמדו</span>${id===current?'<span>נושא נוכחי</span>':''}</div>
      ${vocabularyHtml(id)}
      <a class="btn ${id===current?'study-primary':''}" href="language-study.html?lang=${lang}&topic=${id}">ללמוד את הנושא ←</a>
    </article>`;
  }).join('');
})();
