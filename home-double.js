(() => {
  'use strict';

  const MODES = [
    {id:'classic',label:'⚡ קלאסי',sub:'צבירת נקודות',left:7,right:9},
    {id:'levels',label:'🗺️ עולם השלבים',sub:'השלב הבא נפתח',left:4,right:5},
    {id:'knockout',label:'🎯 נוקאאוט',sub:'פגיעה מהירה',left:2,right:3},
    {id:'survival',label:'🛡️ הישרדות',sub:'כל הצלחה מוסיפה זמן',left:12,right:14},
    {id:'sprint',label:'⏱️ מרוץ זמן',sub:'לנצח את השעון',left:8,right:10},
    {id:'versus',label:'👥 שני שחקנים',sub:'ראש בראש',left:10,right:10},
    {id:'gold',label:'⭐ קלף זהב',sub:'הסיבוב שווה יותר',left:13,right:15}
  ];

  const SYMBOLS = ['🐶','🦁','🍕','⚽','🏐','🚀','🌈','🔥','⭐','💎','🍓','🎸','👑','🐉','🤖','🎯','🍩','🦄'];
  const POSITIONS = [
    [50,15,8],[24,29,-14],[74,30,15],[48,43,-5],[18,56,12],[80,57,-18],[34,75,5],[66,78,-8]
  ];

  const makeCard = (side, symbols) => {
    const card = document.createElement('div');
    card.className = 'double-demo-card ' + side;
    symbols.forEach((symbol, i) => {
      const span = document.createElement('span');
      span.className = 'double-demo-symbol' + (i === 3 ? ' match' : '');
      span.textContent = symbol;
      span.style.setProperty('--x', POSITIONS[i][0] + '%');
      span.style.setProperty('--y', POSITIONS[i][1] + '%');
      span.style.setProperty('--r', POSITIONS[i][2] + 'deg');
      span.dataset.index = String(i);
      card.appendChild(span);
    });
    return card;
  };

  function buildBackground() {
    const bg = document.createElement('div');
    bg.className = 'home-double-bg';
    bg.setAttribute('aria-hidden','true');

    const stage = document.createElement('div');
    stage.className = 'double-demo-stage';
    stage.innerHTML = [
      '<div class="double-demo-mode" id="homeDoubleMode">⚡ קלאסי</div>',
      '<div class="double-demo-score p2">שחקן 2<strong id="homeDoubleScore2">7</strong></div>',
      '<div class="double-demo-score p1">שחקן 1<strong id="homeDoubleScore1">9</strong></div>',
      '<div class="double-demo-board" id="homeDoubleBoard"></div>',
      '<div class="double-demo-center"><b>DOUBLE</b><small id="homeDoubleSub">צבירת נקודות</small></div>'
    ].join('');

    bg.appendChild(stage);
    document.body.prepend(bg);

    const board = stage.querySelector('#homeDoubleBoard');
    const common = '🏐';
    const leftSymbols = ['🐶','🍕','⚽',common,'🔥','🎸','👑','🌈'];
    const rightSymbols = ['🦁','🚀','💎',common,'🍓','🤖','🎯','⭐'];
    board.appendChild(makeCard('left',leftSymbols));
    board.appendChild(makeCard('right',rightSymbols));

    const p1 = document.createElement('span');
    p1.className='double-demo-cursor p1';
    const p2 = document.createElement('span');
    p2.className='double-demo-cursor p2';
    board.append(p1,p2);

    positionCursors(board);
    return {bg,stage,board,p1,p2};
  }

  function positionCursors(board) {
    const cards = board.querySelectorAll('.double-demo-card');
    const p1 = board.querySelector('.double-demo-cursor.p1');
    const p2 = board.querySelector('.double-demo-cursor.p2');
    if(cards.length < 2 || !p1 || !p2) return;

    const boardRect = board.getBoundingClientRect();
    const leftMatch = cards[0].querySelector('.match')?.getBoundingClientRect();
    const rightMatch = cards[1].querySelector('.match')?.getBoundingClientRect();

    if(leftMatch){
      p2.style.left=(leftMatch.left-boardRect.left+leftMatch.width/2-22)+'px';
      p2.style.top=(leftMatch.top-boardRect.top+leftMatch.height/2-22)+'px';
    }
    if(rightMatch){
      p1.style.left=(rightMatch.left-boardRect.left+rightMatch.width/2-22)+'px';
      p1.style.top=(rightMatch.top-boardRect.top+rightMatch.height/2-22)+'px';
    }
  }

  function reshuffleCards(board, mode) {
    const cards=[...board.querySelectorAll('.double-demo-card')];
    if(cards.length<2) return;

    const common = SYMBOLS[(Math.floor(Math.random()*SYMBOLS.length))];
    const used = new Set([common]);
    const draw = () => {
      let s;
      do{s=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]}while(used.has(s));
      used.add(s);return s;
    };

    cards.forEach((card, cardIndex) => {
      [...card.querySelectorAll('.double-demo-symbol')].forEach((span,i)=>{
        span.classList.remove('match');
        span.textContent=i===3?common:draw();
        if(i===3) span.classList.add('match');
      });
      card.classList.remove('double-demo-card-hit','double-demo-card-gold');
      void card.offsetWidth;
      card.classList.add('double-demo-card-hit');
      if(mode.id==='gold' || (mode.id==='versus' && cardIndex===1)) card.classList.add('double-demo-card-gold');
    });

    positionCursors(board);
  }

  function spark(board) {
    const symbols=['✦','✧','★','🪙'];
    for(let i=0;i<8;i++){
      const s=document.createElement('span');
      s.className='double-demo-spark';
      s.textContent=symbols[i%symbols.length];
      s.style.left=(44+Math.random()*12)+'%';
      s.style.top=(42+Math.random()*16)+'%';
      s.style.setProperty('--dx',((Math.random()-.5)*180)+'px');
      s.style.setProperty('--dy',(-40-Math.random()*130)+'px');
      board.appendChild(s);
      setTimeout(()=>s.remove(),900);
    }
  }

  function buildDrawer() {
    const overlay=document.createElement('div');
    overlay.className='home-side-overlay';
    overlay.id='homeSideOverlay';

    const aside=document.createElement('aside');
    aside.className='home-side-menu';
    aside.id='homeSideMenu';
    aside.setAttribute('aria-hidden','true');
    aside.innerHTML=`
      <div class="home-side-head">
        <h2>העולמות שלי</h2>
        <button class="home-side-close" type="button" aria-label="סגור תפריט">✕</button>
      </div>
      <div class="home-side-section-title">משחקים</div>
      <nav class="home-side-nav">
        <a class="double-link" href="double.html"><span>🎴</span>DOUBLE</a>
        <a href="crazy-family.html"><span>🏠</span>המשפחה המשגעת</a>
      </nav>
      <div class="home-side-section-title">המרכז שלי</div>
      <nav class="home-side-nav">
        <a href="raika.html"><span>⚡</span>ראיקה</a>
        <a href="coach.html"><span>🧠</span>מאמן</a>
        <a href="volleyball.html"><span>🏐</span>כדורעף</a>
        <a href="languages.html"><span>🌍</span>שפות</a>
        <a href="music.html"><span>🎵</span>מוזיקה</a>
        <a href="library.html"><span>📚</span>ספרייה</a>
        <a href="personality.html"><span>🧩</span>אישיות</a>
        <a href="couple.html"><span>❤️</span>הבן זוג המושלם</a>
        <a href="content-hub.html"><span>🏦</span>הבנק שלי</a>
      </nav>
    `;

    document.body.append(overlay,aside);

    const open=()=>{
      overlay.classList.add('open');
      aside.classList.add('open');
      aside.setAttribute('aria-hidden','false');
      document.body.classList.add('home-drawer-open');
    };
    const close=()=>{
      overlay.classList.remove('open');
      aside.classList.remove('open');
      aside.setAttribute('aria-hidden','true');
      document.body.classList.remove('home-drawer-open');
    };

    overlay.addEventListener('click',close);
    aside.querySelector('.home-side-close').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape') close()});

    return {open,close};
  }

  function rebuildHeader(drawer) {
    const header=document.querySelector('.home-feed-app > header');
    if(!header) return;

    const oldActions=header.querySelector('.top-actions');
    if(oldActions) oldActions.remove();

    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='home-menu-trigger';
    trigger.setAttribute('aria-label','פתח תפריט');
    trigger.setAttribute('aria-controls','homeSideMenu');
    trigger.textContent='☰';
    trigger.addEventListener('click',drawer.open);

    const box=document.createElement('div');
    box.className='home-top-right';
    box.appendChild(trigger);
    header.prepend(box);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.body.classList.add('home-double-ready');
    const drawer=buildDrawer();
    rebuildHeader(drawer);
    const demo=buildBackground();

    let index=0;
    const modeLabel=document.getElementById('homeDoubleMode');
    const sub=document.getElementById('homeDoubleSub');
    const score1=document.getElementById('homeDoubleScore1');
    const score2=document.getElementById('homeDoubleScore2');

    const applyMode=()=>{
      const mode=MODES[index];
      modeLabel.classList.add('is-changing');
      setTimeout(()=>{
        modeLabel.textContent=mode.label;
        sub.textContent=mode.sub;
        score1.textContent=mode.right;
        score2.textContent=mode.left;
        demo.stage.dataset.mode=mode.id;
        reshuffleCards(demo.board,mode);
        spark(demo.board);
        modeLabel.classList.remove('is-changing');
      },220);
      index=(index+1)%MODES.length;
    };

    applyMode();
    setInterval(applyMode,3000);
    window.addEventListener('resize',()=>positionCursors(demo.board));
  });
})();
