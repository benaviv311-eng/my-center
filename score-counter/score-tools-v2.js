(function(){
  const Timer=window.ScoreTimerV2Core,Games=window.ScoreGamesCore,UI=window.ScoreGamesUI;
  if(!Timer||!Games||!UI)return;
  const K='score:v2:multi-timers';
  const read=()=>{try{return JSON.parse(localStorage.getItem(K))||[]}catch(_){return[]}};
  const save=()=>{try{localStorage.setItem(K,JSON.stringify(multi.map(x=>({id:x.id,name:x.name,state:x.state,announced:!!x.announced}))))}catch(_){}};
  let multi=read().map(x=>Object.assign({},x,{state:Timer.restoreTimer(x.state,Date.now())}));
  let panel=null,recognition=null,listening=false;

  function click(sel){document.querySelector(sel)?.click()}
  function addHeadButton(text,title,action){
    const head=document.querySelector('.score-v2-timer-head');if(!head||head.querySelector(`[data-tools="${action}"]`))return;
    const b=document.createElement('button');b.type='button';b.dataset.tools=action;b.title=title;b.textContent=text;
    const spacer=head.querySelector('.score-v2-spacer');head.insertBefore(b,spacer);b.onclick=e=>{e.stopPropagation();if(action==='multi')openTools('multi');if(action==='export')openTools('export');if(action==='voice')toggleVoice(b)};
  }

  function naturalVoice(){
    if(!window.speechSynthesis)return null;const voices=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang||''));
    return voices.find(v=>/Google US English|Google UK English|Microsoft Aria|Microsoft Jenny|Microsoft Guy|Microsoft Ryan|Samantha|Daniel/i.test(v.name||''))||null;
  }
  function announce(text){const v=naturalVoice();if(!v)return;try{const u=new SpeechSynthesisUtterance(text);u.voice=v;u.lang=v.lang;u.rate=.9;speechSynthesis.speak(u)}catch(_){}}

  function ensurePanel(){
    if(panel)return panel;panel=document.createElement('section');panel.className='score-v2-tools-panel';panel.hidden=true;panel.innerHTML='<header><strong>TOOLS</strong><button data-tools-close>✕</button></header><div class="score-v2-tools-body"></div>';document.body.appendChild(panel);panel.querySelector('[data-tools-close]').onclick=()=>panel.hidden=true;panel.addEventListener('click',handlePanelClick);return panel;
  }
  function openTools(tab){ensurePanel().hidden=false;if(tab==='multi')renderMulti();else renderExport()}

  function newTimer(mode='timer',durationMs=60000,name){
    const state=Timer.createTimerState({mode,durationMs,now:Date.now()});multi.push({id:`m${Date.now()}${Math.random().toString(36).slice(2,6)}`,name:name||`${mode==='stopwatch'?'Stopwatch':'Timer'} ${multi.length+1}`,state,announced:false});save();renderMulti();
  }
  function itemById(id){return multi.find(x=>x.id===id)}
  function act(id,action){const item=itemById(id);if(!item)return;item.state=Timer.transition(item.state,Object.assign({now:Date.now()},action));if(action.type==='START'||action.type==='RESET')item.announced=false;save();renderMulti()}
  function renderMulti(){
    const body=ensurePanel().querySelector('.score-v2-tools-body');body.innerHTML=`<div class="score-v2-tools-tabs"><b>Multi Timer</b><span>${multi.length} active cards</span></div><div class="score-v2-multi-list"></div><div class="score-v2-tool-actions"><button data-add="stopwatch">+ Stopwatch</button><button data-add="60000">+ 1 min</button><button data-add="180000">+ 3 min</button><button data-add="300000">+ 5 min</button></div>`;
    const list=body.querySelector('.score-v2-multi-list');multi.forEach(item=>{const snap=Timer.snapshot(item.state,Date.now()),card=document.createElement('article');card.className='score-v2-mini-timer';card.dataset.id=item.id;card.innerHTML=`<input data-name value="${String(item.name).replace(/"/g,'&quot;')}"><strong data-mini-time>${snap.overtime?'+':''}${Timer.formatClock(snap.overtime?snap.overtimeMs:snap.displayMs||0)}</strong><div><button data-mini="play">${snap.running?'⏸':'▶'}</button><button data-mini="reset">↺</button><button data-mini="plus30">+30s</button><button data-mini="delete">✕</button></div>`;list.appendChild(card)});
  }
  function handlePanelClick(e){
    const add=e.target.closest('[data-add]')?.dataset.add;if(add){if(add==='stopwatch')newTimer('stopwatch',0);else newTimer('timer',Number(add));return}
    const mini=e.target.closest('[data-mini]')?.dataset.mini,card=e.target.closest('.score-v2-mini-timer');if(!mini||!card)return;const item=itemById(card.dataset.id);if(!item)return;
    if(mini==='delete'){multi=multi.filter(x=>x.id!==item.id);save();renderMulti();return}
    const snap=Timer.snapshot(item.state,Date.now());if(mini==='play')act(item.id,{type:snap.running?'PAUSE':'START'});if(mini==='reset')act(item.id,{type:'RESET'});if(mini==='plus30')act(item.id,{type:'ADJUST_TIME',deltaMs:30000});
  }
  document.addEventListener('change',e=>{const input=e.target.closest('.score-v2-mini-timer [data-name]');if(!input)return;const item=itemById(input.closest('.score-v2-mini-timer').dataset.id);if(item){item.name=input.value.trim()||item.name;save()}});

  function executeVoice(text){
    const cmd=String(text||'').trim().toLowerCase(),state=UI.getState(),running=!!Timer.snapshot(state.timer,Date.now()).running;
    if(/^(start|go|resume)( timer)?$/.test(cmd)&&!running)click('[data-v2="play"]');
    else if(/^(pause|stop)( timer)?$/.test(cmd)&&running)click('[data-v2="play"]');
    else if(/reset/.test(cmd))click('[data-v2="reset"]');
    else if(/lap/.test(cmd))click('[data-v2="lap"]');
    else if(/skip|next round/.test(cmd)){click('[data-gh="next"]');click('[data-v2="skip"]')}
    else if(/add 30 seconds|add thirty seconds/.test(cmd))click('[data-v2="plus30"]');
    else if(/add (one|1) minute/.test(cmd))click('[data-v2="plus60"]');
    else if(/open games|games/.test(cmd))click('[data-v2="games"]');
    else if(/open timer|timer settings/.test(cmd))click('[data-v2="timer-settings"]');
  }
  function toggleVoice(button){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){button.title='Voice control is not supported in this browser';return}
    if(!recognition){recognition=new SR();recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=false;recognition.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)executeVoice(e.results[i][0].transcript)};recognition.onend=()=>{if(listening){try{recognition.start()}catch(_){}}};recognition.onerror=()=>{};}
    listening=!listening;button.textContent=listening?'🎙️':'🎤';button.classList.toggle('active',listening);try{listening?recognition.start():recognition.stop()}catch(_){}
  }

  function gameSummary(){
    const state=UI.getState(),g=state.game,lines=[];lines.push(`TeamScore summary — ${new Date().toLocaleString()}`);
    if(g){lines.push(`Mode: ${g.definition?.name||g.mode}`);lines.push(`Score: ${g.teams.map(t=>`${t.name} ${g.mode==='spiegel'?t.badPoints:t.score}`).join(' | ')}`);if(g.winnerId){const w=g.teams.find(t=>t.id===g.winnerId);if(w)lines.push(`Winner: ${w.name}`)}if(Games.statsSummary){const s=Games.statsSummary(g);lines.push(`Lead changes: ${s.leadChanges}`);lines.push(`Ties: ${s.ties}`);g.teams.forEach(t=>lines.push(`${t.name} longest streak: ${s.longestStreak[t.id]||0}`))}}
    if(state.timer){const snap=Timer.snapshot(state.timer,Date.now());lines.push(`Timer: ${state.timer.mode} ${Timer.formatClock(snap.displayMs||snap.elapsedMs||0)}`)}return lines.join('\n');
  }
  function csvText(){const h=UI.getState().history||[];const esc=v=>`"${String(v??'').replace(/"/g,'""')}"`;return ['date,mode,summary',...h.map(x=>[new Date(x.at).toISOString(),x.name,x.summary].map(esc).join(','))].join('\n')}
  function downloadCsv(){const blob=new Blob([csvText()],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`teamscore-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  async function shareSummary(){const text=gameSummary();if(navigator.share){try{await navigator.share({title:'TeamScore',text});return}catch(_){}}if(navigator.clipboard)await navigator.clipboard.writeText(text)}
  function renderExport(){const body=ensurePanel().querySelector('.score-v2-tools-body');body.innerHTML=`<div class="score-v2-tools-tabs"><b>Summary & Export</b></div><pre class="score-v2-summary">${gameSummary().replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre><div class="score-v2-tool-actions"><button data-export="copy">Copy summary</button><button data-export="share">Share</button><button data-export="csv">Export CSV</button></div>`;body.querySelectorAll('[data-export]').forEach(b=>b.onclick=async()=>{if(b.dataset.export==='copy'&&navigator.clipboard)await navigator.clipboard.writeText(gameSummary());if(b.dataset.export==='share')await shareSummary();if(b.dataset.export==='csv')downloadCsv()})}

  function updateStatsStrip(){
    const hud=document.querySelector('.score-v2-game-hud'),g=UI.getState().game;if(!hud||!g||!Games.statsSummary)return;let strip=hud.querySelector('.score-v2-stats-strip');if(!strip){strip=document.createElement('div');strip.className='score-v2-stats-strip';hud.insertBefore(strip,hud.querySelector('footer'))}const s=Games.statsSummary(g);let extra='';if(g.mode==='best-of')extra=` · Sets ${g.meta.setWins?.join('–')||''}`;if(g.mode==='king-rotation')extra=` · Active ${(g.meta.activePair||[]).map(i=>g.teams[i]?.name).filter(Boolean).join(' vs ')}`;if(g.mode==='sideout'){const t=g.teams[0];extra=` · Attempts ${g.meta.attemptsByTeam?.[t.id]||0}/${g.settings.attempts}`};strip.textContent=`Lead changes ${s.leadChanges} · Ties ${s.ties}${extra}`;
  }

  function tick(){
    let dirty=false;multi.forEach(item=>{const snap=Timer.snapshot(item.state,Date.now());if(snap.finished&&!item.announced){item.announced=true;announce(`${item.name}. Time`);dirty=true}});if(dirty)save();
    if(panel&&!panel.hidden&&panel.querySelector('.score-v2-multi-list')){panel.querySelectorAll('.score-v2-mini-timer').forEach(card=>{const item=itemById(card.dataset.id);if(!item)return;const snap=Timer.snapshot(item.state,Date.now()),el=card.querySelector('[data-mini-time]');if(el)el.textContent=`${snap.overtime?'+':''}${Timer.formatClock(snap.overtime?snap.overtimeMs:snap.displayMs||0)}`;const play=card.querySelector('[data-mini="play"]');if(play)play.textContent=snap.running?'⏸':'▶'})}
    updateStatsStrip();
  }

  addHeadButton('🎤','Voice control','voice');addHeadButton('⏲','Multiple timers','multi');addHeadButton('⇩','Summary and export','export');
  setInterval(tick,300);
  window.ScoreToolsV2={openMulti:()=>openTools('multi'),openExport:()=>openTools('export'),executeVoice,getMultiTimers:()=>multi.map(x=>({id:x.id,name:x.name,state:x.state})),summary:gameSummary};
})();
