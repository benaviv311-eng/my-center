(()=>{
  'use strict';
  const frame=document.getElementById('gameFrame');
  if(!frame||window.__doubleEncouragementLaunchBridge)return;
  window.__doubleEncouragementLaunchBridge=true;
  const V='34';

  function load(doc,src,attr,ready,next){
    if(ready?.()){next?.();return}
    const existing=doc.querySelector(`script[${attr}]`);
    if(existing){
      if(existing.dataset.loaded==='1'||ready?.()){next?.();return}
      existing.addEventListener('load',()=>next?.(),{once:true});return;
    }
    const script=doc.createElement('script');script.src=src+'?v='+V;script.setAttribute(attr,'1');
    script.onload=()=>{script.dataset.loaded='1';next?.()};doc.body.appendChild(script);
  }
  function inject(core){
    let doc;try{doc=core?.contentDocument}catch(_){return}if(!doc?.body)return;
    load(doc,'double/encouragement-engine.js','data-double-encouragement-engine',()=>!!doc.defaultView?.DoubleEncouragementEngine,()=>
      load(doc,'double/reaction-time-model.js','data-double-reaction-time-model',()=>!!doc.defaultView?.DoubleReactionTimeModel,()=>
        load(doc,'double/encouragement-bridge.js','data-double-encouragement-bridge',()=>!!doc.defaultView?.DoubleAdaptiveEncouragement,()=>
          load(doc,'double/reaction-time-bridge.js','data-double-reaction-time-bridge',()=>!!doc.defaultView?.__doubleReactionTimeBridge))));
  }
  function watchWrapper(){
    let doc;try{doc=frame.contentDocument}catch(_){return}const core=doc?.getElementById('core');if(!core)return;
    core.addEventListener('load',()=>inject(core));try{if(core.contentDocument?.body)inject(core)}catch(_){ }
  }
  frame.addEventListener('load',watchWrapper);try{if(frame.contentDocument?.body)watchWrapper()}catch(_){ }
})();
