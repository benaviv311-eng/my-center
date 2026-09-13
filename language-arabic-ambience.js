(function(){
  const params=new URLSearchParams(location.search);
  const lang=params.get('lang')||'ar';
  if(lang!=='ar')return;

  if(!document.querySelector('link[data-arabic-courtyard]')){
    const theme=document.createElement('link');
    theme.rel='stylesheet';
    theme.href='language-arabic-courtyard.css?v=2';
    theme.dataset.arabicCourtyard='1';
    document.head.appendChild(theme);
  }

  const toggle=document.getElementById('arabic-music-toggle');
  const moment=document.getElementById('arabic-living-moment');
  if(toggle)toggle.hidden=false;
  if(moment)moment.hidden=false;

  const STORAGE_KEY='my-center-arabic-music-muted';
  const MUSIC_URL='https://upload.wikimedia.org/wikipedia/commons/b/bd/Solo_Oud_and_Ceramic_Darbuka_-_Arab_Instruments.webm';
  const MUSIC_SOURCE='https://commons.wikimedia.org/wiki/File:Solo_Oud_and_Ceramic_Darbuka_-_Arab_Instruments.webm';
  const MUSIC_LICENSE='https://creativecommons.org/licenses/by/3.0/';
  const MUSIC_CREDIT='Arab Instruments';
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

  const credit=document.createElement('div');
  credit.className='arabic-music-credit';
  credit.innerHTML=`מוזיקה: <a href="${MUSIC_SOURCE}" target="_blank" rel="noopener">${MUSIC_CREDIT}</a> · <a href="${MUSIC_LICENSE}" target="_blank" rel="noopener">CC BY 3.0</a>`;
  document.body.appendChild(credit);

  let muted=false;
  try{muted=localStorage.getItem(STORAGE_KEY)==='1';}catch(_error){}

  const music=new Audio(MUSIC_URL);
  music.loop=true;
  music.volume=0.18;
  music.preload='metadata';

  function updateButton(state){
    if(!toggle)return;
    const playing=state==='playing';
    toggle.classList.toggle('is-playing',playing);
    toggle.classList.toggle('is-muted',muted);
    toggle.setAttribute('aria-pressed',muted?'true':'false');
    toggle.textContent=muted?'🔇 מוזיקה כבויה':playing?'🎵 מוזיקה ערבית פועלת':'🎵 מוזיקה ערבית';
    toggle.title=muted?'הפעל מוזיקה ערבית':'כבה מוזיקה ערבית';
  }

  async function startMusic(){
    if(muted){updateButton('idle');return false;}
    try{
      await music.play();
      updateButton('playing');
      return true;
    }catch(_error){
      updateButton('idle');
      return false;
    }
  }

  function stopMusic(){
    music.pause();
    updateButton('idle');
  }

  function removeUnlockListeners(){
    document.removeEventListener('pointerdown',unlockAutoplay,true);
    document.removeEventListener('keydown',unlockAutoplay,true);
  }

  function unlockAutoplay(event){
    if(event?.target===toggle||toggle?.contains(event?.target))return;
    if(muted){removeUnlockListeners();return;}
    startMusic().then(started=>{if(started)removeUnlockListeners();});
  }

  document.addEventListener('pointerdown',unlockAutoplay,true);
  document.addEventListener('keydown',unlockAutoplay,true);

  music.addEventListener('playing',()=>updateButton('playing'));
  music.addEventListener('pause',()=>{if(!muted)updateButton('idle');});
  music.addEventListener('error',()=>updateButton('idle'));

  toggle?.addEventListener('click',event=>{
    event.preventDefault();
    muted=!muted;
    try{localStorage.setItem(STORAGE_KEY,muted?'1':'0');}catch(_error){}
    if(muted)stopMusic();else startMusic();
  });

  window.addEventListener('pagehide',()=>{
    removeUnlockListeners();
    music.pause();
  });

  updateButton('idle');
  if(!muted)startMusic();
})();
