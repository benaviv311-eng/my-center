(function(){
  const KEY='my-center-oud-progress-v1';

  const lessons=[
    {title:'ישיבה, אחיזה וצליל פתוח',goal:'לייצר צליל נקי בלי מתח מיותר',points:['שב כך שהעוד נשען על הגוף ולא על יד שמאל.','אגודל שמאל אינו לוחץ את הצוואר בכוח.','נגן כל מיתר פתוח 8 פעמים והקשב לאורך הצליל.'],exercise:'2 דקות: מיתר אחד, פריטה אחת בכל 2 שניות. המטרה היא שכל הצלילים יישמעו דומים.'},
    {title:'רישה — מטה ומעלה',goal:'לייצב יד ימין וקצב',points:['התחל בתנועה קטנה מתוך שורש כף היד.','תרגל ↓ ↑ באותו עומק ובאותה עוצמה.','אל תגדיל מהירות אם הצליל בעלייה חלש מהצליל בירידה.'],exercise:'4×30 שניות על מיתר פתוח: ↓↑ רצוף, מנוחה 15 שניות בין הסטים.'},
    {title:'מעבר בין מיתרים',goal:'לפגוע במיתר הנכון בלי להסתכל כל הזמן',points:['נגן זוגות מיתרים סמוכים.','שמור את הרישה קרובה למיתרים.','תרגל גם מעבר נמוך→גבוה וגם גבוה→נמוך.'],exercise:'C–F–A–d–g–c ואז חזרה, 5 פעמים לאט.'},
    {title:'יד שמאל ואינטונציה',goal:'למצוא מיקום מדויק בלי סריגים',points:['נגן צליל יעד ושיר אותו לפני שאתה מנגן.','הנח את האצבע, אל תגרור אותה אוטומטית למקום.','תקן לפי האוזן ורק אז חזור.'],exercise:'בחר שני צלילים על אותו מיתר ונגן ביניהם 20 פעמים בקצב איטי.'},
    {title:'משפטים קצרים ונשימה',goal:'לעבור מתרגיל למוזיקה',points:['כל משפט 3–5 צלילים.','השאר שקט קטן בין משפטים.','סיים חלק מהמשפטים על צליל הבית וחלק השאר פתוחים.'],exercise:'דקה אחת: רק 3 צלילים. אסור לנגן סולם שלם.'},
    {title:'ג׳ינס ביאתי על D',goal:'לשמוע את הצבע של הביאתי',points:['D – E חצי־במול – F – G.','עצור הרבה על D ו־F.','אל תתייחס לחצי־במול כמו “תו מוזר”; למד אותו כצליל עצמאי.'],exercise:'D–E½♭–F–G–F–E½♭–D ואז שלושה משפטים שונים מאותם צלילים.'},
    {title:'ג׳ינס חיג׳אז על D',goal:'לשלוט בקפיצה הצבעונית בין E♭ ל־F♯',points:['D – E♭ – F♯ – G.','נגן לאט במיוחד את E♭→F♯.','בנה משפט שמראה את הצבע בלי לעלות ולרדת מכנית.'],exercise:'חזור 8 פעמים על D–E♭–F♯–G, ואז אלתר 60 שניות.'},
    {title:'קצב — מקסום ומלפוף',goal:'להרגיש משפט בתוך פעמה',points:['אמור את המקצב בקול לפני הנגינה.','נגן טוניקה בלבד על הפעימות החשובות.','רק אחר כך הוסף משפטים.'],exercise:'2 דקות מקסום + 2 דקות מלפוף, בלי להאיץ.'},
    {title:'קישוטים וטרמולו',goal:'להוסיף הבעה בלי להסתיר אינטונציה',points:['קישוט הוא תבלין, לא המשפט עצמו.','תרגל slide קצר, hammer/pull וטרמולו בנפרד.','טרמולו יציב מתחיל מתנועה קטנה ורפויה.'],exercise:'בחר משפט אחד ונגן אותו פעם נקי, פעם עם קישוט אחד בלבד.'},
    {title:'תקסים ראשון',goal:'לבנות סיפור מוזיקלי קצר',points:['התחל בטוניקה ובג׳ינס הראשי.','חזור על מוטיב קטן ושנה רק פרט אחד.','בנה מתח ואז חזור הביתה בבירור.'],exercise:'הקלט תקסים של 90 שניות. אחר כך הקשב וסמן: בית, שאלה, פיתוח, חזרה.'}
  ];

  const maqams=[
    {id:'bayati',name:'ביאתי D',notes:['D','E½♭','F','G'],desc:'צבע חם וגמיש. התחל מג׳ינס קצר לפני הרחבת המקאם.',exercise:'נגן 4 צלילים הלוך-חזור, ואז משפט שמתחיל ב-D, עולה עד F או G וחוזר ל-D.'},
    {id:'hijaz',name:'חיג׳אז D',notes:['D','E♭','F♯','G'],desc:'המרווח בין E♭ ל-F♯ נותן את הצבע המזוהה מאוד של החיג׳אז.',exercise:'תרגל את E♭→F♯ לאט ובדיוק; אחר כך בנה משפט עם עצירה על G וחזרה ל-D.'},
    {id:'rast',name:'ראסט C',notes:['C','D','E½♭','F'],desc:'אחד הצבעים המרכזיים במוזיקה הערבית. ה-E החצי־במול הוא לב הצליל.',exercise:'השווה E טבעי מול E חצי־במול ושיר את ההבדל לפני שאתה מנגן.'},
    {id:'kurd',name:'כורד D',notes:['D','E♭','F','G'],desc:'מבנה ישיר שקל לשמוע ולבנות ממנו משפטים ראשונים.',exercise:'אלתר דקה עם D–E♭–F בלבד, ואז הוסף G.'},
    {id:'ajam',name:'עג׳ם C',notes:['C','D','E','F'],desc:'צבע מז׳ורי ברור; טוב לתרגול אינטונציה והשוואה מול ראסט.',exercise:'נגן C–D–E–F ואז החלף E ב-E חצי־במול והקשב איך האופי משתנה.'},
    {id:'nahawand',name:'נהוונד C',notes:['C','D','E♭','F'],desc:'צבע מינורי מוכר שנותן בסיס נוח לאלתור מלודי.',exercise:'בנה שתי שאלות שמסתיימות על D/E♭ ותשובה שנוחתת על C.'}
  ];

  const practicePools=[
    ['צליל ורישה','5 דק׳','מיתרים פתוחים ↓↑, חפש צליל אחיד ונקי.'],
    ['אינטונציה','5 דק׳','בחר שני צלילים על מיתר אחד ושיר אותם לפני הנגינה.'],
    ['ג׳ינס','5 דק׳','בחר ביאתי / חיג׳אז / ראסט ונגן רק 4 צלילים.'],
    ['משפטים','5 דק׳','3–5 צלילים למשפט, עם שקט בין משפטים.'],
    ['קצב','5 דק׳','מקסום או מלפוף: קודם מחיאות/גוף, אחר כך עוד.'],
    ['תקסים','5 דק׳','הקלט 60–90 שניות עם התחלה, פיתוח וחזרה.'],
    ['חיקוי מהאוזן','5 דק׳','שיר משפט קצר ואז מצא אותו על הכלי.'],
    ['טרמולו','5 דק׳','30 שניות עבודה + 15 שניות מנוחה × 4.']
  ];

  function load(){
    try{return new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(_){return new Set()}
  }
  function save(set){localStorage.setItem(KEY,JSON.stringify([...set]))}
  function renderProgress(){
    const done=load();
    const n=document.getElementById('oud-progress-number');
    const bar=document.getElementById('oud-progress-bar');
    if(n)n.textContent=done.size+'/10';
    if(bar)bar.style.width=(done.size/10*100)+'%';
    document.querySelectorAll('[data-lesson]').forEach(el=>{
      const id=el.dataset.lesson;
      const yes=done.has(id);
      el.classList.toggle('done',yes);
      const btn=el.querySelector('[data-complete]');
      if(btn){btn.classList.toggle('done',yes);btn.textContent=yes?'✓ הושלם':'סמן כהושלם'}
    });
  }
  function renderLessons(){
    const host=document.getElementById('oud-lessons');if(!host)return;
    host.innerHTML=lessons.map((lesson,i)=>`
      <details class="oud-lesson" data-lesson="${i+1}">
        <summary><span class="oud-lesson-num">${i+1}</span><span>${lesson.title}</span></summary>
        <div class="oud-lesson-body">
          <div class="meta"><b>מטרה:</b> ${lesson.goal}</div>
          <ul>${lesson.points.map(x=>`<li>${x}</li>`).join('')}</ul>
          <div class="oud-maqam-exercise"><b>תרגיל:</b> ${lesson.exercise}</div>
          <div class="card-actions"><button class="oud-complete" data-complete type="button">סמן כהושלם</button></div>
        </div>
      </details>`).join('');
    renderProgress();
  }
  function renderMaqam(id='bayati'){
    const tabs=document.getElementById('oud-maqam-tabs');
    const host=document.getElementById('oud-maqam-view');
    if(!tabs||!host)return;
    tabs.innerHTML=maqams.map(m=>`<button type="button" class="oud-maqam-tab ${m.id===id?'active':''}" data-maqam="${m.id}">${m.name}</button>`).join('');
    const m=maqams.find(x=>x.id===id)||maqams[0];
    host.innerHTML=`<article class="oud-maqam-card"><h3>${m.name}</h3><p class="meta">${m.desc}</p><div class="oud-notes">${m.notes.map((n,i)=>`<span class="oud-note ${i===0?'home':''}">${n}</span>`).join('')}</div><div class="oud-maqam-exercise"><b>תרגיל:</b> ${m.exercise}</div></article>`;
  }
  function shuffle(items){
    const a=items.slice();
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  function renderPractice(){
    const host=document.getElementById('oud-practice');if(!host)return;
    const picked=shuffle(practicePools).slice(0,4);
    host.innerHTML=picked.map(x=>`<div class="oud-practice-step"><div class="time">${x[1]}</div><b>${x[0]}</b><span>${x[2]}</span></div>`).join('');
  }
  document.addEventListener('click',e=>{
    const complete=e.target.closest('[data-complete]');
    if(complete){
      const root=complete.closest('[data-lesson]');if(!root)return;
      const done=load(),id=root.dataset.lesson;
      if(done.has(id))done.delete(id);else done.add(id);
      save(done);renderProgress();return;
    }
    const tab=e.target.closest('[data-maqam]');
    if(tab){renderMaqam(tab.dataset.maqam);return}
    if(e.target.closest('#oud-generate-practice')){renderPractice();if(typeof toast==='function')toast('נבנה אימון חדש')}
  });
  renderLessons();renderMaqam();renderPractice();
})();