
const favoriteKey='my-center-favorites';
const favorites=new Set(JSON.parse(localStorage.getItem(favoriteKey)||'[]'));

function toast(msg){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1400);
}
function refreshFavs(){
  document.querySelectorAll('.fav').forEach(btn=>{
    const id=btn.dataset.id;
    if(favorites.has(id)){btn.classList.add('active');btn.textContent='♥ נשמר'}
    else{btn.classList.remove('active');btn.textContent='♡ שמור'}
  });
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('.fav'); if(!btn) return;
  const id=btn.dataset.id;
  if(favorites.has(id)){favorites.delete(id);toast('הוסר מהמועדפים')}
  else{favorites.add(id);toast('נשמר במועדפים')}
  localStorage.setItem(favoriteKey,JSON.stringify([...favorites]));refreshFavs();
});
function showFavorites(){toast(`שמורים כרגע ${favorites.size} פריטים`)}

document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.music-panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active'); const target=document.getElementById(tab.dataset.target); if(target) target.classList.add('active');
  });
});

const verses=[
 {v:'"שבע יפול צדיק וקם"',r:'משלי כ״ד, ט״ז',l:'המשפט בנוי על ניגוד בין נפילה לקימה. הכוח שלו אינו בהבטחה שלא ניפול, אלא בתנועה החוזרת מן הנפילה אל העמידה.',h:'חוסן אינו חיים בלי כישלונות; הוא היכולת לא להפוך כישלון להגדרה עצמית.',c:'מתאים במיוחד לרגעים שבהם ראיקה נכשלת, מתביישת או נפגעת, אבל ממשיכה לפעול.',q:'ראיקה: "נפלתי. זה לא אומר שסיימתי."'},
 {v:'"טוב ארך אפים מגיבור"',r:'משלי ט״ז, ל״ב',l:'הפסוק הופך את מושג הגבורה: הכוח הגדול אינו רק לכבוש אויב, אלא לשלוט בעצמך.',h:'איפוק, סבלנות ושליטה עצמית יכולים להיות קשים יותר מהפעלת כוח ישיר.',c:'מתאים לדמות שמבינה שכוח אמיתי אינו רק יכולת לפגוע, אלא לדעת מתי לא לעשות זאת.',q:'נאזו: "מי שלא שולט בעצמו, לא באמת שולט בקרב."'},
 {v:'"נר לרגלי דברך ואור לנתיבתי"',r:'תהילים קי״ט, ק״ה',l:'האור אינו מאיר את כל הדרך בבת אחת; הוא מספיק לצעד הבא.',h:'לא תמיד צריך לדעת איך תיראה כל הדרך. לפעמים די בעקרון אחד שמכוון את ההחלטה הבאה.',c:'מתאים למסע שבו הדרך אינה ברורה, אבל הדמות מחזיקה בערך שמכוון אותה.',q:'מדושי: "לא צריך לראות את סוף הדרך כדי לדעת לאן לצעוד עכשיו."'},
 {v:'"מים עמוקים עצה בלב איש"',r:'משלי כ׳, ה׳',l:'העצה מתוארת כמים עמוקים: היא קיימת, אך דורשת ירידה פנימה כדי להגיע אליה.',h:'לא כל תשובה מגיעה מיד. לפעמים צריך זמן, הקשבה ושאלה טובה.',c:'מתאים למדושי, שמעדיף להבין לפני שהוא פועל.',q:'מדושי: "התשובה לא תמיד רחוקה. לפעמים היא פשוט עמוקה."'},
 {v:'"עץ חיים היא למחזיקים בה"',r:'משלי ג׳, י״ח',l:'החכמה מוצגת כעץ: דבר חי, שורשי ומזין שאפשר להיאחז בו.',h:'ידע הופך למשמעותי כשהוא נעשה דרך חיים ולא רק מידע.',c:'מתאים למסורת הלימוד והאימון שעוברת בין הדורות בעולם ראיקה.',q:'ראי: "מה שלמדת צריך להחזיק אותך גם כשהמורה איננו."'},
 {v:'"טובים השנים מן האחד"',r:'קהלת ד׳, ט׳',l:'הפסוק מדגיש את יתרון השותפות על פני פעולה לבד.',h:'חברות ועבודת צוות אינן חולשה; הן מכפילות יכולת ומקטינות בדידות.',c:'מתאים לקשר בין ראיקה לטומו ולרגעים שבהם עזרה הדדית משנה את התוצאה.',q:'טומו: "את לא חייבת לעשות הכול לבד כדי להוכיח שאת חזקה."'},
 {v:'"לב שמח ייטיב גהה"',r:'משלי י״ז, כ״ב',l:'שמחה מוצגת ככוח שמיטיב עם האדם מבפנים.',h:'מצב רוח אינו פותר הכול, אבל תקווה, משחק וקשר אנושי יכולים לשנות את הדרך שבה אנו נושאים קושי.',c:'מתאים לרגעים הקלים שטומו מביא אל תוך עולמה הרציני של ראיקה.',q:'טומו: "גם באמצע בלגן מותר לנו לצחוק."'},
 {v:'"כי האדם יראה לעיניים וה׳ יראה ללבב"',r:'שמואל א׳ ט״ז, ז׳',l:'הפסוק יוצר ניגוד בין מראה חיצוני לבין מה שנמצא בלב.',h:'רושם ראשוני, כוח ומעמד אינם מספרים לנו מי האדם באמת.',c:'מתאים לדמויות שנשפטות לפי מראה, משפחה או מוניטין לפני שמכירים אותן.',q:'ראיקה: "תסתכל עוד פעם. הפעם לא על מה שרואים מבחוץ."'},
 {v:'"לכל זמן ועת לכל חפץ"',r:'קהלת ג׳, א׳',l:'הפסוק מתאר את החיים כרצף של זמנים משתנים, שלכל אחד מהם מקום.',h:'לא כל שלב צריך להימשך לנצח; שינוי הוא חלק טבעי מהחיים.',c:'מתאים למסעות, פרידות והתחלות חדשות בעולם ראיקה.',q:'היקארי: "גם רגע קשה הוא רגע. הוא לא כל החיים."'},
 {v:'"חנוך לנער על פי דרכו"',r:'משלי כ״ב, ו׳',l:'הדגש הוא על דרך שמתאימה ללומד, לא רק על יעד אחיד.',h:'למידה טובה מתחילה מהאדם שמולנו — היכולת, הקצב והמוטיבציה שלו.',c:'מתאים לדרך שבה מורה טוב בעולם ראיקה אינו מנסה ליצור עותק של עצמו.',q:'ראי: "אני לא מלמד אותך להיות אני. אני מלמד אותך להיות את, טוב יותר."'},
 {v:'"ברזל בברזל יחד"',r:'משלי כ״ז, י״ז',l:'הדימוי הוא של חיכוך שמחדד כלי אחד באמצעות כלי אחר.',h:'אנשים חזקים עוזרים זה לזה להשתפר דרך אתגר, משוב ונוכחות אמיתית.',c:'מתאים לאימונים שבהם יריב או חבר מאלץ את ראיקה לגדול.',q:'ראיקה: "אם זה לא מאתגר אותי, זה גם לא מחדד אותי."'},
 {v:'"מענה רך ישיב חמה"',r:'משלי ט״ו, א׳',l:'הפסוק מציג רכות לא כחולשה אלא כדרך לשנות את כיוון העימות.',h:'תגובה רגועה יכולה לעצור הסלמה במקום להזין אותה.',c:'מתאים לדמות שבוחרת במילים מדויקות במקום בכוח מיידי.',q:'נאזו: "לא כל מכה עוצרים במכה."'}
];

