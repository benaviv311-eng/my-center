const PROFESSIONAL_FEMALE_VISUALS={
  women:{
    imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Paola_Egonu_18_U.S._ProVictoria_Pallavolo_Monza_WV_CEV_WCL_20260107_%2821%29.jpg',
    creditUrl:'https://commons.wikimedia.org/wiki/File:Paola_Egonu_18_U.S._ProVictoria_Pallavolo_Monza_WV_CEV_WCL_20260107_(21).jpg',
    credit:'Paola Egonu · Zafer · CC BY 4.0 · Wikimedia Commons',
    alt:'Paola Egonu, שחקנית כדורעף מקצועית, במהלך פעילות תחרותית',
    professional:true,
    playerName:'Paola Egonu'
  },
  'youth-girls':{
    imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tijana_Bo%C5%A1kovi%C4%87_in_attack_%28team_Serbia%2C_2017%29.jpg',
    creditUrl:'https://commons.wikimedia.org/wiki/File:Tijana_Bo%C5%A1kovi%C4%87_in_attack_(team_Serbia,_2017).jpg',
    credit:'Tijana Bošković · CC BY-SA 2.0 · Wikimedia Commons',
    alt:'Tijana Bošković, שחקנית כדורעף מקצועית, בהתקפה במדי נבחרת סרביה',
    professional:true,
    playerName:'Tijana Bošković'
  }
};

function applyProfessionalFemaleVisuals(target){
  if(!target)return target;
  Object.assign(target,PROFESSIONAL_FEMALE_VISUALS);
  return target;
}

function loadVolleyballMagazineStyles(){
  if(typeof document==='undefined'||document.querySelector('link[data-volleyball-magazine]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='volleyball-magazine.css';
  link.dataset.volleyballMagazine='true';
  document.head.appendChild(link);
}

if(typeof window!=='undefined'){
  if(window.VOLLEYBALL_VISUALS)applyProfessionalFemaleVisuals(window.VOLLEYBALL_VISUALS);
  loadVolleyballMagazineStyles();
}

if(typeof module!=='undefined'&&module.exports){
  module.exports={PROFESSIONAL_FEMALE_VISUALS,applyProfessionalFemaleVisuals,loadVolleyballMagazineStyles};
}
