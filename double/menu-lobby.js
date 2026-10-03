(()=>{
  'use strict';
  const S=window.DoubleMenuLobbyState;
  if(!S) return;
  const dropdown=document.getElementById('dropdown');
  const nav=dropdown?.querySelector('.nav');
  if(!dropdown||!nav) return;

  nav.classList.add('legacy-nav');
  dropdown.classList.add('lobby-enhanced');

  const getSaved=(k,fallback)=>{try{return localStorage.getItem(k)||fallback}catch(_){return fallback}};
  const setSaved=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};
  const voiceKey='double-announcer-pack-v1';
  const diffKey='double-difficulty-v1';
  const musicKey='double-music-enabled-v1';
  const fxKey='double-effects-enabled-v1';
  let state=S.createState({difficulty:getSaved(diffKey,'normal'),voice:getSaved(voiceKey,'british')});
  let musicOn=getSaved(musicKey,'1')!=='0';
  let fxOn=getSaved(fxKey,'1')!=='0';
  let audioCtx=null;
  let pendingOriginal=null;
  let voiceOpen=false;

  const lobby=document.createElement('div');
  lobby.className='lobby-ui';
  nav.parentNode.insertBefore(lobby,nav);

  const modeDescriptions={
    classic:['⚡','קלאסי','צבור כמה שיותר נקודות'],
    levels:['🗺️','עולם השלבים','התקדם משלב לשלב'],
    knockout:['🎯','נוקאאוט','עמוד ביעד לפני הזמן'],
    survival:['🛡️','הישרדות','כל הצלחה מוסיפה זמן'],
    sprint:['⏱️','מרוץ זמן','שבור את השיא שלך'],
    duel:['⚔️','דו־קרב קלאסי','הראשון ל־10'],
    deck:['🃏','חפיסה מלאה','שחקו על כל החפיסה'],
    vknockout:['❤️','נוקאאוט','3 חיים לכל שחקן'],
    race:['🏁','מרוץ ל־15','הראשון ליעד'],
    combo:['🔥','קומבו','ראשון לרצף של 5'],
    sudden:['💥','מוות פתאומי','טעות אחת וזה נגמר'],
    gold:['⭐','קלף זהב','כל סיבוב חמישי ×3']
  };

  function ac(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C) return null;
      if(!audioCtx) audioCtx=new C();
      if(audioCtx.state==='suspended') audioCtx.resume();
      return audioCtx;
    }catch(_){return null}
  }
  function uiTick(freq=720,dur=.055){
    if(!fxOn) return;
    const c=ac();if(!c)return;
    const o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.value=freq;
    g.gain.setValueAtTime(.0001,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.06,c.currentTime+.008);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
    o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur+.02);
  }
  let musicTimer=null,musicStep=0;
  function updateMusic(){
    clearInterval(musicTimer);musicTimer=null;
    if(!musicOn) return;
    const notes=[220,277.18,329.63,415.3];
    musicTimer=setInterval(()=>{
      const c=ac();if(!c)return;
      const o=c.createOscillator(),g=c.createGain();
      o.type='triangle';o.frequency.value=notes[musicStep++%notes.length];
      g.gain.setValueAtTime(.0001,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.014,c.currentTime+.02);
      g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.30);
      o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.33);
    },560);
  }

  function pageHeader(title,sub,back){
    return `<div class="lobby-page-header">${back?`<button class="lobby-back" type="button" data-lobby-back="${back}">←</button>`:''}<div><h3>${title}</h3><p>${sub}</p></div></div>`;
  }

  function settingsFooter(){
    const v=S.voiceSample(state.voice);
    const voices=voiceOpen?`<div class="compact-voice-list">${Object.entries(S.voiceMeta).map(([id,m])=>`<button type="button" class="compact-voice ${state.voice===id?'active':''}" data-lobby-voice="${id}"><span>${m.flag}</span><b>${m.label}</b><i>▶</i></button>`).join('')}</div>`:'';
    return `<div class="lobby-settings">
      <button type="button" class="compact-setting voice-setting ${voiceOpen?'open':''}" data-toggle-compact-voice><span>🎙️</span><b>קול: ${v.flag} ${v.label}</b><i>${voiceOpen?'⌃':'⌄'}</i></button>
      ${voices}
      <div class="compact-settings-row">
        <button type="button" class="compact-setting ${musicOn?'on':''}" data-sound="music"><span>🎵</span><b>מוזיקה</b><i>${musicOn?'ON':'OFF'}</i></button>
        <button type="button" class="compact-setting ${fxOn?'on':''}" data-sound="fx"><span>🔊</span><b>אפקטים</b><i>${fxOn?'ON':'OFF'}</i></button>
        <button type="button" class="compact-setting" data-lobby-how><span>❓</span><b>עזרה</b><i>›</i></button>
      </div>
    </div>`;
  }

  function playersHtml(){
    return `${pageHeader('כמה שחקנים?','זה הדבר הראשון שבוחרים')}
      <div class="lobby-choice-grid primary-choice-grid">
        <button class="lobby-choice player-choice" type="button" data-lobby-players="1"><span class="big-icon">🎮</span><b>שחקן אחד</b><small>זמן, שלבים ושיאים אישיים</small><i>←</i></button>
        <button class="lobby-choice player-choice" type="button" data-lobby-players="2"><span class="big-icon">👥</span><b>שני שחקנים</b><small>ראש בראש על אותו מסך</small><i>←</i></button>
      </div>${settingsFooter()}`;
  }

  function modesHtml(){
    const selector=state.players===2?'#twoSection .mode-choice':'#oneSection .mode-choice';
    const buttons=[...document.querySelectorAll(selector)];
    const cards=buttons.map((b,i)=>{
      const variant=b.dataset.variant||'';
      const mode=b.dataset.mode||'classic';
      let key=mode;
      if(mode==='versus') key=variant==='knockout'?'vknockout':variant;
      const info=modeDescriptions[key]||['🎴',(b.querySelector('b')?.textContent||'משחק').trim(),(b.querySelector('small')?.textContent||'').trim()];
      return `<button class="lobby-mode" type="button" data-lobby-mode-index="${i}"><span class="mode-icon">${info[0]}</span><span><b>${info[1]}</b><small>${info[2]}</small></span><span class="go">←</span></button>`;
    }).join('');
    return `${pageHeader(state.players===2?'בחר קרב':'בחר משחק',state.players===2?'👥 שני שחקנים':'🎮 שחקן אחד','players')}<div class="lobby-mode-list">${cards}</div>${settingsFooter()}`;
  }

  function difficultyHtml(){
    const items=[['easy','🌱','קל','יותר זמן וקצב רגוע','#63e6be',1],['normal','⚡','בינוני','הקצב הרגיל','#ffd84d',2],['hard','🔥','קשה','פחות זמן וקצב מהיר','#ff6b7f',3]];
    return `${pageHeader('בחר רמת קושי',`${state.players===2?'👥 שני שחקנים':'🎮 שחקן אחד'} · ${state.modeLabel}`,'modes')}
      <div class="lobby-diff-list">${items.map(([id,icon,label,sub,color,n])=>`<button class="lobby-diff ${state.difficulty===id?'active':''}" style="--dc:${color}" type="button" data-lobby-diff="${id}"><span class="diff-icon">${icon}</span><span><b>${label}</b><small>${sub}</small></span><span class="lobby-meter">${[1,2,3].map(x=>`<i class="${x<=n?'on':''}"></i>`).join('')}</span></button>`).join('')}</div>${settingsFooter()}`;
  }

  function howHtml(){
    return `${pageHeader('איך משחקים?','מצא את הסמל המשותף לפני הזמן או היריב','players')}<div class="lobby-how-demo"><div class="mini-board"><div class="mini-card a"><span class="mini-symbol one">🍕</span><span class="mini-symbol two">🚀</span><span class="mini-symbol common">⭐</span></div><div class="mini-card b"><span class="mini-symbol one">🐶</span><span class="mini-symbol two">🎸</span><span class="mini-symbol common">⭐</span></div><span class="mini-pointer">☝️</span></div><div class="how-steps"><div class="how-step"><b>1</b>חפש את הסמל היחיד שמופיע בשני הקלפים.</div><div class="how-step"><b>2</b>לחץ עליו לפני שהזמן או היריב מקדימים אותך.</div><div class="how-step"><b>3</b>צבור רצפים, מטבעות ושיאים.</div></div></div>${settingsFooter()}`;
  }

  function render(screen=state.screen){
    state={...state,screen};
    let body=playersHtml();
    if(screen==='modes') body=modesHtml();
    else if(screen==='difficulty') body=difficultyHtml();
    else if(screen==='how') body=howHtml();
    lobby.innerHTML=`<section class="lobby-page active">${body}</section>`;
    bindLobby();
  }

  function clickOriginal(sel){const el=document.querySelector(sel);if(el){el.click();return el}return null;}
  function speakVoice(id){
    const sample=S.voiceSample(id);
    state=S.chooseVoice(state,id);
    setSaved(voiceKey,state.voice);
    clickOriginal(`[data-voice="${id}"]`);
    uiTick(860,.06);
    if('speechSynthesis' in window){
      try{
        speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(sample.text);u.lang=sample.lang;
        u.rate=id==='italian'?1.08:id==='russian'?.96:1.02;u.pitch=id==='arcade'?1.18:1;
        const voices=speechSynthesis.getVoices();
        u.voice=voices.find(v=>v.lang?.toLowerCase()===sample.lang.toLowerCase())||voices.find(v=>v.lang?.toLowerCase().startsWith(sample.lang.slice(0,2).toLowerCase()))||null;
        speechSynthesis.speak(u);
      }catch(_){}
    }
    render(state.screen);
  }

  function finishSelection(diff){
    state=S.chooseDifficulty(state,diff);
    setSaved(diffKey,state.difficulty);
    clickOriginal(`[data-difficulty="${state.difficulty}"]`);
    uiTick(state.difficulty==='hard'?920:state.difficulty==='easy'?600:760);
    if(pendingOriginal){
      const original=pendingOriginal;
      pendingOriginal=null;
      original.click();
    }
    state={...state,screen:'players'};
    voiceOpen=false;
  }

  function bindLobby(){
    lobby.querySelectorAll('[data-lobby-back]').forEach(b=>b.onclick=()=>{uiTick(560);voiceOpen=false;render(b.dataset.lobbyBack)});
    lobby.querySelectorAll('[data-lobby-players]').forEach(b=>b.onclick=()=>{
      state=S.choosePlayers(state,Number(b.dataset.lobbyPlayers));
      clickOriginal(`[data-players="${state.players}"]`);
      uiTick(760);voiceOpen=false;render('modes');
    });
    lobby.querySelectorAll('[data-lobby-mode-index]').forEach(b=>b.onclick=()=>{
      const list=[...document.querySelectorAll(state.players===2?'#twoSection .mode-choice':'#oneSection .mode-choice')];
      const original=list[Number(b.dataset.lobbyModeIndex)];
      if(!original) return;
      pendingOriginal=original;
      const label=(original.querySelector('b')?.textContent||'משחק').replace(/^\S+\s*/,'').trim();
      state=S.chooseMode(state,{mode:original.dataset.mode,variant:original.dataset.variant,target:original.dataset.target,label});
      uiTick(820);voiceOpen=false;render('difficulty');
    });
    lobby.querySelectorAll('[data-lobby-diff]').forEach(b=>b.onclick=()=>finishSelection(b.dataset.lobbyDiff));
    lobby.querySelector('[data-toggle-compact-voice]')?.addEventListener('click',()=>{voiceOpen=!voiceOpen;uiTick(650);render(state.screen)});
    lobby.querySelectorAll('[data-lobby-voice]').forEach(b=>b.onclick=()=>speakVoice(b.dataset.lobbyVoice));
    lobby.querySelectorAll('[data-sound]').forEach(b=>b.onclick=()=>{
      if(b.dataset.sound==='music'){
        musicOn=!musicOn;setSaved(musicKey,musicOn?'1':'0');updateMusic();
      }else{
        fxOn=!fxOn;setSaved(fxKey,fxOn?'1':'0');
      }
      uiTick(650);render(state.screen);
    });
    lobby.querySelector('[data-lobby-how]')?.addEventListener('click',()=>{voiceOpen=false;uiTick();render('how')});
  }

  document.getElementById('menuBtn')?.addEventListener('click',()=>{
    state={...state,screen:'players'};pendingOriginal=null;voiceOpen=false;render('players');if(musicOn)updateMusic();
  });
  document.getElementById('closeBtn')?.addEventListener('click',()=>{clearInterval(musicTimer);musicTimer=null});
  document.getElementById('overlay')?.addEventListener('click',()=>{clearInterval(musicTimer);musicTimer=null});
  render('players');
})();
