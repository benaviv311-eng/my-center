(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.HomeFeedState=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const KEY='my-center-home-feed-v1';
  const clone=x=>JSON.parse(JSON.stringify(x));
  function dayKey(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function fresh(date=new Date()){
    const key=dayKey(date);
    return {version:1,profile:{seen:{},sourceAffinity:{},typeAffinity:{},saved:[]},day:{key,seed:`home|${key}`,order:[],cursor:0,scrollY:0,hidden:[]}};
  }
  function normalizeProfile(profile){
    return {
      seen:profile&&profile.seen&&typeof profile.seen==='object'?profile.seen:{},
      sourceAffinity:profile&&profile.sourceAffinity&&typeof profile.sourceAffinity==='object'?profile.sourceAffinity:{},
      typeAffinity:profile&&profile.typeAffinity&&typeof profile.typeAffinity==='object'?profile.typeAffinity:{},
      saved:Array.isArray(profile&&profile.saved)?profile.saved:[]
    };
  }
  function ensureDay(state,date=new Date()){
    const base=state&&state.version===1?clone(state):fresh(date);
    base.version=1;
    base.profile=normalizeProfile(base.profile);
    const key=dayKey(date);
    if(!base.day||base.day.key!==key){
      base.day={key,seed:`home|${key}`,order:[],cursor:0,scrollY:0,hidden:[]};
    }else{
      base.day.seed=base.day.seed||`home|${key}`;
      base.day.order=Array.isArray(base.day.order)?base.day.order:[];
      base.day.cursor=Math.max(0,Number(base.day.cursor)||0);
      base.day.scrollY=Math.max(0,Number(base.day.scrollY)||0);
      base.day.hidden=Array.isArray(base.day.hidden)?base.day.hidden:[];
    }
    return base;
  }
  function load(storage=localStorage,date=new Date()){
    let parsed=null;
    try{parsed=JSON.parse(storage.getItem(KEY)||'null')}catch(_){parsed=null}
    return ensureDay(parsed,date);
  }
  function save(storage=localStorage,state){storage.setItem(KEY,JSON.stringify(state));}
  function setDailyOrder(state,ids){const next=clone(state);next.day.order=[...(ids||[])];next.day.cursor=0;return next;}
  function setCursor(state,cursor){const next=clone(state);next.day.cursor=Math.max(0,Number(cursor)||0);return next;}
  function setScroll(state,y){const next=clone(state);next.day.scrollY=Math.max(0,Number(y)||0);return next;}
  function setSaved(state,ids){const next=clone(state);next.profile.saved=[...new Set(ids||[])];return next;}
  function markShown(state,items,date=new Date()){
    const next=clone(state),d=dayKey(date);
    for(const item of items||[]){
      if(!item||!item.id) continue;
      const row=next.profile.seen[item.id]||{count:0,dwellMs:0,opens:0};
      row.count=(row.count||0)+1;
      row.lastSeenDay=d;
      next.profile.seen[item.id]=row;
    }
    return next;
  }
  function recordSignal(state,item,signal,value=1,date=new Date()){
    const next=clone(state);
    if(!item||!item.id) return next;
    const raw=Number(value);
    const amount=Number.isFinite(raw)?raw:1;
    const seen=next.profile.seen[item.id]||{count:0,dwellMs:0,opens:0};
    if(signal==='open') seen.opens=(seen.opens||0)+Math.max(0,amount);
    if(signal==='dwell') seen.dwellMs=(seen.dwellMs||0)+Math.max(0,amount);
    if(signal==='more'){
      next.profile.sourceAffinity[item.source]=(next.profile.sourceAffinity[item.source]||0)+amount;
      next.profile.typeAffinity[item.type]=(next.profile.typeAffinity[item.type]||0)+amount;
    }
    if(signal==='less'){
      next.profile.sourceAffinity[item.source]=(next.profile.sourceAffinity[item.source]||0)-amount;
      next.profile.typeAffinity[item.type]=(next.profile.typeAffinity[item.type]||0)-amount;
    }
    if(signal==='hide'&&!next.day.hidden.includes(item.id)) next.day.hidden.push(item.id);
    seen.lastSignalDay=dayKey(date);
    next.profile.seen[item.id]=seen;
    return next;
  }
  return {KEY,dayKey,load,save,ensureDay,markShown,recordSignal,setScroll,setDailyOrder,setCursor,setSaved};
});
