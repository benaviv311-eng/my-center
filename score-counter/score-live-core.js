(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.ScoreLiveCore=api;
})(typeof window!=='undefined'?window:null,function(){
  function clampNumber(value,min,max){
    const n=Number(value);
    if(!Number.isFinite(n)) return min;
    return Math.min(max,Math.max(min,n));
  }

  function formatClock(ms){
    const totalSeconds=Math.max(0,Math.floor((Number(ms)||0)/1000));
    const minutes=Math.floor(totalSeconds/60);
    const seconds=totalSeconds%60;
    return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
  }

  function nextRotation(current,delta){
    const value=clampNumber(current,1,6);
    const step=Number(delta)||0;
    return ((value-1+step)%6+6)%6+1;
  }

  function clockMs(minutes,seconds){
    const m=clampNumber(minutes,0,999);
    const s=clampNumber(seconds,0,59);
    return Math.round((m*60+s)*1000);
  }

  return {formatClock,nextRotation,clockMs};
});
