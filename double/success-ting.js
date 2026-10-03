(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.DoubleSuccessTing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const PATTERNS={
    normal:[1760,2349],
    combo:[1760,2349,3136],
    gold:[2093,2637,3136,4186],
    win:[2093,2637,3136,4186,5274]
  };

  function patternFor(kind='normal'){
    const freqs=PATTERNS[kind]||PATTERNS.normal;
    return freqs.map((frequency,index)=>({
      frequency,
      delay:index*.045,
      duration:kind==='win'?.24:kind==='gold'?.22:.17,
      gain:kind==='win'?.12:kind==='gold'?.11:kind==='combo'?.1:.09
    }));
  }

  function play(kind='normal',ctx){
    try{
      if(!ctx||typeof ctx.createOscillator!=='function'||typeof ctx.createGain!=='function') return false;
      if(ctx.state==='suspended'&&typeof ctx.resume==='function') ctx.resume();
      const now=ctx.currentTime||0;
      patternFor(kind).forEach((note,index)=>{
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type=index===0?'sine':'triangle';
        osc.frequency.setValueAtTime(note.frequency,now+note.delay);
        gain.gain.setValueAtTime(.0001,now+note.delay);
        gain.gain.exponentialRampToValueAtTime(note.gain,now+note.delay+.008);
        gain.gain.exponentialRampToValueAtTime(.0001,now+note.delay+note.duration);
        osc.connect(gain);gain.connect(ctx.destination);
        osc.start(now+note.delay);osc.stop(now+note.delay+note.duration+.02);
      });
      return true;
    }catch(_){return false}
  }

  return {patternFor,play};
});

(function(){
  if(typeof document==='undefined'||!document.getElementById('core')) return;
  function load(src,attr,ready,next){
    if(ready&&ready()){next?.();return;}
    const existing=document.querySelector(`script[${attr}]`);
    if(existing){existing.addEventListener('load',()=>next?.(),{once:true});return;}
    const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');s.onload=()=>next?.();document.body.appendChild(s);
  }
  load('double/music-engine-state.js?v=1','data-double-music-state',()=>!!window.DoubleMusicState,()=>
    load('double/music-engine.js?v=2','data-double-music-engine',()=>!!window.DoubleMusic,()=>
      load('double/music-game-bridge.js?v=1','data-double-music-bridge',()=>false)));
})();
