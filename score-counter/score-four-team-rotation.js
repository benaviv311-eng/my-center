(function(){
  'use strict';
  const PREFIX='teamScoreFourTeam.';
  let runtime=null,observer=null,debounce=0;
  function suite(){return window.TeamScoreGameSuite||null}
  function session(){const s=suite();return s&&s.getSession?s.getSession():null}
  function active(){const s=session();return !!(s&&s.mode==='four-team-rotation')}
  function key(){const s=session();return PREFIX+(s?s.id:'none')}
  function load(){try{return JSON.parse(localStorage.getItem(key())||'')||null}catch(_){return null}}
  function save(){try{if(runtime)localStorage.setItem(key(),JSON.stringify(runtime))}catch(_){}}
  function announce(text,p){const s=suite();if(s&&s.announcer)s.announcer.say(text,p||'normal')}
  function teams(){const host=document.getElementById('teams');if(!host)return[];return Array.from(host.children).filter(x=>x.nodeType===1).map((card,index)=>{const nameNode=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h2,h3,strong');const scoreNode=card.querySelector('.score-board-value,.score-value,.team-score,.score-number,[data-role="score"]')||Array.from(card.querySelectorAll('*')).find(el=>/^\d+$/.test((el.textContent||'').trim())&&!el.closest('button'));return{index,card,name:(nameNode&&nameNode.textContent||`Team ${index+1}`).trim(),score:Number(scoreNode&&scoreNode.textContent||0)||0,voiceAlias:card.dataset.voiceAlias||''}}).slice(0,4)}
  function voiceName(t){return t&&(t.voiceAlias||t.name)||'Team'}
  function config(){const s=session(),c=s&&s.config||{};return{midpoint:Number(c.midpoint||10),target:Number(c.target||20)}}
  function rank(){return teams().slice().sort((a,b)=>b.score-a.score||a.index-b.index)}
  function init(force){if(!active())return null;if(runtime&&!force)return runtime;const saved=load();if(saved&&!force){runtime=saved;applySides();return runtime}runtime={firstToTen:false,rankAt10:[],sideA:[0,1],sideB:[2,3],finalRank:[],finished:false,midpoint:config().midpoint,target:config().target};save();applySides();return runtime}
  function clearSideBadges(){teams().forEach(t=>{t.card.style.order='';t.card.removeAttribute('data-four-side');t.card.querySelector('.score-four-side-badge')?.remove()})}
  function badge(card,label){let el=card.querySelector('.score-four-side-badge');if(!el){el=document.createElement('span');el.className='score-four-side-badge';card.appendChild(el)}el.textContent=label}
  function applySides(){if(!runtime)return;const ts=teams();const order=[...runtime.sideA,...runtime.sideB];ts.forEach(t=>{const pos=order.indexOf(t.index);t.card.style.order=String(pos<0?t.index+1:pos+1);const side=runtime.sideA.includes(t.index)?'A':'B';t.card.dataset.fourSide=side;badge(t.card,`Side ${side}`)})}
  function halftime(){const r=rank();if(r.length<4)return;runtime.firstToTen=true;runtime.rankAt10=r.map(t=>t.name);runtime.sideA=[r[0].index,r[3].index];runtime.sideB=[r[1].index,r[2].index];save();applySides();announce('HALFTIME. NEW TEAMS. FIRST + FOURTH. SECOND + THIRD.','high');setTimeout(()=>announce(`${voiceName(r[0])} with ${voiceName(r[3])}. ${voiceName(r[1])} with ${voiceName(r[2])}.`,'normal'),900);render()}
  function finish(){const r=rank();runtime.finished=true;runtime.finalRank=r.map(t=>t.name);save();announce(`${voiceName(r[0])} wins. Final ranking.`,'finish');render()}
  function evaluate(){if(!active())return;const rt=init(),c=config(),ts=teams();if(ts.length<4){render();return}rt.midpoint=c.midpoint;rt.target=c.target;if(!rt.firstToTen&&ts.some(t=>t.score>=c.midpoint))halftime();if(!rt.finished&&ts.some(t=>t.score>=c.target))finish();applySides();render()}
  function pairNames(indices){const ts=teams();return indices.map(i=>ts.find(t=>t.index===i)?.name||`Team ${i+1}`).join(' + ')}
  function changesHtml(){if(!runtime.finished||!runtime.rankAt10.length)return'';return runtime.finalRank.map((name,i)=>{const old=runtime.rankAt10.indexOf(name),delta=old<0?0:old-i;return`<li><b>#${i+1} ${name}</b><span>${delta>0?'▲ '+delta:delta<0?'▼ '+Math.abs(delta):'—'}</span></li>`}).join('')}
  function render(){if(!active())return;const p=document.querySelector('.score-suite-active-game');if(!p)return;const rt=init(),ts=teams();let hud=p.querySelector('.score-four-team-hud');if(hud)hud.remove();hud=document.createElement('section');hud.className='score-four-team-hud';if(ts.length<4){hud.innerHTML='<strong>4 Teams Rotation</strong><p>צריך להציג 4 קבוצות בלוח כדי להתחיל.</p>'}else{const ranking=rank();hud.innerHTML=`<div class="score-four-kicker">4 TEAMS ROTATION</div><div class="score-four-stage">${rt.finished?'FINAL RANKING':rt.firstToTen?'HALFTIME — NEW TEAMS':`FIRST TO ${rt.midpoint}`}</div><div class="score-four-sides"><div><small>Side A</small><strong>${pairNames(rt.sideA)}</strong></div><div class="score-four-vs">VS</div><div><small>Side B</small><strong>${pairNames(rt.sideB)}</strong></div></div><div class="score-four-rank">${ranking.map((t,i)=>`<span>#${i+1} ${t.name} · ${t.score}</span>`).join('')}</div>${rt.firstToTen?`<div class="score-four-rule"><b>rankAt10:</b> ${rt.rankAt10.join(' · ')}</div>`:''}${rt.finished?`<ol class="score-four-final">${changesHtml()}</ol><div class="score-four-rule"><b>finalRank:</b> ${rt.finalRank.join(' · ')}</div>`:''}`};p.querySelector('.score-suite-sheet-head')?.after(hud)}
  function schedule(){clearTimeout(debounce);debounce=setTimeout(evaluate,25)}
  function installObserver(){const host=document.getElementById('teams');if(!host||observer)return;observer=new MutationObserver(()=>{if(active())schedule()});observer.observe(host,{subtree:true,childList:true,characterData:true})}
  document.addEventListener('click',e=>{if(!active())return;const b=e.target.closest('button');if(!b)return;if(b.dataset.scoreTeam!==undefined||b.closest('#teams'))setTimeout(evaluate,20)},true)
  function poll(){installObserver();if(active()){init();render()}else if(runtime){clearSideBadges();runtime=null}}
  setInterval(poll,400);
  window.TeamScoreFourTeamRotation={evaluate,render,getRuntime:()=>runtime};
})();