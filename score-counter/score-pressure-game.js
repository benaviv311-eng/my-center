(function(){
  'use strict';
  const STORAGE_PREFIX='teamScorePressure.';
  let baseSay=null;
  let runtime=null;
  let observer=null;
  let debounceTimer=0;

  function suite(){return window.TeamScoreGameSuite||null}
  function session(){const s=suite();return s&&s.getSession?s.getSession():null}
  function active(){const s=session();return !!(s&&s.mode==='pressure-game')}
  function key(suffix){const s=session();return STORAGE_PREFIX+(s?s.id:'none')+'.'+suffix}
  function readJson(k,fallback){try{return JSON.parse(localStorage.getItem(k)||'')||fallback}catch(_){return fallback}}
  function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}

  function teamCards(){
    const host=document.getElementById('teams');if(!host)return[];
    return Array.from(host.children).filter(x=>x.nodeType===1).map((card,index)=>{
      const nameNode=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h2,h3,strong');
      const scoreNode=card.querySelector('.score-board-value,.score-value,.team-score,.score-number,[data-role="score"]')||Array.from(card.querySelectorAll('*')).find(el=>/^\d+$/.test((el.textContent||'').trim())&&!el.closest('button'));
      return{index,card,name:(nameNode&&nameNode.textContent||`Team ${index+1}`).trim(),score:Number(scoreNode&&scoreNode.textContent||0)||0,scoreNode,voiceAlias:card.dataset.voiceAlias||''};
    }).slice(0,2);
  }
  function voiceName(team){return team&&(team.voiceAlias||team.name)||'Team'}
  function scores(){return teamCards().map(t=>t.score)}
  function leaderIndex(values){if(values.length<2||values[0]===values[1])return -1;return values[0]>values[1]?0:1}

  function installAnnouncerGuard(){
    const s=suite();if(!s||!s.announcer||baseSay)return false;
    baseSay=s.announcer.say.bind(s.announcer);
    s.announcer.say=function(text,priority){
      if(active()&&(/Game point/i.test(text)||/Tied\.?$/i.test(text)||/ wins\.?$/i.test(text)))return;
      return baseSay(text,priority);
    };
    return true;
  }
  function speak(text,priority){
    if(!text)return;installAnnouncerGuard();
    if(baseSay)return baseSay(text,priority||'normal');
    const s=suite();if(s&&s.announcer)s.announcer.say(text,priority||'normal');
  }

  function setupOptions(){return Object.assign({commentary:'every',context:'set',server:0,startA:22,startB:22,target:25,winBy2:true},readJson(key('options'),{}))}
  function storeSetupOptions(panel){
    const readCfg=n=>panel.querySelector(`[data-cfg="${n}"]`);
    const opts={
      commentary:panel.querySelector('[data-pressure-commentary]')?.value||'every',
      context:panel.querySelector('[data-pressure-context]')?.value||'set',
      server:Number(panel.querySelector('[data-pressure-server]')?.value||0),
      startA:Number(readCfg('scoreA')?.value||22),startB:Number(readCfg('scoreB')?.value||22),target:Number(readCfg('target')?.value||25),winBy2:!!readCfg('winBy2')?.checked
    };
    saveJson(key('options'),opts);return opts;
  }

  function decorateSetup(){
    if(!active())return;
    const panel=document.querySelector('.score-suite-active');if(!panel||panel.querySelector('.score-pressure-setup'))return;
    const teams=teamCards(),opts=setupOptions();
    const block=document.createElement('section');block.className='score-pressure-setup';block.innerHTML=`<div class="score-pressure-title"><strong>🔥 Pressure Game</strong><span>הכרזות לחץ חכמות</span></div><div class="score-pressure-fields"><label>Commentary<select data-pressure-commentary><option value="every" ${opts.commentary==='every'?'selected':''}>Every point</option><option value="important" ${opts.commentary==='important'?'selected':''}>Important only</option></select></label><label>Pressure point<select data-pressure-context><option value="set" ${opts.context==='set'?'selected':''}>Set point</option><option value="match" ${opts.context==='match'?'selected':''}>Match point</option><option value="game" ${opts.context==='game'?'selected':''}>Game point</option></select></label><label>Starting server<select data-pressure-server><option value="0">${teams[0]?.name||'Team A'}</option><option value="1" ${opts.server===1?'selected':''}>${teams[1]?.name||'Team B'}</option></select></label></div>`;
    const form=panel.querySelector('.score-suite-form');(form||panel.querySelector('.score-suite-sheet-head'))?.after(block);
  }

  function initRuntime(force){
    const s=session();if(!s||s.mode!=='pressure-game')return null;
    if(!runtime||runtime.sessionId!==s.id||force){
      const opts=setupOptions(),current=scores();runtime={sessionId:s.id,opts,lastScores:current.length===2?current:[opts.startA,opts.startB],leader:leaderIndex(current),streakTeam:-1,streak:0,winnerAnnounced:false};
    }
    return runtime;
  }
  function scorePhrase(values,teams){
    if(values[0]===values[1])return`Score, ${values[0]} all.`;
    return`${voiceName(teams[0])} ${values[0]}, ${voiceName(teams[1])} ${values[1]}.`;
  }
  function pointLabel(context){return context==='match'?'Match point':context==='game'?'Game point':'Set point'}
  function winnerLabel(context){return context==='match'?'match':context==='game'?'game':'set'}

  function updateStreak(previous,current){
    if(!runtime)return;
    const d0=current[0]-previous[0],d1=current[1]-previous[1];let scorer=-1;
    if(d0>0&&d1===0)scorer=0;else if(d1>0&&d0===0)scorer=1;
    if(scorer<0)return;
    if(runtime.streakTeam===scorer)runtime.streak+=Math.max(d0,d1);else{runtime.streakTeam=scorer;runtime.streak=Math.max(d0,d1)}
  }
  function importantPhrase(previous,current,teams){
    const opts=runtime.opts,target=Number(opts.target||25),lead=leaderIndex(current);
    if(lead<0){if(current[0]>0)return'We are tied.';return''}
    const other=1-lead,diff=current[lead]-current[other],win= current[lead]>=target && (!opts.winBy2||diff>=2);
    if(win&&!runtime.winnerAnnounced){runtime.winnerAnnounced=true;return`${voiceName(teams[lead])} wins the ${winnerLabel(opts.context)}.`}
    const hasPoint=current[lead]>=target-1 && (!opts.winBy2||diff===1);
    if(hasPoint)return`${pointLabel(opts.context)}, ${voiceName(teams[lead])}.`;
    const prevLead=leaderIndex(previous);
    if(prevLead!==lead&&(prevLead<0||prevLead===other))return`${voiceName(teams[lead])} takes the lead.`;
    if(runtime.streak>=3)return`${runtime.streak} points in a row for ${voiceName(teams[runtime.streakTeam])}.`;
    if(Math.abs(current[0]-current[1])===1&&Math.max(...current)>=target-3)return'One point game.';
    return'';
  }

  function handleScoreChange(){
    if(!active())return;const r=initRuntime(),teams=teamCards(),current=scores();if(!r||current.length<2)return;
    const previous=r.lastScores||current;if(previous[0]===current[0]&&previous[1]===current[1]){decorateActive();return}
    updateStreak(previous,current);const event=importantPhrase(previous,current,teams),score=scorePhrase(current,teams);
    r.lastScores=current.slice();r.leader=leaderIndex(current);
    if(r.opts.commentary==='every')speak(event?`${score} ${event}`:score,event?'high':'normal');else if(event)speak(event,'high');
    decorateActive();
  }
  function scheduleScoreCheck(){clearTimeout(debounceTimer);debounceTimer=setTimeout(handleScoreChange,35)}

  function setTeamScore(index,value){
    const t=teamCards()[index];if(!t)return false;value=Math.max(0,Number(value)||0);const before=t.score,delta=value-before;
    const buttons=Array.from(t.card.querySelectorAll('button'));
    const plus=buttons.find(b=>/^\+?1$/.test((b.textContent||'').trim())||/plus|increment|הוסף/i.test(b.getAttribute('aria-label')||''));
    const minus=buttons.find(b=>/^-1$/.test((b.textContent||'').trim())||/minus|decrement|הפחת/i.test(b.getAttribute('aria-label')||''));
    const button=delta>0?plus:minus;if(button){for(let i=0;i<Math.abs(delta);i++)button.click();return true}
    if(t.scoreNode){t.scoreNode.textContent=String(value);return true}return false;
  }
  function replayScenario(){
    if(!active())return;const r=initRuntime(),opts=r.opts;r.winnerAnnounced=false;r.streak=0;r.streakTeam=-1;
    setTeamScore(0,opts.startA);setTeamScore(1,opts.startB);r.lastScores=[opts.startA,opts.startB];r.leader=leaderIndex(r.lastScores);decorateActive();
    speak(opts.startA===opts.startB?`Score, ${opts.startA} all. Play.`:`Score, ${opts.startA} to ${opts.startB}. Play.`,'high');
  }
  function speakCurrent(){const teams=teamCards(),v=scores();if(v.length===2)speak(scorePhrase(v,teams),'high')}

  function statusText(){
    const r=initRuntime(),v=scores();if(!r||v.length<2)return'';const lead=leaderIndex(v);if(lead<0)return`${v[0]} ALL`;
    const teams=teamCards();return`${teams[lead]?.name||'Team'} LEADS · ${v[lead]}–${v[1-lead]}`;
  }
  function decorateActive(){
    if(!active())return;const panel=document.querySelector('.score-suite-active-game');if(!panel)return;let hud=panel.querySelector('.score-pressure-hud');if(hud)hud.remove();const r=initRuntime(),teams=teamCards();hud=document.createElement('section');hud.className='score-pressure-hud';hud.innerHTML=`<div class="score-pressure-kicker">PRESSURE GAME</div><div class="score-pressure-live">${statusText()}</div><div class="score-pressure-meta"><span>Target ${r.opts.target}</span><span>${r.opts.winBy2?'Win by 2':'Straight finish'}</span><span>${pointLabel(r.opts.context)}</span><span>Commentary: ${r.opts.commentary==='every'?'Every point':'Important'}</span><span>Server: ${teams[r.opts.server]?.name||'Team'}</span></div><div class="score-pressure-actions"><button data-pressure-replay>Replay Scenario</button><button data-pressure-speak>Speak Score</button></div>`;
    const head=panel.querySelector('.score-suite-sheet-head');head?.after(hud);
  }

  function activateAfterStart(){
    if(!active())return;initRuntime(true);decorateActive();const r=runtime,teams=teamCards();
    if(!r._opened){r._opened=true;setTimeout(()=>{const v=scores();if(v.length===2&&r.opts.commentary==='every')speak(v[0]===v[1]?`Score, ${v[0]} all. Play.`:`Score, ${v[0]} to ${v[1]}. Play.`,'high');if(teams[r.opts.server])setTimeout(()=>speak(`${voiceName(teams[r.opts.server])} serving.`,'normal'),900)},80)}
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-begin')&&b.closest('.score-suite-active')&&active()){storeSetupOptions(b.closest('.score-suite-active'));setTimeout(activateAfterStart,40);return}
    if(b.hasAttribute('data-pressure-replay')){e.preventDefault();e.stopPropagation();replayScenario();return}
    if(b.hasAttribute('data-pressure-speak')){e.preventDefault();e.stopPropagation();speakCurrent();return}
    if(active()&&(b.dataset.scoreTeam!==undefined||b.closest('#teams')))scheduleScoreCheck();
  },true);

  function installScoreObserver(){
    const teams=document.getElementById('teams');if(!teams||observer)return false;
    observer=new MutationObserver(()=>{if(active())scheduleScoreCheck()});observer.observe(teams,{subtree:true,childList:true,characterData:true});return true;
  }
  function poll(){installAnnouncerGuard();installScoreObserver();if(active()){decorateSetup();if(document.querySelector('.score-suite-active-game'))decorateActive()}}
  setInterval(poll,350);

  window.TeamScorePressureGame={decorateSetup,decorateActive,replay:replayScenario,speakScore:speakCurrent,handleScoreChange};
})();