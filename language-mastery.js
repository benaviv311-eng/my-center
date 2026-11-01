(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.LanguageMastery=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const LANGUAGES=['ar','it','ru','es'];
  const DAY=86400000;
  const INTERVALS=[1,3,7,14,30];
  const empty=()=>({version:1,byLanguage:{}});
  function parse(raw){
    try{
      const value=typeof raw==='string'?JSON.parse(raw):raw;
      if(!value||typeof value!=='object'||!value.byLanguage||typeof value.byLanguage!=='object'||Array.isArray(value.byLanguage))return empty();
      const byLanguage={};
      for(const lang of LANGUAGES){
        const source=value.byLanguage[lang];
        if(!source||typeof source!=='object'||Array.isArray(source))continue;
        const records={};
        for(const [key,row] of Object.entries(source)){
          if(!/^[a-z-]+:[01]$/.test(key)||!row||typeof row!=='object')continue;
          const attempts=Number(row.attempts),success=Number(row.success),streak=Number(row.streak),lastAt=Number(row.lastAt),dueAt=Number(row.dueAt);
          if(![attempts,success,streak,lastAt,dueAt].every(Number.isFinite)||attempts<0||success<0||success>attempts||streak<0)continue;
          records[key]={attempts,success,streak,lastAt,dueAt,status:streak>=3?'mastered':streak>0?'learning':'review'};
        }
        byLanguage[lang]=records;
      }
      return {version:1,byLanguage};
    }catch(e){return empty();}
  }
  function record(source,lang,key,correct,now=Date.now()){
    if(!LANGUAGES.includes(lang)||!/^[a-z-]+:[01]$/.test(String(key)))return parse(source);
    const state=parse(source);
    const rows={...(state.byLanguage[lang]||{})};
    const old=rows[key]||{attempts:0,success:0,streak:0};
    const streak=correct?old.streak+1:0;
    rows[key]={attempts:old.attempts+1,success:old.success+(correct?1:0),streak,lastAt:now,dueAt:correct?now+DAY*INTERVALS[Math.min(streak-1,INTERVALS.length-1)]:now,status:correct?(streak>=3?'mastered':'learning'):'review'};
    state.byLanguage[lang]=rows;
    return state;
  }
  function due(source,lang,now=Date.now()){
    const state=parse(source);
    return Object.entries(state.byLanguage[lang]||{}).filter(([,row])=>row.dueAt<=now).map(([key,row])=>({key,...row})).sort((a,b)=>a.dueAt-b.dueAt);
  }
  function stats(source,lang){
    const state=parse(source);
    const records=Object.values(state.byLanguage[lang]||{});
    return {attempts:records.reduce((n,row)=>n+row.attempts,0),correct:records.reduce((n,row)=>n+row.success,0),mastered:records.filter(row=>row.status==='mastered').length,learning:records.filter(row=>row.status==='learning').length,review:records.filter(row=>row.status==='review').length,practiced:records.length};
  }
  return {empty,parse,record,due,stats,LANGUAGES};
});
