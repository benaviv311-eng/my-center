(()=>{
  'use strict';
  const State=window.DoubleMusicState;
  if(!State||window.DoubleMusic) return;

  const MUSIC_KEY='double-music-enabled-v1';
  let enabled=readEnabled(),unlocked=false,scene='lobby',streak=0;
  let loopAudio=null,loopUrl='',stingerUrl='';

  function readEnabled(){try{return localStorage.getItem(MUSIC_KEY)!=='0'}catch(_){return true}}
  function saveEnabled(v){try{localStorage.setItem(MUSIC_KEY,v?'1':'0')}catch(_){}}

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
  function buildLoopBlob(){
    const sr=11025,duration=8,len=Math.floor(sr*duration),out=new Uint8Array(len);
    const bpm=120,beatDur=60/bpm,eighth=beatDur/2;
    const chords=[
      [220,261.63,329.63],
      [174.61,220,261.63],
      [261.63,329.63,392],
      [196,246.94,293.66]
    ];
    for(let i=0;i<len;i++){
      const t=i/sr,bar=Math.floor(t/2)%4,ch=chords[bar];
      const beatPos=(t%beatDur)/beatDur,beatIndex=Math.floor(t/beatDur)%4;
      const eighthPos=(t%eighth)/eighth,eighthIndex=Math.floor(t/eighth);
      const pad=(Math.sin(2*Math.PI*ch[0]*t)+Math.sin(2*Math.PI*ch[1]*t)+Math.sin(2*Math.PI*ch[2]*t))*.035;
      const bassEnv=Math.exp(-4.8*beatPos);
      const bass=(Math.sin(2*Math.PI*(ch[0]/2)*t)+.35*Math.sin(2*Math.PI*ch[0]*t))*.16*bassEnv;
      const arpFreq=ch[eighthIndex%3]*2;
      const arpEnv=Math.pow(1-eighthPos,1.8);
      const arp=Math.sin(2*Math.PI*arpFreq*t)*.115*arpEnv;
      const kickEnv=Math.exp(-11*beatPos);
      const kick=Math.sin(2*Math.PI*(54+58*(1-beatPos))*t)*.32*kickEnv;
      const snare=((beatIndex===1||beatIndex===3)?noise(i)*.12*Math.exp(-13*beatPos):0);
      const hat=noise(i+991)*.035*Math.exp(-25*eighthPos);
      let s=pad+bass+arp+kick+snare+hat;
      s=Math.max(-1,Math.min(1,s));
      out[i]=Math.round(128+s*112);
    }
    return wavBlob(out,sr);
  }
  function buildStingerBlob(){
    const sr=11025,duration=1.05,len=Math.floor(sr*duration),out=new Uint8Array(len);
    const notes=[523.25,659.25,783.99,1046.5];
    for(let i=0;i<len;i++){
      const t=i/sr;
      let s=0;
      for(let n=0;n<notes.length;n++){
        const start=n*.12;
        if(t<start)continue;
        const dt=t-start,env=Math.exp(-4.6*dt);
        s+=Math.sin(2*Math.PI*notes[n]*dt)*.24*env;
      }
      s+=Math.sin(2*Math.PI*130.81*t)*.10*Math.exp(-2.8*t);
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
      loopAudio.loop=true;
      loopAudio.preload='auto';
      loopAudio.playsInline=true;
      applyScene();
      return loopAudio;
    }catch(_){return null}
  }
  function applyScene(){
    if(!loopAudio)return;
    if(scene==='lobby'){loopAudio.playbackRate=.96;loopAudio.volume=.58}
    else if(scene==='play'){loopAudio.playbackRate=1.05;loopAudio.volume=.72}
    else if(scene==='tension'){loopAudio.playbackRate=1.18;loopAudio.volume=.82}
    else{loopAudio.volume=.70}
  }
  function playLoop(){
    const a=ensureAudio();
    if(!a||!enabled||!unlocked||scene==='victory')return false;
    applyScene();
    const p=a.play();
    if(p&&typeof p.catch==='function')p.catch(()=>{});
    return true;
  }
  function unlock(){
    unlocked=true;
    ensureAudio();
    return enabled?playLoop():!!loopAudio;
  }
  function setScene(next,opts={}){
    scene=next||'lobby';
    if(Number.isFinite(Number(opts.streak)))streak=Number(opts.streak);
    ensureAudio();
    applyScene();
    if(scene==='victory'){
      if(loopAudio)loopAudio.pause();
    }else if(enabled&&unlocked){
      playLoop();
    }
  }
  function setStreak(value){streak=Math.max(0,Number(value)||0)}
  function updateState(s){
    if(Number.isFinite(Number(s?.streak)))streak=Number(s.streak);
    setScene(State.sceneFor(s),{streak});
  }
  function setEnabled(value){
    enabled=!!value;saveEnabled(enabled);ensureAudio();
    if(enabled){unlocked=true;playLoop()}else if(loopAudio){loopAudio.pause()}
  }
  function isEnabled(){return enabled}
  function preview(){
    unlocked=true;
    const a=ensureAudio();
    if(!a||!enabled)return false;
    try{a.currentTime=0}catch(_){}
    const oldVolume=a.volume;
    a.volume=.88;
    const p=a.play();
    if(p&&typeof p.catch==='function')p.catch(()=>{});
    setTimeout(()=>{if(loopAudio){applyScene();if(!enabled)loopAudio.pause()}},900);
    return true;
  }
  function stinger(kind='victory'){
    if(!enabled||!unlocked)return false;
    try{
      ensureAudio();
      if(loopAudio)loopAudio.pause();
      const a=new Audio(stingerUrl);
      a.volume=.92;a.playsInline=true;
      const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});
      a.onended=()=>{if(scene!=='victory'&&enabled&&unlocked)playLoop()};
      return true;
    }catch(_){return false}
  }
  function stop(){if(loopAudio)loopAudio.pause()}
  function currentScene(){return scene}
  function status(){return {enabled,unlocked,scene,paused:loopAudio?loopAudio.paused:true,readyState:loopAudio?loopAudio.readyState:0}}

  window.DoubleMusic={unlock,setScene,setStreak,updateState,setEnabled,isEnabled,preview,stinger,stop,currentScene,status};
})();
