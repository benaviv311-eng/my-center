const VOLLEYBALL_VISUALS={
  elementary:{imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hande%20Balad%C4%B1n%207%20Eczac%C4%B1ba%C5%9F%C4%B1%20SK%20WV%2020250409%20(3).jpg',creditUrl:'https://commons.wikimedia.org/wiki/Category:Hande_Baladin',credit:'Wikimedia Commons',alt:'שחקנית עילית בכדורעף אולמות'},
  'youth-boys':{imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/20240701%20Wilfredo%20Leon.jpg',creditUrl:'https://commons.wikimedia.org/wiki/Category:Wilfredo_Le%C3%B3n',credit:'Wikimedia Commons',alt:'שחקן עילית בכדורעף גברים'},
  'youth-girls':{imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Paf%20Open%202012%20%C3%81gatha%20Bednarczuk.jpg',creditUrl:'https://commons.wikimedia.org/wiki/File:Paf_Open_2012_%C3%81gatha_Bednarczuk.jpg',credit:'Wikimedia Commons',alt:'שחקנית עילית בכדורעף חופים מזווית אחורית'},
  women:{imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/2019-07-05%20BeachVolleyball%20Weltmeisterschaft%20Hamburg%202019%20StP%203506%20LR%20by%20Stepro.jpg',creditUrl:'https://commons.wikimedia.org/wiki/Category:April_Ross',credit:'Wikimedia Commons',alt:'שחקנית עילית בכדורעף חופים במהלך משחק'},
  men:{imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/At%20Katowice%202024%20266.jpg',creditUrl:'https://commons.wikimedia.org/wiki/Category:Wilfredo_Le%C3%B3n',credit:'Wikimedia Commons',alt:'שחקן עילית בכדורעף גברים'}
};

const VOLLEYBALL_TERM_PROFILES={
  'side-out':{
    definition:'Side-out הוא שלב המשחק שבו הקבוצה מקבלת את ההגשה ומנסה להפוך את הקבלה להתקפה שמסתיימת בנקודה. זהו רצף מערכתי: איכות הקבלה, מיקום המוסר, זמינות התוקפים, הקצב והבחירה מול החסימה מתחברים להחלטה אחת.',
    cue:'בתרגול side-out כדאי להתחיל מכל הגשה אמיתית ולתת ניקוד על איכות הרצף כולו, לא רק על הכדור האחרון.',
    mistake:'טעות שכיחה היא למדוד side-out רק לפי איכות הקבלה או רק לפי אחוז ההתקפה, במקום לבדוק את החיבור בין כל השלבים.'
  },
  seam:{
    definition:'Seam הוא האזור שבין שני שחקני קבלה או הגנה, שבו האחריות על הכדור עלולה להיות לא ברורה. הוא אינו רק “רווח” גיאומטרי; הוא נקודת החלטה שדורשת הסכמה מראש, תקשורת וקריאת מסלול ההגשה או ההתקפה.',
    cue:'אמן seam עם הגשות שמכוונות במכוון בין שני מקבלים ודרוש קריאת אחריות מוקדמת לפני המגע.',
    mistake:'טעות שכיחה היא לנסות לפתור כל seam בצעקה מאוחרת, במקום להגדיר כללי אחריות ברורים לפי מערך, כיוון הגשה ואיכות המקבלים.'
  },
  wash:{
    definition:'Wash הוא מבנה משחקון שבו נקודה או “ניצחון” מתקבלים רק לאחר רצף מוגדר של הצלחות, למשל שתי נקודות רצופות או שילוב של side-out ומעבר. המטרה היא ליצור לחץ, חזרתיות ומשמעות טקטית קרובה יותר למשחק.',
    cue:'קבע תנאי wash שמשרת מטרה מקצועית אחת ברורה, למשל מעבר איכותי, ולא כלל מסובך שקשה לשחקנים לזכור.',
    mistake:'טעות שכיחה היא להפוך wash למנגנון ניקוד מסובך שמושך תשומת לב מהבעיה המקצועית שאותה רוצים לאמן.'
  },
  'free ball':{
    definition:'Free ball הוא כדור שהיריבה מחזירה ללא התקפה מאיימת, ולכן הקבוצה המקבלת מקבלת הזדמנות לבנות מבנה התקפי כמעט מלא. האיכות נמדדת במהירות שבה הקבוצה עוברת מסידור הגנתי לארגון קבלה, מסירה והתקפה.',
    cue:'תרגל free ball עם דרישה לשלושה תוקפים זמינים ועם מיקום ברור של המוסר לפני הכדור השני.',
    mistake:'טעות שכיחה היא להתייחס לכדור קל כאל הפסקה בקצב; דווקא כאן נדרשים סדר, תקשורת ומהירות ארגון.'
  },
  קבלה:{
    definition:'קבלה היא הפעולה הראשונה לאחר הגשת היריבה, אבל המשמעות שלה רחבה יותר ממגע טכני. קבלה טובה יוצרת תנאים שבהם למוסר יש זמן, מרחב ואפשרויות, ולכן היא נקודת פתיחה של כל מערכת ה-side-out.',
    cue:'אמן קבלה מול מגוון הגשות, מסלולים והחלטות, ולא רק מול כדורים צפויים מאותו מקום.',
    mistake:'טעות שכיחה היא לרדוף אחרי “נקודה מושלמת” במקום להגדיר אזור קבלה שמאפשר לקבוצה לשמור על אפשרויות התקפה.'
  },
  טכניקה:{
    definition:'טכניקה בכדורעף היא הדרך שבה השחקן מארגן את הגוף ואת המגע כדי לפתור משימה. היא אינה תבנית אסתטית אחת, אלא אוסף פתרונות יציבים וגמישים שמתאימים למהירות הכדור, למיקום, ללחץ ולמטרה הטקטית.',
    cue:'בדוק אם הטכניקה מייצרת תוצאה שימושית בתנאים משתנים לפני שאתה מתקן פרט גוף קטן.',
    mistake:'טעות שכיחה היא ללמד צורה מושלמת ללא מידע, יריב או יעד, ואז לצפות שהצורה תעבור אוטומטית למשחק.'
  },
  חסימה:{
    definition:'חסימה היא מערכת הקריאה והפעולה של שחקני הרשת מול ההתקפה. היא משלבת זיהוי מסירה, קצב התוקף, תנועה לאורך הרשת, תזמון ניתור, מיקום ידיים ותיאום עם שחקני ההגנה מאחור.',
    cue:'אמן חסימה מתוך קריאה של מוסר ותוקף, ולא רק בקפיצות סטטיות מול רשת.',
    mistake:'טעות שכיחה היא למדוד חסימה רק לפי נקודות ישירות; חסימה טובה יכולה לכוון התקפה לאזור שההגנה מוכנה אליו.'
  },
  הגנה:{
    definition:'הגנה בכדורעף היא מערכת שמטרתה להפוך התקפת יריב לכדור שניתן לבנות ממנו התקפה חדשה. מיקום המגנים נובע מהחסימה, מהתוקף, מהזוויות האפשריות ומהעדפות היריבה, ולא ממיקום קבוע על המגרש בלבד.',
    cue:'חבר בכל תרגיל בין מיקום החסימה למיקום ההגנה ובקש מהשחקנים להסביר איזה אזור כל אחד מכסה.',
    mistake:'טעות שכיחה היא לתקן מגן בודד בלי לבדוק מה החסימה סגרה ומה שאר המערכת אפשרה לתוקף.'
  },
  הגשה:{
    definition:'הגשה היא הפעולה היחידה שמתחילה בשליטה מלאה של השחקן, ולכן היא גם כלי טכני וגם כלי טקטי. המטרה אינה בהכרח המהירות הגבוהה ביותר, אלא יצירת לחץ שמקטין את אפשרויות ההתקפה של היריבה.',
    cue:'תן לכל הגשה יעד טקטי: שחקן, seam, עומק, קצר או הוצאת תוקף ממסלול ההתקפה.',
    mistake:'טעות שכיחה היא למדוד איכות הגשה רק לפי אייסים או עוצמה ולהתעלם מהשפעתה על איכות ה-side-out של היריבה.'
  },
  מעבר:{
    definition:'מעבר, או transition, הוא הרגע שבו הקבוצה משנה תפקיד מהגנה להתקפה או מהתקפה להגנה. בכדורעף איכותי המעבר מתחיל עוד לפני שהכדור הסתיים: שחקנים קוראים את התוצאה הצפויה ומתחילים להתארגן לפעולה הבאה.',
    cue:'תרגל רצפים שבהם ההגנה חייבת להפוך מיד להתקפה עם תפקידים ברורים לכל עמדה.',
    mistake:'טעות שכיחה היא לעצור אחרי פעולת הגנה טובה ולהתייחס אליה כהצלחה בפני עצמה, במקום לבדוק אם נוצרה ממנה התקפה.'
  },
  רוטציות:{
    definition:'רוטציות הן ששת המצבים המחזוריים של סידור הקבוצה לפי סדר ההגשה. כל רוטציה משנה את מיקום המוסר, המקבלים והתוקפים, ולכן גם את חוזקות הקבוצה, חולשותיה, מערך הקבלה והאפשרויות הטקטיות.',
    cue:'נתח כל רוטציה לפי מי מקבל, מי זמין להתקפה, מי חוסם ומהו פתרון החירום כאשר הקבלה יוצאת מהמערכת.',
    mistake:'טעות שכיחה היא ללמוד רוטציה כמפת עמידה בלבד ולא כמערכת החלטות שמשתנה לאחר ההגשה והמגע הראשון.'
  },
  מוסר:{
    definition:'המוסר הוא השחקן שמארגן את ההתקפה ומחבר בין איכות המגע הראשון לבין הבחירה הטקטית בכדור השני. עבודתו כוללת תנועה, דיוק, קריאת חסימה, ניהול קצב והבנת מצב המשחק, ולא רק טכניקת מסירה עילית.',
    cue:'אמן את המוסר עם קבלה משתנה ועם מידע אמיתי על חסימה ותוקפים, כדי שהבחירה תהיה חלק מהתרגיל.',
    mistake:'טעות שכיחה היא להפריד לחלוטין בין דיוק המסירה לבין איכות ההחלטה ולשבח כדור “יפה” גם כשהבחירה הטקטית חלשה.'
  },
  נתונים:{
    definition:'נתונים בכדורעף הם דרך לתאר דפוסים שחוזרים במשחק: יעילות קבלה, side-out, break point, התקפה, חסימה, חלוקת מוסר ורוטציות. מספר בודד כמעט תמיד דורש הקשר כדי להפוך למידע שימושי.',
    cue:'חבר כל מדד לשאלה מקצועית מוגדרת מראש, למשל באיזו רוטציה הקבוצה מתקשה לצאת מקבלה ומדוע.',
    mistake:'טעות שכיחה היא לאסוף הרבה מספרים בלי להחליט איזו החלטת אימון או משחק הם אמורים לשנות.'
  },
  אמצע:{
    definition:'שחקן האמצע פועל בקצב מהיר ובמרחב קטן, ולכן התפקיד תלוי במיוחד בתזמון, קריאת קבלה, קשר עם המוסר ומעבר מהיר בין חסימה להתקפה. עצם האיום של האמצע יכול להשפיע על חסימת היריבה גם בלי לקבל את הכדור.',
    cue:'אמן את האמצע ביחד עם המוסר מתוך קבלה אמיתית, כך שהיציאה וההאצה יגיבו למידע ולא לספירה קבועה.',
    mistake:'טעות שכיחה היא לתקן רק את רגע הקפיצה במקום לבדוק את נקודת ההתחלה, מסלול הגישה וזמן היציאה ביחס לקבלה.'
  },
  תזמון:{
    definition:'תזמון הוא היחס בזמן בין פעולות שונות: קבלה, תנועת מוסר, גישת תוקף, ניתור חסימה ומגע בכדור. בכדורעף מהיר, שינוי קטן בזמן יכול להפוך פתרון נכון לכדור שאינו ניתן לביצוע.',
    cue:'השתמש בנקודות ייחוס ברורות, כמו רגע המגע בקבלה או יציאת הכדור מידי המוסר, במקום בהוראה כללית “מוקדם יותר”.',
    mistake:'טעות שכיחה היא לתקן תזמון כאילו הוא בעיית מהירות אישית, כאשר לעיתים המקור הוא מרחק, מסלול או מידע שהשחקן קורא מאוחר.'
  },
  'למידה מוטורית':{
    definition:'למידה מוטורית עוסקת באופן שבו שחקנים רוכשים, מייצבים ומתאימים מיומנויות לאורך זמן. בכדורעף היא חשובה במיוחד משום שכל פעולה מתבצעת מול כדור, יריב, זמן ומרחב שמשתנים כמעט בכל חזרה.',
    cue:'שלב שונות, מטרות ברורות ופידבק שאינו ניתן אחרי כל חזרה כדי לעודד את השחקן לפתור את המשימה בעצמו.',
    mistake:'טעות שכיחה היא לבלבל בין ביצוע טוב באימון סגור לבין למידה שמחזיקה מעמד ומועברת למשחק.'
  },
  'מיני כדורעף':{
    definition:'מיני כדורעף הוא התאמה של המשחק לילדים באמצעות מגרש קטן יותר, פחות שחקנים, רשת מותאמת וחוקים שמגדילים מגעים והצלחות. המטרה היא ללמד את ההיגיון של המשחק דרך משחק, ולא לחכות עד שהילד מסוגל לבצע את גרסת הבוגרים.',
    cue:'התקדם מ-1×1 ו-2×2 אל 3×3 תוך התאמת תפיסה, זריקה ומסירה ליכולת הקבוצה.',
    mistake:'טעות שכיחה היא להקטין רק את המגרש אבל להשאיר דרישות טכניות וחוקי משחק שמייצרים מעט מאוד מגעים והצלחות.'
  },
  גדילה:{
    definition:'גדילה בתקופת הנוער משנה זמנית פרופורציות גוף, כוח, טווחים ותחושת תנועה. שחקן יכול להרגיש פחות מתואם בתקופה מסוימת גם כאשר המוטיבציה והמאמץ שלו לא השתנו, ולכן נדרשת התאמה של עומס וציפיות.',
    cue:'עקוב אחר איכות תנועה ועומס לאורך זמן והתאם את מורכבות המשימה במקום לפרש כל ירידה זמנית כחוסר ריכוז.',
    mistake:'טעות שכיחה היא להשוות את השחקן רק לביצועים שלו מלפני קפיצת גדילה ולהעמיס תיקונים כאשר הגוף עצמו נמצא בתהליך הסתגלות.'
  },
  נחיתה:{
    definition:'נחיתה היא שלב בלימת הכוח לאחר קפיצה. בכדורעף היא חוזרת פעמים רבות בהתקפה ובחסימה, ולכן איכות הנחיתה משפיעה על היכולת לשמור על שליטה, לעבור לפעולה הבאה ולנהל עומס לאורך אימון ועונה.',
    cue:'התחל מנחיתות נשלטות ועבור בהדרגה לנחיתות אחרי גישה, חסימה, שינוי כיוון והפרעה משחקית.',
    mistake:'טעות שכיחה היא להוסיף עוד קפיצות כדי “לחזק” בלי לבדוק אם איכות הבלימה נשמרת כאשר העייפות עולה.'
  },
  קפיצה:{
    definition:'קפיצה בכדורעף היא תוצאה של כוח, מהירות, תזמון וטכניקת גישה. בהתקפה ובחסימה היא אינה מטרה עצמאית; גובה הניתור צריך להתחבר למיקום נכון ביחס לכדור, לרשת ולזמן הפעולה.',
    cue:'אמן קפיצות איכותיות עם מנוחה מספקת, ואז חבר אותן בהדרגה לגישה, כדור והחלטה.',
    mistake:'טעות שכיחה היא לצבור נפח קפיצות גדול כאשר הגובה והמהירות כבר יורדים, וכך להפוך אימון כוח מתפרץ לאימון עייפות.'
  },
  כוח:{
    definition:'כוח בכדורעף הוא בסיס ליצירת תאוצה, ניתור, בלימה ויציבות. הוא אינו עומד בפני עצמו אלא תומך ביכולת לבצע פעולות מהירות שוב ושוב תוך שמירה על שליטה במפרקים ובתנועה.',
    cue:'חבר פיתוח כוח לתנועות ולדרישות של המשחק תוך שמירה על התקדמות הדרגתית ועומס שמתאים לגיל ולרמה.',
    mistake:'טעות שכיחה היא לחפש רק תרגילים “דומים לכדורעף” במקום לבנות קודם בסיס כוח איכותי ואז להעביר אותו לביצוע מהיר וספציפי.'
  }
};

const POPULATION_LABELS={all:'כל האוכלוסיות',elementary:'יסודי','youth-boys':'נוער בנים','youth-girls':'נוער בנות',women:'נשים',men:'גברים'};
const TOPIC_LABELS={technique:'טכניקה',tactics:'טקטיקה',positions:'עמדות ותפקידים',systems:'מערכות משחק',rotations:'רוטציות','decision-making':'קבלת החלטות','serve-receive':'הגשה וקבלה',attack:'התקפה','block-defense':'חסימה והגנה',transition:'מעבר',drills:'תרגילים','motor-learning':'למידה מוטורית','practice-design':'בניית אימון','small-sided':'משחקונים','video-analysis':'ניתוח וידאו',statistics:'סטטיסטיקה ומדדים',physiology:'פיזיולוגיה','jump-power':'קפיצה וכוח מתפרץ','speed-movement':'מהירות ותנועה','landing-load':'נחיתה ועומסים','shoulder-injury':'כתף ומניעת פציעות','player-development':'פיתוח שחקן',communication:'תקשורת במשחק',rules:'חוקי המשחק',history:'היסטוריה והתפתחות',world:'כדורעף בעולם','coaching-methods':'מאמנים ושיטות',myths:'מיתוסים וטעויות נפוצות'};

function filterVolleyballFeed(cards,{topic='all',population='all',level='all',query=''}={}){
  const q=String(query||'').trim().toLowerCase();
  const matches=[];
  for(const card of cards){
    const topicOk=topic==='all'||card.topic===topic||card.topic==='all';
    const levelOk=level==='all'||card.levels.includes('all')||card.levels.includes(level);
    const hay=[card.title,card.text,card.detail,...(card.tags||[])].join(' ').toLowerCase();
    const queryOk=!q||hay.includes(q);
    if(!topicOk||!levelOk||!queryOk)continue;

    if(population==='all'){
      matches.push(card);
      continue;
    }

    if(card.populations.includes(population)){
      matches.push(card.populations.includes('all')?{...card,populations:[population],contextualPopulation:population}:card);
      continue;
    }

    if(card.populations.includes('all')){
      matches.push({...card,populations:[population],contextualPopulation:population});
    }
  }
  return matches;
}

function hashSeed(seed){
  let h=2166136261;
  for(const ch of String(seed)){
    h^=ch.charCodeAt(0);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function seededShuffle(items,seed){
  const arr=items.slice();
  let state=hashSeed(seed)||1;
  const random=()=>{
    state^=state<<13;
    state^=state>>>17;
    state^=state<<5;
    return (state>>>0)/4294967296;
  };
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function buildInfiniteBatch(cards,filters={},seed='volleyball',page=0,size=8){
  const population=filters.population||'all';
  const topic=filters.topic||'all';
  const query=filters.query||'';
  const pool=filterVolleyballFeed(cards,{population,topic,query});
  if(!pool.length)return [];
  const safeSize=Math.max(1,Math.min(Number(size)||8,pool.length));
  const offset=page*safeSize;
  const cycle=Math.floor(offset/pool.length);
  const start=offset%pool.length;
  const shuffled=seededShuffle(pool,`${seed}|${population}|${topic}|${query}|${cycle}`);
  const batch=[];
  for(let i=0;i<safeSize;i++) batch.push(shuffled[(start+i)%pool.length]);
  return batch;
}

function pickDiscovery(cards,kind='all',seed=Date.now()){
  const pool=kind==='all'?cards:cards.filter(card=>card.kind===kind);
  if(!pool.length)return null;
  return pool[hashSeed(seed)%pool.length];
}

function getPopulationTopics(topics){
  return topics.slice();
}

function labelFor(items,id){
  return (items.find(x=>x.id===id)||{}).label||id;
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({"&":'&amp;',"<":'&lt;',">":'&gt;',"\"":'&quot;',"'":'&#39;'}[char]));
}

function termMatchesCard(card,term){
  const needle=String(term||'').trim().toLowerCase();
  if(!needle)return false;
  if((card.tags||[]).some(tag=>String(tag).toLowerCase()===needle))return true;
  return [card.title,card.text,card.detail].some(value=>String(value||'').toLowerCase().includes(needle));
}

function buildTermExpansion(term,cards=[],{population='all'}={}){
  const cleanTerm=String(term||'').trim();
  const profile=VOLLEYBALL_TERM_PROFILES[cleanTerm]||{};
  const matching=(cards||[]).filter(card=>termMatchesCard(card,cleanTerm));
  const topicNames=[...new Set(matching.map(card=>TOPIC_LABELS[card.topic]||card.topic).filter(Boolean))];
  const contextLabel=population==='all'?'כל עולם הכדורעף':(POPULATION_LABELS[population]||population);
  const examples=matching.slice(0,3).map(card=>`${card.title}: ${card.text} ${card.detail||''}`.trim());
  const exampleText=examples.length?examples.join(' '):`גם כאשר אין כרגע פוסט ייעודי נוסף על ${cleanTerm}, כדאי לקרוא את המונח מתוך רצף המשחק שבו הוא מופיע ולשאול מה קרה לפני הפעולה, מה היא ניסתה להשיג ומה השתנה מיד אחריה.`;
  const topicText=topicNames.length?topicNames.join(', '):'טכניקה, טקטיקה, קבלת החלטות ובניית אימון';
  const definition=profile.definition||`${cleanTerm} הוא מונח עבודה בתוך עולם הכדורעף, והמשמעות המעשית שלו נקבעת לפי הבעיה שהקבוצה מנסה לפתור. במקום לזכור אותו כהגדרה מבודדת, נכון לחבר אותו לרצף של מידע, תנועה, מגע והחלטה: מה השחקן רואה, אילו אפשרויות עומדות בפניו, איזו פעולה הוא בוחר ומה התוצאה שהפעולה יוצרת עבור הכדור הבא.`;
  const cue=profile.cue||`באימון של ${cleanTerm} עדיף לבנות משימה שבה השחקן צריך לזהות מידע ולבחור פתרון, ולא רק לחזור על תנועה ללא הקשר. אפשר להתחיל בתנאי פשוט וברור, ולאחר שהשחקנים מבינים את המטרה להוסיף בהדרגה הגשה, יריב, שינוי מסלול, ניקוד או לחץ זמן.`;
  const mistake=profile.mistake||`טעות שכיחה סביב ${cleanTerm} היא להפוך אותו לכלל קשיח אחד שמתאים לכל מצב. בכדורעף המידע משתנה במהירות, ולכן חשוב להבחין בין העיקרון שאותו רוצים לשמור לבין הדרך הספציפית שבה השחקן מממש אותו בכל כדור.`;
  const populationText=population==='elementary'
    ?`ביסודי יש לפשט את ${cleanTerm} למשימה שהילד מסוגל להבין דרך משחק: פחות שחקנים, מרחב קטן, כדור מתאים ומטרה ברורה. ההצלחה הראשונית אינה חייבת להיראות כמו כדורעף בוגרים; היא צריכה לבנות תפיסה של המשחק, הרבה מגעים וביטחון לנוע ולהחליט.`
    :population==='youth-boys'||population==='youth-girls'
      ?`בנוער כדאי ללמד את ${cleanTerm} יחד עם השינויים בגוף, בקצב ובמורכבות המשחק. ככל שהשחקנים מתקדמים, מוסיפים אחריות טקטית, קריאת יריב ולחץ תחרותי, אבל עדיין שומרים על עומס הדרגתי ועל אפשרות לחזור לגרסה פשוטה כאשר האיכות יורדת.`
      :population==='women'||population==='men'
        ?`ברמת בוגרים, ${cleanTerm} צריך להתחבר ישירות למודל המשחק של הקבוצה. ההחלטה מה נחשב ביצוע טוב תלויה ברוטציה, בתפקידי השחקנים, בסגנון היריבה ובמדדים שהצוות בוחר לעקוב אחריהם, ולכן האימון צריך לשקף את ההקשר התחרותי ולא רק את הפעולה הטכנית.`
        :`כאשר מסתכלים על ${cleanTerm} בכלל האוכלוסיות, העיקרון נשאר דומה אבל הדרישה משתנה. ביסודי מחפשים הבנה ומשחקיות, בנוער בונים יציבות והתאמה לקצב גדל, ובנשים ובגברים בוגרים מחברים את המונח למודל משחק, ליריבה, לרוטציות ולמדדים תחרותיים.`;

  const sections=[
    {title:'מה זה?',text:`${definition} לכן כשפוגשים את המונח בפוסט או בניתוח וידאו, כדאי לזהות לא רק “מה עשו”, אלא מה הייתה מטרת הפעולה ומה היו האפשרויות האחרות באותו רגע. כך המונח הופך משפה מקצועית יבשה לכלי שמסביר את המשחק.`},
    {title:'למה זה חשוב?',text:`${cleanTerm} חשוב מפני שכדורעף בנוי מרצפים קצרים שבהם כל מגע משנה את האפשרויות של המגע הבא. הוא מתחבר במיוחד לתחומים כמו ${topicText}. כאשר צוות ושחקנים משתמשים באותה הגדרה, קל יותר לנתח מהלך, לזהות דפוס שחוזר, להחליט מה לתקן ולבנות אימון שמכוון לבעיה אמיתית במקום לאוסף תרגילים מנותקים.`},
    {title:'איך זה נראה במשחק?',text:`במשחק צריך לחפש את ${cleanTerm} בתוך ההקשר ולא רק ברגע אחד. במאגר הנוכחי הוא מופיע דרך הדוגמאות הבאות: ${exampleText} בזמן צפייה במהלך אפשר לעצור רגע לפני הפעולה, לזהות את המידע שהיה זמין לשחקן, ואז לבדוק אם הפתרון שבחר יצר יתרון, שמר על אפשרויות או לפחות מנע מצב גרוע יותר.`},
    {title:'איך חושבים ומחליטים?',text:`דרך טובה להבין ${cleanTerm} היא לשאול שלוש שאלות בכל פעם: מה אני רואה לפני הפעולה, מה אני מנסה להשיג, ומה יהיה הכדור הבא אם אצליח. השאלות האלה מונעות תיקון אוטומטי לפי צורה בלבד. הן גם מאפשרות להשוות בין שני פתרונות ששניהם יכולים להיות “נכונים”, אבל אחד מהם מתאים יותר לרוטציה, למיקום היריב, לאיכות הכדור או לתפקיד של השחקן בתוך המערכת.`},
    {title:'איך מאמנים את זה?',text:`${cue} לאחר מכן חשוב לבדוק העברה למשחק: האם השחקן עדיין מזהה את אותו עיקרון כשהכדור מגיע ממקום אחר, כשהיריב משנה התנהגות או כשהתוצאה צמודה. פידבק טוב צריך לכוון למטרה ולמידע שהשחקן השתמש בו, ולא להציף אותו ברשימת הוראות גוף בכל חזרה. אפשר לצלם רצפים קצרים ולהשוות בין החלטות שונות.`},
    {title:'טעויות נפוצות',text:`${mistake} טעות נוספת היא לתקן את התוצאה בלי לבדוק את הסיבה: כדור יכול להסתיים רע למרות החלטה טובה, ולהפך. לכן כדאי להפריד בין איכות הקריאה, איכות ההחלטה ואיכות הביצוע. כשעושים את ההפרדה הזאת, אפשר לדעת אם צריך עוד ידע טקטי, שינוי בתרגיל, עבודה טכנית, יותר זמן תחת לחץ או פשוט עוד ניסיון במצבים דומים.`},
    {title:`התאמה ל${contextLabel}`,text:`${populationText} בכל רמה כדאי לשמור על אותו עיקרון: התוכן צריך להיות מספיק מאתגר כדי לדרוש פתרון, אבל לא כל כך מורכב עד שהשחקן מאבד את מטרת המשימה. ההתקדמות הנכונה היא מהבנה פשוטה לביצוע יציב, ומשם להתאמה למצבים משתנים וללחץ תחרותי.`}
  ];

  const related=[...new Set(matching.flatMap(card=>card.tags||[]))].filter(item=>item!==cleanTerm).slice(0,8);
  return {term:cleanTerm,sections,related,contextLabel};
}

function renderTermExpansion(entry){
  const sections=(entry.sections||[]).map(section=>`<section class="vb-term-section"><h5>${escapeHtml(section.title)}</h5><p>${escapeHtml(section.text)}</p></section>`).join('');
  const related=(entry.related||[]).length?`<div class="vb-term-related"><b>מונחים קשורים</b><div>${entry.related.map(term=>`<button type="button" class="vb-term-chip vb-related-term" data-term="${escapeHtml(term)}" aria-expanded="false">${escapeHtml(term)}</button>`).join('')}</div></div>`:'';
  return `<section class="vb-term-expansion" role="region" aria-label="הרחבה על ${escapeHtml(entry.term)}"><header><div><small>מילון כדורעף · הסבר מורחב</small><h4>${escapeHtml(entry.term)}</h4></div><button type="button" class="vb-term-close" aria-label="סגור הסבר">×</button></header><div class="vb-term-body">${sections}</div>${related}</section>`;
}

function renderCard(card){
  const kindLabels={concept:'עיקרון',drill:'תרגיל',scenario:'סיטואציה',research:'מחקר ומדע',myth:'מיתוס',question:'שאלה','problem-solution':'בעיה → פתרון'};
  const kindIcons={concept:'🧠',drill:'🏐',scenario:'🎬',research:'🔬',myth:'🧯',question:'❓','problem-solution':'🛠️'};
  const populations=typeof window!=='undefined'?window.VOLLEYBALL_POPULATIONS:[];
  const pops=card.populations.includes('all')?'כל האוכלוסיות':card.populations.map(id=>labelFor(populations,id)).join(' · ');
  const tags=(card.tags||[]).map(tag=>`<button type="button" class="vb-term-chip" data-term="${escapeHtml(tag)}" aria-expanded="false" title="פתח הסבר מלא על ${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('');
  const detail=card.detail?`<div class="vb-card-detail"><span>💡 נקודת מפתח</span><p>${escapeHtml(card.detail)}</p></div>`:'';
  return `<article class="vb-feed-card vb-kind-${escapeHtml(card.kind)}" data-card-id="${escapeHtml(card.id)}">
    <div class="vb-card-top">
      <div class="vb-kind-wrap"><span class="vb-kind-icon" aria-hidden="true">${kindIcons[card.kind]||'🏐'}</span><span class="vb-kind">${escapeHtml(kindLabels[card.kind]||card.kind)}</span></div>
      <span class="vb-pop">${escapeHtml(pops)}</span>
    </div>
    <h3>${escapeHtml(card.title)}</h3>
    <p class="vb-card-summary">${escapeHtml(card.text)}</p>
    ${detail}
    <div class="vb-tags">${tags}</div>
    <div class="vb-card-actions" aria-label="פעולות לכרטיס">
      <button type="button" class="vb-card-action vb-card-expand" data-vb-card-expand aria-expanded="false"><span>↕</span><b>פתח</b></button>
      <button type="button" class="vb-card-action" data-vb-card-save aria-pressed="false"><span>🔖</span><b>שמור</b></button>
      <button type="button" class="vb-card-action" data-vb-card-practice aria-pressed="false"><span>🎯</span><b>ליישום</b></button>
    </div>
    <div class="vb-card-feedback" aria-live="polite"></div>
    <div class="vb-term-expansion-slot" aria-live="polite"></div>
  </article>`;
}

function initVolleyballHub(){
  if(typeof document==='undefined'||!window.VOLLEYBALL_TOPICS)return;

  const tabs=document.getElementById('volleyball-population-tabs');
  const visual=document.getElementById('volleyball-population-visual');
  const worldTitle=document.getElementById('volleyball-population-title');
  const worldSummary=document.getElementById('volleyball-population-summary');
  const topicShell=document.getElementById('volleyball-topic-shell');
  const topicPanel=document.getElementById('volleyball-population-topics');
  const topicContext=document.getElementById('volleyball-topic-context');
  const search=document.getElementById('volleyball-search');
  const feed=document.getElementById('volleyball-feed');
  const feedTitle=document.getElementById('volleyball-feed-title');
  const count=document.getElementById('volleyball-feed-count');
  const sentinel=document.getElementById('volleyball-feed-sentinel');
  const discovery=document.getElementById('volleyball-discovery-result');
  const discoveryShell=document.getElementById('volleyball-discovery');
  const feedModeButtons=[...document.querySelectorAll('[data-vb-feed-mode]')];
  const savedCount=document.getElementById('vb-saved-count');
  const practiceCount=document.getElementById('vb-practice-count');

  let population='all';
  let topic='all';
  let page=0;
  let rendered=0;
  let loading=false;
  let feedMode='all';
  const feedSeed=new Date().toISOString().slice(0,10);
  const VB_SAVED_KEY='volleyball-saved-cards-v1';
  const VB_PRACTICE_KEY='volleyball-practice-cards-v1';
  const readCardSet=key=>{
    try{return new Set(JSON.parse(localStorage.getItem(key)||'[]'));}catch{return new Set();}
  };
  const savedCards=readCardSet(VB_SAVED_KEY);
  const practiceCards=readCardSet(VB_PRACTICE_KEY);
  const persistCardSet=(key,set)=>{
    try{localStorage.setItem(key,JSON.stringify([...set]));}catch{}
  };
  const syncInteractiveCardStates=(root=feed)=>{
    root?.querySelectorAll?.('.vb-feed-card[data-card-id]').forEach(cardEl=>{
      const id=cardEl.dataset.cardId;
      const saved=savedCards.has(id);
      const practice=practiceCards.has(id);
      const saveBtn=cardEl.querySelector('[data-vb-card-save]');
      const practiceBtn=cardEl.querySelector('[data-vb-card-practice]');
      if(saveBtn){
        saveBtn.classList.toggle('active',saved);
        saveBtn.setAttribute('aria-pressed',String(saved));
        const label=saveBtn.querySelector('b');if(label)label.textContent=saved?'נשמר':'שמור';
      }
      if(practiceBtn){
        practiceBtn.classList.toggle('active',practice);
        practiceBtn.setAttribute('aria-pressed',String(practice));
        const label=practiceBtn.querySelector('b');if(label)label.textContent=practice?'ברשימה':'ליישום';
      }
      cardEl.classList.toggle('is-saved',saved);
      cardEl.classList.toggle('is-practice',practice);
    });
  };
  const refreshFeedModeCounts=()=>{
    if(savedCount)savedCount.textContent=String(savedCards.size);
    if(practiceCount)practiceCount.textContent=String(practiceCards.size);
    feedModeButtons.forEach(btn=>{
      const active=btn.dataset.vbFeedMode===feedMode;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
  };
  const showCardFeedback=(cardEl,message)=>{
    const box=cardEl?.querySelector('.vb-card-feedback');
    if(!box)return;
    box.textContent=message;
    box.classList.add('show');
    clearTimeout(box._hideTimer);
    box._hideTimer=setTimeout(()=>box.classList.remove('show'),1400);
  };
  const handleCardAction=event=>{
    const action=event.target.closest('[data-vb-card-expand],[data-vb-card-save],[data-vb-card-practice]');
    if(!action)return false;
    const cardEl=action.closest('.vb-feed-card');
    const id=cardEl?.dataset.cardId;
    if(!cardEl||!id)return false;
    event.preventDefault();

    if(action.hasAttribute('data-vb-card-expand')){
      const open=!cardEl.classList.contains('is-open');
      cardEl.classList.toggle('is-open',open);
      action.setAttribute('aria-expanded',String(open));
      const label=action.querySelector('b');if(label)label.textContent=open?'סגור':'פתח';
      if(open)cardEl.scrollIntoView({behavior:'smooth',block:'nearest'});
      return true;
    }

    if(action.hasAttribute('data-vb-card-save')){
      const active=!savedCards.has(id);
      if(active)savedCards.add(id);else savedCards.delete(id);
      persistCardSet(VB_SAVED_KEY,savedCards);
      syncInteractiveCardStates(cardEl);
      refreshFeedModeCounts();
      showCardFeedback(cardEl,active?'נשמר בפיד שלך':'הוסר מהשמורים');
      if(feedMode==='saved'&&!active)setTimeout(resetFeed,180);
      return true;
    }

    const active=!practiceCards.has(id);
    if(active)practiceCards.add(id);else practiceCards.delete(id);
    persistCardSet(VB_PRACTICE_KEY,practiceCards);
    syncInteractiveCardStates(cardEl);
    refreshFeedModeCounts();
    showCardFeedback(cardEl,active?'נוסף לרשימת היישום':'הוסר מרשימת היישום');
    if(feedMode==='practice'&&!active)setTimeout(resetFeed,180);
    return true;
  };

  const populationOptions=[{id:'all',label:'הכול',icon:'🏐'},...window.VOLLEYBALL_POPULATIONS];
  tabs.innerHTML=populationOptions.map((p,index)=>`<button class="vb-pop-tab${index===0?' active':''}" type="button" data-population="${p.id}" aria-pressed="${index===0?'true':'false'}"><span>${p.icon||'🏐'}</span>${p.label}</button>`).join('');

  function renderAllVisuals(){
    const chosen=['women','men','youth-girls'];
    visual.innerHTML=`<div class="vb-player-collage">${chosen.map(id=>{const v=VOLLEYBALL_VISUALS[id];return `<a href="${v.creditUrl}" target="_blank" rel="noopener" class="vb-player-shot"><img src="${v.imageUrl}" alt="${v.alt}" loading="lazy"><span>${v.credit}</span></a>`;}).join('')}</div>`;
    worldTitle.textContent='כל עולם הכדורעף';
    worldSummary.textContent='פיד אחד שמחבר גברים, נשים, נוער ויסודי עם טכניקה, טקטיקה, מדע, פיזיולוגיה, תרגילים, ניתוח משחק, מחקר ועוד.';
  }

  function renderTopicTabs(){
    const topicOptions=[{id:'all',label:'הכול',icon:'🏐'},...getPopulationTopics(window.VOLLEYBALL_TOPICS,population)];
    topicPanel.innerHTML=topicOptions.map(item=>`<button type="button" class="vb-topic-tab${item.id===topic?' active':''}" data-topic="${item.id}" aria-pressed="${item.id===topic?'true':'false'}"><span>${item.icon||'•'}</span>${item.label}</button>`).join('');
    const populationLabel=population==='all'?'כל עולם הכדורעף':labelFor(window.VOLLEYBALL_POPULATIONS,population);
    topicContext.textContent=populationLabel;
  }

  function renderPopulationWorld(){
    const selected=window.VOLLEYBALL_POPULATIONS.find(item=>item.id===population);
    if(!selected){
      renderAllVisuals();
    }else{
      const v=VOLLEYBALL_VISUALS[selected.id];
      visual.innerHTML=`<a href="${v.creditUrl}" target="_blank" rel="noopener" class="vb-player-shot vb-player-shot-single"><img src="${v.imageUrl}" alt="${v.alt}" loading="lazy"><span>צילום: ${v.credit}</span></a>`;
      worldTitle.textContent=selected.label;
      worldSummary.textContent=selected.summary;
    }
    renderTopicTabs();
  }

  function currentPool(){
    const source=feedMode==='saved'
      ?window.VOLLEYBALL_FEED_CARDS.filter(card=>savedCards.has(card.id))
      :feedMode==='practice'
        ?window.VOLLEYBALL_FEED_CARDS.filter(card=>practiceCards.has(card.id))
        :window.VOLLEYBALL_FEED_CARDS;
    return filterVolleyballFeed(source,{population,topic,query:search.value});
  }

  function updateFeedHeading(){
    const populationLabel=population==='all'?'כל הכדורעף':labelFor(window.VOLLEYBALL_POPULATIONS,population);
    const topicLabel=topic==='all'?'כל המאפיינים':labelFor(window.VOLLEYBALL_TOPICS,topic);
    const modeLabel=feedMode==='saved'?'שמורים':feedMode==='practice'?'ליישום':'';
    const base=population==='all'&&topic==='all'?'פיד כדורעף':`פיד ${populationLabel} · ${topicLabel}`;
    feedTitle.textContent=modeLabel?`${base} · ${modeLabel}`:base;
  }

  function appendBatch(){
    if(loading)return;
    loading=true;
    const sourceCards=feedMode==='saved'
      ?window.VOLLEYBALL_FEED_CARDS.filter(card=>savedCards.has(card.id))
      :feedMode==='practice'
        ?window.VOLLEYBALL_FEED_CARDS.filter(card=>practiceCards.has(card.id))
        :window.VOLLEYBALL_FEED_CARDS;
    const batch=buildInfiniteBatch(sourceCards,{population,topic,query:search.value},feedSeed+'|'+feedMode,page,8);
    if(batch.length){
      feed.insertAdjacentHTML('beforeend',batch.map(renderCard).join(''));
      syncInteractiveCardStates(feed);
      page+=1;
      rendered+=batch.length;
      const populationLabel=population==='all'?'כל הכדורעף':labelFor(window.VOLLEYBALL_POPULATIONS,population);
      const topicLabel=topic==='all'?'כל המאפיינים':labelFor(window.VOLLEYBALL_TOPICS,topic);
      count.textContent=`${rendered} פריטים · ${populationLabel} · ${topicLabel}`;
    }else{
      if(!rendered) feed.innerHTML=`<div class="vb-empty">${feedMode==='saved'?'עוד לא שמרת פריטים במסלול הזה.':feedMode==='practice'?'עוד לא הוספת פריטים ליישום במסלול הזה.':'לא נמצאו פריטים למסלול הזה.'}</div>`;
      count.textContent='אין תוצאות נוספות';
    }
    loading=false;
  }

  function resetFeed(){
    page=0;
    rendered=0;
    feed.innerHTML='';
    updateFeedHeading();
    appendBatch();
  }

  function selectPopulation(next){
    population=next;
    topic='all';
    tabs.querySelectorAll('[data-population]').forEach(btn=>{
      const active=btn.dataset.population===population;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    discovery.innerHTML='';
    renderPopulationWorld();
    resetFeed();
  }

  function selectTopic(next){
    topic=next;
    topicPanel.querySelectorAll('[data-topic]').forEach(btn=>{
      const active=btn.dataset.topic===topic;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    discovery.innerHTML='';
    resetFeed();
  }

  function closeTermExpansion(card){
    if(!card)return;
    const slot=card.querySelector('.vb-term-expansion-slot');
    if(slot){slot.innerHTML='';delete slot.dataset.openTerm;}
    card.querySelectorAll('[data-term]').forEach(btn=>btn.setAttribute('aria-expanded','false'));
  }

  function handleTermInteraction(event){
    const close=event.target.closest('.vb-term-close');
    if(close){
      closeTermExpansion(close.closest('.vb-feed-card'));
      return true;
    }
    const btn=event.target.closest('[data-term]');
    if(!btn)return false;
    const card=btn.closest('.vb-feed-card');
    if(!card)return false;
    const slot=card.querySelector('.vb-term-expansion-slot');
    const term=btn.dataset.term||'';
    if(slot.dataset.openTerm===term){
      closeTermExpansion(card);
      return true;
    }
    card.querySelectorAll('[data-term]').forEach(item=>item.setAttribute('aria-expanded','false'));
    const entry=buildTermExpansion(term,window.VOLLEYBALL_FEED_CARDS,{population});
    slot.innerHTML=renderTermExpansion(entry);
    slot.dataset.openTerm=term;
    btn.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>slot.scrollIntoView({behavior:'smooth',block:'nearest'}));
    return true;
  }

  tabs.addEventListener('click',event=>{
    const btn=event.target.closest('[data-population]');
    if(!btn)return;
    selectPopulation(btn.dataset.population);
    (topicShell||document.getElementById('volleyball-feed-section'))?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  topicPanel.addEventListener('click',event=>{
    const btn=event.target.closest('[data-topic]');
    if(!btn)return;
    selectTopic(btn.dataset.topic);
    document.getElementById('volleyball-feed-section').scrollIntoView({behavior:'smooth',block:'start'});
  });

  feedModeButtons.forEach(btn=>btn.addEventListener('click',()=>{
    feedMode=btn.dataset.vbFeedMode||'all';
    refreshFeedModeCounts();
    resetFeed();
  }));
  refreshFeedModeCounts();

  search.addEventListener('input',resetFeed);
  feed.addEventListener('click',event=>{if(handleCardAction(event))return;handleTermInteraction(event);});

  discoveryShell.addEventListener('click',event=>{
    if(handleTermInteraction(event))return;
    const btn=event.target.closest('[data-kind]');
    if(!btn)return;
    const pool=currentPool();
    const card=pickDiscovery(pool,btn.dataset.kind,`${Date.now()}|${btn.dataset.kind}|${population}|${topic}`);
    discovery.innerHTML=card?renderCard(card):'<div class="vb-empty">אין כרגע פריט מהסוג הזה במסלול שנבחר.</div>';
  });

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) appendBatch();
    },{rootMargin:'500px 0px'});
    observer.observe(sentinel);
  }else{
    sentinel.innerHTML='<button type="button" class="btn" id="volleyball-load-more">טען עוד</button>';
    sentinel.addEventListener('click',appendBatch);
  }

  renderPopulationWorld();
  resetFeed();
}

if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',initVolleyballHub);
if(typeof module!=='undefined'&&module.exports){
  module.exports={VOLLEYBALL_VISUALS,VOLLEYBALL_TERM_PROFILES,filterVolleyballFeed,pickDiscovery,hashSeed,seededShuffle,buildInfiniteBatch,getPopulationTopics,buildTermExpansion,renderTermExpansion,renderCard};
}
if(typeof window!=='undefined') Object.assign(window,{VOLLEYBALL_VISUALS,VOLLEYBALL_TERM_PROFILES,filterVolleyballFeed,pickDiscovery,buildInfiniteBatch,getPopulationTopics,buildTermExpansion,renderTermExpansion,renderCard,initVolleyballHub});
