(function(){
  const C=window.LanguageCore;
  if(!C)return;
  const {lang}=C.qs();
  const language=C.LANGUAGES[lang];
  const state=C.loadState();
  const currentTopic=state.selectedTopicByLanguage?.[lang]||'basics';
  const primarySeen=item=>lang==='ar'||lang==='ru'?(item.pron||item.transliteration||item.target):item.target;
  const secondarySeen=item=>lang==='ar'||lang==='ru'?item.target:'';
  const esc=text=>String(text??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const statusLabel=status=>status==='known'?'יודע ✓':status==='practice'?'לתרגול':'חדש';

  document.title='מאגר · '+language.name;
  document.getElementById('archive-language-code').textContent=language.code;
  document.getElementById('archive-language-name').textContent=language.name+' · '+language.primaryNote;
  document.getElementById('archive-study-link').href='language-study.html?lang='+lang+'&topic='+currentTopic;
  document.getElementById('archive-language-switch').innerHTML=Object.entries(C.LANGUAGES).map(([code,item])=>`<a class="btn small ${code===lang?'active':''}" href="language-archive.html?lang=${code}">${item.code} · ${item.name}</a>`).join('');

  const topicSelect=document.getElementById('archive-topic');
  Object.entries(C.TOPIC_META).forEach(([id,meta])=>{const option=document.createElement('option');option.value=id;option.textContent=meta.name;topicSelect.appendChild(option);});

  function words(){return C.seenForLanguage(state,lang);}
  function renderSummary(){const all=words();const known=all.filter(w=>state.wordStatus?.[w.id]==='known').length;const practice=all.filter(w=>state.wordStatus?.[w.id]==='practice').length;const mistakes=Object.values(state.mistakes||{}).filter(x=>x.code===lang).length;document.getElementById('archive-summary').textContent=`${all.length} מילים במאגר · ${known} יודע · ${practice} לתרגול · ${mistakes} טעויות שמורות`;}
  function cycleStatus(id){const current=state.wordStatus?.[id]||'new';const next=current==='new'?'practice':current==='practice'?'known':'new';state.wordStatus[id]=next;C.saveState(state);renderWords();renderSummary();}
  function renderWords(){
    const search=document.getElementById('archive-search').value.trim().toLowerCase();
    const status=document.getElementById('archive-status').value;
    const topic=document.getElementById('archive-topic').value;
    const filtered=words().filter(w=>{
      const wordStatus=state.wordStatus?.[w.id]||'new';
      const hay=(primarySeen(w)+' '+secondarySeen(w)+' '+(w.he||'')+' '+(w.category||'')).toLowerCase();
      return (!search||hay.includes(search))&&(status==='all'||wordStatus===status)&&(topic==='all'||w.topic===topic);
    });
    const grid=document.getElementById('archive-grid');
    if(!filtered.length){grid.innerHTML='<p class="meta">אין מילים שמתאימות לסינון הזה.</p>';return;}
    grid.innerHTML=filtered.map(w=>{const s=state.wordStatus?.[w.id]||'new';return `<div class="archive-item"><div class="archive-main"><strong>${esc(primarySeen(w))}</strong>${secondarySeen(w)?`<small>${esc(secondarySeen(w))}</small>`:''}<small>${esc(w.he||'')} · ${esc(w.category||'')}</small></div><button class="btn small status-cycle status-${s}" type="button" data-word="${esc(w.id)}">${statusLabel(s)}</button></div>`;}).join('');
    grid.querySelectorAll('[data-word]').forEach(btn=>btn.addEventListener('click',()=>cycleStatus(btn.dataset.word)));
  }
  function renderMistakes(){
    const root=document.getElementById('archive-mistakes');
    const items=Object.values(state.mistakes||{}).filter(x=>x.code===lang).sort((a,b)=>(b.count||0)-(a.count||0));
    if(!items.length){root.innerHTML='<p class="meta">אין טעויות שמורות בשפה הזאת.</p>';return;}
    root.innerHTML=items.map(m=>`<div class="mistake-card"><div class="mistake-text"><strong>${esc(m.label||m.pron||m.target||'')}</strong>${m.target&&m.target!==(m.label||m.pron)?`<small>${esc(m.target)}</small>`:''}<small>${esc(m.he||'')} · ${esc(m.type||'תרגול')} · ${m.count||1} פעמים</small></div><button class="btn small" type="button" data-clear="${esc(m.key)}">ידעתי ✓</button></div>`).join('');
    root.querySelectorAll('[data-clear]').forEach(btn=>btn.addEventListener('click',()=>{C.clearMistake(state,btn.dataset.clear);renderMistakes();renderSummary();}));
  }
  document.getElementById('archive-search').addEventListener('input',renderWords);
  document.getElementById('archive-status').addEventListener('change',renderWords);
  document.getElementById('archive-topic').addEventListener('change',renderWords);
  document.getElementById('clear-all-mistakes').addEventListener('click',()=>{C.clearMistakesForLanguage(state,lang);renderMistakes();renderSummary();});
  renderSummary();renderWords();renderMistakes();
})();
