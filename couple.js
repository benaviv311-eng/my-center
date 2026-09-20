const KEY='coupleApp.v1';
const defaults={
  me:{name:'',homeAddress:'',maxDistance:30,giftBudget:200,dateBudget:400,gestureBudget:70,location:null,availability:{}},
  partner:{name:'',years:'',likes:'',dislikes:'',foodPrefs:'',giftPrefs:'',emotionalPrefs:'',hints:[],social:[]},
  plan:{budget:800,gifts:1,dates:2,gestures:4,courtship:8,automation:'prepare',autoLimit:70,style:'משולב',autoPlanner:true},
  progress:{gifts:0,dates:0,gestures:0,courtship:0,spent:0},
  planner:{dailyKey:'',daily:null,dailyVariant:0,weekKey:'',monthKey:'',lastTypes:[]},
  events:[],
  week:[],
  month:[]
};
let state=load();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function clone(o){return JSON.parse(JSON.stringify(o))}
function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=merge(a[k]||{},b[k])}else if(b[k]!==undefined)a[k]=b[k]}return a}
function load(){try{return merge(clone(defaults),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return clone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function toast(msg){const t=$('#coupleToast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function openModal(html){$('#modalContent').innerHTML=html;$('#modalBackdrop').hidden=false}
function closeModal(){$('#modalBackdrop').hidden=true}
$('#modalClose').onclick=closeModal;$('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal()});

const providers={
  woltGifts:'https://life.wolt.com/he/isr/howto/gifting',
  woltFlowers:'https://life.wolt.com/he/isr/howto/flowers',
  ontopo:'https://ontopo.com/he/il',
  eventimStandup:'https://www.eventim.co.il/artist/stand-up/',
  printedCard:'https://mysiddurname.co.il/product/%D7%9B%D7%A8%D7%98%D7%99%D7%A1-%D7%91%D7%A8%D7%9B%D7%94/'
};
function mapsSearch(query){
  const loc=state.me.location;
  const suffix=loc?` ליד ${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`:'';
  return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query+suffix)
}
function providerButtons(items){
  return '<div class="provider-actions">'+items.map(x=>`<a class="provider-link ${x.primary?'primary-provider':''}" href="${x.url}" target="_blank" rel="noopener"><span>${x.icon||'↗'}</span><div><strong>${esc(x.label)}</strong><small>${esc(x.note||'')}</small></div></a>`).join('')+'</div>'
}
function localDateKey(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function weekKey(d=new Date()){const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-x.getDay());return localDateKey(x)}
function monthKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function seededNumber(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return Math.abs(h>>>0)}
function daysUntil(dateStr){if(!dateStr)return 999;const a=new Date();a.setHours(0,0,0,0);const b=new Date(dateStr+'T12:00:00');return Math.ceil((b-a)/86400000)}
function budgetLeft(){return Math.max(0,(+state.plan.budget||0)-(+state.progress.spent||0))}
function hasAvailability(){return Object.keys(state.me.availability||{}).some(k=>state.me.availability[k]===true)}
function dayIsAvailable(day){const a=state.me.availability||{};return !hasAvailability()||a[String(day)]===true||a[day]===true}
function upcomingEvent(maxDays=7){return state.events.map(e=>({...e,days:daysUntil(e.date)})).filter(e=>e.days>=0&&e.days<=maxDays).sort((a,b)=>a.days-b.days)[0]||null}
function rememberType(type){state.planner.lastTypes=Array.isArray(state.planner.lastTypes)?state.planner.lastTypes:[];state.planner.lastTypes.unshift(type);state.planner.lastTypes=state.planner.lastTypes.slice(0,5)}
function inferReason(a){
 const reasons=[];const ev=upcomingEvent(5);const left=budgetLeft();const p=state.partner;
 if(ev&&(a.type==='gift'||a.type==='gesture'))reasons.push(`${ev.title} מתקרב בעוד ${ev.days===0?'היום':ev.days+' ימים'}`);
 if(p.hints.length&&(a.type==='gift'||a.type==='gesture'||a.type==='memory'||a.type==='hint'))reasons.push('יש רמז ששמרת ממנה');
 if(left<Math.max(80,state.plan.budget*.2)&&a.cost===0)reasons.push('נשאר מעט מהתקציב החודשי');
 if(a.type==='date'&&dayIsAvailable(new Date().getDay()))reasons.push('היום מסומן כפנוי בלוז');
 if(a.type==='date'&&state.progress.dates<state.plan.dates)reasons.push('עוד חסר דייט בתוכנית החודשית');
 if(a.type==='gift'&&state.progress.gifts<state.plan.gifts)reasons.push('עוד חסרה מתנה בתוכנית החודשית');
 if(a.type==='gesture'&&state.progress.gestures<state.plan.gestures)reasons.push('עוד חסרות מחוות בתוכנית');
 if((a.type==='free'||a.type==='memory')&&state.progress.courtship<state.plan.courtship)reasons.push('שומר על חיזור גם בלי להוציא כסף');
 return reasons.slice(0,2).join(' · ')||'נבחר כדי לגוון את החיזור ולא לחזור על אותה פעולה'
}
function scoreAction(a){
 let score=10;const left=budgetLeft();const recent=state.planner.lastTypes||[];const ev=upcomingEvent(5);
 if(a.cost>left)score-=100;
 if(a.type==='date'){score+=(state.progress.dates<state.plan.dates?9:-2);score+=dayIsAvailable(new Date().getDay())?4:-8}
 if(a.type==='gift')score+=(state.progress.gifts<state.plan.gifts?8:-2);
 if(a.type==='gesture')score+=(state.progress.gestures<state.plan.gestures?7:-1);
 if(a.type==='free'||a.type==='memory')score+=state.progress.courtship<state.plan.courtship?5:2;
 if(left<Math.max(80,state.plan.budget*.2)&&a.cost===0)score+=8;
 if(state.partner.hints.length){if(a.type==='gift')score+=6;if(a.type==='gesture')score+=4;if(a.type==='memory')score+=3}
 if(ev){if(a.type==='gift')score+=7;if(a.type==='gesture')score+=6;if(a.type==='date')score+=2}
 recent.forEach((t,i)=>{if(t===a.type)score-=7-i});
 const likes=(state.partner.likes+' '+state.partner.giftPrefs+' '+state.partner.emotionalPrefs).toLowerCase();
 if(a.type==='date'&&/(הופעה|מסעדה|סטנד|טיול|ים|ספא)/.test(likes))score+=3;
 if(a.type==='gift'&&/(תכשיט|ספר|מתנה|בגד)/.test(likes))score+=3;
 if(a.type==='gesture'&&/(פרח|שוקולד|קפה|אוכל)/.test(likes))score+=3;
 return score
}
function chooseSmartAction(variant=0){
 let pool=actionPool.map(a=>({...a}));
 const hint=state.partner.hints.at(-1);
 if(hint)pool.push({type:'hint',icon:'💡',title:'הפוך רמז לפעולה',body:`היא אמרה: “${hint.text}”. בחר דרך קטנה להפוך את זה למשהו ממשי השבוע.`,cost:0});
 pool=pool.map(a=>({...a,score:scoreAction(a)})).sort((a,b)=>b.score-a.score);
 const top=pool.filter(a=>a.score>-50).slice(0,Math.min(4,pool.length));
 const pick=top[(seededNumber(localDateKey()+state.plan.style+variant)%Math.max(1,top.length))]||pool[0];
 pick.reason=inferReason(pick);return pick
}
function getDailyAction(){
 const key=localDateKey();
 if(!state.planner.daily||state.planner.dailyKey!==key){state.planner.dailyKey=key;state.planner.dailyVariant=0;state.planner.daily=chooseSmartAction(0);persistOnly()}
 return state.planner.daily
}
function nextDailyAlternative(){
 state.planner.dailyVariant=(state.planner.dailyVariant||0)+1;state.planner.daily=chooseSmartAction(state.planner.dailyVariant);state.planner.dailyKey=localDateKey();persistOnly();render()
}
function persistOnly(){localStorage.setItem(KEY,JSON.stringify(state))}
function getPreferredDays(startDate,count){
 const days=[];for(let i=0;i<14&&days.length<count;i++){const d=new Date(startDate);d.setDate(startDate.getDate()+i);if(dayIsAvailable(d.getDay()))days.push(d)}
 if(!days.length){for(let i=0;i<count;i++){const d=new Date(startDate);d.setDate(startDate.getDate()+i*2);days.push(d)}}
 return days
}
function autoBuildWeek(force=false){
 if(!state.plan.autoPlanner&&!force)return;
 const key=weekKey();if(!force&&state.planner.weekKey===key&&state.week.length)return;
 const start=new Date();start.setHours(12,0,0,0);
 const target=Math.max(3,Math.min(7,Math.ceil((+state.plan.courtship||8)/4)));
 const types=[];
 if(state.progress.dates<state.plan.dates)types.push('date');
 if(state.progress.gestures<state.plan.gestures)types.push('gesture');
 if(state.progress.gifts<state.plan.gifts&&budgetLeft()>Math.min(100,state.me.giftBudget||100))types.push('gift');
 while(types.length<target)types.push(types.length%2?'free':'memory');
 const dates=getPreferredDays(start,types.length);
 state.week=types.map((type,i)=>{
   let a=actionPool.filter(x=>x.type===type)[0]||actionPool[i%actionPool.length];
   if(type==='free')a=actionPool[i%2?1:0];
   if(type==='memory')a=actionPool[7];
   const d=dates[i]||start;
   return {date:localDateKey(d),day:['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][d.getDay()],type:a.type,title:a.title,detail:a.body,icon:a.icon,reason:inferReason(a)}
 });
 state.planner.weekKey=key;persistOnly()
}
function autoBuildMonth(force=false){
 if(!state.plan.autoPlanner&&!force)return;
 const key=monthKey();if(!force&&state.planner.monthKey===key&&state.month.length)return;
 const now=new Date();const year=now.getFullYear(),month=now.getMonth();const last=new Date(year,month+1,0).getDate();
 const tasks=[];
 const pushTasks=(count,type,icon,title,detail,cost)=>{for(let i=0;i<count;i++)tasks.push({type,icon,title,detail,cost:cost||0})};
 pushTasks(Math.max(0,+state.plan.dates||0),'date','🥂','דייט','חלון זמן ייבחר לפי הלוז',state.me.dateBudget||0);
 pushTasks(Math.max(0,+state.plan.gifts||0),'gift','🎁','מתנה','תיבחר לפי העדפות ורמזים',state.me.giftBudget||0);
 pushTasks(Math.max(0,+state.plan.gestures||0),'gesture','🌹','מחווה','משהו קטן ומדויק',state.me.gestureBudget||0);
 const extra=Math.max(0,(+state.plan.courtship||0)-tasks.length);pushTasks(extra,'free','❤️','חיזור קטן','פעולה ללא עלות או זמן איכות',0);
 const total=Math.max(1,tasks.length);const evs=state.events.filter(e=>{const d=new Date(e.date+'T12:00:00');return d.getFullYear()===year&&d.getMonth()===month});
 state.month=tasks.map((t,i)=>{
   let day=Math.max(now.getDate(),Math.round((i+1)*(last/(total+1))));
   if(t.type==='date'){
     for(let k=0;k<7;k++){const d=new Date(year,month,Math.min(last,day+k));if(dayIsAvailable(d.getDay())){day=d.getDate();break}}
   }
   if((t.type==='gift'||t.type==='gesture')&&evs.length&&i<evs.length){const ed=new Date(evs[i].date+'T12:00:00').getDate();day=Math.max(now.getDate(),ed-1)}
   const d=new Date(year,month,Math.min(last,day));
   return {...t,date:localDateKey(d),when:`${d.getDate()} בחודש`,reason:inferReason(t)}
 }).sort((a,b)=>a.date.localeCompare(b.date));
 state.planner.monthKey=key;persistOnly()
}
function ensureAutomaticPlanning(force=false){
 if(!state.plan.autoPlanner&&!force)return;
 getDailyAction();autoBuildWeek(force);autoBuildMonth(force)
}
const actionPool=[
 {type:'free',icon:'💬',title:'שלח הודעה אישית',body:'כתוב לה דבר אחד ספציפי שאתה מעריך בה היום.',cost:0},
 {type:'free',icon:'☕',title:'תוריד ממנה משהו קטן',body:'קח על עצמך משימה אחת שהיא בדרך כלל עושה, בלי להפוך את זה לאירוע.',cost:0},
 {type:'free',icon:'🤍',title:'עשר דקות רק שלכם',body:'שים טלפון בצד ושאל: מה היה הדבר הכי טוב שקרה לך השבוע שאני אולי לא יודע עליו?',cost:0},
 {type:'gesture',icon:'🍰',title:'משהו מתוק בדרך',body:'בחר קינוח קטן שהיא אוהבת והבא אותו בלי סיבה מיוחדת.',cost:45},
 {type:'gesture',icon:'🌹',title:'מחווה קטנה',body:'שלח משהו קטן לעבודה או הביתה עם משפט קצר ואישי.',cost:65},
 {type:'date',icon:'🥂',title:'דייט קצר השבוע',body:'מצא חלון של שעתיים ובחר מקום קרוב שלא דורש ערב שלם.',cost:220},
 {type:'gift',icon:'🎁',title:'הפתעה אישית',body:'השתמש באחד הרמזים ששמרת ובחר מתנה קטנה שמראה שהקשבת.',cost:160},
 {type:'memory',icon:'📷',title:'תחזיר זיכרון טוב',body:'מצא תמונה ישנה שלכם ושלח אותה עם משפט שמזכיר למה הרגע הזה חשוב לך.',cost:0}
];
function partnerName(){return state.partner.name||'בת הזוג'}
function tailoredAction(){
 const hints=state.partner.hints;
 if(hints.length && Math.random()>.55){const h=hints[hints.length-1];return {type:'hint',icon:'💡',title:'נצל משהו שהיא אמרה',body:`היא אמרה: “${h.text}”. תחשוב איך להפוך את זה לפעולה קטנה השבוע.`,cost:0}}
 const budgetLeft=Math.max(0,state.plan.budget-state.progress.spent);
 const pool=actionPool.filter(a=>a.cost<=budgetLeft || a.cost===0);
 return pool[Math.floor(Math.random()*pool.length)]||actionPool[0]
}
function showAction(a=tailoredAction()){
 openModal(`<p class="eyebrow">הצעה חכמה</p><h2>${a.icon} ${esc(a.title)}</h2><p>${esc(a.body)}</p><div class="result-card"><small>עלות משוערת</small><div class="price">${a.cost?a.cost+' ₪':'ללא עלות'}</div></div><button class="primary full" id="completeAction">עשיתי / בצעתי</button><button class="ghost full" style="margin-top:8px" id="anotherAction">תן משהו אחר</button>`);
 $('#completeAction').onclick=()=>{state.progress.courtship++;if(a.type==='gesture')state.progress.gestures++;if(a.type==='date')state.progress.dates++;if(a.type==='gift')state.progress.gifts++;state.progress.spent+=a.cost||0;save();closeModal();toast('נשמר כחיזור שבוצע ♥')};
 $('#anotherAction').onclick=()=>showAction(tailoredAction())
}
function render(){
 $('#greeting').textContent=state.partner.name?`מה נעשה היום בשביל ${state.partner.name}?`:'מה נעשה היום בשביל הזוגיות?';
 $('#heroSub').textContent=state.me.name?`${state.me.name}, פעולה אחת טובה בזמן הנכון.`:'פעולה אחת טובה, בזמן הנכון.';
 $('#partnerHeading').textContent=state.partner.name||'בת הזוג';
 $('#partnerAvatar').textContent=state.partner.name?state.partner.name.trim().charAt(0):'♥';
 const a=tailoredAction();$('#dailyTitle').textContent=a.title;$('#dailyBody').textContent=a.body;$('#doDailyBtn').onclick=()=>showAction(a);
 $('#courtshipProgress').textContent=`${state.progress.courtship}/${state.plan.courtship}`;
 $('#gestureProgress').textContent=`${state.progress.gestures}/${state.plan.gestures}`;
 $('#dateProgress').textContent=`${state.progress.dates}/${state.plan.dates}`;
 $('#giftProgress').textContent=`${state.progress.gifts}/${state.plan.gifts}`;
 $('#budgetRemaining').textContent=`${Math.max(0,state.plan.budget-state.progress.spent)} ₪`;
 renderHints();renderEvents();renderWeek();renderMonth();renderInsights();
}
function renderHints(){
 const list=state.partner.hints.slice().reverse();
 const markup=list.length?list.map((h,i)=>`<div class="list-item"><span class="emoji">💡</span><div><strong>${esc(h.text)}</strong><small>${esc(h.date||'נשמר')}</small></div></div>`).join(''):'<p class="muted">עדיין אין רמזים. שמור משפט שהיא אמרה והמערכת תשתמש בו בהצעות.</p>';
 $('#hintPreview').innerHTML=list.slice(0,3).length?list.slice(0,3).map(h=>`<div class="list-item"><span class="emoji">💡</span><div><strong>${esc(h.text)}</strong><small>${esc(h.date||'נשמר')}</small></div></div>`).join(''):'<p class="muted">עוד לא נשמרו רמזים.</p>';
 $('#allHints').innerHTML=markup;
}
function renderEvents(){
 $('#upcomingList').innerHTML=state.events.length?state.events.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4).map(e=>`<div class="list-item"><span class="emoji">📅</span><div><strong>${esc(e.title)}</strong><small>${esc(e.date)}</small></div><button data-event-id="${e.id}">טפל בזה</button></div>`).join(''):'<p class="muted">הוסף יום הולדת, יום נישואים או יום חשוב.</p>';
 $$('[data-event-id]').forEach(b=>b.onclick=()=>showAction())
}
function renderWeek(){
 $('#weekPlan').innerHTML=state.week.length?state.week.map(x=>`<div class="timeline-item"><div class="day">${esc(x.day)}</div><div><strong>${esc(x.title)}</strong><small>${esc(x.detail)}</small></div><span>${x.icon}</span></div>`).join(''):'<p class="muted">עוד לא נבנתה תוכנית שבועית.</p>'
}
function renderMonth(){
 $('#monthPlan').innerHTML=state.month.length?state.month.map(x=>`<div class="timeline-item"><div class="day">${esc(x.when)}</div><div><strong>${esc(x.title)}</strong><small>${esc(x.detail)}</small></div><span>${x.icon}</span></div>`).join(''):'<p class="muted">שמור את התוכנית כדי לבנות חודש.</p>'
}
function renderInsights(){
 const insights=[];
 if(state.partner.likes)insights.push('כדאי להעדיף הצעות שקשורות ל: '+state.partner.likes.split(',').slice(0,3).join(', ')+'.');
 if(state.partner.dislikes)insights.push('להימנע ככל האפשר מ: '+state.partner.dislikes.split(',').slice(0,3).join(', ')+'.');
 if(state.partner.hints.length)insights.push(`נשמרו ${state.partner.hints.length} רמזים שאפשר להפוך למחוות, דייטים או מתנות.`);
 if(state.progress.dates>state.progress.gifts+1)insights.push('לאחרונה היו יותר דייטים ממתנות — אפשר לגוון במחווה אישית.');
 $('#learnedInsights').innerHTML=insights.length?'<ul>'+insights.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'עדיין אין מספיק מידע. הוסף העדפות ורמזים והמערכת תתחיל לבנות תובנות.'
}
function addHint(){
 openModal(`<p class="eyebrow">רמז חדש</p><h2>מה היא אמרה?</h2><p>כתוב משפט קצר. בעתיד המערכת תחזיר אותו בזמן מתאים.</p><textarea id="newHintText" style="width:100%;min-height:110px;border:1px solid #e8dfdd;border-radius:14px;padding:12px" placeholder="לדוגמה: ממש בא לי ללכת להופעה הזאת"></textarea><button class="primary full" style="margin-top:12px" id="saveHintModal">שמור רמז</button>`);
 $('#saveHintModal').onclick=()=>{const t=$('#newHintText').value.trim();if(!t)return;state.partner.hints.push({text:t,date:new Date().toLocaleDateString('he-IL')});save();closeModal();toast('הרמז נשמר')}
}
function addEvent(){
 openModal(`<p class="eyebrow">אירוע חשוב</p><h2>מה חשוב לזכור?</h2><input id="eventTitle" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px" placeholder="יום הולדת / פגישה חשובה"><input id="eventDate" type="date" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin-top:10px"><button class="primary full" style="margin-top:12px" id="saveEventModal">שמור</button>`);
 $('#saveEventModal').onclick=()=>{const title=$('#eventTitle').value.trim(),date=$('#eventDate').value;if(!title||!date)return;state.events.push({id:Date.now(),title,date});save();closeModal()}
}
function giftFlow(){
 const budget=state.me.giftBudget||200;const hint=state.partner.hints.at(-1);
 openModal(`<p class="eyebrow">מתנה</p><h2>מצא מתנה ל${esc(partnerName())}</h2><p>${hint?'אפשר להשתמש ברמז האחרון: “'+esc(hint.text)+'”.':'ההצעה תתבסס על ההעדפות ששמרת.'}</p><label>תקציב</label><input id="flowBudget" type="number" value="${budget}" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin:8px 0 14px"><button class="primary full" id="findGift">מצא מתנה</button>`);
 $('#findGift').onclick=()=>{
  const b=+$('#flowBudget').value||budget;
  const ideas=['ספר או פריט שהיא הזכירה','תכשיט עדין בסגנון שלה','מארז קטן שמתחבר לתחביב שלה'];
  const idea=hint?`מתנה שמבוססת על: “${hint.text}”`:ideas[Math.floor(Math.random()*ideas.length)];
  openModal(`<p class="eyebrow">הבחירה שלי</p><h2>🎁 ${esc(idea)}</h2><div class="result-card"><p>בחר ספק כדי לעבור לבחירה ולהזמנה בפועל.</p><div class="price">עד ${b} ₪</div></div>${providerButtons([
    {url:providers.woltGifts,icon:'🛵',label:'פתח מתנות ב-Wolt',note:'משלוח, ברכה ומעקב',primary:true},
    {url:mapsSearch('חנות מתנות'),icon:'📍',label:'מתנות קרוב אליי',note:'חיפוש לפי המיקום שלך'},
    {url:providers.printedCard,icon:'💌',label:'הוסף כרטיס ברכה מודפס',note:'טקסט אישי ומשלוח'}
  ])}<button class="primary full" id="approveGift">סמן שהמתנה הוזמנה</button><p class="muted">כרגע התשלום נעשה אצל הספק. בהמשך נחבר ספקים שתומכים בתשלום ישירות מתוך האפליקציה.</p>`);
  $('#approveGift').onclick=()=>{state.progress.gifts++;state.progress.courtship++;save();closeModal();toast('המתנה סומנה כהוזמנה')}
 }
}
function dateFlow(){
 const b=state.me.dateBudget||400;
 openModal(`<p class="eyebrow">דייט</p><h2>תן לי לארגן ערב</h2><div class="modal-options"><button class="modal-option selected" data-date-style="רומנטי">רומנטי</button><button class="modal-option" data-date-style="מצחיק">מצחיק</button><button class="modal-option" data-date-style="רגוע">רגוע</button><button class="modal-option" data-date-style="חדש">חדש לנו</button></div><label>תקציב כולל</label><input id="dateFlowBudget" type="number" value="${b}" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin:8px 0 14px"><button class="primary full" id="buildDate">בנה לי דייט</button>`);
 let style='רומנטי';
 $$('[data-date-style]').forEach(x=>x.onclick=()=>{$$('[data-date-style]').forEach(y=>y.classList.remove('selected'));x.classList.add('selected');style=x.dataset.dateStyle});
 $('#buildDate').onclick=()=>{
  const budget=+$('#dateFlowBudget').value||b;const dist=state.me.maxDistance||30;
  openModal(`<p class="eyebrow">דייט מוכן</p><h2>🥂 ערב ${esc(style)}</h2><div class="result-card"><h3>19:30 יציאה</h3><p>20:00 פעילות או מקום שמתאים להעדפות של ${esc(partnerName())}<br>21:30 אוכל / קינוח קרוב<br>23:00 חזרה</p><small>טווח נסיעה</small><div class="price">עד ${dist} דקות · עד ${budget} ₪</div></div>${providerButtons([
    {url:providers.ontopo,icon:'🍽️',label:'הזמן מסעדה ב-Ontopo',note:'זמינות והזמנת שולחן',primary:true},
    {url:providers.eventimStandup,icon:'🎤',label:'מצא סטנד-אפ',note:'מופעים וכרטיסים עדכניים'},
    {url:mapsSearch(style+' דייט מסעדה פעילות'),icon:'📍',label:'מצא אפשרויות קרובות',note:'לפי המיקום שלך'}
  ])}<button class="primary full" id="approveDate">סמן שהדייט אורגן</button><p class="muted">ההזמנות נפתחות כרגע אצל הספקים. בהמשך נרכז אישור ותשלום בתוך האפליקציה כאשר האינטגרציה תאפשר זאת.</p>`);
  $('#approveDate').onclick=()=>{state.progress.dates++;state.progress.courtship++;save();closeModal();toast('הדייט סומן כמאורגן')}
 }
}
function gestureFlow(){
 const b=state.me.gestureBudget||70;
 openModal(`<p class="eyebrow">מחווה</p><h2>משהו קטן עכשיו</h2><div class="modal-options"><button class="modal-option" data-gesture="free">בלי כסף</button><button class="modal-option" data-gesture="delivery">משלוח קטן</button><button class="modal-option" data-gesture="home">בבית</button><button class="modal-option" data-gesture="work">לעבודה</button></div><button class="primary full" id="randomGesture">תבחר בשבילי</button>`);
 $$('[data-gesture]').forEach(x=>x.onclick=()=>{
  const type=x.dataset.gesture;
  if(type==='free'||type==='home'){showAction(type==='free'?actionPool[0]:actionPool[1]);return}
  const title=type==='work'?'הפתעה לעבודה':'משלוח קטן';
  openModal(`<p class="eyebrow">מחווה לביצוע</p><h2>🌹 ${title}</h2><p>מצא משהו קטן עד ${b} ₪ ושלח עם ברכה אישית.</p>${providerButtons([
    {url:providers.woltGifts,icon:'🛵',label:'שלח מתנה עכשיו',note:'משלוח מהיר דרך Wolt',primary:true},
    {url:providers.woltFlowers,icon:'💐',label:'שלח פרחים',note:'חנויות פרחים באזור'},
    {url:providers.printedCard,icon:'💌',label:'שלח כרטיס ברכה מודפס',note:'ברכה אישית ומשלוח'}
  ])}<button class="primary full" id="gestureDone">סמן שבוצע</button>`);
  $('#gestureDone').onclick=()=>{state.progress.gestures++;state.progress.courtship++;save();closeModal();toast('המחווה סומנה כבוצעה')}
 });
 $('#randomGesture').onclick=()=>showAction(actionPool.filter(a=>a.type==='gesture'||a.type==='free')[Math.floor(Math.random()*5)])
}
function buildWeek(){
 const days=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
 const picks=[actionPool[0],actionPool[1],actionPool[7],actionPool[3],actionPool[2],actionPool[5],actionPool[4]];
 state.week=days.map((day,i)=>({day,title:picks[i].title,detail:picks[i].body,icon:picks[i].icon}));save();toast('נבנה שבוע חיזור חדש')
}
function buildMonth(){
 const items=[];let n=2;
 const add=(count,icon,title,detail)=>{for(let i=0;i<count;i++){items.push({when:`${Math.min(28,n)} בחודש`,icon,title,detail});n+=Math.max(2,Math.floor(28/Math.max(1,state.plan.gifts+state.plan.dates+state.plan.gestures)))}};
 add(state.plan.gestures,'🌹','מחווה','משהו קטן שמותאם לפרופיל שלה');
 add(state.plan.dates,'🥂','דייט','חלון זמן ייבחר מתוך הלוז');
 add(state.plan.gifts,'🎁','מתנה','מתנה לפי תקציב והעדפות');
 items.sort((a,b)=>parseInt(a.when)-parseInt(b.when));state.month=items.slice(0,20);save()
}
function surprise(){const options=[giftFlow,dateFlow,gestureFlow,()=>showAction()];options[Math.floor(Math.random()*options.length)]()}

$$('.bottom-nav button').forEach(b=>b.onclick=()=>go(b.dataset.tab));
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function go(tab){$$('.bottom-nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));$$('.tab-page').forEach(x=>x.classList.toggle('active',x.dataset.page===tab));scrollTo({top:0,behavior:'smooth'})}
$$('[data-flow]').forEach(b=>b.onclick=()=>({gift:giftFlow,date:dateFlow,gesture:gestureFlow,surprise}[b.dataset.flow])());
$('#doNowBtn').onclick=()=>showAction();$('#courtshipNow').onclick=()=>showAction();$('#refreshDailyBtn').onclick=render;
$('#quickAddBtn').onclick=addHint;$('#addHintBtn').onclick=addHint;$('#partnerHintBtn').onclick=addHint;$('#addEventBtn').onclick=addEvent;
$('#buildWeek').onclick=buildWeek;$('#regenerateWeek').onclick=buildWeek;
$('#autoCourtship').onclick=()=>{go('plans');toast('בחר רמת אוטומציה בתוכנית החודשית')};
$$('#styleChips button').forEach(b=>b.onclick=()=>{$$('#styleChips button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.plan.style=b.dataset.style;save()});

function fillForms(){
 $('#partnerName').value=state.partner.name;$('#relationshipYears').value=state.partner.years;$('#likes').value=state.partner.likes;$('#dislikes').value=state.partner.dislikes;$('#foodPrefs').value=state.partner.foodPrefs;$('#giftPrefs').value=state.partner.giftPrefs;$('#emotionalPrefs').value=state.partner.emotionalPrefs;
 $('#myName').value=state.me.name;$('#homeAddress').value=state.me.homeAddress;$('#maxDistance').value=state.me.maxDistance;$('#giftBudget').value=state.me.giftBudget;$('#dateBudget').value=state.me.dateBudget;$('#gestureBudget').value=state.me.gestureBudget;
 $('#monthlyBudget').value=state.plan.budget;$('#budgetValue').textContent=state.plan.budget;$('#planGifts').value=state.plan.gifts;$('#planDates').value=state.plan.dates;$('#planGestures').value=state.plan.gestures;$('#planCourtship').value=state.plan.courtship;$('#automationLevel').value=state.plan.automation;$('#autoLimit').value=state.plan.autoLimit;$('#autoLimitWrap').hidden=state.plan.automation!=='limited';
 const active=$$('#styleChips button').find(x=>x.dataset.style===state.plan.style);if(active)active.classList.add('active')
}
$('#savePartnerBtn').onclick=()=>{Object.assign(state.partner,{name:$('#partnerName').value.trim(),years:$('#relationshipYears').value,likes:$('#likes').value.trim(),dislikes:$('#dislikes').value.trim(),foodPrefs:$('#foodPrefs').value.trim(),giftPrefs:$('#giftPrefs').value.trim(),emotionalPrefs:$('#emotionalPrefs').value.trim()});save();toast('פרופיל בת הזוג נשמר')};
$('#saveMeBtn').onclick=()=>{Object.assign(state.me,{name:$('#myName').value.trim(),homeAddress:$('#homeAddress').value.trim(),maxDistance:+$('#maxDistance').value,giftBudget:+$('#giftBudget').value||0,dateBudget:+$('#dateBudget').value||0,gestureBudget:+$('#gestureBudget').value||0});save();toast('ההגדרות נשמרו')};
$('#monthlyBudget').oninput=e=>$('#budgetValue').textContent=e.target.value;
$('#automationLevel').onchange=e=>$('#autoLimitWrap').hidden=e.target.value!=='limited';
$('#savePlanBtn').onclick=()=>{Object.assign(state.plan,{budget:+$('#monthlyBudget').value,gifts:+$('#planGifts').value,dates:+$('#planDates').value,gestures:+$('#planGestures').value,courtship:+$('#planCourtship').value,automation:$('#automationLevel').value,autoLimit:+$('#autoLimit').value||0});buildMonth();toast('התוכנית החודשית נשמרה')};

$('#locationBtn').onclick=()=>{
 if(!navigator.geolocation){toast('המכשיר לא תומך במיקום');return}
 navigator.geolocation.getCurrentPosition(p=>{state.me.location={lat:p.coords.latitude,lng:p.coords.longitude,updated:new Date().toISOString()};save();$('#locationStatus').textContent='המיקום נשמר בהרשאה. אפשר לבטל הרשאה בהגדרות המכשיר.';toast('המיקום נשמר')},()=>toast('לא התקבלה הרשאת מיקום'),{enableHighAccuracy:false,timeout:8000})
};
const dayNames=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
$('#calendarBtn').onclick=()=>{const box=$('#availabilityEditor');box.hidden=!box.hidden;if(!box.innerHTML)box.innerHTML=dayNames.map((d,i)=>`<label class="availability-row"><span>${d}</span><input type="checkbox" data-avail="${i}" ${state.me.availability[i]?'checked':''}></label>`).join('');$$('[data-avail]').forEach(x=>x.onchange=()=>{state.me.availability[x.dataset.avail]=x.checked;save()})};
$('#addSocialBtn').onclick=()=>{openModal(`<p class="eyebrow">אות מהרשת</p><h2>שמור קישור או רעיון</h2><p>רק תוכן שאתה או בת הזוג בחרתם לשתף.</p><input id="socialLink" placeholder="קישור / תיאור" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px"><button class="primary full" style="margin-top:12px" id="saveSocial">שמור</button>`);$('#saveSocial').onclick=()=>{const v=$('#socialLink').value.trim();if(!v)return;state.partner.social.push({value:v,date:new Date().toISOString()});save();closeModal();toast('נשמר אות חדש')}}
if(state.me.location)$('#locationStatus').textContent='קיימת הרשאת מיקום שמורה במכשיר.';
fillForms();render();
