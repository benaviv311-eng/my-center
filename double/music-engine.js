(()=>{
  'use strict';
  const State=window.DoubleMusicState;
  const Model=window.DoubleToyMusicModel;
  if(!State||window.DoubleMusic) return;

  const MUSIC_KEY='double-music-enabled-v1';
  let enabled=readEnabled(),unlocked=false,scene='lobby',streak=0;
  let loopAudio=null,loopUrl='',stingerUrl='';

  function readEnabled(){try{return localStorage.getItem(MUSIC_KEY)!=='0'}catch(_){return true}}
  function saveEnabled(v){try{localStorage.setItem(MUSIC_KEY,v?'1':'0')}catch(_){}}
  function profile(){return Model?.sceneProfile?Model.sceneProfile(scene):scene==='lobby'?{rate:.96,volume:.42,layers:1}:scene==='tension'?{rate:1.08,volume:.64,layers:3}:{rate:1.02,volume:.55,layers:2}}

  function writeAscii(view,offset,text){for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))}
  function wavBlob(samples,sampleRate=11025){
    const dataLen=samples.length;
    const buf=new ArrayBuffer(44+dataLen);
    const v=new DataView(buf);
    writeAscii(v,0,'RIFF');v.setUint32(4,36+dataLen,true);writeAscii(v,8,'WAVE');
    writeAscii(v,12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
    v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);
    writeAscii(v,36,'data');v.setUint32(40,dataLen,true);
    for(let i=0;i<dataLen;i++)v.setUint8(44+i,samples[i]);
    return new Blob([buf],{type:'audio/wav'});
  }
  function noise(i){
    const x=Math.sin(i*12.9898+78.233)*43758.5453;
    return (x-Math.floor(x))*2-1;
  }
  function tone(freq,t,phase=0){return Math.sin(2*Math.PI*freq*t+phase)}
  function pluck(freq,local,amount=.18){
    const env=Math.exp(-8.5*local);
    return (tone(freq,local)*.72+tone(freq*2.01,local)*.2+tone(freq*3.9,local)*.08)*amount*env;
  }
  function buildLoopBlob(){
    const sr=11025,bpm=Model?.BPM||108,beat=60/bpm,duration=16*beat,len=Math.floor(sr*duration),out=new Uint8Array(len);
    const chords=[
      [261.63,329.63,392.00],
      [220.00,261.63,329.63],
      [174.61,220.00,261.63],
      [196.00,246.94,293.66]
    ];
    const melody=[659.25,783.99,880.00,783.99,659.25,523.25,587.33,659.25,783.99,659.25,587.33,523.25,659.25,783.99,1046.50,783.99];
    const step=beat/2;
    for(let i=0;i<len;i++){
      const t=i/sr,beatIndex=Math.floor(t/beat),bar=Math.floor(beatIndex/4)%4,ch=chords[bar];
      const beatPos=(t%beat)/beat,stepPos=(t%step)/step,stepIndex=Math.floor(t/step)%melody.length;
      const localStep=t%step,localBeat=t%beat;

      const softPad=(tone(ch[0],t)+tone(ch[1],t)+tone(ch[2],t))*.018;
      const bassEnv=Math.exp(-3.8*localBeat);
      const bass=(tone(ch[0]/2,t)*.82+tone(ch[0],t)*.18)*.11*bassEnv;
      const marimba=pluck(melody[stepIndex],localStep,.19);

      const clapBeat=beatIndex%4===1||beatIndex%4===3;
      const clap=clapBeat?noise(i+77)*.048*Math.exp(-18*localBeat):0;
      const kick=tone(62+24*(1-beatPos),t)*.105*Math.exp(-10*beatPos);
      const shaker=noise(i+913)*.018*Math.exp(-25*stepPos);

      const sparkleGate=stepIndex%4===2;
      const sparkle=sparkleGate?(tone(melody[stepIndex]*2,localStep)+.35*tone(melody[stepIndex]*3,localStep))*.035*Math.exp(-13*localStep):0;

      let s=softPad+bass+marimba+clap+kick+shaker+sparkle;
      s=Math.max(-1,Math.min(1,s));
      out[i]=Math.round(128+s*112);
    }
    return wavBlob(out,sr);
  }
  function buildStingerBlob(){
    const sr=11025,duration=1.1,len=Math.floor(sr*duration),out=new Uint8Array(len);
    const notes=[523.25,659.25,783.99,1046.50];
    for(let i=0;i<len;i++){
      const t=i/sr;let s=0;
      for(let n=0;n<notes.length;n++){
        const start=n*.11;if(t<start)continue;
        const dt=t-start,env=Math.exp(-5.4*dt);
        s+=(tone(notes[n],dt)*.18+tone(notes[n]*2.02,dt)*.05)*env;
      }
      if(t>.46){const dt=t-.46;s+=tone(1567.98,dt)*.045*Math.exp(-8*dt)}
      s=Math.max(-1,Math.min(1,s));
      out[i]=Math.round(128+s*112);
    }
    return wavBlob(out,sr);
  }
  function ensureAudio(){
    if(loopAudio)return loopAudio;
    try{
      loopUrl=URL.createObjectURL(buildLoopBlob());
      stingerUrl=URL.createObjectURL(buildStingerBlob());
      loopAudio=new Audio(loopUrl);
      loopAudio.loop=true;loopAudio.preload='auto';loopAudio.playsInline=true;
      applyScene();
      return loopAudio;
    }catch(_){return null}
  }
  function applyScene(){
    if(!loopAudio)return;
    const p=profile();
    const streakLift=Math.min(.045,Math.max(0,streak-2)*.008);
    loopAudio.playbackRate=Math.max(.9,p.rate+streakLift);
    loopAudio.volume=Math.min(.72,p.volume+(streak>=3?.03:0));
  }
  function playLoop(){
    const a=ensureAudio();
    if(!a||!enabled||!unlocked||scene==='victory')return false;
    applyScene();
    const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});
    return true;
  }
  function unlock(){unlocked=true;ensureAudio();return enabled?playLoop():!!loopAudio}
  function setScene(next,opts={}){
    scene=next||'lobby';
    if(Number.isFinite(Number(opts.streak)))streak=Number(opts.streak);
    ensureAudio();applyScene();
    if(scene==='victory'){if(loopAudio)loopAudio.pause()}
    else if(enabled&&unlocked)playLoop();
  }
  function setStreak(value){streak=Math.max(0,Number(value)||0);applyScene()}
  function updateState(s){if(Number.isFinite(Number(s?.streak)))streak=Number(s.streak);setScene(State.sceneFor(s),{streak})}
  function setEnabled(value){enabled=!!value;saveEnabled(enabled);ensureAudio();if(enabled){unlocked=true;playLoop()}else if(loopAudio)loopAudio.pause()}
  function isEnabled(){return enabled}
  function preview(){
    unlocked=true;const a=ensureAudio();if(!a||!enabled)return false;
    try{a.currentTime=0}catch(_){}
    const originalScene=scene;scene='play';applyScene();a.volume=Math.min(.62,a.volume+.04);
    const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});
    setTimeout(()=>{scene=originalScene;applyScene();if(!enabled)a.pause()},1050);
    return true;
  }
  function stinger(kind='victory'){
    if(!enabled||!unlocked)return false;
    try{
      ensureAudio();if(loopAudio)loopAudio.pause();
      const a=new Audio(stingerUrl);a.volume=.68;a.playsInline=true;
      const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});
      a.onended=()=>{if(scene!=='victory'&&enabled&&unlocked)playLoop()};
      return true;
    }catch(_){return false}
  }
  function stop(){if(loopAudio)loopAudio.pause()}
  function currentScene(){return scene}
  function status(){return {enabled,unlocked,scene,paused:loopAudio?loopAudio.paused:true,readyState:loopAudio?loopAudio.readyState:0,style:'playful-arcade-pop',bpm:Model?.BPM||108}}

  window.DoubleMusic={unlock,setScene,setStreak,updateState,setEnabled,isEnabled,preview,stinger,stop,currentScene,status};
})();
