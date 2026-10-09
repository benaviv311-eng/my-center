(function(){
  'use strict';
  let guardWake=null;
  function api(){return window.TeamScoreTimeCenter||null}
  function state(){return api()&&api().state}
  function phaseDuration(s){if(!s||!s.interval)return 0;return s.interval.phase==='work'?s.interval.workMs:s.interval.phase==='rest'?s.interval.restMs:s.interval.betweenSetsMs}
  function isResume(s){
    if(!s||s.running||s.ended)return false;
    if(s.overtimeActive)return (s.overtimeBaseMs||0)>0;
    if(s.mode==='stopwatch')return (s.anchorValueMs||0)>0;
    if(s.mode==='timer')return (s.anchorValueMs||0)>0&&(s.anchorValueMs||0)<(s.durationMs||0);
    if(s.mode==='intervals')return s.interval.phase!=='work'||s.interval.round>1||s.interval.set>1||((s.anchorValueMs||0)>0&&(s.anchorValueMs||0)<phaseDuration(s));
    return false;
  }
  async function requestWake(){try{if('wakeLock' in navigator&&!guardWake)guardWake=await navigator.wakeLock.request('screen')}catch(_){}}
  function releaseWake(){try{guardWake&&guardWake.release()}catch(_){ }guardWake=null}
  function syncWake(){const s=state();if(s&&s.running)requestWake();else releaseWake()}
  function handleToggle(e){
    const a=api(),s=state();if(!a||!s)return false;
    if(s.running){e.preventDefault();e.stopImmediatePropagation();a.pause();releaseWake();return true}
    if(isResume(s)){e.preventDefault();e.stopImmediatePropagation();a.start();requestWake();return true}
    return false;
  }
  window.addEventListener('keydown',e=>{
    if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(e.code==='Space')handleToggle(e);
  },true);
  document.addEventListener('click',e=>{
    const b=e.target.closest('.score-time-center-panel [data-play]');if(b)handleToggle(e);
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncWake();else if(!state()?.running)releaseWake()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(syncWake,0),{once:true});else setTimeout(syncWake,0);
  setInterval(syncWake,1000);
})();