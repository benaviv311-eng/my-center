const VB_RICH_SOURCES={
  lesson:{name:'USA Volleyball · Lesson Plans',url:'https://usavolleyball.org/resources-for-coaches/lesson-plans/'},
  tools:{name:'USA Volleyball · Coaches Tools',url:'https://usavolleyball.org/resources-for-coaches/coaches-tools/'},
  canada:{name:'Volleyball Canada · Skills',url:'https://volleyball.ca/en/development/coach/skills'},
  fivb:{name:'FIVB · Tools and Resources Centre',url:'https://www.fivb.com/inside-fivb/education/tools-and-resources-centre/'}
};

const VB_POPULATION_PROFILES={
  elementary:{label:'יסודי',short:'משחק, תנועה והרבה מגעים',rationale:'ביסודי בונים אהבה למשחק, תנועה, התמצאות והרבה מגעים לפני דרישות מורכבות של כדורעף בוגרים.',lens:'המשימה צריכה להיות קצרה, משחקית וברורה, עם מעט המתנה והרבה הצלחות.',decision:'נותנים החלטה אחת או שתיים בכל ראלי ומגדילים מורכבות רק כשהילדים ממשיכים לשחק.',load:'העומס נשלט דרך זמן משחק, גודל מגרש ומספר נגיעות ולא דרך עייפות מכוונת.'},
  'youth-boys':{label:'נוער בנים',short:'טכניקה וטקטיקה בזמן גדילה',rationale:'בנוער בנים מחברים התפתחות טכנית וטקטית לשינויי גדילה, עלייה בכוח ומעבר הדרגתי לקצב תחרותי.',lens:'התרגול שומר איכות תנועה וטכניקה כשהמהירות והכוח עולים ומוסיף אחריות טקטית בהדרגה.',decision:'השחקן לומד לקרוא יריב ומבנה ולא להישען רק על יתרון פיזי.',load:'נפח קפיצות והגשות עולה בהדרגה ומופרד מיחידות שבהן המטרה היא מהירות ואיכות.'},
  'youth-girls':{label:'נוער בנות',short:'יציבות, קריאה ומעבר',rationale:'בנוער בנות בונים יציבות טכנית, קריאת משחק, נחיתה וניהול עומס יחד עם מעבר הדרגתי לאחריות תחרותית.',lens:'התרגול מחבר מגע להחלטה, תקשורת ומעבר בין פעולות בלי להעתיק דרישות של בוגרות.',decision:'המידע מההגשה, החסימה והתוקפת נכנס לתרגיל כבר מההתחלה.',load:'קפיצות ונחיתות מקבלות דגש איכותי והתקדמות מדורגת כשהקצב עולה.'},
  women:{label:'נשים',short:'מודל משחק של בוגרות',rationale:'בכדורעף נשים בוגרות התוכן מתחבר לרוטציות, קבלה והגנה, מעבר, נתונים וזהות טקטית של הקבוצה.',lens:'התרגול יוצא מסיטואציה תחרותית ומגדיר איזה יתרון הקבוצה רוצה ליצור ברוטציה או מול יריבה.',decision:'החלטות מוסרת, מקבלות, חוסמות ומגנות נבחנות כחלק מאותה מערכת.',load:'העומס נבחן מול לוח משחקים, נפח קפיצות והתקפות והתאוששות לאורך העונה.'},
  men:{label:'גברים',short:'קצב, לחץ ומהירות',rationale:'בכדורעף גברים בוגרים מהירות ההגשה וההתקפה והגובה מעל הרשת מחייבים חיבור בין כוח, קריאה ותזמון.',lens:'התרגול מייצר זמן החלטה קצר וקצב גבוה אבל מודד איכות ולא רק עוצמה.',decision:'היתרון נוצר מקריאה מוקדמת ודיוק תחת קצב ולא רק מיכולת פיזית.',load:'חזרות עצימות דורשות מנוחה מספקת כדי שאימון מהירות לא יהפוך לאימון עייפות.'}
};

