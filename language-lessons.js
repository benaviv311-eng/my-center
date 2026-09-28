(function(root){
  const STORAGE_KEY='my-center-languages-v1';
  const LANGUAGES={
    ar:{name:'ערבית',code:'AR'},
    it:{name:'איטלקית',code:'IT'},
    ru:{name:'רוסית',code:'RU'},
    es:{name:'ספרדית',code:'ES'}
  };
  const LESSONS=[
    {n:1,topic:'basics',icon:'👋',name:'היכרות וברכות',description:'שלום, תודה ושיחה בסיסית'},
    {n:2,topic:'numbers',icon:'🔢',name:'מספרים וכמויות',description:'מספרים, כמויות ומחירים'},
    {n:3,topic:'family',icon:'👥',name:'משפחה ואנשים',description:'משפחה, חברים והיכרות'},
    {n:4,topic:'food',icon:'🍽️',name:'אוכל ושתייה',description:'הזמנה, רעב, צמא ומסעדה'},
    {n:5,topic:'home',icon:'🏠',name:'בית וחפצים',description:'חדרים וחפצים שימושיים'},
    {n:6,topic:'directions',icon:'🧭',name:'מקומות וכיוונים',description:'ימינה, שמאלה, קרוב ורחוק'},
    {n:7,topic:'verbs',icon:'⚡',name:'פעלים בסיסיים',description:'ללכת, לבוא, לראות ולדבר'},
    {n:8,topic:'adjectives',icon:'✨',name:'תארים ותיאור',description:'לתאר אנשים ודברים'},
    {n:9,topic:'time',icon:'🕒',name:'זמן ויום־יום',description:'היום, מחר, עכשיו וזמן'},
    {n:10,topic:'travel',icon:'✈️',name:'שיחה שימושית ונסיעות',description:'סיכום שימושי במצבים מהחיים'}
  ];

  function today(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function load(){
    try{
      const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      s.lessonProgress=s.lessonProgress||{};
      s.lessonActivity=s.lessonActivity||{};
      return s;
    }catch(e){return {lessonProgress:{},lessonActivity:{}};}
  }
  function save(s){localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}
  function completed(lang,state=load()){return Array.from(new Set(state.lessonProgress?.[lang]||[])).map(Number).filter(n=>n>=1&&n<=10).sort((a,b)=>a-b);}
  function current(lang,state=load()){const done=new Set(completed(lang,state));return LESSONS.find(x=>!done.has(x.n))?.n||10;}
  function percent(lang,state=load()){return Math.round(completed(lang,state).length/LESSONS.length*100);}
  function isUnlocked(lang,n,state=load()){return n===1||completed(lang,state).includes(n-1);}
  function lesson(n){return LESSONS.find(x=>x.n===Number(n))||LESSONS[0];}
  function lessonForTopic(topic){return LESSONS.find(x=>x.topic===topic)||LESSONS[0];}
  function url(lang,n){const l=lesson(n);return 'language-study.html?lang='+encodeURIComponent(lang)+'&lesson='+l.n+'&topic='+encodeURIComponent(l.topic);}
  function complete(lang,n){
    const state=load();
    state.lessonProgress[lang]=completed(lang,state);
    if(!state.lessonProgress[lang].includes(Number(n)))state.lessonProgress[lang].push(Number(n));
    state.lessonProgress[lang].sort((a,b)=>a-b);
    const day=today();
    state.lessonActivity[day]=Array.isArray(state.lessonActivity[day])?state.lessonActivity[day]:[];
    const key=lang+':'+Number(n);
    if(!state.lessonActivity[day].includes(key))state.lessonActivity[day].push(key);
    save(state);
    return state;
  }
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function days7(){
    const out=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);out.push({key:today(d),label:['א','ב','ג','ד','ה','ו','ש'][d.getDay()]});}
    return out;
  }
  function weeklyChart(state){
    const days=days7();
    const counts=days.map(d=>(state.lessonActivity?.[d.key]||[]).length);
    const max=Math.max(1,...counts);
    return '<div class="lesson-week-chart">'+days.map((d,i)=>'<div class="lesson-week-day"><div class="lesson-week-bar-wrap"><i style="height:'+Math.max(8,Math.round(counts[i]/max*100))+'%"></i></div><strong>'+counts[i]+'</strong><small>'+d.label+'</small></div>').join('')+'</div>';
  }
  function stepHtml(lang,l,state){
    const done=completed(lang,state);
    const isDone=done.includes(l.n);
    const cur=current(lang,state)===l.n&&!isDone;
    const unlocked=isUnlocked(lang,l.n,state);
    const cls=isDone?'done':cur?'current':unlocked?'open':'locked';
    const mark=isDone?'✓':cur?'▶':unlocked?String(l.n):'🔒';
    return '<a class="lesson-step '+cls+'" href="'+url(lang,l.n)+'" title="'+esc(l.name)+(unlocked?'':' · אפשר לדלג בכל זאת')+'"><span>'+mark+'</span><small>'+l.n+'</small></a>';
  }
  function courseHtml(lang,state){
    const meta=LANGUAGES[lang];
    const done=completed(lang,state);
    const next=current(lang,state);
    const nextLesson=lesson(next);
    return '<article class="lesson-course-card" data-lesson-course="'+lang+'">'+
      '<div class="lesson-course-head"><div><span class="language-card-code">'+meta.code+'</span><div><strong>'+meta.name+'</strong><small>'+done.length+'/10 שיעורים · '+percent(lang,state)+'%</small></div></div><a class="lesson-continue" href="'+url(lang,next)+'">'+(done.length===10?'חזרה למסלול':'המשך: '+nextLesson.name)+' ←</a></div>'+
      '<div class="lesson-progress-track"><i style="width:'+percent(lang,state)+'%"></i></div>'+
      '<div class="lesson-steps">'+LESSONS.map(l=>stepHtml(lang,l,state)).join('')+'</div>'+
      '<div class="lesson-current-copy">'+(done.length===10?'כל 10 השיעורים הושלמו ✓':'השיעור הבא: <b>'+next+'. '+esc(nextLesson.name)+'</b>')+'</div>'+
    '</article>';
  }
  function renderDashboard(){
    const root=document.getElementById('language-lessons-dashboard');
    if(!root)return;
    const state=load();
    root.innerHTML='<div class="lesson-dashboard-head"><div><span class="language-hub-eyebrow">מסלול 1–10</span><h2>השיעורים שלי</h2><p>כל שיעור כולל מילים, משפטים, כרטיסיות, תרגול ואתגר מסכם.</p></div><div class="lesson-dashboard-legend"><span>✓ הושלם</span><span>▶ נוכחי</span><span>🔒 בהמשך — עדיין ניתן לדלג</span></div></div>'+
      '<div class="lesson-courses">'+Object.keys(LANGUAGES).map(lang=>courseHtml(lang,state)).join('')+'</div>'+
      '<div class="lesson-weekly"><div><span class="language-hub-eyebrow">7 ימים אחרונים</span><h3>גרף התקדמות</h3><p>מספר שיעורים שהושלמו בכל יום.</p></div>'+weeklyChart(state)+'</div>';
    Object.keys(LANGUAGES).forEach(lang=>{
      const card=document.querySelector('[data-language-card="'+lang+'"]');
      if(!card)return;
      const progress=card.querySelector('[data-card-progress]');
      if(progress)progress.textContent=completed(lang,state).length===10?'10/10 הושלם ✓':'שיעור '+current(lang,state)+' מתוך 10';
    });
  }
  function renderStudyTrack(lang,n){
    const root=document.getElementById('study-lesson-track');
    if(!root)return;
    const state=load();
    const l=lesson(n);
    root.innerHTML='<div class="study-lesson-head"><div><span>שיעור '+l.n+' מתוך 10</span><strong>'+esc(l.icon+' '+l.name)+'</strong></div><span>'+percent(lang,state)+'% במסלול</span></div>'+
      '<div class="lesson-progress-track"><i style="width:'+percent(lang,state)+'%"></i></div>'+
      '<div class="lesson-steps study-lesson-steps">'+LESSONS.map(x=>stepHtml(lang,x,state)).join('')+'</div>';
  }

  root.LanguageLessons={LANGUAGES,LESSONS,load,save,completed,current,percent,isUnlocked,lesson,lessonForTopic,url,complete,renderDashboard,renderStudyTrack};
})(window);
