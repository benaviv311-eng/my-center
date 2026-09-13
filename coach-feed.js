(function(root,factory){
  const api=factory(root&&root.CoachFeedData?root.CoachFeedData:null);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachFeed=api;
})(typeof window!=='undefined'?window:globalThis,function(browserData){
  'use strict';

  const KNOWN_TOPICS=['sport-psychology','coaching-psychology','movement-psychology','explosive-power','coaching-language','volleyball-approaches'];

  function normalizeCard(card){
    return Object.assign({tags:[],body:'',application:'',applicationDetails:'',source:'',sourceKind:'',evidenceStrength:'',image:'',imageAlt:'',challenge:false,deepDive:[]},card||{});
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

  function renderImage(card){
    if(!card.image||!card.imageAlt) return '';
    return `<img class="coach-card-image" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.imageAlt)}" loading="lazy" decoding="async">`;
  }

  function applicationExpansion(card){
    if(card.applicationDetails) return card.applicationDetails;
    return `הפוך את הרעיון למשימה אחת ברורה, קבע סימן הצלחה שאפשר לראות, וצפה בכמה חזרות לפני שינוי נוסף. ${card.application||''}`.trim();
  }

  function learningSections(card){
    const item=normalizeCard(card);
    const custom=Array.isArray(item.deepDive)?item.deepDive.filter(section=>section&&section.title&&section.text):[];
    if(custom.length>=4) return custom;

    const focus=item.principle||item.explanation||item.body||item.question||item.title||'';
    const apply=item.application||applicationExpansion(item);
    const tag=item.tags&&item.tags.length?item.tags[0]:item.title;
    const title=item.title||'הרעיון';

    const byTopic={
      'sport-psychology':[
        {title:'מה העיקרון?',text:focus},
        {title:'מה לחפש אצל הספורטאי?',text:`חפש שינוי בקשב, בביטחון או בבחירה אחרי הצלחה וטעות סביב ${tag}. המטרה היא לזהות מה משתנה בהתנהגות, לא רק בתוצאה.`},
        {title:'איך ליישם?',text:apply},
        {title:'שאלת מאמן',text:`שאל: מה יעזור לך לבצע את הפעולה הבאה בצורה ברורה יותר? השאלה מחזירה את הקשב לצעד הבא במקום להישאר בטעות הקודמת.`},
        {title:'טעות נפוצה',text:'להוסיף הרבה הסברים דווקא כשהספורטאי מוצף. במצב כזה עדיף מסר קצר, משימה ברורה ומדד הצלחה אחד.'}
      ],
      'coaching-psychology':[
        {title:'עיקרון אימוני',text:focus},
        {title:'מה המאמן עושה?',text:`צפה בכמה חזרות, בחר התערבות אחת בלבד, ואז תן לספורטאי הזדמנות לנסות את השינוי לפני משוב נוסף.`},
        {title:'דוגמה באימון',text:apply},
        {title:'טעות נפוצה',text:'לתת פתרון מלא מהר מדי. זה יכול לפתור את החזרה הקרובה אבל לצמצם עצמאות וקבלת החלטות.'},
        {title:'בדיקה עצמית למאמן',text:`אחרי ההתערבות שאל את עצמך: האם השחקן מבין טוב יותר את ${title}, או רק מבצע כרגע את מה שאמרתי?`}
      ],
      'movement-psychology':[
        {title:'עיקרון למידה',text:focus},
        {title:'Cue חיצוני',text:`נסח את ההנחיה דרך המטרה, הכדור או הסביבה. במקום לפרט איברי גוף, תן לספורטאי תוצאה חיצונית ברורה שקשורה ל־${tag}.`},
        {title:'שינוי תנאים',text:apply},
        {title:'בדיקת העברה',text:'אחרי כמה חזרות שנה מעט מרחק, קצב, זווית או מידע מוקדם ובדוק אם הפתרון נשמר גם כשהמצב משתנה.'},
        {title:'טעות נפוצה',text:'להשאיר את התרגיל צפוי מדי לאורך זמן. דיוק חשוב, אבל למידה למשחק דורשת גם הסתגלות וקבלת החלטות.'}
      ],
      'explosive-power':[
        {title:'מטרת האימון',text:focus},
        {title:'מינון',text:'העדף סטים קצרים ואיכותיים עם מספיק מנוחה כדי לשמור על מהירות, גובה או חדות. הנפח צריך להתאים לרמת הספורטאי ולעומס השבועי.'},
        {title:'איכות ביצוע',text:`עקוב אחרי סימן איכות פשוט שקשור ל־${tag}: גובה, מהירות, שליטת נחיתה או חדות תנועה. אם האיכות יורדת בבירור, אל תרדוף אחרי עוד חזרות.`},
        {title:'מנוחה / עצירה',text:'כשקצב הביצוע נופל, הנחיתות נעשות כבדות או הטכניקה מתפרקת, הארך מנוחה, הפחת נפח או סיים את הסט.'},
        {title:'יישום באימון',text:apply}
      ],
      'coaching-language':[
        {title:'מה לומר',text:`בחר משפט קצר שמכוון לפעולה הבאה. סביב ${title}, העדף Cue אחד שהספורטאי יכול לנסות מיד.`},
        {title:'מה לא לומר',text:'הימנע מרצף ארוך של תיקונים או מניסוחים שמתארים רק מה אסור לעשות. הם מעמיסים מידע בלי להבהיר את הפעולה הרצויה.'},
        {title:'מתי לומר',text:'תן את המסר ברגע שבו אפשר לנסות אותו מיד: לפני החזרה, בהפסקה קצרה או אחרי רצף שבו זיהית דפוס ברור.'},
        {title:'מה לחפש בתגובה',text:'בדוק אם השחקן משנה התנהגות, לא רק אם הוא מהנהן. אם אין שינוי, החלף ניסוח או משימה במקום לחזור על אותו משפט חזק יותר.'},
        {title:'יישום',text:apply}
      ],
      'volleyball-approaches':[
        {title:'מתי הגישה מתאימה',text:focus},
        {title:'מבנה תרגיל',text:`הגדר מטרה אחת, אילוץ אחד או שניים, וסיטואציה שמכריחה את השחקנים לפתור את הבעיה הקשורה ל־${tag}.`},
        {title:'יתרון',text:'הגישה יכולה לחבר טכניקה להחלטה ולסביבה במקום לתרגל פעולה מנותקת בלבד.'},
        {title:'מגבלה',text:'אם הדרישה מורכבת מדי לרמת הקבוצה, השחקנים עלולים רק לשרוד את התרגיל. במקרה כזה פשט את התנאים ושמור על הכוונה המקצועית.'},
        {title:'יישום באימון',text:apply}
      ]
    };

    return byTopic[item.topic]||[
      {title:'העיקרון',text:focus},
      {title:'למה זה חשוב',text:`חבר את ${title} להתנהגות שאפשר לראות באימון ולא רק להסבר תאורטי.`},
      {title:'איך לבצע',text:apply},
      {title:'מה לבדוק',text:'בחר מדד פשוט, תן כמה ניסיונות ורק אז שנה את המשימה או את ה־Cue.'}
    ];
  }

  function renderLearningGrid(card){
    const sections=learningSections(card);
    return `<div class="coach-learning-grid">${sections.map(section=>`<section class="coach-learning-section"><h4>${escapeHtml(section.title)}</h4><p>${escapeHtml(section.text)}</p></section>`).join('')}</div>`;
  }

  function renderApplication(card){
    if(!card.application) return '';
    const panelId=`coach-expand-${escapeHtml(card.id)}-application`;
    return `<div class="coach-application">
      <button type="button" class="coach-expand-toggle" data-coach-expand="application" aria-expanded="false" aria-controls="${panelId}">
        <strong>ליישום באימון</strong><span class="coach-expand-icon" aria-hidden="true">⌄</span>
      </button>
      <p>${escapeHtml(card.application)}</p>
      <div class="coach-expand-panel coach-rich-expand-panel" id="${panelId}" hidden>
        ${renderLearningGrid(card)}
      </div>
    </div>`;
  }

  function renderQuestionDeepDive(card){
    const panelId=`coach-expand-${escapeHtml(card.id)}-deep-dive`;
    return `<div class="coach-question-deep-dive">
      <button type="button" class="coach-expand-toggle coach-deep-dive-toggle" data-coach-expand="deep-dive" aria-expanded="false" aria-controls="${panelId}">
        <strong>להעמקה</strong><span class="coach-expand-icon" aria-hidden="true">⌄</span>
      </button>
      <div class="coach-expand-panel coach-rich-expand-panel" id="${panelId}" hidden>
        ${renderLearningGrid(card)}
      </div>
    </div>`;
  }

  function renderQuestion(card,topics){
    const options=card.options.map((option,index)=>`<button type="button" class="coach-option" data-question-option="${index}">${escapeHtml(option)}</button>`).join('');
    const classes=`coach-feed-card coach-question-card${card.challenge?' coach-challenge-card':''}`;
    const challenge=card.challenge?'<div class="coach-challenge-eyebrow">Coach Challenge</div>':'';
    return `<article class="${classes}" data-card-id="${escapeHtml(card.id)}">
      ${renderImage(card)}
      ${challenge}
      ${renderMeta(card,topics)}
      <h3>${escapeHtml(card.title)}</h3>
      <p class="coach-question-text">${escapeHtml(card.question)}</p>
      <div class="coach-options">${options}</div>
      <div class="coach-question-feedback" data-question-feedback hidden></div>
      ${renderQuestionDeepDive(card)}
    </article>`;
  }

  function renderStandard(card,topics){
    return `<article class="coach-feed-card" data-card-id="${escapeHtml(card.id)}">
      ${renderImage(card)}
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
        feedback.innerHTML=`<strong>${result.isCorrect?'נכון':'עדיף לבחור אחרת'}</strong><p class="coach-feedback-explanation">${escapeHtml(result.explanation)}</p><p><b>העיקרון:</b> ${escapeHtml(result.principle)}</p><p><b>ליישום:</b> ${escapeHtml(result.application)}</p>`;
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

  const api={normalizeCard,filterCards,resolveInitialTopic,mixFeed,buildFeedCycle,answerQuestion,learningSections,renderLearningGrid,renderCard,initCoachFeed};

  if(typeof document!=='undefined'){
    const boot=()=>initCoachFeed(document,{});
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }

  return api;
});