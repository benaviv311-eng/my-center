(function(){
  'use strict';
  const ENDPOINT='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/score-voice';
  const FIXED={'time':'time','time!':'time','work':'work','work!':'work','work.':'work','rest':'rest','rest!':'rest','rest.':'rest','finished':'finished','finished!':'finished','finished.':'finished'};
  const DURATIONS={arena:{countdown10:9.84,countdown3:3.68,end10:9.04,end3:2.64},coach:{countdown10:7.44,countdown3:3.04,end10:7.60,end3:2.40}};
  const WORDS=new Set(['ten','nine','eight','seven','six','five','four','three','two','one']);
  const cache=new Map();
  const originalSpeak=window.speechSynthesis&&window.speechSynthesis.speak?window.speechSynthesis.speak.bind(window.speechSynthesis):null;
  let current=null,suppressUntil=0,suppressGo=false,continuousKey='';
  function url(profile,key){return `${ENDPOINT}?profile=${encodeURIComponent(profile)}&key=${encodeURIComponent(key)}`}
  function profileFromUtterance(u){return Number(u&&u.pitch)<.85?'arena':'coach'}
  function normalized(text){return String(text||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function audioFor(profile,key){const id=profile+':'+key;if(!cache.has(id)){const a=new Audio();a.crossOrigin='anonymous';a.preload='auto';a.src=url(profile,key);cache.set(id,a)}return cache.get(id)}
  function stop(){if(current){try{current.pause();current.currentTime=0}catch(_){}current=null}continuousKey='';suppressUntil=0;suppressGo=false}
  async function play(profile,key,opts){const a=audioFor(profile,key);if(current&&current!==a){try{current.pause();current.currentTime=0}catch(_){}}current=a;const target=Number(opts&&opts.targetDuration)||0,known=DURATIONS[profile]&&DURATIONS[profile][key];a.playbackRate=target&&known?Math.max(.7,Math.min(1.3,known/target)):1;try{a.currentTime=0;await a.play();return true}catch(_){return false}}
  function isRunningCountdown(){const s=window.TeamScoreTimeCenter&&window.TeamScoreTimeCenter.state;return !!(s&&s.running&&s.mode!=='stopwatch')}
  function startContinuous(profile,firstWord,u){const n=firstWord==='ten'?10:3,ending=isRunningCountdown(),key=ending?(n===10?'end10':'end3'):(n===10?'countdown10':'countdown3');continuousKey=key;suppressGo=!ending;suppressUntil=Date.now()+n*1000+900;play(profile,key,{targetDuration:n}).then(ok=>{if(!ok){continuousKey='';suppressUntil=0;suppressGo=false;if(originalSpeak)originalSpeak(u)}});return true}
  function shouldSuppress(text){if(Date.now()>suppressUntil)return false;const n=normalized(text).replace(/[.!?,]/g,'');if(WORDS.has(n))return true;if(suppressGo&&n==='go')return true;return false}
  function patchedSpeak(u){const text=String(u&&u.text||'');if(shouldSuppress(text))return;const n=normalized(text),bare=n.replace(/[.!?,]/g,''),profile=profileFromUtterance(u);if((bare==='ten'||bare==='three')&&Date.now()>suppressUntil){startContinuous(profile,bare,u);return}const fixed=FIXED[n]||FIXED[bare];if(fixed){play(profile,fixed).then(ok=>{if(!ok&&originalSpeak)originalSpeak(u)});return}if(originalSpeak)originalSpeak(u)}
  function preload(profile){const keys=['time','work','rest','finished','countdown10','countdown3','end10','end3'];return Promise.all(keys.map(key=>new Promise(resolve=>{const a=audioFor(profile,key),done=()=>resolve(true);if(a.readyState>=2)return resolve(true);a.addEventListener('canplaythrough',done,{once:true});a.addEventListener('error',()=>resolve(false),{once:true});try{a.load()}catch(_){resolve(false)}setTimeout(()=>resolve(false),5000)})))}
  function install(){if(!window.speechSynthesis||!originalSpeak||window.speechSynthesis.__teamScoreHumanPatched)return;window.speechSynthesis.__teamScoreHumanPatched=true;try{window.speechSynthesis.speak=patchedSpeak}catch(_){}document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b)return;if(b.matches('[data-tc-reset],[data-tc-pause],[data-suite-reset],[data-close]'))stop()},true);['coach','arena'].forEach(preload)}
  window.TeamScoreHumanVoicePack={play,preload,stop,url,DURATIONS,fixed:true,continuousCountdown:true,get active(){return continuousKey}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
