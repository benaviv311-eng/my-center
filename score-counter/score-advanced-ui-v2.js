(function(){
  const Games=window.ScoreGamesCore,UI=window.ScoreGamesUI;
  if(!Games||!UI)return;
  const CUSTOM_KEY='score:v2:custom-games',TOURNAMENT_KEY='score:v2:tournament';
  const advancedModes=new Set(['best-of','elimination','sideout','serve-pressure','king-rotation','tournament','custom']);
  let selectedMode='',tournament=load(TOURNAMENT_KEY,null),tournamentPanel=null,activeMatchIndex=null;
  const readNames=host=>String(host.querySelector('[data-f="names"]')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  function load(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v}catch(_){return f}}
  function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}
  function number(host,name,fallback){const v=Number(host.querySelector(`[data-av="${name}"]`)?.value);return Number.isFinite(v)?v:fallback}
  function checked(host,name){return !!host.querySelector(`[data-av="${name}"]`)?.checked}
  function parseRules(text){const out={};String(text||'').split(/\n+/).forEach(line=>{const [k,v]=line.split('=');if(k&&Number.isFinite(Number(v)))out[k.trim()]=Number(v)});return out}
  function esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}

  function inject(){
    const config=document.querySelector('.score-v2-config');if(!config||!selectedMode||!advancedModes.has(selectedMode))return;
    config.querySelector('.score-v2-advanced-fields')?.remove();config.querySelector('[data-advanced-start]')?.remove();
    const original=config.querySelector('[data-start-game]');if(original)original.hidden=true;
    const fields=document.createElement('div');fields.className='score-v2-advanced-fields score-v2-fields';
    if(selectedMode==='best-of')fields.innerHTML='<label>Best of<select data-av="bestOf"><option value="3">Best of 3</option><option value="5">Best of 5</option></select></label><label>Points per set<input data-av="target" type="number" min="1" value="25"></label><label class="score-v2-check"><input data-av="winBy2" type="checkbox" checked> Win by 2</label>';
    if(selectedMode==='elimination')fields.innerHTML='<label>Lives per team<input data-av="lives" type="number" min="1" value="3"></label><p class="score-v2-note">Use − to remove a life. Last team alive wins.</p>';
    if(selectedMode==='sideout')fields.innerHTML='<label>Attempts per team<input data-av="attempts" type="number" min="1" value="10"></label><label>Success target<input data-av="target" type="number" min="1" value="10"></label><p class="score-v2-note">+ records a successful sideout; − records a failed attempt without reducing successes.</p>';
    if(selectedMode==='serve-pressure')fields.innerHTML='<label>Serves per team<input data-av="attempts" type="number" min="1" value="10"></label><label>Scoring rules<textarea data-av="rules">ace=3\ntarget=2\nin=1\nerror=-1</textarea></label>';
    if(selectedMode==='king-rotation')fields.innerHTML='<label>Points to win court<input data-av="target" type="number" min="1" value="1"></label><label>Force king out after streak<input data-av="maxStreak" type="number" min="0" value="3"></label><p class="score-v2-note">Winner stays. Loser goes to the queue. Set 0 to allow an unlimited winning streak.</p>';
    if(selectedMode==='tournament')fields.innerHTML='<label>Format<select data-av="format"><option value="round-robin">Round robin</option></select></label><label>Match target<input data-av="target" type="number" min="1" value="10"></label><label class="score-v2-check"><input data-av="winBy2" type="checkbox"> Win by 2</label><p class="score-v2-note">Enter 3–8 team names above, one per line. The tournament manager creates the schedule and live standings.</p>';
    if(selectedMode==='custom'){
      const saved=load(CUSTOM_KEY,[]);fields.innerHTML=`<label>Game name<input data-av="customName" value="My Game"></label><label>Win target<input data-av="target" type="number" min="1" value="10"></label><label class="score-v2-check"><input data-av="winBy2" type="checkbox"> Win by 2</label><label>Scoring actions<textarea data-av="rules">point=1\nbonus=2\npenalty=-1</textarea></label><label>Saved games<select data-av="saved"><option value="">—</option>${saved.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}</select></label>`;
      setTimeout(()=>{const sel=fields.querySelector('[data-av="saved"]');if(sel)sel.onchange=()=>{const item=saved[Number(sel.value)];if(!item)return;fields.querySelector('[data-av="customName"]').value=item.name;fields.querySelector('[data-av="target"]').value=item.target;fields.querySelector('[data-av="winBy2"]').checked=!!item.winBy2;fields.querySelector('[data-av="rules"]').value=Object.entries(item.rules||{}).map(([k,v])=>`${k}=${v}`).join('\n')}},0);
    }
    config.appendChild(fields);
    const start=document.createElement('button');start.className='score-v2-start-game';start.dataset.advancedStart='1';start.textContent=selectedMode==='tournament'?'CREATE TOURNAMENT':selectedMode==='custom'?'SAVE & START CUSTOM GAME':`START ${String(config.querySelector('h3')?.textContent||selectedMode).toUpperCase()}`;config.appendChild(start);start.onclick=()=>startAdvanced(config,fields);
  }

  function startAdvanced(config,fields){
    const names=readNames(config);if(selectedMode==='tournament'){startTournament(names,fields);return}
    const options={teams:names.length?names:undefined};
    if(selectedMode==='best-of')Object.assign(options,{bestOf:number(fields,'bestOf',3),target:number(fields,'target',25),winBy2:checked(fields,'winBy2')});
    if(selectedMode==='elimination')Object.assign(options,{lives:number(fields,'lives',3)});
    if(selectedMode==='sideout')Object.assign(options,{attempts:number(fields,'attempts',10),target:number(fields,'target',10)});
    if(selectedMode==='serve-pressure')Object.assign(options,{attempts:number(fields,'attempts',10),rules:parseRules(fields.querySelector('[data-av="rules"]')?.value)});
    if(selectedMode==='king-rotation')Object.assign(options,{target:number(fields,'target',1),maxStreak:number(fields,'maxStreak',3)});
    if(selectedMode==='custom'){
      const template={name:fields.querySelector('[data-av="customName"]')?.value.trim()||'Custom Game',target:number(fields,'target',10),winBy2:checked(fields,'winBy2'),rules:parseRules(fields.querySelector('[data-av="rules"]')?.value)};const saved=load(CUSTOM_KEY,[]),idx=saved.findIndex(x=>x.name===template.name);if(idx>=0)saved[idx]=template;else saved.push(template);save(CUSTOM_KEY,saved);Object.assign(options,template,{customWinCondition:'target'});
    }
    UI.startMode(selectedMode,options);const wrap=document.querySelector('.score-v2-drawer-wrap');if(wrap)wrap.hidden=true;
  }

  function ensureTournamentPanel(){
    if(tournamentPanel)return tournamentPanel;tournamentPanel=document.createElement('section');tournamentPanel.className='score-v2-tournament-panel';tournamentPanel.hidden=true;tournamentPanel.innerHTML='<header><strong>TOURNAMENT</strong><button data-t-close>✕</button></header><div data-t-body></div>';document.body.appendChild(tournamentPanel);tournamentPanel.querySelector('[data-t-close]').onclick=()=>tournamentPanel.hidden=true;tournamentPanel.addEventListener('click',onTournamentClick);return tournamentPanel;
  }
  function startTournament(names,fields){
    if(names.length<3)return;const target=number(fields,'target',10),winBy2=checked(fields,'winBy2'),format=fields.querySelector('[data-av="format"]')?.value||'round-robin';tournament=Games.createTournament(names,{format});tournament.settings={target,winBy2};activeMatchIndex=null;save(TOURNAMENT_KEY,tournament);renderTournament();const wrap=document.querySelector('.score-v2-drawer-wrap');if(wrap)wrap.hidden=true;
  }
  function teamName(id){return tournament?.teams.find(t=>t.id===id)?.name||id}
  function renderTournament(){
    if(!tournament)return;const p=ensureTournamentPanel();p.hidden=false;const body=p.querySelector('[data-t-body]'),next=tournament.matches.findIndex(m=>!m.played);body.innerHTML=`<div class="score-v2-t-standings"><h3>Standings</h3>${tournament.standings.map((t,i)=>`<div><b>${i+1}. ${esc(t.name)}</b><span>${t.tablePoints} pts · ${t.wins}W ${t.losses}L · ${t.pointsFor-t.pointsAgainst>=0?'+':''}${t.pointsFor-t.pointsAgainst}</span></div>`).join('')}</div><div class="score-v2-t-matches"><h3>Matches</h3>${tournament.matches.map((m,i)=>`<div class="${m.played?'played':''}"><span>${esc(teamName(m.homeId))} vs ${esc(teamName(m.awayId))}</span><b>${m.played?`${m.homeScore}–${m.awayScore}`:(i===activeMatchIndex?'PLAYING':'')}</b>${!m.played?`<button data-t-start="${i}">${i===activeMatchIndex?'Restart':'Start'}</button>`:''}</div>`).join('')}</div>${activeMatchIndex!=null?'<button class="score-v2-start-game" data-t-save>RECORD CURRENT RESULT</button>':next>=0?`<button class="score-v2-start-game" data-t-start="${next}">START NEXT MATCH</button>`:'<div class="score-v2-t-winner">TOURNAMENT COMPLETE</div>'}`;
  }
  function onTournamentClick(e){const start=e.target.closest('[data-t-start]')?.dataset.tStart;if(start!=null){const i=Number(start),m=tournament.matches[i];activeMatchIndex=i;UI.startMode('first-to',{teams:[teamName(m.homeId),teamName(m.awayId)],target:tournament.settings.target,winBy2:tournament.settings.winBy2});renderTournament();return}if(e.target.closest('[data-t-save]')){const g=UI.getState().game;if(!g||activeMatchIndex==null)return;tournament=Games.recordTournamentResult(tournament,activeMatchIndex,g.teams[0]?.score||0,g.teams[1]?.score||0);save(TOURNAMENT_KEY,tournament);UI.stopMode();activeMatchIndex=null;renderTournament()}}

  document.addEventListener('click',e=>{
    const card=e.target.closest('.score-v2-game-card[data-mode]');if(card){selectedMode=card.dataset.mode;setTimeout(inject,0);return}
    if(e.target.closest('[data-tab="games"],[data-v2="games"]'))setTimeout(inject,0);
  },true);
  if(tournament&&tournament.matches?.some(m=>!m.played)){const head=document.querySelector('.score-v2-timer-head');if(head){const b=document.createElement('button');b.type='button';b.title='Resume tournament';b.textContent='🏆';b.onclick=renderTournament;head.insertBefore(b,head.querySelector('.score-v2-spacer'))}}
  window.ScoreAdvancedUIV2={inject,openTournament:renderTournament,getTournament:()=>tournament,getCustomGames:()=>load(CUSTOM_KEY,[])};
})();
