(() => {
  'use strict';

  const icons=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];
  const spots=[[50,16],[27,30],[70,31],[48,43],[22,58],[76,60],[39,76],[62,80]];
  const BEST_KEY='double-best-v1';
  const DIFF_KEY='double-difficulty-v1';

  const difficultyConfig={
    easy:{
      label:'קל',
      classicTime:75,
      levelsTime:45,
      knockoutTime:40,
      knockoutTarget:10,
      survivalStart:14,
      survivalBonus:3,
      wrongPenalty:1,
      targetFactor:.85,
      spinFactor:1.25
    },
    normal:{
      label:'בינוני',
      classicTime:60,
      levelsTime:35,
      knockoutTime:30,
      knockoutTarget:12,
      survivalStart:10,
      survivalBonus:2,
      wrongPenalty:2,
      targetFactor:1,
      spinFactor:1
    },
    hard:{
      label:'קשה',
      classicTime:45,
      levelsTime:28,
      knockoutTime:22,
      knockoutTarget:15,
      survivalStart:7,
      survivalBonus:1,
      wrongPenalty:3,
      targetFactor:1.2,
      spinFactor:.78
    }
  };

  let deck=[], pair=[], timer=null, active=false, mode='classic', claim=null;
  let score=0, streak=0, time=60, matches=0, level=1, levelProgress=0, scores=[0,0];
  let knockoutTarget=12;
  let bossActive=false;
  let bossGoal=0;
  let bossProgress=0;
  let bossTimeBefore=0;
  let difficulty=readDifficulty();

  const $ = id => document.getElementById(id);

  function safeGet(key){
    try{return localStorage.getItem(key)}catch(_){return null}
  }
  function safeSet(key,value){
    try{localStorage.setItem(key,value)}catch(_){}
  }
  function readDifficulty(){
    const saved=safeGet(DIFF_KEY);
    return difficultyConfig[saved]?saved:'normal';
  }
  function readBest(){
    try{
      const parsed=JSON.parse(safeGet(BEST_KEY)||'{}');
      return parsed&&typeof parsed==='object'?parsed:{};
    }catch(_){
      return {};
    }
  }
  function saveBest(data){
    safeSet(BEST_KEY,JSON.stringify(data));
  }
  function bestKey(which=mode){
    return which+'-'+difficulty;
  }
  function getBest(which=mode){
    return readBest()[bestKey(which)]||null;
  }
  function commitBest(which,value,secondary=0){
    if(which==='versus') return false;
    const all=readBest();
    const key=bestKey(which);
    const old=all[key];

    let better=false;
    if(!old) better=true;
    else if(which==='classic'||which==='survival'){
      better=value>old.value;
    }else if(which==='levels'){
      better=value>old.value || (value===old.value&&secondary>Number(old.secondary||0));
    }else if(which==='knockout'){
      better=value>old.value || (value===old.value&&secondary>Number(old.secondary||0));
    }

    if(better){
      all[key]={value,secondary,updated:Date.now()};
      saveBest(all);
      return true;
    }
    return false;
  }

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

  function cfg(){return difficultyConfig[difficulty]}

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
    if(bossActive) return true;
    if(mode==='levels') return level>=2;
    if(mode==='knockout') return true;
    if(mode==='survival') return matches>=3;
    return false;
  }

  function spinSpeed(){
    let base=6;
    if(bossActive) base=1.9;
    else if(mode==='levels') base=Math.max(2.2,7-level*.8);
    else if(mode==='knockout') base=4.3;
    else if(mode==='survival') base=Math.max(2.4,5.5-matches*.08);
    return Math.max(1.25,base*cfg().spinFactor);
  }

  function levelGoal(){
    const raw=4+level;
    return Math.max(3,Math.round(raw*cfg().targetFactor));
  }

  function isBossLevel(){
    return mode==='levels' && level>1 && level%5===0;
  }

  function bossGoalForLevel(){
    return Math.max(3,Math.round((3+Math.floor(level/5))*cfg().targetFactor));
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
    bossActive=false;
    bossGoal=0;
    bossProgress=0;

    if(mode==='classic') time=cfg().classicTime;
    if(mode==='levels') time=cfg().levelsTime;
    if(mode==='knockout'){
      time=cfg().knockoutTime;
      knockoutTarget=cfg().knockoutTarget;
    }
    if(mode==='survival') time=cfg().survivalStart;
    if(mode==='versus') time=60;
  }

  function startGame(nextMode){
    configureMode(nextMode);
    deck=shuffle(buildDeck());
    active=true;
    $('start').style.display='none';
    $('modeName').textContent=modeLabel()+' · '+cfg().label;

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
    if(!active) return;

    if(mode==='levels'){
      const isBest=commitBest('levels',level,score);
      endGame('נגמר הזמן','הגעת לשלב '+level+' · ניקוד '+score+(isBest?' · שיא חדש! 🏆':''));
      return;
    }
    if(mode==='knockout'){
      const isBest=commitBest('knockout',matches);
      endGame('נוקאאוט','השגת '+matches+' מתוך '+knockoutTarget+(isBest?' · שיא חדש! 🏆':''));
      return;
    }
    if(mode==='survival'){
      const isBest=commitBest('survival',matches);
      endGame('נגמר הזמן','שרדת '+matches+' התאמות'+(isBest?' · שיא חדש! 🏆':''));
      return;
    }
    if(mode==='classic'){
      const isBest=commitBest('classic',score);
      endGame('⭐ '+score,'הניקוד שלך'+(isBest?' · שיא חדש! 🏆':''));
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
      el.className='card'+(bossActive?' boss-card':'');
      if(bossActive) el.setAttribute('aria-label','קלף בוס');

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
        if(spin){
          glyph.style.animationDuration=speed+'s';
          if((i+id)%2===0) glyph.style.animationDirection='reverse';
        }else{
          glyph.style.transform='rotate('+(-25+Math.random()*50)+'deg)';
        }

        bt.appendChild(glyph);
        bt.addEventListener('click',()=>hit(id));
        el.appendChild(bt);
      });

      board.appendChild(el);
    });
  }

  function enterBoss(){
    bossActive=true;
    bossProgress=0;
    bossGoal=bossGoalForLevel();
    bossTimeBefore=time;
    time=Math.min(time,12);
    flash('👑 בוס! '+bossGoal+' התאמות');
    update();
  }

  function completeBoss(){
    bossActive=false;
    score+=250*level;
    time=Math.max(time,bossTimeBefore)+8;
    flash('👑 הבוס הובס! +8 שניות');
    level++;
    levelProgress=0;
  }

  function onCorrect(){
    matches++;
    streak++;

    if(mode==='classic'){
      score+=10+(streak-1)*2;
      flash('✓ מצאת!');
    }

    if(mode==='levels'){
      if(bossActive){
        bossProgress++;
        score+=25*level;
        if(bossProgress>=bossGoal){
          completeBoss();
        }else{
          flash('👑 '+bossProgress+'/'+bossGoal);
        }
      }else{
        levelProgress++;
        score+=10*level;

        if(levelProgress>=levelGoal()){
          level++;
          levelProgress=0;
          if(isBossLevel()){
            enterBoss();
          }else{
            time+=8;
            flash('⬆️ שלב '+level+'! +8 שניות');
          }
        }else{
          flash('✓ '+levelProgress+'/'+levelGoal());
        }
      }
    }

    if(mode==='knockout'){
      score++;
      if(matches>=knockoutTarget){
        const isBest=commitBest('knockout',knockoutTarget,time);
        endGame('🏆 נוקאאוט הושלם!','נשארו '+time+' שניות'+(isBest?' · שיא חדש! 🏆':''));
        return false;
      }
      flash('✓ '+matches+'/'+knockoutTarget);
    }

    if(mode==='survival'){
      time+=cfg().survivalBonus;
      score=matches;
      flash('⏱️ +'+cfg().survivalBonus+' שניות');
    }

    if(mode==='versus'){
      scores[claim]++;
      flash('✓ נקודה לשחקן '+(claim+1));
    }

    return true;
  }

  function onWrong(){
    streak=0;
    const penalty=cfg().wrongPenalty;

    if(mode==='classic'){
      score=Math.max(0,score-(difficulty==='hard'?5:3));
      flash('✕ נסה שוב');
    }

    if(mode==='levels'){
      const loss=bossActive?penalty+1:penalty;
      time=Math.max(0,time-loss);
      flash('✕ -'+loss+' שניות');
    }

    if(mode==='knockout'){
      time=Math.max(0,time-penalty);
      flash('✕ -'+penalty+' שניות');
    }

    if(mode==='survival'){
      time=Math.max(0,time-penalty);
      flash('✕ -'+penalty+' שניות');
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
    e._t=setTimeout(()=>{e.textContent='';},900);
  }

  function bestText(){
    const best=getBest();
    if(!best) return '';
    if(mode==='classic') return 'שיא: '+best.value;
    if(mode==='levels') return 'שיא: שלב '+best.value;
    if(mode==='knockout'){
      return best.value>=cfg().knockoutTarget
        ? 'שיא: הושלם · '+Number(best.secondary||0)+' שנ׳ נותרו'
        : 'שיא: '+best.value+'/'+cfg().knockoutTarget;
    }
    if(mode==='survival') return 'שיא: '+best.value+' התאמות';
    return '';
  }

  function update(){
    const s=$('stats');

    if(mode==='classic'){
      s.innerHTML='<div class="pill">🔥 '+streak+'</div><div class="pill">⭐ '+score+'</div><div class="pill">⏱️ '+time+'</div>';
    }else if(mode==='levels'){
      s.innerHTML=bossActive
        ? '<div class="pill boss-pill">👑 בוס '+bossProgress+'/'+bossGoal+'</div><div class="pill">⭐ '+score+'</div><div class="pill">⏱️ '+time+'</div>'
        : '<div class="pill">שלב '+level+'</div><div class="pill">✓ '+levelProgress+'/'+levelGoal()+'</div><div class="pill">⏱️ '+time+'</div>';
    }else if(mode==='knockout'){
      s.innerHTML='<div class="pill">🎯 '+matches+'/'+knockoutTarget+'</div><div class="pill">⏱️ '+time+'</div>';
    }else if(mode==='survival'){
      s.innerHTML='<div class="pill">🛡️ '+matches+'</div><div class="pill">⏱️ '+time+'</div><div class="pill">+'+cfg().survivalBonus+' להצלחה</div>';
    }else{
      s.innerHTML='<div class="pill p1">🔵 '+scores[0]+'</div><div class="pill">⏱️ '+time+'</div><div class="pill p2">🔴 '+scores[1]+'</div>';
    }

    const challenge=$('challengeText');
    const best=bestText();

    if(mode==='levels'){
      challenge.textContent=bossActive
        ? '👑 שלב בוס '+level+' — '+bossGoal+' התאמות לפני שהזמן נגמר'+(best?' · '+best:'')
        : 'שלב '+level+' — '+(level>=2?'הסמלים מסתובבים והקצב עולה':'חימום')+(best?' · '+best:'');
    }else if(mode==='knockout'){
      challenge.textContent='השג '+knockoutTarget+' התאמות לפני שהשעון מגיע לאפס'+(best?' · '+best:'');
    }else if(mode==='survival'){
      challenge.textContent='כל הצלחה מוסיפה '+cfg().survivalBonus+' שניות'+(best?' · '+best:'');
    }else if(mode==='versus'){
      challenge.textContent='בוחרים מי מצא ואז לוחצים על הסמל המשותף.';
    }else{
      challenge.textContent='כמה נקודות תצליח לצבור?'+(best?' · '+best:'');
    }
  }

  function endGame(title,description){
    if(!active) return;
    active=false;
    if(timer) clearInterval(timer);

    let finalTitle=title;
    let finalText=description;

    if(!finalTitle){
      if(mode==='versus'){
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

  function bestOverview(){
    const all=readBest();
    const d=difficulty;
    const parts=[];
    if(all['classic-'+d]) parts.push('⚡ '+all['classic-'+d].value);
    if(all['levels-'+d]) parts.push('🚀 שלב '+all['levels-'+d].value);
    if(all['knockout-'+d]) parts.push('🎯 '+all['knockout-'+d].value);
    if(all['survival-'+d]) parts.push('🛡️ '+all['survival-'+d].value);
    return parts.length?parts.join(' · '):'עדיין אין שיאים ברמה הזו';
  }

  function restoreMenuMarkup(){
    $('menuPanel').innerHTML=`
      <h1>DOUBLE</h1>
      <p>מצא את הסמל המשותף בין שני הקלפים</p>

      <div class="difficulty-wrap">
        <span>רמת קושי</span>
        <div class="difficulty-picker">
          <button type="button" data-difficulty="easy">קל</button>
          <button type="button" data-difficulty="normal">בינוני</button>
          <button type="button" data-difficulty="hard">קשה</button>
        </div>
      </div>

      <div class="best-strip" id="bestStrip">${bestOverview()}</div>

      <div class="mode-grid">
        <button type="button" class="mode-card classic" data-mode="classic"><b>⚡ קלאסי</b><small>ניקוד ורצף · הזמן משתנה לפי הרמה</small></button>
        <button type="button" class="mode-card levels" data-mode="levels"><b>🚀 שלבים</b><small>כל שלב קשה יותר · כל שלב 5 הוא בוס 👑</small></button>
        <button type="button" class="mode-card knockout" data-mode="knockout"><b>🎯 נוקאאוט</b><small>יעד התאמות בתוך זמן מוגבל</small></button>
        <button type="button" class="mode-card survival" data-mode="survival"><b>🛡️ הישרדות</b><small>כל הצלחה מוסיפה זמן</small></button>
        <button type="button" class="mode-card versus" data-mode="versus"><b>👥 שני שחקנים</b><small>ראש בראש על אותו מסך</small></button>
      </div>
      <p class="menu-note">השיאים נשמרים במכשיר בנפרד לכל רמת קושי.</p>
    `;

    bindMenuControls();
  }

  function bindMenuControls(){
    const panel=$('menuPanel');

    panel.querySelectorAll('[data-mode]').forEach(btn=>{
      btn.addEventListener('click',()=>startGame(btn.dataset.mode));
    });

    const strip=panel.querySelector('#bestStrip');
    if(strip) strip.textContent=bestOverview();

    panel.querySelectorAll('[data-difficulty]').forEach(btn=>{
      const key=btn.dataset.difficulty;
      btn.classList.toggle('active',key===difficulty);
      btn.addEventListener('click',()=>{
        difficulty=key;
        safeSet(DIFF_KEY,difficulty);
        restoreMenuMarkup();
      });
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
    bindMenuControls();
  }

  deck=buildDeck();
  bindStaticControls();
  document.documentElement.dataset.doubleReady='1';
})();