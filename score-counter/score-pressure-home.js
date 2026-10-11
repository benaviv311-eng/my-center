(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.TeamScorePressureHome=api;if(root.document)api.init();}
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';

  const state={mounted:false,observer:null,timer:0,originalTitle:null,lastSessionId:null};
  const safeUpper=v=>String(v||'Team').trim().toUpperCase();

  function pointLabel(context){return context==='match'?'MATCH POINT':context==='game'?'GAME POINT':'SET POINT'}
  function deriveStatus(values,cfg,names){
    const a=Number(values?.[0]||0),b=Number(values?.[1]||0),target=Math.max(1,Number(cfg?.target||25)),winBy2=cfg?.winBy2!==false;
    const labels=[safeUpper(names?.[0]||'Team A'),safeUpper(names?.[1]||'Team B')],lead=a===b?-1:(a>b?0:1);
    if(lead<0){if(winBy2&&a>=target-1)return'DEUCE · WIN BY 2';const left=Math.max(0,target-a);return`TIED · ${left} ${left===1?'POINT':'POINTS'} TO TARGET`}
    const scores=[a,b],other=1-lead,diff=scores[lead]-scores[other],won=scores[lead]>=target&&(!winBy2||diff>=2);
    if(won)return`${labels[lead]} WINS · ${a}–${b}`;
    const pressurePoint=winBy2?scores[lead]>=target-1&&diff===1:scores[lead]===target-1;
    if(pressurePoint)return`${pointLabel(cfg?.context)} · ${labels[lead]}`;
    const left=Math.max(0,target-scores[lead]);return`${labels[lead]} LEADS · ${left} ${left===1?'POINT':'POINTS'} TO TARGET`;
  }
  function rulesLine(cfg){const startA=Number(cfg?.startA??cfg?.scoreA??0),startB=Number(cfg?.startB??cfg?.scoreB??0),target=Math.max(1,Number(cfg?.target||25));return`Start ${startA}–${startB} · First to ${target}${cfg?.winBy2!==false?' · Win by 2':''}`}
  function suite(){return root?.TeamScoreGameSuite||null}
  function session(){return suite()?.getSession?.()||null}
  function active(){return session()?.mode==='pressure-game'}
  function teamCards(){
    if(!root?.document)return[];const host=root.document.getElementById('teams');if(!host)return[];
    return Array.from(host.children).filter(el=>el.nodeType===1).slice(0,2).map((card,index)=>{const nameNode=card.querySelector('.score-team-name-top,.team-name,[data-role="team-name"],h2,h3,strong');const scoreNode=card.querySelector('.score-board-value,.score-value,.team-score,.score-number,[data-role="score"]')||Array.from(card.querySelectorAll('*')).find(el=>/^\d+$/.test((el.textContent||'').trim())&&!el.closest('button'));return{card,index,name:(nameNode?.textContent||`Team ${index+1}`).trim(),score:Number(scoreNode?.value??scoreNode?.textContent??0)||0}});
  }
  function readOptions(id){try{return JSON.parse(root.localStorage.getItem(`teamScorePressure.${id}.options`)||'{}')||{}}catch(_){return{}}}
  function homeConfig(){const s=session(),stored=s?readOptions(s.id):{};return Object.assign({startA:Number(s?.config?.scoreA||0),startB:Number(s?.config?.scoreB||0),target:Number(s?.config?.target||25),winBy2:s?.config?.winBy2!==false,context:'set'},stored||{})}
  function host(){const teams=root?.document?.getElementById('teams');return teams?.parentElement||null}
  function closeActiveSheet(){const p=root?.document?.querySelector('.score-suite-active-game');if(!p)return;const close=p.querySelector('[data-close]');if(close)close.click();else p.remove()}
  function ensureHome(){
    if(!root?.document||!active())return null;const teams=root.document.getElementById('teams'),parent=host();if(!teams||!parent)return null;
    let el=root.document.querySelector('[data-pressure-home]');
    if(!el){el=root.document.createElement('section');el.className='score-pressure-home';el.dataset.pressureHome='';el.setAttribute('dir','ltr');el.innerHTML=`<div class="score-pressure-home-top"><div><span class="score-pressure-home-kicker">GAME MODE</span><h1>PRESSURE GAME</h1></div><button type="button" class="score-pressure-home-settings" data-pressure-settings aria-label="Pressure Game settings">⚙</button></div><div class="score-pressure-home-rules" data-pressure-rules></div><div class="score-pressure-home-status" data-pressure-home-status></div><div class="score-pressure-home-actions"><button type="button" data-pressure-replay>Replay Scenario</button><button type="button" data-pressure-settings>Change Start</button></div>`;parent.insertBefore(el,teams);state.mounted=true}
    root.document.body.classList.add('score-home-game-active','score-home-pressure');updateHome();return el;
  }
  function updateHome(){
    const el=root?.document?.querySelector('[data-pressure-home]');if(!el||!active())return;const cfg=homeConfig(),teams=teamCards(),values=teams.map(t=>t.score),names=teams.map(t=>t.name);const rules=el.querySelector('[data-pressure-rules]'),status=el.querySelector('[data-pressure-home-status]');if(rules)rules.textContent=rulesLine(cfg);if(status)status.textContent=deriveStatus(values,cfg,names);if(state.originalTitle===null)state.originalTitle=root.document.title;root.document.title=`Pressure Game · ${state.originalTitle||'TeamScore'}`;
  }
  function removeHome(){const el=root?.document?.querySelector('[data-pressure-home]');if(el)el.remove();root?.document?.body?.classList.remove('score-home-game-active','score-home-pressure');if(state.originalTitle!==null&&root?.document){root.document.title=state.originalTitle;state.originalTitle=null}state.mounted=false}
  function openSettings(){
    const cfg=homeConfig();suite()?.startMode?.('pressure-game');
    root.setTimeout(()=>{const panel=root.document.querySelector('.score-suite-active');if(!panel)return;const set=(key,value)=>{const input=panel.querySelector(`[data-cfg="${key}"]`);if(!input)return;if(input.type==='checkbox')input.checked=!!value;else input.value=String(value)};set('scoreA',cfg.startA);set('scoreB',cfg.startB);set('target',cfg.target);set('winBy2',cfg.winBy2)},80);
  }
  function settleAfterStart(){if(!active())return;root.setTimeout(()=>{closeActiveSheet();ensureHome();updateHome()},90)}
  function onClick(e){const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-begin')&&b.closest('.score-suite-active')&&active()){settleAfterStart();return}if(b.hasAttribute('data-pressure-settings')){e.preventDefault();e.stopPropagation();openSettings();return}}
  function observe(){if(state.observer||!root?.document)return;const teams=root.document.getElementById('teams');if(!teams)return;state.observer=new root.MutationObserver(()=>{if(active())updateHome()});state.observer.observe(teams,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value']})}
  function pulse(){const s=session();if(s?.mode==='pressure-game'){observe();if(root.document.querySelector('.score-suite-active-game'))closeActiveSheet();if(!root.document.querySelector('.score-suite-active'))ensureHome();updateHome();state.lastSessionId=s.id}else if(root?.document?.querySelector('[data-pressure-home]'))removeHome()}
  function init(){if(!root?.document)return;root.document.addEventListener('click',onClick,true);state.timer=root.setInterval(pulse,250);pulse()}
  return{deriveStatus,rulesLine,init,updateHome,ensureHome,removeHome,openSettings};
});
