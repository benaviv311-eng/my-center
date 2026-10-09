(function(){
  const PRESSURE_DURATION_MS=15000;
  const PRESSURE_CHANT_GAP_MS=2400;

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
    chants:{enabled:true,volume:0.94},
    anthems:{enabled:false,volume:0.70},
    noise:{enabled:false,volume:0.58}
  };

  let masterVolume=0.90;
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
  let unlockedOnce=false;
  let panel=null;
  let body=null;
  let statusEl=null;
  let pressureButton=null;
  let masterInput=null;

  const bufferCache=new Map();
  const lastVariantByChant=new Map();
  const activeChantSources=new Set();
  const AudioCtx=window.AudioContext||window.webkitAudioContext;

  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }

  function setStatus(text,state){
    if(!statusEl) return;
    statusEl.textContent=text;
    statusEl.dataset.state=state||'idle';
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
    setStatus(pressureOn?'🔥 מצב לחץ פעיל':'סאונד מוכן — שלוט בכל שכבה בנפרד','on');
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
      ARENA_ASSETS.noise[0].src,
      ARENA_ASSETS.anthems[0].src,
      ...Object.values(ARENA_ASSETS.chants).map(list=>list[0])
    ];
    warm.forEach(src=>loadBuffer(src).catch(()=>{}));
  }

  function stopBuffer(refName){
    const ref=refName==='anthem'?anthemSource:noiseSource;
    if(!ref) return;
    if(refName==='anthem') anthemSource=null; else noiseSource=null;
    try{ ref.source.onended=null; }catch(_){ }
    try{ ref.source.stop(); }catch(_){ }
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
      source.onended=()=>{
        if(!anthemSource || anthemSource.source!==source) return;
        anthemSource=null;
        if(!layerState.anthems.enabled || !ctx || ctx.state!=='running') return;
        const allowed=pressureOn?[2,3]:null;
        const next=randomIndex(ARENA_ASSETS.anthems.length,safeIndex,allowed);
        startAnthem(next,{force:pressureOn});
      };
      source.start(0,Math.max(0,Number(opts.offset)||0)%Math.max(0.01,buffer.duration));
      syncUI();
      return true;
    }catch(error){
      if(token===anthemPlayToken) setStatus('לא הצלחתי לטעון את ההמנון','error');
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
      source.buffer=buffer;
      source.loop=true;
      source.connect(noiseGain);
      noiseSource={source,index:safeIndex};
      source.start(0,Math.max(0,Number(opts.offset)||0)%Math.max(0.01,buffer.duration));
      syncUI();
      return true;
    }catch(error){
      if(token===noisePlayToken) setStatus('לא הצלחתי לטעון את רעש הקהל','error');
      return false;
    }
  }

  function stopAllChants(){
    activeChantSources.forEach(source=>{
      try{ source.onended=null;source.stop(); }catch(_){ }
    });
    activeChantSources.clear();
    applyMix();
  }

  function applyMix(){
    if(!ctx||!masterGain) return;
    const pressureBoost=pressureOn?1.0:0;
    safeGain(masterGain.gain,masterVolume);
    safeGain(chantGain.gain,layerState.chants.enabled?clamp(layerState.chants.volume*(pressureBoost?1.04:1),0,1):0);
    const duck=activeChantSources.size?0.34:1;
    safeGain(anthemGain.gain,layerState.anthems.enabled?clamp(layerState.anthems.volume*(pressureBoost?1.13:1)*duck,0,1):0);
    safeGain(noiseGain.gain,layerState.noise.enabled?clamp(layerState.noise.volume*(pressureBoost?1.22:1),0,1):0);
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
      if(enabled) await startAnthem(currentAnthemIndex); else { ++anthemPlayToken;stopBuffer('anthem'); }
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
      if(opts.force){
        layerState.chants.enabled=true;
      }else{
        await toggleLayer('chants',true);
      }
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
      source.onended=()=>{
        activeChantSources.delete(source);
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

  async function cycleAnthem(){
    if(!layerState.anthems.enabled) await toggleLayer('anthems',true);
    if(!layerState.anthems.enabled) return;
    const next=randomIndex(ARENA_ASSETS.anthems.length,currentAnthemIndex,pressureOn?[2,3]:null);
    await startAnthem(next,{force:pressureOn});
  }

  async function cycleNoise(){
    if(!layerState.noise.enabled) await toggleLayer('noise',true);
    if(!layerState.noise.enabled) return;
    const next=randomIndex(ARENA_ASSETS.noise.length,currentNoiseIndex,pressureOn?[1,2]:[0,1]);
    await startNoise(next,{force:pressureOn});
  }

  async function pressureMix(enabled){
    if(enabled){
      if(!pressureSnapshot){
        pressureSnapshot={
          chants:layerState.chants.enabled,
          anthems:layerState.anthems.enabled,
          noise:layerState.noise.enabled,
          anthemIndex:currentAnthemIndex,
          noiseIndex:currentNoiseIndex
        };
      }
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
    if(!snapshot){ applyMix();syncUI();return; }
    layerState.chants.enabled=snapshot.chants;
    layerState.anthems.enabled=snapshot.anthems;
    layerState.noise.enabled=snapshot.noise;
    if(!snapshot.chants) stopAllChants();
    if(snapshot.anthems){
      await startAnthem(snapshot.anthemIndex,{force:true});
    }else{
      ++anthemPlayToken;
      stopBuffer('anthem');
    }
    if(snapshot.noise){
      await startNoise(snapshot.noiseIndex,{force:true});
    }else{
      ++noisePlayToken;
      stopBuffer('noise');
    }
    applyMix();
    syncUI();
  }

  function nextPressureChant(){
    const labels=Object.keys(ARENA_ASSETS.chants);
    const index=randomIndex(labels.length,lastPressureChant);
    lastPressureChant=index;
    return labels[index];
  }

  async function stopPressure(){
    if(!pressureOn&&!pressureSnapshot) return;
    pressureOn=false;
    clearTimeout(pressureTimer);
    clearInterval(pressureChantTimer);
    pressureTimer=0;
    pressureChantTimer=0;
    await pressureMix(false);
    setStatus('מצב לחץ הסתיים — חזרנו למיקס הקודם','on');
    syncUI();
  }

  async function startPressure(){
    if(!(await ensureAudio({confirm:true}))) return false;
    if(pressureOn) await stopPressure();
    pressureOn=true;
    await pressureMix(true);
    setStatus('🔥 לחץ פעיל — כל שלוש השכבות עובדות','on');
    setTimeout(()=>{ if(pressureOn) playChant(nextPressureChant(),{automatic:true,force:true}); },320);
    pressureChantTimer=setInterval(()=>{
      if(pressureOn) playChant(nextPressureChant(),{automatic:true,force:true});
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

  function percent(value){ return Math.round(value*100); }

  function syncUI(){
    if(!panel) return;
    Object.keys(layerState).forEach(layer=>{
      const toggle=panel.querySelector('[data-layer-toggle="'+layer+'"]');
      const input=panel.querySelector('[data-layer-volume="'+layer+'"]');
      const state=layerState[layer];
      if(toggle){
        toggle.classList.toggle('is-on',state.enabled);
        toggle.setAttribute('aria-pressed',String(state.enabled));
        toggle.textContent=state.enabled?'פועל':'כבוי';
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
    if(masterInput) masterInput.value=String(percent(masterVolume));
  }

  function layerMarkup(layer,icon,title,extra){
    return `<section class="score-audio-layer" data-layer="${layer}">
      <div class="score-audio-layer-head">
        <strong>${icon} ${title}</strong>
        <button type="button" class="score-audio-toggle" data-layer-toggle="${layer}" aria-pressed="false">כבוי</button>
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
    panel.setAttribute('aria-label','בקרת סאונד וקהל');
    panel.innerHTML=`
      <button type="button" class="score-audio-main" aria-expanded="false">🔊 סאונד</button>
      <div class="score-audio-body" hidden>
        <div class="score-audio-status" data-state="idle">פתח שכבה או הפעל לחץ</div>
        <button type="button" class="score-audio-pressure" aria-pressed="false">🔥 לחץ · 15 שניות</button>
        ${layerMarkup('noise','🏟️','רעש',noiseExtra)}
        ${layerMarkup('anthems','🥁','המנונים',anthemExtra)}
        ${layerMarkup('chants','📣','קריאות',chantsExtra)}
        <label class="score-audio-master">עוצמה כללית
          <input type="range" min="0" max="100" value="90" step="1" aria-label="עוצמה כללית">
        </label>
      </div>`;
    document.body.appendChild(panel);

    const main=panel.querySelector('.score-audio-main');
    body=panel.querySelector('.score-audio-body');
    statusEl=panel.querySelector('.score-audio-status');
    pressureButton=panel.querySelector('.score-audio-pressure');
    masterInput=panel.querySelector('.score-audio-master input');

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
      button.addEventListener('click',()=>playChant(button.dataset.chant));
    });
    panel.querySelector('[data-cycle="anthems"]').addEventListener('click',cycleAnthem);
    panel.querySelector('[data-cycle="noise"]').addEventListener('click',cycleNoise);
    pressureButton.addEventListener('click',()=>pressureOn?stopPressure():startPressure());
    masterInput.addEventListener('input',()=>setMasterVolume(Number(masterInput.value)/100));
    syncUI();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildPanel,{once:true});
  else buildPanel();
})();
