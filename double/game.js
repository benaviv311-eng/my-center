(() => {
  'use strict';

  const icons=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];
  const spots=[[50,16],[27,30],[70,31],[48,43],[22,58],[76,60],[39,76],[62,80]];
  const BEST_KEY='double-best-v1';
  const DIFF_KEY='double-difficulty-v1';
  const PROFILE_KEY='double-profile-v1';
  const SPRINT_KEY='double-sprint-best-v1';
  const VERSUS_KEYS_KEY='double-versus-keys-v1';
  const VERSUS_AVATARS_KEY='double-versus-avatars-v1';
  const MAX_STAGE=20;

  const AVATAR_CATEGORIES={
    all:'הכול',emoji:'אימוג׳י',animals:'חיות',people:'אנשים',robots:'רובוטים',
    fantasy:'פנטזיה',sports:'ספורט',food:'אוכל',symbols:'סמלים'
  };
  const AVATAR_CATALOG=[
    {id:'smile',category:'emoji',label:'שמח',glyph:'😄'},
    {id:'cool',category:'emoji',label:'מגניב',glyph:'😎'},
    {id:'star-eyes',category:'emoji',label:'מתלהב',glyph:'🤩'},
    {id:'mischief',category:'emoji',label:'שובב',glyph:'😈'},
    {id:'angry',category:'emoji',label:'קרבי',glyph:'😤'},
    {id:'crazy',category:'emoji',label:'משוגע',glyph:'🤪'},
    {id:'lion',category:'animals',label:'אריה',glyph:'🦁'},
    {id:'wolf',category:'animals',label:'זאב',glyph:'🐺'},
    {id:'fox',category:'animals',label:'שועל',glyph:'🦊'},
    {id:'bear',category:'animals',label:'דוב',glyph:'🐻'},
    {id:'cat',category:'animals',label:'חתול',glyph:'🐱'},
    {id:'dog',category:'animals',label:'כלב',glyph:'🐶'},
    {id:'monkey',category:'animals',label:'קוף',glyph:'🐵'},
    {id:'panda',category:'animals',label:'פנדה',glyph:'🐼'},
    {id:'eagle',category:'animals',label:'נשר',glyph:'🦅'},
    {id:'shark',category:'animals',label:'כריש',glyph:'🦈'},
    {id:'rabbit',category:'animals',label:'ארנב',glyph:'🐰'},
    {id:'tiger',category:'animals',label:'נמר',glyph:'🐯'},
    {id:'boy',category:'people',label:'ילד',glyph:'👦'},
    {id:'girl',category:'people',label:'ילדה',glyph:'👧'},
    {id:'man',category:'people',label:'גבר',glyph:'👨'},
    {id:'woman',category:'people',label:'אישה',glyph:'👩'},
    {id:'runner',category:'people',label:'ספורטאי',glyph:'🏃'},
    {id:'runner-w',category:'people',label:'ספורטאית',glyph:'🏃‍♀️'},
    {id:'scientist',category:'people',label:'מדען',glyph:'🧑‍🔬'},
    {id:'musician',category:'people',label:'מוזיקאי',glyph:'🧑‍🎤'},
    {id:'gamer',category:'people',label:'גיימר',glyph:'🧑‍💻'},
    {id:'ninja-human',category:'people',label:'נינג׳ה',glyph:'🥷'},
    {id:'robot',category:'robots',label:'רובוט',glyph:'🤖'},
    {id:'alienbot',category:'robots',label:'בוט חלל',glyph:'👾'},
    {id:'armbot',category:'robots',label:'בוט כוח',glyph:'🦾'},
    {id:'ufo',category:'robots',label:'בוט מעופף',glyph:'🛸'},
    {id:'wizard',category:'fantasy',label:'קוסם',glyph:'🧙'},
    {id:'elf',category:'fantasy',label:'אלף',glyph:'🧝'},
    {id:'vampire',category:'fantasy',label:'ערפד',glyph:'🧛'},
    {id:'pirate',category:'fantasy',label:'פיראט',glyph:'🏴‍☠️'},
    {id:'dragon',category:'fantasy',label:'דרקון',glyph:'🐉'},
    {id:'ghost',category:'fantasy',label:'רוח',glyph:'👻'},
    {id:'alien',category:'fantasy',label:'חייזר',glyph:'👽'},
    {id:'unicorn',category:'fantasy',label:'חד־קרן',glyph:'🦄'},
    {id:'volleyball',category:'sports',label:'כדורעף',glyph:'🏐'},
    {id:'football',category:'sports',label:'כדורגל',glyph:'⚽'},
    {id:'basketball',category:'sports',label:'כדורסל',glyph:'🏀'},
    {id:'tennis',category:'sports',label:'טניס',glyph:'🎾'},
    {id:'boxing',category:'sports',label:'אגרוף',glyph:'🥊'},
    {id:'skate',category:'sports',label:'סקייט',glyph:'🛹'},
    {id:'pizza',category:'food',label:'פיצה',glyph:'🍕'},
    {id:'burger',category:'food',label:'המבורגר',glyph:'🍔'},
    {id:'donut',category:'food',label:'דונאט',glyph:'🍩'},
    {id:'watermelon',category:'food',label:'אבטיח',glyph:'🍉'},
    {id:'avocado',category:'food',label:'אבוקדו',glyph:'🥑'},
    {id:'icecream',category:'food',label:'גלידה',glyph:'🍦'},
    {id:'bolt',category:'symbols',label:'ברק',glyph:'⚡'},
    {id:'star',category:'symbols',label:'כוכב',glyph:'⭐'},
    {id:'crown',category:'symbols',label:'כתר',glyph:'👑'},
    {id:'gem',category:'symbols',label:'יהלום',glyph:'💎'},
    {id:'flame',category:'symbols',label:'אש',glyph:'🔥'},
    {id:'heart',category:'symbols',label:'לב',glyph:'❤️'},
    {id:'trophy',category:'symbols',label:'גביע',glyph:'🏆'},
    {id:'rocket',category:'symbols',label:'טיל',glyph:'🚀'}
  ];

  const difficultyConfig={
    easy:{label:'קל',classicTime:75,levelsTime:45,knockoutTime:40,knockoutTarget:10,survivalStart:14,survivalBonus:3,wrongPenalty:1,targetFactor:.85,spinFactor:1.25,pointMultiplier:1},
    normal:{label:'בינוני',classicTime:60,levelsTime:35,knockoutTime:30,knockoutTarget:12,survivalStart:10,survivalBonus:2,wrongPenalty:2,targetFactor:1,spinFactor:1,pointMultiplier:1.25},
    hard:{label:'קשה',classicTime:45,levelsTime:28,knockoutTime:22,knockoutTarget:15,survivalStart:7,survivalBonus:1,wrongPenalty:3,targetFactor:1.2,spinFactor:.78,pointMultiplier:1.6}
  };

  let deck=[], pair=[], timer=null, active=false, mode='classic', claim=null;
  let score=0, streak=0, time=60, matches=0, level=1, levelProgress=0, scores=[0,0];
  let knockoutTarget=12, bossActive=false, bossGoal=0, bossProgress=0, bossTimeBefore=0;
  let levelAssistUses=0, levelAssisted=false;
  let sprintTarget=5, sprintStartedAt=0;
  let versusKeys=readVersusKeys(), versusCursor=[0,0], versusLocked=false;
  let versusAvatars=readVersusAvatars();
  let versusVariant='duel', versusTarget=10, versusLives=[3,3], versusRound=0, versusDeckOrder=[], versusDeckIndex=0, versusStreak=[0,0];
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
  function defaultVersusKeys(){
    return {
      p1:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',select:'Enter'},
      p2:{up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',select:'Space'}
    };
  }
  function readVersusKeys(){
    try{
      const raw=JSON.parse(safeGet(VERSUS_KEYS_KEY)||'null');
      const def=defaultVersusKeys();
      if(!raw||!raw.p1||!raw.p2) return def;

      const legacyP1=raw.p1.up==='KeyW'&&raw.p1.down==='KeyS'&&raw.p1.left==='KeyA'&&raw.p1.right==='KeyD'&&raw.p1.select==='Space';
      const legacyP2=raw.p2.up==='ArrowUp'&&raw.p2.down==='ArrowDown'&&raw.p2.left==='ArrowLeft'&&raw.p2.right==='ArrowRight'&&raw.p2.select==='Enter';
      if(legacyP1&&legacyP2){
        safeSet(VERSUS_KEYS_KEY,JSON.stringify(def));
        return def;
      }

      return {
        p1:Object.assign({},def.p1,raw.p1),
        p2:Object.assign({},def.p2,raw.p2)
      };
    }catch(_){return defaultVersusKeys()}
  }
  function saveVersusKeys(){safeSet(VERSUS_KEYS_KEY,JSON.stringify(versusKeys))}
  function avatarById(id){return AVATAR_CATALOG.find(a=>a.id===id)||AVATAR_CATALOG[0]}
  function defaultVersusAvatars(){return {p1:'lion',p2:'robot'}}
  function readVersusAvatars(){
    try{
      const raw=JSON.parse(safeGet(VERSUS_AVATARS_KEY)||'null');
      const def=defaultVersusAvatars();
      if(!raw) return def;
      return {
        p1:avatarById(raw.p1).id,
        p2:avatarById(raw.p2).id
      };
    }catch(_){return defaultVersusAvatars()}
  }
  function saveVersusAvatars(){safeSet(VERSUS_AVATARS_KEY,JSON.stringify(versusAvatars))}
  function avatarSetupHtml(player){
    const a=avatarById(versusAvatars[player]);
    const num=player==='p1'?1:2;
    return '<div class="avatar-setup-row">'+
      '<div class="avatar-preview '+player+'-avatar"><span class="avatar-glyph">'+a.glyph+'</span><span><b>'+a.label+'</b><small>'+AVATAR_CATEGORIES[a.category]+'</small></span></div>'+
      '<button type="button" class="avatar-change" data-change-avatar="'+player+'">החלף אווטר</button>'+
    '</div>';
  }
  function liveAvatarHtml(player){
    const a=avatarById(versusAvatars[player]);
    const num=player==='p1'?1:2;
    return '<div class="live-avatar-hud '+player+'-avatar" data-avatar-player="'+player+'">'+
      '<span class="avatar-glyph" aria-hidden="true">'+a.glyph+'</span>'+
      '<span class="avatar-live-copy"><b>שחקן '+num+'</b><small>'+a.label+'</small></span>'+
    '</div>';
  }
  function avatarReact(player,state,duration=500){
    const el=document.querySelector('.live-avatar-hud[data-avatar-player="'+player+'"]');
    if(!el) return;
    ['focus','win','wrong','champion'].forEach(x=>el.classList.remove(x));
    void el.offsetWidth;
    el.classList.add(state);
    clearTimeout(el._avatarTimer);
    el._avatarTimer=setTimeout(()=>el.classList.remove(state),duration);
  }
  function keyLabel(code){
    const map={
      Space:'רווח',Enter:'Enter',
      ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',
      Escape:'Esc',Tab:'Tab'
    };
    if(map[code]) return map[code];
    if(/^Key[A-Z]$/.test(code)) return code.slice(3);
    if(/^Digit[0-9]$/.test(code)) return code.slice(5);
    return code||'?';
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
  function readSprintBests(){
    try{
      const parsed=JSON.parse(safeGet(SPRINT_KEY)||'{}');
      return parsed&&typeof parsed==='object'?parsed:{};
    }catch(_){return {}}
  }
  function sprintBestKey(target=sprintTarget){
    return difficulty+'-'+target;
  }
  function getSprintBest(target=sprintTarget){
    const value=Number(readSprintBests()[sprintBestKey(target)]);
    return Number.isFinite(value)&&value>0?value:null;
  }
  function saveSprintBest(seconds,target=sprintTarget){
    const all=readSprintBests();
    const key=sprintBestKey(target);
    const old=Number(all[key]);
    const isBest=!Number.isFinite(old)||old<=0||seconds<old;
    if(isBest){
      all[key]=Number(seconds.toFixed(2));
      safeSet(SPRINT_KEY,JSON.stringify(all));
    }
    return {isBest,previous:Number.isFinite(old)&&old>0?old:null};
  }
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
    return {classic:'קלאסי',levels:'שלבים',knockout:'נוקאאוט',survival:'הישרדות',sprint:'מרוץ זמן',versus:'שני שחקנים'}[mode]||'';
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
    const visible=Math.max(4,Math.min(10,count+4));
    const screenH=Math.max(420,window.innerHeight||700);

    for(let side=0;side<2;side++){
      for(let i=0;i<visible;i++){
        const coin=document.createElement('span');
        coin.className='side-coin '+(side===0?'from-left':'from-right');
        coin.textContent='🪙';
        coin.style.left=side===0?'-12px':'calc(100vw + 12px)';
        coin.style.top=(screenH*(.20+Math.random()*.34))+'px';
        const inward=(110+Math.random()*150)*(side===0?1:-1);
        coin.style.setProperty('--coin-x',inward+'px');
        coin.style.setProperty('--coin-y',(120+Math.random()*150)+'px');
        coin.style.setProperty('--coin-r',((Math.random()*560)-280)+'deg');
        coin.style.animationDelay=(i*55+Math.random()*110)+'ms';
        document.body.appendChild(coin);
        setTimeout(()=>coin.remove(),2450);
      }
    }

    const amount=document.createElement('span');
    amount.className='coin-amount side-total';
    amount.textContent='🪙 +'+count;
    amount.style.left='50vw';
    amount.style.top='58vh';
    document.body.appendChild(amount);
    setTimeout(()=>amount.remove(),1550);
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
    levelAssistUses=0;levelAssisted=false;
    versusCursor=[0,0];versusLocked=false;
    level=mode==='levels'?Math.min(profile.unlockedLevel,Math.max(1,Number(startLevel)||profile.unlockedLevel)):1;

    if(mode==='classic') time=cfg().classicTime;
    if(mode==='levels'){
      time=stageCfg(level).levelsTime;
      if(isBossLevel()) enterBoss(true);
    }
    if(mode==='knockout'){time=cfg().knockoutTime;knockoutTarget=cfg().knockoutTarget}
    if(mode==='survival') time=cfg().survivalStart;
    if(mode==='sprint') time=0;
    if(mode==='versus'){
      time=0;
      versusRound=0;
      versusLives=[3,3];
      versusStreak=[0,0];
      versusTarget=versusVariant==='race'?15:versusVariant==='combo'?5:10;
      if(versusVariant==='deck'){
        versusDeckOrder=shuffle(buildDeck());
        versusDeckIndex=1;
      }
    }
  }

  function startGame(nextMode,startLevel){
    configureMode(nextMode,startLevel);
    deck=shuffle(buildDeck());
    active=true;
    document.body.dataset.mode=mode;
    $('start').style.display='none';
    $('modeName').textContent=mode==='levels'?cfg().label:(modeLabel()+' · '+cfg().label);

    if(timer) clearInterval(timer);

    if(mode==='sprint'){
      sprintStartedAt=nowMs();
      time=0;
      timer=setInterval(()=>{
        if(!active) return;
        time=(nowMs()-sprintStartedAt)/1000;
        update();
      },100);
    }else if(mode!=='versus'){
      timer=setInterval(()=>{
        if(!active) return;
        time--;
        update();
        if(mode!=='sprint'&&time<=0) finishByTime();
      },1000);
    }

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

  function assistCost(){
    const base=8+(Math.floor((level-1)/4)*4);
    return bossActive?base*2:base;
  }
  function assistLimit(){return bossActive?1:2}
  function assistSkipAmount(){
    if(bossActive) return 1;
    return Math.max(1,Math.ceil(levelGoal()*.25));
  }
  function assistRemaining(){
    const goal=bossActive?bossGoal:levelGoal();
    const progress=bossActive?bossProgress:levelProgress;
    return Math.max(0,(goal-1)-progress);
  }
  function updateAssistButton(){
    const btn=$('levelAssistBtn');
    if(!btn) return;
    const amount=Math.min(assistSkipAmount(),assistRemaining());
    const cost=assistCost();
    const exhausted=levelAssistUses>=assistLimit()||amount<=0;
    const poor=profile.coins<cost;
    btn.disabled=exhausted||poor;
    btn.textContent=exhausted
      ? '🪙 אין עוד דילוגים בשלב'
      : poor
        ? '🪙 דילוג מקטע — צריך '+cost
        : '🪙 דלג +'+amount+' — '+cost+' מטבעות';
  }
  function buyLevelAssist(){
    if(mode!=='levels'||!active) return;
    const amount=Math.min(assistSkipAmount(),assistRemaining());
    const cost=assistCost();
    if(levelAssistUses>=assistLimit()||amount<=0){flash('צריך להשלים את סוף השלב לבד');updateAssistButton();return}
    if(profile.coins<cost){flash('אין מספיק מטבעות');updateAssistButton();return}

    profile.coins-=cost;
    saveProfile();
    levelAssistUses++;
    levelAssisted=true;

    if(bossActive) bossProgress+=amount;
    else levelProgress+=amount;

    flash('🛟 דילגת על '+amount+' התאמות · 🪙-'+cost);
    update();
    updateAssistButton();
  }

  function renderPlayerButtons(){
    const wrap=$('playerButtons');
    wrap.innerHTML='';

    if(mode==='levels'){
      const assist=document.createElement('button');
      assist.type='button';
      assist.id='levelAssistBtn';
      assist.className='action assist-btn';
      assist.addEventListener('click',buyLevelAssist);
      wrap.appendChild(assist);
      updateAssistButton();
      return;
    }

    if(mode==='versus'){
      const info=document.createElement('div');
      info.className='versus-live-help';
      info.innerHTML=
        '<span class="p1-help">🔵 1: '+keyLabel(versusKeys.p1.up)+keyLabel(versusKeys.p1.left)+keyLabel(versusKeys.p1.down)+keyLabel(versusKeys.p1.right)+' · '+keyLabel(versusKeys.p1.select)+'</span>'+
        '<span class="p2-help">🔴 2: '+keyLabel(versusKeys.p2.up)+keyLabel(versusKeys.p2.left)+keyLabel(versusKeys.p2.down)+keyLabel(versusKeys.p2.right)+' · '+keyLabel(versusKeys.p2.select)+'</span>';
      wrap.appendChild(info);
      return;
    }
  }
  function claimPlayer(p){
    claim=p;
  }

  function newRound(){
    if(!active) return;
    claim=null;
    if(mode==='versus'){
      versusLocked=false;
      versusCursor=[0,0];
      $('turn').textContent='מי מוצא ראשון? הזז את הסמן ולחץ בחירה';
    }else{
      $('turn').textContent='';
    }

    let a,b;
    if(mode==='versus'&&versusVariant==='deck'){
      if(versusDeckIndex>=versusDeckOrder.length){
        endVersusMatch();
        return;
      }
      a=versusDeckOrder[0];
      b=versusDeckOrder[versusDeckIndex++];
    }else{
      a=deck[Math.floor(Math.random()*deck.length)];
      do b=deck[Math.floor(Math.random()*deck.length)];while(b===a);
    }
    pair=[a,b];
    roundStartedAt=nowMs();
    render();
  }

  function render(){
    const board=$('board');
    board.innerHTML='';
    board.classList.toggle('versus-board',mode==='versus');
    const spin=rotating(),speed=spinSpeed();

    pair.forEach((card,cardIndex)=>{
      const el=document.createElement('div');
      el.className='card'+(bossActive?' boss-card':'')+(mode==='versus'?' versus-card player-'+(cardIndex+1):'');
      el.dataset.cardIndex=String(cardIndex);
      let zone=null;
      if(mode==='versus'){
        zone=document.createElement('section');
        zone.className='versus-player-zone player-'+(cardIndex+1);
        zone.innerHTML=liveAvatarHtml(cardIndex===0?'p1':'p2');
      }
      shuffle(card).forEach((id,i)=>{
        const p=spots[i],bt=document.createElement('button');
        bt.type='button';bt.className='sym';bt.style.left=p[0]+'%';bt.style.top=p[1]+'%';
        bt.style.fontSize=(36+Math.random()*18)+'px';bt.setAttribute('aria-label','סמל '+icons[id]);
        bt.dataset.symbolId=String(id);
        bt.dataset.slot=String(i);
        bt.dataset.cardIndex=String(cardIndex);

        const glyph=document.createElement('span');
        glyph.className='glyph'+(spin?' spinning':'');glyph.textContent=icons[id];
        if(spin){
          glyph.style.animationDuration=speed+'s';
          if((i+id)%2===0) glyph.style.animationDirection='reverse';
        }else glyph.style.transform='rotate('+(-25+Math.random()*50)+'deg)';

        bt.appendChild(glyph);
        bt.addEventListener('click',()=>{
          if(mode==='versus'){
            versusCursor[cardIndex]=i;
            updateVersusCursors();
            selectVersus(cardIndex);
          }else hit(id,bt);
        });
        el.appendChild(bt);
      });
      if(zone){zone.appendChild(el);board.appendChild(zone)}else board.appendChild(el);
    });
    if(mode==='versus') updateVersusCursors();
  }

  function cardSymbols(player){
    const card=$('board').querySelector('.card[data-card-index="'+player+'"]');
    return card?[...card.querySelectorAll('.sym')]:[];
  }

  function updateVersusCursors(){
    for(let p=0;p<2;p++){
      const symbols=cardSymbols(p);
      symbols.forEach((el,i)=>{
        el.classList.toggle(p===0?'cursor-p1':'cursor-p2',i===versusCursor[p]);
      });
    }
  }

  function moveVersusCursor(player,direction){
    if(mode!=='versus'||!active||versusLocked) return;
    const symbols=cardSymbols(player);
    if(!symbols.length) return;

    const card=$('board').querySelector('.card[data-card-index="'+player+'"]');
    if(!card) return;
    const cardRect=card.getBoundingClientRect();
    const centerX=cardRect.left+cardRect.width/2;
    const centerY=cardRect.top+cardRect.height/2;

    const points=symbols.map((el,index)=>{
      const r=el.getBoundingClientRect();
      const x=r.left+r.width/2;
      const y=r.top+r.height/2;
      const dx=x-centerX;
      const dy=y-centerY;
      return {
        index,
        dist:Math.hypot(dx,dy),
        angle:Math.atan2(dy,dx)
      };
    });

    const centerPoint=points.reduce((best,p)=>p.dist<best.dist?p:best,points[0]);

    if(direction==='up'||direction==='down'){
      versusCursor[player]=centerPoint.index;
      updateVersusCursors();
      return;
    }

    const ring=points
      .filter(p=>p.index!==centerPoint.index)
      .sort((a,b)=>a.angle-b.angle);

    if(!ring.length) return;

    const currentIndex=versusCursor[player];
    let ringPos=ring.findIndex(p=>p.index===currentIndex);

    if(ringPos<0){
      // From the center, re-enter the ring from the topmost symbol.
      ringPos=ring.reduce((bestPos,p,pos)=>{
        const best=ring[bestPos];
        const pScore=Math.abs(p.angle+Math.PI/2);
        const bestScore=Math.abs(best.angle+Math.PI/2);
        return pScore<bestScore?pos:bestPos;
      },0);
    }else{
      ringPos=direction==='right'
        ? (ringPos+1)%ring.length
        : (ringPos-1+ring.length)%ring.length;
    }

    versusCursor[player]=ring[ringPos].index;
    updateVersusCursors();
    avatarReact(player===0?'p1':'p2','focus',260);
  }

  function selectVersus(player){
    if(mode!=='versus'||!active||versusLocked) return;
    const symbols=cardSymbols(player);
    const selected=symbols[versusCursor[player]];
    if(!selected) return;
    const id=Number(selected.dataset.symbolId);
    const common=pair[0].find(x=>pair[1].includes(x));

    if(id===common){
      versusLocked=true;
      claim=player;
      versusRound++;
      versusStreak[player]++;
      versusStreak[1-player]=0;
      const points=(versusVariant==='gold'&&versusRound%5===0)?3:1;
      scores[player]+=points;
      selected.classList.add('versus-winner');
      avatarReact(player===0?'p1':'p2','win',700);
      flash((player===0?'🔵':'🔴')+' שחקן '+(player+1)+' ניצח בסיבוב!'+(points>1?' +'+points+' נק׳ ⭐':''));
      update();
      if(checkVersusEnd()) return;
      setTimeout(()=>{if(active&&mode==='versus')newRound()},650);
    }else{
      selected.classList.add('versus-wrong');
      avatarReact(player===0?'p1':'p2','wrong',520);
      versusStreak[player]=0;
      if(versusVariant==='knockout'){
        versusLives[player]=Math.max(0,versusLives[player]-1);
        flash((player===0?'🔵':'🔴')+' טעות — נשארו '+versusLives[player]+' חיים');
        update();
        if(versusLives[player]<=0){endVersusMatch(1-player);return;}
      }else if(versusVariant==='sudden'){
        flash('💥 טעות! שחקן '+(2-player)+' מנצח');
        endVersusMatch(1-player);
        return;
      }else{
        flash((player===0?'🔵':'🔴')+' לא זה — המשך לחפש');
      }
      setTimeout(()=>selected.classList.remove('versus-wrong'),280);
    }
  }

  function versusVariantLabel(){
    return {duel:'דו־קרב קלאסי',deck:'חפיסה מלאה',knockout:'נוקאאוט',race:'מרוץ ל־15',combo:'קומבו',sudden:'מוות פתאומי',gold:'קלף זהב'}[versusVariant]||'שני שחקנים';
  }

  function checkVersusEnd(){
    if(versusVariant==='deck'){
      if(versusDeckIndex>=versusDeckOrder.length){endVersusMatch();return true}
      return false;
    }
    if(versusVariant==='knockout') return false;
    if(versusVariant==='sudden'){endVersusMatch(claim);return true}
    if(versusVariant==='combo'){
      if(versusStreak[claim]>=versusTarget){endVersusMatch(claim);return true}
      return false;
    }
    const target=versusVariant==='race'?15:versusVariant==='gold'?15:10;
    if(scores[claim]>=target){endVersusMatch(claim);return true}
    return false;
  }

  function endVersusMatch(forcedWinner){
    if(!active) return;
    versusLocked=true;
    let winner=Number.isInteger(forcedWinner)?forcedWinner:null;
    if(winner===null&&scores[0]!==scores[1]) winner=scores[0]>scores[1]?0:1;
    const title=winner===null?'🤝 תיקו!':'🏆 שחקן '+(winner+1);
    let detail=scores[0]+' : '+scores[1];
    if(versusVariant==='deck') detail+=' · החפיסה הסתיימה';
    if(versusVariant==='knockout') detail+=' · חיים '+versusLives[0]+' : '+versusLives[1];
    if(versusVariant==='combo') detail+=' · רצף מנצח '+Math.max(...versusStreak);
    if(winner!==null) avatarReact(winner===0?'p1':'p2','champion',800);
    setTimeout(()=>{if(active)endGame(title,detail)},560);
  }

  function versusActionForCode(code){
    for(let p=0;p<2;p++){
      const keys=p===0?versusKeys.p1:versusKeys.p2;
      for(const action of ['up','down','left','right','select']){
        if(keys[action]===code) return {player:p,action};
      }
    }
    return null;
  }

  function handleVersusKeydown(event){
    if(mode!=='versus'||!active) return;
    const target=event.target;
    if(target&&/INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName)) return;
    const match=versusActionForCode(event.code);
    if(!match) return;
    event.preventDefault();
    if(event.repeat&&match.action==='select') return;

    if(match.action==='select') selectVersus(match.player);
    else moveVersusCursor(match.player,match.action);
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
    levelAssistUses=0;
    levelAssisted=false;
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
    levelAssistUses=0;
    levelAssisted=false;

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
    }else if(mode==='sprint'){
      if(matches>=sprintTarget){
        const elapsed=(nowMs()-sprintStartedAt)/1000;
        const result=saveSprintBest(elapsed,sprintTarget);
        const previous=result.previous;
        const comparison=previous
          ? (result.isBest?' · שיפרת ב־'+Math.max(0,previous-elapsed).toFixed(2)+' שנ׳!':' · השיא: '+previous.toFixed(2)+' שנ׳')
          : '';
        endGame(result.isBest?'🏆 שיא חדש!':'⏱️ סיום',elapsed.toFixed(2)+' שניות ל־'+sprintTarget+' הצלחות'+comparison);
        return false;
      }
      flash(rewardText(reward));
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
    }else if(mode==='sprint'){
      flash('✕ הקומבו נשבר');
    }else if(mode==='versus'){
      scores[claim]=Math.max(0,scores[claim]-1);
      flash('✕ טעות לשחקן '+(claim+1));
      claim=null;
      $('turn').textContent='מי מוצא ראשון?';
    }
  }

  function hit(id,sourceEl){
    if(!active) return;
    if(mode==='versus'){
      const common=pair[0].find(x=>pair[1].includes(x));
      if(id===common&&!versusLocked){
        versusLocked=true;
        scores[0]++;
        flash('✓ לחיצה על ההתאמה');
        update();
        setTimeout(()=>{if(active&&mode==='versus')newRound()},650);
      }
      return;
    }

    const common=pair[0].find(x=>pair[1].includes(x));
    if(id===common){
      const keepGoing=onCorrect(sourceEl);
      update();
      if(keepGoing!==false) newRound();
    }else{
      onWrong();
      update();
      if(mode!=='sprint'&&time<=0) finishByTime();
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
    if(mode==='sprint'){
      const sprintBest=getSprintBest();
      return sprintBest?'שיא: '+sprintBest.toFixed(2)+' שנ׳':'';
    }
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
    }else if(mode==='sprint'){
      s.innerHTML='<div class="pill">🎯 '+matches+'/'+sprintTarget+'</div><div class="pill">⏱️ '+time.toFixed(1)+'</div><div class="pill">🪙 '+profile.coins+'</div>'+(combo?'<div class="pill combo-pill">'+combo+'</div>':'');
    }else{
      let center='';
      if(versusVariant==='deck') center='<div class="pill">🃏 '+Math.max(0,versusDeckOrder.length-versusDeckIndex)+' נותרו</div>';
      else if(versusVariant==='knockout') center='<div class="pill">❤️ '+versusLives[0]+' : '+versusLives[1]+'</div>';
      else if(versusVariant==='combo') center='<div class="pill">🔥 '+versusStreak[0]+' : '+versusStreak[1]+'</div>';
      else center='<div class="pill">🎯 '+(versusVariant==='race'?15:versusVariant==='gold'?15:10)+'</div>';
      s.innerHTML='<div class="pill p1">🔵 '+scores[0]+'</div>'+center+'<div class="pill p2">🔴 '+scores[1]+'</div>';
    }

    const challenge=$('challengeText'),best=bestText();
    if(mode==='levels') updateAssistButton();
    if(mode==='levels'){
      const assistMark=levelAssisted?' · 🛟 נעזרת בדילוג':'';
      challenge.textContent=(bossActive?'👑 בוס שלב '+level+' — '+bossGoal+' התאמות':('שלב '+level+' מתוך '+MAX_STAGE+(best?' · '+best:'')))+assistMark;
    }else if(mode==='knockout'){
      challenge.textContent='השג '+knockoutTarget+' התאמות לפני שהזמן נגמר'+(best?' · '+best:'');
    }else if(mode==='survival'){
      challenge.textContent='כל הצלחה מוסיפה '+cfg().survivalBonus+' שניות'+(best?' · '+best:'');
    }else if(mode==='sprint'){
      const sprintBest=getSprintBest();
      challenge.textContent='השלם '+sprintTarget+' התאמות בזמן הקצר ביותר'+(sprintBest?' · השיא שלך '+sprintBest.toFixed(2)+' שנ׳':'');
    }else if(mode==='versus'){
      const details={duel:'הראשון ל־10 נקודות',deck:'כל החפיסה · בלי הגבלת זמן',knockout:'3 חיים לכל שחקן · טעות מורידה חיים',race:'הראשון ל־15 נקודות',combo:'הראשון שמגיע לרצף של 5',sudden:'סיבוב אחד · טעות אחת ואתה בחוץ',gold:'כל סיבוב חמישי שווה 3 נקודות'};
      challenge.textContent=versusVariantLabel()+' · '+details[versusVariant];
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
        <button type="button" class="mode-card sprint" data-open-sprint><b>⏱️ מרוץ זמן</b><small>5 / 10 / 15 הצלחות · שבור את השיא שלך</small></button>
        <button type="button" class="mode-card versus" data-open-versus><b>👥 שני שחקנים</b><small>שני סמנים · שתי מקלדות · הראשון שבוחר מנצח</small></button>
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

  function showSprintMenu(){
    const best5=getSprintBest(5);
    const best10=getSprintBest(10);
    const best15=getSprintBest(15);

    $('menuPanel').innerHTML=`
      <div class="submenu-head">
        <button type="button" class="action secondary" data-back-main>← חזור</button>
        <div>
          <h2>⏱️ מרוץ זמן</h2>
          <small>המטרה: כמה שפחות זמן</small>
        </div>
      </div>

      <div class="sprint-grid">
        <button type="button" class="sprint-card" data-sprint-target="5">
          <b>5 הצלחות</b>
          <span>${best5?('שיא '+best5.toFixed(2)+' שנ׳'):'אין שיא עדיין'}</span>
        </button>
        <button type="button" class="sprint-card" data-sprint-target="10">
          <b>10 הצלחות</b>
          <span>${best10?('שיא '+best10.toFixed(2)+' שנ׳'):'אין שיא עדיין'}</span>
        </button>
        <button type="button" class="sprint-card" data-sprint-target="15">
          <b>15 הצלחות</b>
          <span>${best15?('שיא '+best15.toFixed(2)+' שנ׳'):'אין שיא עדיין'}</span>
        </button>
      </div>

      <div class="score-rules">
        <b>🏁 איך זה עובד?</b>
        <span>השעון מתחיל ב־0 ועוצר כשמגיעים ליעד.</span>
        <small>אפשר לשחק שוב ושוב ולנסות לשפר את השיא הקודם.</small>
      </div>
    `;

    const panel=$('menuPanel');
    const back=panel.querySelector('[data-back-main]');
    if(back) back.addEventListener('click',restoreMenuMarkup);

    panel.querySelectorAll('[data-sprint-target]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        sprintTarget=Number(btn.dataset.sprintTarget)||5;
        startGame('sprint');
      });
    });
  }

  function showVersusMenu(){
    $('menuPanel').innerHTML=`
      <div class="submenu-head">
        <button type="button" class="action secondary" data-back-main>← חזור</button>
        <div><h2>⚔️ עולם שני שחקנים</h2><small>עולם תחרותי נפרד · בחרו את סוג הקרב</small></div>
      </div>
      <div class="mode-grid versus-world-grid">
        <button type="button" class="mode-card versus-world duel" data-versus-variant="duel"><b>⚔️ דו־קרב קלאסי</b><small>הראשון ל־10 נקודות</small></button>
        <button type="button" class="mode-card versus-world deck" data-versus-variant="deck"><b>🃏 חפיסה מלאה</b><small>כל החפיסה · ללא הגבלת זמן</small></button>
        <button type="button" class="mode-card versus-world knockout" data-versus-variant="knockout"><b>❤️ נוקאאוט</b><small>3 חיים · טעות מורידה חיים</small></button>
        <button type="button" class="mode-card versus-world race" data-versus-variant="race"><b>🏁 מרוץ ל־15</b><small>מי מגיע ראשון ליעד</small></button>
        <button type="button" class="mode-card versus-world combo" data-versus-variant="combo"><b>🔥 קומבו</b><small>הראשון לרצף של 5 הצלחות</small></button>
        <button type="button" class="mode-card versus-world sudden" data-versus-variant="sudden"><b>💥 מוות פתאומי</b><small>סיבוב אחד · טעות אחת ואתה בחוץ</small></button>
        <button type="button" class="mode-card versus-world gold" data-versus-variant="gold"><b>⭐ קלף זהב</b><small>כל סיבוב חמישי שווה 3 נקודות</small></button>
      </div>
      <div class="score-rules compact-rules">
        <b>🎮 איך משחקים?</b>
        <span>לכל שחקן סמן נפרד על הקלף שלו. שחקן 1 בצד ימין, שחקן 2 בצד שמאל.</span>
        <small>אחרי בחירת מצב מגדירים מקשים ומתחילים.</small>
      </div>
    `;
    const panel=$('menuPanel');
    panel.querySelector('[data-back-main]').addEventListener('click',restoreMenuMarkup);
    panel.querySelectorAll('[data-versus-variant]').forEach(btn=>btn.addEventListener('click',()=>showVersusSetup(btn.dataset.versusVariant)));
  }

  function showVersusSetup(variant){
    versusVariant=variant||'duel';
    $('menuPanel').innerHTML=`
      <div class="submenu-head">
        <button type="button" class="action secondary" data-back-versus>← למצבי המשחק</button>
        <div><h2>👥 ${versusVariantLabel()}</h2><small>שחקן 1 ימין · שחקן 2 שמאל</small></div>
      </div>
      <div class="versus-setup">
        <section class="key-player p1-setup">
          <h3>🔵 שחקן 1 — ימין</h3>
          ${avatarSetupHtml('p1')}
          <div class="key-grid">${keyBindingButtons('p1')}</div>
        </section>
        <section class="key-player p2-setup">
          <h3>🔴 שחקן 2 — שמאל</h3>
          ${avatarSetupHtml('p2')}
          <div class="key-grid">${keyBindingButtons('p2')}</div>
        </section>
      </div>
      <p class="menu-note">ברירת מחדל: שחקן 1 — חצים + Enter · שחקן 2 — WASD + רווח</p>
      <div class="modes">
        <button type="button" class="action primary big" data-start-versus>▶ התחל</button>
        <button type="button" class="action secondary" data-reset-keys>איפוס מקשים</button>
      </div>
    `;
    const panel=$('menuPanel');
    panel.querySelector('[data-back-versus]').addEventListener('click',showVersusMenu);
    panel.querySelector('[data-start-versus]').addEventListener('click',()=>startGame('versus'));
    panel.querySelector('[data-reset-keys]').addEventListener('click',()=>{versusKeys=defaultVersusKeys();saveVersusKeys();showVersusSetup(versusVariant);});
    panel.querySelectorAll('[data-key-player][data-key-action]').forEach(btn=>btn.addEventListener('click',()=>captureVersusKey(btn)));
    panel.querySelectorAll('[data-change-avatar]').forEach(btn=>btn.addEventListener('click',()=>showAvatarPicker(btn.dataset.changeAvatar)));
  }

  function showAvatarPicker(player,category='all'){
    const num=player==='p1'?1:2;
    const current=avatarById(versusAvatars[player]);
    const visible=category==='all'?AVATAR_CATALOG:AVATAR_CATALOG.filter(a=>a.category===category);
    const categoryButtons=Object.entries(AVATAR_CATEGORIES).map(([key,label])=>
      '<button type="button" class="avatar-category'+(key===category?' active':'')+'" data-avatar-category="'+key+'">'+label+'</button>'
    ).join('');
    const avatars=visible.map(a=>
      '<button type="button" class="avatar-option'+(a.id===current.id?' selected':'')+'" data-avatar-id="'+a.id+'">'+
        '<span class="avatar-glyph">'+a.glyph+'</span><small>'+a.label+'</small>'+
      '</button>'
    ).join('');

    $('menuPanel').innerHTML=`
      <div class="submenu-head">
        <button type="button" class="action secondary" data-back-avatar>← חזור</button>
        <div><h2>בחר אווטר — שחקן ${num}</h2><small>האוואטר נשמר אוטומטית לפעם הבאה</small></div>
      </div>
      <div class="avatar-picker-current ${player}-avatar">
        <span class="avatar-glyph">${current.glyph}</span>
        <div><b>${current.label}</b><small>${AVATAR_CATEGORIES[current.category]}</small></div>
        <button type="button" class="action secondary" data-random-avatar>🎲 אקראי</button>
      </div>
      <div class="avatar-picker-categories">${categoryButtons}</div>
      <div class="avatar-picker-grid">${avatars}</div>
    `;

    const panel=$('menuPanel');
    panel.querySelector('[data-back-avatar]').addEventListener('click',()=>showVersusSetup(versusVariant));
    panel.querySelector('[data-random-avatar]').addEventListener('click',()=>{
      const choices=AVATAR_CATALOG.filter(a=>a.id!==versusAvatars[player]);
      const pick=choices[Math.floor(Math.random()*choices.length)];
      versusAvatars[player]=pick.id;saveVersusAvatars();showAvatarPicker(player,category);
    });
    panel.querySelectorAll('[data-avatar-category]').forEach(btn=>btn.addEventListener('click',()=>showAvatarPicker(player,btn.dataset.avatarCategory)));
    panel.querySelectorAll('[data-avatar-id]').forEach(btn=>btn.addEventListener('click',()=>{
      versusAvatars[player]=btn.dataset.avatarId;
      saveVersusAvatars();
      showVersusSetup(versusVariant);
    }));
  }

  function keyBindingButtons(player){
    const labels={up:'למעלה',down:'למטה',left:'שמאלה',right:'ימינה',select:'בחירה'};
    return ['up','left','down','right','select'].map(action=>
      '<button type="button" class="key-bind" data-key-player="'+player+'" data-key-action="'+action+'">'+
      '<span>'+labels[action]+'</span><b>'+keyLabel(versusKeys[player][action])+'</b></button>'
    ).join('');
  }

  function codeInUse(code,exceptPlayer,exceptAction){
    for(const player of ['p1','p2']){
      for(const action of ['up','down','left','right','select']){
        if(player===exceptPlayer&&action===exceptAction) continue;
        if(versusKeys[player][action]===code) return true;
      }
    }
    return false;
  }

  function captureVersusKey(btn){
    const player=btn.dataset.keyPlayer,action=btn.dataset.keyAction;
    const old=btn.innerHTML;
    btn.classList.add('listening');
    btn.innerHTML='<span>לחץ מקש…</span><b>⌨️</b>';

    const handler=event=>{
      event.preventDefault();
      event.stopPropagation();
      document.removeEventListener('keydown',handler,true);

      if(event.code==='Escape'){
        btn.classList.remove('listening');
        btn.innerHTML=old;
        return;
      }

      if(codeInUse(event.code,player,action)){
        btn.classList.remove('listening');
        btn.innerHTML=old;
        flash('המקש הזה כבר בשימוש');
        return;
      }

      versusKeys[player][action]=event.code;
      saveVersusKeys();
      showVersusSetup(versusVariant);
    };
    document.addEventListener('keydown',handler,true);
  }

  function bindMenuControls(){
    const panel=$('menuPanel');

    panel.querySelectorAll('[data-mode]').forEach(btn=>{
      btn.addEventListener('click',()=>startGame(btn.dataset.mode));
    });

    const levels=panel.querySelector('[data-open-levels]');
    if(levels) levels.addEventListener('click',showLevelsMenu);

    const sprint=panel.querySelector('[data-open-sprint]');
    if(sprint) sprint.addEventListener('click',showSprintMenu);

    const versus=panel.querySelector('[data-open-versus]');
    if(versus) versus.addEventListener('click',showVersusMenu);

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
    delete document.body.dataset.mode;
    restoreMenuMarkup();
    $('start').style.display='grid';
  }

  function bindStaticControls(){
    $('shuffleBtn').addEventListener('click',newRound);
    $('menuBtn').textContent='← חזור';
    $('menuBtn').addEventListener('click',showMenu);
    document.addEventListener('keydown',handleVersusKeydown);
  }

  deck=buildDeck();
  bindStaticControls();
  restoreMenuMarkup();
  document.documentElement.dataset.doubleReady='1';
})();