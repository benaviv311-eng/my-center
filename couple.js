const KEY='coupleApp.v1';
const defaults={
  me:{name:'',homeAddress:'',maxDistance:30,giftBudget:200,dateBudget:400,gestureBudget:70,location:null,availability:{}},
  partner:{name:'',years:'',likes:'',dislikes:'',foodPrefs:'',giftPrefs:'',emotionalPrefs:'',hints:[],social:[]},
  plan:{budget:800,gifts:1,dates:2,gestures:4,courtship:8,automation:'prepare',autoLimit:70,style:'משולב'},
  progress:{gifts:0,dates:0,gestures:0,courtship:0,spent:0},
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
 $('#findGift').onclick=()=>{const b=+$('#flowBudget').value||budget;const ideas=['ספר או פריט שהיא הזכירה','תכשיט עדין בסגנון שלה','מארז קטן שמתחבר לתחביב שלה'];const idea=hint?`מתנה שמבוססת על: “${hint.text}”`:ideas[Math.floor(Math.random()*ideas.length)];openModal(`<p class="eyebrow">הבחירה שלי</p><h2>🎁 ${esc(idea)}</h2><div class="result-card"><p>המערכת תמצא ספק ומשלוח בתקציב שהוגדר.</p><div class="price">עד ${b} ₪</div></div><button class="primary full" id="approveGift">המשך להזמנה</button><p class="muted">ב־MVP עדיין לא מחובר ספק מסחר. הלחיצה תשמור את הפעולה ותכין אותה לחיבור ספק בהמשך.</p>`);$('#approveGift').onclick=()=>{state.progress.gifts++;state.progress.courtship++;save();closeModal();toast('המתנה נוספה לביצוע')}}}
function dateFlow(){
 const b=state.me.dateBudget||400;
 openModal(`<p class="eyebrow">דייט</p><h2>תן לי לארגן ערב</h2><div class="modal-options"><button class="modal-option selected" data-date-style="רומנטי">רומנטי</button><button class="modal-option" data-date-style="מצחיק">מצחיק</button><button class="modal-option" data-date-style="רגוע">רגוע</button><button class="modal-option" data-date-style="חדש">חדש לנו</button></div><label>תקציב כולל</label><input id="dateFlowBudget" type="number" value="${b}" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin:8px 0 14px"><button class="primary full" id="buildDate">בנה לי דייט</button>`);
 let style='רומנטי';$$('[data-date-style]').forEach(x=>x.onclick=()=>{$$('[data-date-style]').forEach(y=>y.classList.remove('selected'));x.classList.add('selected');style=x.dataset.dateStyle});
 $('#buildDate').onclick=()=>{const budget=+$('#dateFlowBudget').value||b;const dist=state.me.maxDistance||30;openModal(`<p class="eyebrow">דייט מוכן</p><h2>🥂 ערב ${esc(style)}</h2><div class="result-card"><h3>19:30 יציאה</h3><p>20:00 פעילות או מקום שמתאים להעדפות של ${esc(partnerName())}<br>21:30 אוכל / קינוח קרוב<br>23:00 חזרה</p><small>טווח נסיעה</small><div class="price">עד ${dist} דקות · עד ${budget} ₪</div></div><button class="primary full" id="approveDate">ארגן את הדייט</button><p class="muted">בשלב הבא נחבר זמינות אמיתית של מסעדות, הופעות וכרטיסים.</p>`);$('#approveDate').onclick=()=>{state.progress.dates++;state.progress.courtship++;save();closeModal();toast('הדייט נוסף לתוכנית')}}}
function gestureFlow(){
 const b=state.me.gestureBudget||70;
 openModal(`<p class="eyebrow">מחווה</p><h2>משהו קטן עכשיו</h2><div class="modal-options"><button class="modal-option" data-gesture="free">בלי כסף</button><button class="modal-option" data-gesture="delivery">משלוח קטן</button><button class="modal-option" data-gesture="home">בבית</button><button class="modal-option" data-gesture="work">לעבודה</button></div><button class="primary full" id="randomGesture">תבחר בשבילי</button>`);
 $$('[data-gesture]').forEach(x=>x.onclick=()=>{const type=x.dataset.gesture;const a=type==='free'?actionPool[0]:type==='home'?actionPool[1]:{type:'gesture',icon:'🌹',title:type==='work'?'הפתעה לעבודה':'משלוח קטן',body:`מצא משהו קטן עד ${b} ₪ ושלח עם ברכה אישית.`,cost:b};showAction(a)});
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
