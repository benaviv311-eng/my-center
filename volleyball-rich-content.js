const VOLLEYBALL_DRILL_SOURCES={
  usavLessonPlans:{name:'USA Volleyball · Lesson Plans',url:'https://usavolleyball.org/resources-for-coaches/lesson-plans/'},
  usavCoachTools:{name:'USA Volleyball · Coaches Tools',url:'https://usavolleyball.org/resources-for-coaches/coaches-tools/'},
  fivbResources:{name:'FIVB · Tools and Resources Centre',url:'https://www.fivb.com/inside-fivb/education/tools-and-resources-centre/'},
  fivbManual:{name:'FIVB · Coach Manual Level I',url:'https://www.fivb.com/wp-content/uploads/2024/03/FIVB_Coach_Manual_EN.pdf'},
  volleyballCanada:{name:'Volleyball Canada · Skills',url:'https://volleyball.ca/en/development/coach/skills'}
};

const D=(id,population,title,goal,players,equipment,setup,execution,coachingPoints,commonErrors,progression,source,adaptationNote)=>({
  id,population,title,goal,players,equipment,setup,execution,coachingPoints,commonErrors,progression,
  sourceName:source.name,sourceUrl:source.url,adaptationNote
});

const VOLLEYBALL_DRILL_LIBRARY=[
  D('drill-el-2v2','elementary','2×2: שלוש נגיעות דרך משחק','להגדיל מגעים, תנועה לפני הכדור והבנה של רצף ראשון–שני–שלישי.','4 בכל מגרשון','רשת נמוכה, כדורים, סימון מגרשים קטנים','מגרש קטן; זוג מול זוג. אפשר להתחיל בתפיסה־זריקה ולהתקדם למסירה אמיתית.','מגישים מלמטה או מכניסים כדור קל. הקבוצה מנסה להשתמש לפחות בשתי נגיעות לפני העברה ומקבלת בונוס על שלוש נגיעות.','הרבה כדורים פעילים במקביל; יעד ברור למגע השני; לעודד תנועה ולא עמידה במקום.','מגרש גדול מדי, תורים ארוכים, דרישה טכנית שמורידה את מספר הראליים.','להקטין/להגדיל מגרש, לעבור מתפיסה־זריקה למסירה, ולהוסיף אזורי ניקוד.',VOLLEYBALL_DRILL_SOURCES.usavLessonPlans,'התאמה לילדי יסודי על בסיס עקרונות המשחקים הקטנים והלמידה דרך משחק בתכניות USA Volleyball.'),
  D('drill-el-pass-set-hit','elementary','קבלה–מסירה–העברה מעל הרשת','לחבר שלוש פעולות פשוטות לרצף משחקי במקום לתרגל כל מיומנות בנפרד.','3–6 בכל תחנה','רשת, כדורים, מטרות','שלשות משני צדי הרשת; הכנסת כדור קלה למקבל.','מקבל מכוון לאזור מוסר, שחקן שני מרים כדור נוח, ושלישי שולח מעל הרשת. לאחר הפעולה מסתובבים תפקידים.','להעדיף רצף חי על דיוק מושלם; לשמור מרחק שמאפשר הצלחה; לתת יעד גדול.','המאמן נוגע ברוב הכדורים, תיקונים רבים מדי, או עצירה אחרי כל טעות.','להוסיף הגשה אמיתית, יעד התקפה או ראלי המשכי.',VOLLEYBALL_DRILL_SOURCES.usavLessonPlans,'גרסה פשוטה לילדים של תרגול רב־מיומנויות מעל רשת, עם דגש על הצלחה ורצף.'),
  D('drill-el-serve-receive','elementary','הגשה לאזור וקבלה למטרה','ללמד שהגשה וקבלה הן פעולות עם יעד ולא רק “להעביר את הכדור”.','4–8','רשת, כדורים, 3 אזורי מטרה','שני מגישים, שני מקבלים ומטרות רחבות.','המגיש בוחר אזור; המקבל מנסה לשלוח את הכדור לאזור מטרה. ניקוד ניתן על כוונה נכונה ועל כדור שניתן להמשך.','מרחק הגשה מותאם; מטרה גדולה; החלפת תפקידים תכופה.','לדרוש הגשה מלאה לפני שהילד מסוגל להגיע לרשת, או למדוד רק אייס/טעות.','להצר מטרות ולהוסיף מקבל שני והחלטת אחריות.',VOLLEYBALL_DRILL_SOURCES.volleyballCanada,'התאמה ליסודי לפי עקרונות שלב Learn to Train ומיומנויות בסיס של Volleyball Canada.'),

  D('drill-yb-scramble','youth-boys','Scramble & Recover — הגנה וחזרה למבנה','לפתח מעבר מהצלה לארגון מחדש תחת קצב ולחץ.','6–10','רשת וכדורים','קבוצה בהגנה; המאמן מכניס כדורים שמוציאים שחקנים מהמבנה.','אחרי כל הצלה הקבוצה חייבת להתארגן לכדור הבא ולהגיע למבנה התקפי לפני סיום הראלי.','איכות הצעד הראשון אחרי ההגנה; תקשורת מי מכסה; לא לעצור אחרי “הצלה יפה”.','לרדוף אחרי הכדור בלי חלוקת אחריות, או להפוך את התרגיל למבחן כושר.','להוסיף ניקוד על מעבר להתקפה או כדור שני מחוץ למערכת.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Scramble and Recover של USA Volleyball, עם התאמת נפח וקצב לנוער בתקופת גדילה.'),
  D('drill-yb-oos','youth-boys','4×4: מסירה מחוץ למערכת','ללמד פתרונות התקפיים כשהמוסר לא מגיע לכדור השני.','8–10','רשת וכדורים','4 מול 4; המאמן יוצר בכוונה מגע ראשון שמוציא את הכדור מאזור המוסר.','שחקן שאינו מוסר לוקח את הכדור השני ומייצר התקפה נשלטת; ממשיכים את הראלי.','גובה ומיקום כדור שני, זמינות תוקף בטוח, תקשורת מוקדמת.','לנסות כדור מהיר במצב לא יציב, או לחכות שמוסר יציל כל כדור.','להוסיף יעד התקפה, ניקוד על side-out מחוץ למערכת או 6×6.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על 4x4 Out of System Setting, מותאם לנוער בנים כדי לבנות אחריות משותפת ולא רק כוח התקפי.'),
  D('drill-yb-serve-pressure','youth-boys','מגיש מול מקבלים ותוקפים','לחבר יעד הגשה להשפעה על אפשרויות ההתקפה של היריב.','6–12','רשת, כדורים, לוח ניקוד','מגישים מול יחידת קבלה והתקפה.','המגיש מקבל נקודות לפי ירידה באפשרויות ההתקפה; המקבלים מקבלים נקודות על קבלה שמאפשרת כמה תוקפים.','לבחור יעד לפני ההגשה; למדוד תוצאה טקטית, לא רק אייס.','להעלות עוצמה בלי מטרה או לתת ניקוד רק על שגיאת קבלה.','להוסיף רוטציות ויעדי seam/קצר/עומק.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'עיבוד של Server vs. Receivers and Hitters למתבגרים, תוך שמירה על איכות כתף ונפח הגשות סביר.'),

  D('drill-yg-dig-set-cover','youth-girls','Dig–Set–Cover: הגנה שממשיכה להתקפה','לחבר הגנה, מסירה וכיסוי לפעולה רציפה.','6–10','רשת וכדורים','יחידת הגנה מול הכנסת כדור/התקפה מבוקרת.','אחרי הדיג חייבים מסירה להתקפה; מיד לאחר ההתקפה השחקניות נכנסות לכיסוי.','הגנה שמכוונת לכדור שני, מעבר מהיר מהקרקע, תקשורת על כיסוי.','להסתפק בדיג טוב בלי לבנות התקפה, או לעמוד אחרי ההנחתה.','להעלות קצב התקפות ולהוסיף חסימה חיה.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Dig-Set-Cover, עם דגש לנוער בנות על רצף, יציבות ותנועה בטוחה בין הפעולות.'),
  D('drill-yg-defend-set','youth-girls','Hawaii Defend & Set — הגנה ומסירה תחת לחץ','לפתח איכות כדור שני אחרי הגנה לא מושלמת.','6–10','רשת וכדורים','שחקניות בהגנה; כדורים מוזנים לאזורים משתנים.','המגנה הראשונה שומרת כדור חי; שחקנית אחרת חייבת להתארגן למסירה שניתנת להתקפה.','קריאה מוקדמת, עצירה מאוזנת לפני מסירה, תקשורת מי לוקחת שני.','כולן רצות לאותו כדור או שהכדור השני הופך “רק להחזיר”.','להוסיף תוקפת חיה וניקוד על התקפה מתוך כדור שני קשה.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Hawaii Defend and Set, מותאם לנוער בנות עם דגש על קבלת החלטות ולא על קצב בוגרות.'),
  D('drill-yg-read-hitter','youth-girls','Read the Hitter — לקרוא לפני שמגיבים','לפתח הגנה שמבוססת על מידע מהגישה, הכתף והכדור ולא על ניחוש.','6–12','רשת וכדורים','תוקפת מול מגנות; המאמן/מוסר משנה מיקום כדור.','המגנות מתחילות מעמדת בסיס, קוראות את התוקפת ומגיבות לכיוון/עוצמה. אחרי הדיג ממשיכים לראלי.','מבט על תוקפת לפני המגע, התאמה לחסימה, צעד ראשון קצר ומאוזן.','לזוז מוקדם מדי לפי הרגל, או להתמקד רק בכדור.','להוסיף חסימה, שינויי טיפ/רול־שוט והתקפה מקו אחורי.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Read the Hitter; הקצב והמרחקים מותאמים לנוער כדי לשמר איכות קריאה ונחיתה.'),

  D('drill-w-coverage-oos','women','Coverage & Out-of-System Play','לשמור יכולת התקפית גם אחרי חסימה נוגעת או קבלה שמוציאה מהמערכת.','8–12','רשת וכדורים','6×6 או יחידות; מאמן יוצר חסימה נוגעת/כדור שני קשה.','הקבוצה מכסה התקפה, מארגנת כדור שני מחוץ למערכת ובונה התקפה חדשה.','מרחקי כיסוי לפי התוקפת, תקשורת על מוסרת חלופית, בחירת התקפה עם מרווח בטחון.','כיסוי שטוח מדי או ניסיון לשמור קצב מהיר כשאין בסיס.','ניקוד כפול על נקודה אחרי כיסוי או על פתרון איכותי מחוץ למערכת.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Coverage & Out-of-System Play, מותאם לפיד נשים בוגרות עם חיבור לרוטציה ולמודל המשחק.'),
  D('drill-w-middle-v-middle','women','Middle vs Middle — מאבק על האמצע','לחבר זמינות אמצע, קבלת החלטת מוסרת וקריאת חסימה.','8–12','רשת וכדורים','שתי קבוצות עם אמצע; מתחילים מקבלה או free ball.','נקודות בונוס על יצירת איום אמצע איכותי או על חסימת אמצע שקוראת נכון.','איכות קבלה שמאפשרת אמצע, קצב יציאה, מיקום מוסרת וידיים של החוסמת.','לכפות סט לאמצע גם כשהמידע לא מתאים, או למדוד רק הריגה.','להוסיף קומבינציות pipe/קצה והחלטת חסימה לקריאת מוסרת.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Middle vs. Middle ומותאם לרמה בוגרת לנשים תוך דגש על זמינות ולא על כפיית כדור.'),
  D('drill-w-risk-reward','women','Risk–Reward: הגשה עם מחיר ורווח','לתרגל בחירת סיכון בהגשה לפי תוצאה, רוטציה ומקבלת מטרה.','6–12','רשת, כדורים, לוח ניקוד','קבוצות עם רצפי הגשה וקבלה; לכל סוג יעד ערך ניקוד שונה.','המגישה בוחרת יעד ורמת סיכון. הניקוד מתגמל לחץ איכותי אך מעניש טעויות לא מוצדקות.','להגדיר למה בוחרים סיכון, לעקוב אחרי איכות קבלה שנגרמה ולא רק אייס.','עוצמה מקסימלית בכל מצב או משחק ניקוד שאינו קשור להחלטה.','לשנות תוצאה/רוטציה ולהכריח בחירה מחדש.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Risk Reward, מותאם לנשים בוגרות כך שהניקוד מייצג החלטה טקטית ולא רק הצלחת הגשה.'),

  D('drill-m-server-v-receive','men','Server vs Receivers & Hitters — לחץ מדיד','למדוד כיצד הגשה משנה את מספר אפשרויות ההתקפה בקצב גבוה.','8–12','רשת, כדורים, סטטיסטיקה פשוטה','מגישים מול יחידת קבלה מלאה עם תוקפים.','אחרי כל הגשה מסמנים האם נשמרו 3 תוקפים, 2, או התקפה מחוץ למערכת; ממשיכים לראלי.','יעד לפני עוצמה, תכנון לפי רוטציה, מנוחה מספקת כדי לשמור איכות הגשה.','לספור רק אייסים או לצבור עשרות הגשות עייפות.','להוסיף רצף break-point וניקוד לפי איכות side-out היריבה.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Server vs. Receivers and Hitters ומותאם לגברים בוגרים עם דגש על איכות, מנוחה והשלכה על side-out.'),
  D('drill-m-ball-setter-hitter','men','Ball–Setter / Ball–Hitter — קריאת חסימה בקצב','לחדד קשר בין איכות הכדור, בחירת המוסר וסגירת החסימה.','8–12','רשת וכדורים','יחידת התקפה מול חסימה והגנה; איכות הקבלה משתנה.','החסימה קוראת תחילה כדור ומוסר ואז תוקף; ההתקפה מנסה לנצל איחור/פער.','קריאה לפני תנועה, צעד צולב יעיל, לא לקפוץ על כל פיתיון.','רדיפה אחרי התוקף בלי לקרוא מסירה או התחלה מוקדמת מדי.','להוסיף התקפה מהירה/pipe ושינויי קצב של המוסר.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'מבוסס על Ball-Setter/Ball-Hitter ומותאם לקצב גברים בוגרים בלי לוותר על איכות הקריאה.'),
  D('drill-m-read-hitter','men','Read the Hitter — חסימה והגנה מול מהירות','לשפר תיאום חסימה־הגנה מול תוקפים בעלי מהירות וכוח גבוהים.','8–12','רשת וכדורים','תוקפים מול חסימה והגנה מלאה; מסירות באיכויות שונות.','החסימה מגדירה מה היא סוגרת, ההגנה מתמקמת בהתאם וקוראת את כתף התוקף; ממשיכים מעבר.','קשר בין ידיים בחסימה לעומק הגנה, משמעת מול wipe וטיפ, מעבר מיידי.','מגן שפועל בלי קשר לחסימה או חוסם שמחפש רק roof.','להוסיף רוטציות, התקפה מהירה ומצבי out-of-system.',VOLLEYBALL_DRILL_SOURCES.usavCoachTools,'עיבוד של Read the Hitter לרמת גברים בוגרים, עם קצב גבוה אך אותה היררכיית מידע: כדור–מוסר–תוקף.')
];

const POPULATION_PROFILES={
  elementary:{label:'יסודי',short:'לומדים דרך משחק',rationale:'ביסודי המטרה היא לבנות אהבה למשחק, תנועה בטוחה, הרבה מגעים והבנת מרחב לפני העמסה של מערכת בוגרים.',lens:'המשימה צריכה להיות קצרה, משחקית וברורה, עם מעט המתנה והרבה הצלחות שמתקדמות בהדרגה.',decision:'החלטה אחת או שתיים בכל ראלי עדיפות על רשימת הוראות גוף.',load:'עומס נשלט דרך זמן משחק, גודל מגרש ומספר נגיעות, לא דרך עייפות מכוונת.'},
  'youth-boys':{label:'נוער בנים',short:'מתקדמים בזמן גדילה',rationale:'בנוער בנים צריך לחבר התפתחות טכנית וטקטית לשינויים בגוף, לקפיצות גדילה ולמעבר ההדרגתי לקצב תחרותי.',lens:'התרגול שומר על איכות תנועה וטכניקה בזמן שהמהירות והכוח עולים, ומוסיף אחריות טקטית בהדרגה.',decision:'השחקן נדרש לקרוא יריב ומבנה ולא להישען רק על יתרון פיזי.',load:'נפח קפיצות, הגשות ועבודה עצימה עולה בהדרגה ומופרד מימים שבהם המטרה היא איכות ומהירות.'},
  'youth-girls':{label:'נוער בנות',short:'יציבות, קריאה ומעבר',rationale:'בנוער בנות התוכן צריך לבנות יציבות טכנית, קריאת משחק, נחיתה וניהול עומס לצד מעבר הדרגתי לאחריות תחרותית.',lens:'התרגול מחבר איכות מגע להחלטה, תקשורת ומעבר בין פעולות, בלי להעתיק דרישות של קבוצת בוגרות.',decision:'המידע מההגשה, החסימה והתוקפת הוא חלק מהתרגיל ולא תוספת אחרי הטכניקה.',load:'קפיצות ונחיתות מקבלות דגש איכותי והתקדמות מדורגת, במיוחד כשהמורכבות והקצב עולים.'},
  women:{label:'נשים',short:'מודל משחק בוגרות',rationale:'בכדורעף נשים בוגרות התוכן צריך להתחבר לרוטציות, למערכי קבלה והגנה, לקצב המעבר, לנתונים ולזהות הטקטית של הקבוצה.',lens:'התרגול נבנה מתוך סיטואציה תחרותית אמיתית ומגדיר מהו היתרון שהקבוצה רוצה ליצור ברוטציה או מול יריבה.',decision:'החלטות מוסרת, מקבלות, חוסמות ומגנות נבחנות בהקשר של המערכת כולה.',load:'עומס נמדד מול לוח המשחקים, נפח קפיצות/התקפות והתאוששות, כדי לשמר איכות לאורך עונה.'},
  men:{label:'גברים',short:'קצב, לחץ ומהירות',rationale:'בכדורעף גברים בוגרים הקצב, מהירות ההגשה וההתקפה והגובה מעל הרשת מחייבים תוכן שמחבר כוח לקריאה, תזמון ומבנה.',lens:'התרגול מייצר זמן החלטה קצר, לחץ הגשה, התקפה מהירה ומעבר, אך עדיין מודד איכות ולא רק עוצמה.',decision:'היתרון נוצר מקריאה מוקדמת ודיוק תחת קצב, לא רק מיכולת פיזית.',load:'איכות חזרות עצימות דורשת מנוחות מספקות וניהול נפח כדי שהתרגיל לא יהפוך מאימון מהירות לאימון עייפות.'}
};

const TOPIC_BLUEPRINTS={
  technique:{label:'טכניקה',a:'פתרון טכני שמשרת את הכדור הבא',b:'יציבות טכנית תחת שינוי',core:'טכניקה נבחנת לפי היכולת לייצר תוצאה שימושית כשהמסלול, הקצב והלחץ משתנים.',tags:['טכניקה','ביצוע']},
  tactics:{label:'טקטיקה',a:'לזהות יתרון לפני שמבצעים',b:'עיקרון טקטי לפני תבנית קבועה',core:'טקטיקה מתחילה בזיהוי מידע ובבחירת פתרון שמגדיל את אפשרויות הקבוצה או מצמצם את אפשרויות היריב.',tags:['טקטיקה','קבלת החלטות']},
  positions:{label:'עמדות ותפקידים',a:'תפקיד הוא אחריות בתוך מערכת',b:'מה העמדה צריכה לדעת לפני המגע',core:'עמדה בכדורעף אינה רק מקום במגרש; היא אוסף אחריויות שמשתנות לפי הרוטציה והכדור.',tags:['עמדות','תפקידים']},
  systems:{label:'מערכות משחק',a:'מערכת טובה מייצרת אפשרויות',b:'לשמור מבנה גם כשהכדור יוצא מהתכנון',core:'מערכת משחק צריכה להסביר מי אחראי למה ואיך הקבוצה מתארגנת מחדש כשהמהלך אינו מושלם.',tags:['מערכות','ארגון']},
  rotations:{label:'רוטציות',a:'לקרוא את הרוטציה כיתרונות וחולשות',b:'מה משתנה ברגע ההגשה',core:'כל רוטציה משנה מקבלים, תוקפים, חסימה ומסלולי תנועה ולכן דורשת פתרונות ייחודיים.',tags:['רוטציות','מבנה']},
  'decision-making':{label:'קבלת החלטות',a:'לקרוא לפני שנוגעים בכדור',b:'החלטה טובה גם כשהתוצאה לא מושלמת',core:'איכות החלטה נמדדת לפי המידע שהיה זמין והמטרה, ולא רק לפי התוצאה הסופית של הכדור.',tags:['קבלת החלטות','קריאת משחק']},
  'serve-receive':{label:'הגשה וקבלה',a:'הגשה וקבלה כמאבק על אפשרויות',b:'יעד לפני עוצמה, מבנה לפני אסתטיקה',core:'ההגשה מנסה לצמצם אפשרויות והקבלה מנסה לשמר אותן; לכן שתיהן פעולות טקטיות וטכניות יחד.',tags:['הגשה','קבלה']},
  attack:{label:'התקפה',a:'להגיע לכדור עם יותר מפתרון אחד',b:'התקפה לפי חסימה ולא לפי הרגל',core:'התקפה איכותית מחברת תזמון, מסלול גישה, מיקום הכדור וקריאת החסימה.',tags:['התקפה','תזמון']},
  'block-defense':{label:'חסימה והגנה',a:'חסימה והגנה הן מערכת אחת',b:'לסגור שטח ולכוון את התוקף',core:'החסימה מגדירה חלק מהשטח וההגנה משלימה אותה; ניתוח של אחת בלי השנייה מפספס את המערכת.',tags:['חסימה','הגנה']},
  transition:{label:'מעבר',a:'הפעולה הבאה מתחילה לפני שהקודמת נגמרת',b:'מהגנה להתקפה בלי עצירה',core:'מעבר איכותי הוא היכולת לשנות תפקיד במהירות ולייצר מבנה חדש מיד אחרי המגע.',tags:['מעבר','transition']},
  drills:{label:'תרגילים',a:'תרגיל שמלמד משחק ולא תור',b:'מדד הצלחה שמחובר למטרה',core:'תרגיל טוב מייצר את המידע וההחלטה שרוצים לראות במשחק ומאפשר מספיק חזרות איכותיות.',tags:['תרגילים','אימון']},
  'motor-learning':{label:'למידה מוטורית',a:'למידה שנשארת גם כשהתרגיל משתנה',b:'פידבק שמפתח פתרון עצמאי',core:'למידה מוטורית דורשת שונות, זמן, פידבק מדויק והעברה לתנאים משתנים ולא רק הצלחה רגעית באימון סגור.',tags:['למידה מוטורית','פידבק']},
  'practice-design':{label:'בניית אימון',a:'לבנות אימון סביב בעיה מקצועית',b:'קצב, חזרות והחלטות באותה יחידה',core:'אימון איכותי מתחיל במטרה אחת ברורה ומסדר את המשימות כך שכל שלב מכין לשלב הבא.',tags:['בניית אימון','עומס']},
  'small-sided':{label:'משחקונים',a:'פחות שחקנים, יותר החלטות',b:'לשנות חוק כדי לשנות התנהגות',core:'משחקונים קטנים מגדילים מעורבות ומאפשרים לשנות מרחב, ניקוד וחוקים כדי להדגיש עיקרון.',tags:['משחקונים','constraints']},
  'video-analysis':{label:'ניתוח וידאו',a:'לנתח מידע ולא רק טעויות',b:'לעצור רגע לפני ההחלטה',core:'וידאו מועיל כשהוא מחזיר אותנו למידע שהיה זמין לפני הפעולה ומחבר אותו להחלטה ולביצוע.',tags:['וידאו','ניתוח']},
  statistics:{label:'סטטיסטיקה ומדדים',a:'מספר בלי הקשר לא מסביר משחק',b:'לחתוך נתונים לפי רוטציה ומצב',core:'מדד הופך לכלי אימון רק כשהוא מחובר לשאלה מקצועית ולהקשר שבו נוצר.',tags:['סטטיסטיקה','נתונים']},
  physiology:{label:'פיזיולוגיה',a:'מה הגוף צריך כדי לשמור איכות',b:'להבדיל בין עייפות לאימון איכות',core:'הדרישות הפיזיולוגיות של כדורעף הן מאמצים קצרים ועצימים החוזרים לאורך אימון ומשחק עם צורך בהתאוששות.',tags:['פיזיולוגיה','עומס']},
  'jump-power':{label:'קפיצה וכוח מתפרץ',a:'גובה ניתור מתחיל באיכות כוח ומהירות',b:'איכות קפיצה לפני נפח',core:'כוח מתפרץ דורש חזרות מהירות ואיכותיות, תזמון וגישה יעילה, ולא צבירת קפיצות עייפות.',tags:['קפיצה','כוח']},
  'speed-movement':{label:'מהירות ותנועה',a:'הצעד הראשון נולד מהמידע',b:'להאיץ למקום הנכון, לא רק מהר',core:'מהירות משחקית היא שילוב של קריאה, תגובה, האצה ובלימה למיקום הנכון.',tags:['מהירות','תנועה']},
  'landing-load':{label:'נחיתה ועומסים',a:'לנחות כדי להיות מוכן לפעולה הבאה',b:'עומס נבנה מאיכות ונפח יחד',core:'נחיתה היא בלימת כוח חוזרת; איכותה ונפח הקפיצות קובעים יחד את דרישת העומס.',tags:['נחיתה','עומסים']},
  'shoulder-injury':{label:'כתף ומניעת פציעות',a:'כתף בריאה מתחילה בניהול נפח',b:'להפריד כאב מעייפות ולפעול בזמן',core:'בריאות כתף תלויה בנפח הנחתות והגשות, כוח, טווחי תנועה, התאוששות והתקדמות עומס.',tags:['כתף','מניעת פציעות']},
  'player-development':{label:'פיתוח שחקן',a:'לפתח יכולת ולא רק לנצח היום',b:'השלב הבא צריך להיות מאתגר אך אפשרי',core:'פיתוח שחקן הוא רצף ארוך של מיומנות, הבנת משחק, יכולת גופנית ועצמאות בקבלת החלטות.',tags:['פיתוח שחקן','התפתחות']},
  communication:{label:'תקשורת במשחק',a:'קריאה מוקדמת שווה זמן',b:'מילון קבוצתי קצר ועקבי',core:'תקשורת טובה נותנת מידע לפני הפעולה ומבהירה אחריות, במקום רק להגיב אחרי שכבר נוצרה בעיה.',tags:['תקשורת','אחריות']},
  rules:{label:'חוקי המשחק',a:'חוק שמשנה החלטה טקטית',b:'להכיר את החוק כדי לנצל מרחב וזמן',core:'חוקי הכדורעף משפיעים על עמדות פתיחה, חילופים, מגעים, הגשה וחסימה ולכן הם גם כלי טקטי.',tags:['חוקים','טקטיקה']},
  history:{label:'היסטוריה והתפתחות',a:'איך שינוי חוק יצר משחק חדש',b:'מהעבר אפשר להבין את הטקטיקה של היום',core:'התפתחות החוקים, הניקוד והתפקידים מסבירה מדוע הכדורעף המודרני נראה ומתאמן כפי שהוא היום.',tags:['היסטוריה','התפתחות']},
  world:{label:'כדורעף בעולם',a:'ללמוד מסגנון אחר בלי להעתיק אותו',b:'איזה עיקרון אפשר לקחת מתרבות כדורעף אחרת',core:'ליגות ונבחרות שונות מדגישות קצב, הגנה, גובה, שליטה או לחץ בדרכים שונות; הערך הוא בזיהוי העיקרון.',tags:['כדורעף בעולם','סגנונות']},
  'coaching-methods':{label:'מאמנים ושיטות',a:'לשנות סביבה לפני עוד נאום',b:'שאלה טובה יכולה ללמד יותר מתשובה',core:'שיטת אימון טובה בוחרת מתי להסביר, מתי לשאול ומתי לשנות חוק או מרחב כדי שהמשחק ילמד.',tags:['שיטות אימון','אימון']},
  myths:{label:'מיתוסים וטעויות נפוצות',a:'לבדוק כלל לפני שהופכים אותו לאמת',b:'להפריד מסורת מעיקרון מקצועי',core:'מיתוס אימון נולד לעיתים מכלל שעובד במצב אחד ומיושם כאילו הוא נכון תמיד; צריך לבדוק הקשר ותוצאה.',tags:['מיתוסים','טעויות נפוצות']}
};

function generatedCard(population,topic,variant){
  const profile=POPULATION_PROFILES[population];
  const bp=TOPIC_BLUEPRINTS[topic.id];
  const angle=variant===0?bp.a:bp.b;
  const title=variant===0?`${bp.label}: ${angle}`:`${angle} — ${profile.short}`;
  const text=variant===0
    ?`${bp.core} עבור ${profile.label}, ${profile.lens}`
    :`${profile.decision} בתחום ${bp.label}, המטרה היא ${bp.core.replace(/^[^ ]+ /,'')}`;
  const detail=`${profile.load} בדקו באימון האם ההתנהגות שרציתם מופיעה גם כשמגיע כדור שונה, תחת ניקוד ובמעבר לפעולה הבאה.`;
  return {
    id:`rich-${population}-${topic.id}-${variant+1}`,
    kind:variant===0?'concept':'question',
    topic:topic.id,
    populations:[population],
    levels:['all'],
    title,text,detail,
    tags:[...bp.tags],
    generatedForPopulation:population,
    populationRationale:profile.rationale
  };
}

function drillToCard(drill){
  return {
    id:drill.id,
    kind:'drill',
    topic:'drills',
    populations:[drill.population],
    levels:['all'],
    title:drill.title,
    text:`מטרה: ${drill.goal} סידור: ${drill.setup}`,
    detail:`ביצוע: ${drill.execution} דגשים: ${drill.coachingPoints}`,
    tags:['תרגילים','אימון'],
    generatedForPopulation:drill.population,
    populationRationale:POPULATION_PROFILES[drill.population].rationale,
    sourceName:drill.sourceName,
    sourceUrl:drill.sourceUrl,
    adaptationNote:drill.adaptationNote,
    drill
  };
}

function buildEnrichedVolleyballCards(baseCards=[],populations=[],topics=[]){
  const output=baseCards.map(card=>({...card}));
  for(const population of populations.map(item=>item.id).filter(id=>POPULATION_PROFILES[id])){
    for(const topic of topics){
      if(topic.id==='drills')continue;
      output.push(generatedCard(population,topic,0),generatedCard(population,topic,1));
    }
  }
  output.push(...VOLLEYBALL_DRILL_LIBRARY.map(drillToCard));
  return output;
}

const galleryFile=(playerName,filename,license,credit,action)=>({
  playerName,action,license,credit,professional:true,
  imageUrl:`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename).replace(/%2F/g,'/')}`,
  creditUrl:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename).replace(/%2F/g,'/')}`,
  alt:`${playerName} — ${action} בכדורעף מקצועני`
});

const PROFESSIONAL_WOMEN_GALLERY=[
  galleryFile('Paola Egonu','Paola Egonu 18 U.S. ProVictoria Pallavolo Monza WV CEV WCL 20260107 (21).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק ליגת האלופות'),
  galleryFile('Tijana Bošković','Tijana Bošković in attack (team Serbia, 2017).jpg','CC BY-SA 2.0','Wikimedia Commons','הנחתה במדי נבחרת סרביה'),
  galleryFile('Zhu Ting','Zhu Ting 2018 03.jpg','CC BY-SA 4.0','Zorro2212 · Wikimedia Commons','במהלך משחק מקצועני'),
  galleryFile('Kathryn Plummer','Kathryn Plummer 22 Eczacıbaşı SK WV 20250409 (4).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק בליגה הטורקית'),
  galleryFile('Elif Şahin','Elif Şahin 12 Eczacıbaşı SK WV TWVL 20251116 (9).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק בליגה הטורקית'),
  galleryFile('Cansu Özbay','Cansu Özbay 3 VakıfBank SK 20250409 (1).jpg','CC BY 4.0','Zafer · Wikimedia Commons','במהלך משחק מקצועני')
];

function escapeRich(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({"&":'&amp;',"<":'&lt;',">":'&gt;',"\"":'&quot;',"'":'&#39;'}[ch]));
}

function renderGalleryFigure(image,extraClass=''){
  return `<figure class="vb-pro-photo ${extraClass}"><a href="${escapeRich(image.creditUrl)}" target="_blank" rel="noopener"><img src="${escapeRich(image.imageUrl)}" alt="${escapeRich(image.alt)}" loading="lazy"><figcaption><strong>${escapeRich(image.playerName)}</strong><span>${escapeRich(image.action)}</span><small>${escapeRich(image.license)} · ${escapeRich(image.credit)}</small></figcaption></a></figure>`;
}

function decorateDrillSources(root=document){
  if(typeof window==='undefined'||!root?.querySelectorAll)return;
  root.querySelectorAll('.vb-feed-card').forEach(el=>{
    if(el.querySelector('.vb-drill-source'))return;
    const title=el.querySelector('.vb-card-title-button')?.textContent?.trim()||el.querySelector('h3')?.textContent?.trim()||'';
    const card=(window.VOLLEYBALL_FEED_CARDS||[]).find(item=>item.title===title);
    if(!card?.sourceUrl)return;
    const block=document.createElement('div');
    block.className='vb-drill-source';
    block.innerHTML=`<b>מקור מקצועי</b><a href="${escapeRich(card.sourceUrl)}" target="_blank" rel="noopener">${escapeRich(card.sourceName)}</a><small>${escapeRich(card.adaptationNote||'')}</small>`;
    const tags=el.querySelector('.vb-tags');
    (tags||el).insertAdjacentElement(tags?'beforebegin':'beforeend',block);
  });
}

function decorateInlineGallery(){
  if(typeof document==='undefined')return;
  const feed=document.getElementById('volleyball-feed');
  if(!feed)return;
  feed.querySelectorAll('.vb-pro-photo-inline').forEach(node=>node.remove());
  const cards=[...feed.querySelectorAll('.vb-feed-card')];
  cards.forEach((card,index)=>{
    if((index+1)%5!==0)return;
    const image=PROFESSIONAL_WOMEN_GALLERY[(Math.floor(index/5))%PROFESSIONAL_WOMEN_GALLERY.length];
    card.insertAdjacentHTML('afterend',renderGalleryFigure(image,'vb-pro-photo-inline'));
  });
}

function installSideGallery(){
  if(typeof document==='undefined'||document.querySelector('.vb-pro-rail'))return;
  ['right','left'].forEach((side,idx)=>{
    const rail=document.createElement('aside');
    rail.className=`vb-pro-rail vb-pro-rail-${side}`;
    rail.setAttribute('aria-label','רגעים מכדורעף נשים מקצועני');
    rail.innerHTML=renderGalleryFigure(PROFESSIONAL_WOMEN_GALLERY[idx],'vb-pro-photo-rail');
    document.body.appendChild(rail);
  });
  let step=2;
  setInterval(()=>{
    document.querySelectorAll('.vb-pro-rail').forEach((rail,idx)=>{
      const image=PROFESSIONAL_WOMEN_GALLERY[(step+idx)%PROFESSIONAL_WOMEN_GALLERY.length];
      rail.innerHTML=renderGalleryFigure(image,'vb-pro-photo-rail');
    });
    const hero=document.querySelector('.vb-hero-player:first-child');
    if(hero){
      const image=PROFESSIONAL_WOMEN_GALLERY[step%PROFESSIONAL_WOMEN_GALLERY.length];
      hero.href=image.creditUrl;
      const img=hero.querySelector('img');
      const caption=hero.querySelector('span');
      if(img){img.src=image.imageUrl;img.alt=image.alt;}
      if(caption)caption.textContent=`${image.playerName} · ${image.license}`;
    }
    step=(step+1)%PROFESSIONAL_WOMEN_GALLERY.length;
  },9000);
}

function installRichContentUI(){
  if(typeof document==='undefined')return;
  installSideGallery();
  decorateDrillSources(document);
  decorateInlineGallery();
  const feed=document.getElementById('volleyball-feed');
  if(!feed)return;
  let queued=false;
  const refresh=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      decorateDrillSources(feed);
      decorateInlineGallery();
    });
  };
  new MutationObserver(refresh).observe(feed,{childList:true,subtree:true});
}

if(typeof window!=='undefined'){
  if(window.VOLLEYBALL_FEED_CARDS&&window.VOLLEYBALL_POPULATIONS&&window.VOLLEYBALL_TOPICS){
    window.VOLLEYBALL_FEED_CARDS=buildEnrichedVolleyballCards(window.VOLLEYBALL_FEED_CARDS,window.VOLLEYBALL_POPULATIONS,window.VOLLEYBALL_TOPICS);
  }
  Object.assign(window,{VOLLEYBALL_DRILL_LIBRARY,PROFESSIONAL_WOMEN_GALLERY,buildEnrichedVolleyballCards,installRichContentUI});
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRichContentUI);
    else installRichContentUI();
  }
}

if(typeof module!=='undefined'&&module.exports){
  module.exports={VOLLEYBALL_DRILL_LIBRARY,PROFESSIONAL_WOMEN_GALLERY,POPULATION_PROFILES,TOPIC_BLUEPRINTS,buildEnrichedVolleyballCards,drillToCard};
}
