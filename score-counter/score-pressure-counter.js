(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.TeamScorePressureCounter=api;if(root.document)api.init();}
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';

  const state={panel:null,observer:null,timer:0,raf:0};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const suite=()=>root?.TeamScoreGameSuite||null;
  const active=()=>suite()?.getSession?.()?.mode==='pressure-game';

  function buildCounterMarkup(teams){
    const a=teams?.[0]||{name:'Team A',score:0},b=teams?.[1]||{name:'Team B',score:0};
    return `<div class="score-pressure-counter-grid" dir="ltr">
      <section class="score-pressure-counter-side score-pressure-counter-a">
        <strong class="score-pressure-counter-name" data-pressure-counter-name="0">${esc(a.name)}</strong>
        <div class="score-pressure-counter-score" data-pressure-counter-score="0">${Number(a.score)||0}</div>
        <div class="score-pressure-counter-controls"><button type="button" data-pressure-team="0" data-pressure-delta="-1" aria-label="Minus ${esc(a.name)}">−</button><button type="button" data-pressure-team="0" data-pressure-delta="1" aria-label="Plus ${esc(a.name)}">+</button></div>
      </section>
      <div class="score-pressure-counter-vs">VS</div>
      <section class="score-pressure-counter-side score-pressure-counter-b">
        <strong class="score-pressure-counter-name" data-pressure-counter-name="1">${esc(b.name)}</strong>
        <div class="score-pressure-counter-score" data-pressure-counter-score="1">${Number(b.score)||0}</div>
        <div class="score-pressure-counter-controls"><button type="button" data-pressure-team="1" data-pressure-delta="-1" aria-label="Minus ${esc(b.name)}">−</button><button type="button" data-pressure-team="1" data-pressure-delta="1" aria-label="Plus ${esc(b.name)}">+</button></div>
      </section>
    </div>`;
  }

  function computePlacement(imageRect,teamsRect){
    const il=Number(imageRect?.left)||0,ir=Number(imageRect?.right)||0,it=Number(imageRect?.top)||0,ib=Number(imageRect?.bottom)||0;
    const tl=Number(teamsRect?.left)||il,tr=Number(teamsRect?.right)||ir,tt=Number(teamsRect?.top)||it,tb=Number(teamsRect?.bottom)||ib;
    const left=Math.max(il,tl),right=Math.min(ir,tr),top=Math.max(it,tt),bottom=Math.min(ib,tb);
    return{left:Math.round(left),width:Math.max(1,Math.round(right-left)),top:Math.round(top),height:Math.max(1,Math.round(bottom-top))};
  }

  function centralImageRect(){
    const w=Math.max(1,root?.innerWidth||1),h=Math.max(1,root?.innerHeight||1);
    return{left:w*.25,right:w*.75,top:0,bottom:h,width:w*.5,height:h};
  }

  function sourceTeams(){
    if(!root?.document)return[];
    const host=root.document.getElementById('teams');if(!host)return[];
    return Array.from(host.children).filter(el=>el.nodeType===1).slice(0,2).map((card,index)=>{
      const nameNode=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h2,h3,strong');
      const scoreNode=card.querySelector('.score-board-value,.score-value,.team-score,.score-number,[data-role="score"]')||Array.from(card.querySelectorAll('*')).find(el=>/^\d+$/.test((el.textContent||'').trim())&&!el.closest('button'));
      return{index,card,name:(nameNode?.textContent||`Team ${index+1}`).trim(),score:Number(scoreNode?.value??scoreNode?.textContent??0)||0,scoreNode};
    });
  }

  function findStepButton(card,delta){
    const buttons=Array.from(card?.querySelectorAll?.('button')||[]);
    return delta>0
      ? buttons.find(b=>/^\+?1$|^\+$/.test((b.textContent||'').trim())||/plus|increment|הוסף/i.test(b.getAttribute('aria-label')||''))
      : buttons.find(b=>/^-1$|^−$|^-$/.test((b.textContent||'').trim())||/minus|decrement|הפחת/i.test(b.getAttribute('aria-label')||''));
  }

  function applyDelta(index,delta){
    const team=sourceTeams()[Number(index)];if(!team)return false;
    const step=delta>=0?1:-1,button=findStepButton(team.card,step);
    if(button){button.click();return true}
    if(!team.scoreNode)return false;
    const next=Math.max(0,(Number(team.scoreNode.value??team.scoreNode.textContent)||0)+step);
    if('value' in team.scoreNode)team.scoreNode.value=String(next);else team.scoreNode.textContent=String(next);
    try{team.scoreNode.dispatchEvent(new Event('input',{bubbles:true}));team.scoreNode.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}
    return true;
  }

  function ensureStyles(){
    if(!root?.document||root.document.getElementById('scorePressureCounterCss'))return;
    const style=root.document.createElement('style');style.id='scorePressureCounterCss';style.textContent=`
      body.score-pressure-custom-counter-active #teams{visibility:hidden!important;pointer-events:none!important}
      .score-pressure-counter{position:fixed;z-index:174;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);border-radius:24px;background:linear-gradient(145deg,rgba(8,15,28,.90),rgba(24,24,27,.86));box-shadow:0 20px 60px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden;color:#fff}
      .score-pressure-counter-grid{height:100%;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:stretch}
      .score-pressure-counter-side{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;min-width:0}
      .score-pressure-counter-a{grid-column:3;background:linear-gradient(180deg,rgba(127,29,29,.22),rgba(127,29,29,.05))}
      .score-pressure-counter-b{grid-column:1;background:linear-gradient(180deg,rgba(30,64,175,.22),rgba(30,64,175,.05))}
      .score-pressure-counter-vs{grid-column:2;grid-row:1;align-self:center;justify-self:center;padding:8px 10px;border-radius:999px;background:rgba(255,255,255,.1);font-weight:1000;letter-spacing:.12em;color:#cbd5e1}
      .score-pressure-counter-name{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:clamp(14px,2.1vw,22px);font-weight:950}
      .score-pressure-counter-score{font-size:clamp(56px,11vw,130px);line-height:.9;font-weight:1000;font-variant-numeric:tabular-nums;text-shadow:0 7px 28px rgba(0,0,0,.4)}
      .score-pressure-counter-controls{display:flex;gap:10px}
      .score-pressure-counter-controls button{width:58px;height:48px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.94);color:#111827;font-size:30px;line-height:1;font-weight:1000;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.22)}
      .score-pressure-counter-controls button:active{transform:scale(.96)}
      @media(max-width:650px){.score-pressure-counter{border-radius:18px}.score-pressure-counter-side{padding:10px 6px;gap:6px}.score-pressure-counter-score{font-size:clamp(44px,14vw,84px)}.score-pressure-counter-name{font-size:12px}.score-pressure-counter-controls{gap:6px}.score-pressure-counter-controls button{width:42px;height:38px;border-radius:11px;font-size:23px}.score-pressure-counter-vs{padding:6px;font-size:11px}}
    `;root.document.head.appendChild(style);
  }

  function sync(){
    if(!state.panel)return;const teams=sourceTeams();if(teams.length<2)return;
    teams.forEach((t,i)=>{const n=state.panel.querySelector(`[data-pressure-counter-name="${i}"]`),s=state.panel.querySelector(`[data-pressure-counter-score="${i}"]`);if(n&&n.textContent!==t.name)n.textContent=t.name;if(s&&s.textContent!==String(t.score))s.textContent=String(t.score)});
  }

  function position(){
    if(!state.panel||!root?.document)return;const teams=root.document.getElementById('teams');if(!teams)return;
    const p=computePlacement(centralImageRect(),teams.getBoundingClientRect());
    state.panel.style.left=p.left+'px';state.panel.style.top=p.top+'px';state.panel.style.width=p.width+'px';state.panel.style.height=p.height+'px';
  }

  function mount(){
    if(!root?.document||!active())return null;ensureStyles();
    const teams=sourceTeams();if(teams.length<2)return null;
    let panel=root.document.querySelector('[data-pressure-counter]');
    if(!panel){panel=root.document.createElement('section');panel.className='score-pressure-counter';panel.dataset.pressureCounter='';panel.innerHTML=buildCounterMarkup(teams);root.document.body.appendChild(panel);state.panel=panel;panel.addEventListener('click',e=>{const b=e.target.closest('[data-pressure-delta]');if(!b)return;e.preventDefault();e.stopPropagation();applyDelta(Number(b.dataset.pressureTeam),Number(b.dataset.pressureDelta));root.setTimeout(sync,0)});}else state.panel=panel;
    root.document.body.classList.add('score-pressure-custom-counter-active');sync();position();return panel;
  }

  function unmount(){
    state.panel?.remove();state.panel=null;root?.document?.body?.classList.remove('score-pressure-custom-counter-active');
  }

  function observe(){
    if(state.observer||!root?.document)return;const teams=root.document.getElementById('teams');if(!teams)return;
    state.observer=new root.MutationObserver(()=>{if(active()){sync();schedulePosition()}});state.observer.observe(teams,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value','class','style']});
  }

  function schedulePosition(){
    if(!root?.requestAnimationFrame)return position();if(state.raf)root.cancelAnimationFrame(state.raf);state.raf=root.requestAnimationFrame(()=>{state.raf=0;position()});
  }

  function pulse(){if(active()){observe();mount();sync();schedulePosition()}else if(state.panel||root?.document?.body?.classList.contains('score-pressure-custom-counter-active'))unmount()}
  function init(){if(!root?.document)return;ensureStyles();root.addEventListener?.('resize',schedulePosition);root.addEventListener?.('scroll',schedulePosition,{passive:true});state.timer=root.setInterval(pulse,220);pulse()}

  return{buildCounterMarkup,computePlacement,sourceTeams,applyDelta,mount,unmount,sync,position,init};
});