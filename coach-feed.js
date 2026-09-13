(function(root,factory){
  const api=factory(root&&root.CoachFeedData?root.CoachFeedData:null);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachFeed=api;
})(typeof window!=='undefined'?window:globalThis,function(browserData){
  'use strict';

  const KNOWN_TOPICS=['sport-psychology','coaching-psychology','movement-psychology','explosive-power','coaching-language','volleyball-approaches'];

  function normalizeCard(card){
    return Object.assign({tags:[],body:'',application:'',applicationDetails:'',source:'',sourceKind:'',evidenceStrength:''},card||{});
  }

  function filterCards(cards,topic){
    const list=Array.isArray(cards)?cards:[];
    if(!topic||topic==='all') return list.slice();
    return list.filter(card=>card.topic===topic);
  }

  function resolveInitialTopic(value){
    const topic=String(value||'').trim();
    return KNOWN_TOPICS.includes(topic)?topic:'all';
  }

  function hashSeed(input){
    const text=String(input||'');
    let hash=2166136261;
    for(let i=0;i<text.length;i++){
      hash^=text.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    return hash>>>0;
  }

  function seededRandom(seed){
    let state=hashSeed(seed)||1;
    return function(){
      state+=0x6D2B79F5;
      let t=state;
      t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }

  function mixFeed(cards,seed,limit){
    const list=(Array.isArray(cards)?cards:[]).slice();
    const random=seededRandom(seed);
    for(let i=list.length-1;i>0;i--){
      const j=Math.floor(random()*(i+1));
      [list[i],list[j]]=[list[j],list[i]];
    }
    const max=Number.isInteger(limit)&&limit>=0?limit:list.length;
    return list.slice(0,max);
  }

  function buildFeedCycle(cards,seed,cycleIndex){
    const cycle=Number.isInteger(cycleIndex)&&cycleIndex>=0?cycleIndex:0;
    return mixFeed(cards,`${seed}|cycle:${cycle}`,Array.isArray(cards)?cards.length:0);
  }

  function answerQuestion(card,optionIndex){
    const item=normalizeCard(card);
    if(item.type!=='question'||!Array.isArray(item.options)) throw new TypeError('Question card required');
    if(!Number.isInteger(optionIndex)||optionIndex<0||optionIndex>=item.options.length) throw new RangeError('Invalid option index');
    return {
      selectedOption:optionIndex,
      isCorrect:optionIndex===item.correctOption,
      explanation:item.explanation||'',
      principle:item.principle||'',
      application:item.application||''
    };
  }

  function escapeHtml(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function topicLabel(topicId,topics){
    const topic=(topics||[]).find(item=>item.id===topicId);
    return topic?topic.label:topicId;
  }

  function renderMeta(card,topics){
    const parts=[`<span class="coach-pill">${escapeHtml(topicLabel(card.topic,topics))}</span>`];
    if(card.evidenceStrength) parts.push(`<span class="coach-pill coach-evidence">ראיות: ${escapeHtml(card.evidenceStrength)}</span>`);
    if(card.source) parts.push(`<span class="coach-source">מקור: ${escapeHtml(card.source)}</span>`);
    return `<div class="coach-card-meta">${parts.join('')}</div>`;
  }

  function applicationExpansion(card){
    if(card.applicationDetails) return card.applicationDetails;
    return `הפוך את הרעיון למשימה אחת ברורה, קבע סימן הצלחה שאפשר לראות, וצפה בכמה חזרות לפני שינוי נוסף. ${card.application||''}`.trim();
  }

  function renderApplication(card){
    if(!card.application) return '';
    const panelId=`coach-expand-${escapeHtml(card.id)}-application`;
    return `<div class="coach-application">
      <button type="button" class="coach-expand-toggle" data-coach-expand="application" aria-expanded="false" aria-controls="${panelId}">
        <strong>ליישום באימון</strong><span class="coach-expand-icon" aria-hidden="true">⌄</span>
      </button>
      <p>${escapeHtml(card.application)}</p>
      <div class="coach-expand-panel" id="${panelId}" hidden>
        <p><b>הרחבה:</b> ${escapeHtml(applicationExpansion(card))}</p>
        <p><b>בדיקה באימון:</b> בחר מדד אחד פשוט, תן לשחקן כמה ניסיונות, ורק אז החלט אם לשנות את המשימה או את ה־Cue.</p>
      </div>
    </div>`;
  }

  function renderQuestion(card,topics){
    const options=card.options.map((option,index)=>`<button type="button" class="coach-option" data-question-option="${index}">${escapeHtml(option)}</button>`).join('');
    return `<article class="coach-feed-card coach-question-card" data-card-id="${escapeHtml(card.id)}">
      ${renderMeta(card,topics)}
      <h3>${escapeHtml(card.title)}</h3>
      <p class="coach-question-text">${escapeHtml(card.question)}</p>
      <div class="coach-options">${options}</div>
      <div class="coach-question-feedback" data-question-feedback hidden></div>
    </article>`;
  }

  function renderStandard(card,topics){
    return `<article class="coach-feed-card" data-card-id="${escapeHtml(card.id)}">
      ${renderMeta(card,topics)}
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.body)}</p>
      ${renderApplication(card)}
    </article>`;
  }

  function renderCard(card,topics){
    const item=normalizeCard(card);
    return item.type==='question'?renderQuestion(item,topics||[]):renderStandard(item,topics||[]);
  }

  function todayKey(){
    try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem'}).format(new Date());}
    catch(_){return new Date().toISOString().slice(0,10);}
  }

  function initCoachFeed(doc,config){
    if(!doc) return null;
    const data=(config&&config.data)||browserData||{};
    const cards=(config&&config.cards)||data.COACH_FEED_CARDS||[];
    const topics=(config&&config.topics)||data.COACH_TOPICS||[];
    const nav=doc.getElementById('coach-topic-nav');
    const feed=doc.getElementById('coach-feed');
    const status=doc.getElementById('coach-feed-status');
    const sentinel=doc.getElementById('coach-feed-sentinel');
    if(!nav||!feed) return null;

    const bodyTopic=doc.body&&doc.body.getAttribute?doc.body.getAttribute('data-coach-fixed-topic'):'';
    let activeTopic=resolveInitialTopic((config&&config.fixedTopic)||bodyTopic);
    const baseSeed=(config&&config.seed)||todayKey();
    const batchSize=(config&&Number.isInteger(config.batchSize)&&config.batchSize>0)?config.batchSize:6;
    let pool=[];
    let cycleIndex=0;
    let cycleCards=[];
    let cursor=0;
    let loadedCount=0;

    function renderNav(){
      const items=[{id:'all',label:'הכול',icon:'✨',page:'coach.html'}].concat(topics);
      nav.innerHTML=items.map(item=>`<a class="coach-topic-button${item.id===activeTopic?' active':''}" href="${escapeHtml(item.page||'coach.html')}" aria-current="${item.id===activeTopic?'page':'false'}"><span>${escapeHtml(item.icon||'')}</span>${escapeHtml(item.label)}</a>`).join('');
    }

    function updateStatus(){
      if(!status) return;
      const label=activeTopic==='all'?'כל התחומים':topicLabel(activeTopic,topics);
      status.textContent=`${label} · ${loadedCount} כרטיסים נטענו · גלילה אינסופית`;
    }

    function startCycle(index){
      cycleIndex=index;
      cycleCards=buildFeedCycle(pool,`${baseSeed}|${activeTopic}`,cycleIndex);
      cursor=0;
    }

    function appendBatch(){
      if(!pool.length) return [];
      if(cursor>=cycleCards.length) startCycle(cycleIndex+1);
      const next=cycleCards.slice(cursor,cursor+batchSize);
      cursor+=next.length;
      loadedCount+=next.length;
      if(next.length) feed.insertAdjacentHTML('beforeend',next.map(card=>renderCard(card,topics)).join(''));
      updateStatus();
      return next;
    }

    function renderFeed(){
      pool=filterCards(cards,activeTopic);
      loadedCount=0;
      feed.innerHTML='';
      startCycle(0);
      appendBatch();
      renderNav();
    }

    feed.addEventListener('click',event=>{
      const expandButton=event.target.closest('[data-coach-expand]');
      if(expandButton){
        const controls=expandButton.getAttribute('aria-controls');
        const panel=controls?doc.getElementById(controls):null;
        if(panel){
          const opening=panel.hidden;
          panel.hidden=!opening;
          expandButton.setAttribute('aria-expanded',opening?'true':'false');
        }
        return;
      }

      const option=event.target.closest('[data-question-option]');
      if(!option) return;
      const article=option.closest('[data-card-id]');
      if(!article) return;
      const card=cards.find(item=>item.id===article.getAttribute('data-card-id'));
      if(!card||card.type!=='question') return;
      const index=Number(option.getAttribute('data-question-option'));
      const result=answerQuestion(card,index);
      article.querySelectorAll('[data-question-option]').forEach((button,i)=>{
        button.disabled=true;
        button.classList.toggle('selected',i===index);
        button.classList.toggle('correct',i===card.correctOption);
      });
      const feedback=article.querySelector('[data-question-feedback]');
      if(feedback){
        feedback.hidden=false;
        feedback.innerHTML=`<strong>${result.isCorrect?'נכון':'עדיף לבחור אחרת'}</strong><p class="coach-feedback-explanation">${escapeHtml(result.explanation)}</p><p><b>העיקרון:</b> ${escapeHtml(result.principle)}</p><p><b>בכדורעף:</b> ${escapeHtml(result.application)}</p>`;
      }
    });

    if(sentinel){
      const View=doc.defaultView||null;
      const Observer=(config&&config.IntersectionObserver)||(View&&View.IntersectionObserver)||(typeof IntersectionObserver!=='undefined'?IntersectionObserver:null);
      if(Observer){
        const observer=new Observer(entries=>{
          if(entries.some(entry=>entry.isIntersecting)) appendBatch();
        },{rootMargin:'500px 0px'});
        observer.observe(sentinel);
      }else{
        sentinel.addEventListener('click',appendBatch);
        sentinel.classList.add('fallback');
        sentinel.textContent='טען עוד';
      }
    }

    renderFeed();
    return {renderFeed,appendBatch,getActiveTopic:()=>activeTopic,getCycleIndex:()=>cycleIndex};
  }

  const api={normalizeCard,filterCards,resolveInitialTopic,mixFeed,buildFeedCycle,answerQuestion,renderCard,initCoachFeed};

  if(typeof document!=='undefined'){
    const boot=()=>initCoachFeed(document,{});
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }

  return api;
});
