(function(){
  const C=window.LanguageCore;
  if(!C)return;
  const {lang}=C.qs();
  const language=C.LANGUAGES[lang];
  const state=C.loadState();
  const current=state.selectedTopicByLanguage?.[lang]||'basics';
  document.title='נושאים · '+language.name;
  document.getElementById('topics-language-code').textContent=language.code;
  document.getElementById('topics-language-name').textContent=language.name+' · '+language.primaryNote;
  const grid=document.getElementById('topics-grid');
  grid.innerHTML=Object.entries(C.TOPIC_META).map(([id,meta])=>{
    const seen=C.seenForLanguage(state,lang).filter(w=>w.topic===id).length;
    return `<article class="card topic-card ${id===current?'active':''}">
      <div class="topic-icon">${meta.icon}</div>
      <h2>${meta.name}</h2>
      <p class="meta">${meta.description}</p>
      <div class="language-progress-line"><span>${seen} מילים כבר נלמדו</span>${id===current?'<span>נושא נוכחי</span>':''}</div>
      <a class="btn ${id===current?'study-primary':''}" href="language-study.html?lang=${lang}&topic=${id}">ללמוד את הנושא ←</a>
    </article>`;
  }).join('');
})();
