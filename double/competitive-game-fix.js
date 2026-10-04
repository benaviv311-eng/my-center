(()=>{
  'use strict';
  const R=window.DoubleCompetitiveRules;
  if(!R)return;
  const button=document.getElementById('shuffleBtn');
  if(!button)return;
  function sync(){
    const mode=document.body.dataset.mode||'';
    const allowed=R.allowShuffle(mode);
    button.hidden=!allowed;
    button.disabled=!allowed;
    button.setAttribute('aria-hidden',allowed?'false':'true');
    button.title=allowed?'ערבב':'ערבוב מושבת במצב תחרותי';
  }
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{attributes:true,attributeFilter:['data-mode']});
  button.addEventListener('click',event=>{
    if(R.allowShuffle(document.body.dataset.mode||''))return;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
  sync();
})();