const VB_TOPIC_CONTENT={
  technique:['טכניקה','פתרון טכני שמשרת את הכדור הבא','יציבות טכנית תחת שינוי','טכניקה נבחנת לפי היכולת לייצר תוצאה שימושית כשהמסלול, הקצב והלחץ משתנים.',['טכניקה','ביצוע']],
  tactics:['טקטיקה','לזהות יתרון לפני הפעולה','עיקרון טקטי לפני תבנית','טקטיקה מתחילה בזיהוי מידע ובבחירת פתרון שמגדיל אפשרויות לקבוצה ומצמצם אותן ליריב.',['טקטיקה','קבלת החלטות']],
  positions:['עמדות ותפקידים','תפקיד הוא אחריות בתוך מערכת','מה העמדה צריכה לדעת לפני המגע','עמדה אינה רק מקום במגרש אלא אחריות שמשתנה לפי הרוטציה והכדור.',['עמדות','תפקידים']],
  systems:['מערכות משחק','מערכת טובה מייצרת אפשרויות','לשמור מבנה כשהכדור יוצא מהתכנון','מערכת מבהירה אחריות ומאפשרת להתארגן מחדש גם כשהמהלך אינו מושלם.',['מערכות','ארגון']],
  rotations:['רוטציות','לקרוא יתרונות וחולשות ברוטציה','מה משתנה ברגע ההגשה','כל רוטציה משנה מקבלים, תוקפים, חסימה ומסלולי תנועה ולכן משנה גם את ההחלטות.',['רוטציות','מבנה']],
  'decision-making':['קבלת החלטות','לקרוא לפני שנוגעים בכדור','החלטה טובה גם כשהתוצאה לא מושלמת','איכות החלטה תלויה במידע שהיה זמין ובמטרה ולא רק בתוצאה האחרונה.',['קבלת החלטות','קריאת משחק']],
  'serve-receive':['הגשה וקבלה','מאבק על מספר האפשרויות','יעד לפני עוצמה ומבנה לפני אסתטיקה','הגשה מנסה לצמצם אפשרויות והקבלה מנסה לשמר אותן; שתיהן טכניות וטקטיות יחד.',['הגשה','קבלה']],
  attack:['התקפה','להגיע לכדור עם יותר מפתרון אחד','לתקוף לפי החסימה ולא לפי הרגל','התקפה מחברת תזמון, גישה, מיקום הכדור וקריאת חסימה.',['התקפה','תזמון']],
  'block-defense':['חסימה והגנה','מערכת אחת משני צדי הרשת','לסגור שטח ולכוון את התוקף','החסימה מגדירה שטח וההגנה משלימה אותו; צריך לנתח את שתיהן יחד.',['חסימה','הגנה']],
  transition:['מעבר','הפעולה הבאה מתחילה לפני שהקודמת נגמרת','מהגנה להתקפה בלי עצירה','מעבר איכותי הוא שינוי תפקיד מהיר ויצירת מבנה חדש מיד אחרי המגע.',['מעבר','transition']],
  drills:['תרגילים','תרגיל שמלמד משחק ולא תור','מדד הצלחה שמחובר למטרה','תרגיל טוב מייצר את המידע וההחלטה שרוצים לראות במשחק ומאפשר חזרות איכותיות.',['תרגילים','אימון']],
  'motor-learning':['למידה מוטורית','למידה שנשארת כשהתרגיל משתנה','פידבק שמפתח פתרון עצמאי','למידה דורשת שונות, זמן, פידבק והעברה לתנאים משתנים ולא רק הצלחה רגעית.',['למידה מוטורית','פידבק']],
  'practice-design':['בניית אימון','לבנות סביב בעיה מקצועית','קצב, חזרות והחלטות באותה יחידה','אימון מתחיל במטרה ברורה ומסדר משימות כך שכל שלב מכין לשלב הבא.',['בניית אימון','עומס']],
  'small-sided':['משחקונים','פחות שחקנים ויותר החלטות','לשנות חוק כדי לשנות התנהגות','משחקונים קטנים מגדילים מעורבות ומאפשרים להדגיש עיקרון בעזרת מרחב, ניקוד וחוקים.',['משחקונים','constraints']],
  'video-analysis':['ניתוח וידאו','לנתח מידע ולא רק טעות','לעצור רגע לפני ההחלטה','וידאו מועיל כשהוא מחזיר למידע שהיה זמין לפני הפעולה ומחבר אותו להחלטה.',['וידאו','ניתוח']],
  statistics:['סטטיסטיקה ומדדים','מספר בלי הקשר לא מסביר משחק','לחתוך נתונים לפי רוטציה ומצב','מדד הופך לכלי אימון רק כשהוא מחובר לשאלה מקצועית ולהקשר שבו נוצר.',['סטטיסטיקה','נתונים']],
  physiology:['פיזיולוגיה','מה הגוף צריך כדי לשמור איכות','להבדיל עייפות מאימון איכות','כדורעף דורש מאמצים קצרים ועצימים שחוזרים לאורך משחק יחד עם יכולת התאוששות.',['פיזיולוגיה','עומס']],
  'jump-power':['קפיצה וכוח מתפרץ','כוח ומהירות לפני עוד נפח','איכות קפיצה לפני כמות','כוח מתפרץ דורש חזרות מהירות ואיכותיות, תזמון וגישה יעילה ולא קפיצות עייפות.',['קפיצה','כוח']],
  'speed-movement':['מהירות ותנועה','הצעד הראשון נולד מהמידע','להאיץ למקום הנכון','מהירות משחקית משלבת קריאה, תגובה, האצה ובלימה למיקום הנכון.',['מהירות','תנועה']],
  'landing-load':['נחיתה ועומסים','לנחות מוכן לפעולה הבאה','איכות ונפח יוצרים את העומס יחד','נחיתה היא בלימת כוח שחוזרת פעמים רבות ולכן איכותה ונפח הקפיצות צריכים להיבדק יחד.',['נחיתה','עומסים']],
  'shoulder-injury':['כתף ומניעת פציעות','בריאות כתף מתחילה בניהול נפח','להפריד כאב מעייפות ולפעול בזמן','בריאות כתף תלויה בנפח הנחתות והגשות, כוח, טווח, התאוששות והתקדמות עומס.',['כתף','מניעת פציעות']],
  'player-development':['פיתוח שחקן','לפתח יכולת ולא רק לנצח היום','השלב הבא מאתגר אבל אפשרי','פיתוח שחקן הוא רצף ארוך של מיומנות, הבנת משחק, יכולת גופנית ועצמאות.',['פיתוח שחקן','התפתחות']],
  communication:['תקשורת במשחק','קריאה מוקדמת שווה זמן','מילון קבוצתי קצר ועקבי','תקשורת טובה נותנת מידע לפני הפעולה ומבהירה אחריות במקום להגיב מאוחר.',['תקשורת','אחריות']],
  rules:['חוקי המשחק','חוק שמשנה החלטה טקטית','להכיר חוק כדי לנצל מרחב וזמן','חוקים משפיעים על עמדות פתיחה, חילופים, מגעים, הגשה וחסימה ולכן גם על הטקטיקה.',['חוקים','טקטיקה']],
  history:['היסטוריה והתפתחות','איך שינוי חוק יצר משחק חדש','מהעבר להבין את הטקטיקה של היום','שינויים בחוקים, ניקוד ותפקידים מסבירים כיצד נוצר הכדורעף המודרני.',['היסטוריה','התפתחות']],
  world:['כדורעף בעולם','ללמוד מסגנון אחר בלי להעתיק','לקחת עיקרון שמתאים לבעיה שלנו','ליגות ונבחרות מדגישות קצב, הגנה, גובה, שליטה ולחץ בדרכים שונות; הערך הוא בעקרון.',['כדורעף בעולם','סגנונות']],
  'coaching-methods':['מאמנים ושיטות','לשנות סביבה לפני עוד נאום','שאלה טובה יכולה ללמד יותר מתשובה','אימון טוב בוחר מתי להסביר, מתי לשאול ומתי לשנות חוק או מרחב כדי שהמשחק ילמד.',['שיטות אימון','אימון']],
  myths:['מיתוסים וטעויות נפוצות','לבדוק כלל לפני שהופך לאמת','להפריד מסורת מעיקרון מקצועי','מיתוס נוצר לעיתים מכלל שעובד במצב אחד ומיושם כאילו הוא נכון תמיד; צריך לבדוק הקשר.',['מיתוסים','טעויות נפוצות']]
};

