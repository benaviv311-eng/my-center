const VOLLEYBALL_VISUALS={
  elementary:{imageUrl:'https://images.pexels.com/photos/15149190/pexels-photo-15149190.jpeg',creditUrl:'https://www.pexels.com/photo/students-practicing-with-volleyball-balls-15149190/',credit:'Pexels',alt:'ילדים מתרגלים עם כדורי כדורעף באולם'},
  'youth-boys':{imageUrl:'https://images.pexels.com/photos/32681163/pexels-photo-32681163.jpeg',creditUrl:'https://www.pexels.com/photo/indoor-volleyball-player-spiking-ball-midair-32681163/',credit:'Pexels',alt:'שחקן כדורעף צעיר קופץ להנחתה באולם'},
  'youth-girls':{imageUrl:'https://images.pexels.com/photos/17557540/pexels-photo-17557540.jpeg',creditUrl:'https://www.pexels.com/photo/teenager-girls-standing-at-an-indoor-volleyball-court-17557540/',credit:'Pexels',alt:'שחקניות כדורעף צעירות במגרש כדורעף באולם'},
  women:{imageUrl:'https://images.pexels.com/photos/30446999/pexels-photo-30446999.jpeg',creditUrl:'https://www.pexels.com/photo/female-volleyball-player-in-indoor-gym-holding-ball-30446999/',credit:'Pexels',alt:'שחקנית כדורעף באולם מחזיקה כדור לפני משחק'},
  men:{imageUrl:'https://images.pexels.com/photos/6203671/pexels-photo-6203671.jpeg',creditUrl:'https://www.pexels.com/photo/photograph-of-a-man-serving-a-volleyball-6203671/',credit:'Pexels',alt:'שחקן כדורעף גברים מגיש בכדורעף באולם'}
};

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

