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

  const lobby=document.createElement('div');
  lobby.className='lobby-ui';
  nav.parentNode.insertBefore(lobby,nav);

  const modeDescriptions={
    classic:['⚡','קלאסי','צבור כמה שיותר נקודות'],levels:['🗺️','עולם השלבים','התקדם משלב לשלב'],knockout:['🎯','נוקאאוט','עמוד ביעד לפני הזמן'],survival:['🛡️','הישרדות','כל הצלחה מוסיפה זמן'],sprint:['⏱️','מרוץ זמן','שבור את השיא שלך'],
    duel:['⚔️','דו־קרב קלאסי','הראשון ל־10'],deck:['🃏','חפיסה מלאה','שחקו על כל החפיסה'],vknockout:['❤️','נוקאאוט','3 חיים לכל שחקן'],race:['🏁','מרוץ ל־15','הראשון ליעד'],combo:['🔥','קומבו','ראשון לרצף של 5'],sudden:['💥','מוות פתאומי','טעות אחת וזה נגמר'],gold:['⭐','קלף זהב','כל סיבוב חמישי ×3']
  };
  const voiceCharacter={british:'שדר ספורט בריטי סמכותי',russian:'עמוק, דרמטי וקשוח',italian:'חם, מהיר ומתלהב',american:'הייפ של אולם ספורט',japanese:'חד, מדויק ואנרגטי',arcade:'מוגזם ומשחקי'};

  function ac(){
    try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!audioCtx)audioCtx=new C();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(_){return null}
  }
  function uiTick(freq=720,dur=.055){
    if(!fxOn)return;const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.07,c.currentTime+.008);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur+.02)
  }
  let musicTimer=null,musicStep=0;
  function updateMusic(){
    clearInterval(musicTimer);musicTimer=null;if(!musicOn)return;
    const notes=[220,277.18,329.63,415.3];
    musicTimer=setInterval(()=>{const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=notes[musicStep++%notes.length];g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.018,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.32);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.35)},520);
  }

  function loadout(){return S.loadoutLabel(state)+' · '+state.modeLabel;}
  function pageShell(title,sub,body,back='home'){
    return `<div class="lobby-page-header"><button class="lobby-back" type="button" data-lobby-back="${back}">←</button><div><h3>${title}</h3><p>${sub}</p></div></div>${body}`;
  }
  function homeHtml(){
    const v=S.voiceSample(state.voice);
    return `<div class="lobby-loadout"><div><small>הבחירה שלך</small><b>${loadout()}</b></div><i class="lobby-live-dot"></i></div>
      <div class="lobby-home-grid">
        <button class="lobby-tile game" type="button" data-lobby-screen="players"><span class="lobby-icon">🎮</span><span class="lobby-copy"><b>מצבי משחק</b><small>בחר שחקנים, רמה ואז משחק</small></span><span class="lobby-arrow">←</span></button>
        <button class="lobby-tile voice" type="button" data-lobby-screen="voice"><span class="lobby-icon">${v.flag}</span><span class="lobby-copy"><b>הכרוז שלך: ${v.label}</b><small>החלק בין הקולות ולחץ כדי לשמוע</small></span><span class="lobby-arrow">🎙️</span></button>
        <button class="lobby-tile how" type="button" data-lobby-screen="how"><span class="lobby-icon">❓</span><span class="lobby-copy"><b>איך משחקים?</b><small>הדגמה קצרה וחיה בתוך התפריט</small></span><span class="lobby-arrow">←</span></button>
      </div>
      <div class="lobby-sound-row">
        <button class="sound-toggle ${musicOn?'on':''}" data-sound="music" type="button">🎵 מוזיקה <span>${musicOn?'ON':'OFF'}</span><span class="bars"><i></i><i></i><i></i></span></button>
        <button class="sound-toggle ${fxOn?'on':''}" data-sound="fx" type="button">🔊 אפקטים <span>${fxOn?'ON':'OFF'}</span><span class="bars"><i></i><i></i><i></i></span></button>
      </div>`;
  }
  function playersHtml(){
    return pageShell('כמה שחקנים?','בחר את סוג הקרב',`<div class="lobby-choice-grid">
      <button class="lobby-choice" type="button" data-lobby-players="1"><span class="big-icon">🎮</span><b>שחקן אחד</b><small>זמן, שלבים ושיאים</small></button>
      <button class="lobby-choice" type="button" data-lobby-players="2"><span class="big-icon">👥</span><b>שני שחקנים</b><small>ראש בראש על אותו מסך</small></button>
    </div>`);
  }
  function difficultyHtml(){
    const items=[['easy','🌱','קל','יותר זמן וקצב רגוע','#63e6be',1],['normal','⚡','בינוני','הקצב הרגיל','#ffd84d',2],['hard','🔥','קשה','פחות זמן וקצב מהיר','#ff6b7f',3]];
    return pageShell('בחר רמת קושי',state.players===2?'הרמה תשפיע על קצב הקרב':'הרמה תשפיע על זמן וקצב',`<div class="lobby-diff-list">${items.map(([id,icon,label,sub,color,n])=>`<button class="lobby-diff ${state.difficulty===id?'active':''}" style="--dc:${color}" type="button" data-lobby-diff="${id}"><span class="diff-icon">${icon}</span><span><b>${label}</b><small>${sub}</small></span><span class="lobby-meter">${[1,2,3].map(x=>`<i class="${x<=n?'on':''}"></i>`).join('')}</span></button>`).join('')}</div>`,'players');
  }
  function modesHtml(){
    const selector=state.players===2?'#twoSection .mode-choice':'#oneSection .mode-choice';
    const buttons=[...document.querySelectorAll(selector)];
    const cards=buttons.map((b,i)=>{
      const variant=b.dataset.variant||'';const mode=b.dataset.mode||'classic';
      let key=mode;if(mode==='versus')key=variant==='knockout'?'vknockout':variant;const info=modeDescriptions[key]||['🎴',(b.querySelector('b')?.textContent||'משחק').trim(),(b.querySelector('small')?.textContent||'').trim()];
      return `<button class="lobby-mode" type="button" data-lobby-mode-index="${i}"><span class="mode-icon">${info[0]}</span><span><b>${info[1]}</b><small>${info[2]}</small></span><span class="go">←</span></button>`;
    }).join('');
    return pageShell(state.players===2?'בחר קרב':'בחר משחק',`${state.players===2?'👥 שני שחקנים':'🎮 שחקן אחד'} · ${(S.diffMeta[state.difficulty]||S.diffMeta.normal).label}`,`<div class="lobby-mode-list">${cards}</div>`,'difficulty');
  }
  function voiceHtml(){
    const cards=Object.entries(S.voiceMeta).map(([id,v])=>`<button class="voice-card ${state.voice===id?'active':''}" type="button" data-lobby-voice="${id}"><span class="voice-flag">${v.flag}</span><b>${v.label}</b><small>${voiceCharacter[id]||''}</small><span class="voice-waves"><i></i><i></i><i></i><i></i></span><span class="voice-preview">▶ השמע דוגמה</span></button>`).join('');
    return pageShell('בחר כרוז','החלק בין הקולות ושמע אותם לפני הבחירה',`<div class="lobby-voice-stage"><div class="voice-carousel">${cards}</div><div class="voice-status">הכרוז שנבחר יישמר גם למשחק הבא</div></div>`);
  }
  function howHtml(){
    return pageShell('איך משחקים?','שלוש שניות ואתה בפנים',`<div class="lobby-how-demo"><div class="mini-board"><div class="mini-card a"><span class="mini-symbol one">🍕</span><span class="mini-symbol two">🚀</span><span class="mini-symbol common">⭐</span></div><div class="mini-card b"><span class="mini-symbol one">🐶</span><span class="mini-symbol two">🎸</span><span class="mini-symbol common">⭐</span></div><span class="mini-pointer">☝️</span></div><div class="how-steps"><div class="how-step"><b>1</b>חפש את הסמל היחיד שמופיע בשני הקלפים.</div><div class="how-step"><b>2</b>לחץ עליו לפני שהזמן או היריב מקדימים אותך.</div><div class="how-step"><b>3</b>בנה רצף, אסוף מטבעות ושבור שיאים.</div></div></div>`);
  }

  function render(screen=state.screen){
    state={...state,screen};
    lobby.innerHTML=`<section class="lobby-page active">${screen==='home'?homeHtml():screen==='players'?playersHtml():screen==='difficulty'?difficultyHtml():screen==='modes'?modesHtml():screen==='voice'?voiceHtml():howHtml()}</section>`;
    bindLobby();
    if(screen==='voice') requestAnimationFrame(()=>lobby.querySelector('.voice-card.active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}));
  }

  function clickOriginal(sel){const el=document.querySelector(sel);if(el){el.click();return el}return null;}
  function speakVoice(id){
    const sample=S.voiceSample(id);state=S.chooseVoice(state,id);setSaved(voiceKey,state.voice);clickOriginal(`[data-voice="${id}"]`);uiTick(880,.06);
    if('speechSynthesis' in window){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(sample.text);u.lang=sample.lang;u.rate=id==='italian'?1.08:id==='russian'?.96:1.02;u.pitch=id==='arcade'?1.18:1;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang?.toLowerCase()===sample.lang.toLowerCase())||voices.find(v=>v.lang?.toLowerCase().startsWith(sample.lang.slice(0,2).toLowerCase()))||null;speechSynthesis.speak(u)}catch(_){}}
    render('voice');
  }
  function bindLobby(){
    lobby.querySelectorAll('[data-lobby-screen]').forEach(b=>b.onclick=()=>{uiTick();render(b.dataset.lobbyScreen)});
    lobby.querySelectorAll('[data-lobby-back]').forEach(b=>b.onclick=()=>{uiTick(560);render(b.dataset.lobbyBack)});
    lobby.querySelectorAll('[data-lobby-players]').forEach(b=>b.onclick=()=>{state=S.choosePlayers(state,Number(b.dataset.lobbyPlayers));clickOriginal(`[data-players="${state.players}"]`);uiTick(760);render('difficulty')});
    lobby.querySelectorAll('[data-lobby-diff]').forEach(b=>b.onclick=()=>{state=S.chooseDifficulty(state,b.dataset.lobbyDiff);setSaved(diffKey,state.difficulty);clickOriginal(`[data-difficulty="${state.difficulty}"]`);uiTick(state.difficulty==='hard'?920:state.difficulty==='easy'?600:760);render('modes')});
    lobby.querySelectorAll('[data-lobby-mode-index]').forEach(b=>b.onclick=()=>{const list=[...document.querySelectorAll(state.players===2?'#twoSection .mode-choice':'#oneSection .mode-choice')];const original=list[Number(b.dataset.lobbyModeIndex)];if(!original)return;const label=(original.querySelector('b')?.textContent||'משחק').replace(/^\S+\s*/,'').trim();state=S.chooseMode(state,{mode:original.dataset.mode,variant:original.dataset.variant,target:original.dataset.target,label});uiTick(980,.075);original.click()});
    lobby.querySelectorAll('[data-lobby-voice]').forEach(b=>b.onclick=()=>speakVoice(b.dataset.lobbyVoice));
    lobby.querySelectorAll('[data-sound]').forEach(b=>b.onclick=()=>{if(b.dataset.sound==='music'){musicOn=!musicOn;setSaved(musicKey,musicOn?'1':'0');updateMusic()}else{fxOn=!fxOn;setSaved(fxKey,fxOn?'1':'0')}uiTick(650);render('home')});
  }

  document.getElementById('menuBtn')?.addEventListener('click',()=>{state={...state,screen:'home'};render('home');if(musicOn)updateMusic()});
  document.getElementById('closeBtn')?.addEventListener('click',()=>{clearInterval(musicTimer);musicTimer=null});
  document.getElementById('overlay')?.addEventListener('click',()=>{clearInterval(musicTimer);musicTimer=null});
  render('home');
})();
