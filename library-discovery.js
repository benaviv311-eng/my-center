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
  function nativePosts(book){
    const c = book && book.content ? book.content : {};
    const base = [];
    arr(c.feed_posts).slice(0,4).forEach((text,index)=>base.push({
      id:`${book.slug||book.id}|book-post|${index}`,bookId:book.id,bookTitle:book.title,bookSlug:book.slug||'',sourceKind:'book',sourceLabel:'מתוך חומר הספר',type:'📖 מתוך הספר',title:book.title,text:str(text)
    }));
    arr(c.ideas).slice(0,2).forEach((text,index)=>base.push({
      id:`${book.slug||book.id}|idea|${index}`,bookId:book.id,bookTitle:book.title,bookSlug:book.slug||'',sourceKind:'book',sourceLabel:'מתוך חומר הספר',type:'💡 רעיון מהספר',title:book.title,text:str(text)
    }));
    if(!base.length && c.summary){
      base.push({id:`${book.slug||book.id}|summary`,bookId:book.id,bookTitle:book.title,bookSlug:book.slug||'',sourceKind:'book',sourceLabel:'מתוך חומר הספר',type:'📖 תקציר',title:book.title,text:str(c.summary)});
    }
    return base;
  }
  function conceptPosts(book){
    return matchConcepts(book,4).map(c=>({
      id:`${book.slug||book.id}|concept|${c.id}`,
      bookId:book.id,bookTitle:book.title,bookSlug:book.slug||'',sourceKind:c.sourceKind,sourceLabel:'מושג מקצועי קשור',type:c.type,title:c.title,
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
  function buildRandomFeed(options){
    options = options || {};
    const count = Math.max(1, Number(options.count)||18);
    const seed = str(options.seed||Date.now());
    const pool = shuffled(buildDiscoveryPool(options.books||[]),seed);
    const out=[];
    const rest=pool.slice();
    while(rest.length && out.length<count){
      const lastBook = out.length ? out[out.length-1].bookId : null;
      let index = rest.findIndex(item=>item.bookId!==lastBook);
      if(index<0) index=0;
      out.push(rest.splice(index,1)[0]);
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
    const c0=concept(0), c1=concept(1), c2=concept(2);
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
      make('everyday','👀 איך זה מתבטא ביום־יום',c0.example,'יישום של מושג מקצועי',{conceptId:c0.id}),
      make('application','🛠️ יישום מעשי',c1.application,'יישום של מושג מקצועי',{conceptId:c1.id}),
      make('real-life','🌍 דוגמה מהחיים',c2.example,'דוגמה מקצועית',{conceptId:c2.id}),
      topic ? make('topic','🗺️ נושא להעמקה',str(topic),'מתוך מפת הנושאים של הספר') : null,
      make('reflection','❓ שאלה למחשבה',`איפה בחיים שלך אפשר לזהות את ${c0.title}, ומה היית בוחר לעשות אחרת אחרי שמזהים אותו?`,'שאלת העמקה של ChatGPT',{conceptId:c0.id})
    ].filter(x=>x && x.text);
  }

  return {LEARNING_CONCEPTS,matchConcepts,buildDiscoveryPool,buildRandomFeed,buildBookSections,hash};
});