function hashSeed(seed){
  let h=2166136261;
  for(const ch of String(seed)){
    h^=ch.charCodeAt(0);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function seededShuffle(items,seed){
  const arr=items.slice();
  let state=hashSeed(seed)||1;
  const random=()=>{
    state^=state<<13;
    state^=state>>>17;
    state^=state<<5;
    return (state>>>0)/4294967296;
  };
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function buildInfiniteBatch(cards,filters={},seed='volleyball',page=0,size=8){
  const population=filters.population||'all';
  const query=filters.query||'';
  const pool=filterVolleyballFeed(cards,{population,query});
  if(!pool.length)return [];
  const safeSize=Math.max(1,Math.min(Number(size)||8,pool.length));
  const offset=page*safeSize;
  const cycle=Math.floor(offset/pool.length);
  const start=offset%pool.length;
  const shuffled=seededShuffle(pool,`${seed}|${population}|${query}|${cycle}`);
  const batch=[];
  for(let i=0;i<safeSize;i++) batch.push(shuffled[(start+i)%pool.length]);
  return batch;
}

function pickDiscovery(cards,kind='all',seed=Date.now()){
  const pool=kind==='all'?cards:cards.filter(card=>card.kind===kind);
  if(!pool.length)return null;
  return pool[hashSeed(seed)%pool.length];
}

function getPopulationTopics(topics){
  return topics.slice();
}

function labelFor(items,id){
  return (items.find(x=>x.id===id)||{}).label||id;
}

function renderCard(card){
  const kindLabels={concept:'עיקרון',drill:'תרגיל',scenario:'סיטואציה',research:'מחקר ומדע',myth:'מיתוס',question:'שאלה','problem-solution':'בעיה → פתרון'};
  const populations=typeof window!=='undefined'?window.VOLLEYBALL_POPULATIONS:[];
  const pops=card.populations.includes('all')?'כל האוכלוסיות':card.populations.map(id=>labelFor(populations,id)).join(' · ');
  const tags=(card.tags||[]).map(tag=>`<span>${tag}</span>`).join('');
  return `<article class="vb-feed-card vb-kind-${card.kind}"><div class="vb-card-top"><span class="vb-kind">${kindLabels[card.kind]||card.kind}</span><span class="vb-pop">${pops}</span></div><h3>${card.title}</h3><p>${card.text}</p><details><summary>להעמיק</summary><p>${card.detail}</p></details><div class="vb-tags">${tags}</div></article>`;
}

function initVolleyballHub(){
  if(typeof document==='undefined'||!window.VOLLEYBALL_TOPICS)return;

  const tabs=document.getElementById('volleyball-population-tabs');
  const visual=document.getElementById('volleyball-population-visual');
  const worldTitle=document.getElementById('volleyball-population-title');
  const worldSummary=document.getElementById('volleyball-population-summary');
  const topicPanel=document.getElementById('volleyball-population-topics');
  const search=document.getElementById('volleyball-search');
  const feed=document.getElementById('volleyball-feed');
  const count=document.getElementById('volleyball-feed-count');
  const sentinel=document.getElementById('volleyball-feed-sentinel');
  const discovery=document.getElementById('volleyball-discovery-result');
  const discoveryShell=document.getElementById('volleyball-discovery');

  let population='all';
  let page=0;
  let rendered=0;
  let loading=false;
  const feedSeed=new Date().toISOString().slice(0,10);

  const populationOptions=[{id:'all',label:'הכול',icon:'🏐'},...window.VOLLEYBALL_POPULATIONS];
  tabs.innerHTML=populationOptions.map((p,index)=>`<button class="vb-pop-tab${index===0?' active':''}" type="button" data-population="${p.id}" aria-pressed="${index===0?'true':'false'}"><span>${p.icon||'🏐'}</span>${p.label}</button>`).join('');

  function renderAllVisuals(){
    const chosen=['women','men','youth-girls'];
    visual.innerHTML=`<div class="vb-player-collage">${chosen.map(id=>{const v=VOLLEYBALL_VISUALS[id];return `<a href="${v.creditUrl}" target="_blank" rel="noopener" class="vb-player-shot"><img src="${v.imageUrl}" alt="${v.alt}" loading="lazy"><span>${v.credit}</span></a>`;}).join('')}</div>`;
    worldTitle.textContent='כל עולם הכדורעף';
    worldSummary.textContent='פיד אחד שמחבר גברים, נשים, נוער ויסודי עם טכניקה, טקטיקה, מדע, פיזיולוגיה, תרגילים, ניתוח משחק, מחקר ועוד.';
  }

  function renderPopulationWorld(){
    const selected=window.VOLLEYBALL_POPULATIONS.find(item=>item.id===population);
    if(!selected){
      renderAllVisuals();
    }else{
      const v=VOLLEYBALL_VISUALS[selected.id];
      visual.innerHTML=`<a href="${v.creditUrl}" target="_blank" rel="noopener" class="vb-player-shot vb-player-shot-single"><img src="${v.imageUrl}" alt="${v.alt}" loading="lazy"><span>צילום: ${v.credit}</span></a>`;
      worldTitle.textContent=selected.label;
      worldSummary.textContent=selected.summary;
    }
    topicPanel.innerHTML=getPopulationTopics(window.VOLLEYBALL_TOPICS,population).map(topic=>`<button type="button" class="vb-topic" data-topic="${topic.id}"><span>${topic.icon}</span><b>${topic.label}</b></button>`).join('');
  }

  function currentPool(){
    return filterVolleyballFeed(window.VOLLEYBALL_FEED_CARDS,{population,query:search.value});
  }

  function appendBatch(){
    if(loading)return;
    loading=true;
    const batch=buildInfiniteBatch(window.VOLLEYBALL_FEED_CARDS,{population,query:search.value},feedSeed,page,8);
    if(batch.length){
      feed.insertAdjacentHTML('beforeend',batch.map(renderCard).join(''));
      page+=1;
      rendered+=batch.length;
      count.textContent=population==='all'?`${rendered} פריטים נטענו · ממשיכים לגלול`:`${rendered} פריטים ב־${labelFor(window.VOLLEYBALL_POPULATIONS,population)} · ממשיכים לגלול`;
    }else{
      if(!rendered) feed.innerHTML='<div class="vb-empty">לא נמצאו פריטים לחיפוש הזה.</div>';
      count.textContent='אין תוצאות נוספות';
    }
    loading=false;
  }

  function resetFeed(){
    page=0;
    rendered=0;
    feed.innerHTML='';
    appendBatch();
  }

  function selectPopulation(next){
    population=next;
    tabs.querySelectorAll('[data-population]').forEach(btn=>{
      const active=btn.dataset.population===population;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    renderPopulationWorld();
    resetFeed();
  }

  tabs.addEventListener('click',event=>{
    const btn=event.target.closest('[data-population]');
    if(!btn)return;
    selectPopulation(btn.dataset.population);
  });

  search.addEventListener('input',resetFeed);

  topicPanel.addEventListener('click',event=>{
    const btn=event.target.closest('[data-topic]');
    if(!btn)return;
    const pool=currentPool().filter(card=>card.topic===btn.dataset.topic||card.topic==='all');
    const card=pickDiscovery(pool,'all',`${Date.now()}|${btn.dataset.topic}|${population}`);
    discovery.innerHTML=card?renderCard(card):'<div class="vb-empty">עוד אין פריט ממוקד בתחום הזה לאוכלוסייה שנבחרה.</div>';
    discoveryShell.scrollIntoView({behavior:'smooth',block:'center'});
  });

  discoveryShell.addEventListener('click',event=>{
    const btn=event.target.closest('[data-kind]');
    if(!btn)return;
    const pool=currentPool();
    const card=pickDiscovery(pool,btn.dataset.kind,`${Date.now()}|${btn.dataset.kind}|${population}`);
    discovery.innerHTML=card?renderCard(card):'<div class="vb-empty">אין כרגע פריט מהסוג הזה במסלול שנבחר.</div>';
  });

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) appendBatch();
    },{rootMargin:'500px 0px'});
    observer.observe(sentinel);
  }else{
    sentinel.innerHTML='<button type="button" class="btn" id="volleyball-load-more">טען עוד</button>';
    sentinel.addEventListener('click',appendBatch);
  }

  renderPopulationWorld();
  resetFeed();
}

if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',initVolleyballHub);
if(typeof module!=='undefined'&&module.exports){
  module.exports={VOLLEYBALL_VISUALS,filterVolleyballFeed,pickDiscovery,hashSeed,seededShuffle,buildInfiniteBatch,getPopulationTopics};
}
if(typeof window!=='undefined') Object.assign(window,{VOLLEYBALL_VISUALS,filterVolleyballFeed,pickDiscovery,buildInfiniteBatch,getPopulationTopics,initVolleyballHub});
