(()=>{
  'use strict';
  const E=window.DoubleEncouragementEngine;
  if(!E||window.__doubleAdaptiveEncouragement)return;
  window.__doubleAdaptiveEncouragement=true;

  const BEST_KEY='double-reaction-best-v1';
  const DIFF_KEY='double-difficulty-v1';
  const ANNOUNCER_KEY='double-announcer-pack-v1';
  const FX_KEY='double-effects-enabled-v1';
  const LANG={british:'en-GB',american:'en-US',arcade:'en-US',russian:'ru-RU',italian:'it-IT',japanese:'ja-JP'};
  let roundStart=now(),previousRoundStart=roundStart,lastFingerprint='',pendingSeconds=null,pendingAt=0,audioCtx=null;

  function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
  function get(key,fallback=''){try{return localStorage.getItem(key)||fallback}catch(_){return fallback}}
  function set(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  function difficulty(){return E.normalizeDifficulty(get(DIFF_KEY,'normal'))}
  function announcer(){return get(ANNOUNCER_KEY,'british')}
  function fxEnabled(){return get(FX_KEY,'1')!=='0'}
  function readBests(){try{return JSON.parse(get(BEST_KEY,'{}'))||{}}catch(_){return {}}}
  function writeBest(diff,ms){const all=readBests();all[diff]=E.nextBestMs(all[diff],ms);set(BEST_KEY,JSON.stringify(all))}
  function fingerprint(){
    const cards=[...document.querySelectorAll('#board .card')];
    if(cards.length<2)return '';
    return cards.map(card=>[...card.querySelectorAll('.sym')].map(x=>x.dataset.symbolId||'').sort((a,b)=>Number(a)-Number(b)).join(',')).join('|');
  }
  function refreshRound(){
    const key=fingerprint();if(!key||key===lastFingerprint)return;
    lastFingerprint=key;previousRoundStart=roundStart;roundStart=now();
  }
  function commonSymbol(){
    const cards=[...document.querySelectorAll('#board .card')];if(cards.length<2)return null;
    const left=new Set([...cards[0].querySelectorAll('.sym')].map(x=>x.dataset.symbolId));
    return [...cards[1].querySelectorAll('.sym')].map(x=>x.dataset.symbolId).find(id=>left.has(id))??null;
  }
  function onClick(event){
    const sym=event.target?.closest?.('.sym');if(!sym||!document.getElementById('board')?.contains(sym))return;
    const common=commonSymbol();if(common==null||String(sym.dataset.symbolId)!==String(common))return;
    pendingSeconds=Math.max(.001,(now()-roundStart)/1000);pendingAt=now();
  }
  function secondsForFeedback(){
    if(pendingSeconds!=null&&now()-pendingAt<900){const s=pendingSeconds;pendingSeconds=null;return s;}
    const current=(now()-roundStart)/1000,previous=(now()-previousRoundStart)/1000;
    if(current>.08&&current<20)return current;
    if(previous>.08&&previous<20)return previous;
    return Math.max(.001,current);
  }
  function ensureStyle(){
    if(document.getElementById('double-adaptive-encouragement-style'))return;
    const style=document.createElement('style');style.id='double-adaptive-encouragement-style';
    style.textContent=`.encouragement.adaptive-feedback{white-space:normal;min-width:min(92vw,520px)}.encouragement.adaptive-feedback .adaptive-main{display:block!important}.encouragement.adaptive-feedback .adaptive-meta{display:block!important;margin-top:7px;font-size:clamp(14px,2.5vw,21px)!important;letter-spacing:.01em!important;background:none!important;background-clip:border-box!important;-webkit-background-clip:border-box!important;color:#fff!important;-webkit-text-fill-color:#fff!important;-webkit-text-stroke:0!important;filter:drop-shadow(0 2px 8px #000b)!important;animation:none!important}.encouragement.adaptive-feedback.level-5 .adaptive-meta{color:#fff1a8!important;-webkit-text-fill-color:#fff1a8!important}.encouragement.adaptive-new-best{filter:drop-shadow(0 0 18px #ffd84d)}.adaptive-reaction-spark{position:fixed;z-index:31;pointer-events:none;left:50%;top:28%;font-size:20px;animation:adaptiveReactionSpark .72s ease-out forwards}@keyframes adaptiveReactionSpark{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}16%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--rx)),calc(-50% + var(--ry))) scale(1.35) rotate(190deg)}}@media(prefers-reduced-motion:reduce){.adaptive-reaction-spark{display:none!important}}`;
    document.head.appendChild(style);
  }
  function audioContext(){
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(_){return null}
  }
  function playImpact(level,isNewBest){
    if(!fxEnabled())return;const ctx=audioContext();if(!ctx)return;
    const notes=[660,880,1046,1320,1760].slice(0,Math.max(1,level));const start=ctx.currentTime;
    notes.forEach((freq,i)=>{try{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i%2?'triangle':'sine';o.frequency.setValueAtTime(freq*(isNewBest?1.08:1),start+i*.035);const gain=.018+(level*.008)+(isNewBest?.012:0);g.gain.setValueAtTime(.0001,start+i*.035);g.gain.exponentialRampToValueAtTime(gain,start+i*.035+.008);g.gain.exponentialRampToValueAtTime(.0001,start+i*.035+.13);o.connect(g).connect(ctx.destination);o.start(start+i*.035);o.stop(start+i*.035+.15)}catch(_){}});
  }
  function burst(level,isNewBest){
    if(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const count=3+level*3+(isNewBest?5:0);
    for(let i=0;i<count;i++){
      const s=document.createElement('span');s.className='adaptive-reaction-spark';s.textContent=isNewBest&&i%3===0?'🏆':i%2?'✦':'★';
      s.style.setProperty('--rx',((Math.random()-.5)*(150+level*38))+'px');s.style.setProperty('--ry',(-35-Math.random()*(80+level*24))+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),760);
    }
  }
  function speak(result){
    if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;
    const pack=announcer(),text=E.phraseFor(pack,result.level),lang=LANG[pack]||'en-GB';
    try{
      speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.volume=1;u.rate=.96+result.level*.035;u.pitch=pack==='arcade'?1.22:1+result.level*.035;
      const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang?.toLowerCase()===lang.toLowerCase())||voices.find(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()))||null;
      setTimeout(()=>speechSynthesis.speak(u),12);
    }catch(_){ }
  }
  function enhance(el){
    if(!el||el.querySelector('.adaptive-meta'))return;
    const seconds=secondsForFeedback(),diff=difficulty(),bests=readBests(),result=E.evaluate({seconds,difficulty:diff,previousBestMs:bests[diff]});
    writeBest(diff,result.timeMs);const phrase=E.phraseFor(announcer(),result.level);
    el.className=`encouragement level-${result.level} adaptive-feedback${result.isNewBest?' adaptive-new-best':''}`;
    el.innerHTML=`<span class="adaptive-main">${phrase}</span><span class="adaptive-meta">${result.meta}</span>`;
    playImpact(result.level,result.isNewBest);burst(result.level,result.isNewBest);speak(result);
  }
  function scan(){const el=document.getElementById('encouragement');if(el&&!el.querySelector('.adaptive-meta'))enhance(el)}

  ensureStyle();refreshRound();
  const board=document.getElementById('board');if(board)new MutationObserver(refreshRound).observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['data-symbol-id']});
  new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('click',onClick,true);
})();