function renderDailyVerses(){
  const wrap=document.getElementById('daily-verses'); if(!wrap) return;
  const now=new Date(); const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
  const start=(day*3)%verses.length; const picked=[0,1,2].map(i=>verses[(start+i)%verses.length]);
  wrap.innerHTML=picked.map((x,i)=>`
   <article class="card">
    <div class="label">פסוק ${i+1}</div><div class="verse">${x.v}</div><div class="meta">${x.r}</div>
    <details><summary>פירוש ספרותי</summary><p>${x.l}</p></details>
    <details><summary>מבט אנושי</summary><p>${x.h}</p></details>
    <details><summary>החיבור לעולם ראיקה</summary><p>${x.c}</p></details>
    <details><summary>משפט שהדמות הייתה אומרת</summary><p>${x.q}</p></details>
    <div class="card-actions"><button class="btn small fav" data-id="daily-${day}-${i}">♡ שמור</button></div>
   </article>`).join('');
  refreshFavs();
}
function setToday(){
  const el=document.getElementById('today-date'); if(!el) return;
  el.textContent=new Intl.DateTimeFormat('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
}
function surpriseMe(){
  const items=[
   'רעיון: בנה אימון שבו השחקנים צריכים לבחור, לא רק לבצע.',
   'ערבית: شو بدك؟ — שו בַּדַּכּ? — מה אתה רוצה?',
   'מוזיקה: נגן פראזה של 3 צלילים בלבד וחזור עליה עם שינוי קצב.',
   'ראיקה: פתח דמות אקראית — אבל הצג רק מידע קאנוני.',
   'ספרייה: בחר רעיון אחד ושאל: איפה אני כבר משתמש בו בלי לשים לב?',
   'אימון: מעט חזרות איכותיות עם מנוחה מלאה עדיפות על הרבה חזרות עייפות כשמטרתך כוח מתפרץ.'
  ];
  const out=document.getElementById('surpriseResult'); if(out) out.textContent=items[Math.floor(Math.random()*items.length)];
}
function filterCards(query){
  const q=(query||'').trim().toLowerCase();
  document.querySelectorAll('[data-search]').forEach(card=>{
    card.classList.toggle('hidden',q && !card.textContent.toLowerCase().includes(q));
  });
}

setToday();renderDailyVerses();refreshFavs();
