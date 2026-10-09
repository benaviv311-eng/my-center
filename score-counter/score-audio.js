(function(){
  const PRESSURE_DURATION_MS=15000;
  const PRESSURE_CHANT_GAP_MS=2600;
  const CHANTS=['רשת!','הוא לא יודע!','בוזזזזזז!','תחזרו הביתה!'];

  let ctx=null;
  let masterGain=null;
  let musicGain=null;
  let crowdGain=null;
  let pressureGain=null;
  let crowdSource=null;
  let musicTimer=0;
  let pressureTimer=0;
  let pressureChantTimer=0;
  let pressurePulseTimer=0;
  let lastChant=-1;
  let musicOn=false;
  let crowdOn=false;
  let pressureOn=false;
  let volume=0.72;

  const AudioCtx=window.AudioContext||window.webkitAudioContext;

  function safeParam(param,value,time){
    if(!param) return;
    try{
      param.cancelScheduledValues(time);
      param.setTargetAtTime(value,time,0.035);
    }catch(_){
      try{ param.value=value; }catch(__){}
    }
  }

  function noiseBuffer(seconds){
    const frames=Math.max(1,Math.floor(ctx.sampleRate*seconds));
    const buffer=ctx.createBuffer(2,frames,ctx.sampleRate);
    for(let channel=0;channel<buffer.numberOfChannels;channel++){
      const data=buffer.getChannelData(channel);
      let smooth=0;
      for(let i=0;i<frames;i++){
        smooth=smooth*0.82+(Math.random()*2-1)*0.18;
        data[i]=smooth*0.72+(Math.random()*2-1)*0.12;
      }
    }
    return buffer;
  }

  function createCrowd(){
    if(!ctx || crowdSource) return;
    const source=ctx.createBufferSource();
    source.buffer=noiseBuffer(3.2);
    source.loop=true;

    const high=ctx.createBiquadFilter();
    high.type='highpass';
    high.frequency.value=120;
    const low=ctx.createBiquadFilter();
    low.type='lowpass';
    low.frequency.value=2100;
    const body=ctx.createBiquadFilter();
    body.type='peaking';
    body.frequency.value=520;
    body.Q.value=0.8;
    body.gain.value=7;

    source.connect(high);
    high.connect(low);
    low.connect(body);
    body.connect(crowdGain);
    body.connect(pressureGain);
    source.start();
    crowdSource=source;
  }

  function ensureAudio(){
    if(!AudioCtx) return false;
    if(!ctx){
      ctx=new AudioCtx();
      masterGain=ctx.createGain();
      musicGain=ctx.createGain();
      crowdGain=ctx.createGain();
      pressureGain=ctx.createGain();
      masterGain.gain.value=volume;
      musicGain.gain.value=0;
      crowdGain.gain.value=0;
      pressureGain.gain.value=0;
      musicGain.connect(masterGain);
      crowdGain.connect(masterGain);
      pressureGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      createCrowd();
    }
    if(ctx.state==='suspended') ctx.resume().catch(()=>{});
    return true;
  }

  function shortNoise(duration,frequency,gainValue,destination){
    if(!ctx) return;
    const source=ctx.createBufferSource();
    const filter=ctx.createBiquadFilter();
    const gain=ctx.createGain();
    source.buffer=noiseBuffer(Math.max(0.03,duration));
    filter.type='bandpass';
    filter.frequency.value=frequency;
    filter.Q.value=0.7;
    gain.gain.setValueAtTime(gainValue,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination||musicGain);
    source.start();
    source.stop(ctx.currentTime+duration+0.02);
  }

  function kick(){
    if(!ctx) return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(120,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(46,ctx.currentTime+0.15);
    gain.gain.setValueAtTime(0.22,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.18);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start();
    osc.stop(ctx.currentTime+0.2);
  }

  function tone(frequency,duration,level){
    if(!ctx) return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type='square';
    osc.frequency.value=frequency;
    gain.gain.setValueAtTime(level,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+duration);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start();
    osc.stop(ctx.currentTime+duration+0.02);
  }

  function musicStep(step){
    if(!musicOn || !ctx) return;
    if(step%4===0 || step%4===2) kick();
    if(step%4===1 || step%4===3) shortNoise(0.07,1700,0.08,musicGain);
    const notes=[196,196,246.94,220,196,293.66,246.94,220];
    tone(notes[step%notes.length],0.11,step%2===0?0.035:0.024);
  }

  function createMusic(){
    if(!ensureAudio()) return;
    if(musicTimer) return;
    let step=0;
    musicStep(step++);
    musicTimer=setInterval(()=>musicStep(step++),360);
  }

  function stopMusic(){
    if(musicTimer){
      clearInterval(musicTimer);
      musicTimer=0;
    }
  }

  function setMusic(enabled){
    musicOn=!!enabled;
    if(!ensureAudio()) return;
    safeParam(musicGain.gain,musicOn?0.55:0,ctx.currentTime);
    if(musicOn) createMusic(); else stopMusic();
    syncUI();
  }

  function setCrowd(enabled){
    crowdOn=!!enabled;
    if(!ensureAudio()) return;
    safeParam(crowdGain.gain,crowdOn?0.34:0,ctx.currentTime);
    syncUI();
  }

  function whistle(){
    if(!ctx) return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(2250,ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(3100,ctx.currentTime+0.14);
    osc.frequency.linearRampToValueAtTime(2450,ctx.currentTime+0.38);
    gain.gain.setValueAtTime(0.001,ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08,ctx.currentTime+0.025);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.42);
    osc.connect(gain);
    gain.connect(pressureGain);
    osc.start();
    osc.stop(ctx.currentTime+0.44);
  }

  function pressureBurst(){
    if(!pressureOn || !ctx) return;
    shortNoise(0.22,700,0.18,pressureGain);
    if(Math.random()>0.35) whistle();
  }

  function hebrewVoice(){
    if(!('speechSynthesis' in window)) return null;
    const voices=window.speechSynthesis.getVoices();
    return voices.find(v=>/^he(-|_)/i.test(v.lang))||voices.find(v=>/hebrew|עבר/i.test(v.name))||null;
  }

  function speakChant(text){
    if(!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance==='undefined') return;
    try{
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang='he-IL';
      utterance.rate=1.04;
      utterance.pitch=0.78;
      utterance.volume=Math.min(1,Math.max(0.25,volume+0.18));
      const voice=hebrewVoice();
      if(voice) utterance.voice=voice;
      window.speechSynthesis.speak(utterance);
    }catch(_){ }
  }

  function nextChant(){
    if(CHANTS.length<2) return 0;
    let index=Math.floor(Math.random()*CHANTS.length);
    if(index===lastChant) index=(index+1)%CHANTS.length;
    lastChant=index;
    return index;
  }

  function automaticChant(){
    if(!pressureOn) return;
    speakChant(CHANTS[nextChant()]);
  }

  function stopPressure(){
    pressureOn=false;
    clearTimeout(pressureTimer);
    clearInterval(pressureChantTimer);
    clearInterval(pressurePulseTimer);
    pressureTimer=0;
    pressureChantTimer=0;
    pressurePulseTimer=0;
    if(ctx) safeParam(pressureGain.gain,0,ctx.currentTime);
    syncUI();
  }

  function startPressure(){
    if(!ensureAudio()) return;
    stopPressure();
    pressureOn=true;
    safeParam(pressureGain.gain,0.66,ctx.currentTime);
    pressureBurst();
    setTimeout(automaticChant,260);
    pressureChantTimer=setInterval(automaticChant,PRESSURE_CHANT_GAP_MS);
    pressurePulseTimer=setInterval(pressureBurst,1100);
    pressureTimer=setTimeout(stopPressure,PRESSURE_DURATION_MS);
    syncUI();
  }

  function setVolume(value){
    volume=Math.max(0,Math.min(1,Number(value)||0));
    if(ensureAudio()) safeParam(masterGain.gain,volume,ctx.currentTime);
    syncUI();
  }

  let panel=null;
  let body=null;
  let musicButton=null;
  let crowdButton=null;
  let pressureButton=null;
  let volumeInput=null;

  function syncUI(){
    if(!panel) return;
    if(musicButton){
      musicButton.classList.toggle('is-on',musicOn);
      musicButton.setAttribute('aria-pressed',String(musicOn));
      musicButton.textContent=musicOn?'🎵 מוזיקה: פועל':'🎵 מוזיקה';
    }
    if(crowdButton){
      crowdButton.classList.toggle('is-on',crowdOn);
      crowdButton.setAttribute('aria-pressed',String(crowdOn));
      crowdButton.textContent=crowdOn?'🏟️ קהל: פועל':'🏟️ קהל';
    }
    if(pressureButton){
      pressureButton.classList.toggle('is-on',pressureOn);
      pressureButton.setAttribute('aria-pressed',String(pressureOn));
      pressureButton.textContent=pressureOn?'🔥 לחץ פעיל':'🔥 לחץ · 15 שנ׳';
    }
    if(volumeInput) volumeInput.value=String(Math.round(volume*100));
  }

  function buildPanel(){
    if(document.querySelector('.score-audio-panel')) return;
    panel=document.createElement('section');
    panel.className='score-audio-panel is-collapsed';
    panel.setAttribute('aria-label','בקרת סאונד וקהל');
    panel.innerHTML=`
      <button type="button" class="score-audio-main" aria-expanded="false">🔊 סאונד</button>
      <div class="score-audio-body" hidden>
        <div class="score-audio-row score-audio-modes">
          <button type="button" class="score-audio-mode" data-audio-mode="music" aria-pressed="false">🎵 מוזיקה</button>
          <button type="button" class="score-audio-mode" data-audio-mode="crowd" aria-pressed="false">🏟️ קהל</button>
        </div>
        <button type="button" class="score-audio-pressure" aria-pressed="false">🔥 לחץ · 15 שנ׳</button>
        <div class="score-audio-label">קריאות קהל</div>
        <div class="score-audio-chants">
          ${CHANTS.map((chant,index)=>`<button type="button" data-chant="${index}">${chant}</button>`).join('')}
        </div>
        <label class="score-audio-volume">עוצמה
          <input type="range" min="0" max="100" value="72" step="1" aria-label="עוצמת סאונד">
        </label>
      </div>`;

    document.body.appendChild(panel);
    const main=panel.querySelector('.score-audio-main');
    body=panel.querySelector('.score-audio-body');
    musicButton=panel.querySelector('[data-audio-mode="music"]');
    crowdButton=panel.querySelector('[data-audio-mode="crowd"]');
    pressureButton=panel.querySelector('.score-audio-pressure');
    volumeInput=panel.querySelector('.score-audio-volume input');

    main.addEventListener('click',()=>{
      ensureAudio();
      const collapsed=panel.classList.toggle('is-collapsed');
      body.hidden=collapsed;
      main.setAttribute('aria-expanded',String(!collapsed));
    });
    musicButton.addEventListener('click',()=>setMusic(!musicOn));
    crowdButton.addEventListener('click',()=>setCrowd(!crowdOn));
    pressureButton.addEventListener('click',()=>pressureOn?stopPressure():startPressure());
    volumeInput.addEventListener('input',()=>setVolume(Number(volumeInput.value)/100));
    panel.querySelectorAll('[data-chant]').forEach(button=>{
      button.addEventListener('click',()=>{
        ensureAudio();
        const index=Number(button.dataset.chant);
        speakChant(CHANTS[index]||CHANTS[0]);
        pressureBurst();
      });
    });
    syncUI();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildPanel,{once:true});
  else buildPanel();

  window.ScoreArenaAudio={
    chants:CHANTS.slice(),
    createMusic,
    createCrowd,
    setMusic,
    setCrowd,
    startPressure,
    stopPressure,
    speakChant,
    setVolume
  };
})();
