(function(root,factory){
  const api = factory();
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  if(root) root.LibraryDiscovery = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){
  'use strict';

  const LEARNING_CONCEPTS = [
    {id:'self-efficacy',title:'מסוגלות עצמית',type:'🧠 פסיכולוגיה',sourceKind:'related-concept',keywords:['מסוגלות','ביטחון','יכולת','התמדה','למידה','הצלחה'],explanation:'האמונה של אדם ביכולת שלו לבצע משימה משפיעה על בחירת מטרות, מאמץ והתמדה.',example:'שחקן שמצליח בכמה משימות קטנות מתחיל לגשת גם לאתגר קשה יותר בביטחון.',application:'בנה רצף הצלחות קטן ומדיד לפני העלאת רמת הקושי.'},
    {id:'implementation-intentions',title:'כוונות יישום',type:'🧩 כלי יישומי',sourceKind:'related-concept',keywords:['הרגל','הרגלים','מטרה','שינוי','התמדה','תכנון'],explanation:'תוכנית מסוג “אם X קורה, אז אני עושה Y” מחברת בין מצב לפעולה ומקלה על ביצוע.',example:'אם אני מסיים ארוחת ערב, אני מכין מיד את ציוד האימון למחר.',application:'נסח פעולה אחת בתבנית אם–אז.'},
    {id:'habit-loop',title:'לולאת הרגל',type:'🔁 התנהגות',sourceKind:'related-concept',keywords:['הרגל','הרגלים','שגרה','התנהגות','תגמול','סביבה'],explanation:'הרגלים נוטים להתייצב סביב רמז, פעולה ותגמול שחוזרים יחד.',example:'צליל הודעה הוא רמז, פתיחת הטלפון היא הפעולה והסקרנות שנרגעת היא תגמול.',application:'זהה את הרמז שמתחיל את ההרגל לפני ניסיון לשנות אותו.'},
    {id:'operant-conditioning',title:'התניה אופרנטית וחיזוק',type:'🧪 תיאוריה',sourceKind:'related-concept',keywords:['חיזוק','תגמול','עונש','התנהגות','הרגל','למידה'],explanation:'השלכות של התנהגות משפיעות על הסיכוי שהיא תחזור בעתיד.',example:'משוב חיובי מיידי אחרי ביצוע מדויק יכול לחזק את החזרה עליו.',application:'חבר תגמול קרוב בזמן להתנהגות שאתה רוצה לחזק.'},
    {id:'intrinsic-motivation',title:'מוטיבציה פנימית',type:'🔥 מוטיבציה',sourceKind:'related-concept',keywords:['מוטיבציה','משמעות','בחירה','עצמאות','עניין','מטרה'],explanation:'אנשים מתמידים יותר כאשר הפעילות עצמה מעניינת, משמעותית או מחוברת לערכים שלהם.',example:'תלמיד שקורא כי הנושא מסקרן אותו ממשיך גם בלי ציון.',application:'חפש מה בפעולה עצמה נותן תחושת בחירה, עניין או משמעות.'},
    {id:'self-determination',title:'תיאוריית ההכוונה העצמית',type:'🧠 פסיכולוגיה',sourceKind:'related-concept',keywords:['מוטיבציה','אוטונומיה','שייכות','מסוגלות','בחירה','צוות'],explanation:'מוטיבציה מתחזקת כשיש תחושת אוטונומיה, מסוגלות ושייכות.',example:'שחקן שמקבל בחירה בתוך מסגרת ברורה מרגיש יותר בעלות על התהליך.',application:'בדוק איזה משלושת הצרכים חסר כרגע: בחירה, מסוגלות או שייכות.'},
    {id:'growth-mindset',title:'דפוס חשיבה מתפתח',type:'🌱 למידה',sourceKind:'related-concept',keywords:['למידה','טעות','מאמץ','התפתחות','כישרון','יכולת'],explanation:'האמונה שיכולות יכולות להתפתח משנה את האופן שבו מפרשים קושי, משוב וטעות.',example:'טעות באימון נתפסת כמידע על מה לתרגל ולא כהוכחה ש“אני לא טוב”.',application:'החלף שיפוט קבוע בשאלה: מה הדבר הבא שאפשר לשפר?'},
    {id:'deliberate-practice',title:'תרגול מכוון',type:'🎯 למידה',sourceKind:'related-concept',keywords:['תרגול','מיומנות','מומחיות','משוב','אימון','שיפור'],explanation:'שיפור מהיר יותר מתרחש בתרגול ממוקד בחולשה מוגדרת עם משוב וחזרה מכוונת.',example:'במקום “להתאמן שעה”, עובדים עשר דקות רק על קבלה בזווית בעייתית.',application:'בחר חולשה אחת, מדד אחד ומשוב אחד לסבב התרגול הבא.'},
    {id:'cognitive-load',title:'עומס קוגניטיבי',type:'🧠 למידה',sourceKind:'related-concept',keywords:['למידה','זיכרון','מידע','עומס','קשב','הוראה'],explanation:'לזיכרון העבודה קיבולת מוגבלת, ולכן עודף מידע בו־זמני מקשה על למידה.',example:'הסבר של חמישה תיקונים טכניים בבת אחת גורם לשחקן לזכור כמעט אף אחד מהם.',application:'חלק הסבר מורכב לצעד אחד או שניים בכל פעם.'},
    {id:'metacognition',title:'מטה־קוגניציה',type:'🧭 למידה',sourceKind:'related-concept',keywords:['למידה','חשיבה','שיקוף','מודעות','זיכרון','שיפור'],explanation:'היכולת לחשוב על החשיבה שלנו עוזרת לזהות מה הבנו, מה לא ומה צריך לשנות.',example:'אחרי שיעור התלמיד שואל את עצמו מה הוא באמת יכול להסביר בלי להסתכל.',application:'סיים למידה בשתי שאלות: מה הבנתי? איפה אני עדיין לא בטוח?'},
    {id:'confirmation-bias',title:'הטיית אישור',type:'🧠 הטיה קוגניטיבית',sourceKind:'related-concept',keywords:['הטיה','הטיות','שיפוט','דעה','אמונה','החלטה','מידע'],explanation:'אנחנו נוטים לחפש ולזכור מידע שתומך במה שכבר חשבנו ולהמעיט במידע שסותר אותנו.',example:'מאמן שמשוכנע ששחקן “לא ממושמע” שם לב בעיקר למקרים שמחזקים את התווית.',application:'חפש במכוון ראיה אחת שסותרת את ההשערה שלך.'},
    {id:'anchoring',title:'הטיית עיגון',type:'⚓ קבלת החלטות',sourceKind:'related-concept',keywords:['עיגון','הטיה','מספר','מחיר','החלטה','שיפוט','הערכה'],explanation:'המידע הראשון שאנחנו פוגשים יכול למשוך אליו את ההערכה שלנו גם כשהוא לא רלוונטי מספיק.',example:'מחיר פתיחה גבוה במשא ומתן משפיע על הטווח שנראה לנו סביר.',application:'לפני חשיפה לעוגן, קבע טווח עצמאי משלך.'},
    {id:'framing-effect',title:'אפקט המסגור',type:'🖼️ קבלת החלטות',sourceKind:'related-concept',keywords:['מסגור','החלטה','בחירה','שיפוט','סיכון','הפסד','רווח'],explanation:'אותו מידע יכול להוביל להחלטות שונות בהתאם לאופן שבו הוא מוצג כרווח או כהפסד.',example:'“90% הצלחה” נשמע אחרת מ“10% כישלון” אף שמדובר באותו נתון.',application:'נסח את אותה החלטה גם במסגרת של רווח וגם במסגרת של הפסד.'},
    {id:'loss-aversion',title:'שנאת הפסד',type:'📉 קבלת החלטות',sourceKind:'related-concept',keywords:['הפסד','סיכון','כלכלה','החלטה','בחירה','רווח'],explanation:'הכאב מהפסד נתפס לעיתים כחזק יותר מההנאה מרווח מקביל.',example:'אדם מחזיק השקעה חלשה כי מכירה תהפוך את ההפסד ל“אמיתי”.',application:'שאל מה היית בוחר אילו התחלת היום בלי בעלות קודמת.'},
    {id:'availability-heuristic',title:'היוריסטיקת הזמינות',type:'🧠 הטיה קוגניטיבית',sourceKind:'related-concept',keywords:['זמינות','הטיה','זיכרון','סיכון','שיפוט','החלטה'],explanation:'אירועים שקל לנו להיזכר בהם מרגישים שכיחים או חשובים יותר מכפי שהם באמת.',example:'אירוע דרמטי אחד גורם לנו להעריך סיכון כגבוה יותר מנתונים מצטברים.',application:'לפני מסקנה, בדוק שכיחות אמיתית ולא רק דוגמה זכירה.'},
    {id:'fundamental-attribution',title:'טעות הייחוס הבסיסית',type:'👥 פסיכולוגיה חברתית',sourceKind:'related-concept',keywords:['אופי','התנהגות','חברה','שיפוט','אדם','יחסים'],explanation:'אנחנו נוטים להסביר התנהגות של אחרים דרך האופי שלהם ולהמעיט בכוחו של המצב.',example:'איחור נתפס כעצלנות לפני שבודקים אילוצים חיצוניים.',application:'לפני תווית אישיותית, ציין לפחות הסבר מצבי אפשרי אחד.'},
    {id:'social-proof',title:'הוכחה חברתית',type:'👥 פסיכולוגיה חברתית',sourceKind:'related-concept',keywords:['חברה','קבוצה','השפעה','נורמה','שייכות','בחירה'],explanation:'כשאנחנו לא בטוחים מה נכון, אנחנו משתמשים בהתנהגות של אחרים כרמז.',example:'מסעדה עמוסה נתפסת לעיתים כאיכותית יותר עוד לפני שטעמנו.',application:'בדוק אם הבחירה שלך מבוססת על ראיות או על מה שהקבוצה עושה.'},
    {id:'social-identity',title:'תיאוריית הזהות החברתית',type:'👥 קבוצה וזהות',sourceKind:'related-concept',keywords:['זהות','קבוצה','שייכות','אנחנו','הם','צוות','מנהיגות'],explanation:'חלק מהזהות האישית נבנה מהקבוצות שאליהן אנחנו מרגישים שייכים.',example:'שחקנים משקיעים יותר כש“אנחנו” הקבוצתי מרגיש משמעותי ולא רק אוסף יחידים.',application:'נסח מה הקבוצה מייצגת מעבר לתוצאה.'},
    {id:'groupthink',title:'חשיבת יחד',type:'👥 קבלת החלטות בקבוצה',sourceKind:'related-concept',keywords:['קבוצה','מנהיגות','החלטה','קונצנזוס','צוות','ביקורת'],explanation:'בקבוצה מלוכדת הרצון להסכמה יכול לדכא ביקורת ולהוביל להחלטות חלשות.',example:'אף אחד לא מערער על תוכנית המנהל כי כולם מניחים שהאחרים מסכימים.',application:'מנה “פרקליט ספק” שתפקידו להציג טיעון נגד לפני החלטה.'},
    {id:'psychological-safety',title:'ביטחון פסיכולוגי',type:'🤝 צוותים',sourceKind:'related-concept',keywords:['צוות','מנהיגות','טעות','שייכות','ביקורת','למידה','קבוצה'],explanation:'בסביבה עם ביטחון פסיכולוגי אנשים מרגישים שהם יכולים לשאול, להודות בטעות ולהציע רעיון בלי פחד מהשפלה.',example:'שחקן אומר שלא הבין תרגיל במקום להעמיד פנים שהוא יודע.',application:'הגב לטעות הראשונה בשיחה בסקרנות לפני ביקורת.'},
    {id:'learned-helplessness',title:'חוסר אונים נלמד',type:'🧠 פסיכולוגיה',sourceKind:'related-concept',keywords:['כישלון','שליטה','מסוגלות','ייאוש','מוטיבציה','התמדה'],explanation:'חשיפה חוזרת לחוסר שליטה עלולה לגרום לאדם להפסיק לנסות גם כשהמצב משתנה.',example:'תלמיד שנכשל שוב ושוב מפסיק להשקיע כי הוא מצפה שכישלון ממילא בלתי נמנע.',application:'צור משימה שבה יש קשר ברור בין פעולה לתוצאה מוצלחת.'},
    {id:'locus-of-control',title:'מוקד שליטה',type:'🧭 פסיכולוגיה',sourceKind:'related-concept',keywords:['שליטה','אחריות','מסוגלות','מוטיבציה','גורל','בחירה'],explanation:'אנשים שונים במידה שבה הם מייחסים תוצאות לפעולות שלהם לעומת גורמים חיצוניים.',example:'אחרי הפסד, שחקן יכול להתמקד בשופט או בבחירות שהוא עצמו יכול לשנות.',application:'הפרד בין מה שבשליטתך, בהשפעתך ומחוץ לשליטתך.'},
    {id:'emotion-regulation',title:'ויסות רגשי',type:'❤️ פסיכולוגיה',sourceKind:'related-concept',keywords:['רגש','לחץ','כעס','פחד','תגובה','שליטה','ביצוע'],explanation:'ויסות רגשי הוא היכולת להשפיע על עוצמת הרגש, משכו והתגובה אליו בלי למחוק אותו.',example:'לפני תגובה לכישלון, נשימה והשהיה קצרה משנות את איכות ההחלטה הבאה.',application:'בנה תגובת עצירה קבועה של 10 שניות לפני החלטה תחת לחץ.'},
    {id:'yerkes-dodson',title:'חוק ירקס–דודסון',type:'⚡ ביצוע ולחץ',sourceKind:'related-concept',keywords:['לחץ','ביצוע','עוררות','חרדה','מוטיבציה','ספורט'],explanation:'ביצוע נוטה להיות מיטבי ברמת עוררות בינונית; מעט מדי או יותר מדי עוררות עלולים לפגוע בביצוע.',example:'לפני משחק, שחקן אדיש ושחקן מוצף יכולים שניהם לבצע פחות טוב.',application:'זהה מה מעלה או מוריד אותך לטווח העוררות המתאים.'},
    {id:'delayed-gratification',title:'דחיית סיפוקים',type:'⏳ שליטה עצמית',sourceKind:'related-concept',keywords:['סיפוק','פיתוי','שליטה','מטרה','עתיד','הרגל','התמדה'],explanation:'בחירה בתגמול מאוחר וגדול יותר דורשת ניהול פיתוי ותכנון של הסביבה.',example:'ללמוד עכשיו כדי לפנות ערב חופשי במקום לדחות שוב ושוב.',application:'הקטן את נגישות הפיתוי במקום להסתמך רק על כוח רצון.'},
    {id:'goal-gradient',title:'אפקט שיפוע המטרה',type:'🏁 מוטיבציה',sourceKind:'related-concept',keywords:['מטרה','התקדמות','מוטיבציה','סיום','יעד','התמדה'],explanation:'המוטיבציה נוטה לעלות ככל שאנחנו מרגישים קרובים יותר ליעד.',example:'בסוף אתגר של 30 יום קל יותר לגייס מאמץ לעוד יומיים.',application:'הפוך מטרה רחוקה לאבני דרך קצרות עם תחושת התקדמות נראית.'},
    {id:'sunk-cost',title:'כשל העלות השקועה',type:'💸 קבלת החלטות',sourceKind:'related-concept',keywords:['עלות','השקעה','החלטה','כסף','זמן','הפסד','התמדה'],explanation:'אנו נוטים להמשיך בדרך לא טובה רק משום שכבר השקענו בה זמן, כסף או מאמץ.',example:'נשארים בפרויקט כושל כי “כבר השקענו בו שנה”.',application:'שאל: אילו לא הייתי משקיע עד היום, האם הייתי בוחר בזה עכשיו?'},
    {id:'peak-end',title:'כלל השיא והסוף',type:'🧠 זיכרון וחוויה',sourceKind:'related-concept',keywords:['זיכרון','חוויה','סוף','רגש','שירות','הוראה'],explanation:'אנשים זוכרים חוויה במידה רבה לפי רגע השיא שלה ואיך הסתיימה, לא לפי הממוצע של כל רגעיה.',example:'אימון קשה יכול להיזכר כחיובי אם הייתה הצלחה משמעותית וסיום טוב.',application:'תכנן במכוון את הדקות האחרונות של חוויה חשובה.'}
  ];

  function str(value){ return value == null ? '' : String(value); }
  function arr(value){ return Array.isArray(value) ? value.filter(Boolean) : []; }
  function textForBook(book){
    const c = book && book.content ? book.content : {};
    return [book && book.title, c.category, c.summary]
      .concat(arr(c.topics), arr(c.ideas), arr(c.feed_posts))
      .map(str).join(' ').toLowerCase();
  }
  function hash(text){
    let h = 2166136261;
    text = str(text);
    for(let i=0;i<text.length;i++){ h ^= text.charCodeAt(i); h = Math.imul(h,16777619); }
    return h >>> 0;
  }
  function scoreConcept(concept, text){
    return concept.keywords.reduce((score,keyword) => score + (text.includes(str(keyword).toLowerCase()) ? 1 : 0), 0);
  }
  function matchConcepts(book, limit){
    limit = Math.max(0, Number(limit) || 3);
    const text = textForBook(book);
    const scored = LEARNING_CONCEPTS.map(c => ({concept:c, score:scoreConcept(c,text)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score || hash((book.slug||book.id||'') + a.concept.id)-hash((book.slug||book.id||'') + b.concept.id));
    if(scored.length) return scored.slice(0,limit).map(x=>x.concept);
    return LEARNING_CONCEPTS.slice()
      .sort((a,b)=>hash((book.slug||book.id||'')+a.id)-hash((book.slug||book.id||'')+b.id))
      .slice(0,Math.min(limit,2));
  }
  const NUGGET_STOP_WORDS = new Set([
    'the','and','that','this','with','from','into','when','then','than','your','you','are','for','can','will','was','were','has','have','had',
    'של','את','על','עם','זה','זו','הוא','היא','גם','אם','לא','כי','מה','איך','יותר','יכול','יכולה','אפשר','אשר','כל','אחד','אחת','בין'
  ]);
  function nuggetTokens(value){
    return str(value).toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu,' ').split(/\s+/)
      .filter(token=>token.length>2 && !NUGGET_STOP_WORDS.has(token));
  }
  function nuggetSimilarity(a,b){
    const left=new Set(nuggetTokens(a)),right=new Set(nuggetTokens(b));
    if(!left.size||!right.size)return 0;
    let overlap=0;left.forEach(token=>{if(right.has(token))overlap++});
    return overlap/(left.size+right.size-overlap);
  }
  function nuggetHeadline(value){
    const clean=str(value).replace(/\s+/g,' ').trim();
    if(!clean)return '';
    const first=(clean.split(/(?<=[.!?])\s+|[;:–—]\s*/)[0]||clean).trim();
    const words=first.split(/\s+/).filter(Boolean);
    if(words.length<=8)return first.replace(/[.!?]+$/,'');
    return words.slice(0,7).join(' ')+'…';
  }
  function nuggetKind(value,sourceType){
    const text=str(value).toLowerCase();
    if(sourceType==='idea')return {kind:'idea',type:'◆ רעיון מפתח'};
    if(sourceType==='summary')return {kind:'summary',type:'◌ בתמצית'};
    if(/\b(?:instead|rather than|not the same|versus|unlike)\b|\bבמקום\b|\bאלא\b|\bלעומת\b|\bאינו\b|\bאינה\b/i.test(text))return {kind:'distinction',type:'◐ הבחנה'};
    if(/\b(?:for example|example|for instance)\b|\bלמשל\b|\bלדוגמה\b/i.test(text))return {kind:'example',type:'◎ דוגמה'};
    if(/\b(?:try|use|choose|build|start|stop|focus|notice|check|identify|make)\b|\b(?:נסה|בחר|בנה|התחל|עצור|התמקד|שים לב|בדוק|זהה)\b/i.test(text))return {kind:'practical',type:'→ עיקרון מעשי'};
    return {kind:'insight',type:'✦ תובנה'};
  }
  function topicForNugget(topics,value,seed,index){
    topics=arr(topics).map(str).filter(Boolean);
    if(!topics.length)return 'רעיון מהספר';
    const textTokens=new Set(nuggetTokens(value));
    const ranked=topics.map((topic,topicIndex)=>{
      const score=nuggetTokens(topic).reduce((total,token)=>total+(textTokens.has(token)?1:0),0);
      return {topic,score,topicIndex};
    }).sort((a,b)=>b.score-a.score || a.topicIndex-b.topicIndex);
    if(ranked[0]&&ranked[0].score>0)return ranked[0].topic;
    return topics[(hash(str(seed)+'|topic|'+index)+index)%topics.length];
  }
  function buildBookNuggets(book,seed){
    const c=book&&book.content?book.content:{};
    const prefix=book&&(book.slug||book.id||book.title)?(book.slug||book.id||book.title):'book';
    const raw=[];
    arr(c.feed_posts).forEach((value,index)=>raw.push({value:str(value),sourceType:'post',sourceIndex:index}));
    arr(c.ideas).forEach((value,index)=>raw.push({value:str(value),sourceType:'idea',sourceIndex:index}));
    str(c.summary).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=28).slice(0,6)
      .forEach((value,index)=>raw.push({value,sourceType:'summary',sourceIndex:index}));

    const deduped=[];
    raw.forEach(item=>{
      if(!item.value)return;
      const duplicate=deduped.some(existing=>nuggetSimilarity(existing.value,item.value)>=0.72);
      if(!duplicate)deduped.push(item);
    });

    const built=deduped.map((item,index)=>{
      const meta=nuggetKind(item.value,item.sourceType);
      const topic=topicForNugget(c.topics,item.value,seed||prefix,index);
      const headline=nuggetHeadline(item.value);
      return {
        id:`${prefix}|nugget|${item.sourceType}|${item.sourceIndex}`,
        bookId:book.id,bookTitle:book.title,bookSlug:book.slug||'',
        sourceKind:'book',sourceLabel:'מתוך חומר הספר',
        type:meta.type,kind:meta.kind,headline,title:headline,
        topic,text:item.value
      };
    });
    return seed?shuffled(built,str(seed)+'|book-nuggets'):built;
  }
  function nativePosts(book){
    return buildBookNuggets(book,(book.slug||book.id||book.title||'book')+'|native');
  }
  function conceptPosts(book){
    return matchConcepts(book,2).map((c,index)=>({
      id:`${book.slug||book.id}|concept|${c.id}`,
      bookId:book.id,bookTitle:book.title,bookSlug:book.slug||'',sourceKind:c.sourceKind,sourceLabel:'מושג מקצועי קשור',
      type:c.type,kind:'related',headline:nuggetHeadline(c.explanation),title:c.title,
      topic:arr(book&&book.content&&book.content.topics)[index]||c.title,
      text:c.explanation,example:c.example,application:c.application,conceptId:c.id
    }));
  }
  function buildDiscoveryPool(books){
    const pool=[];
    arr(books).forEach(book=>{ nativePosts(book).forEach(x=>pool.push(x)); conceptPosts(book).forEach(x=>pool.push(x)); });
    return pool;
  }
  function shuffled(items,seed){
    return items.slice().sort((a,b)=>hash(seed+'|'+a.id)-hash(seed+'|'+b.id));
  }
  function takeCandidate(primary,secondary,out){
    const last=out.length?out[out.length-1]:null;
    const take=(list,predicate)=>{
      if(!list.length)return null;
      const index=list.findIndex(predicate);
      return index>=0?list.splice(index,1)[0]:null;
    };
    const differentBook=item=>!last||item.bookId!==last.bookId;
    const differentBookAndTopic=item=>differentBook(item)&&(!last||!item.topic||item.topic!==last.topic);
    return take(primary,differentBookAndTopic)
      ||take(primary,differentBook)
      ||take(secondary,differentBookAndTopic)
      ||take(secondary,differentBook)
      ||(primary.length?primary.shift():secondary.shift()||null);
  }
  function buildRandomFeed(options){
    options = options || {};
    const count = Math.max(1, Number(options.count)||18);
    const seed = str(options.seed||Date.now());
    const pool = buildDiscoveryPool(options.books||[]);
    const native = shuffled(pool.filter(item=>item.sourceKind==='book'),seed+'|native');
    const related = shuffled(pool.filter(item=>item.sourceKind!=='book'),seed+'|related');
    const out=[];
    while((native.length||related.length)&&out.length<count){
      const wantRelated=out.length%5===4;
      const primary=wantRelated?related:native;
      const secondary=wantRelated?native:related;
      const next=takeCandidate(primary,secondary,out);
      if(next)out.push(next);else break;
    }
    return out;
  }

  function pick(list, seed, offset){
    list = arr(list);
    if(!list.length) return '';
    return list[hash(str(seed)+'|'+str(offset)) % list.length];
  }
  function buildBookSections(book, seed){
    seed = str(seed || 'book');
    const c = book && book.content ? book.content : {};
    const concepts = shuffled(matchConcepts(book,8).map(x=>({id:x.id, value:x})), seed+'|concepts').map(x=>x.value);
    const concept = index => concepts[index % Math.max(1,concepts.length)] || LEARNING_CONCEPTS[hash(seed+'|fallback|'+index)%LEARNING_CONCEPTS.length];
    const c0=concept(0), c1=concept(1), c2=concept(2), c3=concept(3);
    const passage = pick(c.feed_posts, seed, 'passage') || c.summary || pick(c.ideas,seed,'passage-idea');
    const idea = pick(c.ideas, seed, 'idea') || c.summary || passage;
    const topic = pick(c.topics, seed, 'topic');
    const prefix = book && (book.slug || book.id || book.title) ? (book.slug || book.id || book.title) : 'book';
    const make = (kind,title,text,sourceLabel,extra) => Object.assign({
      id:`${prefix}|section|${kind}|${hash(seed+'|'+kind+'|'+text)}`,
      kind,title,text,sourceLabel
    },extra||{});
    return [
      make('passage','📖 קטע / פסקה ללמידה',str(passage),'מתוך חומר הספר'),
      make('idea','💡 רעיון כללי',str(idea),'מתוך חומר הספר'),
      make('theory',`🧪 תיאוריה: ${c0.title}`,c0.explanation,'מושג מקצועי קשור',{conceptId:c0.id}),
      make('psychology',`🧠 הפסיכולוגיה: ${c1.title}`,c1.explanation,'הרחבה מקצועית',{conceptId:c1.id}),
      make('approach',`🔭 גישה נוספת: ${c2.title}`,c2.explanation,'הרחבה מקצועית',{conceptId:c2.id}),
      make('aspect',`🔎 היבט נוסף: ${c3.title}`,c3.explanation,'הרחבה מקצועית',{conceptId:c3.id}),
      make('everyday','👀 איך זה מתבטא ביום־יום',c0.example,'יישום של מושג מקצועי',{conceptId:c0.id}),
      make('application','🛠️ יישום מעשי',c1.application,'יישום של מושג מקצועי',{conceptId:c1.id}),
      make('real-life','🌍 דוגמה מהחיים',c2.example,'דוגמה מקצועית',{conceptId:c2.id}),
      topic ? make('topic','🗺️ נושא להעמקה',str(topic),'מתוך מפת הנושאים של הספר') : null,
      make('reflection','❓ שאלה למחשבה',`איפה בחיים שלך אפשר לזהות את ${c0.title}, ומה היית בוחר לעשות אחרת אחרי שמזהים אותו?`,'שאלת העמקה של ChatGPT',{conceptId:c0.id})
    ].filter(x=>x && x.text);
  }

  return {LEARNING_CONCEPTS,matchConcepts,buildBookNuggets,buildDiscoveryPool,buildRandomFeed,buildBookSections,hash};
});
