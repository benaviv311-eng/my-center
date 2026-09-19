(function(root,factory){
  let data={};
  if(typeof module!=='undefined'&&module.exports) data=require('./coach-training-lab-data.js');
  else if(root&&root.CoachTrainingLabData) data=root.CoachTrainingLabData;
  const api=factory(data);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachTrainingLab=api;
})(typeof window!=='undefined'?window:globalThis,function(data){
  'use strict';

  const GRADE_ALIASES={'א':'א','ב':'ב','ג':'ג','ד':'ד','ה':'ה','ו':'ו','ז':'ז','ח':'ח','ט':'ט','י':'י','יא':'יא','יב':'יב'};
  const LEVEL_LABELS={beginner:'מתחילים',developing:'מתפתחים',intermediate:'ביניים',advanced:'מתקדמים'};
  const TYPE_LABELS={drill:'תרגיל',principle:'עיקרון',science:'מחקר ומדע','teaching-method':'שיטת הוראה',scenario:'סיטואציה',comparison:'השוואה'};
  const EVIDENCE_LABELS={strong:'חזק',moderate:'בינוני',limited:'מוגבל','practice-based':'ניסיון מקצועי',interpretation:'פרשנות'};
  const SOURCE_LABELS={research:'מחקר','official-body':'גוף רשמי','coaching-organization':'ארגון מאמנים','professional-practice':'ניסיון מקצועי','training-idea':'רעיון אימוני','our-interpretation':'פרשנות שלנו'};

  function normalizeText(value){
    return String(value==null?'':value).normalize('NFKD').replace(/[׳’']/g,'').replace(/[״"]/g,'').trim().toLowerCase();
  }

  function isValidHttpUrl(value){
    try{ const url=new URL(value); return url.protocol==='http:'||url.protocol==='https:'; }
    catch(_error){ return false; }
  }

  function nonEmpty(value){
    return !(value==null||value===''||(Array.isArray(value)&&value.length===0));
  }

  function validateItem(item){
    const errors=[];
    for(const key of ['id','title','type','summary','topics','levels','sourceKind','evidenceStrength','tags']){
      if(!nonEmpty(item?.[key])) errors.push(key);
    }
    if(item?.type&&!data.LAB_TYPES.includes(item.type)) errors.push('type');
    if(Array.isArray(item?.topics)&&item.topics.some(topic=>!data.LAB_TOPICS.some(x=>x.id===topic))) errors.push('topics');
    if(Array.isArray(item?.levels)&&item.levels.some(level=>!data.LAB_LEVELS.includes(level))) errors.push('levels');
    if(item?.sourceKind&&!data.LAB_SOURCE_KINDS.includes(item.sourceKind)) errors.push('sourceKind');
    if(item?.evidenceStrength&&!data.LAB_EVIDENCE_STRENGTHS.includes(item.evidenceStrength)) errors.push('evidenceStrength');
    if(item?.type==='drill'){
      for(const key of ['objective','setup','steps','childExplanation','sayExactly','oneCue']) if(!nonEmpty(item[key])) errors.push(key);
      if((!item.ages||item.ages.length===0)&&(!item.grades||item.grades.length===0)) errors.push('ages|grades');
    }
    if(item?.sourceKind==='research'){
      for(const key of ['sourcePublisher','sourceTitle','sourceUrl','sourceClaim','science','sourceDate']) if(!nonEmpty(item[key])) errors.push(key);
    }
    if(item?.sourceUrl){
      if(!isValidHttpUrl(item.sourceUrl)) errors.push('sourceUrl');
      if(!item.sourceAccessedAt) errors.push('sourceAccessedAt');
    }
    return {valid:errors.length===0,errors:[...new Set(errors)]};
  }

  function validateData(items){
    const errors=[]; const ids=new Set();
    for(const item of items||[]){
      const result=validateItem(item);
      if(!result.valid) errors.push({id:item?.id||null,errors:result.errors});
      if(ids.has(item?.id)) errors.push({id:item?.id||null,errors:['duplicate-id']});
      ids.add(item?.id);
    }
    return {valid:errors.length===0,errors};
  }

  function parseGradeTokens(query){
    const raw=normalizeText(query).replace(/כיתות?/g,' ').replace(/כיתה/g,' ').replace(/[-–—]/g,' ');
    const tokens=raw.split(/\s+/).filter(Boolean);
    return [...new Set(tokens.map(x=>GRADE_ALIASES[x]).filter(Boolean))];
  }

  function searchableText(item){
    const topicLabels=(item.topics||[]).map(id=>data.LAB_TOPICS.find(t=>t.id===id)?.label||id);
    const levelLabels=(item.levels||[]).map(id=>LEVEL_LABELS[id]||id);
    return normalizeText([
      item.title,item.summary,...topicLabels,...levelLabels,...(item.tags||[]),item.childExplanation,item.oneCue,
      item.sourcePublisher,item.application,item.objective,item.gameContext,item.science
    ].filter(Boolean).join(' '));
  }

  function filterItems(items,filters={}){
    return (items||[]).filter(item=>{
      if(filters.topic&&filters.topic!=='all'&&!item.topics?.includes(filters.topic)) return false;
      if(filters.level&&filters.level!=='all'&&!item.levels?.includes(filters.level)) return false;
      if(filters.type&&filters.type!=='all'&&item.type!==filters.type) return false;
      if(filters.sourceKind&&filters.sourceKind!=='all'&&item.sourceKind!==filters.sourceKind) return false;
      if(filters.evidenceStrength&&filters.evidenceStrength!=='all'&&item.evidenceStrength!==filters.evidenceStrength) return false;
      if(filters.age&&filters.age!=='all'&&!(item.ages||[]).includes(Number(filters.age))) return false;
      if(filters.grade&&filters.grade!=='all'&&!(item.grades||[]).includes(filters.grade)) return false;
      return true;
    });
  }

  function searchItems(items,query='',filters={}){
    let result=filterItems(items,filters);
    const gradeTokens=parseGradeTokens(query);
    if(gradeTokens.length) result=result.filter(item=>gradeTokens.every(g=>(item.grades||[]).includes(g)));
    let q=normalizeText(query).replace(/כיתות?/g,' ').replace(/כיתה/g,' ').replace(/[-–—]/g,' ');
    for(const grade of gradeTokens){ q=q.replace(new RegExp(`(^|\\s)${grade}(?=\\s|$)`,'g'),' '); }
    const terms=q.split(/\s+/).filter(Boolean);
    if(terms.length) result=result.filter(item=>{
      const hay=searchableText(item);
      return terms.every(term=>hay.includes(term));
    });
    return result;
  }

  function approachKey(item){ return `${normalizeText(item.sourcePublisher||'internal')}|${normalizeText(item.title)}`; }
  function getComparison(items,group){
    if(!group) return [];
    const seen=new Set(); const out=[];
    for(const item of items||[]){
      if(item.comparisonGroup!==group) continue;
      const key=approachKey(item);
      if(seen.has(key)) continue;
      seen.add(key); out.push(item);
      if(out.length===5) break;
    }
    return out;
  }
  function comparisonLabel(items,group){
    const count=getComparison(items,group).length;
    if(count<2) return '';
    return `אותו רעיון — ${count>=5?5:count} דרכים`;
  }

  function recommendNow(items,request={},limit=4){
    const requested={
      topic:request.topic||null,grade:request.grade||null,level:request.level||null,
      minutes:Number(request.minutes)||null,players:Number(request.players)||null
    };
    const ranked=(items||[]).filter(x=>x.type==='drill'||x.type==='scenario').map((item,index)=>{
      const mismatches=[]; let score=0;
      if(requested.topic){ item.topics?.includes(requested.topic)?score+=5:mismatches.push('topic'); }
      if(requested.grade){ (item.grades||[]).includes(requested.grade)?score+=4:mismatches.push('grade'); }
      if(requested.level){ (item.levels||[]).includes(requested.level)?score+=3:mismatches.push('level'); }
      if(requested.minutes){
        Number.isFinite(Number(item.durationMinutes))&&Number(item.durationMinutes)>0&&Number(item.durationMinutes)<=requested.minutes?score+=3:mismatches.push('time');
      }
      if(requested.players){
        if(item.minPlayers==null&&item.maxPlayers==null) mismatches.push('players');
        else{
          const min=item.minPlayers??0,max=item.maxPlayers??Infinity;
          requested.players>=min&&requested.players<=max?score+=3:mismatches.push('players');
        }
      }
      return {item,exact:mismatches.length===0,mismatches,score,index};
    }).sort((a,b)=>Number(b.exact)-Number(a.exact)||b.score-a.score||a.mismatches.length-b.mismatches.length||a.index-b.index);
    return ranked.slice(0,Math.max(2,Math.min(4,limit||4))).map(({index,...x})=>x);
  }

  function createStorageAdapter(storage,key){
    let memory=[];
    try{
      const parsed=JSON.parse(storage?.getItem?.(key)||'[]');
      if(Array.isArray(parsed)) memory=[...new Set(parsed.filter(x=>typeof x==='string'))];
    }catch(_error){}
    return {
      read(){ return memory.slice(); },
      write(ids){
        memory=[...new Set((ids||[]).filter(x=>typeof x==='string'))];
        try{ storage?.setItem?.(key,JSON.stringify(memory)); }catch(_error){}
        return memory.slice();
      }
    };
  }
  function toggleStoredId(adapter,id){
    const values=adapter.read(); const set=new Set(values);
    set.has(id)?set.delete(id):set.add(id);
    return adapter.write([...set]);
  }
  function readStoredIds(adapter){ return adapter.read(); }

  function esc(value){ return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function listHtml(values){ return (values||[]).length?`<ul>${values.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''; }
  function topicsLabel(item){ return (item.topics||[]).map(id=>data.LAB_TOPICS.find(t=>t.id===id)?.label||id).join(' · '); }
  function audienceLabel(item){
    const parts=[];
    if(item.grades?.length) parts.push(`כיתות ${item.grades.join('–')}`);
    if(item.levels?.length) parts.push(item.levels.map(x=>LEVEL_LABELS[x]||x).join(', '));
    if(item.durationMinutes) parts.push(`${item.durationMinutes} דק׳`);
    if(item.minPlayers||item.maxPlayers) parts.push(`${item.minPlayers||1}–${item.maxPlayers||'+'} שחקנים`);
    return parts.join(' · ');
  }

  function renderCard(item,state={}){
    const favorite=state.favorites?.includes?.(item.id); const next=state.nextPractice?.includes?.(item.id);
    const compare=comparisonLabel(state.allItems||data.LAB_ITEMS,item.comparisonGroup);
    return `<article class="training-lab-card" data-lab-id="${esc(item.id)}">
      <div class="training-lab-card-top"><span>${esc(TYPE_LABELS[item.type]||item.type)}</span><span>${esc(EVIDENCE_LABELS[item.evidenceStrength]||item.evidenceStrength)}</span></div>
      <h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p>
      <p class="training-lab-meta">${esc(topicsLabel(item))}${audienceLabel(item)?' · '+esc(audienceLabel(item)):''}</p>
      ${item.oneCue?`<blockquote class="training-lab-one-cue">${esc(item.oneCue)}</blockquote>`:''}
      <p class="training-lab-source">${esc(item.sourcePublisher||'')}</p>
      <div class="training-lab-card-actions">
        <button type="button" data-lab-action="open">פתח</button>
        <button type="button" data-lab-action="favorite">${favorite?'★ שמור':'☆ שמור'}</button>
        <button type="button" data-lab-action="next-practice">${next?'✓ באימון הבא':'🏐 לקחת לאימון'}</button>
        ${item.childExplanation?'<button type="button" data-lab-action="child-language">🗣️ מה אני אומר לילדים</button>':''}
        ${item.simplify?.length?'<button type="button" data-lab-action="simplify">⬇️ לפשט</button>':''}
        ${item.progressions?.length?'<button type="button" data-lab-action="progress">⬆️ להקשות</button>':''}
        ${item.variations?.length?'<button type="button" data-lab-action="variation">🔄 וריאציה</button>':''}
        ${item.science?'<button type="button" data-lab-action="why">🧠 למה זה עובד</button>':''}
        ${compare?`<button type="button" data-lab-action="compare">${esc(compare)}</button>`:''}
      </div>
    </article>`;
  }

  function section(title,body,cls=''){
    if(!body) return '';
    return `<section class="training-lab-detail-section ${cls}"><h3>${esc(title)}</h3>${body}</section>`;
  }
  function renderDetail(item,comparisonItems=[]){
    const sourceLink=isValidHttpUrl(item.sourceUrl)?`<a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">למקור ↗</a>`:'';
    const compare=comparisonItems.length>=2?section(comparisonItems.length>=5?'אותו רעיון — 5 דרכים':`אותו רעיון — ${comparisonItems.length} דרכים`,comparisonItems.map(x=>`<div class="training-lab-approach"><b>${esc(x.title)}</b><small>${esc(x.sourcePublisher||'מעבדת האימון')}</small><p>${esc(x.ourInterpretation||x.summary)}</p></div>`).join(''),'training-lab-comparison'):'';
    return `<article class="training-lab-detail-card" data-detail-id="${esc(item.id)}">
      <button class="training-lab-detail-close" data-lab-action="close-detail" aria-label="סגור">×</button>
      <p class="training-lab-eyebrow">${esc(TYPE_LABELS[item.type]||item.type)} · ${esc(topicsLabel(item))}</p>
      <h2>${esc(item.title)}</h2><p class="training-lab-lead">${esc(item.summary)}</p>
      ${section('למי מתאים',audienceLabel(item)?`<p>${esc(audienceLabel(item))}</p>`:'','training-lab-audience')}
      ${section('מה המטרה',item.objective?`<p>${esc(item.objective)}</p>`:'')}
      ${section('איך זה נראה במשחק',item.gameContext?`<p>${esc(item.gameContext)}</p>`:'')}
      ${section('איך מארגנים',item.setup?`<p>${esc(item.setup)}</p>`:'')}
      ${section('מה עושים',listHtml(item.steps))}
      ${section('ניקוד / תחרות',item.scoring?`<p>${esc(item.scoring)}</p>`:'')}
      ${section('מה המאמן מסתכל עליו',listHtml(item.coachLooksFor))}
      ${section('טעויות נפוצות',listHtml(item.commonMistakes))}
      ${section('איך לפשט',listHtml(item.simplify),'training-lab-simplify')}
      ${section('איך להקשות',listHtml(item.progressions),'training-lab-progressions')}
      ${section('וריאציות',listHtml(item.variations),'training-lab-variations')}
      ${item.childExplanation?section('🗣️ מה אני אומר לילדים',`<p>${esc(item.childExplanation)}</p><div class="training-lab-say"><b>תגיד בדיוק כך:</b><p>${esc(item.sayExactly)}</p></div><div class="training-lab-cue"><b>משפט מפתח:</b> ${esc(item.oneCue)}</div>`,'training-lab-child-language'):''}
      ${section('🧠 למה זה עובד',item.science?`<p>${esc(item.science)}</p><p><b>חוזק ראיות:</b> ${esc(EVIDENCE_LABELS[item.evidenceStrength]||item.evidenceStrength)}</p>`:'','training-lab-science')}
      ${section('מתי לא להשתמש בזה',item.whenNotToUse?`<p>${esc(item.whenNotToUse)}</p>`:'')}
      ${section('מה המקור אומר',item.sourceClaim?`<p>${esc(item.sourceClaim)}</p>`:'','training-lab-source-claim')}
      ${section('הפרשנות שלנו',item.ourInterpretation?`<p>${esc(item.ourInterpretation)}</p>`:'','training-lab-interpretation')}
      ${section('יישום באימון',item.application?`<p>${esc(item.application)}</p>`:'','training-lab-application')}
      ${section('מקור',item.sourcePublisher?`<p><b>${esc(item.sourcePublisher)}</b>${item.sourceTitle?' — '+esc(item.sourceTitle):''}</p><p><small>${esc(SOURCE_LABELS[item.sourceKind]||item.sourceKind)}${item.sourceDate?' · '+esc(item.sourceDate):''}${item.sourceAccessedAt?' · נבדק '+esc(item.sourceAccessedAt):''}</small></p>${sourceLink}`:'')}
      ${compare}
    </article>`;
  }

  const mismatchLabels={topic:'נושא',grade:'כיתה',level:'רמה',time:'זמן',players:'מספר שחקנים'};
  function renderQuickMatchResult(result){
    const note=result.exact?'התאמה מלאה':`התאמה קרובה — לא תאם במדויק: ${(result.mismatches||[]).map(x=>mismatchLabels[x]||x).join(', ')}`;
    return `<article class="training-lab-now-card"><b>${esc(result.item.title)}</b><p>${esc(note)}</p></article>`;
  }

  function safeLocalStorage(win){ try{return win?.localStorage||null;}catch(_error){return null;} }

  function initTrainingLab(doc,labData=data){
    const root=doc?.querySelector?.('[data-training-lab-root]');
    if(!root) return null;
    const win=doc.defaultView||globalThis;
    const storage=safeLocalStorage(win);
    const favorites=createStorageAdapter(storage,'coachTrainingLab:favorites:v1');
    const nextPractice=createStorageAdapter(storage,'coachTrainingLab:nextPractice:v1');
    const state={filters:{},query:'',favorites:favorites.read(),nextPractice:nextPractice.read()};
    const $=id=>doc.getElementById(id);
    const results=$('training-lab-results'),count=$('training-lab-count'),detail=$('training-lab-detail');
    const search=$('training-lab-search'),filters=$('training-lab-filters');
    const favBox=$('training-lab-favorites'),nextBox=$('training-lab-next-practice');

    function option(value,label){return `<option value="${esc(value)}">${esc(label)}</option>`;}
    const availableAges=[...new Set(labData.LAB_ITEMS.flatMap(item=>item.ages||[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b);
    filters.innerHTML=`<label>נושא<select data-filter="topic">${option('all','הכול')}${labData.LAB_TOPICS.map(x=>option(x.id,x.label)).join('')}</select></label>
      <label>גיל<select data-filter="age">${option('all','הכול')}${availableAges.map(x=>option(String(x),`גיל ${x}`)).join('')}</select></label>
      <label>רמה<select data-filter="level">${option('all','הכול')}${labData.LAB_LEVELS.map(x=>option(x,LEVEL_LABELS[x]||x)).join('')}</select></label>
      <label>סוג<select data-filter="type">${option('all','הכול')}${labData.LAB_TYPES.map(x=>option(x,TYPE_LABELS[x]||x)).join('')}</select></label>
      <label>מקור<select data-filter="sourceKind">${option('all','הכול')}${labData.LAB_SOURCE_KINDS.map(x=>option(x,SOURCE_LABELS[x]||x)).join('')}</select></label>
      <label>ראיות<select data-filter="evidenceStrength">${option('all','הכול')}${labData.LAB_EVIDENCE_STRENGTHS.map(x=>option(x,EVIDENCE_LABELS[x]||x)).join('')}</select></label>`;

    function visible(){return searchItems(labData.LAB_ITEMS,state.query,state.filters);}
    function renderSaved(){
      state.favorites=favorites.read(); state.nextPractice=nextPractice.read();
      const byIds=ids=>ids.map(id=>labData.LAB_ITEMS.find(x=>x.id===id)).filter(Boolean);
      favBox.innerHTML=byIds(state.favorites).length?byIds(state.favorites).map(x=>`<button data-jump-id="${esc(x.id)}">★ ${esc(x.title)}</button>`).join(''):'<p>עוד אין שמורים.</p>';
      nextBox.innerHTML=byIds(state.nextPractice).length?byIds(state.nextPractice).map(x=>`<button data-jump-id="${esc(x.id)}">🏐 ${esc(x.title)}</button>`).join(''):'<p>עוד לא הוספת תרגיל לאימון הבא.</p>';
    }
    function render(){
      const items=visible(); count.textContent=`${items.length} פריטים`;
      results.innerHTML=items.length?items.map(x=>renderCard(x,{favorites:state.favorites,nextPractice:state.nextPractice,allItems:labData.LAB_ITEMS})).join(''):'<div class="training-lab-empty">לא מצאתי התאמה. נסה לאפס מסננים או לחפש מילה אחרת.</div>';
      renderSaved();
    }
    function openItem(item,anchorClass){
      if(!item) return;
      detail.hidden=false; detail.innerHTML=renderDetail(item,getComparison(labData.LAB_ITEMS,item.comparisonGroup));
      const target=anchorClass?detail.querySelector(anchorClass):detail.querySelector('h2');
      target?.scrollIntoView?.({behavior:'smooth',block:'start'});
    }
    function itemFromButton(button){return labData.LAB_ITEMS.find(x=>x.id===button.closest('[data-lab-id]')?.dataset.labId);}

    search?.addEventListener('input',()=>{state.query=search.value;render();});
    filters?.addEventListener('change',e=>{const key=e.target?.dataset?.filter;if(key){state.filters[key]=e.target.value;render();}});
    results?.addEventListener('click',e=>{
      const btn=e.target.closest('button[data-lab-action]'); if(!btn) return;
      const item=itemFromButton(btn); const action=btn.dataset.labAction;
      if(action==='favorite'){toggleStoredId(favorites,item.id);render();return;}
      if(action==='next-practice'){toggleStoredId(nextPractice,item.id);render();return;}
      if(action==='child-language'){openItem(item,'.training-lab-child-language');return;}
      if(action==='simplify'){openItem(item,'.training-lab-simplify');return;}
      if(action==='progress'){openItem(item,'.training-lab-progressions');return;}
      if(action==='variation'){openItem(item,'.training-lab-variations');return;}
      if(action==='why'){openItem(item,'.training-lab-science');return;}
      if(action==='compare'){openItem(item,'.training-lab-comparison');return;}
      openItem(item);
    });
    detail?.addEventListener('click',e=>{if(e.target.closest('[data-lab-action="close-detail"]')){detail.hidden=true;detail.innerHTML='';}});
    doc.addEventListener('click',e=>{const jump=e.target.closest('[data-jump-id]');if(jump) openItem(labData.LAB_ITEMS.find(x=>x.id===jump.dataset.jumpId));});

    const form=$('training-lab-now-form'),nowResults=$('training-lab-now-results');
    form?.addEventListener('submit',e=>{
      e.preventDefault(); const fd=new win.FormData(form);
      const request={players:fd.get('players'),grade:fd.get('grade'),level:fd.get('level'),minutes:fd.get('minutes'),topic:fd.get('topic')};
      const recs=recommendNow(labData.LAB_ITEMS,request,4);
      nowResults.innerHTML=recs.map(renderQuickMatchResult).join('');
    });
    render();
    return {render,state,favorites,nextPractice};
  }

  if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',()=>initTrainingLab(document,data));

  return {normalizeText,isValidHttpUrl,validateItem,validateData,parseGradeTokens,filterItems,searchItems,getComparison,comparisonLabel,recommendNow,createStorageAdapter,toggleStoredId,readStoredIds,renderCard,renderDetail,renderQuickMatchResult,initTrainingLab,safeLocalStorage};
});
