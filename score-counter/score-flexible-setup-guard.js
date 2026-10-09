(function(){
'use strict';
const MODES=new Set(['custom-game','player-tracking','multi-team','individual-challenge']);
function session(){const a=window.TeamScoreGameSuite;return a&&a.getSession?a.getSession():null}
function n(p,sel,f){return Number(p.querySelector(sel)?.value||f)}
function capture(p,s){
  if(s.mode==='custom-game')Object.assign(s.config,{target:n(p,'[data-flex-target]',10),duration:n(p,'[data-flex-minutes]',0)*60000,rounds:n(p,'[data-flex-rounds]',1),winBy2:!!p.querySelector('[data-flex-win2]')?.checked,bonus:n(p,'[data-flex-bonus]',2),penalty:n(p,'[data-flex-penalty]',-1),streakTarget:n(p,'[data-flex-streak]',0),tie:p.querySelector('[data-flex-tie]')?.value||'golden'});
  else if(s.mode==='player-tracking')s.config.playerLists=[0,1].map(i=>(p.querySelector(`[data-flex-players="${i}"]`)?.value||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean));
  else if(s.mode==='multi-team')s.config.target=n(p,'[data-flex-multi-target]',10);
  else if(s.mode==='individual-challenge'){s.config.players=(p.querySelector('[data-flex-individual]')?.value||'').split(/\n|,/).map(x=>x.trim()).filter(Boolean);s.config.target=n(p,'[data-flex-individual-target]',10)}
  try{localStorage.setItem('teamScoreSuite.session',JSON.stringify(s))}catch(_){ }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-begin]'),p=b&&b.closest('.score-suite-active'),s=session();if(!b||!p||!s||!MODES.has(s.mode))return;capture(p,s)},true);
window.TeamScoreFlexibleSetupGuard={capture};
})();