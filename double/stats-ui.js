(()=>{
  'use strict';
  const S=window.DoubleStatsStore;
  if(!S)return;
  const STYLE_ID='double-stats-ui-style';
  const MODAL_ID='doubleStatsModal';
  const labels={
    classic:'⚡ קלאסי',levels:'🗺️ שלבים',knockout:'🎯 נוקאאוט',survival:'🛡️ הישרדות',
    'sprint:5':'⏱️ מרוץ 5','sprint:10':'⏱️ מרוץ 10','sprint:15':'⏱️ מרוץ 15',
    'versus:duel':'⚔️ דו־קרב','versus:deck':'🃏 חפיסה מלאה','versus:knockout':'❤️ נוקאאוט לשניים',
    'versus:race':'🏁 מרוץ ל־15','versus:combo':'🔥 קומבו','versus:sudden':'💥 מוות פתאומי','versus:gold':'⭐ קלף זהב'
  };
  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return {}}}
  function fmtMs(ms){return Number.isFinite(Number(ms))&&Number(ms)>0?(Number(ms)/1000).toFixed(2)+' שנ׳':'—'}
  function fmtPct(v){return Number.isFinite(Number(v))?Math.round(Number(v))+'%':'—'}
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`.stats-setting{background:rgba(99,230,190,.08)!important;border-color:rgba(99,230,190,.2)!important}.double-stats-modal{position:fixed;inset:0;z-index:180;background:rgba(3,8,20,.82);backdrop-filter:blur(14px);display:none;place-items:center;padding:18px}.double-stats-modal.open{display:grid}.double-stats-card{width:min(880px,96vw);max-height:92vh;overflow:auto;border-radius:28px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(180deg,#101b39f8,#091126f8);box-shadow:0 30px 90px #000b;color:#fff;padding:20px}.stats-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.stats-head h2{margin:0;font-size:30px}.stats-head p{margin:4px 0 0;opacity:.68;font-size:12px}.stats-close{width:42px;height:42px;border-radius:14px;border:1px solid #ffffff25;background:#ffffff10;color:#fff;font-size:20px;cursor:pointer}.stats-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:16px 0}.stat-card{padding:13px 10px;border-radius:18px;background:#ffffff0c;border:1px solid #ffffff13;text-align:center}.stat-card span{font-size:22px}.stat-card b{display:block;font-size:22px;margin-top:4px}.stat-card small{opacity:.62;font-weight:800}.stats-section{margin-top:16px;padding-top:14px;border-top:1px solid #ffffff12}.stats-section h3{margin:0 0 10px}.stats-bars{height:150px;display:flex;align-items:flex-end;gap:5px;padding:10px;border-radius:18px;background:#ffffff08;overflow:hidden}.stats-bar{flex:1;min-width:5px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#63e6be,#55c8ff);box-shadow:0 0 14px #55c8ff33;position:relative}.stats-bar:hover:after{content:attr(data-value);position:absolute;bottom:100%;left:50%;transform:translate(-50%,-5px);font-size:10px;background:#07101f;padding:4px 6px;border-radius:7px;white-space:nowrap}.stats-mode-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.stats-mode{padding:11px;border-radius:16px;background:#ffffff08;border:1px solid #ffffff12}.stats-mode b{display:block;margin-bottom:5px}.stats-mode small{display:block;opacity:.7;line-height:1.5}.stats-empty{padding:22px;text-align:center;opacity:.65;border:1px dashed #ffffff22;border-radius:18px}.stats-actions{display:flex;justify-content:flex-end;margin-top:16px}.stats-reset{border:1px solid #ff6b7f55;background:#ff6b7f13;color:#ff9cab;border-radius:13px;padding:9px 12px;font-weight:900;cursor:pointer}@media(max-width:720px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stats-mode-grid{grid-template-columns:1fr}.double-stats-card{padding:15px}}`;
    document.head.appendChild(s);
  }
  function ensureModal(){
    let modal=document.getElementById(MODAL_ID);if(modal)return modal;
    modal=document.createElement('section');modal.id=MODAL_ID;modal.className='double-stats-modal';modal.setAttribute('aria-hidden','true');document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)close()});
    return modal;
  }
  function profileSuccess(){return Math.max(0,Number(readJson('double-profile-v1').totalSuccess)||0)}
  function barsHtml(history){
    const items=history.slice(-20);if(!items.length)return '<div class="stats-empty">שחק כמה סיבובים כדי לראות גרף שיפור.</div>';
    const vals=items.map(x=>Number(x.ms)).filter(Number.isFinite),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    return `<div class="stats-bars">${items.map(x=>{const ms=Number(x.ms),score=1-((ms-min)/range),h=24+score*106;return `<i class="stats-bar" style="height:${h}px" data-value="${fmtMs(ms)}" title="${labels[x.mode]||x.mode} · ${fmtMs(ms)}"></i>`}).join('')}</div>`;
  }
  function modesHtml(stats){
    const entries=Object.entries(stats.byMode||{}).filter(([,m])=>(m.correct||m.wrong));
    if(!entries.length)return '<div class="stats-empty">עדיין אין נתונים לפי מצב.</div>';
    return `<div class="stats-mode-grid">${entries.sort((a,b)=>(b[1].correct||0)-(a[1].correct||0)).map(([key,m])=>{const total=(m.correct||0)+(m.wrong||0),acc=total?((m.correct||0)/total)*100:null;return `<article class="stats-mode"><b>${labels[key]||key}</b><small>✅ ${m.correct||0} הצלחות · ❌ ${m.wrong||0} טעויות</small><small>דיוק ${fmtPct(acc)} · הכי מהיר ${fmtMs(m.bestReactionMs)}</small><small>🔥 קומבו ${m.maxCombo||0}</small></article>`}).join('')}</div>`;
  }
  function render(){
    const modal=ensureModal(),stats=S.load(),avg=S.averageReactionMs(stats),acc=S.accuracy(stats),allSuccess=Math.max(profileSuccess(),stats.totalCorrect||0);
    modal.innerHTML=`<div class="double-stats-card"><div class="stats-head"><div><h2>📊 הסטטיסטיקות שלי</h2><p>הצלחות כלליות נשמרו גם לפני המסך הזה; דיוק וזמני תגובה נמדדים מעכשיו.</p></div><button type="button" class="stats-close" aria-label="סגור">✕</button></div><div class="stats-grid"><div class="stat-card"><span>🎯</span><b>${allSuccess}</b><small>סה״כ הצלחות</small></div><div class="stat-card"><span>✅</span><b>${fmtPct(acc)}</b><small>דיוק</small></div><div class="stat-card"><span>⚡</span><b>${fmtMs(stats.fastestMs)}</b><small>תגובה מהירה</small></div><div class="stat-card"><span>⏱️</span><b>${fmtMs(avg)}</b><small>ממוצע תגובה</small></div><div class="stat-card"><span>🔥</span><b>${stats.maxCombo||0}</b><small>קומבו מקסימלי</small></div></div><section class="stats-section"><h3>📈 20 התגובות האחרונות</h3>${barsHtml(stats.reactionHistory||[])}</section><section class="stats-section"><h3>🎮 לפי מצב משחק</h3>${modesHtml(stats)}</section><div class="stats-actions"><button type="button" class="stats-reset">אפס נתוני דיוק וזמנים</button></div></div>`;
    modal.querySelector('.stats-close')?.addEventListener('click',close);
    modal.querySelector('.stats-reset')?.addEventListener('click',()=>{if(confirm('לאפס את נתוני הדיוק, הקומבו וזמני התגובה? השיאים והמטבעות לא יימחקו.')){S.reset();render()}});
  }
  function open(){ensureStyle();render();const modal=ensureModal();modal.classList.add('open');modal.setAttribute('aria-hidden','false')}
  function close(){const modal=document.getElementById(MODAL_ID);if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
  function inject(){
    ensureStyle();ensureModal();
    document.querySelectorAll('.compact-settings-row').forEach(row=>{
      if(row.querySelector('[data-open-stats]'))return;
      const btn=document.createElement('button');btn.type='button';btn.className='compact-setting stats-setting';btn.setAttribute('data-open-stats','1');btn.innerHTML='<span>📊</span><b>סטטיסטיקות</b><i>›</i>';btn.addEventListener('click',open);row.appendChild(btn);
    });
  }
  let queued=false;const root=document.querySelector('.landing')||document.body;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject()})}).observe(root,{subtree:true,childList:true});
  window.addEventListener('double-stats-change',()=>{if(document.getElementById(MODAL_ID)?.classList.contains('open'))render()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById(MODAL_ID)?.classList.contains('open'))close()});
  inject();
})();
