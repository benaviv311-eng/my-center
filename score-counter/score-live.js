(function(){
  const core=window.ScoreLiveCore;
  const teams=document.getElementById('teams');
  if(!core || !teams) return;

  const DEFAULT_COUNTDOWN_MS=5*60*1000;

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
      if(running){pause();return;}
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

  const descriptor=el=>[
    el.textContent,
    el.getAttribute('aria-label'),
    el.getAttribute('title'),
    el.id,
    typeof el.className==='string'?el.className:''
  ].filter(Boolean).join(' ').trim().toLowerCase();

  const isMegaButton=button=>/(mega|מגה)/i.test(descriptor(button));
  const isPlusButton=button=>{
    if(isMegaButton(button)) return false;
    const text=(button.textContent||'').trim();
    return core.isScoreDeltaLabel(text,1) || /(plus|increment|הוסף|הוספת נקודה)/i.test(descriptor(button));
  };
  const isMinusButton=button=>{
    const text=(button.textContent||'').trim();
    return core.isScoreDeltaLabel(text,-1) || /(minus|decrement|הפחת|הורד)/i.test(descriptor(button));
  };
  const isSecondaryAction=button=>{
    const text=descriptor(button);
    return button.classList.contains('delete-team') || /(delete|remove|trash|מחק|מחיקה|edit|ערוך|עריכה|reset|איפוס)/i.test(text);
  };

  function findScoreValue(card){
    const selectors=[
      '.score-value','.team-score','.score-number','.points-value','.points','.score','[data-role="score"]','[data-score]'
    ];
    for(const selector of selectors){
      const found=card.querySelector(selector);
      if(found && !found.closest('button')) return found;
    }

    const candidates=Array.from(card.querySelectorAll('*')).filter(el=>{
      if(el.closest('button,.score-size-menu,.score-resize-handle,.score-card-menu')) return false;
      return /^\d{1,4}$/u.test((el.textContent||'').trim());
    });
    if(!candidates.length) return null;
    candidates.sort((a,b)=>{
      const aSize=parseFloat(getComputedStyle(a).fontSize)||0;
      const bSize=parseFloat(getComputedStyle(b).fontSize)||0;
      return bSize-aSize;
    });
    return candidates[0];
  }

  function directCardChild(node,card){
    let current=node;
    while(current && current.parentElement && current.parentElement!==card){
      current=current.parentElement;
    }
    return current && current.parentElement===card ? current : null;
  }

  function earliestAnchor(card,nodes){
    const children=Array.from(card.children);
    const direct=nodes.map(node=>directCardChild(node,card)).filter(Boolean);
    direct.sort((a,b)=>children.indexOf(a)-children.indexOf(b));
    return direct[0]||null;
  }

  function removeEmptyContainer(node,card){
    let current=node;
    while(current && current!==card){
      const parent=current.parentElement;
      const meaningfulText=(current.textContent||'').trim();
      if(current.childElementCount===0 && !meaningfulText){
        current.remove();
        current=parent;
        continue;
      }
      break;
    }
  }

  function cleanExplanatoryCopy(card){
    const protectedSelector='button,input,.score-board-row,.score-card-mega,.score-card-menu,.score-card-menu-toggle,.score-size-menu,.score-resize-handle';
    card.querySelectorAll('.hint,.help,.helper,.description,.score-hint,[data-help]').forEach(el=>{
      if(!el.closest(protectedSelector)) el.remove();
    });
    card.querySelectorAll('small,p,span,div').forEach(el=>{
      if(el===card || el.children.length || el.closest(protectedSelector)) return;
      if(core.isExplanatoryCopy(el.textContent||'')) el.remove();
    });
    card.setAttribute('data-score-compact','1');
  }

  function buildMenu(card,actions){
    if(card.querySelector('.score-card-menu-toggle')) return;
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='score-card-menu-toggle';
    toggle.setAttribute('aria-label','פעולות נוספות');
    toggle.setAttribute('aria-expanded','false');
    toggle.textContent='⋯';

    const menu=document.createElement('div');
    menu.className='score-card-menu';
    menu.hidden=true;
    menu._scoreOwner=card;

    const source=document.createElement('div');
    source.className='score-card-action-source';
    source.hidden=true;
    card.appendChild(source);

    actions.forEach(original=>{
      const oldParent=original.parentElement;
      const proxy=original.cloneNode(true);
      proxy.removeAttribute('id');
      proxy.classList.add('score-card-menu-proxy');
      proxy.addEventListener('click',e=>{
        e.preventDefault();
        original.click();
      });
      source.appendChild(original);
      menu.appendChild(proxy);
      removeEmptyContainer(oldParent,card);
    });

    const setOpen=open=>{
      menu.hidden=!open;
      toggle.setAttribute('aria-expanded',open?'true':'false');
    };

    toggle.addEventListener('pointerdown',e=>e.stopPropagation());
    menu.addEventListener('pointerdown',e=>e.stopPropagation());
    toggle.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.score-card-menu:not([hidden])').forEach(other=>{
        if(other!==menu) other.hidden=true;
      });
      document.querySelectorAll('.score-card-menu-toggle[aria-expanded="true"]').forEach(other=>{
        if(other!==toggle) other.setAttribute('aria-expanded','false');
      });
      setOpen(menu.hidden);
    });
    menu.addEventListener('click',e=>{
      e.stopPropagation();
      if(e.target.closest('button')) setOpen(false);
    });

    card.appendChild(toggle);
    document.body.appendChild(menu);
  }

  function professionalizeCard(card){
    if(card.getAttribute('data-score-professional')==='1') return;
    cleanExplanatoryCopy(card);

    const buttons=Array.from(card.querySelectorAll('button')).filter(button=>
      !button.closest('.score-resize-handle,.score-size-menu,.score-card-menu')
    );
    const plus=buttons.find(isPlusButton);
    const minus=buttons.find(isMinusButton);
    const mega=buttons.find(isMegaButton);
    const score=findScoreValue(card);
    if(!plus || !minus || !score) return;

    const anchor=earliestAnchor(card,[plus,minus,mega,score].filter(Boolean));
    const originalParents=[plus.parentElement,minus.parentElement,score.parentElement];
    if(mega) originalParents.push(mega.parentElement);

    const row=document.createElement('div');
    row.className='score-board-row';
    minus.classList.add('score-board-minus');
    plus.classList.add('score-board-plus');
    score.classList.add('score-board-value');
    row.appendChild(minus);
    row.appendChild(score);
    row.appendChild(plus);

    if(anchor) card.insertBefore(row,anchor);
    else card.appendChild(row);

    if(mega){
      const megaRow=document.createElement('div');
      megaRow.className='score-card-mega';
      megaRow.appendChild(mega);
      row.after(megaRow);
    }

    originalParents.forEach(parent=>removeEmptyContainer(parent,card));

    const secondary=buttons.filter(button=>button!==plus && button!==minus && button!==mega && isSecondaryAction(button));
    if(secondary.length) buildMenu(card,secondary);

    cleanExplanatoryCopy(card);
    card.classList.add('score-card-professional');
    card.setAttribute('data-score-professional','1');
  }

  function cleanupOrphanMenus(){
    document.querySelectorAll('.score-card-menu').forEach(menu=>{
      if(menu._scoreOwner && !menu._scoreOwner.isConnected) menu.remove();
    });
  }

  function attachProfessionalCards(){
    teams.querySelectorAll(':scope > .card').forEach(professionalizeCard);
    cleanupOrphanMenus();
  }

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest && e.target.closest('.score-card-menu,.score-card-menu-toggle')) return;
    document.querySelectorAll('.score-card-menu:not([hidden])').forEach(menu=>menu.hidden=true);
    document.querySelectorAll('.score-card-menu-toggle[aria-expanded="true"]').forEach(toggle=>toggle.setAttribute('aria-expanded','false'));
  },true);

  buildTimer();
  attachProfessionalCards();
  const observer=new MutationObserver(()=>requestAnimationFrame(attachProfessionalCards));
  observer.observe(teams,{childList:true});
})();
