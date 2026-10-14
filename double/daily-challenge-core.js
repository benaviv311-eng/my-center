(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DoubleDailyChallenge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='double-daily-v1';
  const ICONS=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];
  function buildDeck(){
    const n=7,cards=[[0,1,2,3,4,5,6,7]];
    for(let i=0;i<n;i++){
      const card=[0];
      for(let j=0;j<n;j++)card.push(n+1+n*i+j);
      cards.push(card);
    }
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      const card=[i+1];
      for(let k=0;k<n;k++)card.push(n+1+n*k+((i*k+j)%n));
      cards.push(card);
    }
    return cards;
  }
  function hashSeed(text){
    let h=2166136261>>>0;
    for(const ch of String(text||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}
    return h||1;
  }
  function mulberry32(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}}
  function shuffle(input,rng){const a=input.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}
  function validDateKey(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))}
  function dateKey(date=new Date(),timeZone='Asia/Jerusalem'){
    try{
      const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
      const map=Object.fromEntries(parts.map(p=>[p.type,p.value]));
      return `${map.year}-${map.month}-${map.day}`;
    }catch(_){return date.toISOString().slice(0,10)}
  }
  function dailySequence(day,rounds=15){
    if(!validDateKey(day))throw new Error('Invalid daily challenge date');
    const deck=buildDeck(),rng=mulberry32(hashSeed('DOUBLE:'+day)),order=shuffle(deck.map((_,i)=>i),rng),out=[];
    const count=Math.max(1,Math.min(Number(rounds)||15,Math.floor(order.length/2)));
    for(let i=0;i<count;i++){
      const left=shuffle(deck[order[i*2]],rng),right=shuffle(deck[order[i*2+1]],rng);
      out.push({left,right,common:left.find(x=>right.includes(x))});
    }
    return out;
  }
  function emptyRecord(){return {version:1,bestByDate:{},completedDates:[],streak:0,totalDays:0,updatedAt:0}}
  function normalizeRecord(input){const r=input&&typeof input==='object'?input:{};const dates=Array.isArray(r.completedDates)?[...new Set(r.completedDates.filter(validDateKey))].sort():[];return {...emptyRecord(),...r,bestByDate:{...(r.bestByDate||{})},completedDates:dates,totalDays:dates.length}}
  function dateOrdinal(key){const [y,m,d]=key.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)}
  function computeStreak(dates){
    if(!dates.length)return 0;
    const sorted=[...new Set(dates)].sort(),set=new Set(sorted),latest=sorted[sorted.length-1];
    let streak=0,ord=dateOrdinal(latest);
    while(true){const dt=new Date(ord*86400000),k=dt.toISOString().slice(0,10);if(!set.has(k))break;streak++;ord--;}
    return streak;
  }
  function updateRecord(input,day,elapsedMs){
    if(!validDateKey(day))throw new Error('Invalid daily challenge date');
    const ms=Math.round(Number(elapsedMs));if(!Number.isFinite(ms)||ms<=0)throw new Error('Invalid elapsed time');
    const r=normalizeRecord(input),prev=Number(r.bestByDate[day]);
    r.bestByDate[day]=Number.isFinite(prev)&&prev>0?Math.min(prev,ms):ms;
    if(!r.completedDates.includes(day))r.completedDates.push(day);
    r.completedDates.sort();r.totalDays=r.completedDates.length;r.streak=computeStreak(r.completedDates);r.updatedAt=Date.now();return r;
  }
  function load(){if(typeof localStorage==='undefined')return emptyRecord();try{return normalizeRecord(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return emptyRecord()}}
  function save(record){const clean=normalizeRecord(record);if(typeof localStorage!=='undefined')try{localStorage.setItem(KEY,JSON.stringify(clean))}catch(_){}return clean}
  function summary(record,day){const r=normalizeRecord(record);return {bestMs:Number(r.bestByDate[day])||null,doneToday:r.completedDates.includes(day),streak:r.streak,totalDays:r.totalDays}}
  return {KEY,ICONS,buildDeck,hashSeed,mulberry32,shuffle,dateKey,dailySequence,emptyRecord,normalizeRecord,computeStreak,updateRecord,load,save,summary};
});
