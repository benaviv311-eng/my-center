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
  extraGalleryItem('Cansu Özbay','Cansu Özbay 3 VakıfBank SK 20250409 (4) (cropped).jpg','CC BY 4.0','Zafer · Wikimedia Commons','ראלי אינטנסיבי בעמדת המוסרת'),

  // Indoor women — multiple athletes / angles
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Eczacıbaşı SK WV 20250409 (2).jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע משחק מזווית נוספת'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Eczacıbaşı SK WV 20250409 (3).jpg','CC BY 4.0','Zafer · Wikimedia Commons','תנועה בתוך ראלי'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Eczacıbaşı SK WV 20250409 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','פעולה ליד הרשת'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Eczacıbaşı SK WV 20250409 (5).jpg','CC BY 4.0','Zafer · Wikimedia Commons','תנועה במשחק'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (3).jpg','CC BY 4.0','Zafer · Wikimedia Commons','ראלי מזווית צדדית'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','תנועה התקפית'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (5).jpg','CC BY 4.0','Zafer · Wikimedia Commons','תנועה ללא כדור'),
  extraGalleryItem('Hande Baladın','Hande Baladın 7 Fenerbahçe WV TWVL 20260416 (6).jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע הגנתי'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (1).jpg','CC BY 4.0','Zafer · Wikimedia Commons','פעולה בליגת האלופות'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (2).jpg','CC BY 4.0','Zafer · Wikimedia Commons','תנועה התקפית מזווית נוספת'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (3).jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע משחק'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע משחק מזווית שונה'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (5).jpg','CC BY 4.0','Zafer · Wikimedia Commons','פעולה במהלך ראלי'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (6).jpg','CC BY 4.0','Zafer · Wikimedia Commons','תנועה בתוך המגרש'),
  extraGalleryItem('Ebrar Karakurt','Ebrar Karakurt 99 Eczacıbaşı SK CEV WCL 20251126 (7).jpg','CC BY 4.0','Zafer · Wikimedia Commons','רגע התקפי'),

  // Beach volleyball — same elite athlete across many poses
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3477 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — אליפות העולם'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3478 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — זווית משחק נוספת'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3501 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — תנועה על החול'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3506 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — ראלי'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3509 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — תנועה הגנתית'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3652 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — זווית גוף מלאה'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3688 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — תנועה במשחק'),
  extraGalleryItem('April Ross','2019-07-05 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 3716 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — זווית נוספת'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0332 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — פעולה ליד הרשת'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0381 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — תנועה על החול'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0385 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — ראלי מזווית נוספת'),
  extraGalleryItem('April Ross','AVP Professional Beach Volleyball in Austin, Texas (2017-05-19) (35430860896).jpg','CC BY 2.0','Ralph Arvesen · Wikimedia Commons','כדורעף חופים — תקשורת בין שחקניות'),
  extraGalleryItem('April Ross','AVP Professional Beach Volleyball in Austin, Texas (2017-05-21) (35358759342).jpg','CC BY 2.0','Ralph Arvesen · Wikimedia Commons','כדורעף חופים — הנחתה'),
  extraGalleryItem('April Ross','AVP Professional Beach Volleyball in Austin, Texas (2017-05-19) (35340419471).jpg','CC BY 2.0','Ralph Arvesen · Wikimedia Commons','כדורעף חופים — הגשה'),
  extraGalleryItem('April Ross','April Ross at the AVP Austin Open 2017.jpg','CC BY 2.0','Ralph Arvesen · Wikimedia Commons','כדורעף חופים — רגע משחק'),
  extraGalleryItem('April Ross','April Ross at the AVP Austin Open 2017 (2).jpg','CC BY 2.0','Ralph Arvesen · Wikimedia Commons','כדורעף חופים — זווית נוספת'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0493 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — זווית משחק נוספת'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0513 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — תנועה על החול'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0514 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — גוף מלא בתנועה'),
  extraGalleryItem('April Ross','2019-07-06 BeachVolleyball Weltmeisterschaft Hamburg 2019 StP 0520 LR by Stepro.jpg','CC license on file','Wikimedia Commons','כדורעף חופים — רגע משחק נוסף'),
  extraGalleryItem('Ágatha Bednarczuk','Paf Open 2012 Ágatha Bednarczuk.jpg','CC BY 2.0','Wikimedia Commons','כדורעף חופים — צילום משחק מזווית אחורית'),
  extraGalleryItem('Ágatha Bednarczuk','Paf Open 2012 Ágatha Bednarczuk (cropped).jpg','CC BY 2.0','Wikimedia Commons','כדורעף חופים — זווית אחורית קרובה יותר'),
  extraGalleryItem('Ágatha Bednarczuk','Agatha Bednarczuk.jpg','CC BY-SA 4.0','Wikimedia Commons','כדורעף חופים — זווית נוספת של שחקנית עילית'),
  extraGalleryItem('Kerri Walsh & Misty May-Treanor','After the Battle.jpg','Creative Commons / Wikimedia Commons','Wikimedia Commons','כדורעף חופים אולימפי — צילום גוף מלא מאחור')

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
