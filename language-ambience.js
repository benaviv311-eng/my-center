(function(){
  const params=new URLSearchParams(location.search);
  const lang=['ar','it','ru','es'].includes(params.get('lang'))?params.get('lang'):'ar';
  const commonsFile=name=>`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}`;
  const commonsPage=name=>`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name).replace(/%20/g,'_')}`;

  const TRACKS={
    ar:[
      {id:'ar-1',title:'עוד + דרבוקה · هدوء',instruments:'Oud · Darbuka · عود',file:'Solo Oud and Ceramic Darbuka - Arab Instruments.webm',credit:'Arab Instruments',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',rate:0.96},
      {id:'ar-2',title:'עוד לבנוני · חיג׳אז',instruments:'Oud · عود · Hijaz',file:'Samaii Hijaz Kar Kurdi (c. 1926).ogg',credit:'Chahadé Saadé',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.94},
      {id:'ar-3',title:'עוד רגוע · ليل',instruments:'Oud · عود',file:'Oud.ogg',credit:'Riad Ismat',license:'GFDL',licenseUrl:'https://www.gnu.org/licenses/fdl-1.3.html',rate:0.92}
    ],
    it:[
      {id:'it-1',title:'מנדולינות · Andante',instruments:'Mandolino · archi',file:"The Modena Chamber Orchestra - Vivaldi's Concerto for 2 Mandolins in G major, RV 532 - II. Andante.ogg",credit:'Antonio Vivaldi · Modena Chamber Orchestra',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.96},
      {id:'it-2',title:'סרנדה למנדולינה',instruments:'Mandolino · serenata',file:'Valentine Abt - AngelsSerenade1905.ogg',credit:'Valentine Abt',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.94},
      {id:'it-3',title:'מנדולינה איטלקית · Vivaldi',instruments:'Mandolino · concerto',file:'Antonio Vivaldi, Mandolin Concerto in C major, RV 425.ogg',credit:'Antonio Vivaldi · Musopen',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.9}
    ],
    ru:[
      {id:'ru-1',title:'שיר עם רוסי · Стенька Разин',instruments:'Russian folk · instrumental',file:'Stenka Rasin 01.ogg',credit:'Roderich Kahn',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',rate:0.9},
      {id:'ru-2',title:'קורובייניקי · רגוע',instruments:'Violin · accordion · Russian folk',file:'Nikolaj Alekseevič Nekrasov - Korobeiniki.ogg',credit:'Pracchia-78',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.86},
      {id:'ru-3',title:'קלינקה · גרסה איטית',instruments:'Accordion · Russian folk',file:'Kalinka.ogg',credit:'Pracchia-78',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.84}
    ],
    es:[
      {id:'es-1',title:'Recuerdos de la Alhambra',instruments:'Guitarra española · tremolo',file:'Recuerdos de la Alhambra.ogg',credit:'Carlo Alberto Boni · Francisco Tárrega',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',rate:0.96},
      {id:'es-2',title:'Romance Anónimo',instruments:'Guitarra española · romance',file:'Romance Anónimo (Jeux interdits).ogg',credit:'Musopen',license:'Public domain',licenseUrl:'https://creativecommons.org/publicdomain/mark/1.0/',rate:0.94},
      {id:'es-3',title:'El Noi de la Mare',instruments:'Guitarra clásica · folk catalán',file:'El Noi de la Mare (guitar).ogg',credit:'Jujutacular',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',rate:0.94}
    ]
  };

  const LANGUAGE_NAMES={ar:'ערבית',it:'איטלקית',ru:'רוסית',es:'ספרדית'};
  const toggle=document.getElementById('language-music-toggle');
  const next=document.getElementById('language-music-next');
  const controls=document.getElementById('language-music-controls');
  const label=document.getElementById('language-music-label');
  const credit=document.getElementById('language-music-credit');
  const moment=document.getElementById('arabic-living-moment');
  const tracks=TRACKS[lang];
  if(!toggle||!next||!controls||!tracks?.length)return;

  document.body.dataset.musicLang=lang;
  controls.hidden=false;

  if(lang==='ar'){
    if(!document.querySelector('link[data-arabic-courtyard]')){
      const theme=document.createElement('link');
      theme.rel='stylesheet';
      theme.href='language-arabic-courtyard.css?v=2';
      theme.dataset.arabicCourtyard='1';
      document.head.appendChild(theme);
    }
    if(moment){
      const moments=[
        ['صباح الخير','צַבַּאח אֶלְחֵ׳יר','בוקר טוב'],
        ['أهلا وسهلا','אַהְלַן וּסַהְלַן','ברוכים הבאים'],
        ['كيفك؟','כִּיפַכּ?','מה שלומך?'],
        ['شو الأخبار؟','שוּ לְאַחְ׳בַּאר?','מה נשמע?'],
        ['يعطيك العافية','יַעְטִיכּ אֶלְעַאפְיֶה','כל הכבוד / שיהיה לך כוח'],
        ['ولا يهمك','וַלַא יְהִמַכּ','אל תדאג / אין בעיה'],
        ['على مهلك','עַלַא מַהְלַכּ','לאט, בקצב שלך']
      ];
      const day=Math.floor(Date.now()/86400000);
      const item=moments[((day%moments.length)+moments.length)%moments.length];
      moment.hidden=false;
      moment.innerHTML=`<span class="arabic-moment-kicker">رَوْقَان · רגע ערבי</span><strong class="arabic-moment-script" dir="rtl">${item[0]}</strong><span class="arabic-moment-translit">${item[1]}</span><span class="arabic-moment-hebrew">${item[2]}</span>`;
    }
  }else if(moment){
    moment.hidden=true;
  }

  const MUTED_KEY='my-center-language-music-muted';
  const SET_KEY=`my-center-language-music-set-${lang}`;
  let muted=false;
  let index=0;
  try{
    muted=localStorage.getItem(MUTED_KEY)==='1';
    const saved=Number(localStorage.getItem(SET_KEY));
    if(Number.isInteger(saved)&&saved>=0&&saved<tracks.length)index=saved;
    else index=Math.floor(Date.now()/86400000)%tracks.length;
  }catch(_error){
    index=Math.floor(Date.now()/86400000)%tracks.length;
  }

  const music=new Audio();
  music.loop=true;
  music.volume=0.5;
  music.preload='metadata';
  let loading=false;

  function current(){return tracks[index];}

  function updateMeta(){
    const track=current();
    if(label)label.textContent=`${LANGUAGE_NAMES[lang]} · סט ${index+1}/${tracks.length} · ${track.title}`;
    if(credit)credit.innerHTML=`${track.instruments} · <a href="${commonsPage(track.file)}" target="_blank" rel="noopener">${track.credit}</a> · <a href="${track.licenseUrl}" target="_blank" rel="noopener">${track.license}</a>`;
  }

  function updateButton(state){
    const playing=state==='playing';
    toggle.classList.toggle('is-playing',playing);
    toggle.classList.toggle('is-muted',muted);
    toggle.setAttribute('aria-pressed',muted?'true':'false');
    toggle.textContent=muted?'🔇 מוזיקה כבויה':playing?'🎵 מוזיקה פועלת':'🎵 מוזיקה';
    toggle.title=muted?'הפעל מוזיקת אווירה':'כבה מוזיקת אווירה';
    next.disabled=loading;
  }

  function loadTrack(){
    const track=current();
    loading=true;
    updateMeta();
    music.pause();
    music.src=commonsFile(track.file);
    music.playbackRate=track.rate||1;
    music.loop=true;
    music.volume=0.5;
    music.load();
    loading=false;
    updateButton('idle');
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

  async function nextTrack(autoplay=true){
    index=(index+1)%tracks.length;
    try{localStorage.setItem(SET_KEY,String(index));}catch(_error){}
    loadTrack();
    if(autoplay&&!muted)await startMusic();
  }

  function removeUnlockListeners(){
    document.removeEventListener('pointerdown',unlockAutoplay,true);
    document.removeEventListener('keydown',unlockAutoplay,true);
  }

  function unlockAutoplay(event){
    if(controls.contains(event?.target))return;
    if(muted){removeUnlockListeners();return;}
    startMusic().then(started=>{if(started)removeUnlockListeners();});
  }

  document.addEventListener('pointerdown',unlockAutoplay,true);
  document.addEventListener('keydown',unlockAutoplay,true);

  toggle.addEventListener('click',event=>{
    event.preventDefault();
    muted=!muted;
    try{localStorage.setItem(MUTED_KEY,muted?'1':'0');}catch(_error){}
    if(muted)stopMusic();else startMusic();
  });

  next.addEventListener('click',event=>{
    event.preventDefault();
    nextTrack(true);
  });

  music.addEventListener('playing',()=>updateButton('playing'));
  music.addEventListener('pause',()=>{if(!muted)updateButton('idle');});
  music.addEventListener('error',()=>{
    updateButton('idle');
    if(label)label.textContent=`${LANGUAGE_NAMES[lang]} · הסט לא נטען — אפשר לעבור לסט הבא`;
  });

  window.addEventListener('pagehide',()=>{
    removeUnlockListeners();
    music.pause();
  });

  loadTrack();
  if(!muted)startMusic();
})();
