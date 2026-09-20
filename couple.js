const KEY='coupleApp.v1';
const defaults={
  me:{name:'',homeAddress:'',maxDistance:30,giftBudget:200,dateBudget:400,gestureBudget:70,location:null,availability:{}},
  partner:{name:'',years:'',likes:'',dislikes:'',foodPrefs:'',giftPrefs:'',emotionalPrefs:'',preferenceTags:[],avoidTags:[],hints:[],social:[]},
  plan:{budget:800,gifts:1,dates:2,gestures:4,courtship:8,automation:'prepare',autoLimit:70,style:'משולב',autoPlanner:true},
  progress:{gifts:0,dates:0,gestures:0,courtship:0,spent:0},
  orders:[],
  planner:{dailyKey:'',daily:null,dailyVariant:0,weekKey:'',monthKey:'',lastTypes:[],lastItems:[]},
  feedback:{rejectedItems:{},rejectedTypes:{},rejectedTags:{}},
  events:[],
  week:[],
  month:[]
};
let state=load();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function clone(o){return JSON.parse(JSON.stringify(o))}
function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=merge(a[k]||{},b[k])}else if(b[k]!==undefined)a[k]=b[k]}return a}
function load(){try{return merge(clone(defaults),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return clone(defaults)}}
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
  printedCard:'https://mysiddurname.co.il/product/%D7%9B%D7%A8%D7%98%D7%99%D7%A1-%D7%91%D7%A8%D7%9B%D7%94/',
  giftushVinyl:'https://www.giftush.co.il/%D7%AA%D7%A7%D7%9C%D7%99%D7%98-%D7%95%D7%99%D7%A0%D7%99%D7%9C-%D7%A7%D7%9C%D7%90%D7%A1%D7%99-%D7%9E%D7%A2%D7%A5-%D7%A2%D7%9D-%D7%94%D7%A9%D7%99%D7%A8-%D7%A9%D7%9C%D7%9B%D7%9D-spotify',
  giftushEngraved:'https://www.giftush.co.il/%D7%97%D7%A8%D7%99%D7%98%D7%AA-%D7%AA%D7%9E%D7%95%D7%A0%D7%94-%D7%A2%D7%9C-%D7%A2%D7%A6%D7%99%D7%A5'
};
function mapsSearch(query){
  const loc=state.me.location;
  const suffix=loc?` ליד ${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`:'';
  return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query+suffix)
}
function providerButtons(items){
  return '<div class="provider-actions">'+items.map(x=>`<div class="provider-link ${x.primary?'primary-provider':''}"><span>${x.icon||'✓'}</span><div><strong>${esc(x.label)}</strong><small>${esc(x.note||'הספק יוצג בתוך האפליקציה')}</small></div></div>`).join('')+'</div>'
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
 const hint=state.partner.hints[state.partner.hints.length-1];
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
 const current=state.planner.daily;if(current)learnFromRefresh({id:current.id||null,kind:current.type||'free'});
 state.planner.daily=chooseSmartAction(state.planner.dailyVariant);state.planner.dailyKey=localDateKey();persistOnly();render()
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
function oneTapMessage(kind){
 const name=partnerName();
 const messages={
  flower:`סתם כי חשבתי עלייך. לא צריך סיבה מיוחדת כדי להזכיר לך שאני אוהב אותך ❤️`,
  sweet:`משהו קטן ומתוק בשבילך, כי הגיע לך רגע קטן של כיף היום ❤️`,
  card:`לא חיכיתי לאירוע מיוחד. רק רציתי שתדעי שאני רואה אותך, מעריך אותך ואוהב אותך.`,
  gift:`ראיתי את זה וחשבתי עלייך. הקשבתי למה שאמרת ❤️`,
  date:`שמרי לי את הערב. אני דואג לכל השאר ❤️`,
  free:`רק רציתי להגיד לך משהו שאני לא אומר מספיק: אני מעריך אותך ואת כל מה שאת מביאה לחיים שלנו.`
 };
 return messages[kind]||messages.free
}
function catalogProfileText(){
 return ([
  state.partner.likes,state.partner.giftPrefs,state.partner.foodPrefs,state.partner.emotionalPrefs,
  ...(state.partner.preferenceTags||[]),...state.partner.hints.map(h=>h.text||'')
 ]).join(' ').toLowerCase()
}
function catalogAvoidText(){
 return ([state.partner.dislikes,...(state.partner.avoidTags||[])]).join(' ').toLowerCase()
}
function catalogResolvedUrl(item){
 if(item.url)return item.url;
 if(item.providerKey&&providers[item.providerKey])return providers[item.providerKey];
 if(item.mapsQuery)return mapsSearch(item.mapsQuery);
 return null
}
function catalogBudgetCap(type){
 const left=budgetLeft();
 if(type==='gift')return Math.min(left,+state.me.giftBudget||left);
 if(type==='date')return Math.min(left,+state.me.dateBudget||left);
 if(type==='gesture')return Math.min(left,+state.me.gestureBudget||left);
 return left
}
function bumpFeedback(bucket,key,amount=1){
 if(!key)return;
 state.feedback=state.feedback||{rejectedItems:{},rejectedTypes:{},rejectedTags:{}};
 state.feedback[bucket]=state.feedback[bucket]||{};
 state.feedback[bucket][key]=(state.feedback[bucket][key]||0)+amount
}
function learnFromRefresh(plan){
 if(!plan)return;
 bumpFeedback('rejectedItems',plan.id,3);
 bumpFeedback('rejectedTypes',plan.kind,1);
 const catalog=Array.isArray(window.COUPLE_CATALOG)?window.COUPLE_CATALOG:[];
 const source=catalog.find(x=>x.id===plan.id);
 ((source&&source.tags)||[]).slice(0,3).forEach(tag=>bumpFeedback('rejectedTags',String(tag).toLowerCase(),1));
 rememberItem(plan.id);
 rememberType(plan.kind);
 state.planner.dailyVariant=(state.planner.dailyVariant||0)+1;
 state.planner.dailyKey='';
 persistOnly()
}
function feedbackPenalty(item){
 const fb=state.feedback||{};
 let penalty=((fb.rejectedItems&&fb.rejectedItems[item.id])||0)*12+((fb.rejectedTypes&&fb.rejectedTypes[item.type])||0)*3;
 (item.tags||[]).forEach(tag=>{penalty+=((fb.rejectedTags&&fb.rejectedTags[String(tag).toLowerCase()])||0)*4});
 return penalty
}
function catalogScore(item){
 const profile=catalogProfileText(),avoid=catalogAvoidText(),left=budgetLeft();
 let score=12;
 const cap=catalogBudgetCap(item.type);
 if((item.price||0)>left || (item.price||0)>cap)score-=1000;
 const avoided=(item.avoid||[]).some(tag=>avoid.includes(String(tag).toLowerCase()));
 if(avoided)score-=1000;
 (item.tags||[]).forEach(tag=>{if(profile.includes(String(tag).toLowerCase()))score+=7});
 if(item.type==='gift')score+=state.progress.gifts<state.plan.gifts?12:-3;
 if(item.type==='date'){score+=state.progress.dates<state.plan.dates?12:-3;score+=dayIsAvailable(new Date().getDay())?5:-10}
 if(item.type==='gesture')score+=state.progress.gestures<state.plan.gestures?10:-2;
 if(item.type==='free')score+=state.progress.courtship<state.plan.courtship?7:2;
 const ev=upcomingEvent(5);
 if(ev&&(item.type==='gift'||item.type==='gesture'))score+=8;
 if(state.partner.hints.length&&(item.type==='gift'||item.type==='gesture'))score+=4;
 if(left<Math.max(80,state.plan.budget*.2)&&item.price===0)score+=12;
 if(item.effort==='low')score+=3;
 const recent=state.planner.lastItems||[];
 recent.forEach((id,i)=>{if(id===item.id)score-=30-i*3});
 const recentTypes=state.planner.lastTypes||[];
 recentTypes.forEach((t,i)=>{if(t===item.type)score-=5-i});
 score-=feedbackPenalty(item);
 return score
}
function catalogReason(item){
 const bits=[];const profile=catalogProfileText();const ev=upcomingEvent(5);
 const matched=(item.tags||[]).filter(t=>profile.includes(String(t).toLowerCase())).slice(0,2);
 if(matched.length)bits.push('מתאים למה שהיא אוהבת: '+matched.join(', '));
 if(ev&&(item.type==='gift'||item.type==='gesture'))bits.push(ev.title+' מתקרב');
 if(item.type==='date'&&dayIsAvailable(new Date().getDay()))bits.push('היום מתאים ללוז שהגדרת');
 if(item.type==='gift'&&state.progress.gifts<state.plan.gifts)bits.push('עוד חסרה מתנה בתוכנית');
 if(item.type==='gesture'&&state.progress.gestures<state.plan.gestures)bits.push('עוד חסרה מחווה בתוכנית');
 if(item.type==='date'&&state.progress.dates<state.plan.dates)bits.push('עוד חסר דייט בתוכנית');
 if(item.price===0)bits.push('לא דורש הוצאה');
 return bits.slice(0,2).join(' · ')||'נבחר כדי לגוון ולשמור על חיזור רציף'
}
function rememberItem(id){
 if(!id)return;
 state.planner.lastItems=Array.isArray(state.planner.lastItems)?state.planner.lastItems:[];
 state.planner.lastItems.unshift(id);
 state.planner.lastItems=state.planner.lastItems.slice(0,8)
}
function oneTapPlan(){
 const catalog=Array.isArray(window.COUPLE_CATALOG)?window.COUPLE_CATALOG:[];
 if(catalog.length){
   const ranked=catalog.map(item=>({...item,_score:catalogScore(item)})).filter(x=>x._score>-500).sort((a,b)=>b._score-a._score);
   const top=ranked.slice(0,Math.min(6,ranked.length));
   const variant=state.planner.dailyVariant||0;
   const item=top[(seededNumber(localDateKey()+'|'+state.plan.style+'|'+variant)%Math.max(1,top.length))]||ranked[0];
   if(item){
     const messageKind=item.messageKey||item.type;
     return {
       id:item.id,kind:item.type,icon:item.icon,title:item.title,buy:item.buy,
       cost:item.price||0,priceLabel:item.priceLabel||(item.price?item.price+' ₪':'ללא עלות'),
       url:catalogResolvedUrl(item),provider:item.provider||'',reason:catalogReason(item),
       message:oneTapMessage(messageKind),verified:Boolean(item.verified)
     }
   }
 }
 const fallback=chooseSmartAction(state.planner.dailyVariant||0);
 return {kind:fallback.type,icon:fallback.icon,title:fallback.title,buy:fallback.body,cost:fallback.cost||0,priceLabel:fallback.cost?fallback.cost+' ₪':'ללא עלות',url:null,provider:'',reason:fallback.reason||inferReason(fallback),message:oneTapMessage(fallback.type)}
}
function executeOneTap(plan){
 const normalizedType=(plan.kind==='flower'||plan.kind==='sweet'||plan.kind==='card')?'gesture':plan.kind;
 const order={
   id:Date.now(),createdAt:new Date().toISOString(),status:'pending',
   type:normalizedType,title:plan.title,buy:plan.buy,cost:plan.cost||0,
   priceLabel:plan.priceLabel||(plan.cost?plan.cost+' ₪':'ללא עלות'),
   provider:plan.provider||'',message:plan.message||'',sourceId:plan.id||null
 };
 state.orders=Array.isArray(state.orders)?state.orders:[];
 state.orders.unshift(order);
 rememberType(normalizedType);rememberItem(plan.id);
 state.planner.dailyKey='';
 persistOnly();render();
 openModal(`<p class="eyebrow">נשארים בתוך האפליקציה</p><h2>✓ הפעולה מוכנה לביצוע</h2><div class="one-tap-result"><div class="decision-label">מה הוכן</div><strong>${esc(plan.buy)}</strong><div class="decision-grid"><div><small>תקציב</small><b>${esc(order.priceLabel)}</b></div><div><small>ספק</small><b>${esc(order.provider||'לא נדרש')}</b></div></div><div class="decision-label">ברכה</div><blockquote>${esc(order.message||'אין צורך בברכה')}</blockquote></div><p class="muted">לא יצאנו לאתר חיצוני. הפעולה נשמרה בתוך האפליקציה כ״ממתין לביצוע״. רכישה אמיתית תתבצע רק אחרי שנחבר ספק שתומך בהזמנה ישירה מתוך האפליקציה.</p><button class="primary full" id="closePreparedOrder">הבנתי</button>`);
 $('#closePreparedOrder').onclick=closeModal
}
function oneTapCourtship(){
 const plan=oneTapPlan();
 openModal(`<p class="eyebrow">אני בוחר בשבילך</p><h2>${plan.icon} ${esc(plan.title)}</h2><div class="one-tap-result"><div class="decision-label">מה עושים</div><strong>${esc(plan.buy)}</strong><div class="decision-grid"><div><small>תקציב</small><b>${esc(plan.priceLabel||(plan.cost?plan.cost+' ₪':'0 ₪'))}</b></div><div><small>ספק</small><b>${esc(plan.provider||'לא צריך')}</b></div></div><div class="decision-label">הברכה כבר מוכנה</div><blockquote>${esc(plan.message)}</blockquote><span class="plan-reason">${esc(plan.reason)}</span></div><button class="primary full one-tap-execute" id="executeOneTapBtn">תעשה את זה</button><button class="ghost full" style="margin-top:8px" id="rejectOneTapBtn">רענן</button><p class="muted">אין צורך לבחור מוצר או לנסח ברכה. הכול נשמר ומוכן בתוך האפליקציה, בלי להעביר אותך לאתר אחר.</p>`);
 $('#executeOneTapBtn').onclick=()=>executeOneTap(plan);
 $('#rejectOneTapBtn').onclick=()=>{learnFromRefresh(plan);oneTapCourtship()}
}
let currentHomeDecision=null;
function profileReady(){
 return Boolean(state.partner.name && ((state.partner.preferenceTags||[]).length>=2 || state.partner.likes.trim()) && state.plan.budget>0)
}
function quickSetup(){
 const pref=['מסעדות','הופעות','מוזיקה','ים וטבע','ספרים','תכשיטים','תמונות וזיכרונות','ספא','מתוקים','ערב בבית'];
 const avoid=['פרחים','מתוקים','מקומות רועשים','הפתעות גדולות'];
 const selected=new Set(state.partner.preferenceTags||[]);
 const avoided=new Set(state.partner.avoidTags||[]);
 openModal(`<p class="eyebrow">הגדרה חד־פעמית</p><h2>דקה אחת ואני חושב במקומך</h2><label>איך קוראים לה?</label><input id="qsName" value="${esc(state.partner.name)}" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin:7px 0 14px"><div class="decision-label">מה היא אוהבת? בחר 2–4</div><div class="quick-setup-grid" id="qsPrefs">${pref.map(x=>`<button type="button" data-qs-pref="${esc(x)}" class="${selected.has(x)?'selected':''}">${esc(x)}</button>`).join('')}</div><div class="decision-label">מה לא לשלוח / לא להציע?</div><div class="quick-setup-grid" id="qsAvoid">${avoid.map(x=>`<button type="button" data-qs-avoid="${esc(x)}" class="${avoided.has(x)?'selected':''}">${esc(x)}</button>`).join('')}</div><label>כמה מותר לי להוציא בחודש בלי שתצטרך לחשב?</label><select id="qsBudget" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin:7px 0 14px"><option value="400">400 ₪</option><option value="800">800 ₪</option><option value="1200">1,200 ₪</option><option value="2000">2,000 ₪</option></select><button class="primary full" id="qsSave">סיימנו — תחשוב במקומי</button>`);
 $('#qsBudget').value=String(state.plan.budget||800);
 $$('[data-qs-pref]').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));
 $$('[data-qs-avoid]').forEach(b=>b.onclick=()=>b.classList.toggle('selected'));
 $('#qsSave').onclick=()=>{
   state.partner.name=$('#qsName').value.trim();
   state.partner.preferenceTags=$$('[data-qs-pref].selected').map(b=>b.dataset.qsPref);
   state.partner.avoidTags=$$('[data-qs-avoid].selected').map(b=>b.dataset.qsAvoid);
   state.partner.likes=[state.partner.likes,state.partner.preferenceTags.join(', ')].filter(Boolean).join(', ');
   state.plan.budget=+$('#qsBudget').value||800;
   state.plan.autoPlanner=true;
   state.planner.dailyKey='';
   ensureAutomaticPlanning(true);persistOnly();closeModal();fillForms();render();toast('מוכן. מעכשיו האפליקציה חושבת במקומך')
 }
}
function renderDecisionCard(){
 if(!$('#autoDecisionCard'))return;
 currentHomeDecision=oneTapPlan();
 $('#decisionEmoji').textContent=currentHomeDecision.icon;
 $('#decisionTitle').textContent=currentHomeDecision.title;
 $('#decisionText').textContent=currentHomeDecision.buy;
 $('#decisionCost').textContent=currentHomeDecision.priceLabel||(currentHomeDecision.cost?currentHomeDecision.cost+' ₪':'ללא עלות');
 $('#decisionProvider').textContent=currentHomeDecision.provider||'לא צריך ספק';
 $('#decisionExecuteBtn').textContent='תעשה את זה';
 $('#decisionExecuteBtn').onclick=()=>executeOneTap(currentHomeDecision);
 $('#decisionAnotherBtn').onclick=()=>{learnFromRefresh(currentHomeDecision);currentHomeDecision=oneTapPlan();renderDecisionCard()};
 $('#decisionWhyBtn').onclick=()=>{openModal(`<p class="eyebrow">למה בחרתי את זה?</p><h2>${currentHomeDecision.icon} ${esc(currentHomeDecision.title)}</h2><p>${esc(currentHomeDecision.reason)}</p><div class="result-card"><strong>אני בודק אוטומטית</strong><p>תקציב שנשאר, מה כבר עשית, מה היא אוהבת ולא אוהבת, רמזים ששמרת, אירועים קרובים והלוז שהגדרת.</p></div><button class="primary full" id="whyExecute">בצע את ההצעה</button>`);$('#whyExecute').onclick=()=>executeOneTap(currentHomeDecision)};
 $('#quickSetupCard').hidden=profileReady();
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
function tailoredAction(){return getDailyAction()}
function showAction(a=tailoredAction()){
 openModal(`<p class="eyebrow">הצעה חכמה</p><h2>${a.icon} ${esc(a.title)}</h2><p>${esc(a.body)}</p>${a.reason?`<div class="planner-status"><strong>למה עכשיו?</strong><br>${esc(a.reason)}</div>`:''}<div class="result-card"><small>עלות משוערת</small><div class="price">${a.cost?a.cost+' ₪':'ללא עלות'}</div></div><button class="primary full" id="completeAction">עשיתי / בצעתי</button><button class="ghost full" style="margin-top:8px" id="anotherAction">תן משהו אחר</button>`);
 $('#completeAction').onclick=()=>{state.progress.courtship++;if(a.type==='gesture')state.progress.gestures++;if(a.type==='date')state.progress.dates++;if(a.type==='gift')state.progress.gifts++;state.progress.spent+=a.cost||0;rememberType(a.type);state.planner.dailyKey='';ensureAutomaticPlanning(true);save();closeModal();toast('נשמר כחיזור שבוצע ♥')};
 $('#anotherAction').onclick=()=>{nextDailyAlternative();showAction(getDailyAction())}
}
function render(){
 $('#greeting').textContent=state.partner.name?`תפנק את ${state.partner.name} היום`:'תפנק אותה היום';
 $('#heroSub').textContent='אני כבר אחשוב מה לעשות.';
 $('#partnerHeading').textContent=state.partner.name||'בת הזוג';
 $('#partnerAvatar').textContent=state.partner.name?state.partner.name.trim().charAt(0):'♥';
 const a=getDailyAction();$('#dailyTitle').textContent=a.title;$('#dailyBody').textContent=a.body+(a.reason?' — '+a.reason:'');$('#doDailyBtn').onclick=()=>showAction(a);
 $('#courtshipProgress').textContent=`${state.progress.courtship}/${state.plan.courtship}`;
 $('#gestureProgress').textContent=`${state.progress.gestures}/${state.plan.gestures}`;
 $('#dateProgress').textContent=`${state.progress.dates}/${state.plan.dates}`;
 $('#giftProgress').textContent=`${state.progress.gifts}/${state.plan.gifts}`;
 $('#budgetRemaining').textContent=`${Math.max(0,state.plan.budget-state.progress.spent)} ₪`;
 if($('#plannerStatus'))$('#plannerStatus').textContent=state.plan.autoPlanner?'פעיל: היום, השבוע והחודש מתעדכנים אוטומטית לפי הנתונים שלך.':'כבוי: התוכניות ישתנו רק כשתבקש.';
 renderDecisionCard();renderPendingOrders();renderHints();renderEvents();renderWeek();renderMonth();renderInsights();
}
function renderPendingOrders(){
 const list=(state.orders||[]).filter(o=>o.status==='pending');
 const section=$('#pendingOrdersSection');
 if(section)section.hidden=list.length===0;
 if($('#pendingOrdersCount'))$('#pendingOrdersCount').textContent=String(list.length);
 if(!$('#pendingOrdersList'))return;
 $('#pendingOrdersList').innerHTML=list.length?list.map(o=>`<div class="pending-order-card"><div class="pending-order-main"><span class="emoji">${o.type==='gift'?'🎁':o.type==='date'?'🥂':o.type==='gesture'?'🌹':'❤️'}</span><div><strong>${esc(o.title)}</strong><small>${esc(o.priceLabel||'')}</small><p>${esc(o.buy||'')}</p></div></div><div class="pending-order-actions"><button class="primary" data-order-done="${o.id}">בוצע</button><button class="ghost" data-order-cancel="${o.id}">בטל</button></div></div>`).join(''):'';
 $('[data-order-done]').forEach(b=>b.onclick=()=>completePreparedOrder(+b.dataset.orderDone));
 $('[data-order-cancel]').forEach(b=>b.onclick=()=>cancelPreparedOrder(+b.dataset.orderCancel));
}
function completePreparedOrder(id){
 const order=(state.orders||[]).find(o=>o.id===id);if(!order)return;
 order.status='done';order.completedAt=new Date().toISOString();
 state.progress.courtship++;
 if(order.type==='gesture')state.progress.gestures++;
 if(order.type==='gift')state.progress.gifts++;
 if(order.type==='date')state.progress.dates++;
 state.progress.spent+=order.cost||0;
 state.planner.dailyKey='';
 ensureAutomaticPlanning(true);persistOnly();render();toast('סומן כבוצע ♥')
}
function cancelPreparedOrder(id){
 const order=(state.orders||[]).find(o=>o.id===id);if(!order)return;
 order.status='cancelled';persistOnly();render();toast('הפעולה בוטלה')
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
 $('#weekPlan').innerHTML=state.week.length?state.week.map(x=>`<div class="timeline-item"><div class="day">${esc(x.day)}</div><div><strong>${esc(x.title)}</strong><small>${esc(x.detail)}</small>${x.reason?`<span class="plan-reason">${esc(x.reason)}</span>`:''}</div><span>${x.icon}</span></div>`).join(''):'<p class="muted">עוד לא נבנתה תוכנית שבועית.</p>'
}
function renderMonth(){
 $('#monthPlan').innerHTML=state.month.length?state.month.map(x=>`<div class="timeline-item"><div class="day">${esc(x.when)}</div><div><strong>${esc(x.title)}</strong><small>${esc(x.detail)}</small>${x.reason?`<span class="plan-reason">${esc(x.reason)}</span>`:''}</div><span>${x.icon}</span></div>`).join(''):'<p class="muted">שמור את התוכנית כדי לבנות חודש.</p>'
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
 const budget=state.me.giftBudget||200;const hint=state.partner.hints[state.partner.hints.length-1];
 openModal(`<p class="eyebrow">מתנה</p><h2>מצא מתנה ל${esc(partnerName())}</h2><p>${hint?'אפשר להשתמש ברמז האחרון: “'+esc(hint.text)+'”.':'ההצעה תתבסס על ההעדפות ששמרת.'}</p><label>תקציב</label><input id="flowBudget" type="number" value="${budget}" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px;margin:8px 0 14px"><button class="primary full" id="findGift">מצא מתנה</button>`);
 $('#findGift').onclick=()=>{
  const b=+$('#flowBudget').value||budget;
  const ideas=['ספר או פריט שהיא הזכירה','תכשיט עדין בסגנון שלה','מארז קטן שמתחבר לתחביב שלה'];
  const idea=hint?`מתנה שמבוססת על: “${hint.text}”`:ideas[Math.floor(Math.random()*ideas.length)];
  openModal(`<p class="eyebrow">הבחירה שלי</p><h2>🎁 ${esc(idea)}</h2><div class="result-card"><p>הספק כבר נבחר. הפעולה תישמר ותבוצע מתוך האפליקציה כשהחיבור הישיר יהיה פעיל.</p><div class="price">עד ${b} ₪</div></div>${providerButtons([
    {url:providers.woltGifts,icon:'🛵',label:'פתח מתנות ב-Wolt',note:'משלוח, ברכה ומעקב',primary:true},
    {url:mapsSearch('חנות מתנות'),icon:'📍',label:'מתנות קרוב אליי',note:'חיפוש לפי המיקום שלך'},
    {url:providers.printedCard,icon:'💌',label:'הוסף כרטיס ברכה מודפס',note:'טקסט אישי ומשלוח'}
  ])}<button class="primary full" id="approveGift">סמן שהמתנה הוזמנה</button><p class="muted">לא נפתח אתר חיצוני. ההזמנה נשמרת בתוך האפליקציה עד לחיבור תשלום וספק ישיר.</p>`);
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
  ])}<button class="primary full" id="approveDate">סמן שהדייט אורגן</button><p class="muted">הכול נשאר בתוך האפליקציה. הזמנה בפועל תופעל רק דרך חיבור ספק ישיר.</p>`);
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
function buildWeek(){autoBuildWeek(true);save();toast('נבנה שבוע חדש לפי הלוז, התקציב והפרופיל')}
function buildMonth(){autoBuildMonth(true);save()}
function surprise(){const options=[giftFlow,dateFlow,gestureFlow,()=>showAction()];options[Math.floor(Math.random()*options.length)]()}

$('.bottom-nav button[data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function go(tab){$('.bottom-nav button[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));$('.tab-page').forEach(x=>x.classList.toggle('active',x.dataset.page===tab));scrollTo({top:0,behavior:'smooth'})}
function openAllFeatures(){
 openModal(`<p class="eyebrow">כל האפשרויות</p><h2>רוצה יותר שליטה?</h2><p>הפעולה היומית נשארת פשוטה. כאן נמצאים כל הכלים למי שרוצה להעמיק.</p><div class="feature-hub-grid">
   <button data-hub-go="courtship"><span>❤️</span><strong>חיזור</strong><small>שבוע חיזור ופעולות</small></button>
   <button data-hub-go="plans"><span>📅</span><strong>תוכניות</strong><small>שבוע, חודש ותקציב</small></button>
   <button data-hub-flow="gift"><span>🎁</span><strong>מתנה</strong><small>לבחור ידנית</small></button>
   <button data-hub-flow="date"><span>🥂</span><strong>דייט</strong><small>לבנות ידנית</small></button>
   <button data-hub-go="partner"><span>♥</span><strong>היא</strong><small>העדפות ורמזים</small></button>
   <button data-hub-go="me"><span>⚙</span><strong>הגדרות</strong><small>זמן, תקציב ומיקום</small></button>
 </div><button class="ghost full" id="hubHintBtn">＋ היא אמרה משהו</button>`);
 $('[data-hub-go]').forEach(b=>b.onclick=()=>{closeModal();go(b.dataset.hubGo)});
 $('[data-hub-flow]').forEach(b=>b.onclick=()=>{const fn={gift:giftFlow,date:dateFlow,gesture:gestureFlow}[b.dataset.hubFlow];if(fn)fn()});
 $('#hubHintBtn').onclick=addHint
}
$('#openAllFeaturesBtn').onclick=openAllFeatures;
$('#allFeaturesNavBtn').onclick=openAllFeatures;
$('[data-flow]').forEach(b=>b.onclick=()=>({gift:giftFlow,date:dateFlow,gesture:gestureFlow,surprise}[b.dataset.flow])());
$('#oneTapCourtshipBtn').onclick=oneTapCourtship;
$('#quickSetupBtn').onclick=quickSetup;
$('#doNowBtn').onclick=()=>showAction();$('#courtshipNow').onclick=()=>showAction();$('#refreshDailyBtn').onclick=nextDailyAlternative;
$('#quickAddBtn').onclick=addHint;$('#addHintBtn').onclick=addHint;$('#partnerHintBtn').onclick=addHint;$('#addEventBtn').onclick=addEvent;
$('#buildWeek').onclick=buildWeek;$('#regenerateWeek').onclick=buildWeek;
$('#autoCourtship').onclick=()=>{state.plan.autoPlanner=true;ensureAutomaticPlanning(true);persistOnly();fillForms();render();go('plans');toast('התכנון האוטומטי הופעל')};
$$('#styleChips button').forEach(b=>b.onclick=()=>{$$('#styleChips button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.plan.style=b.dataset.style;save()});

function fillForms(){
 $('#partnerName').value=state.partner.name;$('#relationshipYears').value=state.partner.years;$('#likes').value=state.partner.likes;$('#dislikes').value=state.partner.dislikes;$('#foodPrefs').value=state.partner.foodPrefs;$('#giftPrefs').value=state.partner.giftPrefs;$('#emotionalPrefs').value=state.partner.emotionalPrefs;
 $('#myName').value=state.me.name;$('#homeAddress').value=state.me.homeAddress;$('#maxDistance').value=state.me.maxDistance;$('#giftBudget').value=state.me.giftBudget;$('#dateBudget').value=state.me.dateBudget;$('#gestureBudget').value=state.me.gestureBudget;
 $('#monthlyBudget').value=state.plan.budget;$('#budgetValue').textContent=state.plan.budget;$('#autoPlannerEnabled').checked=state.plan.autoPlanner!==false;$('#planGifts').value=state.plan.gifts;$('#planDates').value=state.plan.dates;$('#planGestures').value=state.plan.gestures;$('#planCourtship').value=state.plan.courtship;$('#automationLevel').value=state.plan.automation;$('#autoLimit').value=state.plan.autoLimit;$('#autoLimitWrap').hidden=state.plan.automation!=='limited';
 const active=$$('#styleChips button').find(x=>x.dataset.style===state.plan.style);if(active)active.classList.add('active')
}
$('#savePartnerBtn').onclick=()=>{Object.assign(state.partner,{name:$('#partnerName').value.trim(),years:$('#relationshipYears').value,likes:$('#likes').value.trim(),dislikes:$('#dislikes').value.trim(),foodPrefs:$('#foodPrefs').value.trim(),giftPrefs:$('#giftPrefs').value.trim(),emotionalPrefs:$('#emotionalPrefs').value.trim()});state.planner.dailyKey='';ensureAutomaticPlanning(true);save();toast('פרופיל בת הזוג נשמר והתכנון עודכן')};
$('#saveMeBtn').onclick=()=>{Object.assign(state.me,{name:$('#myName').value.trim(),homeAddress:$('#homeAddress').value.trim(),maxDistance:+$('#maxDistance').value,giftBudget:+$('#giftBudget').value||0,dateBudget:+$('#dateBudget').value||0,gestureBudget:+$('#gestureBudget').value||0});state.planner.dailyKey='';ensureAutomaticPlanning(true);save();toast('ההגדרות נשמרו והתכנון עודכן')};
$('#monthlyBudget').oninput=e=>$('#budgetValue').textContent=e.target.value;
$('#automationLevel').onchange=e=>$('#autoLimitWrap').hidden=e.target.value!=='limited';$('#autoPlannerEnabled').onchange=e=>{state.plan.autoPlanner=e.target.checked;if(state.plan.autoPlanner)ensureAutomaticPlanning(true);persistOnly();render()};
$('#savePlanBtn').onclick=()=>{Object.assign(state.plan,{budget:+$('#monthlyBudget').value,gifts:+$('#planGifts').value,dates:+$('#planDates').value,gestures:+$('#planGestures').value,courtship:+$('#planCourtship').value,automation:$('#automationLevel').value,autoLimit:+$('#autoLimit').value||0,autoPlanner:$('#autoPlannerEnabled').checked});state.planner.dailyKey='';ensureAutomaticPlanning(true);save();toast(state.plan.autoPlanner?'התוכנית נשמרה והתכנון האוטומטי עודכן':'התוכנית נשמרה')};

$('#locationBtn').onclick=()=>{
 if(!navigator.geolocation){toast('המכשיר לא תומך במיקום');return}
 navigator.geolocation.getCurrentPosition(p=>{state.me.location={lat:p.coords.latitude,lng:p.coords.longitude,updated:new Date().toISOString()};save();$('#locationStatus').textContent='המיקום נשמר בהרשאה. אפשר לבטל הרשאה בהגדרות המכשיר.';toast('המיקום נשמר')},()=>toast('לא התקבלה הרשאת מיקום'),{enableHighAccuracy:false,timeout:8000})
};
const dayNames=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
$('#calendarBtn').onclick=()=>{const box=$('#availabilityEditor');box.hidden=!box.hidden;if(!box.innerHTML)box.innerHTML=dayNames.map((d,i)=>`<label class="availability-row"><span>${d}</span><input type="checkbox" data-avail="${i}" ${state.me.availability[i]?'checked':''}></label>`).join('');$$('[data-avail]').forEach(x=>x.onchange=()=>{state.me.availability[x.dataset.avail]=x.checked;save()})};
$('#addSocialBtn').onclick=()=>{openModal(`<p class="eyebrow">אות מהרשת</p><h2>שמור קישור או רעיון</h2><p>רק תוכן שאתה או בת הזוג בחרתם לשתף.</p><input id="socialLink" placeholder="קישור / תיאור" style="width:100%;padding:11px;border:1px solid #e8dfdd;border-radius:14px"><button class="primary full" style="margin-top:12px" id="saveSocial">שמור</button>`);$('#saveSocial').onclick=()=>{const v=$('#socialLink').value.trim();if(!v)return;state.partner.social.push({value:v,date:new Date().toISOString()});save();closeModal();toast('נשמר אות חדש')}}
if(state.me.location)$('#locationStatus').textContent='קיימת הרשאת מיקום שמורה במכשיר.';
ensureAutomaticPlanning(false);fillForms();render();
