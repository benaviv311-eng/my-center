(() => {
  'use strict';

  const icons=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];
  const spots=[[50,16],[27,30],[70,31],[48,43],[22,58],[76,60],[39,76],[62,80]];
  const BEST_KEY='double-best-v1';
  const DIFF_KEY='double-difficulty-v1';
  const PROFILE_KEY='double-profile-v1';
  const MAX_STAGE=20;

  const difficultyConfig={
    easy:{label:'קל',classicTime:75,levelsTime:45,knockoutTime:40,knockoutTarget:10,survivalStart:14,survivalBonus:3,wrongPenalty:1,targetFactor:.85,spinFactor:1.25,pointMultiplier:1},
    normal:{label:'בינוני',classicTime:60,levelsTime:35,knockoutTime:30,knockoutTarget:12,survivalStart:10,survivalBonus:2,wrongPenalty:2,targetFactor:1,spinFactor:1,pointMultiplier:1.25},
    hard:{label:'קשה',classicTime:45,levelsTime:28,knockoutTime:22,knockoutTarget:15,survivalStart:7,survivalBonus:1,wrongPenalty:3,targetFactor:1.2,spinFactor:.78,pointMultiplier:1.6}
  };

  let deck=[], pair=[], timer=null, active=false, mode='classic', claim=null;
  let score=0, streak=0, time=60, matches=0, level=1, levelProgress=0, scores=[0,0];
  let knockoutTarget=12, bossActive=false, bossGoal=0, bossProgress=0, bossTimeBefore=0;
  let difficulty=readDifficulty(), roundStartedAt=nowMs();
  let profile=readProfile();

  const $=id=>document.getElementById(id);

  function nowMs(){
    return typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
  }
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
  function readProfile(){
    try{
      const raw=JSON.parse(safeGet(PROFILE_KEY)||'{}');
      return {
        coins:Math.max(0,Number(raw.coins)||0),
        unlockedLevel:Math.min(MAX_STAGE,Math.max(1,Number(raw.unlockedLevel)||1)),
        totalSuccess:Math.max(0,Number(raw.totalSuccess)||0),
        totalScore:Math.max(0,Number(raw.totalScore)||0),
        campaignComplete:Boolean(raw.campaignComplete)
      };
    }catch(_){
      return {coins:0,unlockedLevel:1,totalSuccess:0,totalScore:0,campaignComplete:false};
    }
  }
  function saveProfile(){safeSet(PROFILE_KEY,JSON.stringify(profile))}
  function unlockLevel(n){
    const next=Math.min(MAX_STAGE,Math.max(1,n));
    if(next>profile.unlockedLevel){
      profile.unlockedLevel=next;
      saveProfile();
    }
  }

  function readBest(){
    try{
      const parsed=JSON.parse(safeGet(BEST_KEY)||'{}');
      return parsed&&typeof parsed==='object'?parsed:{};
    }catch(_){return {}}
  }
  function saveBest(data){safeSet(BEST_KEY,JSON.stringify(data))}
  function bestKey(which=mode){return which+'-'+difficulty}
  function getBest(which=mode){return readBest()[bestKey(which)]||null}
  function commitBest(which,value,secondary=0){
    if(which==='versus') return false;
    const all=readBest(), key=bestKey(which), old=all[key];
    let better=!old;
    if(old){
      if(which==='classic'||which==='survival') better=value>old.value;
      else if(which==='levels') better=value>old.value||(value===old.value&&secondary>Number(old.secondary||0));
      else if(which==='knockout') better=value>old.value||(value===old.value&&secondary>Number(old.secondary||0));
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

  function stageCfg(stage=level){
    const n=Math.max(1,Math.min(MAX_STAGE,Number(stage)||1));
    const tier=n<=4?1:n<=9?2:n<=14?3:n<=19?4:5;
    const labels=['','התחלה','מתקדם','מהיר','מומחה','גמר'];
    return {
      label:'שלב '+n+' · '+labels[tier],
      levelsTime:Math.max(18,44-Math.floor((n-1)*1.25)),
      wrongPenalty:Math.min(5,1+Math.floor((n-1)/5)),
      targetFactor:1+Math.floor((n-1)/4)*0.12,
      spinFactor:Math.max(.56,1.18-(n-1)*.032),
      pointMultiplier:1+((n-1)*.06),
      survivalBonus:2,
      classicTime:60,
      knockoutTime:30,
      knockoutTarget:12,
      survivalStart:10
    };
  }
  function cfg(){return mode==='levels'?stageCfg(level):difficultyConfig[difficulty]}
  function modeLabel(){
    return {classic:'קלאסי',levels:'שלבים',knockout:'נוקאאוט',survival:'הישרדות',versus:'שני שחקנים'}[mode]||'';
  }
  function comboMultiplier(){
    if(streak>=10) return 3;
    if(streak>=5) return 2;
    if(streak>=3) return 1.5;
    return 1;
  }
  function comboLabel(){
    if(streak>=10) return '👑 MEGA ×3';
    if(streak>=5) return '⚡ COMBO ×2';
    if(streak>=3) return '🔥 COMBO ×1.5';
    return streak>1?'🔥 '+streak:'';
  }
  function reactionSeconds(){
    return Math.max(0,(nowMs()-roundStartedAt)/1000);
  }
  function speedBonus(seconds=reactionSeconds()){
    if(seconds<=1.5) return 50;
    if(seconds<=3) return 25;
    return 0;
  }
  function coinReward(){
    let coins=1;
    if(streak%10===0) coins+=5;
    else if(streak%5===0) coins+=2;
    return coins;
  }
  function awardSuccess(){
    const seconds=reactionSeconds();
    streak++;
    const speed=speedBonus(seconds);
    const mult=comboMultiplier();
    const points=Math.round((100+speed)*cfg().pointMultiplier*mult);
    const coins=coinReward();

    profile.coins+=coins;
    profile.totalSuccess++;
    if(mode!=='versus'){
      score+=points;
      profile.totalScore+=points;
    }
    saveProfile();
    return {points,coins,speed,mult,seconds};
  }
  function rewardText(reward){
    const combo=comboLabel();
    return '✓ +'+reward.points+' נק׳ · 🪙+'+reward.coins+(combo?' · '+combo:'');
  }

  function encouragementFor(seconds){
    const tiers=[
      {max:.65,level:5,rate:1.28,pitch:1.32,words:['LIGHTNING!','PERFECT!','UNBELIEVABLE!','LEGENDARY!']},
      {max:1.0,level:4,rate:1.22,pitch:1.26,words:['INCREDIBLE!','PHENOMENAL!','BRILLIANT!','OUTSTANDING!']},
      {max:1.55,level:3,rate:1.16,pitch:1.19,words:['AMAZING!','AWESOME!','FANTASTIC!','SUPERB!']},
      {max:2.6,level:2,rate:1.1,pitch:1.12,words:['GREAT!','NICE!','EXCELLENT!','WELL DONE!']},
      {max:99,level:1,rate:1.04,pitch:1.06,words:['GOOD!','KEEP GOING!','YOU GOT IT!','NICE ONE!']}
    ];
    const tier=tiers.find(x=>seconds<=x.max)||tiers[tiers.length-1];
    const bonusLevel=streak>=10?1:0;
    const level=Math.min(5,tier.level+bonusLevel);
    const text=tier.words[Math.floor(Math.random()*tier.words.length)];
    return {text,level,rate:tier.rate+(bonusLevel*.03),pitch:tier.pitch+(bonusLevel*.04)};
  }

  function excitingVoice(){
    if(!('speechSynthesis' in window)) return null;
    const voices=window.speechSynthesis.getVoices()||[];
    const english=voices.filter(v=>/^en[-_]/i.test(v.lang||''));
    const preferred=english.find(v=>/Google US English|Samantha|Alex|Aaron|Daniel|Karen|Moira/i.test(v.name||''));
    return preferred||english[0]||voices[0]||null;
  }

  function playSuccessChime(level){
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx) return;
      if(!window.__doubleAudioCtx) window.__doubleAudioCtx=new AudioCtx();
      const ctx=window.__doubleAudioCtx;
      if(ctx.state==='suspended') ctx.resume();
      const now=ctx.currentTime;
      const notes=[523.25,659.25,783.99,1046.5,1318.5];
      const count=Math.max(1,Math.min(5,level));
      for(let i=0;i<count;i++){
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type=i===count-1?'triangle':'sine';
        osc.frequency.setValueAtTime(notes[Math.min(i,notes.length-1)],now+i*.055);
        gain.gain.setValueAtTime(.0001,now+i*.055);
        gain.gain.exponentialRampToValueAtTime(.08+(level*.01),now+i*.055+.015);
        gain.gain.exponentialRampToValueAtTime(.0001,now+i*.055+.18);
        osc.connect(gain);gain.connect(ctx.destination);
        osc.start(now+i*.055);osc.stop(now+i*.055+.2);
      }
    }catch(_){}
  }

  function speakEncouragement(item){
    playSuccessChime(item.level);
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined') return;
    try{
      window.speechSynthesis.cancel();
      const utterance=new SpeechSynthesisUtterance(item.text.replace(/!/g,''));
      utterance.lang='en-US';
      const voice=excitingVoice();
      if(voice) utterance.voice=voice;
      utterance.rate=item.rate;
      utterance.pitch=item.pitch;
      utterance.volume=1;
      window.speechSynthesis.speak(utterance);
    }catch(_){}
  }

  function sparkleBurst(level){
    const count=8+(level*4);
    for(let i=0;i<count;i++){
      const spark=document.createElement('span');
      spark.className='success-spark spark-'+((i%3)+1);
      spark.textContent=i%3===0?'✦':i%3===1?'✧':'★';
      spark.style.left=(35+Math.random()*30)+'vw';
      spark.style.top=(24+Math.random()*24)+'vh';
      spark.style.setProperty('--sx',((Math.random()-.5)*180)+'px');
      spark.style.setProperty('--sy',((Math.random()-.5)*150)+'px');
      spark.style.animationDelay=(Math.random()*90)+'ms';
      document.body.appendChild(spark);
      setTimeout(()=>spark.remove(),900);
    }
  }

  function showEncouragement(reward){
    const item=encouragementFor(reward.seconds);
    let el=document.getElementById('encouragement');
    if(!el){
      el=document.createElement('div');
      el.id='encouragement';
      el.className='encouragement';
      el.setAttribute('aria-live','polite');
      document.body.appendChild(el);
    }
    el.className='encouragement level-'+item.level;
    el.innerHTML='<span>'+item.text+'</span>';
    el.style.animation='none';
    void el.offsetWidth;
    el.style.animation='';
    clearTimeout(el._t);
    el._t=setTimeout(()=>{el.textContent=''},850);
    sparkleBurst(item.level);
    speakEncouragement(item);
  }

  function burstCoins(sourceEl,count){
    const visible=Math.max(4,Math.min(12,count+4));
    const screenH=Math.max(420,window.innerHeight||700);

    for(let side=0;side<2;side++){
      for(let i=0;i<visible;i++){
        const coin=document.createElement('span');
        coin.className='side-coin '+(side===0?'from-left':'from-right');
        coin.textContent='🪙';
        coin.style.left=side===0?'18px':'calc(100vw - 18px)';
        coin.style.top=(screenH*(.42+Math.random()*.38))+'px';
        const inward=(90+Math.random()*130)*(side===0?1:-1);
        coin.style.setProperty('--coin-x',inward+'px');
        coin.style.setProperty('--coin-y',(-90-Math.random()*140)+'px');
        coin.style.setProperty('--coin-r',((Math.random()*520)-260)+'deg');
        coin.style.animationDelay=(i*28+Math.random()*70)+'ms';
        document.body.appendChild(coin);
        setTimeout(()=>coin.remove(),1250);
      }
    }

    const amount=document.createElement('span');
    amount.className='coin-amount side-total';
    amount.textContent='🪙 +'+count;
    amount.style.left='50vw';
    amount.style.top='58vh';
    document.body.appendChild(amount);
    setTimeout(()=>amount.remove(),1100);
  }

  function celebrateSuccess(reward,sourceEl){
    burstCoins(sourceEl,reward.coins);
    showEncouragement(reward);
  }

  function rotating(){
    if(bossActive) return true;
    if(mode==='levels') return level>=4;
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
    return Math.max(4,Math.round((4+level*.7)*cfg().targetFactor));
  }
  function isBossLevel(){return mode==='levels'&&level>1&&level%5===0}
  function bossGoalForLevel(){return Math.max(3,Math.round((3+Math.floor(level/5))*cfg().targetFactor))}

  function configureMode(nextMode,startLevel){
    mode=nextMode;
    score=0;streak=0;matches=0;levelProgress=0;scores=[0,0];claim=null;
    bossActive=false;bossGoal=0;bossProgress=0;
    level=mode==='levels'?Math.min(profile.unlockedLevel,Math.max(1,Number(startLevel)||profile.unlockedLevel)):1;

    if(mode==='classic') time=cfg().classicTime;
    if(mode==='levels'){
      time=stageCfg(level).levelsTime;
      if(isBossLevel()) enterBoss(true);
    }
    if(mode==='knockout'){time=cfg().knockoutTime;knockoutTarget=cfg().knockoutTarget}
    if(mode==='survival') time=cfg().survivalStart;
    if(mode==='versus') time=60;
  }

  function startGame(nextMode,startLevel){
    configureMode(nextMode,startLevel);
    deck=shuffle(buildDeck());
    active=true;
    $('start').style.display='none';
    $('modeName').textContent=mode==='levels'?cfg().label:(modeLabel()+' · '+cfg().label);

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
      endGame('נגמר הזמן','הגעת לשלב '+level+' · '+score+' נק׳'+(isBest?' · שיא חדש! 🏆':''));
      return;
    }
    if(mode==='knockout'){
      const isBest=commitBest('knockout',matches,0);
      endGame('נוקאאוט','השגת '+matches+' מתוך '+knockoutTarget+(isBest?' · שיא חדש! 🏆':''));
      return;
    }
    if(mode==='survival'){
      const isBest=commitBest('survival',matches);
      endGame('נגמר הזמן','שרדת '+matches+' התאמות · '+score+' נק׳'+(isBest?' · שיא חדש! 🏆':''));
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
      btn.type='button';btn.className='action '+cls;btn.textContent=label;
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

    let a=deck[Math.floor(Math.random()*deck.length)],b;
    do b=deck[Math.floor(Math.random()*deck.length)];while(b===a);
    pair=[a,b];
    roundStartedAt=nowMs();
    render();
  }

  function render(){
    const board=$('board');
    board.innerHTML='';
    const spin=rotating(),speed=spinSpeed();

    pair.forEach(card=>{
      const el=document.createElement('div');
      el.className='card'+(bossActive?' boss-card':'');
      shuffle(card).forEach((id,i)=>{
        const p=spots[i],bt=document.createElement('button');
        bt.type='button';bt.className='sym';bt.style.left=p[0]+'%';bt.style.top=p[1]+'%';
        bt.style.fontSize=(36+Math.random()*18)+'px';bt.setAttribute('aria-label','סמל '+icons[id]);

        const glyph=document.createElement('span');
        glyph.className='glyph'+(spin?' spinning':'');glyph.textContent=icons[id];
        if(spin){
          glyph.style.animationDuration=speed+'s';
          if((i+id)%2===0) glyph.style.animationDirection='reverse';
        }else glyph.style.transform='rotate('+(-25+Math.random()*50)+'deg)';

        bt.appendChild(glyph);
        bt.addEventListener('click',()=>hit(id,bt));
        el.appendChild(bt);
      });
      board.appendChild(el);
    });
  }

  function enterBoss(silent=false){
    bossActive=true;bossProgress=0;bossGoal=bossGoalForLevel();bossTimeBefore=time;
    time=Math.min(time,12);
    if(!silent) flash('👑 בוס! '+bossGoal+' התאמות');
  }
  function completeBoss(){
    bossActive=false;
    time=Math.max(time,bossTimeBefore)+8;

    if(level>=MAX_STAGE){
      profile.campaignComplete=true;
      saveProfile();
      const isBest=commitBest('levels',MAX_STAGE,score);
      endGame('🏆 המסלול הושלם!','סיימת את כל '+MAX_STAGE+' השלבים · '+score+' נק׳'+(isBest?' · שיא חדש!':''));
      return false;
    }

    level++;
    unlockLevel(level);
    levelProgress=0;
    flash('👑 הבוס הובס! שלב '+level+' נפתח');
    return true;
  }
  function completeStage(){
    if(level>=MAX_STAGE){
      profile.campaignComplete=true;
      saveProfile();
      endGame('🏆 המסלול הושלם!','סיימת את כל '+MAX_STAGE+' השלבים.');
      return false;
    }

    level++;
    unlockLevel(level);
    levelProgress=0;

    if(isBossLevel()){
      enterBoss();
    }else{
      time+=8;
      flash('⬆️ שלב '+level+' נפתח · +8 שניות');
    }
    return true;
  }

  function onCorrect(sourceEl){
    matches++;
    const reward=awardSuccess();
    celebrateSuccess(reward,sourceEl);

    if(mode==='classic'){
      flash(rewardText(reward));
    }else if(mode==='levels'){
      if(bossActive){
        bossProgress++;
        if(bossProgress>=bossGoal){
          const keepGoing=completeBoss();
          if(keepGoing===false) return false;
        }else flash('👑 '+bossProgress+'/'+bossGoal+' · '+rewardText(reward));
      }else{
        levelProgress++;
        if(levelProgress>=levelGoal()){
          const keepGoing=completeStage();
          if(keepGoing===false) return false;
        }else flash(rewardText(reward));
      }
    }else if(mode==='knockout'){
      if(matches>=knockoutTarget){
        const isBest=commitBest('knockout',knockoutTarget,time);
        endGame('🏆 נוקאאוט הושלם!','נשארו '+time+' שניות · '+score+' נק׳'+(isBest?' · שיא חדש!':''));
        return false;
      }
      flash(rewardText(reward));
    }else if(mode==='survival'){
      time+=cfg().survivalBonus;
      flash(rewardText(reward)+' · ⏱️+'+cfg().survivalBonus);
    }else if(mode==='versus'){
      scores[claim]++;
      flash('✓ שחקן '+(claim+1)+' · 🪙+'+reward.coins);
    }

    return true;
  }

  function onWrong(){
    streak=0;
    const penalty=cfg().wrongPenalty;

    if(mode==='classic'){
      score=Math.max(0,score-(difficulty==='hard'?100:50));
      flash('✕ הקומבו נשבר');
    }else if(mode==='levels'){
      const loss=bossActive?penalty+1:penalty;
      time=Math.max(0,time-loss);
      flash('✕ קומבו אופס · -'+loss+' שניות');
    }else if(mode==='knockout'){
      time=Math.max(0,time-penalty);
      flash('✕ קומבו אופס · -'+penalty+' שניות');
    }else if(mode==='survival'){
      time=Math.max(0,time-penalty);
      flash('✕ קומבו אופס · -'+penalty+' שניות');
    }else if(mode==='versus'){
      scores[claim]=Math.max(0,scores[claim]-1);
      flash('✕ טעות לשחקן '+(claim+1));
      claim=null;
      $('turn').textContent='מי מוצא ראשון?';
    }
  }

  function hit(id,sourceEl){
    if(!active) return;
    if(mode==='versus'&&claim===null){flash('בחרו קודם מי מצא');return}

    const common=pair[0].find(x=>pair[1].includes(x));
    if(id===common){
      const keepGoing=onCorrect(sourceEl);
      update();
      if(keepGoing!==false) newRound();
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
    e._t=setTimeout(()=>{e.textContent=''},1000);
  }

  function bestText(){
    const best=getBest();
    if(!best) return '';
    if(mode==='classic') return 'שיא: '+best.value;
    if(mode==='levels') return 'שיא: שלב '+best.value;
    if(mode==='knockout') return best.value>=cfg().knockoutTarget?'שיא: הושלם · '+Number(best.secondary||0)+' שנ׳ נותרו':'שיא: '+best.value+'/'+cfg().knockoutTarget;
    if(mode==='survival') return 'שיא: '+best.value+' התאמות';
    return '';
  }

  function update(){
    const s=$('stats');
    const combo=comboLabel();

    if(mode==='classic'){
      s.innerHTML='<div class="pill">⭐ '+score+'</div><div class="pill">🪙 '+profile.coins+'</div><div class="pill">⏱️ '+time+'</div>'+(combo?'<div class="pill combo-pill">'+combo+'</div>':'');
    }else if(mode==='levels'){
      s.innerHTML=(bossActive?'<div class="pill boss-pill">👑 '+bossProgress+'/'+bossGoal+'</div>':'<div class="pill">שלב '+level+' · '+levelProgress+'/'+levelGoal()+'</div>')+
        '<div class="pill">⭐ '+score+'</div><div class="pill">🪙 '+profile.coins+'</div><div class="pill">⏱️ '+time+'</div>'+(combo?'<div class="pill combo-pill">'+combo+'</div>':'');
    }else if(mode==='knockout'){
      s.innerHTML='<div class="pill">🎯 '+matches+'/'+knockoutTarget+'</div><div class="pill">⭐ '+score+'</div><div class="pill">🪙 '+profile.coins+'</div><div class="pill">⏱️ '+time+'</div>'+(combo?'<div class="pill combo-pill">'+combo+'</div>':'');
    }else if(mode==='survival'){
      s.innerHTML='<div class="pill">🛡️ '+matches+'</div><div class="pill">⭐ '+score+'</div><div class="pill">🪙 '+profile.coins+'</div><div class="pill">⏱️ '+time+'</div>'+(combo?'<div class="pill combo-pill">'+combo+'</div>':'');
    }else{
      s.innerHTML='<div class="pill p1">🔵 '+scores[0]+'</div><div class="pill">🪙 '+profile.coins+'</div><div class="pill">⏱️ '+time+'</div><div class="pill p2">🔴 '+scores[1]+'</div>';
    }

    const challenge=$('challengeText'),best=bestText();
    if(mode==='levels'){
      challenge.textContent=bossActive?'👑 בוס שלב '+level+' — '+bossGoal+' התאמות':('שלב '+level+' מתוך '+MAX_STAGE+(best?' · '+best:''));
    }else if(mode==='knockout'){
      challenge.textContent='השג '+knockoutTarget+' התאמות לפני שהזמן נגמר'+(best?' · '+best:'');
    }else if(mode==='survival'){
      challenge.textContent='כל הצלחה מוסיפה '+cfg().survivalBonus+' שניות'+(best?' · '+best:'');
    }else if(mode==='versus'){
      challenge.textContent='בוחרים מי מצא ואז לוחצים על הסמל המשותף.';
    }else{
      challenge.textContent='100 בסיס · בונוס מהירות · מכפיל קושי · קומבו'+(best?' · '+best:'');
    }
  }

  function endGame(title,description){
    if(!active) return;
    active=false;
    if(timer) clearInterval(timer);

    let finalTitle=title,finalText=description;
    if(!finalTitle){
      if(mode==='versus'){
        if(scores[0]===scores[1]){finalTitle='תיקו!';finalText=scores[0]+' : '+scores[1]}
        else{finalTitle='🏆 שחקן '+(scores[0]>scores[1]?1:2);finalText=scores[0]+' : '+scores[1]}
      }else{finalTitle='סיום';finalText='כל הכבוד!'}
    }

    const panel=$('menuPanel');
    panel.innerHTML='';

    const h=document.createElement('h1');h.textContent=finalTitle;
    const p=document.createElement('p');p.textContent=finalText||'';
    const wallet=document.createElement('div');wallet.className='best-strip';wallet.textContent='🪙 '+profile.coins+' מטבעות';

    const again=document.createElement('button');
    again.type='button';again.className='action primary big';again.textContent='שחק שוב';
    again.addEventListener('click',()=>startGame(mode,mode==='levels'?level:undefined));

    const back=document.createElement('button');
    back.type='button';back.className='action secondary big';back.textContent='← חזור';
    back.addEventListener('click',showMenu);

    const buttons=document.createElement('div');
    buttons.className='modes';buttons.append(again,back);
    panel.append(h,p,wallet,buttons);
    $('start').style.display='grid';
  }

  function bestOverview(){
    const all=readBest(),d=difficulty,parts=[];
    if(all['classic-'+d]) parts.push('⚡ '+all['classic-'+d].value);
    if(all['levels-'+d]) parts.push('🚀 שלב '+all['levels-'+d].value);
    if(all['knockout-'+d]) parts.push('🎯 '+all['knockout-'+d].value);
    if(all['survival-'+d]) parts.push('🛡️ '+all['survival-'+d].value);
    return parts.length?parts.join(' · '):'עדיין אין שיאים ברמה הזו';
  }

  function progressPercent(){
    if(profile.campaignComplete) return 100;
    return Math.round(((profile.unlockedLevel-1)/(MAX_STAGE-1))*100);
  }

  function stageGraphHtml(){
    const rows=[];
    for(let start=1;start<=MAX_STAGE;start+=4){
      const nums=[];
      for(let n=start;n<start+4&&n<=MAX_STAGE;n++) nums.push(n);
      if(((start-1)/4)%2===1) nums.reverse();

      const buttons=nums.map(n=>{
        const unlocked=n<=profile.unlockedLevel;
        const completed=profile.campaignComplete||n<profile.unlockedLevel;
        const current=!profile.campaignComplete&&n===profile.unlockedLevel;
        const boss=n%5===0;
        const tier=n<=4?'התחלה':n<=9?'מתקדם':n<=14?'מהיר':n<=19?'מומחה':'גמר';
        return '<button type="button" class="stage-node'+(completed?' done':'')+(current?' current':'')+(boss?' boss':'')+'" data-stage="'+n+'" '+(unlocked?'':'disabled')+' aria-label="שלב '+n+(boss?' בוס':'')+'">'+
          '<span class="stage-icon">'+(boss?'👑':completed?'✓':current?'▶':'🔒')+'</span>'+
          '<strong>'+n+'</strong><small>'+tier+'</small>'+
        '</button>';
      }).join('');

      rows.push('<div class="world-row'+((((start-1)/4)%2===1)?' reverse':'')+'">'+buttons+'</div>');
    }
    return rows.join('');
  }

  function restoreMenuMarkup(){
    $('menuPanel').innerHTML=`
      <h1>DOUBLE</h1>
      <div class="wallet-line">🪙 <b>${profile.coins}</b> מטבעות</div>

      <div class="difficulty-wrap">
        <span>רמת קושי למצבים החופשיים</span>
        <div class="difficulty-picker">
          <button type="button" data-difficulty="easy">קל</button>
          <button type="button" data-difficulty="normal">בינוני</button>
          <button type="button" data-difficulty="hard">קשה</button>
        </div>
      </div>

      <div class="mode-grid">
        <button type="button" class="mode-card classic" data-mode="classic"><b>⚡ קלאסי</b><small>צבור כמה שיותר נקודות</small></button>
        <button type="button" class="mode-card levels" data-open-levels><b>🗺️ עולם השלבים</b><small>שלב ${profile.unlockedLevel}/${MAX_STAGE} · הקושי עולה בדרך</small></button>
        <button type="button" class="mode-card knockout" data-mode="knockout"><b>🎯 נוקאאוט</b><small>יעד התאמות בזמן מוגבל</small></button>
        <button type="button" class="mode-card survival" data-mode="survival"><b>🛡️ הישרדות</b><small>כל הצלחה מוסיפה זמן</small></button>
        <button type="button" class="mode-card versus" data-mode="versus"><b>👥 שני שחקנים</b><small>ראש בראש על אותו מסך</small></button>
      </div>
    `;
    bindMenuControls();
  }

  function showLevelsMenu(){
    const currentTier=profile.unlockedLevel<=4?'התחלה':profile.unlockedLevel<=9?'מתקדם':profile.unlockedLevel<=14?'מהיר':profile.unlockedLevel<=19?'מומחה':'גמר';
    $('menuPanel').innerHTML=`
      <div class="submenu-head">
        <button type="button" class="action secondary" data-back-main>← חזור</button>
        <div>
          <h2>🗺️ עולם השלבים</h2>
          <small>אזור נוכחי: ${currentTier} · הקושי עולה אוטומטית</small>
        </div>
      </div>

      <section class="world-card">
        <div class="progress-head">
          <b>הדרך שלך</b>
          <span>שלב ${profile.unlockedLevel}/${MAX_STAGE} · ${progressPercent()}%</span>
        </div>
        <div class="progress-bar"><i style="width:${progressPercent()}%"></i></div>

        <div class="world-map">
          <div class="world-zone-label">🌱 התחלה</div>
          ${stageGraphHtml()}
          <div class="world-finish">🏆 יעד: שלב 20</div>
        </div>

        <div class="world-rules">
          <span>כל 5 שלבים: 👑 בוס</span>
          <span>משלב 4: 🔄 סמלים מסתובבים</span>
          <span>בהמשך: ⏱️ פחות זמן · 🎯 יותר התאמות</span>
        </div>
      </section>

      <div class="modes">
        <button type="button" class="action primary big" data-continue-levels>▶ המשך משלב ${profile.unlockedLevel}</button>
      </div>
    `;

    const panel=$('menuPanel');
    const back=panel.querySelector('[data-back-main]');
    if(back) back.addEventListener('click',restoreMenuMarkup);

    const cont=panel.querySelector('[data-continue-levels]');
    if(cont) cont.addEventListener('click',()=>startGame('levels',profile.unlockedLevel));

    panel.querySelectorAll('[data-stage]').forEach(btn=>{
      if(btn.disabled) return;
      btn.addEventListener('click',()=>startGame('levels',Number(btn.dataset.stage)));
    });
  }

  function bindMenuControls(){
    const panel=$('menuPanel');

    panel.querySelectorAll('[data-mode]').forEach(btn=>{
      btn.addEventListener('click',()=>startGame(btn.dataset.mode));
    });

    const levels=panel.querySelector('[data-open-levels]');
    if(levels) levels.addEventListener('click',showLevelsMenu);

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
    $('menuBtn').textContent='← חזור';
    $('menuBtn').addEventListener('click',showMenu);
  }

  deck=buildDeck();
  bindStaticControls();
  restoreMenuMarkup();
  document.documentElement.dataset.doubleReady='1';
})();