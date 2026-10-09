(function(){
  const HABAITA_LABEL='הביתה! הביתה! הביתה!';
  const HABAITA_SOURCES=[
    'audio/chants/tachzeru-deep.mp3',
    'audio/chants/tachzeru-young.mp3',
    'audio/chants/tachzeru-sharp.mp3'
  ];
  const HABAITA_SLICE_START=0.52;
  const HABAITA_SLICE_LENGTH=0.44;
  const HABAITA_BEAT_MS=740;
  const HABAITA_HITS=9;
  const FIRST_MIN_MS=14000;
  const FIRST_MAX_MS=24000;
  const NEXT_MIN_MS=32000;
  const NEXT_MAX_MS=58000;

  const USER_CROWD_CLIPS=[
    {label:'קדימה!',src:'audio/chants/kadima-live.mp3'},
    {label:'מי פה? אנחנו!',src:'audio/chants/mi-po-anachnu-live.mp3'}
  ];
  const USER_CROWD_FIRST_MIN_MS=7000;
  const USER_CROWD_FIRST_MAX_MS=14000;
  const USER_CROWD_NEXT_MIN_MS=18000;
  const USER_CROWD_NEXT_MAX_MS=42000;

  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  const cache=new Map();
  const activeSources=new Set();
  let ctx=null;
  let refrainGain=null;
  let crowdGain=null;
  let clapBuffer=null;
  let timer=0;
  let userCrowdTimer=0;
  let lastUserCrowd=-1;
  let liveButton=null;
  let pressureButton=null;
  let observer=null;
  let manualButton=null;
  let userCrowdButtons=[];

  function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
  function randomDelay(min,max){ return Math.round(min+Math.random()*(max-min)); }

  function readSlider(selector,fallback){
    const input=document.querySelector(selector);
    if(!input) return fallback;
    const value=Number(input.value)/100;
    return Number.isFinite(value)?clamp(value,0,1):fallback;
  }

  function currentVolume(){
    const master=readSlider('.score-audio-master input',0.9);
    const anthems=readSlider('[data-layer-volume="anthems"]',0.7);
    return clamp(master*anthems*1.18,0.18,1);
  }

  function currentChantVolume(){
    const master=readSlider('.score-audio-master input',0.9);
    const chants=readSlider('[data-layer-volume="chants"]',0.98);
    return clamp(master*chants*1.1,0,1);
  }

  function liveIsOn(){
    return !!(liveButton&&liveButton.getAttribute('aria-pressed')==='true');
  }

  function pressureIsOn(){
    return !!(pressureButton&&pressureButton.getAttribute('aria-pressed')==='true');
  }

  function anthemsAreOn(){
    const toggle=document.querySelector('[data-layer-toggle="anthems"]');
    return !toggle||toggle.getAttribute('aria-pressed')==='true';
  }

  function chantsAreOn(){
    const toggle=document.querySelector('[data-layer-toggle="chants"]');
    return !toggle||toggle.getAttribute('aria-pressed')==='true';
  }

  function canAutoPlay(){
    return liveIsOn()&&!pressureIsOn()&&anthemsAreOn();
  }

  function canAutoPlayUserCrowd(){
    return liveIsOn()&&!pressureIsOn()&&chantsAreOn();
  }

  async function ensureAudio(){
    if(!AudioCtx) return false;
    if(!ctx){
      ctx=new AudioCtx();
      refrainGain=ctx.createGain();
      refrainGain.gain.value=currentVolume();
      refrainGain.connect(ctx.destination);
      crowdGain=ctx.createGain();
      crowdGain.gain.value=currentChantVolume();
      crowdGain.connect(ctx.destination);
    }
    if(ctx.state==='suspended'){
      try{ await ctx.resume(); }catch(_){ }
    }
    return ctx.state==='running';
  }

  async function loadBuffer(src){
    if(!ctx) throw new Error('audio context unavailable');
    if(cache.has(src)) return cache.get(src);
    const promise=fetch(src,{cache:'force-cache'})
      .then(response=>{
        if(!response.ok) throw new Error('audio '+response.status+' '+src);
        return response.arrayBuffer();
      })
      .then(bytes=>ctx.decodeAudioData(bytes));
    cache.set(src,promise);
    try{ return await promise; }
    catch(error){ cache.delete(src);throw error; }
  }

  function makeClapBuffer(){
    if(clapBuffer||!ctx) return clapBuffer;
    const frames=Math.max(1,Math.floor(ctx.sampleRate*0.085));
    const buffer=ctx.createBuffer(1,frames,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<frames;i++){
      const fade=1-i/frames;
      data[i]=(Math.random()*2-1)*fade*fade;
    }
    clapBuffer=buffer;
    return clapBuffer;
  }

  function trackSource(source){
    activeSources.add(source);
    source.addEventListener('ended',()=>activeSources.delete(source),{once:true});
    return source;
  }

  function playKick(when,strength){
    if(!ctx||!refrainGain) return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const amount=clamp(Number(strength)||0.3,0.08,0.5);
    osc.type='sine';
    osc.frequency.setValueAtTime(82,when);
    osc.frequency.exponentialRampToValueAtTime(46,when+0.14);
    gain.gain.setValueAtTime(amount,when);
    gain.gain.exponentialRampToValueAtTime(0.0001,when+0.17);
    osc.connect(gain);
    gain.connect(refrainGain);
    osc.start(when);
    osc.stop(when+0.18);
  }

  function playClap(when,strength){
    if(!ctx||!refrainGain) return;
    const buffer=makeClapBuffer();
    if(!buffer) return;
    const source=ctx.createBufferSource();
    const gain=ctx.createGain();
    const filter=ctx.createBiquadFilter();
    filter.type='highpass';
    filter.frequency.value=1050;
    gain.gain.value=clamp(Number(strength)||0.12,0.04,0.24);
    source.buffer=buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(refrainGain);
    source.start(when);
  }

  function startWord(buffer,when,voiceGain,rate,pan){
    if(!ctx||!refrainGain||!buffer) return null;
    const source=trackSource(ctx.createBufferSource());
    const gain=ctx.createGain();
    source.buffer=buffer;
    source.playbackRate.value=rate;
    gain.gain.value=voiceGain;
    source.connect(gain);
    if(typeof ctx.createStereoPanner==='function'){
      const panner=ctx.createStereoPanner();
      panner.pan.value=pan;
      gain.connect(panner);
      panner.connect(refrainGain);
    }else{
      gain.connect(refrainGain);
    }
    const offset=Math.min(buffer.duration*HABAITA_SLICE_START,Math.max(0,buffer.duration-0.08));
    const duration=Math.max(0.08,Math.min(buffer.duration-offset,buffer.duration*HABAITA_SLICE_LENGTH));
    source.start(when,offset,duration);
    return source;
  }

  function showNowPlaying(durationMs){
    const el=document.querySelector('[data-now-playing]');
    if(!el) return;
    const previous=el.textContent;
    el.textContent='🏠 '+HABAITA_LABEL+'  •  🥁 יציע';
    setTimeout(()=>{
      if(el.textContent.includes(HABAITA_LABEL)) el.textContent=previous||'ממתין לסאונד…';
    },durationMs);
  }

  function showUserCrowdNowPlaying(label,durationMs){
    const el=document.querySelector('[data-now-playing]');
    if(!el) return;
    const previous=el.textContent;
    el.textContent='📣 '+label+'  •  קהל';
    setTimeout(()=>{
      if(el.textContent.includes(label)) el.textContent=previous||'ממתין לסאונד…';
    },durationMs);
  }

  async function playHabaitaRefrain(options){
    const opts=options||{};
    if(!opts.manual&&!canAutoPlay()) return false;
    if(!(await ensureAudio())) return false;
    refrainGain.gain.setTargetAtTime(currentVolume(),ctx.currentTime,0.035);
    let buffers;
    try{
      buffers=await Promise.all(HABAITA_SOURCES.map(loadBuffer));
    }catch(_){
      return false;
    }
    if(!opts.manual&&!canAutoPlay()) return false;

    const start=ctx.currentTime+0.07;
    const step=HABAITA_BEAT_MS/1000;
    for(let i=0;i<HABAITA_HITS;i++){
      const when=start+i*step;
      const primary=buffers[i%buffers.length];
      const follower=buffers[(i+1)%buffers.length];
      const rate=1+(i%3-1)*0.018;
      startWord(primary,when,0.92,rate,(i%3-1)*0.16);
      startWord(follower,when+0.055,0.34,rate*0.992,(1-i%3)*0.22);
      playKick(when-0.025,i%3===0?0.38:0.28);
      playClap(when+step*0.48,i%3===2?0.17:0.12);
    }
    const durationMs=Math.round((HABAITA_HITS*step+0.45)*1000);
    showNowPlaying(durationMs);
    return true;
  }

  async function playUserCrowdClip(index,options){
    const opts=options||{};
    if(!chantsAreOn()) return false;
    if(!opts.manual&&!canAutoPlayUserCrowd()) return false;
    if(!(await ensureAudio())) return false;
    const clip=USER_CROWD_CLIPS[index];
    if(!clip) return false;

    let buffer;
    try{
      buffer=await loadBuffer(clip.src);
    }catch(_){
      return false;
    }
    if(!opts.manual&&!canAutoPlayUserCrowd()) return false;
    if(!crowdGain) return false;

    crowdGain.gain.setTargetAtTime(currentChantVolume(),ctx.currentTime,0.03);
    const source=trackSource(ctx.createBufferSource());
    source.buffer=buffer;
    source.connect(crowdGain);
    source.start();
    showUserCrowdNowPlaying(clip.label,Math.round(buffer.duration*1000)+250);
    return true;
  }

  function pickUserCrowdIndex(){
    if(USER_CROWD_CLIPS.length<2){
      lastUserCrowd=0;
      return 0;
    }
    let index=Math.floor(Math.random()*USER_CROWD_CLIPS.length);
    if(index===lastUserCrowd) index=(index+1)%USER_CROWD_CLIPS.length;
    lastUserCrowd=index;
    return index;
  }

  function clearSchedule(){
    clearTimeout(timer);
    timer=0;
  }

  function clearUserCrowdSchedule(){
    clearTimeout(userCrowdTimer);
    userCrowdTimer=0;
  }

  function scheduleHabaitaRefrain(first){
    clearSchedule();
    if(!canAutoPlay()) return;
    const min=first?FIRST_MIN_MS:NEXT_MIN_MS;
    const max=first?FIRST_MAX_MS:NEXT_MAX_MS;
    timer=setTimeout(async()=>{
      timer=0;
      if(canAutoPlay()) await playHabaitaRefrain({manual:false});
      scheduleHabaitaRefrain(false);
    },randomDelay(min,max));
  }

  function scheduleUserCrowdClip(first){
    clearUserCrowdSchedule();
    if(!canAutoPlayUserCrowd()) return;
    const min=first?USER_CROWD_FIRST_MIN_MS:USER_CROWD_NEXT_MIN_MS;
    const max=first?USER_CROWD_FIRST_MAX_MS:USER_CROWD_NEXT_MAX_MS;
    userCrowdTimer=setTimeout(async()=>{
      userCrowdTimer=0;
      if(canAutoPlayUserCrowd()) await playUserCrowdClip(pickUserCrowdIndex(),{manual:false});
      scheduleUserCrowdClip(false);
    },randomDelay(min,max));
  }

  function syncSchedule(){
    if(canAutoPlay()){
      if(!timer) scheduleHabaitaRefrain(true);
    }else{
      clearSchedule();
    }

    if(canAutoPlayUserCrowd()){
      if(!userCrowdTimer) scheduleUserCrowdClip(true);
    }else{
      clearUserCrowdSchedule();
    }
  }

  function addManualButton(){
    if(manualButton&&manualButton.isConnected) return;
    const current=document.querySelector('[data-layer="anthems"] .score-audio-current');
    if(!current) return;
    manualButton=document.createElement('button');
    manualButton.type='button';
    manualButton.className='score-audio-cycle score-habaita-trigger';
    manualButton.textContent='🏠 הביתה ×3';
    manualButton.title=HABAITA_LABEL;
    manualButton.addEventListener('click',()=>playHabaitaRefrain({manual:true}));
    current.appendChild(manualButton);
  }

  function addUserCrowdButtons(){
    const host=document.querySelector('.score-audio-chants');
    if(!host) return;
    USER_CROWD_CLIPS.forEach((clip,index)=>{
      if(host.querySelector('[data-user-crowd="'+index+'"]')) return;
      const button=document.createElement('button');
      button.type='button';
      button.setAttribute('data-user-crowd',String(index));
      button.textContent=clip.label;
      button.title='קריאת קהל: '+clip.label;
      button.addEventListener('pointerdown',()=>ensureAudio(),{passive:true});
      button.addEventListener('click',()=>playUserCrowdClip(index,{manual:true}));
      host.appendChild(button);
      userCrowdButtons.push(button);
    });
  }

  function bindPanel(){
    liveButton=document.querySelector('.score-audio-live');
    pressureButton=document.querySelector('.score-audio-pressure');
    if(!liveButton||!pressureButton) return false;
    addManualButton();
    addUserCrowdButtons();
    liveButton.addEventListener('pointerdown',()=>ensureAudio(),{passive:true});
    manualButton&&manualButton.addEventListener('pointerdown',()=>ensureAudio(),{passive:true});
    observer=new MutationObserver(syncSchedule);
    observer.observe(liveButton,{attributes:true,attributeFilter:['aria-pressed']});
    observer.observe(pressureButton,{attributes:true,attributeFilter:['aria-pressed']});
    const anthemToggle=document.querySelector('[data-layer-toggle="anthems"]');
    if(anthemToggle) observer.observe(anthemToggle,{attributes:true,attributeFilter:['aria-pressed']});
    const chantToggle=document.querySelector('[data-layer-toggle="chants"]');
    if(chantToggle) observer.observe(chantToggle,{attributes:true,attributeFilter:['aria-pressed']});
    syncSchedule();
    return true;
  }

  function init(){
    if(bindPanel()) return;
    const wait=new MutationObserver(()=>{
      if(bindPanel()) wait.disconnect();
    });
    wait.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>wait.disconnect(),12000);
  }

  window.addEventListener('pagehide',()=>{
    clearSchedule();
    clearUserCrowdSchedule();
    if(observer) observer.disconnect();
    activeSources.forEach(source=>{ try{ source.stop(); }catch(_){} });
    activeSources.clear();
    userCrowdButtons=[];
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();