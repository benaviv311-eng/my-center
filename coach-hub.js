(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachHub=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function hash(value){
    let h=2166136261;
    const text=String(value||'');
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }

  function rotate(list,offset){
    if(!list.length) return [];
    const start=Math.abs(offset)%list.length;
    return list.slice(start).concat(list.slice(0,start));
  }

  function uniqueById(items){
    const seen=new Set();
    return items.filter(item=>{
      if(!item||seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function selectToday(cards,seed){
    const pool=Array.isArray(cards)?cards.filter(Boolean):[];
    if(!pool.length) return [];
    const explanatory=pool.filter(card=>['concept','insight','research','summary'].includes(card.type));
    const applied=pool.filter(card=>['application','scenario','language','practice'].includes(card.type));
    const questions=pool.filter(card=>card.type==='question');
    const h=hash(seed);
    const picks=[];
    if(explanatory.length) picks.push(rotate(explanatory,h)[0]);
    if(applied.length) picks.push(rotate(applied,h>>>5)[0]);
    if(questions.length) picks.push(rotate(questions,h>>>11)[0]);
    return uniqueById(picks.concat(rotate(pool,h>>>17))).slice(0,3);
  }

  function selectNextPractice(cards,seed){
    const pool=(Array.isArray(cards)?cards:[]).filter(card=>card&&typeof card.application==='string'&&card.application.trim());
    if(!pool.length) return null;
    return rotate(pool,hash(seed))[0];
  }

  function escapeHtml(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function topicLabel(card,topics){
    const topic=(topics||[]).find(item=>item.id===card.topic);
    return topic?`${topic.icon||''} ${topic.label}`.trim():'מאמן';
  }

  function renderTodayItem(card,topics,index){
    if(!card) return '';
    const labels=['עיקרון','רעיון לאימון','שאלה למאמן'];
    const copy=card.question||card.body||card.application||'';
    return `<article class="coach-today-card"><div class="coach-today-meta"><span>${escapeHtml(labels[index]||'רעיון')}</span><small>${escapeHtml(topicLabel(card,topics))}</small></div><h3>${escapeHtml(card.title||'רעיון למאמן')}</h3><p>${escapeHtml(copy)}</p></article>`;
  }

  function initCoachHub(doc,data){
    if(!doc||!data) return;
    const cards=data.COACH_FEED_CARDS||[];
    const topics=data.COACH_TOPICS||[];
    const seed=new Date().toISOString().slice(0,10);
    const today=doc.getElementById('coach-today-grid');
    if(today){
      today.innerHTML=selectToday(cards,seed).map((card,index)=>renderTodayItem(card,topics,index)).join('');
    }
    const next=doc.getElementById('coach-next-practice-card');
    if(next){
      const card=selectNextPractice(cards,`${seed}|practice`);
      if(card){
        next.innerHTML=`<div class="coach-next-practice-icon" aria-hidden="true">↗</div><div><p>${escapeHtml(topicLabel(card,topics))}</p><strong>${escapeHtml(card.title||'ליישום באימון')}</strong><span>${escapeHtml(card.application)}</span></div>`;
      }
    }
  }

  if(typeof document!=='undefined'){
    const start=()=>{
      if(typeof window!=='undefined'&&window.CoachFeedData) initCoachHub(document,window.CoachFeedData);
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
  }

  return {selectToday,selectNextPractice,initCoachHub};
});
