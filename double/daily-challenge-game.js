(()=>{
  'use strict';
  const D=window.DoubleDailyChallenge;
  if(!D)return;
  const Stats=window.DoubleStatsStore;
  const day=D.dateKey(new Date(),'Asia/Jerusalem');
  const sequence=D.dailySequence(day,15);
  const spots=[[50,15,-5],[24,29,-14],[74,30,15],[48,43,-5],[18,56,12],[80,57,-18],[34,75,5],[66,78,-8]];
  const $=id=>document.getElementById(id);
  let round=0,penaltyCount=0,startedAt=0,roundStartedAt=0,timerId=null,running=false,combo=0,record=D.load();
  let ctx=null;

  function fmtMs(ms){return ms?`${(ms/1000).toFixed(2)}`:'—'}
  function elapsedMs(){return running?Math.max(0,performance.now()-startedAt)+(penaltyCount*2000):0}
  function summary(){return D.summary(record,day)}
  function updateHud(){
    const s=summary();
    $('progress').textContent=`${round}/15`;
    $('penalties').textContent=String(penaltyCount);
    $('streak').textContent=String(s.streak||0);
    $('best').textContent=s.bestMs?`${fmtMs(s.bestMs)}s`:'—';
    if(running)$('timer').textContent=(elapsedMs()/1000).toFixed(2);
  }
  function dateLabel(){
    try{return new Intl.DateTimeFormat('he-IL',{timeZone:'Asia/Jerusalem',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())}
    catch(_){return day}
  }
  function audioContext(){
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!ctx)ctx=new C();if(ctx.state==='suspended')ctx.resume();return ctx}catch(_){return null}
  }
  function tone(kind){
    try{
      const c=audioContext();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
      o.type=kind==='bad'?'square':'triangle';o.frequency.setValueAtTime(kind==='bad'?180:860,t);if(kind!=='bad')o.frequency.exponentialRampToValueAtTime(1280,t+.1);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='bad'?.035:.065,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g).connect(c.destination);o.start(t);o.stop(t+.16);
    }catch(_){ }
  }
  function parentMusic(){try{return window.parent?.DoubleMusic||null}catch(_){return null}}
  function currentPack(){try{return window.parent?.DoubleIconPacks||null}catch(_){return null}}
  function showMessage(text){const m=$('message');m.textContent=text;m.classList.add('show');clearTimeout(m._t);m._t=setTimeout(()=>m.classList.remove('show'),700)}
  function statsCorrect(){if(!Stats)return;const reaction=Math.max(1,Math.round(performance.now()-roundStartedAt));Stats.recordEvent({type:'correct',mode:'daily',reactionMs:reaction,combo,at:Date.now()})}
  function statsWrong(){if(Stats)Stats.recordEvent({type:'wrong',mode:'daily',at:Date.now()})}
  function renderSymbol(card,id,index){
    const p=spots[index],bt=document.createElement('button');bt.type='button';bt.className='symbol';bt.style.setProperty('--x',p[0]+'%');bt.style.setProperty('--y',p[1]+'%');bt.style.setProperty('--r',p[2]+'deg');bt.dataset.symbolId=String(id);bt.setAttribute('aria-label','סמל '+D.ICONS[id]);bt.textContent=D.ICONS[id];
    const pack=currentPack();
    try{if(pack?.getSelected?.()==='gabby-cats')pack.applyPreview?.(bt,D.ICONS[id])}catch(_){ }
    bt.addEventListener('click',()=>choose(bt,id));card.appendChild(bt);
  }
  function renderRound(){
    const cards=$('cards');cards.innerHTML='';const data=sequence[round];if(!data)return finish();
    [['left',data.left],['right',data.right]].forEach(([side,ids])=>{const card=document.createElement('div');card.className='card '+side;ids.forEach((id,i)=>renderSymbol(card,id,i));cards.appendChild(card)});
    roundStartedAt=performance.now();updateHud();
  }
  function choose(el,id){
    if(!running)return;const data=sequence[round];if(!data)return;
    if(id===data.common){
      combo++;el.classList.add('good');tone('good');statsCorrect();round++;updateHud();
      if(round>=15){setTimeout(finish,180);return}
      setTimeout(renderRound,170);
    }else{
      combo=0;penaltyCount++;el.classList.remove('bad');void el.offsetWidth;el.classList.add('bad');tone('bad');statsWrong();showMessage('טעות · +2 שניות');updateHud();setTimeout(()=>el.classList.remove('bad'),300);
    }
  }
  function start(){
    round=0;penaltyCount=0;combo=0;running=false;$('finish').classList.remove('open');$('finish').setAttribute('aria-hidden','true');$('cards').innerHTML='';updateHud();
    let n=3;showMessage(String(n));const countdown=setInterval(()=>{n--;if(n>0){showMessage(String(n));return}clearInterval(countdown);showMessage('צא!');startedAt=performance.now();running=true;roundStartedAt=startedAt;renderRound();clearInterval(timerId);timerId=setInterval(updateHud,50);parentMusic()?.unlock?.();parentMusic()?.setScene?.('play')},650);
  }
  function finish(){
    if(!running)return;const finalMs=Math.round(elapsedMs());running=false;clearInterval(timerId);const previous=Number(record.bestByDate?.[day])||null;record=D.save(D.updateRecord(record,day,finalMs));const s=summary(),isBest=!previous||finalMs<previous;
    $('timer').textContent=(finalMs/1000).toFixed(2);$('finalTime').textContent=(finalMs/1000).toFixed(2)+' שנ׳';$('finalText').textContent=isBest?'🏆 שיא יומי חדש!':`השיא שלך היום: ${(s.bestMs/1000).toFixed(2)} שנ׳`;$('finishStreak').textContent=String(s.streak);$('finishDays').textContent=String(s.totalDays);$('finishPenalty').textContent=String(penaltyCount);$('finish').classList.add('open');$('finish').setAttribute('aria-hidden','false');parentMusic()?.stinger?.('victory');
  }
  function back(){parentMusic()?.setScene?.('lobby');try{const btn=window.parent?.document?.getElementById('gameClose');if(btn){btn.click();return}}catch(_){ }history.back()}
  $('dateLabel').textContent=dateLabel();$('backBtn').addEventListener('click',back);$('homeBtn').addEventListener('click',back);$('againBtn').addEventListener('click',start);document.addEventListener('pointerdown',()=>{audioContext();parentMusic()?.unlock?.()},{capture:true,passive:true});updateHud();start();
})();
