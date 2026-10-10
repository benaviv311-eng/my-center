(function(){
  'use strict';
  const ENDPOINT='https://iwemlxvjyhffumzcqrxf.supabase.co/functions/v1/score-remote';
  const STORE='teamScoreRemote.controller.v1';
  let panel=null,writeTimer=0,readTimer=0,lastSent='',lastState=null,busy=false;

  const parse=(s,f)=>{try{return JSON.parse(s)||f}catch(_){return f}};
  const loadController=()=>parse(localStorage.getItem(STORE)||'',null);
  const saveController=v=>{try{v?localStorage.setItem(STORE,JSON.stringify(v)):localStorage.removeItem(STORE)}catch(_){}};
  async function call(body){
    const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    let data={};try{data=await r.json()}catch(_){}
    if(!r.ok){const e=new Error(data.error||('remote_'+r.status));e.status=r.status;e.data=data;throw e}
    return data;
  }
  function teams(){
    const root=document.getElementById('teams');if(!root)return[];
    return Array.from(root.children).filter(x=>x.nodeType===1).map((card,index)=>{
      const name=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h2,h3,strong')?.textContent?.trim()||`Team ${index+1}`;
      const scoreNode=card.querySelector('.score-board-value,.score-value,.team-score,.score-number,[data-role="score"]')||Array.from(card.querySelectorAll('*')).find(el=>/^\d+$/.test((el.textContent||'').trim())&&!el.closest('button'));
      return{name,score:Number(scoreNode?.textContent||0)||0,color:getComputedStyle(card).getPropertyValue('--team-color')||card.style.backgroundColor||''};
    });
  }
  function timerSnapshot(){
    const api=window.TeamScoreTimeCenter,s=api&&api.state;if(!s)return null;
    const now=Date.now();let ms=0,sign='';
    if(s.mode==='stopwatch') ms=s.running?s.anchorValueMs+Math.max(0,now-s.anchorWall):s.anchorValueMs;
    else if(s.overtimeActive){ms=s.overtimeBaseMs+(s.running?Math.max(0,now-s.overtimeAnchorWall):0);sign='+'}
    else ms=s.running?Math.max(0,s.anchorValueMs-Math.max(0,now-s.anchorWall)):Math.max(0,s.anchorValueMs);
    const total=Math.floor(Math.max(0,ms)/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),sec=total%60;
    const display=(h?`${String(h).padStart(2,'0')}:`:'')+`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    const it=s.interval||{};
    return{mode:s.mode,running:!!s.running,ended:!!s.ended,overtime:!!s.overtimeActive,display:sign+display,phase:s.mode==='intervals'?it.phase||'work':'',round:it.round||0,rounds:it.rounds||0,set:it.set||0,sets:it.sets||0};
  }
  function sessionSnapshot(){
    const s=window.TeamScoreGameSuite?.getSession?.();
    return s?{mode:s.mode,modeName:s.modeName,state:s.state||{},config:s.config||{}}:null;
  }
  function capture(){return{v:2,at:Date.now(),teams:teams(),timer:timerSnapshot(),session:sessionSnapshot()}}
  function currentPath(){return location.origin+location.pathname}
  function displayLink(room,displaySecret){return `${currentPath()}?display=1&remote=${encodeURIComponent(room)}&secret=${encodeURIComponent(displaySecret)}`}
  function setStatus(text,kind){const el=panel?.querySelector('[data-r-status]');if(el){el.textContent=text;el.dataset.kind=kind||''}}
  async function createRoom(){
    if(busy)return;busy=true;setStatus('Creating room…');
    try{
      const data=await call({action:'create',state:capture()});
      const state={room:data.room,controllerSecret:data.controllerSecret,displaySecret:data.displaySecret,expiresAt:data.expiresAt};
      saveController(state);startWriter();renderPanel();setStatus('Connected','ok');
    }catch(e){setStatus('Could not create room: '+e.message,'error')}finally{busy=false}
  }
  async function closeRoom(){
    const c=loadController();stopWriter();if(c)try{await call({action:'close',room:c.room,secret:c.controllerSecret})}catch(_){}
    saveController(null);renderPanel();
  }
  async function writeOnce(force){
    const c=loadController();if(!c||busy)return;const state=capture(),json=JSON.stringify(state);if(!force&&json===lastSent)return;
    busy=true;try{await call({action:'write',room:c.room,secret:c.controllerSecret,state});lastSent=json;setStatus('Live · '+new Date().toLocaleTimeString(),'ok')}catch(e){setStatus('Reconnecting…','warn')}finally{busy=false}
  }
  function startWriter(){stopWriter();lastSent='';writeOnce(true);writeTimer=setInterval(()=>writeOnce(false),550)}
  function stopWriter(){if(writeTimer)clearInterval(writeTimer);writeTimer=0}
  function copy(text){navigator.clipboard?.writeText(text).catch(()=>prompt('Copy',text))}
  function open(){
    closePanel();panel=document.createElement('section');panel.className='score-ops-panel score-remote-panel';document.body.appendChild(panel);renderPanel();
    panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.close!==undefined)closePanel();else if(b.dataset.create!==undefined)createRoom();else if(b.dataset.stop!==undefined)closeRoom();else if(b.dataset.copyCode!==undefined){const c=loadController();if(c)copy(c.room)}else if(b.dataset.copyLink!==undefined){const c=loadController();if(c)copy(displayLink(c.room,c.displaySecret))}else if(b.dataset.openDisplay!==undefined){const c=loadController();if(c)window.open(displayLink(c.room,c.displaySecret),'_blank','noopener')}else if(b.dataset.push!==undefined)writeOnce(true)});
  }
  function renderPanel(){
    if(!panel)return;const c=loadController();
    panel.innerHTML=`<div class="score-ops-head"><div><strong>📺 Remote Display</strong><small>טלפון שולט · טאבלט/מסך מציג</small></div><button data-close>✕</button></div>${c?`<div class="score-remote-room"><span>ROOM CODE</span><b>${c.room}</b><div class="score-ops-actions"><button data-copy-code>Copy code</button><button data-copy-link>Copy display link</button><button data-open-display>Open display</button><button data-push>Push now</button><button class="danger" data-stop>Close room</button></div><img class="score-remote-qr" alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=190x190&margin=8&data=${encodeURIComponent(displayLink(c.room,c.displaySecret))}"><p>Display secret: <code>${c.displaySecret}</code></p><small>החדר נשאר פעיל עד 6 שעות. כמה מסכים יכולים להתחבר לאותו קישור.</small></div>`:`<div class="score-ops-empty"><p>צור חדר חדש. תקבל קוד קצר וקישור למסך תצוגה.</p><button class="primary" data-create>Create Remote Room</button></div>`}<div class="score-ops-status" data-r-status></div>`;
  }
  function closePanel(){if(panel?.isConnected)panel.remove();panel=null}
  function renderDisplay(state,connected){
    lastState=state||lastState||{};let root=document.querySelector('.score-remote-display-root');if(!root){root=document.createElement('main');root.className='score-remote-display-root';document.body.appendChild(root)}
    const s=lastState,ts=s.timer||{},sess=s.session||{};
    root.innerHTML=`<div class="score-remote-display-top"><span>${sess.modeName||sess.mode||'TEAM SCORE'}</span><em class="${connected?'on':'off'}">${connected?'LIVE':'RECONNECTING'}</em></div><div class="score-remote-display-teams">${(s.teams||[]).map(t=>`<article><strong>${escapeHtml(t.name)}</strong><b>${Number(t.score)||0}</b></article>`).join('')}</div>${ts?`<div class="score-remote-display-time"><b>${ts.display||'00:00'}</b><span>${ts.mode==='intervals'?`${String(ts.phase||'').toUpperCase()} · ROUND ${ts.round||1}/${ts.rounds||1}`:String(ts.mode||'').toUpperCase()}</span></div>`:''}<div class="score-remote-display-foot">Room ${new URLSearchParams(location.search).get('remote')||''}</div>`;
  }
  function escapeHtml(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  async function poll(room,secret){
    try{const data=await call({action:'read',room,secret});renderDisplay(data.state,true)}catch(_){renderDisplay(lastState,false)}
  }
  function startDisplayFromUrl(){
    const q=new URLSearchParams(location.search),room=(q.get('remote')||'').toUpperCase(),secret=q.get('secret')||'';
    if(q.get('display')!=='1'||!room||!secret)return false;
    document.body.classList.add('score-remote-display-mode');
    poll(room,secret);readTimer=setInterval(()=>poll(room,secret),550);return true;
  }
  function installToolbar(){
    document.querySelectorAll('.score-suite-toolbar').forEach(bar=>{if(bar.querySelector('[data-remote-display]'))return;const b=document.createElement('button');b.type='button';b.dataset.remoteDisplay='';b.textContent='📺 Remote';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()});bar.appendChild(b)});
  }
  function init(){if(startDisplayFromUrl())return;installToolbar();new MutationObserver(installToolbar).observe(document.documentElement,{childList:true,subtree:true});if(loadController())startWriter();}
  window.TeamScoreRemoteDisplay={open,createRoom,closeRoom,writeOnce,capture,displayLink,getController:loadController,poll};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
