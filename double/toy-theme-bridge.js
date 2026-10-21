(()=>{
  'use strict';
  if(window.__doubleToyThemeBridge)return;
  window.__doubleToyThemeBridge=true;
  const V='34';
  const head=document.head||document.documentElement;
  if(!document.querySelector('link[data-double-toy-theme]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='double/premium-theme.css?v='+V;link.dataset.doubleToyTheme='1';head.appendChild(link);
  }
  if(document.getElementById('core')){
    document.body.classList.add('toy-wrapper');
    document.getElementById('endOverlay')?.classList.add('toy-end-overlay');
  }else{
    document.body.classList.add('double-toy-game');
  }
})();
