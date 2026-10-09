(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ScoreTimerV2Core=api;
})(typeof window!=='undefined'?window:null,function(){
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,n(v,min)));

  function formatClock(ms){
    const total=Math.max(0,Math.floor(n(ms)/1000));
    const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return h>0?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function createIntervalPlan(input={}){
    return {
      workMs:Math.max(100,n(input.workMs,40000)),
      restMs:Math.max(0,n(input.restMs,20000)),
      rounds:Math.max(1,Math.floor(n(input.rounds,8))),
      startDelayMs:Math.max(0,n(input.startDelayMs,0)),
      betweenSetsMs:Math.max(0,n(input.betweenSetsMs,0)),
      sets:Math.max(1,Math.floor(n(input.sets,1)))
    };
  }

  function createTimerState(input={}){
    const mode=['stopwatch','timer','intervals'].includes(input.mode)?input.mode:'stopwatch';
    return {
      version:2,
      mode,
      running:false,
      startedAt:n(input.now,Date.now()),
      accumulatedMs:0,
      durationMs:Math.max(0,n(input.durationMs,5*60*1000)),
      intervalPlan:createIntervalPlan(input.intervalPlan||{}),
      overtimeEnabled:!!input.overtimeEnabled,
      laps:Array.isArray(input.laps)?input.laps.slice():[]
    };
  }

  function elapsedMs(state,now){
    return Math.max(0,n(state.accumulatedMs,0)+(state.running?Math.max(0,n(now,Date.now())-n(state.startedAt,0)):0));
  }

  function intervalTimeline(plan){
    const p=createIntervalPlan(plan);
    const segments=[];
    if(p.startDelayMs>0) segments.push({phase:'delay',durationMs:p.startDelayMs,round:0,set:1});
    for(let set=1;set<=p.sets;set++){
      for(let round=1;round<=p.rounds;round++){
        segments.push({phase:'work',durationMs:p.workMs,round,set});
        const lastRound=round===p.rounds;
        const lastSet=set===p.sets;
        if(!lastRound && p.restMs>0) segments.push({phase:'rest',durationMs:p.restMs,round,set});
        if(lastRound&&!lastSet&&p.betweenSetsMs>0) segments.push({phase:'set-rest',durationMs:p.betweenSetsMs,round,set});
      }
    }
    return segments;
  }

  function intervalSnapshot(state,elapsed){
    const segments=intervalTimeline(state.intervalPlan);
    let cursor=0;
    for(const seg of segments){
      const end=cursor+seg.durationMs;
      if(elapsed<end){
        return {finished:false,phase:seg.phase,round:seg.round,set:seg.set,phaseElapsedMs:elapsed-cursor,displayMs:end-elapsed,totalElapsedMs:elapsed};
      }
      cursor=end;
    }
    return {finished:true,phase:'finished',round:state.intervalPlan.rounds,set:state.intervalPlan.sets,phaseElapsedMs:0,displayMs:0,totalElapsedMs:elapsed};
  }

  function snapshot(state,now=Date.now()){
    const elapsed=elapsedMs(state,now);
    if(state.mode==='stopwatch') return {mode:state.mode,running:state.running,displayMs:elapsed,elapsedMs:elapsed,finished:false,overtime:false,overtimeMs:0,laps:state.laps||[]};
    if(state.mode==='intervals') return Object.assign({mode:state.mode,running:state.running,overtime:false,overtimeMs:0},intervalSnapshot(state,elapsed));
    const remaining=Math.max(0,n(state.durationMs)-elapsed);
    const over=Math.max(0,elapsed-n(state.durationMs));
    return {mode:state.mode,running:state.running,displayMs:remaining,elapsedMs:elapsed,finished:elapsed>=n(state.durationMs),overtime:!!state.overtimeEnabled&&over>0,overtimeMs:state.overtimeEnabled?over:0,laps:state.laps||[]};
  }

  function transition(state,action={}){
    const now=n(action.now,Date.now());
    const next=Object.assign({},state,{laps:(state.laps||[]).slice()});
    switch(action.type){
      case 'START':
        if(!next.running){next.running=true;next.startedAt=now;}
        return next;
      case 'PAUSE':
        if(next.running){next.accumulatedMs=elapsedMs(next,now);next.running=false;next.startedAt=now;}
        return next;
      case 'RESET':
        next.running=false;next.accumulatedMs=0;next.startedAt=now;next.laps=[];return next;
      case 'SET_MODE':
        next.mode=['stopwatch','timer','intervals'].includes(action.mode)?action.mode:next.mode;
        next.running=false;next.accumulatedMs=0;next.startedAt=now;next.laps=[];return next;
      case 'SET_DURATION':
        next.durationMs=Math.max(0,n(action.durationMs,next.durationMs));next.running=false;next.accumulatedMs=0;next.startedAt=now;return next;
      case 'ADJUST_TIME':
        next.durationMs=Math.max(0,n(next.durationMs)+n(action.deltaMs));return next;
      case 'SET_INTERVAL_PLAN':
        next.intervalPlan=createIntervalPlan(action.plan||{});next.running=false;next.accumulatedMs=0;next.startedAt=now;return next;
      case 'SET_OVERTIME':
        next.overtimeEnabled=!!action.enabled;return next;
      case 'LAP': {
        const snap=snapshot(next,now);next.laps.push({at:now,ms:snap.elapsedMs!=null?snap.elapsedMs:snap.totalElapsedMs||0,label:action.label||''});return next;
      }
      case 'SKIP': {
        if(next.mode!=='intervals') return next;
        const elapsed=elapsedMs(next,now),segs=intervalTimeline(next.intervalPlan);let cursor=0;
        for(const seg of segs){const end=cursor+seg.durationMs;if(elapsed<end){next.accumulatedMs=end;next.startedAt=now;return next;}cursor=end;}
        return next;
      }
      default:return next;
    }
  }

  function serialize(state){return JSON.stringify(state);}
  function restoreTimer(saved,now=Date.now()){
    try{
      const obj=typeof saved==='string'?JSON.parse(saved):saved;
      if(!obj||obj.version!==2) return createTimerState({now});
      const next=Object.assign(createTimerState({mode:obj.mode,now}),obj);
      next.intervalPlan=createIntervalPlan(obj.intervalPlan||{});
      next.laps=Array.isArray(obj.laps)?obj.laps:[];
      return next;
    }catch(_){return createTimerState({now});}
  }

  return {formatClock,createIntervalPlan,createTimerState,transition,snapshot,serialize,restoreTimer,intervalTimeline};
});
