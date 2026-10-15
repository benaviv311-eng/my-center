(function(factory){
  const root=typeof window!=='undefined'?window:globalThis;
  const exported=factory(root);
  if(typeof module!=='undefined'&&module.exports) module.exports=exported;
  if(typeof window!=='undefined'){
    window.TeamScoreTimeHub=exported.createBrowserApi(window);
  }
})(function(defaultRoot){
  'use strict';
  const UI_KEY='teamScoreTimeHub.ui.v1';
  const SUITE_MODES=new Set(['timed-game','timed-overtime','target-chase','countdown-target']);
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const nowOf=(root)=>root&&root.Date&&typeof root.Date.now==='function'?root.Date.now():Date.now();

  function formatClock(ms,sign){
    ms=Math.max(0,Number(ms)||0);
    const total=Math.ceil(ms/1000),m=Math.floor(total/60),s=total%60;
    return `${sign||''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function emit(root,provider){
    try{root.dispatchEvent(new root.CustomEvent('teamscore:timechange',{detail:{provider}}))}catch(_){ }
  }

  function teamName(root,index){
    try{
      const host=root.document&&root.document.getElementById('teams');
      const card=host&&host.children&&host.children[index];
      if(!card)return `קבוצה ${Number(index)+1}`;
      const n=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h1,h2,h3,strong');
      return (n&&n.textContent||`קבוצה ${Number(index)+1}`).trim();
    }catch(_){return `קבוצה ${Number(index)+1}`}
  }

  function timedRoundsProvider(root,at){
    const api=root.TeamScoreTimedRounds,suite=root.TeamScoreGameSuite;
    const session=suite&&typeof suite.getSession==='function'?suite.getSession():null;
    if(!api||!session||session.mode!=='timed-rounds')return null;
    let raw=null;
    if(typeof api.getTimingSnapshot==='function')raw=api.getTimingSnapshot(at);
    if(!raw&&typeof api.getRuntime==='function'){
      const r=api.getRuntime();
      if(!r)return null;
      const paused=Number(r.pausedRemaining)||0;
      const remainingMs=r.running?Math.max(0,(Number(r.deadline)||0)-at):Math.max(0,paused||((Number(r.deadline)||0)-at));
      raw={phase:r.phase,running:!!r.running,remainingMs,activeTeam:r.activeTeam,activeTeamName:r.activeTeam==null?'':teamName(root,r.activeTeam),round:r.round,rounds:r.opts&&r.opts.rounds||0,tiebreak:!!r.tiebreak,golden:r.phase==='golden'||!!r.golden,finished:r.phase==='finished'};
    }
    if(!raw)return null;
    const phase=raw.phase||'';
    const finished=!!raw.finished||phase==='finished';
    const golden=!!raw.golden||phase==='golden';
    const context=[];
    if(raw.activeTeamName)context.push(raw.activeTeamName);
    if(raw.tiebreak)context.push('שובר שוויון');
    else if(raw.round&&raw.rounds)context.push(`סבב ${raw.round}/${raw.rounds}`);
    if(phase==='transition')context.push('מתכוננים');
    else if(phase==='turn')context.push('בתור');
    else if(golden)context.push('נקודת זהב');
    else if(finished)context.push('הסתיים');
    const actions=[];
    let primaryAction=null;
    if(phase==='transition'){
      primaryAction={id:'start-now',label:'התחל עכשיו'};
      actions.push({id:'add-break',label:'+10 שנ׳ מעבר',enabled:true});
      actions.push({id:raw.running?'pause':'resume',label:raw.running?'השהה':'המשך',enabled:true});
    }else if(phase==='turn'){
      primaryAction={id:raw.running?'pause':'resume',label:raw.running?'השהה':'המשך'};
      actions.push({id:'skip',label:'סיים תור',enabled:true});
    }
    return {id:'timed-rounds',label:'סבבים בזמן',kind:'game',status:finished?'finished':raw.running?'running':golden?'ready':'paused',valueMs:golden||finished?0:Math.max(0,Number(raw.remainingMs)||0),sign:'',phase,context:context.join(' · '),primaryAction,actions,_provider:'timed-rounds'};
  }

  function suiteCurrent(timer,at){
    if(!timer)return 0;
    if(!timer.running)return Math.max(0,Number(timer.baseMs)||0);
    const elapsed=Math.max(0,at-(Number(timer.startedWall)||at));
    if(timer.mode==='stopwatch')return Math.max(0,(Number(timer.baseMs)||0)+elapsed);
    return Math.max(0,(Number(timer.baseMs)||0)-elapsed);
  }

  function suiteProvider(root,at){
    const api=root.TeamScoreGameSuite;
    const session=api&&typeof api.getSession==='function'?api.getSession():null;
    const timer=api&&api.timer;
    if(!api||!session||!SUITE_MODES.has(session.mode)||!timer)return null;
    const valueMs=suiteCurrent(timer,at);
    const cfg=session.config||{};
    const contexts=[];
    if(session.mode==='target-chase')contexts.push('מרדף יעד');
    if(session.mode==='countdown-target'&&cfg.target)contexts.push(`יעד ${cfg.target}`);
    if(session.mode==='timed-overtime')contexts.push('זמן + הארכה');
    const ready=!timer.running&&((Number(timer.baseMs)||0)<=0||(Number(timer.baseMs)||0)===(Number(timer.durationMs)||0));
    const status=timer.running?'running':ready?'ready':'paused';
    return {id:'game-suite',label:session.modeName||'משחק בזמן',kind:'game',status,valueMs,sign:'',phase:session.mode,context:contexts.join(' · '),primaryAction:{id:timer.running?'pause':'start',label:timer.running?'השהה':'התחל'},actions:[{id:'reset',label:'איפוס',enabled:true},{id:'add-30',label:'+30 שנ׳',enabled:true},{id:'sub-10',label:'−10 שנ׳',enabled:true}],_provider:'game-suite'};
  }

  function timeCenterValue(state,at){
    if(!state)return{valueMs:0,sign:''};
    if(state.mode==='stopwatch'){
      return {valueMs:Math.max(0,(Number(state.anchorValueMs)||0)+(state.running?Math.max(0,at-(Number(state.anchorWall)||at)):0)),sign:''};
    }
    if(state.overtimeActive){
      return {valueMs:Math.max(0,(Number(state.overtimeBaseMs)||0)+(state.running?Math.max(0,at-(Number(state.overtimeAnchorWall)||at)):0)),sign:'+'};
    }
    const value=Math.max(0,(Number(state.anchorValueMs)||0)-(state.running?Math.max(0,at-(Number(state.anchorWall)||at)):0));
    return {valueMs:value,sign:''};
  }

  function timeCenterProvider(root,at){
    const api=root.TeamScoreTimeCenter,state=api&&api.state;
    if(!api||!state)return null;
    const computed=typeof api.getTimingSnapshot==='function'?api.getTimingSnapshot(at):null;
    const source=computed||Object.assign({},state,timeCenterValue(state,at));
    const mode=source.mode||state.mode||'timer';
    const interval=source.interval||state.interval||{};
    const contexts=[];
    let phase=source.phase||mode;
    if(mode==='intervals'){
      phase=interval.phase||'work';
      contexts.push(phase==='rest'?'מנוחה':phase==='between'?'הפסקה':'עבודה');
      if(interval.round&&interval.rounds)contexts.push(`סבב ${interval.round}/${interval.rounds}`);
      if(interval.set&&interval.sets&&interval.sets>1)contexts.push(`סט ${interval.set}/${interval.sets}`);
    }else if(source.overtimeActive||state.overtimeActive){
      phase='overtime';contexts.push('הארכה');
    }else if(mode==='stopwatch')contexts.push('סטופר');
    else contexts.push('ספירה לאחור');
    const valueMs=source.valueMs!=null?source.valueMs:timeCenterValue(state,at).valueMs;
    const sign=source.sign!=null?source.sign:timeCenterValue(state,at).sign;
    const running=source.running!=null?source.running:state.running;
    const ended=source.ended!=null?source.ended:state.ended;
    const ready=!running&&!ended&&((mode==='stopwatch'&&valueMs===0)||(mode!=='stopwatch'&&Number(state.durationMs||0)>0&&Math.abs(valueMs-Number(state.durationMs||0))<1000));
    const actions=[{id:'reset',label:'איפוס',enabled:true}];
    if(mode==='stopwatch')actions.push({id:'lap',label:'הקפה',enabled:true},{id:'split',label:'פיצול',enabled:true});
    if(mode==='intervals')actions.push({id:'skip',label:'דלג שלב',enabled:true});
    if(mode==='timer'&&ended&&!state.overtimeActive)actions.push({id:'overtime',label:'הארכה',enabled:true});
    return {id:'time-center',label:state.overtimeActive?'הארכה':mode==='stopwatch'?'סטופר':mode==='intervals'?'אינטרוולים':'טיימר',kind:mode==='stopwatch'?'stopwatch':mode==='intervals'?'interval':'countdown',status:ended?'finished':running?'running':ready?'ready':'paused',valueMs:Math.max(0,Number(valueMs)||0),sign,phase,context:contexts.join(' · '),primaryAction:ended?null:{id:running?'pause':'start',label:running?'השהה':'התחל'},actions,_provider:'time-center'};
  }

  function persistSuite(root,timer){
    try{root.localStorage&&root.localStorage.setItem('teamScoreSuite.timer',JSON.stringify(timer))}catch(_){ }
    emit(root,'game-suite');
  }

  function suitePerform(root,actionId,at){
    const api=root.TeamScoreGameSuite,t=api&&api.timer,session=api&&api.getSession&&api.getSession();
    if(!api||!t||!session||!SUITE_MODES.has(session.mode))return false;
    const now=Number.isFinite(at)?at:nowOf(root);
    const current=()=>suiteCurrent(t,now);
    const configured=Math.max(1000,Number(session.config&&session.config.duration)||Number(t.durationMs)||60000);
    if(actionId==='start'){
      if(t.running)return true;
      if(t.mode==='stopwatch')t.mode='timer';
      if(!Number(t.durationMs)||Number(t.durationMs)!==configured)t.durationMs=configured;
      if((Number(t.baseMs)||0)<=0)t.baseMs=t.durationMs;
      t.startedWall=now;t.startedMono=0;t.running=true;persistSuite(root,t);return true;
    }
    if(actionId==='pause'){
      if(!t.running)return true;t.baseMs=current();t.running=false;persistSuite(root,t);return true;
    }
    if(actionId==='reset'){
      t.running=false;t.mode='timer';t.durationMs=configured;t.baseMs=configured;t.laps=[];if(t.interval){t.interval.round=1;t.interval.phase='work'}persistSuite(root,t);return true;
    }
    const delta=actionId==='add-10'?10000:actionId==='add-30'?30000:actionId==='sub-10'?-10000:null;
    if(delta!=null){t.baseMs=Math.max(0,current()+delta);t.startedWall=now;persistSuite(root,t);return true}
    return false;
  }

  function createCore(root){
    root=root||defaultRoot||{};
    function getSnapshot(at){
      const now=Number.isFinite(at)?at:nowOf(root);
      return timedRoundsProvider(root,now)||suiteProvider(root,now)||timeCenterProvider(root,now)||{id:'idle',label:'זמן',kind:'countdown',status:'idle',valueMs:0,sign:'',phase:'idle',context:'בחר מצב זמן',primaryAction:null,actions:[],_provider:'idle'};
    }
    function perform(actionId,at){
      const snap=getSnapshot(Number.isFinite(at)?at:nowOf(root));
      if(snap.id==='timed-rounds'){
        const api=root.TeamScoreTimedRounds;if(!api)return false;
        const map={'start-now':'startNow','add-break':'addBreak','pause':'pause','resume':'pause','skip':'skip'};
        const method=map[actionId];if(method&&typeof api[method]==='function'){api[method]();emit(root,'timed-rounds');return true}return false;
      }
      if(snap.id==='game-suite')return suitePerform(root,actionId,Number.isFinite(at)?at:nowOf(root));
      if(snap.id==='time-center'){
        const api=root.TeamScoreTimeCenter;if(!api)return false;
        const map={start:'start',pause:'pause',reset:'reset',lap:'lap',split:'split',skip:'skip',overtime:'overtime','open-full':'open'};
        const method=map[actionId];if(method&&typeof api[method]==='function'){api[method]();emit(root,'time-center');return true}return false;
      }
      if(actionId==='open-full'&&root.TeamScoreTimeCenter&&typeof root.TeamScoreTimeCenter.open==='function'){root.TeamScoreTimeCenter.open();return true}
      return false;
    }
    return {getSnapshot,perform};
  }

  function createBrowserApi(root){
    const core=createCore(root);let host=null,refreshTimer=0,drag=null;
    function loadUi(){try{return Object.assign({x:null,y:null,collapsed:false},JSON.parse(root.localStorage.getItem(UI_KEY)||'{}'))}catch(_){return{x:null,y:null,collapsed:false}}}
    function saveUi(ui){try{root.localStorage.setItem(UI_KEY,JSON.stringify({x:ui.x,y:ui.y,collapsed:!!ui.collapsed}))}catch(_){ }}
    let ui=loadUi();
    function ensureHost(){
      if(host&&host.isConnected)return host;
      if(!root.document||!root.document.body)return null;
      host=root.document.createElement('section');host.className='score-time-hub';host.setAttribute('role','region');host.setAttribute('aria-label','מרכז זמן');
      host.innerHTML=`<div class="score-time-hub-head" data-time-hub-drag><div><strong data-time-hub-label>זמן</strong><span data-time-hub-status></span></div><button type="button" data-time-hub-collapse aria-label="צמצם או הרחב">⌄</button></div><div class="score-time-hub-clock" data-time-hub-clock>00:00</div><div class="score-time-hub-context" data-time-hub-context></div><div class="score-time-hub-actions" data-time-hub-actions></div><div class="score-time-hub-footer"><button type="button" data-time-hub-full>מרכז זמן מלא</button></div>`;
      root.document.body.appendChild(host);root.document.body.classList.add('score-time-hub-ready');
      if(ui.x!=null&&ui.y!=null){host.style.left=`${ui.x}px`;host.style.top=`${ui.y}px`;host.style.right='auto';host.style.bottom='auto'}
      host.classList.toggle('is-collapsed',!!ui.collapsed);
      host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-time-hub-collapse')){ui.collapsed=!ui.collapsed;host.classList.toggle('is-collapsed',ui.collapsed);saveUi(ui);return}if(b.hasAttribute('data-time-hub-full')){const tc=root.TeamScoreTimeCenter;if(tc&&typeof tc.open==='function')tc.open();return}const id=b.getAttribute('data-time-hub-action');if(id){core.perform(id);refresh()}});
      const dragHandle=host.querySelector('[data-time-hub-drag]');
      dragHandle.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=host.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};dragHandle.setPointerCapture&&dragHandle.setPointerCapture(e.pointerId);e.preventDefault()});
      dragHandle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const w=host.offsetWidth||260,h=host.offsetHeight||140,x=clamp(e.clientX-drag.dx,8,Math.max(8,root.innerWidth-w-8)),y=clamp(e.clientY-drag.dy,8,Math.max(8,root.innerHeight-h-8));host.style.left=`${x}px`;host.style.top=`${y}px`;host.style.right='auto';host.style.bottom='auto';ui.x=x;ui.y=y});
      const stop=e=>{if(!drag||e.pointerId!==drag.id)return;saveUi(ui);drag=null};dragHandle.addEventListener('pointerup',stop);dragHandle.addEventListener('pointercancel',stop);
      return host;
    }
    function refresh(){
      const el=ensureHost();if(!el)return;const snap=core.getSnapshot();
      el.dataset.provider=snap.id;el.dataset.status=snap.status;
      const label=el.querySelector('[data-time-hub-label]'),status=el.querySelector('[data-time-hub-status]'),clock=el.querySelector('[data-time-hub-clock]'),context=el.querySelector('[data-time-hub-context]'),actions=el.querySelector('[data-time-hub-actions]');
      if(label)label.textContent=snap.label;if(status)status.textContent=snap.status==='running'?'רץ':snap.status==='paused'?'מושהה':snap.status==='finished'?'הסתיים':snap.status==='ready'?'מוכן':'';if(clock)clock.textContent=formatClock(snap.valueMs,snap.sign);if(context)context.textContent=snap.context||'';
      if(actions){actions.replaceChildren();const all=[];if(snap.primaryAction)all.push(Object.assign({enabled:true,primary:true},snap.primaryAction));for(const a of snap.actions||[])all.push(a);for(const a of all){const b=root.document.createElement('button');b.type='button';b.setAttribute('data-time-hub-action',a.id);b.textContent=a.label;b.disabled=a.enabled===false;if(a.primary)b.classList.add('primary');actions.appendChild(b)}}
    }
    function init(){ensureHost();refresh();root.addEventListener&&root.addEventListener('teamscore:timechange',refresh);root.addEventListener&&root.addEventListener('visibilitychange',refresh);root.addEventListener&&root.addEventListener('resize',()=>{if(!host||ui.x==null)return;const r=host.getBoundingClientRect();ui.x=clamp(r.left,8,Math.max(8,root.innerWidth-r.width-8));ui.y=clamp(r.top,8,Math.max(8,root.innerHeight-r.height-8));host.style.left=`${ui.x}px`;host.style.top=`${ui.y}px`;saveUi(ui)});refreshTimer=root.setInterval?root.setInterval(refresh,250):0}
    if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init()}
    return {getSnapshot:core.getSnapshot,perform:core.perform,refresh,openFull(){const t=root.TeamScoreTimeCenter;return !!(t&&typeof t.open==='function'&&(t.open(),true))}};
  }

  return {createCore,createBrowserApi,formatClock};
});
