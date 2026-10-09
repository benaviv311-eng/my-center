(function(){
  const PRESSURE_DURATION_MS=15000;
  const PRESSURE_CHANT_GAP_MS=3600;
  const LIVE_CHANT_MIN_MS=8000;
  const LIVE_CHANT_MAX_MS=25000;
  const LIVE_NOISE_MIN_MS=40000;
  const LIVE_NOISE_MAX_MS=90000;
  const LIVE_REFRAIN_MIN_MS=12000;
  const LIVE_REFRAIN_MAX_MS=28000;
  const LIVE_REFRAIN_FIRST_MIN_MS=3500;
  const LIVE_REFRAIN_FIRST_MAX_MS=8500;
  const NOISE_CROSSFADE_MS=1400;
  const RHYTHMIC_CHANT_MIN_REPEATS=2;
  const RHYTHMIC_CHANT_MAX_REPEATS=4;
  const RHYTHMIC_CHANT_STEP_MIN_MS=520;
  const RHYTHMIC_CHANT_STEP_MAX_MS=820;
  const CHANT_LIVE_BOOST=1.28;
  const CHANT_ANTHEM_DUCK=0.22;
  const CHANT_NOISE_DUCK=0.56;

  const ARENA_ASSETS={
    chants:{
      'רשת!':[
        'audio/chants/reshet-deep.mp3',
        'audio/chants/reshet-raspy.mp3',
        'audio/chants/reshet-sharp.mp3',
        'audio/chants/reshet-hype.mp3'
      ],
      'הוא לא יודע!':[
        'audio/chants/hu-lo-yodea-deep.mp3',
        'audio/chants/hu-lo-yodea-young.mp3',
        'audio/chants/hu-lo-yodea-husky.mp3',
        'audio/chants/hu-lo-yodea-sharp.mp3'
      ],
      'בוזזזזזז!':[
        'audio/chants/boo-deep.mp3',
        'audio/chants/boo-raspy.mp3',
        'audio/chants/boo-young.mp3',
        'audio/chants/boo-sharp.mp3'
      ],
      'תחזרו הביתה!':[
        'audio/chants/tachzeru-deep.mp3',
        'audio/chants/tachzeru-raspy-double.mp3',
        'audio/chants/tachzeru-young.mp3',
        'audio/chants/tachzeru-sharp.mp3'
      ]
    },
    anthems:[
      {label:'יציע קצבי',src:'audio/anthems/anthem-01.mp3'},
      {label:'כבד ואיטי',src:'audio/anthems/anthem-02-heavy.mp3'},
      {label:'מהיר ואגרסיבי',src:'audio/anthems/anthem-03-fast.mp3'},
      {label:'יציע מתפרץ',src:'audio/anthems/anthem-04-eruption.mp3'}
    ],
    noise:[
      {label:'אולם חי',src:'audio/noise/arena-base.mp3'},
      {label:'קהל עוין',src:'audio/noise/hostile-crowd.mp3'},
      {label:'לחץ',src:'audio/noise/pressure-bed.mp3'}
    ]
  };

  const layerState={
    chants:{enabled:true,volume:0.98},
    anthems:{enabled:false,volume:0.70},
    noise:{enabled:false,volume:0.58}
  };

  let masterVolume=0.90;
  let liveIntensity=0.56;
  let ctx=null;
  let masterGain=null;
  let chantGain=null;
  let anthemGain=null;
  let noiseGain=null;
  let anthemSource=null;
  let noiseSource=null;
  let anthemPlayToken=0;
  let noisePlayToken=0;
  let currentAnthemIndex=0;
  let currentNoiseIndex=0;
  let pressureOn=false;
  let pressureTimer=0;
  let pressureChantTimer=0;
  let pressureSnapshot=null;
  let lastPressureChant=-1;
  let liveModeOn=false;
  let liveChantTimer=0;
  let liveNoiseTimer=0;
  let liveRefrainTimer=0;
  let liveSnapshot=null;
  let lastLiveChant=-1;
  let lastLiveAnthem=-1;
  let unlockedOnce=false;
  let panel=null;
  let body=null;
  let statusEl=null;
  let pressureButton=null;
  let liveButton=null;
  let masterInput=null;
  let intensityInput=null;
  let intensityValueEl=null;
  let nowPlayingEl=null;
  let eqEl=null;

  const nowPlaying={chant:'',anthem:'',noise:''};
  const bufferCache=new Map();
  const lastVariantByChant=new Map();
  const activeChantSources=new Set();
  const rhythmicChantTimers=new Set();
  const AudioCtx=window.AudioContext||window.webkitAudioContext;

  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
  function percent(value){ return Math.round(value*100); }
  function randomDelay(min,max){ return Math.round(min+Math.random()*Math.max(0,max-min)); }

  function setStatus(text,state){
    if(!statusEl) return;
    statusEl.textContent=text;
    statusEl.dataset.state=state||'idle';
  }

  function syncNowPlaying(){
    if(!panel) return;
    const pieces=[];
    if(layerState.noise.enabled&&nowPlaying.noise) pieces.push('🏟️ '+nowPlaying.noise);
    if(layerState.anthems.enabled&&nowPlaying.anthem) pieces.push('🥁 '+nowPlaying.anthem);
    if(layerState.chants.enabled&&nowPlaying.chant) pieces.push('📣 '+nowPlaying.chant);
    if(nowPlayingEl) nowPlayingEl.textContent=pieces.length?pieces.join('  •  '):'ממתין לסאונד…';
    if(eqEl){
      const active=!!(pressureOn||liveModeOn||anthemSource||noiseSource||activeChantSources.size);
      eqEl.classList.toggle('is-active',active);
    }
  }

  function setNowPlaying(kind,label){
    if(Object.prototype.hasOwnProperty.call(nowPlaying,kind)) nowPlaying[kind]=label||'';
    syncNowPlaying();
  }

  function safeGain(param,value){
    if(!param || !ctx) return;
    const now=ctx.currentTime;
    try{
      param.cancelScheduledValues(now);
      param.setTargetAtTime(value,now,0.045);
    }catch(_){
      try{ param.value=value; }catch(__){}
    }
  }

  function makeGain(){
    const gain=ctx.createGain();
    gain.gain.value=0;
    gain.connect(masterGain);
    return gain;
  }

  async function ensureAudio(options){
    const confirm=!!(options&&options.confirm);
    if(!AudioCtx){
      setStatus('הדפדפן לא תומך במערכת הסאונד','error');
      return false;
    }
    if(!ctx){
      ctx=new AudioCtx();
      masterGain=ctx.createGain();
      masterGain.gain.value=masterVolume;
      masterGain.connect(ctx.destination);
      chantGain=makeGain();
      anthemGain=makeGain();
      noiseGain=makeGain();
      applyMix();
    }
    if(ctx.state==='suspended'){
      try{ await ctx.resume(); }catch(_){ }
    }
    if(ctx.state!=='running'){
      setStatus('לחץ שוב כדי לאפשר סאונד','blocked');
      return false;
    }
    if(confirm && !unlockedOnce){
      unlockedOnce=true;
      warmAssets();
    }
    if(pressureOn) setStatus('🔥 מצב לחץ פעיל','on');
    else if(liveModeOn) setStatus('♾️ יציע חי — קריאות קצביות ופזמונים','on');
    else setStatus('סאונד מוכן — שלוט בכל שכבה בנפרד','on');
    return true;
  }

  async function loadBuffer(src){
    if(!ctx) throw new Error('audio context not ready');
    if(bufferCache.has(src)) return bufferCache.get(src);
    const promise=fetch(src,{cache:'force-cache'})
      .then(response=>{
        if(!response.ok) throw new Error('audio '+response.status+' '+src);
        return response.arrayBuffer();
      })
      .then(bytes=>ctx.decodeAudioData(bytes));
    bufferCache.set(src,promise);
    try{
      return await promise;
    }catch(error){
      bufferCache.delete(src);
      throw error;
    }
  }

  function warmAssets(){
    const warm=[
      ...ARENA_ASSETS.noise.map(item=>item.src),
      ...ARENA_ASSETS.anthems.map(item=>item.src),
      ...Object.values(ARENA_ASSETS.chants).flat()
    ];
    warm.forEach(src=>loadBuffer(src).catch(()=>{}));
  }

  function stopRef(ref){
    if(!ref) return;
    try{ ref.source.onended=null; }catch(_){ }
    try{ ref.source.stop(); }catch(_){ }
  }

  function stopBuffer(refName){
    const ref=refName==='anthem'?anthemSource:noiseSource;
    if(!ref) return;
    if(refName==='anthem'){
      anthemSource=null;
      setNowPlaying('anthem','');
    }else{
      noiseSource=null;
      setNowPlaying('noise','');
    }
    stopRef(ref);
  }

  function randomIndex(length,last,allowed){
    const pool=(allowed&&allowed.length?allowed:Array.from({length},(_,i)=>i)).filter(i=>i>=0&&i<length);
    if(!pool.length) return 0;
    if(pool.length===1) return pool[0];
    let pick=pool[Math.floor(Math.random()*pool.length)];
    if(pick===last){
      const pos=pool.indexOf(pick);
      pick=pool[(pos+1)%pool.length];
    }
    return pick;
  }

  function liveAnthemPool(){
    if(liveIntensity<0.34) return [0,1];
    if(liveIntensity<0.72) return [0,1,2,3];
    return [2,3,0];
  }

  function liveNoisePool(){
    if(liveIntensity<0.34) return [0];
    if(liveIntensity<0.72) return [0,1];
    return [1,2];
  }

  function liveChantWindow(){
    const min=LIVE_CHANT_MIN_MS+(1-liveIntensity)*7000;
    const max=LIVE_CHANT_MAX_MS-liveIntensity*8000;
    return [Math.round(min),Math.round(Math.max(min+2200,max))];
  }

  function liveNoiseWindow(){
    const min=LIVE_NOISE_MIN_MS+(1-liveIntensity)*25000;
    const max=LIVE_NOISE_MAX_MS-liveIntensity*30000;
    return [Math.round(min),Math.round(Math.max(min+7000,max))];
  }

  function liveRefrainWindow(){
    const min=LIVE_REFRAIN_MIN_MS+(1-liveIntensity)*7000;
    const max=LIVE_REFRAIN_MAX_MS-liveIntensity*6500;
    return [Math.round(min),Math.round(Math.max(min+3500,max))];
  }

  async function startAnthem(index,options){
    const opts=options||{};
    if(!(await ensureAudio())) return false;
    const safeIndex=((Number(index)||0)%ARENA_ASSETS.anthems.length+ARENA_ASSETS.anthems.length)%ARENA_ASSETS.anthems.length;
    currentAnthemIndex=safeIndex;
    const token=++anthemPlayToken;
    const item=ARENA_ASSETS.anthems[safeIndex];
    try{
      const buffer=await loadBuffer(item.src);
      if(token!==anthemPlayToken || (!layerState.anthems.enabled&&!opts.force)) return false;
      stopBuffer('anthem');
      const source=ctx.createBufferSource();
      source.buffer=buffer;
      source.connect(anthemGain);
      anthemSource={source,index:safeIndex};
      setNowPlaying('anthem',item.label);
      source.onended=()=>{
        if(!anthemSource || anthemSource.source!==source) return;
        anthemSource=null;
        setNowPlaying('anthem','');
        if(!layerState.anthems.enabled || !ctx || ctx.state!=='running') return;
        if(pressureOn){
          const next=randomIndex(ARENA_ASSETS.anthems.length,safeIndex,[2,3]);
          startAnthem(next,{force:true});
          return;
        }
        if(liveModeOn){
          scheduleLiveRefrain(false);
          return;
        }
        const next=randomIndex(ARENA_ASSETS.anthems.length,safeIndex,null);
        startAnthem(next);
      };
      source.start(0,Math.max(0,Number(opts.offset)||0)%Math.max(0.01,buffer.duration));
      syncUI();
      return true;
    }catch(error){
      if(token===anthemPlayToken) setStatus('לא הצלחתי לטעון את פזמון היציע','error');
      return false;
    }
  }

  async function startNoise(index,options){
    const opts=options||{};
    if(!(await ensureAudio())) return false;
    const safeIndex=((Number(index)||0)%ARENA_ASSETS.noise.length+ARENA_ASSETS.noise.length)%ARENA_ASSETS.noise.length;
    currentNoiseIndex=safeIndex;
    const token=++noisePlayToken;
    const item=ARENA_ASSETS.noise[safeIndex];
    try{
      const buffer=await loadBuffer(item.src);
      if(token!==noisePlayToken || (!layerState.noise.enabled&&!opts.force)) return false;
      stopBuffer('noise');
      const source=ctx.createBufferSource();
      const trackGain=ctx.createGain();
      source.buffer=buffer;
      source.loop=true;
      trackGain.gain.value=1;
      source.connect(trackGain);
      trackGain.connect(noiseGain);
      noiseSource={source,index:safeIndex,gain:trackGain};
      setNowPlaying('noise',item.label);
      source.start(0,Math.max(0,Number(opts.offset)||0)%Math.max(0.01,buffer.duration));
      syncUI();
      return true;
    }catch(error){
      if(token===noisePlayToken) setStatus('לא הצלחתי לטעון את רעש הקהל','error');
      return false;
    }
  }

  async function crossfadeNoise(index){
    if(!(await ensureAudio())) return false;
    if(!layerState.noise.enabled) return false;
    const safeIndex=((Number(index)||0)%ARENA_ASSETS.noise.length+ARENA_ASSETS.noise.length)%ARENA_ASSETS.noise.length;
    if(noiseSource&&noiseSource.index===safeIndex) return true;
    const token=++noisePlayToken;
    const item=ARENA_ASSETS.noise[safeIndex];
    try{
      const buffer=await loadBuffer(item.src);
      if(token!==noisePlayToken || !layerState.noise.enabled) return false;
      const previous=noiseSource;
      const source=ctx.createBufferSource();
      const trackGain=ctx.createGain();
      source.buffer=buffer;
      source.loop=true;
      source.connect(trackGain);
      trackGain.connect(noiseGain);
      const now=ctx.currentTime;
      trackGain.gain.setValueAtTime(0.0001,now);
      trackGain.gain.linearRampToValueAtTime(1,now+NOISE_CROSSFADE_MS/1000);
      source.start(0,Math.random()*Math.max(0.01,buffer.duration));
      noiseSource={source,index:safeIndex,gain:trackGain};
      currentNoiseIndex=safeIndex;
      setNowPlaying('noise',item.label);
      if(previous){
        try{
          previous.gain.gain.cancelScheduledValues(now);
          previous.gain.gain.setValueAtTime(Math.max(0.0001,previous.gain.gain.value||1),now);
          previous.gain.gain.linearRampToValueAtTime(0.0001,now+NOISE_CROSSFADE_MS/1000);
        }catch(_){ }
        setTimeout(()=>stopRef(previous),NOISE_CROSSFADE_MS+120);
      }
      syncUI();
      return true;
    }catch(error){
      if(token===noisePlayToken) setStatus('לא הצלחתי להחליף את רעש הקהל','error');
      return false;
    }
  }

  function clearRhythmicChantTimers(){
    rhythmicChantTimers.forEach(timer=>clearTimeout(timer));
    rhythmicChantTimers.clear();
  }

  function stopAllChants(){
    clearRhythmicChantTimers();
    activeChantSources.forEach(source=>{
      try{ source.onended=null;source.stop(); }catch(_){ }
    });
    activeChantSources.clear();
    setNowPlaying('chant','');
    applyMix();
  }

  function applyMix(){
    if(!ctx||!masterGain) return;
    const chantActive=activeChantSources.size>0;
    const chantBoost=pressureOn?1.34:(liveModeOn?CHANT_LIVE_BOOST:1.16);
    safeGain(masterGain.gain,masterVolume);
    safeGain(chantGain.gain,layerState.chants.enabled?clamp(layerState.chants.volume*chantBoost,0,1.38):0);
    const anthemDuck=chantActive?CHANT_ANTHEM_DUCK:1;
    const noiseDuck=chantActive?CHANT_NOISE_DUCK:1;
    const pressureAnthemBoost=pressureOn?1.10:1;
    const pressureNoiseBoost=pressureOn?1.18:1;
    safeGain(anthemGain.gain,layerState.anthems.enabled?clamp(layerState.anthems.volume*pressureAnthemBoost*anthemDuck,0,1):0);
    safeGain(noiseGain.gain,layerState.noise.enabled?clamp(layerState.noise.volume*pressureNoiseBoost*noiseDuck,0,1):0);
  }

  async function setLayerVolume(layer,value){
    if(!layerState[layer]) return;
    layerState[layer].volume=clamp(Number(value)||0,0,1);
    await ensureAudio();
    applyMix();
    syncUI();
  }

  async function toggleLayer(layer,forced){
    if(!layerState[layer]) return false;
    const enabled=typeof forced==='boolean'?forced:!layerState[layer].enabled;
    layerState[layer].enabled=enabled;
    if(!(await ensureAudio({confirm:true}))){
      layerState[layer].enabled=false;
      syncUI();
      return false;
    }
    if(layer==='anthems'){
      clearTimeout(liveRefrainTimer);
      liveRefrainTimer=0;
      if(enabled){
        if(liveModeOn&&!pressureOn) scheduleLiveRefrain(true);
        else await startAnthem(currentAnthemIndex);
      }else{
        ++anthemPlayToken;
        stopBuffer('anthem');
      }
    }else if(layer==='noise'){
      if(enabled) await startNoise(currentNoiseIndex); else { ++noisePlayToken;stopBuffer('noise'); }
    }else if(layer==='chants'&&!enabled){
      stopAllChants();
    }
    applyMix();
    syncUI();
    return true;
  }

  async function playChant(label,options){
    const opts=options||{};
    const variants=ARENA_ASSETS.chants[label];
    if(!variants||!variants.length) return false;
    if(!layerState.chants.enabled){
      if(opts.force) layerState.chants.enabled=true;
      else await toggleLayer('chants',true);
    }
    if(!(await ensureAudio({confirm:!opts.automatic}))) return false;
    const last=lastVariantByChant.get(label);
    const variantIndex=randomIndex(variants.length,last);
    lastVariantByChant.set(label,variantIndex);
    try{
      const buffer=await loadBuffer(variants[variantIndex]);
      if(!layerState.chants.enabled) return false;
      const source=ctx.createBufferSource();
      source.buffer=buffer;
      source.connect(chantGain);
      activeChantSources.add(source);
      setNowPlaying('chant',label);
      source.onended=()=>{
        activeChantSources.delete(source);
        if(!activeChantSources.size&&nowPlaying.chant===label) setNowPlaying('chant','');
        applyMix();
      };
      applyMix();
      source.start();
      return true;
    }catch(error){
      setStatus('לא הצלחתי לטעון את הקריאה','error');
      return false;
    }
  }

  async function playRhythmicChant(label,options){
    const opts=options||{};
    const intensity=pressureOn?1:liveIntensity;
    const minRepeats=Number.isFinite(opts.repeats)?opts.repeats:RHYTHMIC_CHANT_MIN_REPEATS;
    const maxRepeats=Number.isFinite(opts.repeats)?opts.repeats:RHYTHMIC_CHANT_MAX_REPEATS;
    const target=minRepeats+Math.round(intensity*Math.max(0,maxRepeats-minRepeats));
    const repeats=clamp(target,RHYTHMIC_CHANT_MIN_REPEATS,RHYTHMIC_CHANT_MAX_REPEATS);
    const stepMin=Math.max(430,RHYTHMIC_CHANT_STEP_MIN_MS-Math.round(intensity*90));
    const stepMax=Math.max(stepMin+80,RHYTHMIC_CHANT_STEP_MAX_MS-Math.round(intensity*160));
    const first=await playChant(label,opts);
    if(!first) return false;
    let elapsed=0;
    for(let i=1;i<repeats;i++){
      elapsed+=randomDelay(stepMin,stepMax);
      const timer=setTimeout(()=>{
        rhythmicChantTimers.delete(timer);
        if(layerState.chants.enabled && (!opts.liveOnly||liveModeOn) && (!opts.pressureOnly||pressureOn)){
          playChant(label,{automatic:true,force:opts.force});
        }
      },elapsed);
      rhythmicChantTimers.add(timer);
    }
    return true;
  }

  async function cycleAnthem(){
    if(!layerState.anthems.enabled) await toggleLayer('anthems',true);
    if(!layerState.anthems.enabled) return;
    const allowed=pressureOn?[2,3]:(liveModeOn?liveAnthemPool():null);
    const next=randomIndex(ARENA_ASSETS.anthems.length,currentAnthemIndex,allowed);
    lastLiveAnthem=next;
    await startAnthem(next,{force:pressureOn});
  }

  async function cycleNoise(){
    if(!layerState.noise.enabled) await toggleLayer('noise',true);
    if(!layerState.noise.enabled) return;
    const allowed=pressureOn?[1,2]:(liveModeOn?liveNoisePool():[0,1]);
    const next=randomIndex(ARENA_ASSETS.noise.length,currentNoiseIndex,allowed);
    if(liveModeOn&&!pressureOn) await crossfadeNoise(next);
    else await startNoise(next,{force:pressureOn});
  }

  function snapshotMix(){
    return {
      chants:layerState.chants.enabled,
      anthems:layerState.anthems.enabled,
      noise:layerState.noise.enabled,
      anthemIndex:currentAnthemIndex,
      noiseIndex:currentNoiseIndex
    };
  }

  async function applySnapshot(snapshot){
    if(!snapshot) return;
    layerState.chants.enabled=snapshot.chants;
    layerState.anthems.enabled=snapshot.anthems;
    layerState.noise.enabled=snapshot.noise;
    if(!snapshot.chants) stopAllChants();
    if(snapshot.anthems) await startAnthem(snapshot.anthemIndex,{force:true});
    else { ++anthemPlayToken;stopBuffer('anthem'); }
    if(snapshot.noise) await startNoise(snapshot.noiseIndex,{force:true});
    else { ++noisePlayToken;stopBuffer('noise'); }
    applyMix();
    syncUI();
  }

  async function pressureMix(enabled){
    if(enabled){
      if(!pressureSnapshot) pressureSnapshot=snapshotMix();
      layerState.chants.enabled=true;
      layerState.anthems.enabled=true;
      layerState.noise.enabled=true;
      const pressureAnthem=randomIndex(ARENA_ASSETS.anthems.length,currentAnthemIndex,[2,3]);
      await Promise.all([
        startAnthem(pressureAnthem,{force:true}),
        startNoise(2,{force:true})
      ]);
      applyMix();
      syncUI();
      return;
    }
    const snapshot=pressureSnapshot;
    pressureSnapshot=null;
    if(snapshot) await applySnapshot(snapshot);
    else { applyMix();syncUI(); }
  }

  function nextPressureChant(){
    const labels=Object.keys(ARENA_ASSETS.chants);
    const index=randomIndex(labels.length,lastPressureChant);
    lastPressureChant=index;
    return labels[index];
  }

  function nextLiveChant(){
    const labels=Object.keys(ARENA_ASSETS.chants);
    const index=randomIndex(labels.length,lastLiveChant);
    lastLiveChant=index;
    return labels[index];
  }

  function pauseLiveSchedules(){
    clearTimeout(liveChantTimer);
    clearTimeout(liveNoiseTimer);
    clearTimeout(liveRefrainTimer);
    liveChantTimer=0;
    liveNoiseTimer=0;
    liveRefrainTimer=0;
    clearRhythmicChantTimers();
  }

  function scheduleLiveChant(){
    clearTimeout(liveChantTimer);
    if(!liveModeOn||pressureOn) return;
    const windowMs=liveChantWindow();
    liveChantTimer=setTimeout(async()=>{
      if(liveModeOn&&!pressureOn&&layerState.chants.enabled){
        await playRhythmicChant(nextLiveChant(),{automatic:true,liveOnly:true});
      }
      scheduleLiveChant();
    },randomDelay(windowMs[0],windowMs[1]));
  }

  function scheduleLiveNoiseShift(){
    clearTimeout(liveNoiseTimer);
    if(!liveModeOn||pressureOn) return;
    const windowMs=liveNoiseWindow();
    liveNoiseTimer=setTimeout(async()=>{
      if(liveModeOn&&!pressureOn&&layerState.noise.enabled){
        const next=randomIndex(ARENA_ASSETS.noise.length,currentNoiseIndex,liveNoisePool());
        await crossfadeNoise(next);
      }
      scheduleLiveNoiseShift();
    },randomDelay(windowMs[0],windowMs[1]));
  }

  function scheduleLiveRefrain(first){
    clearTimeout(liveRefrainTimer);
    liveRefrainTimer=0;
    if(!liveModeOn||pressureOn||!layerState.anthems.enabled) return;
    const windowMs=first?[LIVE_REFRAIN_FIRST_MIN_MS,LIVE_REFRAIN_FIRST_MAX_MS]:liveRefrainWindow();
    liveRefrainTimer=setTimeout(async()=>{
      if(!liveModeOn||pressureOn||!layerState.anthems.enabled) return;
      const next=randomIndex(ARENA_ASSETS.anthems.length,lastLiveAnthem,liveAnthemPool());
      lastLiveAnthem=next;
      await startAnthem(next,{liveRefrain:true});
    },randomDelay(windowMs[0],windowMs[1]));
  }

  async function startLiveMode(){
    if(liveModeOn) return true;
    if(pressureOn){
      setStatus('🔥 מצב לחץ פעיל — אפשר להפעיל יציע חי מיד אחריו','on');
      return false;
    }
    if(!(await ensureAudio({confirm:true}))) return false;
    liveSnapshot=snapshotMix();
    liveModeOn=true;
    layerState.chants.enabled=true;
    layerState.anthems.enabled=true;
    layerState.noise.enabled=true;
    ++anthemPlayToken;
    stopBuffer('anthem');
    const noiseIndex=randomIndex(ARENA_ASSETS.noise.length,currentNoiseIndex,liveNoisePool());
    await startNoise(noiseIndex);
    scheduleLiveChant();
    scheduleLiveNoiseShift();
    scheduleLiveRefrain(true);
    applyMix();
    setStatus('♾️ יציע חי — רעש, קריאות קצביות ופזמוני יציע','on');
    syncUI();
    return true;
  }

  async function stopLiveMode(){
    if(!liveModeOn&&!liveSnapshot) return;
    liveModeOn=false;
    pauseLiveSchedules();
    const snapshot=liveSnapshot;
    liveSnapshot=null;
    if(pressureOn){
      if(snapshot) pressureSnapshot=snapshot;
      setStatus('♾️ יציע חי נעצר — מצב לחץ ימשיך עד הסיום','on');
      syncUI();
      return;
    }
    await applySnapshot(snapshot);
    setStatus('יציע חי נעצר — חזרנו למיקס הקודם','on');
    syncUI();
  }

  async function setLiveIntensity(value){
    liveIntensity=clamp(Number(value)||0,0,1);
    if(liveModeOn&&!pressureOn){
      scheduleLiveChant();
      scheduleLiveNoiseShift();
      if(!anthemSource) scheduleLiveRefrain(false);
    }
    applyMix();
    syncUI();
  }

  async function stopPressure(){
    if(!pressureOn&&!pressureSnapshot) return;
    pressureOn=false;
    clearTimeout(pressureTimer);
    clearInterval(pressureChantTimer);
    pressureTimer=0;
    pressureChantTimer=0;
    clearRhythmicChantTimers();
    await pressureMix(false);
    if(liveModeOn){
      scheduleLiveChant();
      scheduleLiveNoiseShift();
      if(!anthemSource) scheduleLiveRefrain(false);
      setStatus('♾️ יציע חי חזר — קריאות ופזמונים ממשיכים','on');
    }else{
      setStatus('מצב לחץ הסתיים — חזרנו למיקס הקודם','on');
    }
    syncUI();
  }

  async function startPressure(){
    if(!(await ensureAudio({confirm:true}))) return false;
    if(pressureOn) await stopPressure();
    if(liveModeOn) pauseLiveSchedules();
    pressureOn=true;
    await pressureMix(true);
    setStatus('🔥 לחץ פעיל — קריאות חזקות וכל שלוש השכבות עובדות','on');
    setTimeout(()=>{ if(pressureOn) playRhythmicChant(nextPressureChant(),{automatic:true,force:true,repeats:2,pressureOnly:true}); },320);
    pressureChantTimer=setInterval(()=>{
      if(pressureOn) playRhythmicChant(nextPressureChant(),{automatic:true,force:true,repeats:2,pressureOnly:true});
    },PRESSURE_CHANT_GAP_MS);
    pressureTimer=setTimeout(stopPressure,PRESSURE_DURATION_MS);
    syncUI();
    return true;
  }

  async function setMasterVolume(value){
    masterVolume=clamp(Number(value)||0,0,1);
    await ensureAudio();
    applyMix();
    syncUI();
  }

  function syncUI(){
    if(!panel) return;
    Object.keys(layerState).forEach(layer=>{
      const toggle=panel.querySelector('[data-layer-toggle="'+layer+'"]');
      const input=panel.querySelector('[data-layer-volume="'+layer+'"]');
      const state=layerState[layer];
      if(toggle){
        toggle.classList.toggle('is-on',state.enabled);
        toggle.setAttribute('aria-pressed',String(state.enabled));
        toggle.textContent=state.enabled?'ON':'OFF';
      }
      if(input) input.value=String(percent(state.volume));
    });
    const anthemNow=panel.querySelector('[data-current-anthem]');
    const noiseNow=panel.querySelector('[data-current-noise]');
    if(anthemNow) anthemNow.textContent=ARENA_ASSETS.anthems[currentAnthemIndex].label;
    if(noiseNow) noiseNow.textContent=ARENA_ASSETS.noise[currentNoiseIndex].label;
    if(pressureButton){
      pressureButton.classList.toggle('is-on',pressureOn);
      pressureButton.setAttribute('aria-pressed',String(pressureOn));
      pressureButton.textContent=pressureOn?'🔥 לחץ פעיל':'🔥 לחץ · 15 שניות';
    }
    if(liveButton){
      liveButton.classList.toggle('is-on',liveModeOn);
      liveButton.setAttribute('aria-pressed',String(liveModeOn));
      liveButton.innerHTML=liveModeOn?'<span>■</span> עצור יציע חי':'<span>♾️</span> הפעל יציע חי';
    }
    if(masterInput) masterInput.value=String(percent(masterVolume));
    if(intensityInput) intensityInput.value=String(percent(liveIntensity));
    if(intensityValueEl) intensityValueEl.textContent=percent(liveIntensity)+'%';
    syncNowPlaying();
  }

  function layerMarkup(layer,icon,title,extra){
    return `<section class="score-audio-layer" data-layer="${layer}">
      <div class="score-audio-layer-head">
        <strong>${icon} ${title}</strong>
        <button type="button" class="score-audio-toggle" data-layer-toggle="${layer}" aria-pressed="false">OFF</button>
      </div>
      <label class="score-audio-layer-volume">עוצמה
        <input type="range" min="0" max="100" step="1" data-layer-volume="${layer}" aria-label="עוצמת ${title}">
      </label>
      ${extra||''}
    </section>`;
  }

  function buildPanel(){
    if(document.querySelector('.score-audio-panel')) return;
    const chantButtons=Object.keys(ARENA_ASSETS.chants)
      .map(label=>`<button type="button" data-chant="${label}">${label}</button>`).join('');
    const anthemExtra=`<div class="score-audio-current">עכשיו: <b data-current-anthem>${ARENA_ASSETS.anthems[0].label}</b>
      <button type="button" class="score-audio-cycle" data-cycle="anthems">החלף</button></div>`;
    const noiseExtra=`<div class="score-audio-current">עכשיו: <b data-current-noise>${ARENA_ASSETS.noise[0].label}</b>
      <button type="button" class="score-audio-cycle" data-cycle="noise">החלף</button></div>`;
    const chantsExtra=`<div class="score-audio-chants">${chantButtons}</div>`;

    panel=document.createElement('section');
    panel.className='score-audio-panel is-collapsed';
    panel.setAttribute('aria-label','קונסולת סאונד וקהל');
    panel.innerHTML=`
      <button type="button" class="score-audio-main" aria-expanded="false">🔊 ARENA SOUND</button>
      <div class="score-audio-body" hidden>
        <div class="score-audio-console-head">
          <div>
            <b>ARENA SOUND</b>
            <span class="score-audio-live-badge">LIVE</span>
          </div>
          <div class="score-audio-eq" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
        <div class="score-audio-now-playing"><span>עכשיו מתנגן</span><b data-now-playing>ממתין לסאונד…</b></div>
        <div class="score-audio-status" data-state="idle">בחר שכבה או הפעל יציע חי</div>
        <button type="button" class="score-audio-live" aria-pressed="false"><span>♾️</span> הפעל יציע חי</button>
        <label class="score-audio-intensity">
          <span><b>רגוע</b><strong>עוצמת האווירה <em data-live-intensity-value>56%</em></strong><b>מטורף</b></span>
          <input type="range" min="0" max="100" value="56" step="1" data-live-intensity aria-label="עוצמת האווירה">
        </label>
        ${layerMarkup('chants','🎤','קריאות קצביות',chantsExtra)}
        ${layerMarkup('anthems','🥁','פזמוני יציע',anthemExtra)}
        ${layerMarkup('noise','🏟️','רעש קהל',noiseExtra)}
        <button type="button" class="score-audio-pressure" aria-pressed="false">🔥 לחץ · 15 שניות</button>
        <label class="score-audio-master">עוצמה כללית
          <input type="range" min="0" max="100" value="90" step="1" aria-label="עוצמה כללית">
        </label>
      </div>`;
    document.body.appendChild(panel);

    const main=panel.querySelector('.score-audio-main');
    body=panel.querySelector('.score-audio-body');
    statusEl=panel.querySelector('.score-audio-status');
    pressureButton=panel.querySelector('.score-audio-pressure');
    liveButton=panel.querySelector('.score-audio-live');
    masterInput=panel.querySelector('.score-audio-master input');
    intensityInput=panel.querySelector('[data-live-intensity]');
    intensityValueEl=panel.querySelector('[data-live-intensity-value]');
    nowPlayingEl=panel.querySelector('[data-now-playing]');
    eqEl=panel.querySelector('.score-audio-eq');

    main.addEventListener('click',async()=>{
      const collapsed=panel.classList.toggle('is-collapsed');
      body.hidden=collapsed;
      main.setAttribute('aria-expanded',String(!collapsed));
      if(!collapsed) await ensureAudio({confirm:true});
    });

    panel.querySelectorAll('[data-layer-toggle]').forEach(button=>{
      button.addEventListener('click',()=>toggleLayer(button.dataset.layerToggle));
    });
    panel.querySelectorAll('[data-layer-volume]').forEach(input=>{
      input.addEventListener('input',()=>setLayerVolume(input.dataset.layerVolume,Number(input.value)/100));
    });
    panel.querySelectorAll('[data-chant]').forEach(button=>{
      button.addEventListener('click',()=>playRhythmicChant(button.dataset.chant,{automatic:false}));
    });
    panel.querySelector('[data-cycle="anthems"]').addEventListener('click',cycleAnthem);
    panel.querySelector('[data-cycle="noise"]').addEventListener('click',cycleNoise);
    liveButton.addEventListener('click',()=>liveModeOn?stopLiveMode():startLiveMode());
    pressureButton.addEventListener('click',()=>pressureOn?stopPressure():startPressure());
    intensityInput.addEventListener('input',()=>setLiveIntensity(Number(intensityInput.value)/100));
    masterInput.addEventListener('input',()=>setMasterVolume(Number(masterInput.value)/100));
    syncUI();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildPanel,{once:true});
  else buildPanel();
})();