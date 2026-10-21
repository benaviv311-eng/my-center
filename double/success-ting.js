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
  const V='34';
  const frame=document.getElementById('core');

  try{
    const params=new URLSearchParams(location.search);
    if(['sprint','versus'].includes(params.get('launch')))localStorage.setItem('double-difficulty-v1','normal');
  }catch(_){ }

  function load(src,attr,ready,next){
    if(ready&&ready()){next?.();return;}
    const existing=document.querySelector(`script[${attr}]`);
    if(existing){
      if(existing.dataset.loaded==='1'){next?.();return;}
      existing.addEventListener('load',()=>next?.(),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src=src;
    s.setAttribute(attr,'1');
    s.onload=()=>{s.dataset.loaded='1';next?.()};
    document.body.appendChild(s);
  }

  load('double/toy-theme-bridge.js?v='+V,'data-double-toy-theme-bridge',()=>!!window.__doubleToyThemeBridge);

  try{
    if(window.parent&&window.parent!==window&&window.parent.DoubleMusic){
      window.DoubleMusic=window.parent.DoubleMusic;
    }
  }catch(_){ }

  const loadBridge=()=>load('double/music-game-bridge.js?v='+V,'data-double-music-bridge',()=>false);
  if(window.DoubleMusic){loadBridge()}else{
    load('double/music-engine-state.js?v='+V,'data-double-music-state',()=>!!window.DoubleMusicState,()=>
      load('double/toy-music-model.js?v='+V,'data-double-toy-music-model',()=>!!window.DoubleToyMusicModel,()=>
        load('double/music-engine.js?v='+V,'data-double-music-engine',()=>!!window.DoubleMusic,loadBridge)));
  }

  function loadPackBridge(){load('double/icon-pack-game-bridge.js?v='+V,'data-double-icon-pack-game-bridge',()=>false)}
  let reusedParentPacks=false;
  try{
    if(window.parent&&window.parent!==window&&window.parent.DoubleIconPacks){
      window.DoubleIconPacks=window.parent.DoubleIconPacks;
      reusedParentPacks=true;
      loadPackBridge();
    }
  }catch(_){ }
  if(!reusedParentPacks){
    load('double/icon-sprite-0.js?v='+V,'data-double-icon-sprite-0',()=>false,()=>
      load('double/icon-sprite-1.js?v='+V,'data-double-icon-sprite-1',()=>false,()=>
        load('double/icon-sprite-2.js?v='+V,'data-double-icon-sprite-2',()=>false,()=>
          load('double/icon-sprite-3.js?v='+V,'data-double-icon-sprite-3',()=>false,()=>
            load('double/dragonball-sprite-0.js?v='+V,'data-double-dragon-sprite-0',()=>false,()=>
              load('double/dragonball-sprite-1.js?v='+V,'data-double-dragon-sprite-1',()=>false,()=>
                load('double/icon-packs.js?v='+V,'data-double-icon-packs',()=>!!window.DoubleIconPacks,loadPackBridge)))))));
  }

  function loadStatsBridge(){load('double/stats-game-bridge.js?v='+V,'data-double-stats-game-bridge',()=>false)}
  let reusedParentStats=false;
  try{
    if(window.parent&&window.parent!==window&&window.parent.DoubleStatsStore){
      window.DoubleStatsStore=window.parent.DoubleStatsStore;
      reusedParentStats=true;
      loadStatsBridge();
    }
  }catch(_){ }
  if(!reusedParentStats){
    load('double/stats-store.js?v='+V,'data-double-stats-store',()=>!!window.DoubleStatsStore,loadStatsBridge);
  }

  function injectToyTheme(){
    let doc;
    try{doc=frame.contentDocument}catch(_){return}
    if(!doc?.body||doc.querySelector('script[data-double-toy-theme-bridge]'))return;
    const theme=doc.createElement('script');
    theme.src='double/toy-theme-bridge.js?v='+V;
    theme.setAttribute('data-double-toy-theme-bridge','1');
    doc.body.appendChild(theme);
  }
  function injectCoreFix(){
    let doc;
    try{doc=frame.contentDocument}catch(_){return}
    if(!doc?.body||doc.querySelector('script[data-double-competitive-game-fix]'))return;
    const rules=doc.createElement('script');
    rules.src='double/competitive-rules.js?v='+V;
    rules.setAttribute('data-double-competitive-rules','1');
    rules.onload=()=>{
      const fix=doc.createElement('script');
      fix.src='double/competitive-game-fix.js?v='+V;
      fix.setAttribute('data-double-competitive-game-fix','1');
      doc.body.appendChild(fix);
    };
    doc.body.appendChild(rules);
  }

  function injectAdaptiveEncouragement(){
    let doc;
    try{doc=frame.contentDocument}catch(_){return}
    if(!doc?.body||doc.querySelector('script[data-double-encouragement-engine]'))return;
    const engine=doc.createElement('script');
    engine.src='double/encouragement-engine.js?v='+V;
    engine.setAttribute('data-double-encouragement-engine','1');
    engine.onload=()=>{
      if(doc.querySelector('script[data-double-encouragement-bridge]'))return;
      const bridge=doc.createElement('script');
      bridge.src='double/encouragement-bridge.js?v='+V;
      bridge.setAttribute('data-double-encouragement-bridge','1');
      doc.body.appendChild(bridge);
    };
    doc.body.appendChild(engine);
  }

  function injectReactionTime(){
    let doc;
    try{doc=frame.contentDocument}catch(_){return}
    if(!doc?.body||doc.querySelector('script[data-double-reaction-time-model]'))return;
    const model=doc.createElement('script');
    model.src='double/reaction-time-model.js?v='+V;
    model.setAttribute('data-double-reaction-time-model','1');
    model.onload=()=>{
      if(doc.querySelector('script[data-double-reaction-time-bridge]'))return;
      const bridge=doc.createElement('script');
      bridge.src='double/reaction-time-bridge.js?v='+V;
      bridge.setAttribute('data-double-reaction-time-bridge','1');
      doc.body.appendChild(bridge);
    };
    doc.body.appendChild(model);
  }

  function injectCoreEnhancements(){injectToyTheme();injectCoreFix();injectAdaptiveEncouragement();injectReactionTime()}
  frame.addEventListener('load',injectCoreEnhancements);
  try{if(frame.contentDocument?.body)injectCoreEnhancements()}catch(_){ }
})();
