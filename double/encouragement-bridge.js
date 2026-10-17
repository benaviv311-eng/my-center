(()=>{
  'use strict';
  const E=window.DoubleEncouragementEngine;
  if(!E||window.__doubleAdaptiveEncouragement)return;
  window.__doubleAdaptiveEncouragement=true;

  const BEST_KEY='double-reaction-best-v1';
  const DIFF_KEY='double-difficulty-v1';
  const ANNOUNCER_KEY='double-announcer-pack-v1';
  const FX_KEY='double-effects-enabled-v1';
  const VERSUS_KEYS_KEY='double-versus-keys-v1';
  const LANG={british:'en-GB',american:'en-US',arcade:'en-US',russian:'ru-RU',italian:'it-IT',japanese:'ja-JP'};
  const SYMBOL_SELECTOR='.sym,.symbol';
  const PRIORITY_KINDS=new Set(['level','boss','bossWin','win','finish','record']);
  let roundStart=now(),lastFingerprint='',audioCtx=null,adaptiveSpeaking=false,legacySpeechMuteUntil=0,lastFeedbackKey='';

  function now(){return typeof performance!=='undefined'&&performance.now?performance.now():Date.now()}
  function get(key,fallback=''){try{return localStorage.getItem(key)||fallback}catch(_){return fallback}}
  function set(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  function difficulty(){return E.normalizeDifficulty(get(DIFF_KEY,'normal'))}
  function announcer(){return get(ANNOUNCER_KEY,'british')}
  function fxEnabled(){return get(FX_KEY,'1')!=='0'}
  function readBests(){try{return JSON.parse(get(BEST_KEY,'{}'))||{}}catch(_){return {}}}
  function writeBest(diff,ms){const all=readBests();all[diff]=E.nextBestMs(all[diff],ms);set(BEST_KEY,JSON.stringify(all))}
  function board(){return document.getElementById('board')||document.getElementById('cards')}
  function cards(){return [...(board()?.querySelectorAll('.card')||[])]}
  function fingerprint(){
    const list=cards();if(list.length<2)return '';
    return list.map(card=>[...card.querySelectorAll(SYMBOL_SELECTOR)].map(x=>x.dataset.symbolId||'').sort((a,b)=>Number(a)-Number(b)).join(',')).join('|');
  }
  function refreshRound(){const key=fingerprint();if(!key||key===lastFingerprint)return;lastFingerprint=key;roundStart=now();lastFeedbackKey=''}
  function commonSymbol(){
    const list=cards();if(list.length<2)return null;
    const left=new Set([...list[0].querySelectorAll(SYMBOL_SELECTOR)].map(x=>x.dataset.symbolId));
    return [...list[1].querySelectorAll(SYMBOL_SELECTOR)].map(x=>x.dataset.symbolId).find(id=>left.has(id))??null;
  }
  function playerForSymbol(sym){
    const card=sym?.closest?.('.card[data-card-index]');
    return card?Number(card.dataset.cardIndex):null;
  }
  function seconds(){return Math.max(.001,(now()-roundStart)/1000)}
  function readVersusKeys(){
    const def={p1:{select:'Enter'},p2:{select:'Space'}};
    try{const raw=JSON.parse(get(VERSUS_KEYS_KEY,'{}'))||{};return {p1:{...def.p1,...raw.p1},p2:{...def.p2,...raw.p2}}}catch(_){return def}
  }
  function nativeAudioOwner(){return !!document.querySelector('script[src*="double/game.js"],script[src*="daily-challenge-game.js"]')}
  function priorityMoment(){
    const callout=document.getElementById('announcerCallout');
    return !!((callout?.textContent||'').trim()&&PRIORITY_KINDS.has(callout?.dataset?.kind||''));
  }

  function ensureStyle(){
    if(document.getElementById('double-adaptive-encouragement-style'))return;
    const style=document.createElement('style');style.id='double-adaptive-encouragement-style';
    style.textContent=`#encouragement:not(.adaptive-owned){display:none!important}#announcerCallout[data-kind="versusSuccess"],#announcerCallout[data-kind="combo"],#announcerCallout[data-kind="gold"]{display:none!important}#adaptiveEncouragement{position:fixed;left:50%;top:27%;transform:translate(-50%,-50%);z-index:40;pointer-events:none;text-align:center;min-width:min(92vw,560px);font-weight:1000;opacity:0}#adaptiveEncouragement.show{animation:adaptivePop .86s cubic-bezier(.18,.9,.2,1)}#adaptiveEncouragement .adaptive-main{display:block;font-size:clamp(34px,10vw,88px);line-height:.95;background:linear-gradient(90deg,#fff7a8,#fff,#ffd95c,#fff);background-size:240% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 5px 12px #0007)}#adaptiveEncouragement .adaptive-meta{display:block;margin-top:8px;font-size:clamp(14px,2.6vw,21px);color:#fff;filter:drop-shadow(0 2px 7px #0009)}#adaptiveEncouragement.level-5 .adaptive-main{font-size:clamp(44px,13vw,108px)}#adaptiveEncouragement.new-best .adaptive-meta{color:#fff1a8}@keyframes adaptivePop{0%{opacity:0;transform:translate(-50%,-50%) scale(.35)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}74%{opacity:1;transform:translate(-50%,-58%) scale(1)}100%{opacity:0;transform:translate(-50%,-72%) scale(.9)}}.adaptive-reaction-spark{position:fixed;z-index:39;pointer-events:none;left:50%;top:28%;font-size:20px;animation:adaptiveSpark .72s ease-out forwards}@keyframes adaptiveSpark{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}16%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--rx)),calc(-50% + var(--ry))) scale(1.35) rotate(190deg)}}@media(prefers-reduced-motion:reduce){#adaptiveEncouragement.show{animation-duration:.01ms!important}.adaptive-reaction-spark{display:none!important}}`;
    document.head.appendChild(style);
  }
  function ensureFeedbackEl(){
    let el=document.getElementById('adaptiveEncouragement');
    if(!el){el=document.createElement('div');el.id='adaptiveEncouragement';el.setAttribute('aria-live','polite');document.body.appendChild(el)}
    return el;
  }
  function audioContext(){
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(_){return null}
  }
  function playImpact(level,isNewBest){
    if(!fxEnabled()||nativeAudioOwner())return;const ctx=audioContext();if(!ctx)return;
    const notes=[660,880,1046,1320,1760].slice(0,Math.max(1,level));const start=ctx.currentTime;
    notes.forEach((freq,i)=>{try{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i%2?'triangle':'sine';o.frequency.setValueAtTime(freq*(isNewBest?1.08:1),start+i*.035);const gain=.018+(level*.008)+(isNewBest?.012:0);g.gain.setValueAtTime(.0001,start+i*.035);g.gain.exponentialRampToValueAtTime(gain,start+i*.035+.008);g.gain.exponentialRampToValueAtTime(.0001,start+i*.035+.13);o.connect(g).connect(ctx.destination);o.start(start+i*.035);o.stop(start+i*.035+.15)}catch(_){}});
  }
  function burst(level,isNewBest){
    if(nativeAudioOwner()||(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;
    const count=Math.min(24,3+level*3+(isNewBest?5:0));
    for(let i=0;i<count;i++){
      const s=document.createElement('span');s.className='adaptive-reaction-spark';s.textContent=isNewBest&&i%3===0?'🏆':i%2?'✦':'★';
      s.style.setProperty('--rx',((Math.random()-.5)*(150+level*38))+'px');s.style.setProperty('--ry',(-35-Math.random()*(80+level*24))+'px');document.body.appendChild(s);setTimeout(()=>s.remove(),760);
    }
  }
  function patchLegacySpeech(){
    try{
      const synth=window.speechSynthesis;if(!synth||synth.__doubleAdaptivePatched)return;
      const original=synth.speak.bind(synth);synth.__doubleAdaptiveOriginalSpeak=original;
      synth.speak=function(utterance){if(!adaptiveSpeaking&&now()<legacySpeechMuteUntil&&!priorityMoment())return;return original(utterance)};
      synth.__doubleAdaptivePatched=true;
    }catch(_){ }
  }
  function suppressWrapperTing(){
    try{
      const p=window.parent;if(!p||p===window||!p.DoubleSuccessTing?.play||p.__doubleSuccessTingOriginal)return;
      p.__doubleSuccessTingOriginal=p.DoubleSuccessTing.play;p.DoubleSuccessTing.play=()=>{};
    }catch(_){ }
  }
  function speak(result){
    if(priorityMoment()||!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return;
    const pack=announcer(),text=E.phraseFor(pack,result.level),lang=LANG[pack]||'en-GB',profile=E.voiceProfile(result.level,pack);
    try{
      const synth=window.speechSynthesis;synth.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.volume=profile.volume;u.rate=profile.rate;u.pitch=profile.pitch;
      const voices=synth.getVoices();u.voice=voices.find(v=>v.lang?.toLowerCase()===lang.toLowerCase())||voices.find(v=>v.lang?.toLowerCase().startsWith(lang.slice(0,2).toLowerCase()))||null;
      adaptiveSpeaking=true;synth.speak(u);setTimeout(()=>{adaptiveSpeaking=false},80);
    }catch(_){adaptiveSpeaking=false}
  }
  function feedback({seconds:reactionSeconds,player=null}={}){
    const diff=difficulty(),bests=readBests(),result=E.evaluate({seconds:reactionSeconds,difficulty:diff,previousBestMs:bests[diff],player});
    const key=result.timeMs+'|'+String(player)+'|'+lastFingerprint;if(key===lastFeedbackKey)return result;lastFeedbackKey=key;
    writeBest(diff,result.timeMs);const phrase=E.phraseFor(announcer(),result.level),el=ensureFeedbackEl();
    el.className=`level-${result.level}${result.isNewBest?' new-best':''}`;
    el.innerHTML=`<span class="adaptive-main">${phrase}</span><span class="adaptive-meta">${result.meta}</span>`;
    void el.offsetWidth;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>{el.classList.remove('show');el.textContent=''},880);
    playImpact(result.level,result.isNewBest);burst(result.level,result.isNewBest);speak(result);return result;
  }
  function queueFeedback(reactionSeconds,player){legacySpeechMuteUntil=now()+350;setTimeout(()=>feedback({seconds:reactionSeconds,player}),0)}
  function onClick(event){
    const sym=event.target?.closest?.(SYMBOL_SELECTOR),root=board();if(!sym||!root?.contains(sym))return;
    const common=commonSymbol();if(common==null||String(sym.dataset.symbolId)!==String(common))return;
    queueFeedback(seconds(),document.body?.dataset?.mode==='versus'?playerForSymbol(sym):null);
  }
  function onKeydown(event){
    if(document.body?.dataset?.mode!=='versus'||event.repeat)return;
    const keys=readVersusKeys();let player=null;if(event.code===keys.p1.select)player=0;else if(event.code===keys.p2.select)player=1;else return;
    const selected=board()?.querySelector(player===0?'.cursor-p1':'.cursor-p2'),common=commonSymbol();
    if(!selected||common==null||String(selected.dataset.symbolId)!==String(common))return;
    queueFeedback(seconds(),player);
  }

  ensureStyle();patchLegacySpeech();suppressWrapperTing();refreshRound();ensureFeedbackEl();
  const root=board();if(root)new MutationObserver(refreshRound).observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-symbol-id']});
  document.addEventListener('click',onClick,true);document.addEventListener('keydown',onKeydown,true);
  window.DoubleAdaptiveEncouragement={feedback,refreshRound};
})();
