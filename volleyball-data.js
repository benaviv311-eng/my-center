const VOLLEYBALL_POPULATIONS=[
  {id:'elementary',label:'יסודי',icon:'🟡',summary:'כיתות ג׳–ו׳: תנועה, משחקיות, שליטה בכדור, מיני־כדורעף והתקדמות הדרגתית ממשחק אל המשחק המלא.',subgroups:['ג׳–ד׳','ה׳–ו׳']},
  {id:'youth-boys',label:'נוער בנים',icon:'🔵',summary:'פיתוח טכני וטקטי בתקופת גדילה, מעבר למשחק תחרותי, בניית תפקידים, כוח, קפיצה ועומסים מותאמים.'},
  {id:'youth-girls',label:'נוער בנות',icon:'🟣',summary:'פיתוח טכניקה, קבלת החלטות, כוח וקפיצה, נחיתה ועומסים, קבלה־הגנה ומעבר הדרגתי לרמות בוגרות.'},
  {id:'women',label:'נשים',icon:'🔴',summary:'קצב משחק, מערכי קבלה והגנה, מעבר, עומסים, קפיצה, כוח, טקטיקה וניתוח ביצועים בכדורעף נשים.'},
  {id:'men',label:'גברים',icon:'⚫',summary:'קצב גבוה, הגשה אגרסיבית, חסימה, מעבר, התקפה מהירה, עומסים ופיתוח ביצועים לכדורעף גברים.'}
];

const VOLLEYBALL_LEVELS=[
  {id:'beginner',label:'מתחילים'},
  {id:'intermediate',label:'ביניים'},
  {id:'competitive',label:'תחרותי'},
  {id:'elite',label:'עילית'}
];

const VOLLEYBALL_TOPICS=[
  {id:'technique',label:'טכניקה',icon:'🎯',group:'game'},
  {id:'tactics',label:'טקטיקה',icon:'🧠',group:'game'},
  {id:'positions',label:'עמדות ותפקידים',icon:'🧩',group:'game'},
  {id:'systems',label:'מערכות משחק',icon:'🕸️',group:'game'},
  {id:'rotations',label:'רוטציות',icon:'🔄',group:'game'},
  {id:'decision-making',label:'קבלת החלטות',icon:'⚡',group:'game'},
  {id:'serve-receive',label:'הגשה וקבלה',icon:'📡',group:'game'},
  {id:'attack',label:'התקפה',icon:'💥',group:'game'},
  {id:'block-defense',label:'חסימה והגנה',icon:'🛡️',group:'game'},
  {id:'transition',label:'מעבר',icon:'↔️',group:'game'},
  {id:'drills',label:'תרגילים',icon:'🧪',group:'training'},
  {id:'motor-learning',label:'למידה מוטורית',icon:'🧠',group:'training'},
  {id:'practice-design',label:'בניית אימון',icon:'🗂️',group:'training'},
  {id:'small-sided',label:'משחקונים',icon:'🎲',group:'training'},
  {id:'video-analysis',label:'ניתוח וידאו',icon:'🎥',group:'analysis'},
  {id:'statistics',label:'סטטיסטיקה ומדדים',icon:'📊',group:'analysis'},
  {id:'physiology',label:'פיזיולוגיה',icon:'🫀',group:'physical'},
  {id:'jump-power',label:'קפיצה וכוח מתפרץ',icon:'🚀',group:'physical'},
  {id:'speed-movement',label:'מהירות ותנועה',icon:'🏃',group:'physical'},
  {id:'landing-load',label:'נחיתה ועומסים',icon:'📉',group:'physical'},
  {id:'shoulder-injury',label:'כתף ומניעת פציעות',icon:'🦾',group:'physical'},
  {id:'player-development',label:'פיתוח שחקן',icon:'🌱',group:'development'},
  {id:'communication',label:'תקשורת במשחק',icon:'🗣️',group:'development'},
  {id:'rules',label:'חוקי המשחק',icon:'📘',group:'culture'},
  {id:'history',label:'היסטוריה והתפתחות',icon:'🕰️',group:'culture'},
  {id:'world',label:'כדורעף בעולם',icon:'🌍',group:'culture'},
  {id:'coaching-methods',label:'מאמנים ושיטות',icon:'🧭',group:'culture'},
  {id:'myths',label:'מיתוסים וטעויות נפוצות',icon:'🧯',group:'analysis'}
];

