(()=>{
 const fit=()=>{
  const projection=document.body.classList.contains('projection-mode')||document.body.classList.contains('presentation-mode');
  if(!projection)return;
  const cards=[...document.querySelectorAll('.team-card,.group-card,[class*="team-card"],[class*="group-card"]')];
  cards.forEach(card=>{
   const score=card.querySelector('.score,[class*="score"]');
   if(score){
    const w=Math.max(60,card.clientWidth-12), h=Math.max(42,card.clientHeight*.42);
    const digits=(score.textContent||'0').trim().length;
    const px=Math.max(28,Math.min(h,w/(Math.max(1,digits)*.62)));
    score.style.setProperty('font-size',px+'px','important');
   }
   card.querySelectorAll('button').forEach(b=>{
    const px=Math.max(10,Math.min(22,card.clientWidth/11));
    b.style.setProperty('font-size',px+'px','important');
   });
  });
 };
 const obs=new MutationObserver(()=>requestAnimationFrame(fit));
 const start=()=>{
  obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  addEventListener('resize',fit,{passive:true});
  addEventListener('orientationchange',fit,{passive:true});
  document.addEventListener('click',()=>setTimeout(fit,40),true);
  fit();setTimeout(fit,250);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();