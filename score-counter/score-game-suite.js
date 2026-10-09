(function(){
  'use strict';

  const STORAGE={
    session:'teamScoreSuite.session',
    prefs:'teamScoreSuite.preferences',
    history:'teamScoreSuite.history',
    presets:'teamScoreSuite.presets',
    favorites:'teamScoreSuite.favorites',
    rosters:'teamScoreSuite.rosters',
    players:'teamScoreSuite.players'
  };

  const VOICE_PROFILES={
    coach:{label:'Coach',rate:1.02,pitch:0.96,volume:1},
    arena:{label:'Arena Announcer',rate:0.82,pitch:0.62,volume:1},
    calm:{label:'Calm',rate:0.9,pitch:1,volume:0.92},
    hype:{label:'Hype',rate:1.08,pitch:0.88,volume:1}
  };

  const COUNTDOWN_WORDS=['Ten', 'Nine', 'Eight', 'Seven', 'Six', 'Five', 'Four', 'Three', 'Two', 'One'];

  const TEAM_SCORE_SUITE_MODES=[
    ['free-score','Free Score','ניקוד חופשי'],
    ['first-to-x','First to X','ראשון ליעד'],
    ['win-by-2','Win by 2','יעד עם הפרש 2'],
    ['timed-game','Timed Game','מנצחת לפי התוצאה בסיום הזמן'],
    ['timed-overtime','Timed + Overtime','זמן + הארכה'],
    ['best-of-sets','Best of Sets','הטוב מ-3/5'],
    ['timed-rounds','Timed Rounds','זמן נפרד לכל קבוצה וסבבים'],
    ['pressure-game','Pressure Game','מתחילים מתוצאה שנבחרה מראש'],
    ['target-chase','Target Chase','קבוצה אחת מציבה יעד והשנייה רודפת'],
    ['streak-challenge','Streak Challenge','רצף הצלחות'],
    ['comeback-challenge','Comeback Challenge','תרחיש קאמבק מפיגור'],
    ['sideout-challenge','Sideout Challenge','תרגול קבלה ו-Sideout'],
    ['serve-pressure','Serve Pressure','סרבים תחת לחץ'],
    ['training-mode','Training Mode','הצלחות/טעויות ללא מנצחת חובה'],
    ['race-challenge','Race / Challenge','מירוץ לכמות הצלחות'],
    ['random-challenge','Surprise Me','תרחיש אקראי'],
    ['team-battle','Team Battle','דו-קרב קבוצות מלא'],
    ['king-rotation','King Rotation','המנצחת נשארת'],
    ['elimination','Elimination','חיים והדחות'],
    ['countdown-target','Countdown Target','להשיג יעד לפני סוף הזמן'],
    ['tournament','Tournament','טורניר פנימי'],
    ['custom-game','Custom Game Builder','בונה משחקים'],
    ['four-team-rotation','4 Teams Rotation','ב-10: rank 1 + rank 4 מול rank 2 + rank 3, עד 20'],
    ['spiegel','שפיגל / מלך התחתיות','נקודות רעות לשחקנים'],
    ['weighted-drill','Weighted Drill','ניקוד שונה לפי איכות פעולה'],
    ['player-tracking','Player Tracking','סטטיסטיקה אישית בתוך משחק קבוצתי'],
    ['multi-team','Multi-Team','משחקים עם מספר קבוצות'],
    ['individual-challenge','Individual Challenge','אתגר שחקנים אישי']
  ].map(([id,name,description])=>({id,name,description}));

  const MODE_DEFAULTS={
    'first-to-x':{target:25,winBy2:false},
    'win-by-2':{target:25,winBy2:true},
    'timed-game':{duration:180000},
    'timed-overtime':{duration:180000,overtime:true},
    'best-of-sets':{sets:3,target:25,finalTarget:15,winBy2:true},
    'timed-rounds':{duration:180000,rounds:2,breakMs:5000,winnerBy:'total',tiebreakMs:60000},
    'pressure-game':{scoreA:22,scoreB:22,target:25,winBy2:true,context:'set'},
    'target-chase':{duration:120000,targetMode:'first-team-plus-one'},
    'streak-challenge':{streakTarget:3},
    'comeback-challenge':{scoreA:18,scoreB:22,target:25,winBy2:true},
    'serve-pressure':{attempts:10,errorValue:0},
    'elimination':{lives:5},
    'countdown-target':{target:10,duration:120000,adaptive:false},
    'four-team-rotation':{midpoint:10,target:20,firstToTenTriggered:false},
    'spiegel':{eliminationThreshold:5,badPoints:true},
    'race-challenge':{target:10},
    'weighted-drill':{perfect:3,good:2,playable:1,error:-1}
  };

  const safeParse=(raw,fallback)=>{try{return JSON.parse(raw)}catch(_){return fallback}};
  const readStore=(key,fallback)=>safeParse(localStorage.getItem(key)||'',fallback);
  const writeStore=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const nowWall=()=>Date.now();
  const nowMono=()=>performance.now();

  let prefs=Object.assign({voiceProfile:'coach',voiceEnabled:true,countdownMode:'10',volume:1,court:false},readStore(STORAGE.prefs,{}));
  let session=readStore(STORAGE.session,null);
  let undoStack=[];
  let redoStack=[];
  let wakeLock=null;
  let naturalVoice=null;
  let launcher=null;
  let sheet=null;
  let activePanel=null;

  function savePrefs(){writeStore(STORAGE.prefs,prefs)}
  function saveSession(){if(session)writeStore(STORAGE.session,session);else localStorage.removeItem(STORAGE.session)}
  function historyPush(entry){
    const items=readStore(STORAGE.history,[]);
    items.unshift(Object.assign({id:uid(),at:new Date().toISOString()},entry));
    writeStore(STORAGE.history,items.slice(0,100));
  }

  function formatClock(ms){
    ms=Math.max(0,Number(ms)||0);
    const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function naturalVoiceScore(v){
    const n=(v.name||'').toLowerCase();
    let score=0;
    if(/^en(-|_)/i.test(v.lang||'')) score+=40;
    if(/google|microsoft|samantha|daniel|serena|ava|aria|jenny|guy|neural|natural|premium|enhanced/.test(n)) score+=50;
    if(/compact|espeak|festival|robot/.test(n)) score-=80;
    if(v.localService) score+=6;
    return score;
  }

  function refreshNaturalVoice(){
    if(!('speechSynthesis' in window)) return null;
    const voices=speechSynthesis.getVoices().filter(v=>/^en(-|_)/i.test(v.lang||''));
    voices.sort((a,b)=>naturalVoiceScore(b)-naturalVoiceScore(a));
    naturalVoice=voices.find(v=>naturalVoiceScore(v)>=45)||null;
    return naturalVoice;
  }

  function beep(kind){
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      const c=new C(),o=c.createOscillator(),g=c.createGain();
      o.frequency.value=kind==='finish'?820:620;g.gain.value=.05;
      o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+(kind==='finish'?.22:.09));
      o.onended=()=>c.close().catch(()=>{});
    }catch(_){ }
  }

  function announceVisual(text){
    let el=document.querySelector('.score-suite-announce');
    if(!el){el=document.createElement('div');el.className='score-suite-announce';document.body.appendChild(el)}
    el.textContent=text;el.classList.add('show');
    clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1600);
  }

  const announcer={
    say(text,priority){
      if(!text)return;
      announceVisual(text);
      if(!prefs.voiceEnabled){if(priority==='finish')beep('finish');return}
      const voice=naturalVoice||refreshNaturalVoice();
      if(!voice || !('speechSynthesis' in window)){beep(priority==='finish'?'finish':'tick');return}
      try{
        if(priority==='high')speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(text);
        const p=VOICE_PROFILES[prefs.voiceProfile]||VOICE_PROFILES.coach;
        u.voice=voice;u.lang='en-US';u.rate=p.rate;u.pitch=p.pitch;u.volume=clamp(prefs.volume*p.volume,0,1);
        speechSynthesis.speak(u);
      }catch(_){beep(priority==='finish'?'finish':'tick')}
    },
    countdown(seconds,onDone){
      let left=Math.max(0,Math.floor(seconds));
      if(!left){onDone&&onDone();return}
      const tick=()=>{
        if(left<=0){announcer.say('Go!','high');onDone&&onDone();return}
        const word=left<=10?COUNTDOWN_WORDS[10-left]:String(left);
        announcer.say(word,left<=3?'high':'normal');left--;setTimeout(tick,1000);
      };tick();
    }
  };

  if('speechSynthesis' in window){refreshNaturalVoice();speechSynthesis.onvoiceschanged=refreshNaturalVoice}

  async function requestWakeLock(){
    try{if('wakeLock' in navigator&&!wakeLock)wakeLock=await navigator.wakeLock.request('screen')}catch(_){ }
  }
  function releaseWakeLock(){try{wakeLock&&wakeLock.release()}catch(_){ }wakeLock=null}

  function teamCards(){
    const teams=document.getElementById('teams');
    if(!teams)return[];
    return Array.from(teams.children).filter(el=>el.nodeType===1).map((card,index)=>{
      const nameNode=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h2,h3,strong');
      const scoreNode=card.querySelector('.score-board-value,.score-value,.team-score,.score-number,[data-role="score"]');
      const numberCandidate=scoreNode||Array.from(card.querySelectorAll('*')).find(el=>/^\d+$/.test((el.textContent||'').trim())&&!el.closest('button'));
      return {index,card,name:(nameNode&&nameNode.textContent||`Team ${index+1}`).trim(),score:Number(numberCandidate&&numberCandidate.textContent||0)||0,scoreNode:numberCandidate,voiceAlias:card.dataset.voiceAlias||''};
    });
  }

  function teamPhrase(team){return (team&&team.voiceAlias)||(team&&team.name)||'Team'}
  function snapshotTeams(){return teamCards().map(t=>({name:t.name,score:t.score,voiceAlias:t.voiceAlias}))}

  function setTeamScore(index,value){
    const t=teamCards()[index];if(!t)return false;
    const before=t.score;value=Math.max(0,Number(value)||0);
    const plus=Array.from(t.card.querySelectorAll('button')).find(b=>/^\+?1$/.test((b.textContent||'').trim())||/הוסף|plus|increment/i.test(b.getAttribute('aria-label')||''));
    const minus=Array.from(t.card.querySelectorAll('button')).find(b=>/^-1$/.test((b.textContent||'').trim())||/הפחת|minus|decrement/i.test(b.getAttribute('aria-label')||''));
    const delta=value-before,button=delta>0?plus:minus;
    if(button&&Math.abs(delta)<=50){for(let i=0;i<Math.abs(delta);i++)button.click();return true}
    if(t.scoreNode){t.scoreNode.textContent=String(value);return true}
    return false;
  }

  function action(label,doFn,undoFn){doFn();undoStack.push({label,undo:undoFn,redo:doFn});redoStack=[];renderActiveState()}
  function undo(){const a=undoStack.pop();if(!a)return;a.undo();redoStack.push(a);renderActiveState()}
  function redo(){const a=redoStack.pop();if(!a)return;a.redo();undoStack.push(a);renderActiveState()}

  const timerState={mode:'stopwatch',running:false,baseMs:0,durationMs:300000,startedWall:0,startedMono:0,interval:{workMs:40000,restMs:20000,rounds:8,round:1,phase:'work',startDelayMs:0},laps:[],overtime:false,lastAnnounced:null};

  function timerCurrent(){
    if(!timerState.running)return timerState.baseMs;
    const elapsed=Math.max(0,nowWall()-timerState.startedWall);
    if(timerState.mode==='stopwatch')return timerState.baseMs+elapsed;
    return Math.max(0,timerState.baseMs-elapsed);
  }
  function timerStart(){if(timerState.running)return;if(timerState.mode!=='stopwatch'&&timerState.baseMs<=0)timerState.baseMs=timerState.durationMs;timerState.startedWall=nowWall();timerState.startedMono=nowMono();timerState.running=true;requestWakeLock();persistTimer()}
  function timerPause(){if(!timerState.running)return;timerState.baseMs=timerCurrent();timerState.running=false;releaseWakeLock();persistTimer()}
  function timerReset(){timerState.running=false;timerState.baseMs=timerState.mode==='stopwatch'?0:timerState.durationMs;timerState.laps=[];timerState.interval.round=1;timerState.interval.phase='work';releaseWakeLock();persistTimer();renderTimerEnhancer()}
  function timerAdjust(delta){timerState.baseMs=Math.max(0,timerCurrent()+delta);timerState.startedWall=nowWall();persistTimer();renderTimerEnhancer()}
  function timerLap(){timerState.laps.push({at:new Date().toISOString(),ms:timerCurrent()});persistTimer();renderTimerEnhancer()}
  function persistTimer(){writeStore('teamScoreSuite.timer',timerState)}

  function restoreTimer(){const saved=readStore('teamScoreSuite.timer',null);if(!saved)return;Object.assign(timerState,saved);if(timerState.running){const elapsed=Math.max(0,nowWall()-timerState.startedWall);timerState.baseMs=timerState.mode==='stopwatch'?timerState.baseMs+elapsed:Math.max(0,timerState.baseMs-elapsed);timerState.startedWall=nowWall()}}

  function timerTick(){
    const value=timerCurrent();
    if(timerState.running&&timerState.mode!=='stopwatch'){
      const sec=Math.ceil(value/1000);
      if(sec<=10&&sec>=1&&timerState.lastAnnounced!==sec&&(prefs.countdownMode==='10'||(prefs.countdownMode==='3'&&sec<=3))){timerState.lastAnnounced=sec;announcer.say(COUNTDOWN_WORDS[10-sec]||String(sec),sec<=3?'high':'normal')}
      if(value<=0){timerState.running=false;timerState.baseMs=0;timerState.lastAnnounced=null;if(timerState.mode==='intervals')advanceInterval();else announcer.say('Time!','finish');releaseWakeLock();persistTimer()}
    }
    renderTimerEnhancer();
  }

  function advanceInterval(){
    const it=timerState.interval;
    if(it.phase==='work'){it.phase='rest';timerState.durationMs=it.restMs;timerState.baseMs=it.restMs;announcer.say('Rest.','high')}
    else if(it.round<it.rounds){it.round++;it.phase='work';timerState.durationMs=it.workMs;timerState.baseMs=it.workMs;announcer.say(`Round ${it.round}. Work.`,'high')}
    else{announcer.say('Finished.','finish');return}
    timerStart();
  }

  function installTimerEnhancer(){
    const bar=document.querySelector('.score-live-timer');if(!bar||bar.dataset.suiteUpgraded)return;
    bar.dataset.suiteUpgraded='1';
    const more=document.createElement('button');more.type='button';more.className='score-suite-timer-more';more.textContent='⚙';more.setAttribute('aria-label','אפשרויות טיימר מתקדמות');more.addEventListener('click',e=>{e.stopPropagation();openTimerPanel()});bar.appendChild(more);
    const quick=document.createElement('div');quick.className='score-suite-timer-quick';quick.innerHTML='<button data-add="10000">+10s</button><button data-add="30000">+30s</button><button data-add="60000">+1m</button><button data-suite-lap>LAP</button>';quick.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;if(b.dataset.add)timerAdjust(Number(b.dataset.add));else if(b.hasAttribute('data-suite-lap'))timerLap()});bar.appendChild(quick);
  }

  function renderTimerEnhancer(){
    const panel=document.querySelector('.score-suite-timer-panel');if(!panel)return;
    const display=panel.querySelector('[data-suite-time]');if(display)display.textContent=formatClock(timerCurrent());
    const phase=panel.querySelector('[data-suite-phase]');if(phase)phase.textContent=timerState.mode==='intervals'?`${timerState.interval.phase.toUpperCase()} · ROUND ${timerState.interval.round}/${timerState.interval.rounds}`:timerState.mode.toUpperCase();
    const play=panel.querySelector('[data-suite-play]');if(play)play.textContent=timerState.running?'⏸ Pause':'▶ Start';
    const laps=panel.querySelector('[data-suite-laps]');if(laps)laps.innerHTML=timerState.laps.slice(-8).map((l,i)=>`<div>Lap ${Math.max(1,timerState.laps.length-7+i)}: ${formatClock(l.ms)}</div>`).join('');
  }

  function openTimerPanel(){
    closeSheet();const p=document.createElement('div');p.className='score-suite-sheet score-suite-timer-panel';p.innerHTML=`<div class="score-suite-sheet-head"><strong>⏱ Time Center</strong><button data-close>✕</button></div><div class="score-suite-tabs"><button data-tmode="stopwatch">Stopwatch</button><button data-tmode="timer">Timer</button><button data-tmode="intervals">Intervals</button></div><div class="score-suite-clock" data-suite-time>00:00</div><div class="score-suite-phase" data-suite-phase></div><div class="score-suite-actions"><button data-suite-play>▶ Start</button><button data-suite-reset>↺ Reset</button><button data-suite-lap>Lap</button></div><div class="score-suite-actions small"><button data-add="10000">+10s</button><button data-add="30000">+30s</button><button data-add="60000">+1m</button><button data-add="-10000">−10s</button></div><div class="score-suite-form"><label>Timer minutes <input type="number" min="0" max="999" data-minutes value="${Math.floor(timerState.durationMs/60000)}"></label><label>Work sec <input type="number" min="1" data-work value="${Math.round(timerState.interval.workMs/1000)}"></label><label>Rest sec <input type="number" min="0" data-rest value="${Math.round(timerState.interval.restMs/1000)}"></label><label>Rounds <input type="number" min="1" max="99" data-rounds value="${timerState.interval.rounds}"></label><label>Start delay <select data-delay><option>0</option><option>3</option><option>5</option><option>10</option></select></label></div><div class="score-suite-laps" data-suite-laps></div>`;document.body.appendChild(p);sheet=p;
    p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))return closeSheet();if(b.dataset.tmode){timerPause();timerState.mode=b.dataset.tmode;timerState.baseMs=timerState.mode==='stopwatch'?0:timerState.durationMs;persistTimer();renderTimerEnhancer()}if(b.hasAttribute('data-suite-play')){if(timerState.running)timerPause();else{syncTimerInputs(p);const d=Number(p.querySelector('[data-delay]').value)||0;d?announcer.countdown(d,timerStart):timerStart()}renderTimerEnhancer()}if(b.hasAttribute('data-suite-reset'))timerReset();if(b.hasAttribute('data-suite-lap'))timerLap();if(b.dataset.add)timerAdjust(Number(b.dataset.add))});renderTimerEnhancer();
  }

  function syncTimerInputs(p){
    const mins=Math.max(0,Number(p.querySelector('[data-minutes]').value)||0);timerState.durationMs=mins*60000;timerState.interval.workMs=Math.max(1000,(Number(p.querySelector('[data-work]').value)||40)*1000);timerState.interval.restMs=Math.max(0,(Number(p.querySelector('[data-rest]').value)||20)*1000);timerState.interval.rounds=Math.max(1,Number(p.querySelector('[data-rounds]').value)||8);if(timerState.mode==='timer')timerState.baseMs=timerState.durationMs;if(timerState.mode==='intervals'){timerState.durationMs=timerState.interval.workMs;timerState.baseMs=timerState.interval.workMs;timerState.interval.phase='work';timerState.interval.round=1}persistTimer();
  }

  function modeById(id){return TEAM_SCORE_SUITE_MODES.find(m=>m.id===id)}
  function favorites(){return readStore(STORAGE.favorites,[])}
  function toggleFavorite(id){const f=favorites(),i=f.indexOf(id);i>=0?f.splice(i,1):f.push(id);writeStore(STORAGE.favorites,f);renderModeGrid()}

  function installLauncher(){if(document.querySelector('.score-suite-launcher'))return;launcher=document.createElement('button');launcher.type='button';launcher.className='score-suite-launcher';launcher.innerHTML='🎮 <span>משחקים</span>';launcher.addEventListener('click',openGameSheet);document.body.appendChild(launcher)}

  function openGameSheet(){
    closeSheet();const p=document.createElement('div');p.className='score-suite-sheet score-suite-games';p.innerHTML=`<div class="score-suite-sheet-head"><strong>🎮 Game Suite</strong><div><button data-court>${prefs.court?'Court ✓':'Court'}</button><button data-close>✕</button></div></div><div class="score-suite-toolbar"><button data-surprise>🎲 Surprise Me</button><button data-timer>⏱ Time Center</button><button data-history>🕘 History</button><button data-roster>👥 Rosters</button></div><div class="score-suite-voice"><label>Voice <select data-voice>${Object.entries(VOICE_PROFILES).map(([k,v])=>`<option value="${k}" ${prefs.voiceProfile===k?'selected':''}>${v.label}</option>`).join('')}</select></label><button data-preview>🔊 Preview</button><button data-mute>${prefs.voiceEnabled?'🔊':'🔇'}</button></div><div class="score-suite-mode-grid" data-mode-grid></div>`;document.body.appendChild(p);sheet=p;renderModeGrid();
    p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))closeSheet();else if(b.hasAttribute('data-timer'))openTimerPanel();else if(b.hasAttribute('data-surprise'))startMode(TEAM_SCORE_SUITE_MODES[Math.floor(Math.random()*TEAM_SCORE_SUITE_MODES.length)].id);else if(b.hasAttribute('data-preview'))announcer.say('Brenner takes the lead.','high');else if(b.hasAttribute('data-mute')){prefs.voiceEnabled=!prefs.voiceEnabled;savePrefs();b.textContent=prefs.voiceEnabled?'🔊':'🔇'}else if(b.hasAttribute('data-court')){prefs.court=!prefs.court;savePrefs();document.body.classList.toggle('score-suite-court',prefs.court);b.textContent=prefs.court?'Court ✓':'Court'}else if(b.dataset.favorite)toggleFavorite(b.dataset.favorite);else if(b.dataset.mode)startMode(b.dataset.mode);else if(b.hasAttribute('data-history'))openHistory();else if(b.hasAttribute('data-roster'))openRosters()});p.addEventListener('change',e=>{if(e.target.matches('[data-voice]')){prefs.voiceProfile=e.target.value;savePrefs()}});
  }

  function renderModeGrid(){const grid=document.querySelector('[data-mode-grid]');if(!grid)return;const f=favorites();grid.innerHTML=TEAM_SCORE_SUITE_MODES.map(m=>`<article class="score-suite-mode"><button class="score-suite-star" data-favorite="${m.id}" aria-label="מועדף">${f.includes(m.id)?'★':'☆'}</button><button class="score-suite-mode-main" data-mode="${m.id}"><strong>${m.name}</strong><span>${m.description}</span></button></article>`).join('')}
  function closeSheet(){if(sheet&&sheet.isConnected)sheet.remove();sheet=null;activePanel=null}
  function defaultsFor(id){return JSON.parse(JSON.stringify(MODE_DEFAULTS[id]||{}))}

  function startMode(id){
    const mode=modeById(id);if(!mode)return;const teams=snapshotTeams();session={id:uid(),mode:id,modeName:mode.name,startedAt:new Date().toISOString(),teams,config:defaultsFor(id),state:{},events:[]};if(id==='four-team-rotation')session.state.firstToTenTriggered=false;if(id==='spiegel')session.state.players=[];saveSession();const recent=readStore('teamScoreSuite.recent',[]).filter(x=>x!==id);recent.unshift(id);writeStore('teamScoreSuite.recent',recent.slice(0,10));openModeSetup(id)
  }

  function openModeSetup(id){closeSheet();const mode=modeById(id),cfg=session&&session.mode===id?session.config:defaultsFor(id);const p=document.createElement('div');p.className='score-suite-sheet score-suite-active';p.innerHTML=`<div class="score-suite-sheet-head"><strong>${mode.name}</strong><button data-close>✕</button></div>${setupHtml(id,cfg)}<div class="score-suite-actions"><button data-begin>START GAME</button><button data-fav>☆ Favorite</button></div>`;document.body.appendChild(p);sheet=p;activePanel=p;p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))closeSheet();else if(b.hasAttribute('data-begin'))beginConfiguredGame(id,p);else if(b.hasAttribute('data-fav'))toggleFavorite(id)})}

  function setupHtml(id,cfg){
    const num=(label,key,val,min=0)=>`<label>${label}<input type="number" min="${min}" data-cfg="${key}" value="${val}"></label>`;let fields='';
    if(id==='timed-rounds')fields=num('Minutes each','durationMinutes',(cfg.duration||180000)/60000,1)+num('Rounds','rounds',cfg.rounds||2,1)+num('Transition sec','breakSeconds',(cfg.breakMs||5000)/1000,0);
    else if(id==='pressure-game'||id==='comeback-challenge')fields=num('Team A start','scoreA',cfg.scoreA||0)+num('Team B start','scoreB',cfg.scoreB||0)+num('Target','target',cfg.target||25,1)+`<label><input type="checkbox" data-cfg="winBy2" ${cfg.winBy2?'checked':''}> Win by 2</label>`;
    else if(id==='first-to-x'||id==='win-by-2'||id==='race-challenge')fields=num('Target','target',cfg.target||10,1);
    else if(id==='timed-game'||id==='timed-overtime'||id==='countdown-target')fields=num('Minutes','durationMinutes',(cfg.duration||120000)/60000,1)+num('Target','target',cfg.target||10,1);
    else if(id==='streak-challenge')fields=num('Streak target','streakTarget',cfg.streakTarget||3,2);
    else if(id==='elimination')fields=num('Lives','lives',cfg.lives||5,1);
    else if(id==='serve-pressure')fields=num('Attempts','attempts',cfg.attempts||10,1);
    else if(id==='four-team-rotation')fields=num('Re-rank at','midpoint',cfg.midpoint||10,1)+num('Finish at','target',cfg.target||20,1);
    else if(id==='spiegel')fields=num('Bad points to eliminate','eliminationThreshold',cfg.eliminationThreshold||5,1)+`<label>Players<textarea data-players placeholder="שם בכל שורה"></textarea></label>`;
    else if(id==='custom-game')fields=num('Target','target',10,1)+num('Minutes','durationMinutes',3,0)+num('Rounds','rounds',1,1)+`<label>Game name<input data-custom-name value="My Game"></label>`;
    else if(id==='weighted-drill')fields=num('Perfect','perfect',3,-10)+num('Good','good',2,-10)+num('Playable','playable',1,-10)+num('Error','error',-1,-10);
    else fields=`<p class="score-suite-note">המצב מוכן להפעלה עם ניקוד הקבוצות הקיים. ניתן לשנות חוקים דרך Custom Game Builder.</p>`;
    return `<div class="score-suite-form">${fields}</div>`;
  }

  function readConfig(panel){const cfg=Object.assign({},session.config);panel.querySelectorAll('[data-cfg]').forEach(el=>{let v=el.type==='checkbox'?el.checked:Number(el.value);if(el.dataset.cfg==='durationMinutes'){cfg.duration=Math.max(0,v)*60000;return}if(el.dataset.cfg==='breakSeconds'){cfg.breakMs=Math.max(0,v)*1000;return}cfg[el.dataset.cfg]=v});return cfg}

  function beginConfiguredGame(id,panel){
    session.config=readConfig(panel);session.state=session.state||{};
    if(id==='spiegel'){const names=(panel.querySelector('[data-players]')?.value||'').split(/\n|,/).map(s=>s.trim()).filter(Boolean);session.state.players=names.map((name,i)=>({id:uid(),name,badPoints:0,eliminated:false,order:i}))}
    if(id==='pressure-game'||id==='comeback-challenge'){setTeamScore(0,session.config.scoreA||0);setTeamScore(1,session.config.scoreB||0);announcer.say(`Score ${session.config.scoreA} to ${session.config.scoreB}. Play.`,'high')}
    saveSession();renderActiveGame();
  }

  function renderActiveGame(){closeSheet();const p=document.createElement('div');p.className='score-suite-sheet score-suite-active-game';document.body.appendChild(p);sheet=p;activePanel=p;renderActiveState();p.addEventListener('click',onActiveClick)}

  function onActiveClick(e){const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))return closeSheet();if(b.hasAttribute('data-undo'))return undo();if(b.hasAttribute('data-redo'))return redo();if(b.hasAttribute('data-end'))return endSession();if(b.dataset.badPlayer)return addBadPoint(b.dataset.badPlayer);if(b.dataset.playerNext)return rotateSpiegel();if(b.dataset.scoreTeam!==undefined){const i=Number(b.dataset.scoreTeam),delta=Number(b.dataset.delta||1),before=teamCards()[i]?.score||0;action(`score ${i}`,()=>setTeamScore(i,before+delta),()=>setTeamScore(i,before));setTimeout(checkGameRules,0)}}
  function activeHeader(){return `<div class="score-suite-sheet-head"><strong>${session.modeName}</strong><button data-close>✕</button></div>`}

  function renderActiveState(){if(!activePanel||!session)return;const teams=teamCards();let body='';if(session.mode==='spiegel')body=renderSpiegel();else if(session.mode==='four-team-rotation')body=renderFourTeam(teams);else body=renderGenericTeams(teams);activePanel.innerHTML=activeHeader()+body+`<div class="score-suite-actions"><button data-undo ${undoStack.length?'':'disabled'}>↶ Undo</button><button data-redo ${redoStack.length?'':'disabled'}>↷ Redo</button><button data-end>Finish</button></div>`}
  function renderGenericTeams(teams){return `<div class="score-suite-live-teams">${teams.map((t,i)=>`<div class="score-suite-live-team"><strong>${t.name}</strong><span>${t.score}</span><div><button data-score-team="${i}" data-delta="-1">−</button><button data-score-team="${i}" data-delta="1">+</button></div></div>`).join('')}</div><div class="score-suite-status">${statusText()}</div>`}
  function renderFourTeam(teams){const ranked=[...teams].sort((a,b)=>b.score-a.score),triggered=!!session.state.firstToTenTriggered;return `<div class="score-suite-status">${triggered?'After 10: #1 + #4 / #2 + #3':'First team to 10 triggers re-ranking'}</div>`+renderGenericTeams(teams)+`<ol class="score-suite-ranking">${ranked.map(t=>`<li>${t.name} — ${t.score}</li>`).join('')}</ol>`}
  function renderSpiegel(){const ps=session.state.players||[],alive=ps.filter(p=>!p.eliminated),threshold=session.config.eliminationThreshold||5;return `<div class="score-suite-status">Bad points · elimination at ${threshold}${alive.length===2?' · FINAL DUEL':''}</div><div class="score-suite-players">${ps.map(p=>`<button class="score-suite-player ${p.eliminated?'out':''}" data-bad-player="${p.id}" ${p.eliminated?'disabled':''}><strong>${p.name}</strong><span>${p.badPoints}</span><small>${p.eliminated?'Eliminated':'tap = +1 bad point'}</small></button>`).join('')}</div><button class="score-suite-next" data-player-next>Next player</button>`}

  function statusText(){if(!session)return'';const cfg=session.config||{},teams=teamCards();if(session.mode==='pressure-game')return `Target ${cfg.target||25}${cfg.winBy2?' · Win by 2':''}`;if(session.mode==='timed-rounds')return `${Math.round((cfg.duration||180000)/60000)} min each · ${cfg.rounds||2} rounds`;if(session.mode==='first-to-x'||session.mode==='win-by-2')return `First to ${cfg.target||25}${session.mode==='win-by-2'?' · Win by 2':''}`;if(session.mode==='streak-challenge')return `First streak of ${cfg.streakTarget||3}`;if(session.mode==='countdown-target')return `Target ${cfg.target||10} before time`;if(teams.length>=2&&teams[0].score===teams[1].score)return'TIED';return'Game active'}

  function addBadPoint(id){const p=session.state.players.find(x=>x.id===id);if(!p)return;const before={badPoints:p.badPoints,eliminated:p.eliminated};action(`bad point ${p.name}`,()=>{p.badPoints++;if(p.badPoints>=session.config.eliminationThreshold){p.eliminated=true;announcer.say(`${p.name}. Eliminated.`,'high')}saveSession()},()=>{p.badPoints=before.badPoints;p.eliminated=before.eliminated;saveSession()})}
  function rotateSpiegel(){const alive=session.state.players.filter(p=>!p.eliminated);if(alive.length<=1){if(alive[0])announcer.say(`${alive[0].name}. Wins.`,'finish');return}const first=alive[0];first.order=Math.max(...alive.map(p=>p.order))+1;session.state.players.sort((a,b)=>a.order-b.order);saveSession();announcer.say(`Next player. ${session.state.players.find(p=>!p.eliminated)?.name||''}.`,'normal');renderActiveState()}

  function checkGameRules(){
    if(!session)return;const teams=teamCards(),cfg=session.config||{};
    if(session.mode==='four-team-rotation'&&!session.state.firstToTenTriggered&&teams.some(t=>t.score>=Number(cfg.midpoint||10))){session.state.firstToTenTriggered=true;session.state.rankAt10=[...teams].sort((a,b)=>b.score-a.score).map(t=>t.name);saveSession();announcer.say('Half time. First and fourth team up. Second and third team up.','high');renderActiveState()}
    const target=Number(cfg.target||0);if(target&&teams.length>=2){const sorted=[...teams].sort((a,b)=>b.score-a.score),lead=sorted[0],second=sorted[1],winBy2=!!cfg.winBy2||session.mode==='win-by-2';if(lead.score>=target&&(!winBy2||lead.score-second.score>=2)){announcer.say(`${teamPhrase(lead)} wins.`,'finish')}else if(lead.score===target-1)announcer.say(`Game point. ${teamPhrase(lead)}.`,'high');else if(teams[0].score===teams[1].score&&teams[0].score>0)announcer.say('Tied.','normal')}
  }

  function endSession(){if(!session)return;const teams=snapshotTeams(),stats=computeStats(teams);historyPush({mode:session.mode,name:session.modeName,startedAt:session.startedAt,endedAt:new Date().toISOString(),teams,stats});session=null;saveSession();undoStack=[];redoStack=[];closeSheet();announcer.say('Finished.','finish')}
  function computeStats(teams){const total=teams.reduce((a,t)=>a+t.score,0),duration=Math.max(1,(Date.now()-new Date(session.startedAt).getTime())/60000),pointsPerMinute=Number((total/duration).toFixed(1)),winner=[...teams].sort((a,b)=>b.score-a.score)[0],mvpMoment=winner?`${winner.name} finished on ${winner.score}`:'';return{totalPoints:total,pointsPerMinute,mvpMoment,longestStreak:session.state.longestStreak||0,biggestComeback:session.state.biggestComeback||0}}

  function exportCsv(entry){const rows=[['mode','team','score'],...(entry.teams||[]).map(t=>[entry.mode,t.name,t.score])],csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`teamscore-${entry.mode||'game'}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

  function openHistory(){closeSheet();const items=readStore(STORAGE.history,[]),p=document.createElement('div');p.className='score-suite-sheet';p.innerHTML=`<div class="score-suite-sheet-head"><strong>History</strong><button data-close>✕</button></div><div class="score-suite-history">${items.length?items.map((x,i)=>`<article><strong>${x.name||x.mode}</strong><span>${new Date(x.at||x.endedAt).toLocaleString()}</span><span>${(x.teams||[]).map(t=>`${t.name} ${t.score}`).join(' · ')}</span><button data-export="${i}">CSV</button></article>`).join(''):'<p>אין עדיין משחקים שמורים.</p>'}</div>`;document.body.appendChild(p);sheet=p;p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))closeSheet();if(b.dataset.export!==undefined)exportCsv(items[Number(b.dataset.export)])})}

  function openRosters(){closeSheet();const rosters=readStore(STORAGE.rosters,[]),p=document.createElement('div');p.className='score-suite-sheet';p.innerHTML=`<div class="score-suite-sheet-head"><strong>Rosters</strong><button data-close>✕</button></div><div class="score-suite-form"><label>Team name<input data-rname></label><label>Players<textarea data-rplayers placeholder="שם בכל שורה"></textarea></label><button data-save-roster>Save roster</button></div><div class="score-suite-history">${rosters.map(r=>`<article><strong>${r.name}</strong><span>${r.players.length} players</span></article>`).join('')}</div>`;document.body.appendChild(p);sheet=p;p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close'))closeSheet();if(b.hasAttribute('data-save-roster')){const name=p.querySelector('[data-rname]').value.trim(),players=p.querySelector('[data-rplayers]').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean).map(name=>({id:uid(),name,voiceAlias:'',stats:{}}));if(name){rosters.push({id:uid(),name,players});writeStore(STORAGE.rosters,rosters);openRosters()}}})}

  function installKeyboard(){addEventListener('keydown',e=>{if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();timerState.running?timerPause():timerStart()}else if(e.key.toLowerCase()==='r')timerReset();else if(e.key.toLowerCase()==='l')timerLap();else if(e.key==='+')timerAdjust(10000);else if(e.key==='-')timerAdjust(-10000);else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z')undo()})}
  function resumeSession(){if(session&&session.mode)setTimeout(()=>renderActiveGame(),300)}
  function init(){restoreTimer();installLauncher();installKeyboard();document.body.classList.toggle('score-suite-court',!!prefs.court);const timerProbe=setInterval(()=>{installTimerEnhancer();if(document.querySelector('.score-live-timer'))clearInterval(timerProbe)},500);setInterval(timerTick,200);resumeSession()}

  window.TEAM_SCORE_SUITE_MODES=TEAM_SCORE_SUITE_MODES;
  window.TeamScoreGameSuite={modes:TEAM_SCORE_SUITE_MODES,announcer,timer:timerState,startMode,open:openGameSheet,undo,redo,exportCsv,setVoiceAlias(index,voiceAlias){const t=teamCards()[index];if(t){t.card.dataset.voiceAlias=voiceAlias;return true}return false},getSession:()=>session,getHistory:()=>readStore(STORAGE.history,[])};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
