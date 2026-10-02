(() => {
  'use strict';

  const landing = document.getElementById('doubleLanding');
  if (!landing) return;

  const modes = [
    {id:'classic',label:'⚡ קלאסי',sub:'מצא מהר. צבור נקודות.',score1:9,score2:7},
    {id:'levels',label:'🗺️ עולם השלבים',sub:'כל שלב מהיר וקשה יותר.',score1:5,score2:4},
    {id:'knockout',label:'🎯 נוקאאוט',sub:'טעות עולה ביוקר.',score1:3,score2:2},
    {id:'survival',label:'🛡️ הישרדות',sub:'כל הצלחה קונה עוד זמן.',score1:14,score2:12},
    {id:'sprint',label:'⏱️ מרוץ זמן',sub:'כמה מהר תגיע ליעד?',score1:10,score2:8},
    {id:'versus',label:'👥 שני שחקנים',sub:'ראש בראש על אותו מסך.',score1:10,score2:10},
    {id:'gold',label:'⭐ קלף זהב',sub:'סיבוב בונוס. יותר נקודות.',score1:15,score2:13}
  ];

  const symbols = ['🐶','🦁','🍕','⚽','🏐','🚀','🌈','🔥','⭐','💎','🍓','🎸','👑','🐉','🤖','🎯','🍩','🦄'];
  const spots = [[50,15,8],[24,29,-14],[74,30,15],[48,43,-5],[18,56,12],[80,57,-18],[34,75,5],[66,78,-8]];

  const board = landing.querySelector('[data-demo-board]');
  const modeLabel = landing.querySelector('[data-demo-mode]');
  const modeSub = landing.querySelector('[data-demo-sub]');
  const score1 = landing.querySelector('[data-demo-score1]');
  const score2 = landing.querySelector('[data-demo-score2]');
  const lives = landing.querySelector('[data-demo-lives]');
  const drawer = landing.querySelector('.double-landing-drawer');
  const overlay = landing.querySelector('.double-landing-overlay');

  function pickUnique(used){
    let s;
    do{s=symbols[Math.floor(Math.random()*symbols.length)]}while(used.has(s));
    used.add(s);
    return s;
  }

  function makeCard(side, common){
    const card = document.createElement('div');
    card.className = 'double-landing-card ' + side;
    const used = new Set([common]);
    for(let i=0;i<8;i++){
      const span = document.createElement('span');
      span.className = 'double-landing-symbol' + (i===3?' match':'');
      span.textContent = i===3 ? common : pickUnique(used);
      span.style.setProperty('--x',spots[i][0]+'%');
      span.style.setProperty('--y',spots[i][1]+'%');
      span.style.setProperty('--r',spots[i][2]+'deg');
      card.appendChild(span);
    }
    return card;
  }

  function buildRound(mode){
    if(!board) return;
    board.innerHTML='';
    const common = symbols[Math.floor(Math.random()*symbols.length)];
    const left = makeCard('left',common);
    const right = makeCard('right',common);
    if(mode.id==='gold') {
      left.classList.add('gold');
      right.classList.add('gold');
    }
    board.append(left,right);

    if(mode.id==='versus'){
      const c1=document.createElement('span');
      const c2=document.createElement('span');
      c1.className='double-landing-cursor p1';
      c2.className='double-landing-cursor p2';
      board.append(c1,c2);
      requestAnimationFrame(()=>placeCursors());
    }

    burst();
  }

  function placeCursors(){
    const cards=[...board.querySelectorAll('.double-landing-card')];
    const cursors=[board.querySelector('.double-landing-cursor.p2'),board.querySelector('.double-landing-cursor.p1')];
    const br=board.getBoundingClientRect();
    cards.forEach((card,i)=>{
      const m=card.querySelector('.match');
      if(!m||!cursors[i]) return;
      const r=m.getBoundingClientRect();
      cursors[i].style.left=(r.left-br.left+r.width/2-22)+'px';
      cursors[i].style.top=(r.top-br.top+r.height/2-22)+'px';
    });
  }

  function burst(){
    for(let i=0;i<9;i++){
      const s=document.createElement('span');
      s.className='double-landing-spark';
      s.textContent=i%3===0?'🪙':i%2?'✦':'★';
      s.style.left=(45+Math.random()*10)+'%';
      s.style.top=(42+Math.random()*14)+'%';
      s.style.setProperty('--dx',((Math.random()-.5)*190)+'px');
      s.style.setProperty('--dy',(-45-Math.random()*135)+'px');
      board.appendChild(s);
      setTimeout(()=>s.remove(),950);
    }
  }

  let modeIndex=0;
  function applyMode(){
    const mode=modes[modeIndex];
    landing.dataset.demoMode=mode.id;
    modeLabel?.classList.add('changing');
    setTimeout(()=>{
      if(modeLabel) modeLabel.textContent=mode.label;
      if(modeSub) modeSub.textContent=mode.sub;
      if(score1) score1.textContent=mode.score1;
      if(score2) score2.textContent=mode.score2;
      if(lives) lives.textContent=mode.id==='knockout'?'❤️❤️❤️  ·  ❤️❤️':'';
      buildRound(mode);
      modeLabel?.classList.remove('changing');
    },180);
    modeIndex=(modeIndex+1)%modes.length;
  }

  function openDrawer(){
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    drawer?.setAttribute('aria-hidden','false');
  }
  function closeDrawer(){
    drawer?.classList.remove('open');
    overlay?.classList.remove('open');
    drawer?.setAttribute('aria-hidden','true');
  }
  function enterGame(){
    closeDrawer();
    landing.classList.add('hidden');
    setTimeout(()=>{landing.style.display='none'},420);
  }

  landing.querySelectorAll('[data-enter-game]').forEach(el=>el.addEventListener('click',enterGame));
  landing.querySelector('[data-open-drawer]')?.addEventListener('click',openDrawer);
  landing.querySelector('[data-close-drawer]')?.addEventListener('click',closeDrawer);
  overlay?.addEventListener('click',closeDrawer);
  landing.querySelector('[data-how]')?.addEventListener('click',()=>{
    closeDrawer();
    landing.querySelector('.double-landing-how')?.classList.add('show');
    setTimeout(()=>landing.querySelector('.double-landing-how')?.classList.remove('show'),3600);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeDrawer()});
  window.addEventListener('resize',placeCursors);

  applyMode();
  setInterval(applyMode,2900);
})();