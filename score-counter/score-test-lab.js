(function(){
  'use strict';

  const STATUS_LABELS={
    working:{icon:'✅',label:'עובד'},
    partial:{icon:'🟡',label:'חלקי'},
    missing:{icon:'🔴',label:'לא מיושם'}
  };

  const CORE_ITEMS=[
    {id:'time-stopwatch',name:'Stopwatch',status:'working',detail:'Start / Pause / Reset / Lap ושמירת מצב.',kind:'time'},
    {id:'time-timer',name:'Timer',status:'working',detail:'ספירה לאחור, שינוי זמן, Overtime והתרעת סיום.',kind:'time'},
    {id:'time-intervals',name:'Intervals',status:'working',detail:'WORK / REST / ROUNDS / SETS עם מעבר אוטומטי.',kind:'time'},
    {id:'voice-preview',name:'Human Voice Pack',status:'working',detail:'Coach + Arena: קריאות קבועות מוקלטות וספירות רציפות; הכרזות דינמיות משתמשות בקול טבעי.',kind:'voice'},
    {id:'remote-display',name:'Remote Display',status:'working',detail:'חדר מאובטח, קוד/QR, Controller מול Display, מספר מסכים ו-Reconnect.',kind:'remote'},
    {id:'cloud-sync',name:'Cloud Sync',status:'working',detail:'קוד צימוד, Pull/Push/Auto Sync, בחירת קטגוריות ושמירת קונפליקטים.',kind:'sync'},
    {id:'history',name:'History / Export',status:'working',detail:'Data Hub מאחד היסטוריית משחקים/טיימר/שפיגל, Copy/Replay וייצוא JSON/CSV.',kind:'history'},
    {id:'rosters',name:'Rosters',status:'working',detail:'קבוצות קבועות, מספר שחקן, נוכחות, הגייה קולית והוספה/הסרה.',kind:'roster'},
    {id:'player-profiles',name:'Player Profiles',status:'working',detail:'פרופיל שחקן עם סטטיסטיקה מצטברת, יעד אישי והערת מאמן.',kind:'player'}
  ];

  const GAME_STATUS={
    'free-score':{name:'Free Score',status:'working',detail:'ניקוד חופשי דרך מסך המשחק.'},
    'first-to-x':{name:'First to X',status:'partial',detail:'יעד והכרזת ניצחון קיימים; סטים ותצוגת סיום מלאה עדיין חסרים.'},
    'win-by-2':{name:'Win by 2',status:'partial',detail:'חוק הפרש 2 קיים; תקרת ניקוד וסטים עדיין חסרים.'},
    'timed-game':{name:'Timed Game',status:'missing',detail:'מסך הגדרה קיים, אך הטיימר עדיין לא מחובר אוטומטית למשחק.'},
    'timed-overtime':{name:'Timed + Overtime',status:'missing',detail:'המצב מופיע בתפריט אך Overtime משחקי עדיין לא מחובר.'},
    'best-of-sets':{name:'Best of Sets',status:'missing',detail:'עדיין אין מנוע סטים עצמאי.'},
    'timed-rounds':{name:'Timed Rounds',status:'missing',detail:'הגדרות זמן וסבבים קיימות, אך עדיין אין תור A→B, מעבר וסיכום סבבים.'},
    'pressure-game':{name:'Pressure Game',status:'partial',detail:'פתיחה מ-22:22, יעד ו-Win by 2 עובדים; הקראת כל נקודה ו-Replay מלא עדיין חסרים.'},
    'target-chase':{name:'Target Chase',status:'missing',detail:'עדיין אין שלב קובע יעד ואז שלב רדיפה.'},
    'streak-challenge':{name:'Streak Challenge',status:'missing',detail:'יעד רצף מוצג אך רצפים עדיין לא נספרים בפועל.'},
    'comeback-challenge':{name:'Comeback Challenge',status:'partial',detail:'אפשר לפתוח מפיגור ולשחק ליעד; לוגיקת קאמבק וסטטיסטיקות עדיין חסרות.'},
    'sideout-challenge':{name:'Sideout Challenge',status:'missing',detail:'עדיין אין ספירת Sideout / אחוז הצלחה / החלפת תפקידים.'},
    'serve-pressure':{name:'Serve Pressure',status:'missing',detail:'מספר ניסיונות מוגדר, אך הצלחה/טעות/אזורי מטרה עדיין לא מחוברים.'},
    'training-mode':{name:'Training Mode',status:'missing',detail:'כרגע נפתח מסך ניקוד כללי בלבד.'},
    'race-challenge':{name:'Race / Challenge',status:'partial',detail:'מרוץ ליעד בסיסי אפשרי; זמן ושיא אישי עדיין חסרים.'},
    'random-challenge':{name:'Surprise Me',status:'partial',detail:'נבחר משחק אקראי, אך עדיין לא נוצר תרחיש קושי אקראי אמיתי.'},
    'team-battle':{name:'Team Battle',status:'missing',detail:'עדיין אין מעטפת Round / VS / Winner ייעודית.'},
    'king-rotation':{name:'King Rotation',status:'missing',detail:'עדיין אין מנוע מנצחת נשארת / קבוצה הבאה.'},
    'elimination':{name:'Elimination / Survival',status:'missing',detail:'Lives מוגדרים אך הפסדים והדחות קבוצתיות עדיין לא מחוברים.'},
    'countdown-target':{name:'Countdown Target',status:'missing',detail:'יעד וזמן מוגדרים אך אין חיבור בין הטיימר ליעד.'},
    'tournament':{name:'Tournament',status:'missing',detail:'עדיין אין טבלה, לוח משחקים או Next Match.'},
    'custom-game':{name:'Custom Game Builder',status:'missing',detail:'שדות בסיסיים קיימים, אך המשחק שנוצר עדיין לא נשמר כמנוע עצמאי.'},
    'four-team-rotation':{name:'4 Teams Rotation',status:'partial',detail:'זיהוי הקבוצה הראשונה שמגיעה ל-10 ודירוג קיימים; סידור 1+4 מול 2+3 עדיין לא משתנה בפועל.'},
    'spiegel':{name:'שפיגל / מלך התחתיות',status:'partial',detail:'שמות, נקודות רעות, הדחה ו-Next קיימים; סוגי טעויות, Final Duel מלא וסטטיסטיקה עדיין חסרים.'},
    'weighted-drill':{name:'Weighted Drill',status:'missing',detail:'ערכי הניקוד נשמרים בהגדרה אך אין כפתורי Perfect / Good / Playable / Error במשחק.'},
    'player-tracking':{name:'Player Tracking',status:'missing',detail:'עדיין אין שיוך פעולות לשחקן בתוך משחק קבוצתי.'},
    'multi-team':{name:'Multi-Team',status:'missing',detail:'כרגע אין מנוע כללי למשחק עם יותר משתי קבוצות.'},
    'individual-challenge':{name:'Individual Challenge',status:'missing',detail:'עדיין אין מסך אתגר אישי עצמאי.'}
  };

  let panel=null;
  let filter='all';

  function suite(){return window.TeamScoreGameSuite||null}
  function coreItems(){
    return CORE_ITEMS.map(item=>{
      if(item.id==='voice-preview'&&!window.TeamScoreHumanVoicePack)return Object.assign({},item,{status:'partial',detail:'חבילת הקול עדיין לא נטענה בדפדפן.'});
      if(item.id==='remote-display'&&!window.TeamScoreRemoteDisplay)return Object.assign({},item,{status:'missing'});
      if(item.id==='cloud-sync'&&!window.TeamScoreCloudSync)return Object.assign({},item,{status:'missing'});
      if((item.id==='history'||item.id==='rosters'||item.id==='player-profiles')&&!window.TeamScoreDataHub)return Object.assign({},item,{status:'missing'});
      return item;
    });
  }
  function allItems(){
    const games=(window.TEAM_SCORE_SUITE_MODES||[]).map(mode=>Object.assign({id:mode.id,kind:'game'},GAME_STATUS[mode.id]||{name:mode.name,status:'missing',detail:'אין עדיין בדיקת מצב עבור המשחק.'}));
    return coreItems().concat(games);
  }

  function close(){if(panel&&panel.isConnected)panel.remove();panel=null}
  function statusBadge(status){const meta=STATUS_LABELS[status]||STATUS_LABELS.missing;return `<span class="score-test-lab-status ${status}">${meta.icon} ${meta.label}</span>`}
  function renderRows(){
    if(!panel)return;const host=panel.querySelector('[data-lab-list]');if(!host)return;
    const items=allItems().filter(item=>filter==='all'||item.status===filter);
    host.innerHTML=items.map(item=>`<article class="score-test-lab-row ${item.status}"><div class="score-test-lab-copy"><div><strong>${item.name}</strong>${statusBadge(item.status)}</div><p>${item.detail}</p></div><button type="button" data-lab-test="${item.id}">TEST</button></article>`).join('');
    panel.querySelectorAll('[data-lab-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.labFilter===filter));
  }
  function counts(){const items=allItems();return ['working','partial','missing'].map(status=>({status,count:items.filter(x=>x.status===status).length}))}
  function open(){
    close();panel=document.createElement('section');panel.className='score-test-lab-panel';panel.setAttribute('dir','rtl');
    panel.innerHTML=`<div class="score-test-lab-head"><div><strong>🧪 מעבדת בדיקות</strong><small>פותחים כל פיצ׳ר ישירות ובודקים מה באמת קיים.</small></div><button type="button" data-lab-close>✕</button></div><div class="score-test-lab-summary">${counts().map(x=>`${statusBadge(x.status)} <b>${x.count}</b>`).join('')}</div><div class="score-test-lab-filters"><button data-lab-filter="all" class="active">הכול</button><button data-lab-filter="working">✅ עובד</button><button data-lab-filter="partial">🟡 חלקי</button><button data-lab-filter="missing">🔴 לא מיושם</button></div><div class="score-test-lab-note">TEST פותח תרחיש קצר ככל האפשר. סטטוס ירוק יינתן רק לפיצ׳ר שיש לו לוגיקה אמיתית ולא רק כרטיס בתפריט.</div><div class="score-test-lab-list" data-lab-list></div>`;
    document.body.appendChild(panel);
    panel.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.hasAttribute('data-lab-close'))return close();if(button.dataset.labFilter){filter=button.dataset.labFilter;renderRows();return}if(button.dataset.labTest)testItem(button.dataset.labTest)});renderRows();
  }
  function openSuiteAction(selector){const api=suite();if(!api)return false;api.open();setTimeout(()=>{const btn=document.querySelector(selector);if(btn)btn.click()},30);return true}
  function applyDemo(id){
    const setup=document.querySelector('.score-suite-active');if(!setup)return false;
    const set=(key,value)=>{const el=setup.querySelector(`[data-cfg="${key}"]`);if(el){if(el.type==='checkbox')el.checked=!!value;else el.value=String(value)}};
    if(id==='timed-rounds'){set('durationMinutes',0.33);set('rounds',2);set('breakSeconds',3)}
    if(id==='pressure-game'){set('scoreA',22);set('scoreB',22);set('target',25);set('winBy2',true)}
    if(id==='comeback-challenge'){set('scoreA',18);set('scoreB',22);set('target',25);set('winBy2',true)}
    if(id==='first-to-x'||id==='win-by-2'||id==='race-challenge')set('target',5);
    if(id==='timed-game'||id==='timed-overtime'||id==='countdown-target'){set('durationMinutes',0.5);set('target',5)}
    if(id==='streak-challenge')set('streakTarget',3);if(id==='elimination')set('lives',3);if(id==='serve-pressure')set('attempts',5);
    if(id==='four-team-rotation'){set('midpoint',3);set('target',6)}
    if(id==='weighted-drill'){set('perfect',3);set('good',2);set('playable',1);set('error',-1)}
    if(id==='spiegel'){const players=setup.querySelector('[data-players]');if(players)players.value='ליבי\nדוד\nאברי\nנועה\nרון';set('eliminationThreshold',3)}
    return true;
  }
  function testItem(id){
    const api=suite();
    if(id==='time-stopwatch'||id==='time-timer'||id==='time-intervals'){
      close();if(window.TeamScoreTimeCenter?.open){window.TeamScoreTimeCenter.open();setTimeout(()=>{const btn=document.querySelector(`[data-tc-mode="${id.replace('time-','')}"]`);if(btn)btn.click()},60)}else if(api)openSuiteAction('[data-timer]');return;
    }
    if(id==='voice-preview'){window.TeamScoreHumanVoicePack?.play('arena','countdown3',{targetDuration:3});return}
    if(id==='remote-display'){close();window.TeamScoreRemoteDisplay?.open();return}
    if(id==='cloud-sync'){close();window.TeamScoreCloudSync?.open();return}
    if(id==='history'){close();window.TeamScoreDataHub?.open('history');return}
    if(id==='rosters'){close();window.TeamScoreDataHub?.open('rosters');return}
    if(id==='player-profiles'){close();window.TeamScoreDataHub?.open('profiles');return}
    if(!api){alert('Game Suite עדיין לא נטען. רענן את הדף ונסה שוב.');return}
    if(GAME_STATUS[id]){close();api.startMode(id);setTimeout(()=>applyDemo(id),80)}
  }
  function installLauncher(){if(document.querySelector('.score-test-lab-launcher'))return;const button=document.createElement('button');button.type='button';button.className='score-test-lab-launcher';button.innerHTML='🧪 <span>בדיקות</span>';button.addEventListener('click',open);document.body.appendChild(button)}
  function init(){installLauncher()}
  window.TeamScoreTestLab={open,close,items:allItems,testItem,applyDemo,statuses:GAME_STATUS};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
