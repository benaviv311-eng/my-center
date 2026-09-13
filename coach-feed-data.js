(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.CoachFeedData=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const COACH_TOPICS=[
    {id:'sport-psychology',label:'פסיכולוגיה של הספורט',icon:'🧠',page:'coach-sport-psychology.html'},
    {id:'coaching-psychology',label:'פסיכולוגיית אימון',icon:'🎯',page:'coach-coaching-psychology.html'},
    {id:'movement-psychology',label:'פסיכולוגיה של תנועה',icon:'🌀',page:'coach-movement-psychology.html'},
    {id:'explosive-power',label:'כוח מתפרץ',icon:'⚡',page:'coach-explosive-power.html'},
    {id:'coaching-language',label:'שפת אימון',icon:'💬',page:'coach-coaching-language.html'},
    {id:'volleyball-approaches',label:'גישות לכדורעף',icon:'🏐',page:'coach-volleyball-approaches.html'}
  ];

  const COACH_FEED_CARDS=[
    {id:'sp-1',topic:'sport-psychology',type:'concept',title:'מסוגלות עצמית',body:'ביטחון יציב נבנה מחוויות הצלחה שהשחקן יודע לשייך ליכולת שלו.',application:'בכדורעף: בנה שתי הצלחות מדידות לפני העלאת רמת הקושי.',source:'ספריית הלמידה — מסוגלות עצמית',sourceKind:'summary',tags:['ביטחון'],image:'https://images.pexels.com/photos/6767224/pexels-photo-6767224.jpeg?auto=compress&cs=tinysrgb&w=1100',imageAlt:'מאמן כדורסל מדריך שחקנית צעירה באימון אישי'},
    {id:'sp-2',topic:'sport-psychology',type:'application',title:'אחרי טעות: איפוס קצר',body:'המטרה איננה למחוק את הטעות אלא לקצר את הזמן שבו היא ממשיכה לשלוט בקשב.',application:'תרגל נשיפה, מילת מפתח ומבט למטרה הבאה גם באימון.',tags:['לחץ','קשב']},
    {id:'sp-q',topic:'sport-psychology',type:'question',challenge:true,title:'מה עדיף אחרי שתי טעויות?',question:'שחקנית פספסה שתי קבלות ומתחילה להימנע מהכדור. מה עדיף לעשות קודם?',options:['לתת ארבעה תיקונים מיד','לתת משימה פשוטה שמאפשרת הצלחה מהירה','להוציא אותה מהתרגיל','לומר רק אל תפחדי'],correctOption:1,explanation:'משימה ברורה ברמת קושי מתאימה יכולה להחזיר תחושת שליטה ומסוגלות.',principle:'מסוגלות עצמית וויסות לחץ',application:'בכדורעף: הגדל זמנית את אזור המטרה ואז החזר בהדרגה את הדרישה המקורית.'},

    {id:'cp-1',topic:'coaching-psychology',type:'concept',title:'לא כל חזרה צריכה תיקון',body:'משוב מתמיד עלול ליצור תלות במאמן. לפעמים עדיף לראות כמה חזרות ואז להתערב.',application:'בקבלה או בהנחתה קבע חלון של שלוש חזרות לפני משוב, אם אין בעיית בטיחות.',tags:['משוב']},
    {id:'cp-2',topic:'coaching-psychology',type:'scenario',title:'שאלה לפני פתרון',body:'לפני שאתה אומר מה השתבש, שאל שאלה קצרה שמכוונת את השחקן לזהות את הבעיה.',application:'נסה: מה ראית לפני המגע? או איפה הייתה המטרה שלך?',tags:['למידה'],image:'https://images.pexels.com/photos/6767015/pexels-photo-6767015.jpeg?auto=compress&cs=tinysrgb&w=1100',imageAlt:'מאמן ושחקנים מנתחים יחד משימה במהלך אימון'},
    {id:'cp-q',topic:'coaching-psychology',type:'question',title:'מתי לתת את התשובה?',question:'שחקן חוזר על טעות ונראה שהוא מזהה שמשהו לא עובד. מה עדיף לנסות קודם?',options:['לתת פתרון מלא מיד','לשאול מה הוא מזהה ומה ישנה בחזרה הבאה','להתעלם עד סוף האימון','להעלות את הקול'],correctOption:1,explanation:'שאלה ממוקדת מעודדת ארגון מידע ועצמאות; אם אין כיוון, המאמן מוסיף רמז אחד.',principle:'Guided discovery ואוטונומיה',application:'בכדורעף: שאל שאלה אחת ואז תן Cue אחד לחזרה הבאה.'},

    {id:'mp-1',topic:'movement-psychology',type:'concept',title:'מיקוד חיצוני',body:'לעיתים יעיל יותר לכוון את הקשב להשפעת התנועה על הכדור או המטרה ולא לכל איבר בגוף.',application:'במקום יישר מרפקים, נסה שלח את הכדור במסלול נמוך אל המוסר.',tags:['External Focus'],image:'https://images.pexels.com/photos/35420838/pexels-photo-35420838.jpeg?auto=compress&cs=tinysrgb&w=1100',imageAlt:'ספורטאי מבצע תרגיל שינוי כיוון בין קונוסים'},
    {id:'mp-2',topic:'movement-psychology',type:'practice',title:'אימון מבולגן יכול ללמד טוב יותר',body:'שינוי תנאים וקבלת החלטות יכולים לשפר הסתגלות והעברה למשחק.',application:'בכדורעף: ערבב עומק, אזור ומהירות סרב כשהטכניקה הבסיסית כבר קיימת.',tags:['Random Practice']},
    {id:'mp-q',topic:'movement-psychology',type:'question',title:'איזה Cue יותר חיצוני?',question:'איזה ניסוח משתמש יותר ב-External Focus בזמן קבלה?',options:['סגור את הכתפיים','יישר את המרפקים','שלח את הכדור בקשת נמוכה אל ידיים של המוסר','כופף יותר ברכיים'],correctOption:2,explanation:'הניסוח מתמקד בתוצאה של הפעולה על הכדור ובמטרה בסביבה.',principle:'External Focus of Attention',application:'בכדורעף: הגדר יעד חיצוני ברור לפני הוספת תיקוני גוף.'},

    {id:'ep-1',topic:'explosive-power',type:'concept',title:'RFD: כמה מהר הכוח מופיע',body:'בפעולות קצרות כמו קפיצה וחסימה אין זמן רב לבנות כוח, לכן קצב פיתוח הכוח חשוב לצד כוח מרבי.',application:'בכדורעף: שלב בסיס כוח עם תרגילים מהירים ומתפרצים המתאימים לרמת הספורטאי.',source:'סיכום עקרונות מקובלים במדעי הכוח',sourceKind:'research-summary',evidenceStrength:'חזק',tags:['RFD']},
    {id:'ep-2',topic:'explosive-power',type:'research',title:'פליאומטריקה: איכות לפני עוד נפח',body:'עייפות גבוהה יכולה לשנות את איכות הקפיצות, ולכן לא כל אימון קפיצה צריך להיות ארוך.',application:'עצור סט כשגובה הקפיצה או שליטת הנחיתה יורדים באופן ברור.',source:'סיכום עקרונות אימון פליאומטרי',sourceKind:'research-summary',evidenceStrength:'חזק',tags:['פליאומטריקה'],image:'https://images.pexels.com/photos/16966336/pexels-photo-16966336.jpeg?auto=compress&cs=tinysrgb&w=1100',imageAlt:'ספורטאים באימון כוח עצים בחדר כושר'},
    {id:'ep-q',topic:'explosive-power',type:'question',title:'עוד קפיצות או קפיצות טובות?',question:'באימון כוח מתפרץ גובה הקפיצה יורד והנחיתות כבדות. מה הפעולה הסבירה ביותר?',options:['להוסיף סט','להמשיך עד מספר קבוע','להפחית או לעצור ולשמור על איכות','לעבור לסיבולת ארוכה'],correctOption:2,explanation:'כאשר איכות יורדת, התרגיל פחות מייצג את מטרת הכוח המתפרץ.',principle:'ניהול עייפות ואיכות נוירומסקולרית',application:'בכדורעף: השתמש בסף איכות לסיום סט.'},

    {id:'cl-1',topic:'coaching-language',type:'concept',title:'משפט אחד לחזרה אחת',body:'Cue אחד מאפשר ניסיון ברור ומשוב ברור יותר מעודף הוראות.',application:'לפני סרב בחר מסר אחד, למשל מטרה עמוקה 1, ורק אחרי החזרה הוסף מידע.',tags:['Cue']},
    {id:'cl-2',topic:'coaching-language',type:'application',title:'אחרי טעות: תאר את הפעולה הבאה',body:'שפה יעילה אחרי טעות מתארת מה לעשות עכשיו יותר מאשר מה אסור שיקרה שוב.',application:'במקום אל תברחי מהכדור, נסה צעד ראשון לכיוון הכדור והישארי מאחוריו.',tags:['ניסוח'],image:'https://images.pexels.com/photos/6077808/pexels-photo-6077808.jpeg?auto=compress&cs=tinysrgb&w=1100',imageAlt:'מאמן מתדרך קבוצת ספורט במהלך אימון'},
    {id:'cl-q',topic:'coaching-language',type:'question',title:'איזה ניסוח הכי שימושי?',question:'שחקנית נוגעת שוב ושוב ברשת בחסימה. איזה Cue הכי פעולה-מכוונת?',options:['אל תיגעי ברשת','את שוב קרובה מדי','קפצי מעלה והשאירי רווח קטן מהרשת','תתרכזי יותר'],correctOption:2,explanation:'הניסוח מתאר פעולה שאפשר לבצע מיד ומכוון לפתרון.',principle:'Actionable coaching language',application:'בכדורעף: העדף מסר שמגדיר מה לעשות בחזרה הבאה.'},

    {id:'va-1',topic:'volleyball-approaches',type:'concept',title:'Game-Based: שמור את הבעיה בתוך התרגיל',body:'אפשר לבנות משחקון קטן שבו הבעיה הטקטית אמיתית אבל התנאים פשוטים יותר.',application:'כדי לעבוד על קבלה והתקפה, שחק 3 על 3 עם ניקוד כפול על Side-Out אחרי קבלה לא מושלמת.',tags:['Game-Based'],image:'https://images.pexels.com/photos/6203512/pexels-photo-6203512.jpeg?auto=compress&cs=tinysrgb&w=1100',imageAlt:'שחקנים מתאמנים בכדורעף באולם'},
    {id:'va-2',topic:'volleyball-approaches',type:'practice',title:'Constraint הוא דרך לעצב החלטות',body:'שינוי חוק, שטח, נגיעות או ניקוד יכול לדחוף שחקנים לחפש פתרון בלי להסביר כל תנועה.',application:'אם רוצים יותר שימוש בקו, תן בונוס לנקודה שמסתיימת באזור הקו.',tags:['Constraints-Led']},
    {id:'va-q',topic:'volleyball-approaches',type:'question',title:'איך להפוך תרגיל לחי יותר?',question:'בקבלה כולם יודעים מראש לאן הסרב יגיע והתרגיל נהיה אוטומטי. מה שינוי משחקי יותר?',options:['להאריך את התור','להוסיף עוד הסבר לפני כל כדור','לאפשר למגיש לבחור בין שני אזורי יעד','להוריד את הרשת'],correctOption:2,explanation:'בחירה אמיתית למגיש מחזירה מידע ואי-ודאות שהמקבל צריך לקרוא.',principle:'Perception-action coupling ו-Game-Based Learning',application:'בכדורעף: התחל בשתי אפשרויות והרחב אחרי הצלחה.'}
  ];

  function resolveInitialTopic(value){
    return COACH_TOPICS.some(topic=>topic.id===value)?value:'all';
  }

  return {COACH_TOPICS,COACH_FEED_CARDS,resolveInitialTopic};
});