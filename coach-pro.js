(function(root){
  'use strict';

  const STORAGE_PROGRESS='coachAcademy:v1';
  const STORAGE_CONTEXT='coachProContext:v1';
  const STORAGE_NEXT='coachPro:nextPractice:v1';

  const ACADEMY=[
    {n:1,icon:'👀',title:'לראות את המשחק',topic:'volleyball-approaches',href:'coach-volleyball-approaches.html',desc:'תצפית, זיהוי בעיה והפרדה בין סימפטום לסיבה.'},
    {n:2,icon:'💬',title:'שפת אימון',topic:'coaching-language',href:'coach-coaching-language.html',desc:'Cue קצר, משוב, שאלות והנחיה שמובילה לפעולה.'},
    {n:3,icon:'🌀',title:'למידה מוטורית',topic:'movement-psychology',href:'coach-movement-psychology.html',desc:'תפיסה, קשב, אילוצים, גיוון והעברה למשחק.'},
    {n:4,icon:'🧩',title:'בניית תרגיל',topic:'volleyball-approaches',href:'coach-training-lab.html',desc:'מטרה, אילוץ, ניקוד, רמת קושי וקבלת החלטות.'},
    {n:5,icon:'🛡️',title:'קבלה והגנה',topic:'volleyball-approaches',href:'coach-training-lab.html?topic=reception',desc:'קריאת משחק, צעד ראשון, המשכיות ו-side-out.'},
    {n:6,icon:'⚔️',title:'התקפה וחסימה',topic:'volleyball-approaches',href:'coach-training-lab.html?topic=attack',desc:'תזמון, בחירה, מרחב ויצירת יתרון.'},
    {n:7,icon:'🧭',title:'טקטיקה קבוצתית',topic:'volleyball-approaches',href:'coach-volleyball-approaches.html',desc:'רוטציות, מטרות הגשה, מעבר ופתרון בעיות.'},
    {n:8,icon:'🧠',title:'פסיכולוגיה',topic:'sport-psychology',href:'coach-sport-psychology.html',desc:'ביטחון, לחץ, מוטיבציה, טעויות וחוסן.'},
    {n:9,icon:'⚡',title:'מדעי האימון',topic:'explosive-power',href:'coach-explosive-power.html',desc:'כוח, קפיצה, עומס, מנוחה ואיכות ביצוע.'},
    {n:10,icon:'📋',title:'ניהול משחק ומאמן',topic:'coaching-psychology',href:'coach-coaching-psychology.html',desc:'החלטות, שיחות, חילופים, רפלקציה ותכנון.'}
  ];

  const EXTRA_QUESTIONS=[
    {id:'pro-q-serve-target',topic:'volleyball-approaches',type:'question',contentKind:'טקטיקה',title:'איפה להגיש עכשיו?',question:'המקבלת המרכזית יציבה, אבל שחקנית 5 זזה מוקדם פנימה ומשאירה עומק. מה כדאי לבדוק קודם?',options:['להגיש תמיד חזק למרכז','לנסות עומק 5 ולראות אם דפוס התנועה נשמר','להפסיק לכוון ולהגיש חופשי','להחליף מגיש'],correctOption:1,explanation:'החלטה טקטית טובה מתחילה בהשערה שאפשר לבדוק. אם הדפוס נשמר, אפשר לנצל אותו; אם לא, מעדכנים.',principle:'Observe → Hypothesis → Test',application:'תן למגיש שתי מטרות אפשריות ובקש ממנו לזהות לפני כל סרב מה הוא מנסה להשיג.',evidenceStrength:'ניסיון מקצועי',tags:['הגשה','טקטיקה']},
    {id:'pro-q-timeout',topic:'coaching-psychology',type:'question',contentKind:'ניהול משחק',title:'מה אומרים בפסק זמן?',question:'הקבוצה ספגה ארבע נקודות רצופות ונראית לחוצה. מה עדיף לעשות ב-30 השניות הראשונות?',options:['לתת חמישה תיקונים טכניים','להגדיר פעולה אחת לכדור הבא ולייצב את הקשב','לשאול מי אשם ברצף','להחליף מיד חצי הרכב'],correctOption:1,explanation:'תחת לחץ קיבולת הקשב מוגבלת. מסר קצר שמחזיר לפעולה הבאה קל יותר ליישום מרשימת תיקונים.',principle:'ניהול קשב תחת לחץ',application:'בחר משפט אחד טקטי ומשפט אחד רגשי לכל היותר.',evidenceStrength:'בינוני',tags:['פסק זמן','לחץ']},
    {id:'pro-q-feedback',topic:'coaching-language',type:'question',contentKind:'שפת אימון',title:'מתי לעצור תרגיל?',question:'השחקנים טועים, אבל בכל חזרה הטעות מעט שונה. מה עדיף?',options:['לעצור אחרי כל כדור','לאסוף 3–4 חזרות ולחפש דפוס לפני ההתערבות','להחליף את כל התרגיל','להעלות את הקול'],correctOption:1,explanation:'כשאין דפוס ברור, עצירה מיידית עלולה לגרום למאמן להגיב לרעש במקום לבעיה יציבה.',principle:'Observation before intervention',application:'הגדר לעצמך מראש מה אתה מחפש במשך כמה חזרות.',evidenceStrength:'ניסיון מקצועי',tags:['משוב','תצפית']},
    {id:'pro-q-jump-load',topic:'explosive-power',type:'question',contentKind:'מדע האימון',title:'עוד קפיצות בסוף?',question:'האימון כבר כלל הרבה התקפות וחסימות, ובסוף תוכננה פליאומטריקה. מה בודקים קודם?',options:['אם נשאר זמן','כמה קפיצות כבר בוצעו ומה איכות הנחיתה','אם השחקנים רוצים תחרות','אם אפשר להוסיף מוזיקה'],correctOption:1,explanation:'עומס קפיצה מגיע גם מהכדורעף עצמו. תכנון פיזי צריך להתחשב בעומס שכבר נצבר במגרש.',principle:'Total jump load',application:'ספר גם קפיצות משחקיות כשאתה מתכנן תוספת פליאומטרית.',evidenceStrength:'בינוני',tags:['עומס','קפיצה']}
  ];

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function safeParse(key,fallback){
    try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'?x:fallback;}catch{return fallback;}
  }
  function progress(){const x=safeParse(STORAGE_PROGRESS,{done:[]});x.done=Array.isArray(x.done)?x.done:[];return x;}
  function saveProgress(x){localStorage.setItem(STORAGE_PROGRESS,JSON.stringify(x));}
  function context(){return Object.assign({group:'youth',level:'developing',players:'12',goal:'all'},safeParse(STORAGE_CONTEXT,{}));}
  function saveContext(x){localStorage.setItem(STORAGE_CONTEXT,JSON.stringify(x));}
  function nextPractice(){const x=safeParse(STORAGE_NEXT,{items:[]});x.items=Array.isArray(x.items)?x.items:[];return x;}
  function saveNext(x){localStorage.setItem(STORAGE_NEXT,JSON.stringify(x));}

  function mapEvidence(value){
    return ({strong:'חזק',moderate:'בינוני',limited:'מוגבל','practice-based':'ניסיון מקצועי',interpretation:'פרשנות'})[value]||value||'';
  }
  function mapLabTopic(item){
    const t=item.topics||[];
    if(t.includes('psychology'))return 'sport-psychology';
    if(t.includes('coaching-language'))return 'coaching-language';
    if(t.includes('power-jump'))return 'explosive-power';
    if(t.some(x=>['movement','perception','motor-learning'].includes(x)))return 'movement-psychology';
    return 'volleyball-approaches';
  }
  function mapLabType(type){
    return ({drill:'practice',principle:'concept',science:'research','teaching-method':'application',scenario:'scenario',comparison:'concept'})[type]||'concept';
  }
  function labToFeed(item){
    const details=[];
    if(item.objective)details.push({title:'מטרה',text:item.objective});
    if(item.science)details.push({title:'למה זה עובד',text:item.science});
    if(item.coachLooksFor?.length)details.push({title:'מה המאמן מחפש',text:item.coachLooksFor.join(' · ')});
    if(item.commonMistakes?.length)details.push({title:'טעויות נפוצות',text:item.commonMistakes.join(' · ')});
    if(item.sayExactly)details.push({title:'מה לומר בדיוק',text:item.sayExactly});
    if(item.oneCue)details.push({title:'Cue אחד',text:item.oneCue});
    return {
      id:'lab-'+item.id,
      topic:mapLabTopic(item),
      type:mapLabType(item.type),
      contentKind:({drill:'תרגיל',principle:'עיקרון',science:'מדע',scenario:'סיטואציה','teaching-method':'שיטת אימון',comparison:'השוואה'})[item.type]||'למידה',
      title:item.title,
      body:item.summary,
      application:item.application||item.childExplanation||'',
      applicationDetails:item.ourInterpretation||item.gameContext||'',
      source:item.sourcePublisher?item.sourcePublisher+(item.sourceTitle?' · '+item.sourceTitle:''):'',
      sourceKind:item.sourceKind||'',
      evidenceStrength:mapEvidence(item.evidenceStrength),
      tags:item.tags||[],
      deepDive:details.slice(0,6),
      labId:item.id,
      audience:{grades:item.grades||[],levels:item.levels||[],players:[item.minPlayers,item.maxPlayers],minutes:item.durationMinutes||null}
    };
  }
  function augmentFeed(){
    if(!root.CoachFeedData)return;
    const base=root.CoachFeedData.COACH_FEED_CARDS||[];
    const existing=new Set(base.map(x=>x.id));
    const lab=(root.CoachTrainingLabData&&root.CoachTrainingLabData.LAB_ITEMS)||[];
    const additions=lab.map(labToFeed).filter(x=>!existing.has(x.id));
    EXTRA_QUESTIONS.forEach(x=>{if(!existing.has(x.id))additions.push(x);});
    base.push(...additions);
  }

  function renderAcademy(){
    const rootEl=document.getElementById('coach-academy-grid');
    if(!rootEl)return;
    const p=progress();const done=new Set(p.done.map(Number));
    rootEl.innerHTML=ACADEMY.map(m=>{
      const state=done.has(m.n)?'done':(!done.has(m.n)&&(m.n===1||done.has(m.n-1))?'current':'future');
      return '<article class="coach-academy-card '+state+'"><div class="coach-academy-number">'+(done.has(m.n)?'✓':m.n)+'</div><div class="coach-academy-copy"><span>'+m.icon+' שלב '+m.n+'</span><h3>'+esc(m.title)+'</h3><p>'+esc(m.desc)+'</p><div><a href="'+esc(m.href)+'">ללמוד ←</a><button type="button" data-academy-done="'+m.n+'">'+(done.has(m.n)?'הושלם ✓':'סמן הושלם')+'</button></div></div></article>';
    }).join('');
    const pct=Math.round(done.size/ACADEMY.length*100);
    const bar=document.getElementById('coach-academy-progress-bar');
    const txt=document.getElementById('coach-academy-progress-text');
    if(bar)bar.style.width=pct+'%';
    if(txt)txt.textContent=done.size+'/10 · '+pct+'%';
    rootEl.querySelectorAll('[data-academy-done]').forEach(btn=>btn.addEventListener('click',()=>{
      const n=Number(btn.dataset.academyDone);const next=progress();const set=new Set(next.done.map(Number));
      set.has(n)?set.delete(n):set.add(n);next.done=[...set].sort((a,b)=>a-b);saveProgress(next);renderAcademy();
    }));
  }

  function renderContext(){
    const form=document.getElementById('coach-context-form');if(!form)return;
    const c=context();
    ['group','level','players','goal'].forEach(k=>{if(form.elements[k])form.elements[k].value=c[k]??'';});
    form.addEventListener('change',()=>{
      const next={group:form.elements.group.value,level:form.elements.level.value,players:form.elements.players.value,goal:form.elements.goal.value};
      saveContext(next);document.dispatchEvent(new CustomEvent('coach:context-changed',{detail:next}));
      const label=document.getElementById('coach-context-live');if(label)label.textContent=contextSummary(next);
    });
    const label=document.getElementById('coach-context-live');if(label)label.textContent=contextSummary(c);
  }
  function contextSummary(c){
    const groups={elementary:'יסודי',youth:'נוער',adult:'בוגרים',women:'בוגרות'};
    const levels={beginner:'מתחילים',developing:'מתפתחים',intermediate:'ביניים',advanced:'מתקדמים'};
    const goals={all:'כללי',reception:'קבלה',defense:'הגנה',attack:'התקפה',serve:'הגשה',tactics:'טקטיקה',psychology:'פסיכולוגיה'};
    return (groups[c.group]||'קבוצה')+' · '+(levels[c.level]||'רמה')+' · '+(c.players||'?')+' שחקנים · '+(goals[c.goal]||'כללי');
  }

  function selectFiveMinute(){
    const data=root.CoachFeedData||{};const cards=(data.COACH_FEED_CARDS||[]).filter(x=>x.type!=='question');
    if(!cards.length)return null;
    const day=new Date().toISOString().slice(0,10);
    let h=2166136261;for(const ch of day){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return cards[Math.abs(h)%cards.length];
  }
  function renderFiveMinute(card){
    const box=document.getElementById('coach-five-minute-content');if(!box||!card)return;
    const details=(card.deepDive||[]).slice(0,3);
    box.innerHTML='<div class="coach-five-minute-card"><div class="coach-five-minute-head"><span>5 דקות</span><strong>'+esc(card.title)+'</strong></div><p>'+esc(card.body||card.application||'')+'</p><div class="coach-five-steps"><div><b>1. להבין</b><span>'+esc(card.principle||card.body||'מה הבעיה המקצועית?')+'</span></div><div><b>2. לראות</b><span>'+esc(details[0]?.text||'חפש התנהגות אחת שאפשר לזהות במהלך חזרות.')+'</span></div><div><b>3. ליישם</b><span>'+esc(card.application||'בחר שינוי אחד ונסה אותו באימון הבא.')+'</span></div></div></div>';
  }

  function renderNextCount(){
    const el=document.getElementById('coach-saved-count');if(!el)return;
    const n=nextPractice().items.length;el.textContent=n? n+' רעיונות שמורים לאימון הבא':'עדיין לא שמרת רעיונות מהפיד';
  }

  function initMain(){
    renderAcademy();renderContext();renderFiveMinute(selectFiveMinute());renderNextCount();
    document.getElementById('coach-five-minute-refresh')?.addEventListener('click',()=>{
      const cards=(root.CoachFeedData?.COACH_FEED_CARDS||[]).filter(x=>x.type!=='question');
      if(!cards.length)return;
      renderFiveMinute(cards[Math.floor(Math.random()*cards.length)]);
    });
    document.addEventListener('coach:next-practice-changed',renderNextCount);
    document.querySelectorAll('.coach-pro-nav a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
      const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}
    }));
  }

  augmentFeed();
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMain,{once:true});else initMain();
  }

  root.CoachPro={ACADEMY,context,contextSummary,nextPractice,saveNext,renderNextCount,labToFeed};
})(window);
