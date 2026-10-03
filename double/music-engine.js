(()=>{
  'use strict';
  const State=window.DoubleMusicState;
  if(!State||window.DoubleMusic) return;

  const MUSIC_KEY='double-music-enabled-v1';
  let ctx=null,master=null,scene='lobby',streak=0,step=0,timer=null,enabled=readEnabled(),unlocked=false;

  function readEnabled(){try{return localStorage.getItem(MUSIC_KEY)!=='0'}catch(_){return true}}
  function saveEnabled(v){try{localStorage.setItem(MUSIC_KEY,v?'1':'0')}catch(_){} }
  function audioContext(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C) return null;
      if(!ctx){
        ctx=new C();
        master=ctx.createGain();
        master.gain.value=.35;
        master.connect(ctx.destination);
      }
      if(ctx.state==='suspended') ctx.resume();
      return ctx;
    }catch(_){return null}
  }
  function unlock(){
    unlocked=true;
    const c=audioContext();
    if(c&&enabled) restart();
    return !!c;
  }
  function tone(freq,dur=.1,gain=.03,type='sine',when=0,slideTo=null){
    const c=audioContext();if(!c||!master||!enabled||!unlocked)return;
    const t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g).connect(master);o.start(t);o.stop(t+dur+.025);
  }
  function kick(){tone(92,.13,.055,'sine',0,43)}
  function snare(){tone(185,.055,.018,'square');tone(860,.035,.008,'square',.012)}
  function hat(accent=false){tone(accent?3300:2500,.028,accent?.008:.005,'square')}
  function tick(){tone(1850,.032,.014,'sine')}
  function bass(freq){tone(freq,.16,.026,'sawtooth')}
  function lead(freq){tone(freq,.11,.014,'triangle')}

  const bassLobby=[110,110,130.81,98];
  const bassPlay=[110,146.83,164.81,130.81];
  const leadPlay=[440,493.88,659.25,587.33,493.88,440,392,493.88];
  function playStep(){
    if(!enabled||!unlocked||scene==='victory')return;
    const layers=State.layersFor(scene,streak);
    const s=step%16;
    if(layers.beat){
      if(s===0||s===8) kick();
      if(scene!=='lobby'&&(s===4||s===12)) snare();
      if(scene==='lobby'&&(s===6||s===14)) hat();
      if(scene!=='lobby'&&s%2===0) hat(s===6||s===14);
    }
    if(layers.bass&&s%4===0){
      const seq=scene==='lobby'?bassLobby:bassPlay;
      bass(seq[Math.floor(s/4)%seq.length]);
    }
    if(layers.lead&&(s===2||s===6||s===10||s===14)) lead(leadPlay[(Math.floor(step/4))%leadPlay.length]);
    if(layers.tick&&s%2===0) tick();
    step++;
  }
  function restart(){
    clearInterval(timer);timer=null;
    if(!enabled||!unlocked||scene==='victory')return;
    const bpm=State.tempoFor(scene),stepMs=(60000/bpm)/4;
    playStep();
    timer=setInterval(playStep,stepMs);
  }
  function setScene(next,opts={}){
    const changed=scene!==next;
    scene=next||'lobby';
    if(Number.isFinite(Number(opts.streak))) streak=Number(opts.streak);
    if(changed){step=0;restart()}
  }
  function setStreak(value){
    const n=Math.max(0,Number(value)||0),crossed=(streak<3&&n>=3)||(streak>=3&&n<3);
    streak=n;if(crossed) restart();
  }
  function updateState(s){
    if(Number.isFinite(Number(s?.streak))) streak=Number(s.streak);
    setScene(State.sceneFor(s),{streak});
  }
  function setEnabled(value){
    enabled=!!value;saveEnabled(enabled);
    if(enabled&&unlocked){audioContext();restart()}else{clearInterval(timer);timer=null}
  }
  function isEnabled(){return enabled}
  function preview(){
    unlock();
    if(!enabled)return false;
    tone(523.25,.16,.12,'triangle');
    tone(659.25,.16,.11,'triangle',.055);
    tone(783.99,.2,.10,'triangle',.11);
    return true;
  }
  function stinger(kind='victory'){
    if(!enabled||!unlocked)return;
    const patterns={
      victory:[523.25,659.25,783.99,1046.5],
      gold:[659.25,783.99,987.77,1318.51],
      level:[440,554.37,659.25],
      combo:[587.33,739.99,880]
    };
    const p=patterns[kind]||patterns.victory;
    p.forEach((f,i)=>tone(f,.19,.032,'triangle',i*.075));
    tone(p[0]/2,.32,.026,'sawtooth',0);
  }
  function stop(){clearInterval(timer);timer=null}
  function currentScene(){return scene}

  window.DoubleMusic={unlock,setScene,setStreak,updateState,setEnabled,isEnabled,preview,stinger,stop,currentScene};
})();
