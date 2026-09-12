function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function statusMeta(status){
  const map = {
    canon:{label:'✅ קאנון', className:'canon'},
    developing:{label:'📝 בפיתוח', className:'developing'},
    idea:{label:'💡 הצעה', className:'idea'},
    parked:{label:'🗄️ בצד', className:'parked'}
  };
  return map[status] || map.idea;
}

function characterName(id){
  const data = typeof window !== 'undefined' ? window.RAIKA_DATA : null;
  return data?.characters?.find(c => c.id === id)?.title || id;
}

function searchableText(item){
  return [
    item.title,item.summary,item.role,item.thinking,item.placement,item.why,item.opens,
    ...(item.tags||[]),...(item.characters||[]),...(item.traits||[]),...(item.wants||[]),
    ...(item.fears||[]),...(item.beliefs||[]),...(item.contradictions||[])
  ].join(' ').toLowerCase();
}

function filterItems(items, query='', status='all', type='all'){
  const q = String(query).trim().toLowerCase();
  return items.filter(item => {
    const haystack = searchableText(item);
    return (!q || haystack.includes(q)) &&
      (status === 'all' || item.status === status) &&
      (type === 'all' || item.type === type);
  });
}

function tagsHtml(tags=[]){
  if(!tags.length) return '';
  return `<div class="pill-row raika-tags">${tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`;
}

function charactersHtml(ids=[]){
  if(!ids.length) return '';
  return `<div class="raika-links"><b>דמויות:</b> ${ids.map(id=>`<a href="#characters" data-character-link="${esc(id)}">${esc(characterName(id))}</a>`).join(' · ')}</div>`;
}

function detailsList(title, values){
  if(!values || (Array.isArray(values) && !values.length)) return '';
  const arr = Array.isArray(values) ? values : [values];
  return `<details><summary>${esc(title)}</summary><ul class="list">${arr.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></details>`;
}

function itemCardHtml(item){
  const meta = statusMeta(item.status);
  const extra = [
    item.role ? `<div class="meta">${esc(item.role)}</div>` : '',
    charactersHtml(item.characters),
    item.placement ? `<details><summary>מיקום מוצע בסיפור</summary><p>${esc(item.placement)}</p></details>` : '',
    item.why ? `<details><summary>למה זה מתאים?</summary><p>${esc(item.why)}</p></details>` : '',
    item.opens ? `<details><summary>מה זה יכול לפתוח?</summary><p>${esc(item.opens)}</p></details>` : '',
    detailsList('רצונות', item.wants),
    detailsList('פחדים', item.fears),
    detailsList('אמונות וערכים', item.beliefs),
    detailsList('סתירות פנימיות', item.contradictions),
    item.thinking ? `<details><summary>צורת חשיבה</summary><p>${esc(item.thinking)}</p></details>` : ''
  ].join('');
  const openLink = item.feedPage ? `<div class="card-actions"><a class="btn small" href="${esc(item.feedPage)}">פתח עמוד ←</a></div>` : '';
  return `<article class="card writer-card status-${meta.className}" data-status="${esc(item.status)}">
    <div class="writer-card-head"><span class="status-badge status-${meta.className}">${meta.label}</span>${item.order ? `<span class="scene-number">${esc(item.order)}</span>`:''}</div>
    <h3>${esc(item.title)}</h3>
    ${item.summary ? `<p class="meta writer-summary">${esc(item.summary)}</p>`:''}
    ${extra}
    ${tagsHtml(item.tags)}
    ${openLink}
  </article>`;
}

function sceneTextHtml(item){
  return esc(item.fullText || item.summary || 'טקסט הסצנה יתווסף בהמשך').replace(/\n/g,'<br>');
}

function sceneDetailHtml(item){
  const meta = statusMeta(item.status);
  const imageHtml = item.image
    ? `<img class="scene-detail-image" src="${esc(item.image)}" alt="${esc(item.title)}" style="display:block;width:100%;height:auto;border-radius:16px;border:1px solid var(--line,#e8dfcf)">`
    : `<div class="scene-detail-image-placeholder" style="min-height:220px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px dashed #cbbfdc;border-radius:16px;background:#f7f2fc;color:#786d88;font-weight:700">נעלה בהמשך</div>`;
  return `<div class="scene-detail-dialog" role="dialog" aria-modal="true" aria-label="${esc(item.title)}" style="position:relative;width:min(760px,100%);max-height:90vh;overflow:auto;background:var(--card,#fffdf8);border:1px solid var(--line,#e8dfcf);border-radius:22px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.22)">
    <button class="scene-detail-close" type="button" aria-label="סגירת סצנה" style="position:absolute;left:14px;top:12px;border:1px solid var(--line,#e8dfcf);background:var(--card,#fffdf8);border-radius:999px;width:36px;height:36px;font-size:24px;cursor:pointer">×</button>
    <div class="writer-card-head"><span class="status-badge status-${meta.className}">${meta.label}</span>${item.order ? `<span class="scene-number">סצנה ${esc(item.order)}</span>`:''}</div>
    <h2>${esc(item.title)}</h2>
    <div class="scene-detail-text" style="margin:16px 0;line-height:1.9;font-size:16px;white-space:normal">${sceneTextHtml(item)}</div>
    <div class="scene-detail-media" style="margin-top:18px">${imageHtml}</div>
  </div>`;
}

function sceneCardHtml(item){
  return `<div class="scene-entry" data-scene-id="${esc(item.id)}" role="button" tabindex="0" aria-label="פתיחת סצנה מלאה: ${esc(item.title)}" style="cursor:pointer"><div class="scene-line"></div>${itemCardHtml(item)}</div>`;
}

