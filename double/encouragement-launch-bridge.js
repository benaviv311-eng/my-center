(()=>{
  'use strict';
  const frame=document.getElementById('gameFrame');
  if(!frame||window.__doubleEncouragementLaunchBridge)return;
  window.__doubleEncouragementLaunchBridge=true;
  const V='11';

  function inject(core){
    let doc;
    try{doc=core?.contentDocument}catch(_){return}
    if(!doc?.body)return;
    if(doc.querySelector('script[data-double-encouragement-bridge]'))return;
    const existingEngine=doc.querySelector('script[data-double-encouragement-engine]');
    const addBridge=()=>{
      if(doc.querySelector('script[data-double-encouragement-bridge]'))return;
      const bridge=doc.createElement('script');bridge.src='double/encouragement-bridge.js?v='+V;bridge.setAttribute('data-double-encouragement-bridge','1');doc.body.appendChild(bridge);
    };
    if(existingEngine){
      if(doc.defaultView?.DoubleEncouragementEngine)addBridge();else existingEngine.addEventListener('load',addBridge,{once:true});
      return;
    }
    const engine=doc.createElement('script');engine.src='double/encouragement-engine.js?v='+V;engine.setAttribute('data-double-encouragement-engine','1');engine.onload=addBridge;doc.body.appendChild(engine);
  }
  function watchWrapper(){
    let doc;
    try{doc=frame.contentDocument}catch(_){return}
    const core=doc?.getElementById('core');
    if(!core)return;
    core.addEventListener('load',()=>inject(core));
    try{if(core.contentDocument?.body)inject(core)}catch(_){ }
  }
  frame.addEventListener('load',watchWrapper);
  try{if(frame.contentDocument?.body)watchWrapper()}catch(_){ }
})();
