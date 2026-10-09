(function(){
  const Timer=window.ScoreTimerV2Core;
  const Games=window.ScoreGamesCore;
  const GAME_CATALOG=window.ScoreGamesCore.catalog;
  const teamsRoot=document.getElementById('teams');
  if(!Timer||!Games||!teamsRoot) return;

  const K={timer:'score:v2:timer',prefs:'score:v2:prefs',layout:'score:v2:layout',game:'score:v2:game',history:'score:v2:history',presets:'score:v2:presets',rosters:'score:v2:rosters'};
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const prefs=Object.assign({voiceProfile:'arena',commentary:'important',countdown:'10',volume:1,transitionDelay:5},read(K.prefs,{}));
  const layout=Object.assign({left:null,top:18,width:390,locked:false,minimized:false},read(K.layout,{}));
  const history=read(K.history,[]);
  const rosters=read(K.rosters,[]);

  let timerState=Timer.restoreTimer(localStorage.getItem(K.timer),Date.now());
  let activeGame=read(K.game,null);
  let wakeLock=null,drawer=null,timerShell=null,gameHud=null,selectedMode='first-to',syncingBoard=false,speechVoice=null;
  let lastTimerMark={second:null,phase:null,finished:false};

  const naturalVoicePatterns=[/Google US English/i,/Google UK English/i,/Microsoft Aria/i,/Microsoft Jenny/i,/Microsoft Guy/i,/Microsoft Ryan/i,/Microsoft Sonia/i,/Microsoft Libby/i,/Samantha/i,/Daniel/i,/Karen/i,/Moira/i];
  function refreshVoice(){
    if(!('speechSynthesis'in window)) return null;
    const voices=window.speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang||''));
    speechVoice=null;
    for(const re of naturalVoicePatterns){const found=voices.find(v=>re.test(v.name||''));if(found){speechVoice=found;break}}
    return speechVoice;
  }
  refreshVoice();
  if('speechSynthesis'in window) window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoice);

  function beep(freq=880,duration=.08){
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);o.onended=()=>ctx.close()}catch(_){ }
  }
  function speak(text,{force=false}={}){
    if(!text||(prefs.commentary==='off'&&!force)) return;
    if(!speechVoice){beep(740,.09);return}
    try{
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(String(text));u.voice=speechVoice;u.lang=speechVoice.lang||'en-US';u.volume=Math.max(0,Math.min(1,Number(prefs.volume)||1));
      if(prefs.voiceProfile==='arena'){u.rate=.78;u.pitch=.72;u.text=String(text).toUpperCase()}else{u.rate=.96;u.pitch=.96}
      if(force||prefs.commentary!=='off')window.speechSynthesis.speak(u);
    }catch(_){beep(740,.09)}
  }

  function boardCards(){return Array.from(teamsRoot.querySelectorAll(':scope > .card'));}
  function teamName(card,i){
    const el=card.querySelector('.score-team-name-top,[data-team-name],input[type="text"],h2,h3,.team-name,.name');
    const value=el?(el.value||el.textContent||'').trim():'';return value||`Team ${i+1}`;
  }
  function boardScore(card){
    const el=card.querySelector('.score-board-value,.team-score,.score-value,[data-role="score"]');
    const v=el?(el.value||el.textContent):0;const m=String(v||'0').match(/-?\d+/);return m?Number(m[0]):0;
  }
  function discoverBoard(){return boardCards().map((card,i)=>({card,name:teamName(card,i),score:boardScore(card),plus:card.querySelector('.score-board-plus'),minus:card.querySelector('.score-board-minus')}));}
  function setBoardScore(i,target){
    const b=discoverBoard()[i];if(!b)return;let cur=b.score,guard=0;syncingBoard=true;
    while(cur<target&&b.plus&&guard++<150){b.plus.click();cur++}
    while(cur>target&&b.minus&&guard++<300){b.minus.click();cur--}
    syncingBoard=false;
  }

  function saveTimer(){write(K.timer,JSON.parse(Timer.serialize(timerState)));}
  function savePrefs(){write(K.prefs,prefs)}
  function saveLayout(){write(K.layout,layout)}
  function saveGame(){if(activeGame)write(K.game,activeGame);else localStorage.removeItem(K.game)}
  function saveHistory(){write(K.history,history.slice(-100))}

  async function syncWakeLock(){
    const snap=Timer.snapshot(timerState,Date.now());
    if(snap.running&&navigator.wakeLock?.request&&!wakeLock){try{wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener?.('release',()=>wakeLock=null)}catch(_){}}
    if(!snap.running&&wakeLock){try{await wakeLock.release()}catch(_){}wakeLock=null}
  }

  function timerAction(action){timerState=Timer.transition(timerState,Object.assign({now:Date.now()},action));saveTimer();syncWakeLock();renderTimer();}
  function setTimerMode(mode){timerAction({type:'SET_MODE',mode});lastTimerMark={second:null,phase:null,finished:false};}
  function countdownShouldSpeak(sec){if(prefs.countdown==='off'||prefs.countdown==='tones')return false;if(prefs.countdown==='3')return sec<=3;return sec<=10;}
  function countdownShouldTone(){return prefs.countdown==='tones'||prefs.countdown==='voice+tones';}
  function handleTimerAnnouncements(snap){
    const phase=snap.phase||snap.mode;
    if(phase!==lastTimerMark.phase){
      if(phase==='work')speak('Work',{force:true});else if(phase==='rest'||phase==='set-rest')speak('Rest',{force:true});else if(phase==='finished')speak('Finished',{force:true});
      lastTimerMark.phase=phase;lastTimerMark.second=null;
    }
    const sec=Math.ceil(Math.max(0,snap.displayMs||0)/1000);
    if(snap.running&&sec>0&&sec<=10&&sec!==lastTimerMark.second){
      if(countdownShouldSpeak(sec))speak(String(sec),{force:true});if(countdownShouldTone())beep(sec<=3?980:760,.06);lastTimerMark.second=sec;
    }
    if(snap.finished&&!lastTimerMark.finished){
      if(snap.mode==='timer')speak('Time',{force:true});else if(snap.mode==='intervals')speak('Finished',{force:true});
      lastTimerMark.finished=true;onTimerFinished();
    }
    if(!snap.finished)lastTimerMark.finished=false;
  }

  function onTimerFinished(){
    if(!activeGame)return;
    if(activeGame.mode==='timed-rounds'){
      activeGame=Games.nextTimedRoundTurn(activeGame);saveGame();renderGameHud();
      const msg=Games.announcementFor(activeGame);if(msg)speak(msg,{force:true});
      if(!activeGame.finished){
        const delay=Math.max(0,Number(prefs.transitionDelay)||0);let n=delay;
        const tick=()=>{if(n<=0){timerState=Timer.createTimerState({mode:'timer',durationMs:activeGame.settings.turnMs,now:Date.now()});timerAction({type:'START'});return}speak(String(n),{force:true});n--;setTimeout(tick,1000)};tick();
      }else finishGame();
    }else if(['timed-game','countdown-target'].includes(activeGame.mode)){finishGame()}
  }

  function applyTimerPreset(ms){timerState=Timer.createTimerState({mode:'timer',durationMs:ms,now:Date.now()});saveTimer();renderTimer()}
  function toggleStart(){const s=Timer.snapshot(timerState,Date.now());timerAction({type:s.running?'PAUSE':'START'});if(!s.running){lastTimerMark.finished=false;lastTimerMark.second=null}}

  function createTimerShell(){
    if(document.querySelector('.score-v2-timer'))return;
    document.body.classList.add('score-v2-ready');
    const shell=document.createElement('section');shell.className='score-v2-timer';shell.innerHTML='\
      <div class="score-v2-timer-head"><button data-v2="games" title="Games">🎮</button><button data-v2="timer-settings" title="Timer settings">⏱</button><strong class="score-v2-mode-label">STOPWATCH</strong><span class="score-v2-spacer"></span><button data-v2="lock" title="Lock">🔓</button><button data-v2="minimize" title="Minimize">—</button></div>\
      <div class="score-v2-timer-body"><div class="score-v2-phase"></div><button class="score-v2-display" data-v2="court">00:00</button><div class="score-v2-round"></div><div class="score-v2-timer-actions"><button data-v2="minus10">−10s</button><button class="score-v2-primary" data-v2="play">▶</button><button data-v2="plus10">+10s</button><button data-v2="plus30">+30s</button><button data-v2="plus60">+1m</button><button data-v2="reset">↺</button><button data-v2="lap">LAP</button><button data-v2="skip">SKIP</button></div></div><div class="score-v2-resize-handle" aria-hidden="true"></div>';
    document.body.appendChild(shell);timerShell=shell;
    shell.addEventListener('click',e=>{const a=e.target.closest('[data-v2]')?.dataset.v2;if(!a)return;if(a==='games')openDrawer('games');if(a==='timer-settings')openDrawer('timer');if(a==='play')toggleStart();if(a==='reset')timerAction({type:'RESET'});if(a==='minus10')timerAction({type:'ADJUST_TIME',deltaMs:-10000});if(a==='plus10')timerAction({type:'ADJUST_TIME',deltaMs:10000});if(a==='plus30')timerAction({type:'ADJUST_TIME',deltaMs:30000});if(a==='plus60')timerAction({type:'ADJUST_TIME',deltaMs:60000});if(a==='lap')timerAction({type:'LAP'});if(a==='skip')timerAction({type:'SKIP'});if(a==='lock'){layout.locked=!layout.locked;saveLayout();renderTimer()}if(a==='minimize'){layout.minimized=!layout.minimized;saveLayout();renderTimer()}if(a==='court')document.body.classList.toggle('score-v2-court');});
    shell.querySelector('.score-v2-display').addEventListener('dblclick',()=>document.body.classList.toggle('score-v2-court'));
    enableDragResize(shell);applyLayout();renderTimer();
  }
  function applyLayout(){if(!timerShell)return;timerShell.style.width=`${Math.max(300,Math.min(820,Number(layout.width)||390))}px`;timerShell.style.top=`${Math.max(0,Number(layout.top)||0)}px`;if(layout.left==null)timerShell.style.right='18px';else{timerShell.style.left=`${Math.max(0,Number(layout.left)||0)}px`;timerShell.style.right='auto'}}
  function enableDragResize(shell){
    const head=shell.querySelector('.score-v2-timer-head'),handle=shell.querySelector('.score-v2-resize-handle');let drag=null,resize=null;
    head.addEventListener('pointerdown',e=>{if(layout.locked||e.target.closest('button'))return;const r=shell.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};head.setPointerCapture(e.pointerId)});
    head.addEventListener('pointermove',e=>{if(!drag)return;layout.left=Math.max(0,drag.left+e.clientX-drag.x);layout.top=Math.max(0,drag.top+e.clientY-drag.y);applyLayout()});head.addEventListener('pointerup',()=>{if(drag){drag=null;saveLayout()}});
    handle.addEventListener('pointerdown',e=>{if(layout.locked)return;resize={x:e.clientX,w:shell.getBoundingClientRect().width};handle.setPointerCapture(e.pointerId);e.stopPropagation()});handle.addEventListener('pointermove',e=>{if(!resize)return;layout.width=Math.max(300,Math.min(820,resize.w+e.clientX-resize.x));applyLayout()});handle.addEventListener('pointerup',()=>{if(resize){resize=null;saveLayout()}});
  }
  function renderTimer(){
    if(!timerShell)return;const snap=Timer.snapshot(timerState,Date.now());handleTimerAnnouncements(snap);
    timerShell.classList.toggle('is-minimized',!!layout.minimized);timerShell.classList.toggle('is-locked',!!layout.locked);timerShell.querySelector('[data-v2="lock"]').textContent=layout.locked?'🔒':'🔓';timerShell.querySelector('.score-v2-mode-label').textContent=timerState.mode==='stopwatch'?'STOPWATCH':timerState.mode==='timer'?'TIMER':'INTERVALS';timerShell.querySelector('.score-v2-display').textContent=snap.overtime?`+${Timer.formatClock(snap.overtimeMs)}`:Timer.formatClock(snap.displayMs||0);timerShell.querySelector('[data-v2="play"]').textContent=snap.running?'⏸':'▶';const phase=timerShell.querySelector('.score-v2-phase'),round=timerShell.querySelector('.score-v2-round');phase.textContent=snap.phase&&snap.phase!=='finished'?snap.phase.toUpperCase():'';round.textContent=snap.round?`ROUND ${snap.round}${timerState.intervalPlan?.rounds?` / ${timerState.intervalPlan.rounds}`:''}`:'';timerShell.querySelector('[data-v2="lap"]').hidden=timerState.mode!=='stopwatch';timerShell.querySelector('[data-v2="skip"]').hidden=timerState.mode!=='intervals';
  }

  function ensureDrawer(){if(drawer)return drawer;drawer=document.createElement('div');drawer.className='score-v2-drawer-wrap';drawer.hidden=true;drawer.innerHTML=`<div class="score-v2-backdrop" data-close></div><aside class="score-v2-drawer"><header><strong>TEAM SCORE PRO</strong><button data-close>✕</button></header><nav><button data-tab="games">Games</button><button data-tab="timer">Timer</button><button data-tab="voice">Voice</button><button data-tab="roster">Roster</button><button data-tab="history">History</button></nav><div class="score-v2-drawer-content"></div></aside>`;document.body.appendChild(drawer);drawer.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeDrawer();const tab=e.target.closest('[data-tab]')?.dataset.tab;if(tab)renderDrawer(tab)});return drawer;}
  function openDrawer(tab='games'){ensureDrawer().hidden=false;renderDrawer(tab)}
  function closeDrawer(){if(drawer)drawer.hidden=true}
  function content(){return drawer.querySelector('.score-v2-drawer-content')}
  function renderDrawer(tab){ensureDrawer();drawer.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));if(tab==='games')renderGamesPanel();if(tab==='timer')renderTimerPanel();if(tab==='voice')renderVoicePanel();if(tab==='roster')renderRosterPanel();if(tab==='history')renderHistoryPanel();}

  function renderGamesPanel(){
    const c=content();c.innerHTML=`<div class="score-v2-panel-head"><h2>Game Modes</h2><button class="score-v2-surprise" data-surprise>SURPRISE ME</button></div><div class="score-v2-games-grid"></div><div class="score-v2-config"></div>`;
    const grid=c.querySelector('.score-v2-games-grid');GAME_CATALOG.forEach(m=>{const b=document.createElement('button');b.className='score-v2-game-card';b.dataset.mode=m.id;b.innerHTML=`<strong>${m.name}</strong><small>${m.kind}</small>`;grid.appendChild(b)});
    grid.addEventListener('click',e=>{const id=e.target.closest('[data-mode]')?.dataset.mode;if(id){selectedMode=id;renderGameConfig(id)}});c.querySelector('[data-surprise]').onclick=()=>{const pool=['pressure','streak','comeback','serve-pressure','target-chase','countdown-target'];selectedMode=pool[Math.floor(Math.random()*pool.length)];renderGameConfig(selectedMode)};renderGameConfig(selectedMode);
  }
  function currentNames(min=2){const names=discoverBoard().map(x=>x.name);while(names.length<min)names.push(`Team ${names.length+1}`);return names}
  function renderGameConfig(id){
    const host=content().querySelector('.score-v2-config');if(!host)return;const def=GAME_CATALOG.find(m=>m.id===id)||GAME_CATALOG[0];const names=currentNames(def.minTeams||2);const isSpiegel=id==='spiegel';
    host.innerHTML=`<h3>${def.name}</h3><div class="score-v2-fields"><label>Teams / players<textarea data-f="names">${(isSpiegel?[]:names).join('\n')}</textarea></label>${isSpiegel?`<label>Players<textarea data-f="players" placeholder="Dana\nNoa\nLibi"></textarea></label><label>Bad-point limit<input data-f="badPointLimit" type="number" value="5" min="1"></label>`:''}${['first-to','win-by-2','pressure','comeback','target-chase','race','countdown-target','four-team'].includes(id)?`<label>Target<input data-f="target" type="number" value="${id==='pressure'||id==='comeback'?25:id==='four-team'?20:10}" min="1"></label>`:''}${['first-to','win-by-2','pressure','comeback'].includes(id)?`<label class="score-v2-check"><input data-f="winBy2" type="checkbox" ${id==='pressure'||id==='comeback'?'checked':''}> Win by 2</label>`:''}${['pressure','comeback'].includes(id)?`<label>Start score A<input data-f="startA" type="number" value="22"></label><label>Start score B<input data-f="startB" type="number" value="22"></label>`:''}${id==='timed-rounds'?`<label>Seconds per team<input data-f="turnSec" type="number" value="180" min="5"></label><label>Rounds<input data-f="rounds" type="number" value="2" min="1"></label>`:''}${id==='streak'?`<label>Streak target<input data-f="streakTarget" type="number" value="3" min="1"></label>`:''}${id==='four-team'?`<label>Regroup at<input data-f="halfway" type="number" value="10" min="1"></label><p class="score-v2-note">At halfway: #1 + #4 on one side, #2 + #3 on the other. Scores stay.</p>`:''}${id==='weighted-drill'||id==='serve-pressure'?`<label>Scoring rules<textarea data-f="rules">perfect=3\ngood=2\nin=1\nerror=-1</textarea></label>`:''}</div><button class="score-v2-start-game" data-start-game>START ${def.name.toUpperCase()}</button>`;
    host.querySelector('[data-start-game]').onclick=()=>startConfiguredGame(id,host);
  }
  function field(host,name){const el=host.querySelector(`[data-f="${name}"]`);if(!el)return null;return el.type==='checkbox'?el.checked:el.value}
  function parseRules(text){const out={};String(text||'').split(/\n+/).forEach(line=>{const [k,v]=line.split('=');if(k&&Number.isFinite(Number(v)))out[k.trim()]=Number(v)});return out}
  function startConfiguredGame(id,host){
    const rawNames=String(field(host,'names')||'').split(/\n+/).map(x=>x.trim()).filter(Boolean),playerNames=String(field(host,'players')||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
    const options={teams:rawNames.length?rawNames:currentNames(id==='four-team'?4:2),target:Number(field(host,'target'))||10,winBy2:!!field(host,'winBy2'),rounds:Number(field(host,'rounds'))||2,turnMs:(Number(field(host,'turnSec'))||180)*1000,halfway:Number(field(host,'halfway'))||10,badPointLimit:Number(field(host,'badPointLimit'))||5,streakTarget:Number(field(host,'streakTarget'))||3,rules:parseRules(field(host,'rules'))};
    if(id==='spiegel'){options.players=playerNames.length?playerNames:['Player 1','Player 2','Player 3'];delete options.teams}
    if(id==='pressure'||id==='comeback'){options.startScores=[Number(field(host,'startA'))||0,Number(field(host,'startB'))||0];options.teams=options.teams.slice(0,2)}
    activeGame=Games.createGame(id,options);saveGame();if(options.startScores)options.startScores.forEach((v,i)=>setBoardScore(i,v));if(id==='timed-rounds'){timerState=Timer.createTimerState({mode:'timer',durationMs:options.turnMs,now:Date.now()});saveTimer();}renderGameHud();closeDrawer();speak(`${activeGame.definition.name}. ${activeGame.teams[activeGame.activeTeamIndex]?.name||''}. Get ready`,{force:true});
  }

  function renderTimerPanel(){
    const c=content(),p=timerState.intervalPlan||Timer.createIntervalPlan({});c.innerHTML=`<h2>Timer</h2><div class="score-v2-segmented"><button data-mode="stopwatch">Stopwatch</button><button data-mode="timer">Timer</button><button data-mode="intervals">Intervals</button></div><div class="score-v2-fields"><label>Timer minutes<input data-timer-min type="number" min="0" value="${Math.floor((timerState.durationMs||0)/60000)}"></label><label>Seconds<input data-timer-sec type="number" min="0" max="59" value="${Math.floor((timerState.durationMs||0)/1000)%60}"></label><label>Work sec<input data-work type="number" value="${Math.round(p.workMs/1000)}"></label><label>Rest sec<input data-rest type="number" value="${Math.round(p.restMs/1000)}"></label><label>Rounds<input data-rounds type="number" value="${p.rounds}"></label><label>Start delay<input data-delay type="number" value="${Math.round(p.startDelayMs/1000)}"></label></div><div class="score-v2-presets"><button data-preset="30000">30 sec</button><button data-preset="60000">1 min</button><button data-preset="180000">3 min</button><button data-preset="300000">5 min</button></div><button class="score-v2-start-game" data-save-timer>SAVE TIMER SETTINGS</button>`;
    c.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===timerState.mode);b.onclick=()=>{setTimerMode(b.dataset.mode);renderTimerPanel()}});c.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>applyTimerPreset(Number(b.dataset.preset)));c.querySelector('[data-save-timer]').onclick=()=>{if(timerState.mode==='timer')timerAction({type:'SET_DURATION',durationMs:(Number(c.querySelector('[data-timer-min]').value)||0)*60000+(Number(c.querySelector('[data-timer-sec]').value)||0)*1000});if(timerState.mode==='intervals')timerAction({type:'SET_INTERVAL_PLAN',plan:{workMs:(Number(c.querySelector('[data-work]').value)||40)*1000,restMs:(Number(c.querySelector('[data-rest]').value)||20)*1000,rounds:Number(c.querySelector('[data-rounds]').value)||8,startDelayMs:(Number(c.querySelector('[data-delay]').value)||0)*1000}});closeDrawer()};
  }
  function renderVoicePanel(){
    const c=content();c.innerHTML=`<h2>Voice</h2><div class="score-v2-fields"><label>Profile<select data-profile><option value="coach">Coach</option><option value="arena">Arena Announcer</option></select></label><label>Commentary<select data-commentary><option value="off">Off</option><option value="important">Important events</option><option value="full">Full commentary</option></select></label><label>Countdown<select data-countdown><option value="off">Visual only</option><option value="tones">Tones</option><option value="3">3, 2, 1</option><option value="10">10…1</option><option value="voice+tones">Voice + tones</option></select></label><label>Volume<input data-volume type="range" min="0" max="1" step="0.05" value="${prefs.volume}"></label></div><p class="score-v2-note">Natural English voices only. If a preferred natural voice is unavailable, the app uses tones/visual countdown instead of choosing an arbitrary robotic voice.</p><button data-preview class="score-v2-start-game">PREVIEW ANNOUNCER</button>`;c.querySelector('[data-profile]').value=prefs.voiceProfile;c.querySelector('[data-commentary]').value=prefs.commentary;c.querySelector('[data-countdown]').value=prefs.countdown;c.querySelectorAll('select,input').forEach(el=>el.onchange=()=>{prefs.voiceProfile=c.querySelector('[data-profile]').value;prefs.commentary=c.querySelector('[data-commentary]').value;prefs.countdown=c.querySelector('[data-countdown]').value;prefs.volume=Number(c.querySelector('[data-volume]').value);savePrefs()});c.querySelector('[data-preview]').onclick=()=>speak('Brenner takes the lead',{force:true});
  }
  function renderRosterPanel(){
    const c=content();c.innerHTML=`<h2>Rosters</h2><p class="score-v2-note">Save reusable teams and pronunciation aliases.</p><div class="score-v2-rosters"></div><div class="score-v2-fields"><label>Roster name<input data-rname></label><label>Players<textarea data-rplayers placeholder="Name | 12 | pronunciation"></textarea></label></div><button data-save-roster class="score-v2-start-game">SAVE ROSTER</button>`;const list=c.querySelector('.score-v2-rosters');rosters.forEach(r=>{const b=document.createElement('button');b.textContent=`${r.name} · ${r.players.length}`;b.onclick=()=>{c.querySelector('[data-rname]').value=r.name;c.querySelector('[data-rplayers]').value=r.players.map(p=>[p.name,p.number,p.pronunciation].filter(Boolean).join(' | ')).join('\n')};list.appendChild(b)});c.querySelector('[data-save-roster]').onclick=()=>{const name=c.querySelector('[data-rname]').value.trim();if(!name)return;const players=c.querySelector('[data-rplayers]').value.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>{const [n,number,pronunciation]=line.split('|').map(x=>x.trim());return{name:n,number:number||'',pronunciation:pronunciation||''}});const idx=rosters.findIndex(r=>r.name===name),item={name,players};if(idx>=0)rosters[idx]=item;else rosters.push(item);write(K.rosters,rosters);renderRosterPanel()};
  }
  function renderHistoryPanel(){const c=content();c.innerHTML=`<h2>History</h2><div class="score-v2-history">${history.slice().reverse().map(h=>`<article><strong>${h.name}</strong><small>${new Date(h.at).toLocaleString()} · ${h.summary}</small></article>`).join('')||'<p>No completed games yet.</p>'}</div><button data-clear-history>Clear history</button>`;c.querySelector('[data-clear-history]').onclick=()=>{history.splice(0);saveHistory();renderHistoryPanel()}}

  function scoreline(g){return g.teams.map(t=>`${t.name} ${g.mode==='spiegel'?t.badPoints:t.score}`).join(' · ')}
  function smartAnnouncement(prev,g){if(!g.lastEvent)return'';if(g.mode==='pressure'||prefs.commentary==='full')return scoreline(g);if(g.lastEvent.type==='regroup')return'Halftime. New teams';if(g.finished&&g.winnerId){const w=g.teams.find(t=>t.id===g.winnerId);return`${w?.name||''} wins`}const scores=g.teams.map(t=>t.score);if(scores.length===2&&scores[0]===scores[1])return'Tied';return Games.announcementFor(g);}
  function gameApplyScore(i,delta){if(!activeGame)return;const prev=activeGame;activeGame=Games.applyScore(activeGame,i,delta);saveGame();renderGameHud();const line=smartAnnouncement(prev,activeGame);if(line)speak(line,{force:activeGame.mode==='pressure'});if(activeGame.finished)finishGame()}
  function gameBadPoint(i,category='other'){if(!activeGame)return;activeGame=Games.applyBadPoint(activeGame,i,category);saveGame();renderGameHud();const line=Games.announcementFor(activeGame);if(line)speak(line,{force:true});if(activeGame.finished)finishGame()}
  function finishGame(){if(!activeGame||activeGame._historySaved)return;activeGame._historySaved=true;saveGame();const winner=activeGame.winnerId?activeGame.teams.find(t=>t.id===activeGame.winnerId):null;history.push({at:Date.now(),name:activeGame.definition?.name||activeGame.mode,summary:winner?`Winner: ${winner.name} · ${scoreline(activeGame)}`:scoreline(activeGame),state:activeGame});saveHistory();if(winner)speak(`${winner.name}. Wins.`,{force:true});renderGameHud()}
  function stopGame(){activeGame=null;saveGame();if(gameHud)gameHud.remove();gameHud=null}

  function renderGameHud(){
    if(!activeGame){if(gameHud)gameHud.remove();gameHud=null;return}if(!gameHud){gameHud=document.createElement('section');gameHud.className='score-v2-game-hud';document.body.appendChild(gameHud)}
    const g=activeGame,modeLabel=g.definition?.name||g.mode;let status='';if(g.mode==='timed-rounds')status=`ROUND ${g.round}/${g.settings.rounds} · NOW: ${g.teams[g.activeTeamIndex]?.name||''}`;if(g.mode==='four-team'&&g.meta.regrouped){const name=id=>g.teams.find(t=>t.id===id)?.name||'';status=`SIDE A: ${g.meta.sides[0].map(name).join(' + ')} · SIDE B: ${g.meta.sides[1].map(name).join(' + ')}`}
    gameHud.innerHTML=`<header><strong>${modeLabel}</strong><span>${status}</span><button data-gh="close">✕</button></header><div class="score-v2-hud-teams"></div><footer><button data-gh="undo">↶ Undo</button><button data-gh="redo">↷ Redo</button>${g.mode==='timed-rounds'?'<button data-gh="next">Next turn</button>':''}<button data-gh="settings">Settings</button></footer>`;
    const host=gameHud.querySelector('.score-v2-hud-teams');g.teams.forEach((t,i)=>{const row=document.createElement('div');row.className='score-v2-hud-team'+(t.eliminated?' eliminated':'');if(g.mode==='spiegel'){row.innerHTML=`<strong>${t.name}</strong><b>${t.badPoints} BAD</b><select data-cat><option>other</option><option>reception</option><option>drop</option><option>out</option><option>double</option><option>net</option><option>serve</option></select><button data-bad="${i}">+ BAD</button>`}else if(g.mode==='weighted-drill'||g.mode==='serve-pressure'){row.innerHTML=`<strong>${t.name}</strong><b>${t.score}</b><div class="score-v2-rule-buttons">${Object.entries(g.settings.rules||{}).map(([k,v])=>`<button data-act="${i}|${k}">${k} ${v>0?'+':''}${v}</button>`).join('')}</div>`}else{row.innerHTML=`<strong>${t.name}</strong><button data-score="${i}|-1">−</button><b>${t.score}</b><button data-score="${i}|1">+</button>`}host.appendChild(row)});
    gameHud.onclick=e=>{const gh=e.target.closest('[data-gh]')?.dataset.gh;if(gh==='close')stopGame();if(gh==='undo'){activeGame=Games.undo(activeGame);saveGame();renderGameHud()}if(gh==='redo'){activeGame=Games.redo(activeGame);saveGame();renderGameHud()}if(gh==='next'){activeGame=Games.nextTimedRoundTurn(activeGame);saveGame();renderGameHud()}if(gh==='settings')openDrawer('games');const s=e.target.closest('[data-score]')?.dataset.score;if(s){const [i,d]=s.split('|').map(Number);gameApplyScore(i,d);if(i<discoverBoard().length)setBoardScore(i,activeGame.teams[i].score)}const bad=e.target.closest('[data-bad]')?.dataset.bad;if(bad!=null){const row=e.target.closest('.score-v2-hud-team');gameBadPoint(Number(bad),row.querySelector('[data-cat]').value)}const act=e.target.closest('[data-act]')?.dataset.act;if(act){const [i,a]=act.split('|');activeGame=Games.applyAction(activeGame,Number(i),a);saveGame();renderGameHud();speak(Games.announcementFor(activeGame),{force:true})}};
  }

  document.addEventListener('click',e=>{if(syncingBoard||!activeGame)return;const btn=e.target.closest('.score-board-plus,.score-board-minus');if(!btn)return;const card=btn.closest('.card'),idx=boardCards().indexOf(card);if(idx<0||idx>=activeGame.teams.length)return;setTimeout(()=>{const newScore=boardScore(card),old=activeGame.teams[idx].score,delta=newScore-old;if(delta)gameApplyScore(idx,delta)},0);},true);
  document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(e.code==='Space'){e.preventDefault();toggleStart()}else if(e.key.toLowerCase()==='r')timerAction({type:'RESET'});else if(e.key.toLowerCase()==='l'&&timerState.mode==='stopwatch')timerAction({type:'LAP'});else if(e.key.toLowerCase()==='s'&&timerState.mode==='intervals')timerAction({type:'SKIP'});});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncWakeLock()});

  createTimerShell();renderGameHud();setInterval(()=>{renderTimer();saveTimer()},250);
  window.ScoreGamesUI={openGames:()=>openDrawer('games'),openTimer:()=>openDrawer('timer'),startMode:(id,opts)=>{activeGame=Games.createGame(id,opts||{});saveGame();renderGameHud();return activeGame},stopMode:stopGame,getState:()=>({timer:timerState,game:activeGame,prefs:Object.assign({},prefs),history:history.slice()})};
})();
