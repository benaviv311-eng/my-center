function filterVolleyballFeed(cards,{topic='all',population='all',level='all',query=''}={}){
  const q=String(query||'').trim().toLowerCase();
  return cards.filter(card=>{
    const topicOk=topic==='all'||card.topic===topic||card.topic==='all';
    const popOk=population==='all'||card.populations.includes('all')||card.populations.includes(population);
    const levelOk=level==='all'||card.levels.includes('all')||card.levels.includes(level);
    const hay=[card.title,card.text,card.detail,...(card.tags||[])].join(' ').toLowerCase();
    return topicOk&&popOk&&levelOk&&(!q||hay.includes(q));
  });
}
function hashSeed(seed){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function pickDiscovery(cards,kind='all',seed=Date.now()){
  const pool=kind==='all'?cards:cards.filter(card=>card.kind===kind);
  if(!pool.length)return null;
  return pool[hashSeed(seed)%pool.length];
}
function labelFor(items,id){return (items.find(x=>x.id===id)||{}).label||id;}
function renderCard(card){
  const kindLabels={concept:'עיקרון',drill:'תרגיל',scenario:'סיטואציה',research:'מחקר ומדע',myth:'מיתוס',question:'שאלה','problem-solution':'בעיה → פתרון'};
  const pops=card.populations.includes('all')?'כל האוכלוסיות':card.populations.map(id=>labelFor(window.VOLLEYBALL_POPULATIONS,id)).join(' · ');
  const tags=(card.tags||[]).map(tag=>`<span>${tag}</span>`).join('');
  return `<article class="vb-feed-card vb-kind-${card.kind}"><div class="vb-card-top"><span class="vb-kind">${kindLabels[card.kind]||card.kind}</span><span class="vb-pop">${pops}</span></div><h3>${card.title}</h3><p>${card.text}</p><details><summary>להעמיק</summary><p>${card.detail}</p></details><div class="vb-tags">${tags}</div></article>`;
}
function initVolleyballHub(){
  if(typeof document==='undefined'||!window.VOLLEYBALL_TOPICS)return;
  const topicMap=document.getElementById('volleyball-topic-map');
  const populations=document.getElementById('volleyball-populations');
  const topicFilter=document.getElementById('volleyball-topic-filter');
  const populationFilter=document.getElementById('volleyball-population-filter');
  const levelFilter=document.getElementById('volleyball-level-filter');
  const search=document.getElementById('volleyball-search');
  const feed=document.getElementById('volleyball-feed');
  const count=document.getElementById('volleyball-feed-count');
  const discovery=document.getElementById('volleyball-discovery-result');

  topicMap.innerHTML=window.VOLLEYBALL_TOPICS.map(t=>`<button class="vb-topic" data-topic="${t.id}"><span>${t.icon}</span><b>${t.label}</b></button>`).join('');
  populations.innerHTML=window.VOLLEYBALL_POPULATIONS.map(p=>`<button class="vb-population" data-population="${p.id}"><span class="vb-pop-icon">${p.icon}</span><b>${p.label}</b><small>${p.summary}</small>${p.subgroups?`<em>${p.subgroups.join(' · ')}</em>`:''}</button>`).join('');
  topicFilter.innerHTML='<option value="all">כל התחומים</option>'+window.VOLLEYBALL_TOPICS.map(t=>`<option value="${t.id}">${t.label}</option>`).join('');
  populationFilter.innerHTML='<option value="all">כל האוכלוסיות</option>'+window.VOLLEYBALL_POPULATIONS.map(p=>`<option value="${p.id}">${p.label}</option>`).join('');
  levelFilter.innerHTML='<option value="all">כל הרמות</option>'+window.VOLLEYBALL_LEVELS.map(l=>`<option value="${l.id}">${l.label}</option>`).join('');

  function render(){
    const cards=filterVolleyballFeed(window.VOLLEYBALL_FEED_CARDS,{topic:topicFilter.value,population:populationFilter.value,level:levelFilter.value,query:search.value});
    feed.innerHTML=cards.map(renderCard).join('')||'<div class="vb-empty">לא נמצאו כרטיסים לשילוב שבחרת.</div>';
    count.textContent=`${cards.length} פריטי ידע`;
  }
  [topicFilter,populationFilter,levelFilter,search].forEach(el=>el.addEventListener(el===search?'input':'change',render));
  topicMap.addEventListener('click',e=>{const btn=e.target.closest('[data-topic]');if(!btn)return;topicFilter.value=btn.dataset.topic;render();document.getElementById('volleyball-feed-section').scrollIntoView({behavior:'smooth'});});
  populations.addEventListener('click',e=>{const btn=e.target.closest('[data-population]');if(!btn)return;populationFilter.value=btn.dataset.population;render();document.getElementById('volleyball-feed-section').scrollIntoView({behavior:'smooth'});});
  document.getElementById('volleyball-discovery').addEventListener('click',e=>{const btn=e.target.closest('[data-kind]');if(!btn)return;const card=pickDiscovery(window.VOLLEYBALL_FEED_CARDS,btn.dataset.kind,`${Date.now()}|${btn.dataset.kind}`);discovery.innerHTML=card?renderCard(card):'';});
  render();
}
if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',initVolleyballHub);}
if(typeof module!=='undefined'&&module.exports){module.exports={filterVolleyballFeed,pickDiscovery,hashSeed};}
if(typeof window!=='undefined'){Object.assign(window,{filterVolleyballFeed,pickDiscovery,initVolleyballHub});}
