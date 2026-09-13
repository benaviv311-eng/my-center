(function(root,factory){
  const api=factory(root&&root.CoachFeedData?root.CoachFeedData:null);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachFeed=api;
})(typeof window!=='undefined'?window:globalThis,function(browserData){
  'use strict';

  function normalizeCard(card){
    return Object.assign({tags:[],body:'',application:'',source:'',sourceKind:'',evidenceStrength:''},card||{});
  }

  function filterCards(cards,topic){
    const list=Array.isArray(cards)?cards:[];
    if(!topic||topic==='all') return list.slice();
    return list.filter(card=>card.topic===topic);
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
    const application=card.application?`<div class="coach-application"><strong>ליישום באימון</strong><p>${escapeHtml(card.application)}</p></div>`:'';
    return `<article class="coach-feed-card" data-card-id="${escapeHtml(card.id)}">
      ${renderMeta(card,topics)}
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.body)}</p>
      ${application}
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
    if(!nav||!feed) return null;

    let activeTopic='all';
    const baseSeed=(config&&config.seed)||todayKey();

    function renderNav(){
      const items=[{id:'all',label:'הכול',icon:'✨'}].concat(topics);
      nav.innerHTML=items.map(item=>`<button type="button" class="coach-topic-button${item.id===activeTopic?' active':''}" data-coach-topic="${escapeHtml(item.id)}" aria-pressed="${item.id===activeTopic?'true':'false'}"><span>${escapeHtml(item.icon||'')}</span>${escapeHtml(item.label)}</button>`).join('');
    }

    function renderFeed(){
      const filtered=filterCards(cards,activeTopic);
      const mixed=mixFeed(filtered,`${baseSeed}|${activeTopic}`,filtered.length);
      feed.innerHTML=mixed.map(card=>renderCard(card,topics)).join('');
      if(status){
        const label=activeTopic==='all'?'כל התחומים':topicLabel(activeTopic,topics);
        status.textContent=`${label} · ${mixed.length} כרטיסים`;
      }
      renderNav();
    }

    nav.addEventListener('click',event=>{
      const button=event.target.closest('[data-coach-topic]');
      if(!button) return;
      activeTopic=button.getAttribute('data-coach-topic')||'all';
      renderFeed();
    });

    feed.addEventListener('click',event=>{
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

    renderFeed();
    return {renderFeed,getActiveTopic:()=>activeTopic};
  }

  const api={normalizeCard,filterCards,mixFeed,answerQuestion,renderCard,initCoachFeed};

  if(typeof document!=='undefined'){
    const boot=()=>initCoachFeed(document,{});
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }

  return api;
});
