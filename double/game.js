(() => {
  'use strict';

  const icons=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];
  const spots=[[50,16],[27,30],[70,31],[48,43],[22,58],[76,60],[39,76],[62,80]];

  let deck=[], pair=[], timer=null, active=false, mode='classic', claim=null;
  let score=0, streak=0, time=60, matches=0, level=1, levelProgress=0, scores=[0,0];
  let knockoutTarget=12;

  const $ = id => document.getElementById(id);

  function buildDeck(){
    const lines=[];
    for(let m=0;m<7;m++){
      for(let b=0;b<7;b++){
        const a=[];
        for(let x=0;x<7;x++) a.push(x*7+((m*x+b)%7));
        a.push(49+m);
        lines.push(a);
      }
    }
    for(let b=0;b<7;b++){
      const a=[];
      for(let y=0;y<7;y++) a.push(b*7+y);
      a.push(56);
      lines.push(a);
    }
    lines.push([49,50,51,52,53,54,55,56]);
    return lines;
  }

  function shuffle(a){
    const out=[...a];
    for(let i=out.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  }

  function modeLabel(){
    return {
      classic:'קלאסי',
      levels:'שלבים',
      knockout:'נוקאאוט',
      survival:'הישרדות',
      versus:'שני שחקנים'
    }[mode] || '';
  }

  function rotating(){
    if(mode==='levels') return level>=2;
    if(mode==='knockout') return true;
    if(mode==='survival') return matches>=3;
    return false;
  }

  function spinSpeed(){
    if(mode==='levels') return Math.max(2.2, 7-level*0.8);
    if(mode==='knockout') return 4.3;
    if(mode==='survival') return Math.max(2.4, 5.5-matches*0.08);
    return 6;
  }

  function levelGoal(){
    return 4 + level;
  }

  function configureMode(nextMode){
    mode=nextMode;
    score=0;
    streak=0;
    matches=0;
    level=1;
    levelProgress=0;
    scores=[0,0];
    claim=null;

    if(mode==='classic') time=60;
    if(mode==='levels') time=35;
    if(mode==='knockout'){ time=30; knockoutTarget=12; }
    if(mode==='survival') time=10;
    if(mode==='versus') time=60;
  }

  function startGame(nextMode){
    configureMode(nextMode);
    deck=shuffle(buildDeck());
    active=true;
    $('start').style.display='none';
    $('modeName').textContent=modeLabel();

    if(timer) clearInterval(timer);
    timer=setInterval(()=>{
      if(!active) return;
      time--;
      update();
      if(time<=0) finishByTime();
    },1000);

    renderPlayerButtons();
    update();
    newRound();
  }

  function finishByTime(){
    if(mode==='levels'){
      endGame('נגמר הזמן', 'הגעת לשלב '+level+' עם '+levelProgress+'/'+levelGoal()+' הצלחות בשלב.');
      return;
    }
    if(mode==='knockout'){
      endGame('נוקאאוט', 'השגת '+matches+' מתוך '+knockoutTarget+' בזמן.');
      return;
    }
    if(mode==='survival'){
      endGame('נגמר הזמן', 'שרדת '+matches+' התאמות.');
      return;
    }
    endGame();
  }

  function renderPlayerButtons(){
    const wrap=$('playerButtons');
    wrap.innerHTML='';
    if(mode!=='versus') return;

    [['🔵 שחקן 1 מצא!','blue',0],['🔴 שחקן 2 מצא!','pink',1]].forEach(([label,cls,p])=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='action '+cls;
      btn.textContent=label;
      btn.addEventListener('click',()=>claimPlayer(p));
      wrap.appendChild(btn);
    });
  }

  function claimPlayer(p){
    if(!active) return;
    claim=p;
    $('turn').textContent='שחקן '+(p+1)+' — לחץ על ההתאמה!';
  }

  function newRound(){
    if(!active) return;
    claim=null;
    $('turn').textContent=mode==='versus'?'מי מוצא ראשון?':'';

    let a=deck[Math.floor(Math.random()*deck.length)];
    let b;
    do b=deck[Math.floor(Math.random()*deck.length)]; while(b===a);
    pair=[a,b];
    render();
  }

  function render(){
    const board=$('board');
    board.innerHTML='';
    const spin=rotating();
    const speed=spinSpeed();

    pair.forEach(card=>{
      const el=document.createElement('div');
      el.className='card';

      shuffle(card).forEach((id,i)=>{
        const p=spots[i];
        const bt=document.createElement('button');
        bt.type='button';
        bt.className='sym';
        bt.style.left=p[0]+'%';
        bt.style.top=p[1]+'%';
        bt.style.fontSize=(36+Math.random()*18)+'px';
        bt.setAttribute('aria-label','סמל '+icons[id]);

        const glyph=document.createElement('span');
        glyph.className='glyph'+(spin?' spinning':'');
        glyph.textContent=icons[id];
        glyph.style.transform='rotate('+(-25+Math.random()*50)+'deg)';
        if(spin) glyph.style.animationDuration=speed+'s';

        bt.appendChild(glyph);
        bt.addEventListener('click',()=>hit(id));
        el.appendChild(bt);
      });

      board.appendChild(el);
    });
  }

  function onCorrect(){
    matches++;
    streak++;

    if(mode==='classic'){
      score+=10+(streak-1)*2;
      flash('✓ מצאת!');
    }

    if(mode==='levels'){
      levelProgress++;
      score+=10*level;
      if(levelProgress>=levelGoal()){
        level++;
        levelProgress=0;
        time+=8;
        flash('⬆️ שלב '+level+'! +8 שניות');
      }else{
        flash('✓ '+levelProgress+'/'+levelGoal());
      }
    }

    if(mode==='knockout'){
      score++;
      if(matches>=knockoutTarget){
        endGame('🏆 נוקאאוט הושלם!', 'השגת '+knockoutTarget+' התאמות עם '+time+' שניות שנותרו.');
        return false;
      }
      flash('✓ '+matches+'/'+knockoutTarget);
    }

    if(mode==='survival'){
      time+=2;
      score=matches;
      flash('⏱️ +2 שניות');
    }

    if(mode==='versus'){
      scores[claim]++;
      flash('✓ נקודה לשחקן '+(claim+1));
    }

    return true;
  }

  function onWrong(){
    streak=0;

    if(mode==='classic'){
      score=Math.max(0,score-3);
      flash('✕ נסה שוב');
    }

    if(mode==='levels'){
      time=Math.max(0,time-2);
      flash('✕ -2 שניות');
    }

    if(mode==='knockout'){
      time=Math.max(0,time-1);
      flash('✕ -1 שנייה');
    }

    if(mode==='survival'){
      time=Math.max(0,time-2);
      flash('✕ -2 שניות');
    }

    if(mode==='versus'){
      scores[claim]=Math.max(0,scores[claim]-1);
      flash('✕ טעות לשחקן '+(claim+1));
      claim=null;
      $('turn').textContent='מי מוצא ראשון?';
    }
  }

  function hit(id){
    if(!active) return;

    if(mode==='versus' && claim===null){
      flash('בחרו קודם מי מצא');
      return;
    }

    const common=pair[0].find(x=>pair[1].includes(x));
    if(id===common){
      const shouldContinue=onCorrect();
      update();
      if(shouldContinue!==false) newRound();
    }else{
      onWrong();
      update();
      if(time<=0) finishByTime();
    }
  }

  function flash(t){
    const e=$('toast');
    e.textContent=t;
    clearTimeout(e._t);
    e._t=setTimeout(()=>{e.textContent='';},850);
  }

  function update(){
    const s=$('stats');

    if(mode==='classic'){
      s.innerHTML='<div class="pill">🔥 '+streak+'</div><div class="pill">⭐ '+score+'</div><div class="pill">⏱️ '+time+'</div>';
    }else if(mode==='levels'){
      s.innerHTML='<div class="pill">שלב '+level+'</div><div class="pill">✓ '+levelProgress+'/'+levelGoal()+'</div><div class="pill">⏱️ '+time+'</div>';
    }else if(mode==='knockout'){
      s.innerHTML='<div class="pill">🎯 '+matches+'/'+knockoutTarget+'</div><div class="pill">⏱️ '+time+'</div>';
    }else if(mode==='survival'){
      s.innerHTML='<div class="pill">🛡️ '+matches+'</div><div class="pill">⏱️ '+time+'</div><div class="pill">כל הצלחה +2</div>';
    }else{
      s.innerHTML='<div class="pill p1">🔵 '+scores[0]+'</div><div class="pill">⏱️ '+time+'</div><div class="pill p2">🔴 '+scores[1]+'</div>';
    }

    const challenge=$('challengeText');
    if(mode==='levels'){
      challenge.textContent=level===1?'שלב 1 — חימום. משלב 2 הסמלים מתחילים להסתובב.':'שלב '+level+' — הסמלים מסתובבים והקצב עולה.';
    }else if(mode==='knockout'){
      challenge.textContent='השג '+knockoutTarget+' התאמות לפני שהשעון מגיע לאפס.';
    }else if(mode==='survival'){
      challenge.textContent='התחלה עם 10 שניות. כל הצלחה מוסיפה 2 שניות.';
    }else if(mode==='versus'){
      challenge.textContent='בוחרים מי מצא ואז לוחצים על הסמל המשותף.';
    }else{
      challenge.textContent='כמה נקודות תצליח לצבור ב־60 שניות?';
    }
  }

  function endGame(title,description){
    if(!active) return;
    active=false;
    if(timer) clearInterval(timer);

    let finalTitle=title;
    let finalText=description;

    if(!finalTitle){
      if(mode==='classic'){
        finalTitle='⭐ '+score;
        finalText='הניקוד שלך';
      }else if(mode==='versus'){
        if(scores[0]===scores[1]){
          finalTitle='תיקו!';
          finalText=scores[0]+' : '+scores[1];
        }else{
          finalTitle='🏆 שחקן '+(scores[0]>scores[1]?1:2);
          finalText=scores[0]+' : '+scores[1];
        }
      }else{
        finalTitle='סיום';
        finalText='כל הכבוד!';
      }
    }

    const panel=$('menuPanel');
    panel.innerHTML='';

    const h=document.createElement('h1');
    h.textContent=finalTitle;
    const p=document.createElement('p');
    p.textContent=finalText||'';

    const again=document.createElement('button');
    again.type='button';
    again.className='action primary big';
    again.textContent='שחק שוב';
    again.addEventListener('click',()=>startGame(mode));

    const menu=document.createElement('button');
    menu.type='button';
    menu.className='action secondary big';
    menu.textContent='מצבי משחק';
    menu.addEventListener('click',showMenu);

    const buttons=document.createElement('div');
    buttons.className='modes';
    buttons.append(again,menu);

    panel.append(h,p,buttons);
    $('start').style.display='grid';
  }

  function restoreMenuMarkup(){
    $('menuPanel').innerHTML=`
      <h1>DOUBLE</h1>
      <p>מצא את הסמל המשותף בין שני הקלפים</p>
      <div class="mode-grid">
        <button type="button" class="mode-card classic" data-mode="classic"><b>⚡ קלאסי</b><small>60 שניות · ניקוד ורצף</small></button>
        <button type="button" class="mode-card levels" data-mode="levels"><b>🚀 שלבים</b><small>עולים שלב · מהירות וסיבוב מתגברים</small></button>
        <button type="button" class="mode-card knockout" data-mode="knockout"><b>🎯 נוקאאוט</b><small>12 התאמות בתוך 30 שניות</small></button>
        <button type="button" class="mode-card survival" data-mode="survival"><b>🛡️ הישרדות</b><small>10 שניות להתחלה · כל הצלחה +2</small></button>
        <button type="button" class="mode-card versus" data-mode="versus"><b>👥 שני שחקנים</b><small>ראש בראש על אותו מסך</small></button>
      </div>
      <p class="menu-note">במצבי האתגר הסמלים מתחילים להסתובב ולהאיץ.</p>
    `;
    $('menuPanel').querySelectorAll('[data-mode]').forEach(btn=>{
      btn.addEventListener('click',()=>startGame(btn.dataset.mode));
    });
  }

  function showMenu(){
    active=false;
    if(timer) clearInterval(timer);
    restoreMenuMarkup();
    $('start').style.display='grid';
  }

  function bindStaticControls(){
    $('shuffleBtn').addEventListener('click',newRound);
    $('menuBtn').addEventListener('click',showMenu);
    $('menuPanel').querySelectorAll('[data-mode]').forEach(btn=>{
      btn.addEventListener('click',()=>startGame(btn.dataset.mode));
    });
  }

  deck=buildDeck();
  bindStaticControls();
  document.documentElement.dataset.doubleReady='1';
})();