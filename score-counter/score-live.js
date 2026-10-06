(function(){
  const core=window.ScoreLiveCore;
  const teams=document.getElementById('teams');
  if(!core || !teams) return;

  const ROTATION_STORAGE_KEY='team-score-rotations-v1';
  const DEFAULT_COUNTDOWN_MS=5*60*1000;
  let rotations={};
  try{
    const saved=JSON.parse(localStorage.getItem(ROTATION_STORAGE_KEY)||'{}');
    rotations=saved && typeof saved==='object' ? saved : {};
  }catch{}
  const saveRotations=()=>{try{localStorage.setItem(ROTATION_STORAGE_KEY,JSON.stringify(rotations));}catch{}};
  const cardId=card=>card.querySelector('.delete-team')?.dataset.teamId || card.dataset.dragTeamId || '';

  function buildTimer(){
    if(document.querySelector('.score-live-timer')) return;
    const bar=document.createElement('div');
    bar.className='score-live-timer';
    bar.setAttribute('data-timer-mode','up');
    bar.innerHTML='\
      <button type="button" class="score-timer-mode" data-timer-mode="up" aria-label="החלפת מצב טיימר">↑ סטופר</button>\
      <button type="button" class="score-timer-display" aria-label="זמן הטיימר">00:00</button>\
      <button type="button" class="score-timer-play" aria-label="הפעלת טיימר">▶</button>\
      <button type="button" class="score-timer-reset" aria-label="איפוס טיימר">↺</button>\
      <div class="score-timer-edit" hidden>\
        <input class="score-timer-minutes" type="number" min="0" max="999" value="5" inputmode="numeric" aria-label="דקות">\
        <span>:</span>\
        <input class="score-timer-seconds" type="number" min="0" max="59" value="0" inputmode="numeric" aria-label="שניות">\
        <button type="button" class="score-timer-save" aria-label="שמירת זמן">✓</button>\
      </div>';

    const parent=teams.parentElement || document.body;
    parent.insertBefore(bar,teams);

    const modeButton=bar.querySelector('.score-timer-mode');
    const display=bar.querySelector('.score-timer-display');
    const play=bar.querySelector('.score-timer-play');
    const reset=bar.querySelector('.score-timer-reset');
    const edit=bar.querySelector('.score-timer-edit');
    const minutes=bar.querySelector('.score-timer-minutes');
    const seconds=bar.querySelector('.score-timer-seconds');
    const save=bar.querySelector('.score-timer-save');

    let timerMode='up';
    let running=false;
    let baseMs=0;
    let countdownPresetMs=DEFAULT_COUNTDOWN_MS;
    let startedAt=0;

    function currentMs(){
      if(!running) return baseMs;
      const delta=Date.now()-startedAt;
      return timerMode==='up' ? baseMs+delta : Math.max(0,baseMs-delta);
    }

    function render(){
      const value=currentMs();
      display.textContent=core.formatClock(value);
      bar.setAttribute('data-timer-mode',timerMode);
      modeButton.dataset.timerMode=timerMode;
      modeButton.textContent=timerMode==='up'?'↑ סטופר':'↓ לאחור';
      play.textContent=running?'⏸':'▶';
      play.setAttribute('aria-label',running?'השהיית טיימר':'הפעלת טיימר');
      if(timerMode==='down' && running && value<=0){
        running=false;
        baseMs=0;
        play.textContent='▶';
        bar.classList.add('score-timer-finished');
        setTimeout(()=>bar.classList.remove('score-timer-finished'),900);
      }
    }

    function pause(){
      if(!running) return;
      baseMs=currentMs();
      running=false;
      render();
    }

    modeButton.addEventListener('click',()=>{
      pause();
      timerMode=timerMode==='up'?'down':'up';
      baseMs=timerMode==='up'?0:countdownPresetMs;
      edit.hidden=true;
      render();
    });

    play.addEventListener('click',()=>{
      if(running){
        pause();
        return;
      }
      if(timerMode==='down' && baseMs<=0) baseMs=countdownPresetMs;
      startedAt=Date.now();
      running=true;
      edit.hidden=true;
      render();
    });

    reset.addEventListener('click',()=>{
      running=false;
      baseMs=timerMode==='up'?0:countdownPresetMs;
      edit.hidden=true;
      render();
    });

    display.addEventListener('click',()=>{
      if(timerMode!=='down') return;
      pause();
      const total=Math.max(0,Math.floor(baseMs/1000));
      minutes.value=String(Math.floor(total/60));
      seconds.value=String(total%60);
      edit.hidden=!edit.hidden;
      if(!edit.hidden) minutes.focus();
    });

    save.addEventListener('click',()=>{
      const next=core.clockMs(minutes.value,seconds.value);
      countdownPresetMs=next;
      baseMs=next;
      running=false;
      edit.hidden=true;
      render();
    });

    [bar,edit].forEach(el=>el.addEventListener('pointerdown',e=>e.stopPropagation()));
    setInterval(render,250);
    render();
  }

  function buildRotationChip(card,id){
    if(!id || card.querySelector('.score-rotation-chip')) return;
    const current=Number(rotations[id]);
    const rotation=Number.isFinite(current) && current>=1 && current<=6 ? current : 1;
    rotations[id]=rotation;

    const chip=document.createElement('div');
    chip.className='score-rotation-chip';
    chip.dataset.teamId=id;
    chip.innerHTML='\
      <button type="button" class="score-rotation-prev" aria-label="רוטציה קודמת">‹</button>\
      <span class="score-rotation-label">רוטציה <b>'+rotation+'</b>/6</span>\
      <button type="button" class="score-rotation-next" aria-label="רוטציה הבאה">›</button>';

    const label=chip.querySelector('.score-rotation-label b');
    const update=delta=>{
      const next=core.nextRotation(rotations[id]||1,delta);
      rotations[id]=next;
      label.textContent=String(next);
      saveRotations();
    };

    chip.querySelector('.score-rotation-prev').addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();update(-1);
    });
    chip.querySelector('.score-rotation-next').addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();update(1);
    });
    chip.addEventListener('pointerdown',e=>e.stopPropagation());
    chip.addEventListener('click',e=>e.stopPropagation());
    card.appendChild(chip);
  }

  function attachRotations(){
    teams.querySelectorAll(':scope > .card').forEach(card=>{
      const id=cardId(card);
      if(id) buildRotationChip(card,id);
    });
  }

  buildTimer();
  attachRotations();
  const observer=new MutationObserver(()=>requestAnimationFrame(attachRotations));
  observer.observe(teams,{childList:true});
})();