const C=(id,kind,topic,populations,levels,title,text,detail,tags=[])=>({id,kind,topic,populations,levels,title,text,detail,tags});
const VOLLEYBALL_FEED_CARDS=[
  C('tech-platform','concept','technique',['all'],['all'],'פלטפורמה יציבה בקבלה','המטרה היא לא להיראות מושלם אלא לייצר זווית שמחזירה את הכדור לאזור שניתן לבנות ממנו התקפה.','בדוק קודם את כיוון הפלטפורמה ואת נקודת המגע, ורק אחר כך את האסתטיקה של התנועה.',['קבלה','טכניקה']),
  C('tech-youth-girls-pass','drill','technique',['youth-girls'],['competitive'],'קבלה עם שינוי מטרה','שלוש מטרות שונות ליד הרשת. לפני כל הגשה המאמן מסמן מטרה חדשה.','המטרה היא לחבר איכות מגע עם התאמה מהירה למידע משתנה ולא לקבע מסלול אחד.',['נוער בנות','קבלה']),
  C('tactics-sideout','concept','tactics',['all'],['competitive','elite'],'Side-out כבעיה מערכתית','איכות היציאה מקבלה תלויה בקשר בין קבלה, זמינות אמצע, מיקום המוסר ופתרונות הקיצון.','בניתוח וידאו סמן לא רק אם הנקודה הושגה אלא איזה פתרונות היו זמינים לפני ההתקפה.',['side-out']),
  C('scenario-seam','scenario','serve-receive',['women','men','youth-boys','youth-girls'],['competitive','elite'],'מי לוקח את ה־seam?','שני מקבלים עומדים במרחק דומה וההגשה נכנסת ביניהם. מי מקבל אחריות?','ההחלטה צריכה להיקבע מראש לפי המערך, איכות המקבלים והכיוון שממנו מגיעה ההגשה.',['קבלה','תקשורת']),
  C('rotation-one','concept','rotations',['all'],['intermediate','competitive','elite'],'לקרוא רוטציה לפני הכדור הראשון','לפני כל מהלך שאל: מי שלושת התוקפים הזמינים, מי מקבל, והיכן נקודת התורפה של ההגנה?','כך הרוטציה הופכת ממיקום על דף למערכת החלטות.',['רוטציות']),
  C('setter-distribution','research','statistics',['women','men'],['competitive','elite'],'פיזור מוסר הוא הקשר, לא רק אחוזים','ספירת סטים לכל עמדה אינה מספיקה בלי מצב קבלה, רוטציה, תוצאה ומיקום החסימה.','בנה ניתוח שמחבר distribution להקשר שבו התקבלה ההחלטה.',['מוסר','נתונים']),
  C('block-read','concept','block-defense',['all'],['competitive','elite'],'Read block מתחיל לפני הניתור','החוסם קורא מסלול קבלה, גוף מוסר, קצב התוקף ואפשרויות ההתקפה עוד לפני היציאה לקרקע.','אמן רצפי קריאה קצרים, לא רק טכניקת ידיים מעל הרשת.',['חסימה']),
  C('transition-3ball','drill','transition',['all'],['competitive','elite'],'שלושה כדורי מעבר','מאמן מכניס שלושה כדורים רצופים: הגנה קשה, free ball וכדור מחוץ למערכת.','הניקוד ניתן על איכות המעבר להתקפה, לא רק על ניצחון במהלך.',['מעבר','wash']),
  C('myth-perfect-pass','myth','myths',['all'],['all'],'מיתוס: כל קבלה חייבת להגיע לנקודה מושלמת','קבלה טובה היא קבלה שמאפשרת מספיק אפשרויות התקפה ביחס ללחץ שהופעל.','הגדר אזור איכות ולא נקודה יחידה, במיוחד בשלבי למידה.',['מיתוס','קבלה']),
  C('problem-middle-late','problem-solution','attack',['all'],['competitive','elite'],'בעיה: האמצע תמיד מאחר','לפני שמתקנים את היד, בדוק את רצף היציאה, המרחק מהמוסר ואת מועד תחילת ההאצה.','צלם מהצד וסמן את רגע הקבלה, יציאת המוסר וצעדי הגישה של האמצע.',['אמצע','תזמון']),
  C('question-freeball','question','decision-making',['all'],['intermediate','competitive'],'מה עדיף ב־free ball?','הכדור מגיע קל. מה המטרה הראשונה?','לייצר מבנה שמאפשר קבלה איכותית, שלושה תוקפים ואפשרויות מלאות למוסר.',['שאלה']),
  C('motor-external','research','motor-learning',['all'],['all'],'פוקוס חיצוני באימון טכניקה','הנחיה שמכוונת להשפעת הפעולה יכולה להיות שימושית יותר מהעמסה של הוראות גוף.','במקום “יישר מרפקים”, נסה “שלח את הכדור בקו אל המטרה” והשווה ביצוע.',['למידה מוטורית']),
  C('practice-density','concept','practice-design',['all'],['all'],'צפיפות מגעים אינה המטרה היחידה','יותר מגעים בדקה טובים רק אם המגעים דורשים את המידע וההחלטות שאנחנו רוצים ללמד.','מדוד גם כמה מהחזרות דומות למשחק וכמה מהן דורשות החלטה.',['בניית אימון']),
  C('small-sided-2v2','drill','small-sided',['elementary'],['beginner','intermediate'],'2×2 עם שלוש נגיעות','מגרש קטן, חובה על שתי נגיעות לפחות לפני העברה.','לכיתות ג׳–ד׳ אפשר להתחיל בתפיסה־זריקה; ה׳–ו׳ עוברים בהדרגה למסירה אמיתית.',['יסודי','מיני כדורעף']),
  C('elementary-movement','concept','player-development',['elementary'],['beginner'],'לפני טכניקה מורכבת — תנועה וכדור','ביסודי חשוב לבנות עצירה, שינוי כיוון, תפיסה, זריקה והתמצאות במרחב.','הכדורעף מתפתח מהר יותר כשהילד קודם מרגיש בטוח לנוע ולשחק.',['יסודי']),
  C('youth-boys-growth','research','physiology',['youth-boys'],['all'],'גדילה משנה את התנועה','בתקופות גדילה מהירה התזמון והקואורדינציה עשויים להשתנות גם בלי ירידה במאמץ.','הפרד בין “חוסר ריכוז” לבין שינוי זמני בשליטה הגופנית והתאם עומס והוראות.',['נוער בנים','גדילה']),
  C('youth-girls-landing','drill','landing-load',['youth-girls'],['intermediate','competitive'],'נחיתה לפני עוד קפיצה','3×3 נחיתות מבוקרות לאחר צעד גישה, עם עצירה קצרה ויציבות.','המטרה היא איכות בלימה ומנח יציב לפני שמוסיפים נפח קפיצות.',['נוער בנות','נחיתה']),
  C('women-defense','concept','block-defense',['women'],['competitive','elite'],'הגנה נבנית מהחסימה החוצה','מיקום המגנות צריך לנבוע מהאזור שהחסימה סוגרת ומהפתרון שההתקפה היריבה מעדיפה.','בניתוח, בדקי כל כדור הגנה יחד עם מיקום הידיים של החסימה.',['נשים','הגנה']),
  C('men-serve-pressure','concept','serve-receive',['men'],['competitive','elite'],'לחץ בהגשה הוא יותר מעוצמה','מהירות גבוהה בלי יעד ברור יכולה לייצר פחות לחץ מהגשה מדויקת לשחקן או מסלול בעייתי.','סווג הגשות לפי מטרה: שחקן, seam, עומק, קצר, או הוצאת תוקף מהמסלול.',['גברים','הגשה']),
  C('jump-quality','research','jump-power',['all'],['competitive','elite'],'איכות קפיצה לפני נפח','כוח מתפרץ דורש חזרות איכותיות ומנוחה מספקת; עייפות משנה את מטרת התרגיל.','כשמהירות או גובה הקפיצה יורדים משמעותית, עבור למטרה אחרת במקום לצבור חזרות חלשות.',['קפיצה','כוח']),
  C('speed-firststep','drill','speed-movement',['all'],['intermediate','competitive'],'צעד ראשון לפי מידע','שחקן מתחיל במרכז ומגיב לכיוון שמוצג רק ברגע האחרון.','שמור על מרחק קצר כדי לאמן תגובה והאצה, לא כושר אירובי.',['מהירות','תגובה']),
  C('shoulder-volume','problem-solution','shoulder-injury',['all'],['competitive','elite'],'בעיה: כתף כבדה אחרי הרבה הנחתות','בדוק נפח הנחתות, הגשות, ימים רצופים ועומס נוסף בחדר כוח לפני שמחפשים “תרגיל קסם”.','הפתרון מתחיל בניהול עומס ובהדרגה, לצד הערכה מקצועית כשיש כאב או מגבלה.',['כתף','עומסים']),
  C('video-rally','drill','video-analysis',['all'],['competitive','elite'],'נתח Rally בארבעה שלבים','עצור אחרי הגשה, קבלה, בניית התקפה ומעבר. בכל עצירה רשום איזה מידע היה זמין.','המטרה היא להבין החלטות ולא רק לסמן מי טעה.',['וידאו']),
  C('stats-sideout','concept','statistics',['all'],['competitive','elite'],'Side-out% בלי הקשר מטעה','אחוז צד־אאוט צריך להיחתך לפי איכות קבלה, רוטציה, סוג הגשה ולעיתים גם תוצאה.','חפש היכן המערכת נשברת, לא רק מה הממוצע הכולל.',['סטטיסטיקה']),
  C('communication-early','concept','communication',['all'],['all'],'תקשורת מוקדמת מנצחת צעקות מאוחרות','קריאה לפני המגע מאפשרת לשחקנים להתארגן; קריאה בזמן שהכדור כבר אצל השחקן כמעט תמיד מאוחרת.','בנה מילון קצר ועקבי של calls לכל מצב.',['תקשורת']),
  C('rules-overlap','question','rules',['all'],['intermediate','competitive'],'מתי overlap באמת משפיע?','השחקנים חייבים לעמוד ביחסים חוקיים ברגע מכת ההגשה, ולא להישאר במבנה הזה לאורך כל המהלך.','השתמש בחוק כדי לבנות מיקומי פתיחה יעילים ולא כדי לקבע שחקנים.',['חוקים']),
  C('history-rallypoint','concept','history',['all'],['all'],'איך Rally Point שינה את המשחק','כל טעות מעניקה נקודה ולכן ערך הסיכון בהגשה ובהתקפה השתנה.','היסטוריה של החוקים עוזרת להבין למה הטקטיקה המודרנית נראית כפי שהיא נראית.',['היסטוריה']),
  C('world-japan','concept','world',['all'],['all'],'ללמוד מסגנונות בלי להעתיק','בתי ספר שונים מדגישים קצב, שליטה, הגנה, גובה או לחץ בהגשה בצורות שונות.','קח עיקרון שמתאים לבעיה שלך במקום להעתיק אימון שלם מתרבות אחרת.',['כדורעף בעולם']),
  C('coach-constraints','concept','coaching-methods',['all'],['all'],'Constraint לפני עוד הסבר','לפעמים שינוי חוק המשחקון מלמד מהר יותר מעוד דקה של הוראות.','רוצה יותר שימוש באמצע? תן ניקוד כפול להתקפה דרך האמצע בתנאים מתאימים.',['שיטות אימון']),
  C('positions-libero','concept','positions',['all'],['intermediate','competitive'],'ליברו הוא מנהל מידע','מעבר לאיכות מגע, הליברו יכול לארגן עומק, seams וקשר עם החסימה.','פתח תקשורת וקריאת משחק כחלק מהתפקיד, לא רק טכניקת הגנה.',['ליברו']),
  C('systems-51','concept','systems',['all'],['intermediate','competitive'],'5–1 הוא מערכת של יתרונות משתנים','אותו מוסר מנהל את כל הרוטציות, אבל מספר התוקפים הקדמיים והקבלה משתנים בכל סבב.','למד כל רוטציה דרך האפשרויות שלה ולא רק דרך מיקומי פתיחה.',['5-1'])
];

if(typeof module!=='undefined'&&module.exports){module.exports={VOLLEYBALL_POPULATIONS,VOLLEYBALL_LEVELS,VOLLEYBALL_TOPICS,VOLLEYBALL_FEED_CARDS};}
if(typeof window!=='undefined'){Object.assign(window,{VOLLEYBALL_POPULATIONS,VOLLEYBALL_LEVELS,VOLLEYBALL_TOPICS,VOLLEYBALL_FEED_CARDS});}
