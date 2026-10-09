(function(){
  const UI=window.ScoreGamesUI,Timer=window.ScoreTimerV2Core;
  if(!UI||!Timer)return;
  const ENDPOINT='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/score-remote';
  const CONTROLLER_KEY='score:v2:remote-controller';
  let controller=read(CONTROLLER_KEY,null),panel=null,lastSent='',writeBusy=false,displayState=null,displayOffset=0,lastRemoteUpdate='',pollBusy=false;
  const hashParams=new URLSearchParams(String(location.hash||'').replace(/^#/,''));
  const isDisplay=hashParams.get('remote')==='display';

  function read(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v}catch(_){return f}}
  function save(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
  async function api(payload){
    const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
    let data={};try{data=await r.json()}catch(_){}
    if(!r.ok)throw new Error(data.error||`remote_${r.status}`);return data;
  }
  function boardSnapshot(){
    return Array.from(document.querySelectorAll('#teams > .card')).map((card,i)=>{
      const nameEl=card.querySelector('.score-team-name-top,[data-team-name],input[type="text"],h2,h3,.team-name,.name');
      const scoreEl=card.querySelector('.score-board-value,.team-score,.score-value,[data-role="score"]');
      const name=(nameEl&&(nameEl.value||nameEl.textContent)||`Team ${i+1}`).trim();
      const match=String(scoreEl&&(scoreEl.value||scoreEl.textContent)||'0').match(/-?\d+/);
      return{name,score:match?Number(match[0]):0};
    });
  }
  function controllerSnapshot(){
    const state=UI.getState();
    return{version:1,sentAt:Date.now(),timer:state.timer||null,game:state.game||null,board:boardSnapshot(),court:document.body.classList.contains('score-v2-court')};
  }
  function displayLink(data=controller){
    if(!data)return'';const base=location.href.split('#')[0];return `${base}#remote=display&room=${encodeURIComponent(data.room)}&secret=${encodeURIComponent(data.displaySecret)}`;
  }

  function addRemoteButton(){
    const head=document.querySelector('.score-v2-timer-head');if(!head||head.querySelector('[data-remote-open]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.remoteOpen='1';b.title='Remote display';b.textContent='📡';b.onclick=e=>{e.stopPropagation();openPanel()};head.insertBefore(b,head.querySelector('.score-v2-spacer'));
  }
  function ensurePanel(){
    if(panel)return panel;panel=document.createElement('section');panel.className='score-v2-remote-panel';panel.hidden=true;panel.innerHTML='<header><strong>REMOTE DISPLAY</strong><button data-r-close>✕</button></header><div data-r-body></div>';document.body.appendChild(panel);panel.querySelector('[data-r-close]').onclick=()=>panel.hidden=true;panel.addEventListener('click',handlePanelClick);return panel;
  }
  function openPanel(){ensurePanel().hidden=false;renderControllerPanel()}
  function renderControllerPanel(message=''){
    const body=ensurePanel().querySelector('[data-r-body]');
    if(!controller){body.innerHTML=`<p>Show the live timer and score on another phone, tablet or screen.</p>${message?`<p class="score-v2-remote-error">${esc(message)}</p>`:''}<button class="score-v2-start-game" data-r-create>CREATE DISPLAY ROOM</button>`;return}
    const link=displayLink();body.innerHTML=`<div class="score-v2-remote-status"><span class="dot"></span><b>ROOM ACTIVE</b></div><div class="score-v2-pair-grid"><div><small>ROOM CODE</small><strong>${esc(controller.room)}</strong></div><div><small>DISPLAY PIN</small><strong>${esc(controller.displaySecret)}</strong></div></div><canvas data-r-qr width="220" height="220"></canvas><p class="score-v2-note">Open the display link on the second device, or enter the room code and display PIN there. The display credential can only read; only this controller can write.</p><div class="score-v2-remote-actions"><button data-r-copy>COPY DISPLAY LINK</button><button data-r-open>OPEN DISPLAY HERE</button><button data-r-close-room>CLOSE ROOM</button></div>${message?`<p class="score-v2-remote-error">${esc(message)}</p>`:''}`;renderQr(body.querySelector('[data-r-qr]'),link);
  }
  async function handlePanelClick(e){
    if(e.target.closest('[data-r-create]')){try{const data=await api({action:'create',state:controllerSnapshot()});controller={room:data.room,controllerSecret:data.controllerSecret,displaySecret:data.displaySecret,expiresAt:data.expiresAt};save(CONTROLLER_KEY,controller);lastSent='';renderControllerPanel();syncController(true)}catch(err){renderControllerPanel(err.message)}return}
    if(e.target.closest('[data-r-copy]')){try{await navigator.clipboard.writeText(displayLink());e.target.textContent='COPIED'}catch(_){ }return}
    if(e.target.closest('[data-r-open]')){window.open(displayLink(),'_blank','noopener');return}
    if(e.target.closest('[data-r-close-room]')){const old=controller;controller=null;save(CONTROLLER_KEY,null);lastSent='';renderControllerPanel();if(old)api({action:'close',room:old.room,secret:old.controllerSecret}).catch(()=>{});return}
  }
  async function loadQrLibrary(){
    if(window.QRCode?.toCanvas)return true;
    return new Promise(resolve=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';s.referrerPolicy='no-referrer';s.crossOrigin='anonymous';s.onload=()=>resolve(!!window.QRCode?.toCanvas);s.onerror=()=>resolve(false);document.head.appendChild(s)});
  }
  async function renderQr(canvas,text){
    if(!canvas||!text)return;const ok=await loadQrLibrary();if(!ok){canvas.hidden=true;return}try{await window.QRCode.toCanvas(canvas,text,{width:220,margin:1,errorCorrectionLevel:'M'})}catch(_){canvas.hidden=true}
  }
  async function syncController(force=false){
    if(!controller||writeBusy||isDisplay)return;const state=controllerSnapshot(),stable=JSON.stringify(Object.assign({},state,{sentAt:0}));if(!force&&stable===lastSent)return;writeBusy=true;
    try{await api({action:'write',room:controller.room,secret:controller.controllerSecret,state});lastSent=stable}
    catch(err){if(/room_not_found|forbidden/.test(err.message)){controller=null;save(CONTROLLER_KEY,null);lastSent='';if(panel&&!panel.hidden)renderControllerPanel('The remote room expired. Create a new one.')}}finally{writeBusy=false}
  }

  function setupDisplay(){
    document.body.classList.add('score-v2-remote-mode');const root=document.createElement('main');root.className='score-v2-remote-display';root.innerHTML='<div class="score-v2-remote-connect"><h1>TeamScore Display</h1><div data-r-join-form></div><div data-r-connection>Connecting…</div></div><section data-r-stage hidden><header><span data-r-game></span><span data-r-connection-stage>● CONNECTING</span></header><div class="score-v2-remote-timer"><small data-r-phase></small><strong data-r-time>00:00</strong><small data-r-round></small></div><div class="score-v2-remote-scores" data-r-scores></div></section>';document.body.appendChild(root);
    const room=String(hashParams.get('room')||'').toUpperCase(),secret=String(hashParams.get('secret')||'');if(room&&secret){startDisplay(room,secret)}else renderJoinForm(root);
    setInterval(renderDisplayClock,100);
  }
  function renderJoinForm(root){
    const box=root.querySelector('[data-r-join-form]');box.innerHTML='<label>Room code<input data-r-room maxlength="12" autocomplete="off"></label><label>Display PIN<input data-r-pin maxlength="20" autocomplete="off"></label><button data-r-join>CONNECT</button>';box.querySelector('[data-r-join]').onclick=()=>{const room=box.querySelector('[data-r-room]').value.trim().toUpperCase(),secret=box.querySelector('[data-r-pin]').value.trim().toUpperCase();if(room&&secret)startDisplay(room,secret)};
  }
  function startDisplay(room,secret){
    const root=document.querySelector('.score-v2-remote-display'),form=root.querySelector('[data-r-join-form]');if(form)form.innerHTML='';root.dataset.room=room;root.dataset.secret=secret;pollDisplay(true);if(!root._poll){root._poll=setInterval(()=>pollDisplay(false),650)}
  }
  async function pollDisplay(force){
    const root=document.querySelector('.score-v2-remote-display');if(!root||pollBusy)return;const room=root.dataset.room,secret=root.dataset.secret;if(!room||!secret)return;pollBusy=true;
    try{const data=await api({action:'read',room,secret});if(force||data.updatedAt!==lastRemoteUpdate){lastRemoteUpdate=data.updatedAt;displayState=data.state||{};displayOffset=Date.now()-Number(displayState.sentAt||Date.now());renderDisplayState()}setConnection(true)}catch(err){setConnection(false,err.message)}finally{pollBusy=false}
  }
  function setConnection(ok,message=''){
    const root=document.querySelector('.score-v2-remote-display');if(!root)return;const intro=root.querySelector('[data-r-connection]'),stage=root.querySelector('[data-r-connection-stage]');if(intro)intro.textContent=ok?'Connected':message==='room_not_found'?'Room expired or not found':'Connection lost';if(stage){stage.textContent=ok?'● LIVE':'● OFFLINE';stage.classList.toggle('offline',!ok)}
  }
  function adjustedTimer(timer){if(!timer)return null;const t=JSON.parse(JSON.stringify(timer));if(t.running&&Number.isFinite(Number(t.startedAt)))t.startedAt=Number(t.startedAt)+displayOffset;return t}
  function renderDisplayState(){
    const root=document.querySelector('.score-v2-remote-display');if(!root||!displayState)return;root.querySelector('.score-v2-remote-connect').hidden=true;const stage=root.querySelector('[data-r-stage]');stage.hidden=false;const game=displayState.game,gameName=game?.definition?.name||game?.mode||'';root.querySelector('[data-r-game]').textContent=gameName?String(gameName).toUpperCase():'TEAM SCORE';const scores=root.querySelector('[data-r-scores]');const rows=game?.teams?.length?game.teams:(displayState.board||[]);scores.innerHTML=rows.map(t=>`<article class="${t.eliminated?'eliminated':''}"><strong>${esc(t.name)}</strong><b>${game?.mode==='spiegel'?Number(t.badPoints||0):Number(t.score||0)}</b>${game?.mode==='spiegel'?'<small>BAD POINTS</small>':''}</article>`).join('');
  }
  function renderDisplayClock(){
    if(!isDisplay||!displayState)return;const root=document.querySelector('.score-v2-remote-display'),timer=adjustedTimer(displayState.timer);if(!root||!timer)return;const snap=Timer.snapshot(timer,Date.now()),time=root.querySelector('[data-r-time]'),phase=root.querySelector('[data-r-phase]'),round=root.querySelector('[data-r-round]');time.textContent=snap.overtime?`+${Timer.formatClock(snap.overtimeMs)}`:Timer.formatClock(snap.displayMs||0);phase.textContent=snap.phase&&snap.phase!=='finished'?String(snap.phase).toUpperCase():String(timer.mode||'').toUpperCase();round.textContent=snap.round?`ROUND ${snap.round}${timer.intervalPlan?.rounds?` / ${timer.intervalPlan.rounds}`:''}`:'';
  }

  if(isDisplay)setupDisplay();else{addRemoteButton();setInterval(()=>syncController(false),500);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncController(true)})}
  window.ScoreRemoteV2={open:openPanel,getController:()=>controller,displayLink,forceSync:()=>syncController(true)};
})();