function openSceneDetail(item){
  document.getElementById('scene-detail-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'scene-detail-modal';
  modal.className = 'scene-detail-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(31,31,31,.58);display:flex;align-items:center;justify-content:center;padding:18px';
  modal.innerHTML = sceneDetailHtml(item);
  document.body.appendChild(modal);
  document.body.classList.add('scene-detail-open');
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const close = () => {
    document.body.classList.remove('scene-detail-open');
    document.body.style.overflow=previousOverflow;
    modal.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = event => { if(event.key === 'Escape') close(); };
  modal.querySelector('.scene-detail-close')?.addEventListener('click', close);
  modal.addEventListener('click', event => { if(event.target === modal) close(); });
  document.addEventListener('keydown', onKey);
  modal.querySelector('.scene-detail-close')?.focus();
}

function renderCollection(containerId, items, cardFn=itemCardHtml, emptyText='לא נמצאו פריטים'){
  const el = document.getElementById(containerId);
  if(!el) return;
  const state = getFilterState();
  const filtered = filterItems(items,state.query,state.status,state.type);
  el.innerHTML = filtered.length ? filtered.map(cardFn).join('') : `<div class="card meta">${emptyText}</div>`;
}

function getFilterState(){
  const query = document.getElementById('raika-search')?.value || '';
  const status = document.getElementById('raika-status-filter')?.value || 'all';
  const type = document.getElementById('raika-type-filter')?.value || 'all';
  return {query,status,type};
}

function currentRaikaSectionId(sections, scrollY=0, offset=0){
  if(!sections?.length) return '';
  const threshold = Number(scrollY || 0) + Number(offset || 0);
  let current = sections[0].id;
  for(const section of sections){
    if(Number(section.top || 0) <= threshold) current = section.id;
    else break;
  }
  return current;
}

function renderCharacters(data){ renderCollection('characters-grid',data.characters); }
function renderScenes(data){ renderCollection('scenes-grid',[...data.scenes].sort((a,b)=>(a.order||999)-(b.order||999)),sceneCardHtml); }
function renderPlotlines(data){ renderCollection('plotlines-grid',data.plotlines); }
function renderHistory(data){ renderCollection('history-grid',data.history); }
function renderWorld(data){ renderCollection('world-grid',data.world); }
function renderRelationships(data){ renderCollection('relationships-grid',data.relationships); }
function renderIdeas(data){ renderCollection('ideas-grid',data.ideas); }

function renderStats(data){
  const el=document.getElementById('raika-stats');
  if(!el) return;
  const canonScenes=data.scenes.filter(x=>x.status==='canon').length;
  const ideas=data.ideas.filter(x=>x.status==='idea'||x.status==='developing').length;
  el.innerHTML=`<span>🎬 ${canonScenes} סצנות קאנון</span><span>👥 ${data.characters.length} דמויות</span><span>🧭 ${data.plotlines.length} קווי עלילה</span><span>💡 ${ideas} רעיונות בחדר הכותבים</span>`;
}

function renderAll(){
  const data=window.RAIKA_DATA;
  if(!data) return;
  renderCharacters(data);renderScenes(data);renderPlotlines(data);renderHistory(data);renderWorld(data);renderRelationships(data);renderIdeas(data);renderStats(data);
}

function initRaikaSectionNav(){
  const ids=['characters','scenes','plotlines','history','world','relationships','writers-room'];
  const links=[...document.querySelectorAll('.raika-section-nav a[href^="#"]')];
  if(!links.length) return;

  const update=()=>{
    const sections=ids.map(id=>document.getElementById(id)).filter(Boolean).map(el=>({id:el.id,top:el.offsetTop}));
    const stickyHeight=document.querySelector('.raika-sticky-tools')?.offsetHeight || 0;
    const activeId=currentRaikaSectionId(sections,window.scrollY,stickyHeight+24);
    links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${activeId}`));
  };

  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  update();
}

function initRaikaWritersRoom(){
  ['raika-search','raika-status-filter','raika-type-filter'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.addEventListener(el.tagName==='INPUT'?'input':'change',renderAll);
  });
  document.getElementById('clear-raika-filters')?.addEventListener('click',()=>{
    const search=document.getElementById('raika-search');
    const status=document.getElementById('raika-status-filter');
    const type=document.getElementById('raika-type-filter');
    if(search) search.value=''; if(status) status.value='all'; if(type) type.value='all';
    renderAll();
  });
  const scenesGrid=document.getElementById('scenes-grid');
  const openFromTarget=event=>{
    if(event.target.closest('a,button')) return;
    const entry=event.target.closest('[data-scene-id]');
    if(!entry) return;
    const item=window.RAIKA_DATA?.scenes?.find(scene=>scene.id===entry.dataset.sceneId);
    if(item) openSceneDetail(item);
  };
  scenesGrid?.addEventListener('click',openFromTarget);
  scenesGrid?.addEventListener('keydown',event=>{
    if(event.key!=='Enter' && event.key!==' ') return;
    event.preventDefault();
    openFromTarget(event);
  });
  renderAll();
  initRaikaSectionNav();
}

if(typeof document !== 'undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initRaikaWritersRoom);
  else initRaikaWritersRoom();
}

if(typeof module !== 'undefined') module.exports={statusMeta,filterItems,itemCardHtml,sceneCardHtml,sceneDetailHtml,currentRaikaSectionId};
