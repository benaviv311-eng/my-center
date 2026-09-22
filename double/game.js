(() => {
  'use strict';

  const icons=['🐶','🐱','🦁','🐘','🐵','🐼','🐧','🐟','🍕','🍎','🍌','🍉','🍦','🍩','🍔','🍓','⚽','🏀','🏐','🎾','🏆','🎯','🛹','🚗','✈️','🚲','🚀','🚂','🚢','☀️','🌙','⭐','🌈','☁️','⚡','🔥','🌸','❤️','👑','💎','😊','👻','💩','🎸','🎁','🔑','⏰','💡','📷','🎈','🤖','🦄','👽','🐉','🧙','🏰','🏴‍☠️'];

  let deck=[], pair=[], mode=1, score=0, streak=0, scores=[0,0], time=60, timer=null, active=false, claim=null;

  const $ = id => document.getElementById(id);

  function buildDeck(){
    const lines=[];
    for(let m=0;m<7;m++){
      for(let b=0;b<7;b++){
        const a=[];
        for(let x=0;x<7;x++) a.push(x*7+((m*x+b)%7));
        a.push(49+m);
        lines.push(a);
      }
    }
    for(let b=0;b<7;b++){
      const a=[];
      for(let y=0;y<7;y++) a.push(b*7+y);
      a.push(56);
      lines.push(a);
    }
    lines.push([49,50,51,52,53,54,55,56]);
    return lines;
  }

  function shuffle(a){
    const out=[...a];
    for(let i=out.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  }

  function startGame(m){
    mode=m;
    $('start').style.display='none';
    score=0;
    streak=0;
    scores=[0,0];
    time=60;
    active=true;
    claim=null;
    deck=shuffle(buildDeck());

    if(timer) clearInterval(timer);
    timer=setInterval(()=>{
      time--;
      update();
      if(time<=0) endGame();
    },1000);

    renderPlayerButtons();
    update();
    newRound();
  }

  function renderPlayerButtons(){
    const wrap=$('playerButtons');
    wrap.innerHTML='';

    if(mode!==2) return;

    const p1=document.createElement('button');
    p1.type='button';
    p1.className='action blue';
    p1.textContent='🔵 שחקן 1 מצא!';
    p1.addEventListener('click',()=>claimPlayer(0));

    const p2=document.createElement('button');
    p2.type='button';
    p2.className='action pink';
    p2.textContent='🔴 שחקן 2 מצא!';
    p2.addEventListener('click',()=>claimPlayer(1));

    wrap.append(p1,p2);
  }

  function claimPlayer(p){
    if(!active) return;
    claim=p;
    $('turn').textContent='שחקן '+(p+1)+' — לחץ על ההתאמה!';
  }

  function newRound(){
    if(!active) return;

    claim=null;
    $('turn').textContent=mode===2?'מי מוצא ראשון?':'';

    let a=deck[Math.floor(Math.random()*deck.length)];
    let b;
    do {
      b=deck[Math.floor(Math.random()*deck.length)];
    } while(b===a);

    pair=[a,b];
    render();
  }

  const spots=[[50,16],[27,30],[70,31],[48,43],[22,58],[76,60],[39,76],[62,80]];

  function render(){
    const board=$('board');
    board.innerHTML='';

    pair.forEach(card=>{
      const el=document.createElement('div');
      el.className='card';

      shuffle(card).forEach((id,i)=>{
        const p=spots[i];
        const bt=document.createElement('button');
        bt.type='button';
        bt.className='sym';
        bt.textContent=icons[id];
        bt.style.left=p[0]+'%';
        bt.style.top=p[1]+'%';
        bt.style.fontSize=(36+Math.random()*18)+'px';
        bt.style.transform='translate(-50%,-50%) rotate('+(-25+Math.random()*50)+'deg)';
        bt.addEventListener('click',()=>hit(id));
        el.appendChild(bt);
      });

      board.appendChild(el);
    });
  }

  function hit(id){
    if(!active) return;

    if(mode===2 && claim===null){
      flash('בחרו קודם מי מצא');
      return;
    }

    const common=pair[0].find(x=>pair[1].includes(x));

    if(id===common){
      if(mode===1){
        score+=10+streak*2;
        streak++;
        flash('✓ מצאת!');
      }else{
        scores[claim]++;
        flash('✓ נקודה לשחקן '+(claim+1));
      }
      newRound();
    }else{
      if(mode===1){
        score=Math.max(0,score-3);
        streak=0;
      }else{
        scores[claim]=Math.max(0,scores[claim]-1);
        flash('✕ טעות לשחקן '+(claim+1));
        claim=null;
        $('turn').textContent='מי מוצא ראשון?';
      }
      update();
    }
  }

  function flash(t){
    const e=$('toast');
    e.textContent=t;
    clearTimeout(e._t);
    e._t=setTimeout(()=>{ e.textContent=''; },650);
  }

  function update(){
    const s=$('stats');
    s.innerHTML = mode===1
      ? '<div class="pill">🔥 '+streak+'</div><div class="pill">⭐ '+score+'</div><div class="pill">⏱️ '+time+'</div>'
      : '<div class="pill p1">🔵 '+scores[0]+'</div><div class="pill">⏱️ '+time+'</div><div class="pill p2">🔴 '+scores[1]+'</div>';
  }

  function endGame(){
    active=false;
    if(timer) clearInterval(timer);

    const panel=document.querySelector('.panel');
    panel.innerHTML='';

    const h=document.createElement('h1');
    const p=document.createElement('p');

    if(mode===1){
      h.textContent=String(score);
      p.textContent='הניקוד שלך';
    }else if(scores[0]===scores[1]){
      h.textContent='תיקו!';
      p.textContent=scores[0]+' : '+scores[1];
    }else{
      h.textContent='🏆 שחקן '+(scores[0]>scores[1]?1:2);
      p.textContent=scores[0]+' : '+scores[1];
    }

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='action primary big';
    btn.textContent='משחק חדש';
    btn.addEventListener('click',()=>location.reload());

    panel.append(h,p,btn);
    $('start').style.display='grid';
  }

  function showMenu(){
    location.reload();
  }

  function bindStaticControls(){
    const single=$('startSingle');
    const multi=$('startDouble');
    const shuffleBtn=$('shuffleBtn');
    const menuBtn=$('menuBtn');

    if(single) single.addEventListener('click',()=>startGame(1));
    if(multi) multi.addEventListener('click',()=>startGame(2));
    if(shuffleBtn) shuffleBtn.addEventListener('click',newRound);
    if(menuBtn) menuBtn.addEventListener('click',showMenu);
  }

  deck=buildDeck();
  bindStaticControls();

  // Visible fallback in case the browser blocks or fails to execute the game script.
  document.documentElement.dataset.doubleReady='1';
})();