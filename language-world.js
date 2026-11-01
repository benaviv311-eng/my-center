(function(root,factory){
  const api=factory(root,root.LanguageWorldModel,root.LanguageMastery);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.LanguageWorld=api;
})(typeof window!=='undefined'?window:globalThis,function(root,Model,Mastery){
  'use strict';
  const STORE='my-center-language-mastery-v1';
  const WORLD_STORE='my-center-language-world-v1';
  const LANG_NAMES={ar:'ערבית',it:'איטלקית',ru:'רוסית',es:'ספרדית'};
  const LANG_LOCALES={ar:'ar-SA',it:'it-IT',ru:'ru-RU',es:'es-ES'};
  const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const $=id=>root.document?.getElementById(id);
  const validLang=lang=>Model?.LANGUAGE_CODES.includes(lang);
  const places=lang=>Model?.getPlaces(lang)||[];
  function loadJSON(key,fallback){try{return JSON.parse(root.localStorage?.getItem(key)||'null')||fallback;}catch(e){return fallback;}}
  function saveJSON(key,value){try{root.localStorage?.setItem(key,JSON.stringify(value));}catch(e){/* private mode: the current session remains usable */}}
  let memory=Mastery?.parse(loadJSON(STORE,{}))||{byLanguage:{}};
  let achievements=loadJSON(WORLD_STORE,{done:{}});
  if(!achievements||typeof achievements!=='object'||!achievements.done||typeof achievements.done!=='object')achievements={done:{}};
  let selectedLang=validLang(loadJSON('my-center-world-language','ar'))?loadJSON('my-center-world-language','ar'):'ar';
  let activeId=null;
  let stepIndex=0;
  let result=null;
  let chosenIndex=null;
  let solved=0;
  let hints=false;
  let voiceMessage='';
  let completion=null;

  function phraseHTML(line,lang,{hebrew=true}={}){
    const rtl=lang==='ar';
    const primary=(lang==='ar'||lang==='ru')?line.pron||line.target:line.target;
    const secondary=(lang==='ar'||lang==='ru')?line.target:line.pron;
    return `<span class="world-phrase"><strong class="world-phrase-primary" dir="${rtl?'rtl':'auto'}">${esc(primary)}</strong>${secondary?`<small class="world-phrase-secondary" dir="${rtl?'rtl':'auto'}">${esc(secondary)}</small>`:''}${hebrew?`<span class="world-phrase-he">${esc(line.he)}</span>`:''}</span>`;
  }
  function coachRecommendation(source,lang,now=Date.now()){
    const firstPlace=places(lang)[0]?.id||'cafe';
    const due=Mastery?.due(source,lang,now)||[];
    const records=Mastery?.parse(source).byLanguage?.[lang]||{};
    const weak=due[0]||Object.entries(records).filter(([,row])=>row.status==='review').map(([key])=>({key}))[0];
    if(weak){const [placeId,stepText]=weak.key.split(':');if(Model.getMission(lang,placeId))return {placeId,stepIndex:Number(stepText)||0,reason:'יש כאן משפט שכדאי לחזק שוב. נחזור אליו בתוך שיחה אמיתית.'};}
    const undone=places(lang).find(place=>!achievements.done?.[lang]?.[place.id]);
    return {placeId:undone?.id||firstPlace,stepIndex:0,reason:undone?'משימה חדשה תעזור לך להשתמש במילים בהקשר, ולא רק לזהות אותן.':'כל המשימות הושלמו. נסה אותן שוב בלי רמזים כדי להעמיק את השליטה.'};
  }
  function worldCard(place,lang){
    const done=!!achievements.done?.[lang]?.[place.id];
    return `<button type="button" class="world-place world-place-${place.id}" data-world-place="${place.id}" aria-label="פתח את ${esc(place.title)} ב${esc(LANG_NAMES[lang])}"><span class="world-place-picture" aria-hidden="true"><span class="world-place-symbol">${place.icon}</span></span><span class="world-place-body"><small>${esc(place.subtitle)} ${done?'· הושלם ✓':''}</small><strong>${esc(place.title)}</strong><span>${esc(place.goal)}</span><b>${done?'שחק שוב':'צא להרפתקה'} <span aria-hidden="true">←</span></b></span></button>`;
  }
  function missionHTML(){
    if(!activeId)return '';
    const mission=Model.getMission(selectedLang,activeId);
    if(!mission)return '';
    const step=mission.steps[stepIndex];
    if(!step)return '';
    const done=!!result&&result.nextIndex===null;
    const options=step.choices.map((choice,i)=>{
      const choiceState=result?(i===step.correctIndex?' is-right':i===chosenIndex?' is-wrong':''):'';
      return `<button type="button" class="world-choice${choiceState}" data-world-choice="${i}" ${result?'disabled':''}><span class="world-choice-index">${i+1}</span>${phraseHTML(choice,selectedLang,{hebrew:hints})}</button>`;
    }).join('');
    return `<div class="world-mission" id="world-active-mission" aria-label="משימת ${esc(mission.title)}">
      <div class="world-mission-top"><div><span class="world-kicker">${mission.icon} ${esc(mission.title)}</span><h3>דבר עם המקומיים</h3></div><button class="world-close" type="button" data-world-close aria-label="סגור משימה">✕</button></div>
      <div class="world-step-progress" aria-label="שלב ${stepIndex+1} מתוך ${mission.steps.length}">${mission.steps.map((_,i)=>`<i class="${i<=stepIndex?'is-on':''}"></i>`).join('')}</div>
      <div class="world-npc"><span class="world-avatar" aria-hidden="true">${mission.icon}</span><div><small>מקומי · ${esc(LANG_NAMES[selectedLang])}</small>${phraseHTML(step.npc,selectedLang)}<button type="button" class="world-say" data-audio-lang="${selectedLang}" data-audio-text="${esc(step.npc.target)}">🔊 השמע משפט</button></div></div>
      <p class="world-answer-label">מה תענה?</p><div class="world-options">${options}</div>
      <button class="world-hint-toggle" data-world-hints type="button" aria-pressed="${hints}">${hints?'🙈 הסתר פירושים':'💡 הצג פירושים לעזרה'}</button>
      ${result?`<div class="world-feedback ${result.correct?'is-success':'is-try'}" role="status"><span class="world-feedback-title">${result.correct?'✓ תשובה מצוינת!':'↻ השיחה הסתבכה מעט — לומדים וממשיכים'}</span><div class="world-reply">${phraseHTML(result.reply,selectedLang)}</div><p>${esc(result.explain)}</p>${result.correct?'':`<div class="world-correct-answer"><b>כדאי לומר:</b>${phraseHTML(result.answer,selectedLang)}</div>`}<div class="world-feedback-actions"><button type="button" class="world-next" data-world-next>${done?'סיים את המשימה ✓':'המשך בשיחה ←'}</button><button type="button" class="world-say" data-audio-lang="${selectedLang}" data-audio-text="${esc(result.answer.target)}">🔊 תרגל את המשפט</button><button type="button" class="world-say" data-world-voice>🎙️ נסה לומר בעצמך</button></div><div class="world-voice-message" id="world-voice-result" aria-live="polite">${esc(voiceMessage)}</div></div>`:''}
    </div>`;
  }

  function render(lang){
    if(validLang(lang))selectedLang=lang;
    const el=$('language-world-root');
    if(!el)return;
    const done=places(selectedLang).filter(place=>achievements.done?.[selectedLang]?.[place.id]).length;
    el.innerHTML=`<div class="world-heading"><div><span class="world-kicker">✦ הרפתקה שמלמדת לדבר</span><h2>ללמוד שפה. <em>לחיות אותה.</em></h2><p>העיר מחכה לך. בחר מקום, דבר עם הדמויות וראה איך הבחירות שלך משנות את השיחה.</p></div><div class="world-counter"><strong>${done}<small>/3</small></strong><span>משימות הושלמו</span></div></div>
      <div class="world-language-switch" aria-label="שפה להרפתקה">${Model.LANGUAGE_CODES.map(code=>`<button type="button" data-world-language="${code}" class="${selectedLang===code?'active':''}" aria-pressed="${selectedLang===code}">${esc(LANG_NAMES[code])}</button>`).join('')}</div>
      <div class="world-places">${places(selectedLang).map(place=>worldCard(place,selectedLang)).join('')}</div>
      ${completion&&completion.lang===selectedLang?`<div class="world-completion" role="status"><span class="world-completion-icon">🏆</span><div><strong>השלמת את המשימה: ${esc(completion.title)}!</strong><p>כל הכבוד. הצלחת ב־${completion.solved} מתוך ${completion.total} בחירות. המשפטים שדורשים עוד תרגול מחכים לך אצל המאמן.</p></div><a href="#language-coach" class="world-completion-link">למאמן האישי ←</a></div>`:''}
      <div id="world-stage">${missionHTML()}</div>`;
    bindWorld();
  }

  function renderCoach(){
    const el=$('language-coach-root');
    if(!el)return;
    const stats=Mastery.stats(memory,selectedLang);
    const due=Mastery.due(memory,selectedLang);
    const suggestion=coachRecommendation(memory,selectedLang);
    const place=places(selectedLang).find(p=>p.id===suggestion.placeId);
    el.innerHTML=`<div class="coach-top"><div><span class="world-kicker">🧠 המאמן האישי שלך · ${esc(LANG_NAMES[selectedLang])}</span><h2>כבר לא מנחשים מה ללמוד</h2><p>המאמן עוקב אחרי תשובות המשימות שלך ומציע על מה לחזור. ההתקדמות נשמרת בדפדפן שלך.</p></div><div class="coach-stats"><div><strong>${stats.practiced}</strong><span>משפטים תורגלו</span></div><div><strong>${stats.mastered}</strong><span>בשליטה</span></div><div><strong>${due.length}</strong><span>מוכנים לחזרה</span></div></div></div>
      <div class="coach-recommendation"><div><small>ההמלצה הבאה שלך</small><strong>${place?.icon||'💬'} ${esc(place?.title||'בית הקפה')}</strong><p>${esc(suggestion.reason)}</p></div><button type="button" class="world-next" data-coach-start="${esc(suggestion.placeId)}" data-coach-step="${suggestion.stepIndex}">התחל תרגול ממוקד ←</button></div>
      <div class="coach-note"><span>🔁</span><p>תשובה נכונה חוזרת אחרי יום, שלושה ימים ושבוע. כשאתה טועה, המשפט חוזר לתרגול מוקדם יותר. כך החזרה משתלבת במשחק במקום ברשימות אינסופיות.</p></div>`;
    if(!el.dataset.wired){
      el.dataset.wired='1';
      el.addEventListener('click',event=>{
        const btn=event.target.closest('[data-coach-start]');
        if(btn)open(btn.dataset.coachStart,selectedLang,Number(btn.dataset.coachStep)||0);
      });
    }
  }

  function open(placeId,lang,focusStep=0){
    if(validLang(lang))selectedLang=lang;
    const mission=Model.getMission(selectedLang,placeId);
    if(!mission)return false;
    activeId=placeId;
    stepIndex=Number.isInteger(focusStep)&&focusStep>=0&&focusStep<mission.steps.length?focusStep:0;
    solved=0;result=null;chosenIndex=null;hints=false;voiceMessage='';completion=null;
    render();renderCoach();
    $('world-active-mission')?.scrollIntoView({behavior:'smooth',block:'center'});
    return true;
  }
  function choose(choice){
    if(result||!activeId)return;
    const outcome=Model.resolveChoice(selectedLang,activeId,stepIndex,choice);
    if(!outcome)return;
    result=outcome;chosenIndex=choice;
    if(outcome.correct)solved++;
    memory=Mastery.record(memory,selectedLang,outcome.key,outcome.correct);
    saveJSON(STORE,memory);
    render();renderCoach();
    $('world-active-mission')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function next(){
    if(!result)return;
    if(result.nextIndex===null){
      achievements.done[selectedLang] ||= {};
      achievements.done[selectedLang][activeId]=true;
      saveJSON(WORLD_STORE,achievements);
      const finished=Model.getMission(selectedLang,activeId);
      const title=finished.title;
      completion={lang:selectedLang,title,solved,total:finished.steps.length};
      activeId=null;
      render();renderCoach();
      const counter=$('language-world-root');
      counter?.setAttribute('data-last-completion',title);
      return;
    }
    stepIndex=result.nextIndex;
    result=null;chosenIndex=null;voiceMessage='';
    render();
  }
  function practiceSpeech(){
    const status=$('world-voice-result');
    const target=result?.answer?.target;
    if(!status||!target)return;
    const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition;
    if(!Recognition){status.textContent='זיהוי דיבור אינו זמין בדפדפן הזה. אפשר להאזין למשפט ולחזור עליו בקול.';return;}
    try{
      const recognition=new Recognition();
      recognition.lang=LANG_LOCALES[selectedLang];
      recognition.interimResults=false;
      recognition.maxAlternatives=1;
      status.textContent='מקשיב… דבר עכשיו.';
      recognition.onresult=event=>{
        const transcript=event.results?.[0]?.[0]?.transcript||'';
        voiceMessage=transcript?`שמעתי: ${transcript}. השווה את המשפט לנוסח שלמעלה ונסה שוב.`:'לא התקבלה תוצאה. נסה שוב.';
        if($('world-voice-result'))$('world-voice-result').textContent=voiceMessage;
      };
      recognition.onerror=()=>{status.textContent='לא הצלחתי לזהות את הדיבור. אפשר לנסות שוב או להאזין למשפט.';};
      recognition.start();
    }catch(e){status.textContent='המיקרופון אינו זמין כרגע. אפשר לתרגל בהאזנה.';}
  }
  function bindWorld(){
    const el=$('language-world-root');
    if(!el||el.dataset.wired)return;
    el.dataset.wired='1';
    el.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.worldLanguage){onLanguageChange(button.dataset.worldLanguage);return;}
      if(button.dataset.worldPlace){open(button.dataset.worldPlace,selectedLang);return;}
      if(button.hasAttribute('data-world-close')){activeId=null;result=null;render();return;}
      if(button.dataset.worldChoice!==undefined){choose(Number(button.dataset.worldChoice));return;}
      if(button.hasAttribute('data-world-next')){next();return;}
      if(button.hasAttribute('data-world-hints')){hints=!hints;render();return;}
      if(button.hasAttribute('data-world-voice'))practiceSpeech();
    });
  }
  function onLanguageChange(lang){
    if(!validLang(lang))return;
    if(lang!==selectedLang){activeId=null;result=null;chosenIndex=null;completion=null;}
    selectedLang=lang;
    saveJSON('my-center-world-language',lang);
    render();renderCoach();
  }
  function feedMoment(lang,seed='world'){
    if(!Model)return '';
    const hash=[...String(seed)].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,7);
    const place=places('ar')[hash%3];
    if(lang==='four'){
      return `<section class="feed-moment world-feed-moment"><div class="world-feed-text"><span class="world-kicker">🌐 הרפתקה בארבע שפות</span><h2>${esc(place.icon)} ${esc(place.title)} — ארבע דרכים לדבר</h2><p>בחר שפה ועבור מאוצר מילים לשיחה אמיתית. אותן מטרות, ביטויים אחרים.</p></div><div class="world-feed-languages">${Model.LANGUAGE_CODES.map(code=>`<button type="button" data-open-world data-world-lang="${code}" data-world-place="${place.id}">${esc(LANG_NAMES[code])} ←</button>`).join('')}</div></section>`;
    }
    const chosen=validLang(lang)?lang:Model.LANGUAGE_CODES[hash%4];
    return `<section class="feed-moment world-feed-moment world-feed-${place.id}"><span class="world-feed-icon" aria-hidden="true">${place.icon}</span><div class="world-feed-text"><span class="world-kicker">🎭 סיפור אינטראקטיבי · ${esc(LANG_NAMES[chosen])}</span><h2>${esc(place.title)}</h2><p>${esc(place.goal)} — התשובות שלך ישפיעו על תגובת הדמות.</p></div><button class="world-next" type="button" data-open-world data-world-lang="${chosen}" data-world-place="${place.id}">צא למשימה ←</button></section>`;
  }
  function init(){render();renderCoach();}
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
  return {open,render,feedMoment,onLanguageChange,coachRecommendation};
});
