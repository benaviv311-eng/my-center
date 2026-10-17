(()=>{
  'use strict';
  const R=window.DoubleClassicModeRules;
  if(!R)return;

  const ICONS=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];
  const SPOTS=[[50,15,-5],[24,29,-14],[74,30,15],[48,43,-5],[18,56,12],[80,57,-18],[34,75,5],[66,78,-8]];
  const BEST_KEY='double-classic-speed-best-v1';
  const DIFF_KEY='double-difficulty-v1';
  const PROFILE_KEY='double-profile-v1';
  const $=id=>document.getElementById(id);

  let deck=buildDeck(),pair=[],matches=0,combo=0,startedAt=0,timerId=null,running=false;
  const difficulty=R.normalizeDifficulty(safeGet(DIFF_KEY)||'normal');
  const difficultyMeta={easy:['🌱','קל'],normal:['⚡','בינוני'],hard:['🔥','קשה']}[difficulty];

  function safeGet(key){try{return localStorage.getItem(key)}catch(_){return null}}
  function safeSet(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  function readBest(){
    try{const parsed=JSON.parse(safeGet(BEST_KEY)||'{}');return parsed&&typeof parsed==='object'?parsed:{}}
    catch(_){return {}}
  }
  function currentBest(){const value=Number(readBest()[difficulty]);return Number.isFinite(value)&&value>0?value:null}
  function saveBest(seconds){
    const all=readBest(),previous=Number(all[difficulty]),best=R.nextBestSeconds(previous,seconds);
    const isBest=!Number.isFinite(previous)||previous<=0||seconds<previous;
    if(isBest){all[difficulty]=best;safeSet(BEST_KEY,JSON.stringify(all))}
    return {isBest,previous:Number.isFinite(previous)&&previous>0?previous:null,best};
  }
  function readProfile(){
    try{const raw=JSON.parse(safeGet(PROFILE_KEY)||'{}');return {...raw,coins:Math.max(0,Number(raw.coins)||0),totalSuccess:Math.max(0,Number(raw.totalSuccess)||0)}}
    catch(_){return {coins:0,totalSuccess:0}}
  }
  function awardCoin(){
    const p=readProfile();
    p.coins=Math.max(0,Number(p.coins)||0)+1+(combo>0&&combo%5===0?2:0);
    p.totalSuccess=Math.max(0,Number(p.totalSuccess)||0)+1;
    safeSet(PROFILE_KEY,JSON.stringify(p));
    return p.coins;
  }
  function buildDeck(){
    const lines=[];
    for(let m=0;m<7;m++)for(let b=0;b<7;b++){
      const a=[];for(let x=0;x<7;x++)a.push(x*7+((m*x+b)%7));a.push(49+m);lines.push(a);
    }
    for(let b=0;b<7;b++){const a=[];for(let y=0;y<7;y++)a.push(b*7+y);a.push(56);lines.push(a)}
    lines.push([49,50,51,52,53,54,55,56]);
    return lines;
  }
  function shuffle(list){
    const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
  }
  function elapsedSeconds(){return running?Math.max(0,(performance.now()-startedAt)/1000):0}
  function commonSymbol(){return pair[0]?.find(x=>pair[1]?.includes(x))}
  function flash(text,bad=false){
    const el=$('toast');el.textContent=text;el.classList.toggle('bad',bad);clearTimeout(el._t);el._t=setTimeout(()=>{el.textContent='';el.classList.remove('bad')},850);
  }
  function encouragement(text='✓'){
    let el=$('encouragement');
    if(!el){el=document.createElement('div');el.id='encouragement';el.className='encouragement level-1';el.setAttribute('aria-live','polite');document.body.appendChild(el)}
    el.className='encouragement level-1';el.textContent=text;el.style.animation='none';void el.offsetWidth;el.style.animation='';
    clearTimeout(el._t);el._t=setTimeout(()=>{if(!el.querySelector('.adaptive-meta'))el.textContent=''},850);
  }
  function updateHud(){
    const best=currentBest(),profile=readProfile(),elapsed=elapsedSeconds();
    $('stats').innerHTML=`<div class="pill target-pill">🎯 ${matches}/${R.TARGET}</div><div class="pill elapsed-pill">⏲️ ${elapsed.toFixed(2)}</div><div class="pill best-pill">👑 ${best?R.formatSeconds(best):'—'}</div><div class="pill">🪙 ${profile.coins||0}</div>${combo>1?`<div class="pill combo-pill">🔥 ${combo}</div>`:''}`;
    $('challengeText').textContent=`20 התאמות · אין הגבלת זמן · המטרה: הזמן המהיר ביותר${best?' · שיא '+R.formatSeconds(best):''}`;
  }
  function symbolSize(){
    if(difficulty==='easy')return 45+Math.random()*14;
    if(difficulty==='hard')return 31+Math.random()*15;
    return 37+Math.random()*16;
  }
  function renderCard(ids,cardIndex){
    const card=document.createElement('div');card.className='card';card.dataset.cardIndex=String(cardIndex);
    shuffle(ids).forEach((id,i)=>{
      const p=SPOTS[i],button=document.createElement('button');button.type='button';button.className='sym';button.dataset.symbolId=String(id);button.dataset.cardIndex=String(cardIndex);button.style.left=p[0]+'%';button.style.top=p[1]+'%';button.style.fontSize=symbolSize()+'px';button.setAttribute('aria-label','סמל '+ICONS[id]);
      const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent=ICONS[id];glyph.style.transform=`rotate(${p[2]+Math.floor(Math.random()*28-14)}deg)`;
      if(difficulty==='hard'){glyph.classList.add('spinning');glyph.style.animationDuration=(4.5+Math.random()*2)+'s'}
      button.appendChild(glyph);button.addEventListener('click',()=>choose(button,id));card.appendChild(button);
    });
    return card;
  }
  function renderRound(){
    if(!running)return;
    let a=deck[Math.floor(Math.random()*deck.length)],b;
    do b=deck[Math.floor(Math.random()*deck.length)];while(b===a);
    pair=[a,b];
    const board=$('board');board.innerHTML='';board.append(renderCard(a,0),renderCard(b,1));
  }
  function choose(button,id){
    if(!running)return;
    if(id===commonSymbol()){
      combo++;matches++;button.classList.add('good');awardCoin();encouragement('✓');flash(`✓ ${matches}/${R.TARGET}`);updateHud();
      if(R.isComplete(matches)){setTimeout(finish,140);return}
      setTimeout(renderRound,125);
    }else{
      combo=0;button.classList.remove('bad');void button.offsetWidth;button.classList.add('bad');flash('✕ לא זה — השעון ממשיך',true);updateHud();setTimeout(()=>button.classList.remove('bad'),280);
    }
  }
  function finish(){
    if(!running)return;
    const finalSeconds=Math.max(.01,(performance.now()-startedAt)/1000);running=false;clearInterval(timerId);updateHud();
    const result=saveBest(finalSeconds),best=result.best||finalSeconds;
    const title=result.isBest?'🏆 שיא חדש!':'⏱️ סיום';
    const comparison=result.previous&&result.isBest?` · שיפור של ${Math.max(0,result.previous-finalSeconds).toFixed(2)} שנ׳`:'';
    $('menuPanel').innerHTML=`<h1>${title}</h1><p>${R.formatSeconds(finalSeconds)} ל־${R.TARGET} התאמות${comparison}<br>השיא: ${R.formatSeconds(best)}</p><div class="modes"><button class="action primary big" id="classicAgain" type="button">🔄 שחק שוב</button></div>`;
    $('start').style.display='grid';
    $('classicAgain')?.addEventListener('click',start);
  }
  function start(){
    matches=0;combo=0;running=true;startedAt=performance.now();$('start').style.display='none';document.body.dataset.mode='classic';
    $('modeName').textContent=`קלאסי מהיר · ${difficultyMeta[0]} ${difficultyMeta[1]}`;
    clearInterval(timerId);timerId=setInterval(updateHud,50);updateHud();renderRound();
  }
  function shuffleRound(){if(running){combo=0;renderRound();flash('🔀 קלפים חדשים')}}

  $('shuffleBtn')?.addEventListener('click',shuffleRound);
  $('menuBtn')?.addEventListener('click',()=>{running=false;clearInterval(timerId);$('menuPanel').innerHTML='<h1>DOUBLE</h1><p>20 התאמות בזמן המהיר ביותר</p>';$('start').style.display='grid'});
  updateHud();start();
})();
