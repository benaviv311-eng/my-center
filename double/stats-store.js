(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleStatsStore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='double-stats-v1';
  const HISTORY_LIMIT=30;
  function createEmpty(){return {version:1,totalCorrect:0,totalWrong:0,reactionTotalMs:0,reactionCount:0,fastestMs:null,maxCombo:0,byMode:{},reactionHistory:[],updatedAt:0}}
  function clone(state){
    const base=createEmpty(),s=state&&typeof state==='object'?state:{};
    return {...base,...s,byMode:{...(s.byMode||{})},reactionHistory:Array.isArray(s.reactionHistory)?s.reactionHistory.slice(-HISTORY_LIMIT):[]};
  }
  function modeState(state,key){return {...(state.byMode[key]||{correct:0,wrong:0,bestReactionMs:null,maxCombo:0})}}
  function record(input,event){
    const state=clone(input),e=event||{},mode=String(e.mode||'unknown'),ms=Number(e.reactionMs),combo=Math.max(0,Number(e.combo)||0),m=modeState(state,mode);
    if(e.type==='correct'){
      state.totalCorrect++;m.correct++;
      if(Number.isFinite(ms)&&ms>0&&ms<120000){
        state.reactionTotalMs+=ms;state.reactionCount++;
        state.fastestMs=state.fastestMs==null?ms:Math.min(state.fastestMs,ms);
        m.bestReactionMs=m.bestReactionMs==null?ms:Math.min(m.bestReactionMs,ms);
        state.reactionHistory.push({ms,mode,at:Number(e.at)||Date.now()});
        if(state.reactionHistory.length>HISTORY_LIMIT)state.reactionHistory=state.reactionHistory.slice(-HISTORY_LIMIT);
      }
      state.maxCombo=Math.max(state.maxCombo,combo);m.maxCombo=Math.max(m.maxCombo,combo);
    }else if(e.type==='wrong'){
      state.totalWrong++;m.wrong++;
    }
    state.byMode[mode]=m;state.updatedAt=Number(e.at)||Date.now();return state;
  }
  function averageReactionMs(state){const s=clone(state);return s.reactionCount?s.reactionTotalMs/s.reactionCount:null}
  function accuracy(state){const s=clone(state),n=s.totalCorrect+s.totalWrong;return n?(s.totalCorrect/n)*100:null}
  function load(){
    if(typeof localStorage==='undefined')return createEmpty();
    try{return clone(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){return createEmpty()}
  }
  function save(state){
    const clean=clone(state);
    if(typeof localStorage!=='undefined')try{localStorage.setItem(KEY,JSON.stringify(clean))}catch(_){}
    if(typeof window!=='undefined')try{window.dispatchEvent(new CustomEvent('double-stats-change',{detail:clean}))}catch(_){}
    return clean;
  }
  function recordEvent(event){return save(record(load(),event))}
  function reset(){const clean=createEmpty();save(clean);return clean}
  return {KEY,HISTORY_LIMIT,createEmpty,clone,record,averageReactionMs,accuracy,load,save,recordEvent,reset};
});
