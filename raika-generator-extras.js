function rgeRestoreLast(){
  const s=window.RaikaGeneratorState?.last;
  if(!s)return false;
  const mode=document.getElementById('rg-mode');
  if(!mode)return false;
  mode.value=s.mode;
  mode.dispatchEvent(new Event('change'));
  if(s.mode==='emotion'){
    const c=document.getElementById('rg-character'),f=document.getElementById('rg-feeling');
    if(c)c.value=s.c||'';
    if(f)f.value=s.feeling||'';
  }else{
    const a=document.getElementById('rg-a'),b=document.getElementById('rg-b'),n=document.getElementById('rg-note');
    if(a&&s.a)a.value=s.a;
    if(b&&s.b)b.value=s.b;
    if(n)n.value=s.note||'';
  }
  const count=document.getElementById('rg-count');
  if(count&&s.count)count.value=String(s.count);
  return true;
}
document.addEventListener('click',e=>{
  const retry=e.target.closest('[data-rg="retry"]');
  if(retry){
    e.preventDefault();
    e.stopImmediatePropagation();
    if(rgeRestoreLast())document.getElementById('rg-generate')?.click();
    return;
  }
  const edit=e.target.closest('[data-rg="edit"]');
  if(edit){
    e.preventDefault();
    document.getElementById('rg-text')?.focus();
  }
},true);
function rgeWatchResult(){
  const host=document.getElementById('rg-result');
  if(!host)return;
  const decorate=()=>{
    const actions=host.querySelector('.rg-result-card .card-actions');
    if(actions&&!actions.querySelector('[data-rg="edit"]'))actions.querySelector('[data-rg="save"]')?.insertAdjacentHTML('afterend','<button class="btn small" data-rg="edit">✏️ ערוך</button>');
  };
  new MutationObserver(decorate).observe(host,{childList:true,subtree:true});
  decorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rgeWatchResult);else rgeWatchResult();
