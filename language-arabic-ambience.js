(function(){
  const params=new URLSearchParams(location.search);
  const lang=params.get('lang')||'ar';
  if(lang!=='ar')return;

  if(!document.querySelector('link[data-arabic-courtyard]')){
    const theme=document.createElement('link');
    theme.rel='stylesheet';
    theme.href='language-arabic-courtyard.css?v=1';
    theme.dataset.arabicCourtyard='1';
    document.head.appendChild(theme);
  }

  const toggle=document.getElementById('arabic-music-toggle');
  const moment=document.getElementById('arabic-living-moment');
  if(toggle)toggle.hidden=false;
  if(moment)moment.hidden=false;

  const STORAGE_KEY='my-center-arabic-music-muted';
  const moments=[
    ['صباح الخير','צַבַּאח אֶלְחֵ׳יר','בוקר טוב'],
    ['أهلا وسهلا','אַהְלַן וּסַהְלַן','ברוכים הבאים'],
    ['كيفك؟','כִּיפַכּ?','מה שלומך?'],
    ['شو الأخبار؟','שוּ לְאַחְ׳בַּאר?','מה נשמע?'],
    ['يعطيك العافية','יַעְטִיכּ אֶלְעַאפְיֶה','כל הכבוד / שיהיה לך כוח'],
    ['ولا يهمك','וַלַא יְהִמַכּ','אל תדאג / אין בעיה'],
    ['على مهلك','עַלַא מַהְלַכּ','לאט, בקצב שלך']
  ];

  if(moment){
    const day=Math.floor(Date.now()/86400000);
    const item=moments[((day%moments.length)+moments.length)%moments.length];
    moment.innerHTML=`<span class="arabic-moment-kicker">رَوْقَان · רגע ערבי</span><strong class="arabic-moment-script" dir="rtl">${item[0]}</strong><span class="arabic-moment-translit">${item[1]}</span><span class="arabic-moment-hebrew">${item[2]}</span>`;
  }

  let muted=false;
  try{muted=localStorage.getItem(STORAGE_KEY)==='1';}catch(_error){}

  const AudioContext=window.AudioContext||window.webkitAudioContext;
  let ctx=null;
  let master=null;
  let intervalId=0;
  let loopIndex=0;
  let droneOsc=null;
  let droneGain=null;

  function updateButton(state){
    if(!toggle)return;
    const playing=state==='playing';
    toggle.classList.toggle('is-playing',playing);
    toggle.classList.toggle('is-muted',muted);
    toggle.setAttribute('aria-pressed',muted?'true':'false');
    toggle.textContent=muted?'🔇 מוזיקה כבויה':playing?'🎵 מוזיקה פועלת':'🎵 מוזיקה';
    toggle.title=muted?'הפעל מוזיקת אווירה':'כבה מוזיקת אווירה';
  }

  function ensureAudio(){
    if(!AudioContext)return false;
    if(ctx)return true;
    ctx=new AudioContext();
    master=ctx.createGain();
    master.gain.value=0.15;
    master.connect(ctx.destination);
    return true;
  }

  function pluck(frequency,when,length=0.62,volume=0.12){
    if(!ctx||!master)return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const filter=ctx.createBiquadFilter();
    osc.type='triangle';
    osc.frequency.setValueAtTime(frequency,when);
    filter.type='lowpass';
    filter.frequency.setValueAtTime(1800,when);
    gain.gain.setValueAtTime(0.0001,when);
    gain.gain.exponentialRampToValueAtTime(volume,when+0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001,when+length);
    osc.connect(filter);filter.connect(gain);gain.connect(master);
    osc.start(when);osc.stop(when+length+0.04);
  }

  function startDrone(){
    if(!ctx||!master||droneOsc)return;
    droneOsc=ctx.createOscillator();
    droneGain=ctx.createGain();
    droneOsc.type='sine';
    droneOsc.frequency.value=110;
    droneGain.gain.value=0.018;
    droneOsc.connect(droneGain);droneGain.connect(master);
    droneOsc.start();
  }

  function scheduleBar(){
    if(!ctx||ctx.state!=='running'||muted)return;
    const scale=[220,233.08,277.18,293.66,329.63,349.23,415.30];
    const patterns=[[0,2,1,3,2,4,3,1],[0,3,2,5,4,2,1,0],[2,4,3,6,5,3,1,2]];
    const pattern=patterns[loopIndex%patterns.length];
    const now=ctx.currentTime+0.04;
    pattern.forEach((degree,index)=>{
      const accent=index===0||index===4;
      pluck(scale[degree],now+index*0.48,accent?0.74:0.52,accent?0.105:0.075);
      if(index===0||index===4)pluck(scale[0]/2,now+index*0.48,0.9,0.045);
    });
    loopIndex+=1;
  }

  async function startMusic(){
    if(muted||!ensureAudio()){updateButton('idle');return false;}
    try{
      if(ctx.state==='suspended')await ctx.resume();
    }catch(_error){}
    if(ctx.state!=='running'){updateButton('idle');return false;}
    startDrone();
    if(!intervalId){scheduleBar();intervalId=window.setInterval(scheduleBar,3840);}
    updateButton('playing');
    return true;
  }

  function stopMusic(){
    if(intervalId){clearInterval(intervalId);intervalId=0;}
    if(droneOsc){try{droneOsc.stop();}catch(_error){}droneOsc=null;droneGain=null;}
    if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});
    updateButton('idle');
  }

  async function tryAutoStart(){
    if(muted){updateButton('idle');return;}
    await startMusic();
  }

  function unlockAutoplay(){
    if(!muted)startMusic();
  }

  document.addEventListener('pointerdown',unlockAutoplay,{once:true,capture:true});
  document.addEventListener('keydown',unlockAutoplay,{once:true,capture:true});

  toggle?.addEventListener('click',event=>{
    event.preventDefault();
    muted=!muted;
    try{localStorage.setItem(STORAGE_KEY,muted?'1':'0');}catch(_error){}
    if(muted)stopMusic();else startMusic();
  });

  window.addEventListener('pagehide',()=>{
    if(intervalId)clearInterval(intervalId);
    if(ctx&&ctx.state!=='closed')ctx.close().catch(()=>{});
  });

  updateButton('idle');
  tryAutoStart();
})();