const makeDrill=(id,population,title,goal,setup,execution,coachingPoints,source,adaptationNote,extras={})=>({
  id,population,title,goal,players:extras.players||'4–12',equipment:extras.equipment||'רשת וכדורים',setup,execution,coachingPoints,
  commonErrors:extras.commonErrors||'עצירה ארוכה בין חזרות או איבוד המטרה המקצועית לטובת ביצוע מכני.',
  progression:extras.progression||'להוסיף בהדרגה יריב, ניקוד, שינוי מסלול או לחץ זמן בלי לאבד איכות.',
  sourceName:source.name,sourceUrl:source.url,adaptationNote
});

const VOLLEYBALL_DRILL_LIBRARY=[
  makeDrill('el-2v2','elementary','2×2: שלוש נגיעות דרך משחק','להגדיל מגעים, תנועה והבנת רצף.','מגרש קטן ורשת נמוכה; זוג מול זוג.','מכניסים כדור קל ומקבלים בונוס על שתי–שלוש נגיעות לפני מעבר.','מעט תורים, יעד גדול למגע השני והרבה ראלים.',VB_RICH_SOURCES.lesson,'עיבוד לילדי יסודי של עקרונות המשחקים הקטנים בתכניות USA Volleyball.'),
  makeDrill('el-3skills','elementary','קבלה–מסירה–העברה מעל הרשת','לחבר מיומנויות לרצף משחקי.','שלשות משני צדי הרשת עם הכנסת כדור קלה.','מגע ראשון לאזור מוסר, מגע שני נוח, שלישי מעל הרשת ואז החלפת תפקידים.','להעדיף רצף חי והצלחה על תיקוני גוף רבים.',VB_RICH_SOURCES.lesson,'גרסת יסודי לתרגול רב־מיומנויות מעל רשת מתוך תכניות USA Volleyball.'),
  makeDrill('el-targets','elementary','הגשה וקבלה למטרות','ללמד שלהגשה ולקבלה יש יעד.','מגישים ומקבלים מול אזורי מטרה רחבים.','המגיש בוחר אזור והמקבל מכוון לכדור שמאפשר המשך.','מרחק הגשה מותאם; מטרה גדולה; החלפת תפקידים תכופה.',VB_RICH_SOURCES.canada,'התאמה לשלב Learn to Train ולעקרונות המיומנויות של Volleyball Canada.'),
  makeDrill('yb-scramble','youth-boys','Scramble & Recover','לחבר הצלה לחזרה למבנה ולהתקפה.','יחידת הגנה מול כדורים שמוציאים שחקנים מהמבנה.','אחרי כל הצלה חייבים להתארגן לכדור הבא ולבנות התקפה.','תקשורת על אחריות וצעד ראשון אחרי ההגנה.',VB_RICH_SOURCES.tools,'מבוסס על Scramble and Recover עם התאמת קצב ונפח לנוער בנים.'),
  makeDrill('yb-oos','youth-boys','4×4 מחוץ למערכת','לייצר כדור שני והתקפה כשהמוסר לא זמין.','4 מול 4; מגע ראשון מוכוון מחוץ לאזור המוסר.','שחקן חלופי לוקח שני ובונה התקפה בטוחה; ממשיכים ראלי.','גובה כדור שני, זמינות תוקף וקריאה מוקדמת.',VB_RICH_SOURCES.tools,'מבוסס על 4x4 Out of System Setting של USA Volleyball.'),
  makeDrill('yb-serve','youth-boys','מגיש מול מקבלים ותוקפים','לחבר יעד הגשה להשפעה על התקפת היריב.','מגישים מול יחידת קבלה והתקפה.','ניקוד לפי מספר אפשרויות התקפה שנשארו אחרי הקבלה.','לבחור יעד לפני ההגשה ולמדוד לחץ טקטי, לא רק אייס.',VB_RICH_SOURCES.tools,'עיבוד של Server vs. Receivers and Hitters לנוער בנים.'),
  makeDrill('yg-dig-cover','youth-girls','Dig–Set–Cover','לחבר הגנה, מסירה וכיסוי לרצף אחד.','יחידת הגנה מול התקפה מבוקרת.','אחרי דיג בונים התקפה ומיד נכנסים לכיסוי.','הגנה שמכוונת לכדור שני, מעבר מהיר ותקשורת.',VB_RICH_SOURCES.tools,'מבוסס על Dig-Set-Cover עם דגש על יציבות ומעבר לנוער בנות.'),
  makeDrill('yg-defend-set','youth-girls','Hawaii Defend & Set','לשפר כדור שני אחרי הגנה לא מושלמת.','מגנות מול כדורים לאזורים משתנים.','המגנה שומרת כדור חי ושחקנית אחרת מתארגנת למסירה להתקפה.','עצירה מאוזנת לפני מסירה וקריאה מוקדמת מי לוקחת שני.',VB_RICH_SOURCES.tools,'מבוסס על Hawaii Defend and Set בקצב מותאם לנוער בנות.'),
  makeDrill('yg-read','youth-girls','Read the Hitter','לפתח הגנה שקוראת תוקפת במקום לנחש.','תוקפת מול מגנות; מיקום המסירה משתנה.','המגנות קוראות גישה וכתף, מגיבות וממשיכות את הדיג לראלי.','מבט על התוקפת, קשר לחסימה וצעד ראשון מאוזן.',VB_RICH_SOURCES.tools,'מבוסס על Read the Hitter עם מרחקים ועומס מותאמים לנוער.'),
  makeDrill('w-coverage','women','Coverage & Out-of-System Play','לשמור יכולת התקפית אחרי נגיעה בחסימה או קבלה קשה.','יחידת 6×6 עם כדורי כיסוי ומצבי out-of-system.','מכסים התקפה, מייצרים כדור שני חלופי ובונים התקפה חדשה.','מרחקי כיסוי, מוסרת חלופית ובחירת התקפה עם מרווח בטחון.',VB_RICH_SOURCES.tools,'מבוסס על Coverage & Out-of-System Play ומותאם למודל משחק של נשים בוגרות.'),
  makeDrill('w-middle','women','Middle vs Middle','לחבר זמינות אמצע, מוסרת וקריאת חסימה.','שתי קבוצות עם אמצע; פתיחה מקבלה או free ball.','בונוס על איום אמצע איכותי או קריאת חסימה נכונה.','קצב יציאה, מיקום מוסרת וקריאת ידיים בחסימה.',VB_RICH_SOURCES.tools,'מבוסס על Middle vs. Middle לרמת נשים בוגרות.'),
  makeDrill('w-risk','women','Risk–Reward בהגשה','לתרגל בחירת סיכון לפי רוטציה ותוצאה.','רצפי הגשה וקבלה עם ערכי ניקוד שונים ליעדים.','המגישה בוחרת יעד ורמת סיכון; הניקוד מתגמל לחץ איכותי ומעניש טעות לא מוצדקת.','לנמק את הסיכון ולעקוב אחרי איכות הקבלה שנגרמה.',VB_RICH_SOURCES.tools,'מבוסס על Risk Reward ומותאם להחלטות הגשה בנשים בוגרות.'),
  makeDrill('m-serve','men','Server vs Receivers & Hitters','למדוד איך הגשה מצמצמת התקפה בקצב גבוה.','מגישים מול יחידת קבלה מלאה ותוקפים.','מסמנים אחרי כל הגשה כמה אפשרויות התקפה נשארו וממשיכים לראלי.','יעד לפני עוצמה ומנוחה מספקת לשמירת איכות.',VB_RICH_SOURCES.tools,'מבוסס על Server vs. Receivers and Hitters ומותאם לגברים בוגרים.'),
  makeDrill('m-setter-hitter','men','Ball–Setter / Ball–Hitter','לחדד קריאת כדור, מוסר ותוקף בחסימה.','התקפה מול חסימה והגנה עם קבלות באיכויות שונות.','החסימה קוראת כדור–מוסר–תוקף וההתקפה מנסה לנצל איחור.','קריאה לפני תנועה ומשמעת מול פיתיון.',VB_RICH_SOURCES.tools,'מבוסס על Ball-Setter/Ball-Hitter לקצב גברים בוגרים.'),
  makeDrill('m-read','men','Read the Hitter בקצב גבוה','לתאם חסימה והגנה מול תוקפים מהירים וחזקים.','תוקפים מול חסימה והגנה מלאה.','החסימה מגדירה מה נסגר, ההגנה מתמקמת וקוראת כתף; ממשיכים למעבר.','קשר בין ידיים בחסימה לעומק הגנה ומעבר מיידי.',VB_RICH_SOURCES.tools,'עיבוד של Read the Hitter לגברים בוגרים עם דגש על קריאה תחת קצב.')
];


