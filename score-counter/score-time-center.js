(function(){
  'use strict';

  const STORAGE={
    state:'teamScoreTimeCenter.v2.state',
    prefs:'teamScoreTimeCenter.v2.prefs',
    presets:'teamScoreTimeCenter.v2.presets',
    history:'teamScoreTimeCenter.v2.history'
  };
  const BUILTIN_PRESETS=[
    {id:'t30',name:'30s',mode:'timer',durationMs:30000},
    {id:'t60',name:'1m',mode:'timer',durationMs:60000},
    {id:'t180',name:'3m',mode:'timer',durationMs:180000},
    {id:'t300',name:'5m',mode:'timer',durationMs:300000},
    {id:'i4020',name:'40/20 × 8',mode:'intervals',workMs:40000,restMs:20000,rounds:8,sets:1},
    {id:'i4515',name:'45/15 × 10',mode:'intervals',workMs:45000,restMs:15000,rounds:10,sets:1}
  ];
  const COUNT_WORDS={10:'Ten',9:'Nine',8:'Eight',7:'Seven',6:'Six',5:'Five',4:'Four',3:'Three',2:'Two',1:'One'};
  const VOICE_PROFILES={coach:{label:'Coach',rate:1.02,pitch:.96},arena:{label:'Arena Announcer',rate:.84,pitch:.72}};
  const parse=(raw,fallback)=>{try{return JSON.parse(raw)||fallback}catch(_){return fallback}};
  const load=(key,fallback)=>parse(localStorage.getItem(key)||'',fallback);
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
  const now=()=>Date.now();

  const defaultState=()=>({
    mode:'stopwatch',running:false,anchorWall:0,anchorValueMs:0,durationMs:300000,
    ended:false,overtimeActive:false,overtimeBaseMs:0,overtimeAnchorWall:0,
    interval:{workMs:40000,restMs:20000,rounds:8,round:1,sets:1,set:1,phase:'work',betweenSetsMs:0},
    laps:[],autoLapMs:0,lastAutoLapIndex:0,startDelaySec:0,lastCountdownSec:null,
    autoOvertime:false
  });
  const defaultPrefs=()=>({soundMode:'voice10',voiceProfile:'coach',shortcuts:true,compact:false});
  let state=Object.assign(defaultState(),load(STORAGE.state,{}));
  state.interval=Object.assign(defaultState().interval,state.interval||{});
  let prefs=Object.assign(defaultPrefs(),load(STORAGE.prefs,{}));
  let panel=null,wakeLock=null,countdownToken=0,naturalVoice=null,finishAnnounced=false;

  function persist(){save(STORAGE.state,state);save(STORAGE.prefs,prefs)}
  function format(ms,sign){
    const value=Math.max(0,Math.floor(Math.abs(ms||0)));const total=Math.floor(value/1000);
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    const body=h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return sign?sign+body:body;
  }
  function voiceScore(v){
    const n=(v.name||'').toLowerCase();let score=0;
    if(/^en(-|_)/i.test(v.lang||''))score+=40;
    if(/natural|neural|premium|enhanced|google|microsoft|samantha|daniel|serena|ava|aria|jenny|guy/.test(n))score+=50;
    if(/compact|espeak|festival|robot/.test(n))score-=100;
    if(v.localService)score+=5;
    return score;
  }
  function refreshVoice(){
    if(!('speechSynthesis' in window))return null;
    const voices=speechSynthesis.getVoices().filter(v=>/^en(-|_)/i.test(v.lang||''));
    voices.sort((a,b)=>voiceScore(b)-voiceScore(a));naturalVoice=voices.find(v=>voiceScore(v)>=45)||null;return naturalVoice;
  }
  if('speechSynthesis' in window){refreshVoice();speechSynthesis.onvoiceschanged=refreshVoice}
  function beep(kind){
    if(prefs.soundMode==='silent')return;
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=kind==='finish'?880:650;g.gain.value=.055;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+(kind==='finish'?.2:.08));o.onended=()=>c.close().catch(()=>{})}catch(_){ }
  }
  function announce(text,priority){
    showFlash(text,priority);
    if(prefs.soundMode==='silent')return;
    if(prefs.soundMode==='beep'){beep(priority==='finish'?'finish':'tick');return}
    const voice=naturalVoice||refreshVoice();
    if(!voice){beep(priority==='finish'?'finish':'tick');return}
    try{const u=new SpeechSynthesisUtterance(text),profile=VOICE_PROFILES[prefs.voiceProfile]||VOICE_PROFILES.coach;u.voice=voice;u.lang='en-US';u.rate=profile.rate;u.pitch=profile.pitch;u.volume=1;if(priority==='high')speechSynthesis.cancel();speechSynthesis.speak(u)}catch(_){beep('tick')}
  }
  function showFlash(text,priority){
    let el=document.querySelector('.score-time-center-flash');if(!el){el=document.createElement('div');el.className='score-time-center-flash';document.body.appendChild(el)}
    el.textContent=text;el.dataset.priority=priority||'normal';el.classList.add('show');clearTimeout(el._hide);el._hide=setTimeout(()=>el.classList.remove('show'),1300);
  }
  async function requestWake(){try{if('wakeLock' in navigator&&!wakeLock)wakeLock=await navigator.wakeLock.request('screen')}catch(_){}}
  function releaseWake(){try{wakeLock&&wakeLock.release()}catch(_){ }wakeLock=null}

  function stopwatchValue(at=now()){
    if(state.mode!=='stopwatch')return 0;
    return state.running?state.anchorValueMs+Math.max(0,at-state.anchorWall):state.anchorValueMs;
  }
  function remainingValue(at=now()){
    if(state.mode==='stopwatch')return 0;
    if(state.overtimeActive)return 0;
    return state.running?Math.max(0,state.anchorValueMs-Math.max(0,at-state.anchorWall)):Math.max(0,state.anchorValueMs);
  }
  function overtimeValue(at=now()){
    if(!state.overtimeActive)return 0;
    return state.overtimeBaseMs+(state.running?Math.max(0,at-state.overtimeAnchorWall):0);
  }
  function displayValue(at=now()){
    if(state.mode==='stopwatch')return{ms:stopwatchValue(at),sign:''};
    if(state.overtimeActive)return{ms:overtimeValue(at),sign:'+'};
    return{ms:remainingValue(at),sign:''};
  }

  function timerStart(){
    countdownToken++;
    if(state.running)return;
    if(state.mode==='timer'&&!state.overtimeActive&&state.anchorValueMs<=0){state.anchorValueMs=state.durationMs;state.ended=false}
    if(state.mode==='intervals'&&state.anchorValueMs<=0){resetIntervalsOnly()}
    const t=now();
    if(state.overtimeActive)state.overtimeAnchorWall=t;else state.anchorWall=t;
    state.running=true;state.ended=false;finishAnnounced=false;requestWake();persist();render();
  }
  function timerPause(){
    countdownToken++;
    if(!state.running)return;
    const t=now();
    if(state.mode==='stopwatch')state.anchorValueMs=stopwatchValue(t);
    else if(state.overtimeActive){state.overtimeBaseMs=overtimeValue(t);state.overtimeAnchorWall=t}
    else state.anchorValueMs=remainingValue(t);
    state.anchorWall=t;state.running=false;releaseWake();persist();render();
  }
  function resetIntervalsOnly(){
    state.interval.round=1;state.interval.set=1;state.interval.phase='work';state.anchorValueMs=state.interval.workMs;state.ended=false;state.overtimeActive=false;
  }
  function timerReset(){
    countdownToken++;state.running=false;state.ended=false;state.overtimeActive=false;state.overtimeBaseMs=0;state.lastCountdownSec=null;finishAnnounced=false;
    if(state.mode==='stopwatch')state.anchorValueMs=0;
    else if(state.mode==='timer')state.anchorValueMs=state.durationMs;
    else resetIntervalsOnly();
    state.laps=[];state.lastAutoLapIndex=0;releaseWake();persist();render();
  }
  function adjust(ms){
    if(state.overtimeActive){state.overtimeBaseMs=Math.max(0,overtimeValue()+ms);state.overtimeAnchorWall=now()}
    else if(state.mode==='stopwatch'){state.anchorValueMs=Math.max(0,stopwatchValue()+ms);state.anchorWall=now()}
    else{state.anchorValueMs=Math.max(0,remainingValue()+ms);state.anchorWall=now();state.ended=false}
    persist();render();
  }
  function activateOvertime(){
    state.running=false;state.ended=false;state.overtimeActive=true;state.overtimeBaseMs=0;state.overtimeAnchorWall=now();persist();timerStart();announce('Overtime.','high');
  }

  function mark(type){
    if(state.mode!=='stopwatch')return;
    const ms=stopwatchValue(),prev=state.laps.length?state.laps[state.laps.length-1].ms:0;
    state.laps.push({id:Date.now()+Math.random(),type:type||'Lap',ms,segmentMs:Math.max(0,ms-prev),at:new Date().toISOString()});persist();render();
  }
  function returnLastMark(){
    if(state.mode!=='stopwatch'||!state.laps.length)return;
    state.anchorValueMs=state.laps[state.laps.length-1].ms;state.anchorWall=now();persist();render();
  }
  function clearLaps(){state.laps=[];state.lastAutoLapIndex=0;persist();render()}
  function lapSummary(){
    const seg=state.laps.map(x=>x.segmentMs).filter(x=>x>0);if(!seg.length)return null;
    const sum=seg.reduce((a,b)=>a+b,0);return{count:seg.length,avg:sum/seg.length,fastest:Math.min(...seg),slowest:Math.max(...seg)};
  }

  function currentPhaseDuration(){
    const it=state.interval;if(it.phase==='work')return it.workMs;if(it.phase==='rest')return it.restMs;return it.betweenSetsMs;
  }
  function phaseAnnouncement(){
    const it=state.interval;if(it.phase==='work'){if(it.round===it.rounds&&it.set===it.sets)announce('Final round. Work.','high');else announce(`Round ${it.round}. Work.`,'high')}
    else if(it.phase==='rest')announce('Rest.','high');else announce('Set break.','high');
  }
  function nextIntervalPhase(){
    const it=state.interval;
    if(it.phase==='work'){
      if(it.restMs>0){it.phase='rest';return true}
      if(it.round<it.rounds){it.round++;it.phase='work';return true}
      if(it.set<it.sets){if(it.betweenSetsMs>0){it.phase='between';return true}it.set++;it.round=1;it.phase='work';return true}
      return false;
    }
    if(it.phase==='rest'){
      if(it.round<it.rounds){it.round++;it.phase='work';return true}
      if(it.set<it.sets){if(it.betweenSetsMs>0){it.phase='between';return true}it.set++;it.round=1;it.phase='work';return true}
      return false;
    }
    if(it.phase==='between'){it.set++;it.round=1;it.phase='work';return true}
    return false;
  }
  function finishTimer(){
    state.running=false;state.anchorValueMs=0;state.ended=true;releaseWake();persist();
    if(!finishAnnounced){finishAnnounced=true;announce(state.mode==='intervals'?'Finished.':'Time!','finish');recordHistory()}
  }
  function processIntervals(t){
    let guard=0;
    while(state.running&&state.mode==='intervals'&&guard++<200){
      const deadline=state.anchorWall+state.anchorValueMs;if(t<deadline)break;
      const boundary=deadline;
      if(!nextIntervalPhase()){finishTimer();break}
      state.anchorWall=boundary;state.anchorValueMs=Math.max(0,currentPhaseDuration());state.lastCountdownSec=null;phaseAnnouncement();
      if(state.anchorValueMs===0)continue;
    }
  }
  function processEnd(t){
    if(!state.running||state.mode==='stopwatch'||state.overtimeActive)return;
    if(state.mode==='intervals'){processIntervals(t);return}
    if(t>=state.anchorWall+state.anchorValueMs){
      if(state.autoOvertime){state.running=false;state.anchorValueMs=0;activateOvertime()}else finishTimer();
    }
  }
  function processCountdown(t){
    if(!state.running||state.mode==='stopwatch'||state.overtimeActive)return;
    const rem=remainingValue(t),sec=Math.ceil(rem/1000);if(sec<1||sec>10||sec===state.lastCountdownSec)return;
    const allow=prefs.soundMode==='voice10'||(prefs.soundMode==='voice3'&&sec<=3)||prefs.soundMode==='beep';if(!allow)return;
    state.lastCountdownSec=sec;
    if(prefs.soundMode==='beep')beep(sec<=3?'finish':'tick');else announce(COUNT_WORDS[sec]||String(sec),sec<=3?'high':'normal');
  }
  function processAutoLap(){
    if(state.mode!=='stopwatch'||!state.running||!state.autoLapMs)return;
    const value=stopwatchValue(),index=Math.floor(value/state.autoLapMs);
    if(index>state.lastAutoLapIndex){state.lastAutoLapIndex=index;mark('Auto Lap')}
  }
  function tick(){const t=now();processEnd(t);processCountdown(t);processAutoLap();render()}

  function startWithDelay(){
    syncInputs();const sec=state.startDelaySec||0;if(!sec){timerStart();return}
    const token=++countdownToken;let left=sec;
    const step=()=>{if(token!==countdownToken)return;if(left<=0){announce('Go!','high');timerStart();return}announce(COUNT_WORDS[left]||String(left),left<=3?'high':'normal');left--;setTimeout(step,1000)};step();
  }
  function skipInterval(){
    if(state.mode!=='intervals')return;timerPause();if(!nextIntervalPhase()){finishTimer();render();return}state.anchorValueMs=currentPhaseDuration();state.anchorWall=now();state.ended=false;persist();phaseAnnouncement();timerStart();
  }

  function recordHistory(){
    const items=load(STORAGE.history,[]);items.unshift({at:new Date().toISOString(),mode:state.mode,durationMs:state.mode==='stopwatch'?stopwatchValue():state.durationMs,laps:state.laps.length,interval:JSON.parse(JSON.stringify(state.interval))});save(STORAGE.history,items.slice(0,50));
  }
  function savedPresets(){return load(STORAGE.presets,[])}
  function savePreset(){
    syncInputs();const name=(prompt('Preset name')||'').trim();if(!name)return;
    const item={id:'u'+Date.now(),name,mode:state.mode,durationMs:state.durationMs,workMs:state.interval.workMs,restMs:state.interval.restMs,rounds:state.interval.rounds,sets:state.interval.sets,betweenSetsMs:state.interval.betweenSetsMs,startDelaySec:state.startDelaySec,autoLapMs:state.autoLapMs};const items=savedPresets();items.unshift(item);save(STORAGE.presets,items.slice(0,24));render();
  }
  function applyPreset(p){
    timerPause();state.mode=p.mode||'timer';if(state.mode==='timer'){state.durationMs=p.durationMs||60000;state.anchorValueMs=state.durationMs}else if(state.mode==='intervals'){state.interval.workMs=p.workMs||40000;state.interval.restMs=p.restMs||20000;state.interval.rounds=p.rounds||8;state.interval.sets=p.sets||1;state.interval.betweenSetsMs=p.betweenSetsMs||0;resetIntervalsOnly()}state.startDelaySec=p.startDelaySec||0;state.autoLapMs=p.autoLapMs||0;state.ended=false;state.overtimeActive=false;persist();renderPanel();
  }

  function modeLabel(){if(state.mode==='stopwatch')return'STOPWATCH';if(state.mode==='timer')return state.overtimeActive?'OVERTIME':'TIMER';const it=state.interval;const phase=it.phase==='between'?'SET BREAK':it.phase.toUpperCase();return`${phase} · ROUND ${it.round}/${it.rounds}${it.sets>1?` · SET ${it.set}/${it.sets}`:''}`}
  function syncInputs(){
    if(!panel)return;
    const get=n=>panel.querySelector(`[data-field="${n}"]`),num=(n,f=0)=>Math.max(0,Number(get(n)?.value)||f);
    const min=num('timer-min'),sec=num('timer-sec');state.durationMs=(min*60+sec)*1000;
    state.interval.workMs=Math.max(1000,num('work',40)*1000);state.interval.restMs=num('rest',20)*1000;state.interval.rounds=Math.max(1,num('rounds',8));state.interval.sets=Math.max(1,num('sets',1));state.interval.betweenSetsMs=num('between',0)*1000;
    state.startDelaySec=num('delay',0);state.autoLapMs=num('auto-lap',0)*1000;state.autoOvertime=!!get('auto-overtime')?.checked;prefs.shortcuts=!!get('shortcuts')?.checked;
    const sound=get('sound');if(sound)prefs.soundMode=sound.value;const vp=get('voice');if(vp)prefs.voiceProfile=vp.value;
    if(!state.running&&!state.overtimeActive){if(state.mode==='timer')state.anchorValueMs=state.durationMs;if(state.mode==='intervals'&&state.interval.round===1&&state.interval.set===1&&state.interval.phase==='work')state.anchorValueMs=state.interval.workMs}
    persist();
  }

  function lapsHtml(){
    if(!state.laps.length)return'<div class="score-time-center-empty">No marks yet</div>';
    return state.laps.slice().reverse().map((x,i)=>`<div class="score-time-center-lap"><b>${state.laps.length-i}. ${x.type}</b><span>${format(x.ms)}</span><small>segment ${format(x.segmentMs)}</small></div>`).join('');
  }
  function summaryHtml(){const s=lapSummary();return s?`<div class="score-time-center-summary"><span>Marks <b>${s.count}</b></span><span>Fastest <b>${format(s.fastest)}</b></span><span>Slowest <b>${format(s.slowest)}</b></span><span>Average <b>${format(s.avg)}</b></span></div>`:''}
  function presetsHtml(){const all=BUILTIN_PRESETS.concat(savedPresets());return all.map(p=>`<button type="button" data-preset="${p.id}">${p.name}</button>`).join('')}
  function finishHtml(){if(!state.ended||state.mode==='stopwatch')return'';return`<div class="score-time-center-finish"><strong>${state.mode==='intervals'?'WORKOUT FINISHED':'TIME!'}</strong><div><button data-finish-add="30000">+30 sec</button><button data-finish-add="60000">+1 min</button><button data-restart>Restart</button>${state.mode==='timer'?'<button data-overtime>Overtime</button>':''}</div></div>`}

  function renderPanel(){
    if(!panel)return;const v=displayValue(),mins=Math.floor(state.durationMs/60000),secs=Math.floor((state.durationMs%60000)/1000);
    panel.innerHTML=`<div class="score-time-center-head"><div><strong>⏱ Time Center</strong><small>${naturalVoice||refreshVoice()?'Natural English voice ready':'Natural voice unavailable · beep fallback'}</small></div><div><button data-compact>${prefs.compact?'Full':'Minimal'}</button><button data-fullscreen>Fullscreen</button><button data-close>✕</button></div></div>
      <div class="score-time-center-tabs"><button data-tmode="stopwatch" class="${state.mode==='stopwatch'?'active':''}">Stopwatch</button><button data-tmode="timer" class="${state.mode==='timer'?'active':''}">Timer</button><button data-tmode="intervals" class="${state.mode==='intervals'?'active':''}">Intervals</button></div>
      <div class="score-time-center-clock" data-clock title="Double click to enlarge">${format(v.ms,v.sign)}</div><div class="score-time-center-phase" data-phase>${modeLabel()}</div>
      ${finishHtml()}
      <div class="score-time-center-actions main"><button data-play>${state.running?'⏸ Pause':'▶ Start'}</button><button data-reset>↺ Reset</button>${state.mode==='stopwatch'?'<button data-lap>Lap</button><button data-split>Split</button>':''}${state.mode==='intervals'?'<button data-skip>Skip</button>':''}</div>
      <div class="score-time-center-actions"><button data-add="10000">+10s</button><button data-add="30000">+30s</button><button data-add="60000">+1m</button><button data-add="-10000">−10s</button>${state.mode==='stopwatch'?'<button data-return-mark>↶ Last mark</button>':''}</div>
      <div class="score-time-center-body ${prefs.compact?'is-compact':''}">
        <div class="score-time-center-form">
          <label>Timer minutes<input data-field="timer-min" type="number" min="0" max="999" value="${mins}"></label><label>Seconds<input data-field="timer-sec" type="number" min="0" max="59" value="${secs}"></label>
          <label>Work<input data-field="work" type="number" min="1" value="${Math.round(state.interval.workMs/1000)}"></label><label>Rest<input data-field="rest" type="number" min="0" value="${Math.round(state.interval.restMs/1000)}"></label>
          <label>Rounds<input data-field="rounds" type="number" min="1" value="${state.interval.rounds}"></label><label>Sets<input data-field="sets" type="number" min="1" value="${state.interval.sets}"></label><label>Between sets<input data-field="between" type="number" min="0" value="${Math.round(state.interval.betweenSetsMs/1000)}"></label>
          <label>Start delay<input data-field="delay" data-start-delay type="number" min="0" max="30" value="${state.startDelaySec}"></label><label>Auto Lap (sec)<input data-field="auto-lap" type="number" min="0" value="${Math.round(state.autoLapMs/1000)}"></label>
          <label>Sound<select data-field="sound"><option value="voice10" ${prefs.soundMode==='voice10'?'selected':''}>Voice 10–1</option><option value="voice3" ${prefs.soundMode==='voice3'?'selected':''}>Voice 3–1</option><option value="beep" ${prefs.soundMode==='beep'?'selected':''}>Beeps</option><option value="silent" ${prefs.soundMode==='silent'?'selected':''}>Silent</option></select></label>
          <label>Voice<select data-field="voice"><option value="coach" ${prefs.voiceProfile==='coach'?'selected':''}>Coach</option><option value="arena" ${prefs.voiceProfile==='arena'?'selected':''}>Arena Announcer</option></select></label>
          <label class="check"><input data-field="auto-overtime" type="checkbox" ${state.autoOvertime?'checked':''}> Automatic Overtime</label><label class="check"><input data-field="shortcuts" type="checkbox" ${prefs.shortcuts?'checked':''}> Keyboard shortcuts</label>
        </div>
        <section><div class="score-time-center-section-head"><strong>Presets</strong><button data-save-preset>Save Preset</button></div><div class="score-time-center-presets">${presetsHtml()}</div></section>
        ${state.mode==='stopwatch'?`<section><div class="score-time-center-section-head"><strong>Lap / Split</strong><button data-clear-laps>Clear laps</button></div>${summaryHtml()}<div class="score-time-center-laps">${lapsHtml()}</div></section>`:''}
        <div class="score-time-center-hint">Space Play/Pause · R Reset · L Lap · S Skip · +/- adjust</div>
      </div>`;
    bindPanel();
  }
  function render(){
    if(!panel)return;const v=displayValue(),clock=panel.querySelector('[data-clock]'),phase=panel.querySelector('[data-phase]'),play=panel.querySelector('[data-play]');if(clock)clock.textContent=format(v.ms,v.sign);if(phase)phase.textContent=modeLabel();if(play)play.textContent=state.running?'⏸ Pause':'▶ Start';
    if(state.ended&&!panel.querySelector('.score-time-center-finish'))renderPanel();
  }
  function bindPanel(){
    if(!panel)return;
    panel.querySelector('[data-clock]')?.addEventListener('dblclick',()=>panel.classList.toggle('giant'));
    panel.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',()=>{syncInputs();render()}));
  }
  function open(){
    close();panel=document.createElement('section');panel.className='score-time-center-panel';panel.dir='rtl';document.body.appendChild(panel);renderPanel();
  }
  function close(){countdownToken++;if(panel&&panel.isConnected)panel.remove();panel=null}
  function switchMode(mode){
    timerPause();state.mode=mode;state.ended=false;state.overtimeActive=false;state.lastCountdownSec=null;finishAnnounced=false;
    if(mode==='stopwatch')state.anchorValueMs=0;else if(mode==='timer')state.anchorValueMs=state.durationMs;else resetIntervalsOnly();persist();renderPanel();
  }
  function restart(){state.ended=false;state.overtimeActive=false;if(state.mode==='timer')state.anchorValueMs=state.durationMs;else if(state.mode==='intervals')resetIntervalsOnly();persist();startWithDelay();renderPanel()}

  function clickHandler(e){
    const b=e.target.closest('button');if(!b||!panel||!panel.contains(b))return;
    if(b.hasAttribute('data-close'))return close();if(b.dataset.tmode)return switchMode(b.dataset.tmode);if(b.hasAttribute('data-play')){state.running?timerPause():startWithDelay();return}if(b.hasAttribute('data-reset'))return timerReset();if(b.hasAttribute('data-lap'))return mark('Lap');if(b.hasAttribute('data-split'))return mark('Split');if(b.hasAttribute('data-skip'))return skipInterval();if(b.dataset.add)return adjust(Number(b.dataset.add));if(b.hasAttribute('data-return-mark'))return returnLastMark();if(b.hasAttribute('data-clear-laps'))return clearLaps();if(b.hasAttribute('data-save-preset'))return savePreset();if(b.dataset.preset){const all=BUILTIN_PRESETS.concat(savedPresets()),p=all.find(x=>x.id===b.dataset.preset);if(p)applyPreset(p);return}if(b.hasAttribute('data-compact')){prefs.compact=!prefs.compact;persist();renderPanel();return}if(b.hasAttribute('data-fullscreen')){const target=panel;document.fullscreenElement?document.exitFullscreen?.():target.requestFullscreen?.();return}if(b.dataset.finishAdd){state.ended=false;state.anchorValueMs=Number(b.dataset.finishAdd);state.durationMs=Number(b.dataset.finishAdd);persist();timerStart();renderPanel();return}if(b.hasAttribute('data-restart'))return restart();if(b.hasAttribute('data-overtime'))return activateOvertime();
  }
  document.addEventListener('click',clickHandler);

  function bridgeCapture(e){
    const target=e.target.closest('.score-suite-timer-more,[data-timer]');if(!target)return;
    if(target.closest('.score-time-center-panel'))return;
    e.preventDefault();e.stopImmediatePropagation();open();
  }
  document.addEventListener('click',bridgeCapture,true);
  function installBridgeButton(){
    const bar=document.querySelector('.score-live-timer');if(!bar||bar.querySelector('.score-time-center-open'))return false;
    const b=document.createElement('button');b.type='button';b.className='score-time-center-open';b.textContent='⚙';b.title='Time Center';b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();open()});bar.appendChild(b);return true;
  }

  function keyCapture(e){
    if(!prefs.shortcuts||e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    const key=e.key.toLowerCase();let handled=true;
    if(e.code==='Space')state.running?timerPause():startWithDelay();else if(key==='r')timerReset();else if(key==='l')mark('Lap');else if(key==='s')skipInterval();else if(e.key==='+')adjust(10000);else if(e.key==='-')adjust(-10000);else handled=false;
    if(handled){e.preventDefault();e.stopImmediatePropagation()}
  }
  window.addEventListener('keydown',keyCapture,true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(state.running)requestWake();tick()}});

  function init(){
    if(state.running){const t=now();processEnd(t)}
    const probe=setInterval(()=>{if(installBridgeButton())clearInterval(probe)},400);setInterval(tick,100);
  }
  window.TeamScoreTimeCenter={open,close,state,start:timerStart,pause:timerPause,reset:timerReset,lap:()=>mark('Lap'),split:()=>mark('Split'),skip:skipInterval,overtime:activateOvertime,presets:()=>BUILTIN_PRESETS.concat(savedPresets()),history:()=>load(STORAGE.history,[])};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();