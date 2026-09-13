const extraGalleryItem=(playerName,filename,license,credit,action)=>({
  playerName,
  action,
  license,
  credit,
  professional:true,
  imageUrl:`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`,
  creditUrl:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
  alt:`${playerName} — ${action} בכדורעף נשים מקצועני`
});

const EXTRA_PROFESSIONAL_WOMEN_GALLERY=[
  extraGalleryItem('Zehra Güneş','Zehra Güneş 18 VakıfBank SK 20250409 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','מאבק חסימה ליד הרשת במשחק הליגה הטורקית'),
  extraGalleryItem('Zehra Güneş','Zehra Güneş 18 VakıfBank SK WV TWVL 20260416 (1).jpg','CC BY 4.0','Zafer · Wikimedia Commons','קפיצה למאבק רשת במהלך ראלי'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK WV TWVL 20251217 (11) (cropped).jpg','CC BY 4.0','Zafer · Wikimedia Commons','התקפה בקצב גבוה במהלך ראלי'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Eczacıbaşı SK WV 20250409 (1).jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע התקפה אינטנסיבי באגף'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (2).jpg','CC BY 4.0','Zafer · Wikimedia Commons','מאבק רשת במהלך משחק הליגה הטורקית'),
  extraGalleryItem('Japan vs Algeria · London 2012',"Algeria and Japan women's national volleyball team at the 2012 Summer Olympics (7913947028).jpg",'CC BY 2.0','cdephotos · Wikimedia Commons','התקפה מול חסימה באולימפיאדת לונדון'),
  extraGalleryItem('Japan vs Algeria · London 2012',"Algeria and Japan women's national volleyball team at the 2012 Summer Olympics (7913959028).jpg",'CC BY 2.0','cdephotos · Wikimedia Commons','חסימה במהלך ראלי אולימפי'),
  extraGalleryItem('Kathryn Plummer','Kathryn Plummer 22 Eczacıbaşı SK WV TWVL 20251116.jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע התקפה במהלך ראלי בליגה הטורקית'),
  extraGalleryItem('Elif Şahin','Elif Şahin 12 Eczacıbaşı SK WV TWVL 20251217 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','ראלי אינטנסיבי בעמדת המוסרת'),
  extraGalleryItem('Cansu Özbay','Cansu Özbay 3 VakıfBank SK 20250409 (4) (cropped).jpg','CC BY 4.0','Zafer · Wikimedia Commons','ראלי אינטנסיבי בעמדת המוסרת')
];

function extendProfessionalWomenGallery(target){
  if(!Array.isArray(target))return target;
  const seen=new Set(target.map(item=>item.imageUrl));
  for(const image of EXTRA_PROFESSIONAL_WOMEN_GALLERY){
    if(seen.has(image.imageUrl))continue;
    target.push(image);
    seen.add(image.imageUrl);
  }
  return target;
}

if(typeof window!=='undefined'&&Array.isArray(window.PROFESSIONAL_WOMEN_GALLERY)){
  extendProfessionalWomenGallery(window.PROFESSIONAL_WOMEN_GALLERY);
}

if(typeof module!=='undefined'&&module.exports){
  module.exports={EXTRA_PROFESSIONAL_WOMEN_GALLERY,extendProfessionalWomenGallery};
}