const VOLLEYBALL_DRILL_MEDIA={
  'el-2v2':{
    videoUrl:'https://www.youtube.com/watch?v=iAsH4YZKyLc',
    images:[
      {src:'https://images.pexels.com/photos/15149190/pexels-photo-15149190.jpeg',alt:'אימון כדורעף לילדים באולם',credit:'Pexels'},
      {src:'https://storage.googleapis.com/msgsndr/aGagGPzv1aS4v8hffakm/media/686e81498796621b1544ef83.jpeg',alt:'אימון הגשה לנוער',credit:'Momentum Volleyball'}
    ],
    diagram:{title:'2×2 — רצף שלוש נגיעות',players:[['A1',28,145,'a'],['A2',72,145,'a'],['B1',28,35,'b'],['B2',72,35,'b']],arrows:[[28,145,50,112],[50,112,72,145],[72,145,50,72],[50,72,28,35]]}
  },
  'el-3skills':{
    videoUrl:'https://www.youtube.com/watch?v=iAsH4YZKyLc',
    images:[
      {src:'https://images.pexels.com/photos/15149190/pexels-photo-15149190.jpeg',alt:'ילדים מתרגלים עם כדורי כדורעף',credit:'Pexels'},
      {src:'https://images.pexels.com/photos/17557540/pexels-photo-17557540.jpeg',alt:'שחקניות צעירות באולם',credit:'Pexels'}
    ],
    diagram:{title:'קבלה → מסירה → העברה',players:[['1',25,150,'a'],['2',50,125,'a'],['3',75,150,'a'],['4',50,35,'b']],arrows:[[25,150,50,125],[50,125,75,150],[75,150,50,70]]}
  },
  'el-targets':{
    images:[
      {src:'https://storage.googleapis.com/msgsndr/aGagGPzv1aS4v8hffakm/media/686e81498796621b1544ef83.jpeg',alt:'שחקנים צעירים מתרגלים הגשה',credit:'Momentum Volleyball'},
      {src:'https://images.pexels.com/photos/6203671/pexels-photo-6203671.jpeg',alt:'שחקן מבצע הגשה',credit:'Pexels'}
    ],
    diagram:{title:'הגשה וקבלה למטרות',players:[['S',50,160,'a'],['R1',28,35,'b'],['R2',72,35,'b']],targets:[[20,18],[80,18]],arrows:[[50,155,28,42],[50,155,72,42]]}
  },
  'yb-scramble':{
    videoUrl:'https://www.youtube.com/watch?v=PxwxVLtKjYg',
    images:[
      {src:'https://images.pexels.com/photos/32681163/pexels-photo-32681163.jpeg',alt:'שחקן נוער בהתקפה',credit:'Pexels'},
      {src:'https://images.pexels.com/photos/6203671/pexels-photo-6203671.jpeg',alt:'שחקן באימון כדורעף',credit:'Pexels'}
    ],
    diagram:{title:'Scramble & Recover',players:[['D1',20,145,'a'],['D2',50,155,'a'],['D3',80,145,'a'],['T',50,35,'coach']],arrows:[[50,35,20,145],[20,145,50,118],[50,118,78,72]]}
  },
  'yb-oos':{
    videoUrl:'https://www.youtube.com/watch?v=PxwxVLtKjYg',
    images:[
      {src:'https://images.pexels.com/photos/32681163/pexels-photo-32681163.jpeg',alt:'תוקף צעיר קופץ באולם',credit:'Pexels'},
      {src:'https://images.pexels.com/photos/6203671/pexels-photo-6203671.jpeg',alt:'שחקן כדורעף באולם',credit:'Pexels'}
    ],
    diagram:{title:'4×4 מחוץ למערכת',players:[['D',20,150,'a'],['S2',50,135,'a'],['OH',82,115,'a'],['MB',50,98,'a'],['B1',25,42,'b'],['B2',75,42,'b']],arrows:[[20,150,50,135],[50,135,82,115],[82,115,70,55]]}
  },
  'yb-serve':{
    images:[
      {src:'https://storage.googleapis.com/msgsndr/aGagGPzv1aS4v8hffakm/media/686e81498796621b1544ef83.jpeg',alt:'תרגול הגשה קבוצתי',credit:'Momentum Volleyball'},
      {src:'https://images.pexels.com/photos/6203671/pexels-photo-6203671.jpeg',alt:'הגשת כדורעף',credit:'Pexels'}
    ],
    diagram:{title:'מגיש מול יחידת קבלה',players:[['S',50,162,'a'],['R1',22,35,'b'],['R2',50,28,'b'],['R3',78,35,'b'],['SET',50,68,'b']],arrows:[[50,156,22,42],[22,35,50,68]]}
  },
  'yg-dig-cover':{
    videoUrl:'https://www.youtube.com/watch?v=PxwxVLtKjYg',
    images:[
      {src:'https://images.pexels.com/photos/17557540/pexels-photo-17557540.jpeg',alt:'שחקניות נוער באולם',credit:'Pexels'},
      {src:'https://images.pexels.com/photos/30446999/pexels-photo-30446999.jpeg',alt:'שחקנית כדורעף באולם',credit:'Pexels'}
    ],
    diagram:{title:'Dig → Set → Cover',players:[['D',28,150,'a'],['S',50,122,'a'],['H',78,105,'a'],['C1',60,150,'a'],['ATT',50,30,'b']],arrows:[[50,35,28,150],[28,150,50,122],[50,122,78,105]]}
  },
  'yg-defend-set':{
    videoUrl:'https://www.youtube.com/watch?v=PxwxVLtKjYg',
    images:[
      {src:'https://images.pexels.com/photos/17557540/pexels-photo-17557540.jpeg',alt:'שחקניות צעירות במגרש',credit:'Pexels'},
      {src:'https://images.pexels.com/photos/30446999/pexels-photo-30446999.jpeg',alt:'שחקנית מחזיקה כדור',credit:'Pexels'}
    ],
    diagram:{title:'הגנה וכדור שני',players:[['D',30,150,'a'],['S2',58,130,'a'],['H',82,110,'a'],['T',50,30,'coach']],arrows:[[50,35,30,150],[30,150,58,130],[58,130,82,110]]}
  },
  'yg-read':{
    videoUrl:'https://www.youtube.com/watch?v=QRgANLdhOLU',
    images:[
      {src:'https://images.pexels.com/photos/17557540/pexels-photo-17557540.jpeg',alt:'נוער בנות באימון',credit:'Pexels'},
      {src:'https://stat.ameba.jp/user_images/20250310/07/jp-postman/6e/4b/j/o1024092815552884886.jpg',alt:'תרגול חסימה לנערות',credit:'Asaka Senior Volleyball Club'}
    ],
    diagram:{title:'Read the Hitter',players:[['D1',25,145,'a'],['D2',50,158,'a'],['D3',75,145,'a'],['H',72,35,'b'],['S',50,55,'b']],arrows:[[50,55,72,35],[72,35,25,145]]}
  },
  'w-coverage':{
    videoUrl:'https://www.youtube.com/watch?v=PxwxVLtKjYg',
    images:[
      {src:'https://images.pexels.com/photos/30446999/pexels-photo-30446999.jpeg',alt:'שחקנית מקצועית באולם',credit:'Pexels'},
      {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tijana_Bo%C5%A1kovi%C4%87_in_attack_%28team_Serbia%2C_2017%29.jpg',alt:'Tijana Bošković בהתקפה',credit:'Wikimedia Commons'}
    ],
    diagram:{title:'כיסוי התקפה ויציאה מחדש',players:[['H',78,105,'a'],['C1',62,135,'a'],['C2',82,145,'a'],['S2',45,130,'a'],['B',78,72,'b']],arrows:[[78,105,78,72],[75,80,62,135],[62,135,45,130],[45,130,78,105]]}
  },
  'w-middle':{
    videoUrl:'https://www.youtube.com/watch?v=QRgANLdhOLU',
    images:[
      {src:'https://images.squarespace-cdn.com/content/v1/61f1e4a2503a804251d2c0a6/ade4a78e-ea04-4385-b735-ed60a631c7ac/22%2B03%2B20%2B-%2B4413.jpg',alt:'תרגול חסימה מסונכרן',credit:'Melbourne Volleyball Academy'},
      {src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Paola_Egonu_18_U.S._ProVictoria_Pallavolo_Monza_WV_CEV_WCL_20260107_%2821%29.jpg',alt:'Paola Egonu במשחק',credit:'Wikimedia Commons'}
    ],
    diagram:{title:'Middle vs Middle',players:[['S',50,130,'a'],['M',50,105,'a'],['MB',50,74,'b'],['D',50,35,'b']],arrows:[[50,130,50,105],[50,105,50,65]]}
  },
  'w-risk':{
    images:[
      {src:'https://images.pexels.com/photos/30446999/pexels-photo-30446999.jpeg',alt:'שחקנית עם כדור לפני הגשה',credit:'Pexels'},
      {src:'https://storage.googleapis.com/msgsndr/aGagGPzv1aS4v8hffakm/media/686e81498796621b1544ef83.jpeg',alt:'תרגול הגשה',credit:'Momentum Volleyball'}
    ],
    diagram:{title:'Risk–Reward בהגשה',players:[['S',50,162,'a'],['R1',20,35,'b'],['R2',50,25,'b'],['R3',80,35,'b']],targets:[[16,18],[50,18],[84,18]],arrows:[[50,158,16,25],[50,158,50,25],[50,158,84,25]]}
  },
  'm-serve':{
    images:[
      {src:'https://images.pexels.com/photos/6203671/pexels-photo-6203671.jpeg',alt:'שחקן גברים בהגשה',credit:'Pexels'},
      {src:'https://images.pexels.com/photos/32681163/pexels-photo-32681163.jpeg',alt:'שחקן גברים בהתקפה',credit:'Pexels'}
    ],
    diagram:{title:'הגשה מול שלושה מקבלים',players:[['S',50,162,'a'],['R1',18,35,'b'],['R2',50,25,'b'],['R3',82,35,'b'],['SET',50,65,'b']],arrows:[[50,158,18,42],[18,35,50,65]]}
  },
  'm-setter-hitter':{
    videoUrl:'https://www.youtube.com/watch?v=QRgANLdhOLU',
    images:[
      {src:'https://images.squarespace-cdn.com/content/v1/61f1e4a2503a804251d2c0a6/ade4a78e-ea04-4385-b735-ed60a631c7ac/22%2B03%2B20%2B-%2B4413.jpg',alt:'תרגול חסימה',credit:'Melbourne Volleyball Academy'},
      {src:'https://stat.ameba.jp/user_images/20250310/07/jp-postman/6e/4b/j/o1024092815552884886.jpg',alt:'שתי חוסמות עולות לרשת',credit:'Asaka Senior Volleyball Club'}
    ],
    diagram:{title:'Ball → Setter → Hitter',players:[['B1',35,78,'a'],['B2',65,78,'a'],['S',50,45,'b'],['H',78,30,'b']],arrows:[[25,40,50,45],[50,45,78,30],[78,30,62,80]]}
  },
  'm-read':{
    videoUrl:'https://www.youtube.com/watch?v=QRgANLdhOLU',
    images:[
      {src:'https://images.squarespace-cdn.com/content/v1/61f1e4a2503a804251d2c0a6/ade4a78e-ea04-4385-b735-ed60a631c7ac/22%2B03%2B20%2B-%2B4413.jpg',alt:'שלושה חוסמים בתרגול',credit:'Melbourne Volleyball Academy'},
      {src:'https://images.pexels.com/photos/32681163/pexels-photo-32681163.jpeg',alt:'תוקף קופץ להנחתה',credit:'Pexels'}
    ],
    diagram:{title:'קריאת תוקף בקצב גבוה',players:[['D1',20,145,'a'],['D2',50,155,'a'],['D3',80,145,'a'],['B1',38,78,'a'],['B2',62,78,'a'],['H',78,32,'b']],arrows:[[78,32,62,78],[78,32,20,145]]}
  }
};

VOLLEYBALL_DRILL_LIBRARY.forEach(drill=>{
  const media=VOLLEYBALL_DRILL_MEDIA[drill.id];
  if(media)Object.assign(drill,media);
});

function makePopulationCard(population,topic,variant){
  const p=VB_POPULATION_PROFILES[population],t=VB_TOPIC_CONTENT[topic.id];
  const title=variant===0?`${t[0]}: ${t[1]}`:`${t[2]} — ${p.short}`;
  const text=variant===0?`${t[3]} עבור ${p.label}, ${p.lens}`:`${p.decision} בתחום ${t[0]}, ולכן התרגול חייב לשמר את המידע והבחירה ולא רק את צורת הביצוע.`;
  return {id:`rich-${population}-${topic.id}-${variant+1}`,kind:variant?'question':'concept',topic:topic.id,populations:[population],levels:['all'],title,text,detail:`${p.load} בסיום בודקים אם העיקרון מופיע גם תחת ניקוד, שינוי כדור ומעבר לפעולה הבאה.`,tags:[...t[4]],generatedForPopulation:population,populationRationale:p.rationale};
}

function drillCard(drill){
  return {id:`rich-drill-${drill.id}`,kind:'drill',topic:'drills',populations:[drill.population],levels:['all'],title:drill.title,text:`מטרה: ${drill.goal} סידור: ${drill.setup}`,detail:`ביצוע: ${drill.execution} דגשים: ${drill.coachingPoints}`,tags:['תרגילים','אימון'],generatedForPopulation:drill.population,populationRationale:VB_POPULATION_PROFILES[drill.population].rationale,sourceName:drill.sourceName,sourceUrl:drill.sourceUrl,adaptationNote:drill.adaptationNote,drill};
}

function buildEnrichedVolleyballCards(baseCards=[],populations=[],topics=[]){
  const cards=baseCards.map(card=>({...card}));
  for(const population of populations.map(p=>p.id).filter(id=>VB_POPULATION_PROFILES[id])){
    for(const topic of topics){
      if(topic.id==='drills')continue;
      cards.push(makePopulationCard(population,topic,0),makePopulationCard(population,topic,1));
    }
  }
  cards.push(...VOLLEYBALL_DRILL_LIBRARY.map(drillCard));
  return cards;
}

const galleryItem=(playerName,filename,license,credit,action)=>({playerName,action,license,credit,professional:true,imageUrl:`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`,creditUrl:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,alt:`${playerName} — ${action} בכדורעף מקצועני`});
const PROFESSIONAL_WOMEN_GALLERY=[
  galleryItem('Paola Egonu','Paola Egonu 18 U.S. ProVictoria Pallavolo Monza WV CEV WCL 20260107 (21).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק ליגת האלופות'),
  galleryItem('Tijana Bošković','Tijana Bošković in attack (team Serbia, 2017).jpg','CC BY-SA 2.0','Wikimedia Commons','הנחתה במדי נבחרת סרביה'),
  galleryItem('Zhu Ting','Zhu Ting 2018 03.jpg','CC BY-SA 4.0','Zorro2212 · Wikimedia Commons','במהלך משחק מקצועני'),
  galleryItem('Kathryn Plummer','Kathryn Plummer 22 Eczacıbaşı SK WV 20250409 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק בליגה הטורקית'),
  galleryItem('Elif Şahin','Elif Şahin 12 Eczacıbaşı SK WV TWVL 20251116 (9).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק בליגה הטורקית'),
  galleryItem('Cansu Özbay','Cansu Özbay 3 VakıfBank SK 20250409 (1).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק מקצועני')
];

function richEsc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function galleryHtml(image,cls=''){return `<figure class="vb-pro-photo ${cls}"><a href="${richEsc(image.creditUrl)}" target="_blank" rel="noopener"><img src="${richEsc(image.imageUrl)}" alt="${richEsc(image.alt)}" loading="lazy"><figcaption><strong>${richEsc(image.playerName)}</strong><span>${richEsc(image.action)}</span><small>${richEsc(image.license)} · ${richEsc(image.credit)}</small></figcaption></a></figure>`;}

function addDrillSources(root=document){
  if(typeof window==='undefined'||!root?.querySelectorAll)return;
  root.querySelectorAll('.vb-feed-card').forEach(el=>{
    if(el.querySelector('.vb-drill-source'))return;
    const title=el.querySelector('.vb-card-title-button')?.textContent?.trim()||el.querySelector('h3')?.textContent?.trim()||'';
    const card=(window.VOLLEYBALL_FEED_CARDS||[]).find(c=>c.title===title);
    if(!card?.sourceUrl)return;
    const box=document.createElement('div');box.className='vb-drill-source';
    box.innerHTML=`<b>מקור מקצועי</b><a href="${richEsc(card.sourceUrl)}" target="_blank" rel="noopener">${richEsc(card.sourceName)}</a><small>${richEsc(card.adaptationNote||'')}</small>`;
    const tags=el.querySelector('.vb-tags');(tags||el).insertAdjacentElement(tags?'beforebegin':'beforeend',box);
  });
}

function addInlinePhotos(){
  if(typeof document==='undefined')return;
  const feed=document.getElementById('volleyball-feed');if(!feed)return;
  const cards=[...feed.querySelectorAll('.vb-feed-card')];
  cards.forEach((card,index)=>{
    if((index+1)%5!==0||card.nextElementSibling?.classList.contains('vb-pro-photo-inline'))return;
    const image=PROFESSIONAL_WOMEN_GALLERY[Math.floor(index/5)%PROFESSIONAL_WOMEN_GALLERY.length];
    card.insertAdjacentHTML('afterend',galleryHtml(image,'vb-pro-photo-inline'));
  });
}

function installPhotoRails(){
  if(typeof document==='undefined'||document.querySelector('.vb-pro-rail'))return;
  ['right','left'].forEach((side,index)=>{const rail=document.createElement('aside');rail.className=`vb-pro-rail vb-pro-rail-${side}`;rail.setAttribute('aria-label','רגעים מכדורעף נשים מקצועני');rail.innerHTML=galleryHtml(PROFESSIONAL_WOMEN_GALLERY[index],'vb-pro-photo-rail');document.body.appendChild(rail);});
  let step=2;
  setInterval(()=>{
    document.querySelectorAll('.vb-pro-rail').forEach((rail,index)=>rail.innerHTML=galleryHtml(PROFESSIONAL_WOMEN_GALLERY[(step+index)%PROFESSIONAL_WOMEN_GALLERY.length],'vb-pro-photo-rail'));
    const hero=document.querySelector('.vb-hero-player:first-child'),image=PROFESSIONAL_WOMEN_GALLERY[step%PROFESSIONAL_WOMEN_GALLERY.length];
    if(hero){hero.href=image.creditUrl;const img=hero.querySelector('img'),caption=hero.querySelector('span');if(img){img.src=image.imageUrl;img.alt=image.alt;}if(caption)caption.textContent=`${image.playerName} · ${image.license}`;}
    step=(step+1)%PROFESSIONAL_WOMEN_GALLERY.length;
  },9000);
}

function installRichContentUI(){
  if(typeof document==='undefined')return;
  installPhotoRails();addDrillSources(document);addInlinePhotos();
  const feed=document.getElementById('volleyball-feed');if(!feed)return;
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addDrillSources(feed);addInlinePhotos();});}).observe(feed,{childList:true,subtree:true});
}

if(typeof window!=='undefined'){
  if(window.VOLLEYBALL_FEED_CARDS&&window.VOLLEYBALL_POPULATIONS&&window.VOLLEYBALL_TOPICS)window.VOLLEYBALL_FEED_CARDS=buildEnrichedVolleyballCards(window.VOLLEYBALL_FEED_CARDS,window.VOLLEYBALL_POPULATIONS,window.VOLLEYBALL_TOPICS);
  Object.assign(window,{VOLLEYBALL_DRILL_LIBRARY,PROFESSIONAL_WOMEN_GALLERY,buildEnrichedVolleyballCards,installRichContentUI});
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRichContentUI);else installRichContentUI();}
}
if(typeof module!=='undefined'&&module.exports)module.exports={VOLLEYBALL_DRILL_LIBRARY,PROFESSIONAL_WOMEN_GALLERY,VB_POPULATION_PROFILES,VB_TOPIC_CONTENT,buildEnrichedVolleyballCards,drillCard};
