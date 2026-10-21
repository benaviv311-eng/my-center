(()=>{
  'use strict';
  const D=window.DoubleDailyChallenge;if(!D)return;
  const STYLE_ID='double-daily-ui-style';
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`.daily-mode-card{position:relative;overflow:hidden;border-color:rgba(255,216,77,.52)!important;background:linear-gradient(135deg,rgba(255,216,77,.16),rgba(255,126,73,.08))!important;box-shadow:inset 0 0 26px rgba(255,216,77,.07)}.daily-mode-card:before{content:"";position:absolute;inset:-60% auto -60% -30%;width:22%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transform:rotate(18deg);animation:dailyShine 4.2s ease-in-out infinite}.daily-mode-card .mode-icon{background:rgba(255,216,77,.16)!important;box-shadow:0 0 20px rgba(255,216,77,.13)}.daily-mode-card .daily-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:4px}.daily-mode-card .daily-meta em{font-style:normal;font-size:9px;padding:3px 6px;border-radius:999px;background:rgba(255,255,255,.08);opacity:.8}@keyframes dailyShine{0%,60%{left:-35%}100%{left:135%}}@media(prefers-reduced-motion:reduce){.daily-mode-card:before{animation:none}}`;
    document.head.appendChild(s);
  }
  function formatBest(ms){return ms?(Number(ms)/1000).toFixed(2)+' שנ׳':'עוד לא שוחק'}
  function launch(){
    try{window.DoubleMusic?.stop?.()}catch(_){ }
    document.getElementById('closeBtn')?.click();
    const shell=document.getElementById('gameShell'),frame=document.getElementById('gameFrame');if(!shell||!frame)return;
    shell.classList.add('open');shell.setAttribute('aria-hidden','false');frame.src='double-daily.html?v=34';
  }
  function inject(){
    ensureStyle();
    document.querySelectorAll('.lobby-mode-list').forEach(list=>{
      const page=list.closest('.lobby-page');const title=page?.querySelector('.lobby-page-header h3')?.textContent||'';
      if(!title.includes('בחר משחק'))return;
      const day=D.dateKey(new Date(),'Asia/Jerusalem'),sum=D.summary(D.load(),day);
      let btn=list.querySelector('[data-daily-challenge]');
      if(!btn){btn=document.createElement('button');btn.type='button';btn.className='lobby-mode daily-mode-card';btn.dataset.dailyChallenge='1';btn.addEventListener('click',launch);list.prepend(btn)}
      btn.innerHTML=`<span class="mode-icon">🏆</span><span><b>האתגר של היום</b><small>15 התאמות · אותו רצף לכולם · טעות +2 שניות</small><span class="daily-meta"><em>👑 ${formatBest(sum.bestMs)}</em><em>🔥 ${sum.streak} ימים</em><em>📅 ${sum.totalDays} הושלמו</em></span></span><span class="go">←</span>`;
    });
  }
  let queued=false;const root=document.querySelector('.landing')||document.body;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject()})}).observe(root,{subtree:true,childList:true});
  window.addEventListener('storage',inject);document.addEventListener('visibilitychange',()=>{if(!document.hidden)inject()});inject();
})();
