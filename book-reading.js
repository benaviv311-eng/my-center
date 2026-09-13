(function(root,factory){
  const api=factory(root&&root.LibraryDiscovery);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.BookReading=api;
})(typeof window!=='undefined'?window:globalThis,function(discovery){
  'use strict';

  const str=value=>String(value==null?'':value).trim();
  const arr=value=>Array.isArray(value)?value.map(str).filter(Boolean):[];
  function hash(input){let h=2166136261;const s=str(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function rotate(items,seed){if(!items.length)return[];const start=hash(seed)%items.length;return items.slice(start).concat(items.slice(0,start))}
  function safeId(value,index){const base=str(value).toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]+/g,'-').replace(/^-+|-+$/g,'').slice(0,42);return base||`chapter-${index+1}`}
  function content(book){return book&&book.content?book.content:{}}
  function summaryOf(book){const c=content(book);return str(c.summary)||`הספר ${str(book&&book.title)||'הזה'} עוסק ברעיונות שאפשר לפרק, לבחון וליישם בהדרגה.`}

  function relatedConcepts(book){
    if(discovery&&typeof discovery.matchConcepts==='function'){
      const found=discovery.matchConcepts(book,10);
      if(Array.isArray(found)&&found.length)return found;
    }
    const c=content(book);
    return arr(c.topics).concat(arr(c.ideas)).slice(0,8).map((title,index)=>({
      id:`fallback-${index}`,
      title,
      type:'מושג קשור',
      explanation:`${title} הוא ציר שאפשר להשתמש בו כדי לפרק את הרעיון, לזהות דפוסים ולשאול שאלות מדויקות יותר.`,
      example:`אפשר לחפש מצב יומיומי שבו ${title} משנה החלטה, התנהגות או דרך למידה.`,
      application:`בחר מקרה אחד ובדוק מה משתנה כאשר מסתכלים עליו דרך ${title}.`
    }));
  }

  function conceptFor(concepts,index){
    if(!concepts.length)return null;
    return concepts[index%concepts.length];
  }

  function mainParagraphs(book,title,anchor,summary,concept,index){
    const bookTitle=str(book&&book.title)||'הספר';
    const conceptTitle=concept?str(concept.title):'';
    const conceptExplanation=concept?str(concept.explanation):'';
    const anchorText=str(anchor)||title;
    return [
      `הפרק הזה מתמקד ב־${anchorText}. בתוך ${bookTitle}, זהו ציר קריאה שמאפשר להבין את החומר לא רק כרעיון בודד אלא כחלק ממערכת רחבה יותר. נקודת המוצא היא התקציר של הספר: ${summary} במקום להסתפק במשפט אחד, כדאי לשים לב למה שהרעיון מבקש לשנות בדרך שבה אנחנו מפרשים מצב, בוחרים פעולה או מעריכים תוצאה.`,
      `דרך מועילה לקרוא את ${anchorText} היא לפרק אותו לשלושה חלקים: מה אנחנו מבחינים בו, איזו משמעות אנחנו נותנים לו, ומה אנחנו עושים בעקבות המשמעות הזאת. הפירוק הזה לא טוען שהמחבר משתמש דווקא במילים האלו; הוא נועד להפוך את החומר לקריא וליישומי. כאשר מפרידים בין תצפית, פרשנות ופעולה, קל יותר לזהות איפה נמצאת נקודת השינוי המרכזית.`,
      conceptTitle
        ? `כאן אפשר לחבר גם את המושג המקצועי ${conceptTitle}. ${conceptExplanation||`זהו מושג שעוזר להרחיב את ההבנה של ${anchorText}.`} החיבור הזה הוא הרחבה מקצועית ולא בהכרח מונח שמופיע בספר עצמו. הערך שלו הוא בכך שהוא נותן שפה נוספת לבחון את הרעיון, להשוות בין מצבים ולזהות מתי העיקרון עובד היטב ומתי הוא דורש הסתייגות.`
        : `כדי להעמיק, כדאי לחבר את הרעיון למושגים נוספים מתחומי למידה, פסיכולוגיה, קבלת החלטות או אימון. חיבור כזה אינו מחליף את הספר; הוא יוצר שכבת הבנה נוספת. המטרה היא לראות אילו תנאים מחזקים את הרעיון, אילו תנאים מחלישים אותו, ואיזה מידע נוסף היה גורם לנו לשנות את המסקנה.`,
      `דוגמה פשוטה: נניח שאדם רוצה לשפר התנהגות, יכולת או החלטה שחוזרת שוב ושוב. במקום לשאול רק “האם הצלחתי?”, אפשר לשאול מה היה הרמז למצב, מה בחרתי לעשות, איזה משוב קיבלתי, ומה אני משנה בניסיון הבא. כך ${anchorText} עובר מרעיון מופשט למסגרת עבודה. במגרש, בכיתה או בחיי היום־יום, השאלה החשובה היא לא רק מה נכון באופן כללי אלא מה אפשר לבדוק בפעולה קטנה וברורה.`,
      `בסופו של דבר, הקריאה בפרק הזה אמורה להשאיר שתי שכבות במקביל: הבנה של הרעיון כפי שהוא משויך לחומר הספר, ויכולת להשתמש בו מחוץ לספר בלי להפוך אותו לכלל קשיח. השלב הבא הוא לבדוק את ${anchorText} מול מקרה אמיתי, לחפש גם ראיה שתומכת בו וגם ראיה שמאתגרת אותו, ואז לנסח מה באמת כדאי לקחת ממנו. זו הדרך להפוך קריאה לזיכרון שימושי ולא רק למידע שחולף.`
    ];
  }

  function supportBlocks(anchor,concept,index){
    const blocks=[];
    if(concept){
      blocks.push({
        kind:'concept',
        title:`מושג מקצועי · ${str(concept.title)}`,
        text:str(concept.explanation)||`מושג מקצועי שמציע זווית נוספת על ${anchor}.`,
        sourceLabel:'מושג מקצועי קשור'
      });
      if(concept.application){
        blocks.push({
          kind:'application',
          title:'יישום מעשי',
          text:str(concept.application),
          sourceLabel:'הרחבה מקצועית'
        });
      }
    }else{
      blocks.push({
        kind:'question',
        title:'שאלה למחשבה',
        text:`איפה ${anchor} מופיע בצורה ברורה בחיים שלך, ומה היית רוצה לבדוק לגביו בפעם הבאה?`,
        sourceLabel:'הצעה של ChatGPT'
      });
    }
    if(index%2===1){
      blocks.push({
        kind:'perspective',
        title:'נקודת מבט אחרת',
        text:`נסה לקרוא את ${anchor} גם מהכיוון ההפוך: באילו מצבים העיקרון הזה עלול להיות חלקי, מוגזם או תלוי הקשר?`,
        sourceLabel:'הצעה של ChatGPT'
      });
    }
    return blocks;
  }

  function deepMaterial(book,title,anchor,summary,concept){
    const bookTitle=str(book&&book.title)||'הספר';
    const conceptTitle=concept?str(concept.title):'';
    const conceptExplanation=concept?str(concept.explanation):'';
    const conceptExample=concept?str(concept.example):'';
    const conceptApplication=concept?str(concept.application):'';
    return {
      title:`העמקה · ${title}`,
      sections:[
        {heading:'הסבר מעמיק',paragraphs:[
          `${anchor} הוא רעיון שכדאי לקרוא כתהליך ולא כסיסמה. כדי להבין אותו באמת, צריך לשאול מה קורה לפניו, מה קורה במהלכו ומה משתנה אחריו. ${bookTitle} מספק את נקודת המוצא דרך החומר שכבר משויך אליו, אבל ההעמקה כאן מפרקת את הרעיון בשפה לימודית חדשה ולא מעתיקה קטעים ארוכים מהמקור.`,
          `המשמעות המעשית היא לחפש מנגנון. אם ${anchor} משפיע על התנהגות או על חשיבה, מה בדיוק מתווך את ההשפעה? האם מדובר בקשב, בציפייה, בהרגל, במשוב, בסביבה, ברגש או בהחלטה? עצם השאלה הזאת מאלצת אותנו לעבור מטענה כללית להסבר שאפשר לבדוק, להשוות ולשנות.`
        ]},
        {heading:'הקשר רחב',paragraphs:[
          `בהקשר הרחב של הספר, נקודת הייחוס היא: ${summary} לכן ${anchor} אינו עומד לבד. הוא מקבל משמעות דרך היחסים בינו לבין שאר הרעיונות והנושאים בספר. לפעמים רעיון אחד מסביר את הבעיה, רעיון אחר מציע דרך פעולה, ורעיון שלישי עוזר להבין למה אותה דרך אינה עובדת תמיד.`,
          `קריאה כזאת מונעת מצב שבו לוקחים משפט אחד והופכים אותו לכלל אוניברסלי. במקום זאת, בונים מפה: מהי הבעיה שהרעיון מתייחס אליה, מהו המנגנון האפשרי, אילו תנאים חשובים, ואיזו תוצאה היינו מצפים לראות אם ההסבר נכון.`
        ]},
        {heading:'חיבור מקצועי',paragraphs:[
          conceptTitle
            ? `מושג מקצועי שיכול להאיר את הפרק הוא ${conceptTitle}. ${conceptExplanation} חשוב לסמן שהחיבור הזה הוא הרחבה מקצועית קשורה; הוא לא בהכרח מונח שהמחבר עצמו משתמש בו. השימוש בו מאפשר להשוות את הרעיון שבספר לידע נוסף ולשאול שאלות מדויקות יותר.`
            : `אפשר לחבר את הפרק למושגים מקצועיים מעולמות הפסיכולוגיה, הלמידה וקבלת ההחלטות. המטרה אינה להעמיס שמות, אלא למצוא מושג שמסביר חלק מהמנגנון. ברגע שיש מושג כזה, אפשר לחפש דוגמאות, גבולות, ראיות סותרות ויישומים מדויקים יותר.`,
          conceptTitle
            ? `כאשר משתמשים ב־${conceptTitle}, כדאי לשאול האם הוא באמת מוסיף הסבר או רק נותן שם חדש למה שכבר ידענו. מושג טוב צריך לעזור לנבא משהו, לשנות פעולה או לזהות פרט שלא היה ברור קודם.`
            : `מושג מקצועי מועיל הוא כזה שמוסיף יכולת הבחנה: הוא עוזר להבדיל בין שני מצבים שנראו קודם זהים, או מציע משתנה שאפשר לשנות. אם החיבור לא עושה אחד מהדברים האלה, הוא כנראה קישוט ולא כלי.`
        ]},
        {heading:'דוגמה ויישום',paragraphs:[
          conceptExample
            ? `דוגמה קשורה: ${conceptExample} עכשיו אפשר לחזור ל־${anchor} ולשאול מה מתוך הדוגמה ניתן להעביר למצב שלך ומה לא. העברה טובה אינה חיקוי; היא התאמה של העיקרון לתנאים חדשים.`
            : `נניח שאתה פוגש מצב חוזר באימון, בעבודה או בלמידה שבו התוצאה אינה משתפרת. במקום להוסיף עוד מאותו דבר, השתמש ב־${anchor} כעדשה: הגדר מה אתה רואה, מה אתה מניח, מה הפעולה הנוכחית ומהו משוב אחד שיאפשר לדעת אם השינוי עובד.`,
          conceptApplication
            ? `יישום אפשרי: ${conceptApplication} כדי להפוך זאת לניסוי קטן, קבע מראש סימן הצלחה אחד, זמן בדיקה קצר, ומה תעשה אם התוצאה אינה כפי שציפית. כך היישום נשאר גמיש ולא הופך לדוגמה שמוכיחה את עצמה.`
            : `בחר פעולה אחת שאפשר לבצע היום. היא צריכה להיות קטנה מספיק כדי לנסות, ברורה מספיק כדי לדעת אם בוצעה, ומדידה מספיק כדי לקבל עליה משוב. לאחר מכן שאל לא רק “האם זה עבד?” אלא “מה למדתי על התנאים שבהם זה עובד?”.`
        ]},
        {heading:'מגבלה או נקודת מבט אחרת',paragraphs:[
          `כל רעיון חזק עלול להפוך למסוכן כאשר משתמשים בו ללא הקשר. גם ${anchor} יכול להיות מועיל במצב אחד ופחות מתאים במצב אחר. יש הבדל בין עיקרון שמסביר נטייה לבין חוק שקובע מה תמיד יקרה. לכן כדאי להיזהר מהכללה מהירה, מסיבה כוזבת ומבחירת דוגמאות שמתאימות רק למה שכבר רצינו להאמין.`,
          `דרך טובה לבדוק את הגבול היא לשאול: איזה מקרה היה גורם לי לשנות את דעתי? מה חסר לי כדי להיות בטוח יותר? האם יש הסבר חלופי לאותה תוצאה? השאלות האלה אינן מחלישות את הרעיון; הן מחדדות את התחום שבו הוא באמת שימושי.`
        ]},
        {heading:'שאלות למחשבה',paragraphs:[
          `איפה בחיים שלך ${anchor} מופיע באופן הכי ברור? מה אתה עושה היום באופן אוטומטי שאפשר לבחון מחדש דרך הרעיון הזה? איזו דוגמה מהניסיון שלך דווקא סותרת אותו? ומהי פעולה אחת קטנה שתאפשר לך לבדוק אותו במקום רק להסכים איתו?`,
          `לבסוף, נסח את הרעיון במשפט אחד במילים שלך. אם אינך יכול להסביר אותו בלי להשתמש בניסוח של הספר, כנראה שעדיין לא הפכת אותו לידע שלך. לאחר מכן נסח גם משפט שני: “הרעיון הזה פחות מתאים כאשר…”. שני המשפטים יחד מייצרים הבנה מאוזנת יותר.`
        ]}
      ],
      takeaway:`העיקר: השתמש ב־${anchor} כעדשה לבדיקה וללמידה, לא ככלל קשיח. חבר אותו להקשר, חפש מנגנון, בדוק יישום קטן והשאר מקום לראיות שמאתגרות את המסקנה.`
    };
  }

  function chapter(book,title,anchor,summary,concept,index,kicker,sourceLabel){
    return {
      id:safeId(`${index+1}-${title}`,index),
      kicker:kicker||`פרק ${index+1}`,
      title,
      sourceLabel:sourceLabel||'מתוך חומר הספר',
      bodyParagraphs:mainParagraphs(book,title,anchor,summary,concept,index),
      supportBlocks:supportBlocks(anchor,concept,index),
      deep:deepMaterial(book,title,anchor,summary,concept)
    };
  }

  function buildReadingChapters(book,options){
    const c=content(book);
    const summary=summaryOf(book);
    const ideas=arr(c.ideas);
    const topics=arr(c.topics);
    const posts=arr(c.feed_posts);
    const concepts=rotate(relatedConcepts(book),`${str(options&&options.seed)}|concepts`);
    const anchors=[];
    const pushUnique=(value,type)=>{const v=str(value);if(v&&!anchors.some(x=>x.value===v))anchors.push({value:v,type});};

    ideas.forEach(x=>pushUnique(x,'idea'));
    topics.forEach(x=>pushUnique(x,'topic'));
    posts.forEach(x=>pushUnique(x,'post'));

    const ordered=rotate(anchors,`${str(options&&options.seed)}|anchors`);
    const selected=ordered.slice(0,5);
    while(selected.length<4){
      const fallback=['הרעיון המרכזי','הקשר ופרשנות','יישום ובדיקה','למידה והעברה'][selected.length];
      selected.push({value:fallback,type:'fallback'});
    }

    const chapters=[];
    chapters.push(chapter(book,'מפת הספר','הרעיון המרכזי של הספר',summary,conceptFor(concepts,0),0,'פתיחה','מתוך חומר הספר'));
    selected.forEach((entry,i)=>{
      const label=entry.type==='topic'?'נושא ללמידה':entry.type==='post'?'רעיון מהמאגר':'רעיון מרכזי';
      chapters.push(chapter(book,entry.value,entry.value,summary,conceptFor(concepts,i+1),i+1,label,'מתוך חומר הספר'));
    });

    const applicationAnchor=topics[0]||ideas[0]||'העברה מהרעיון לפעולה';
    chapters.push(chapter(book,'מהרעיון לפעולה',applicationAnchor,summary,conceptFor(concepts,selected.length+1),chapters.length,'יישום','הרחבה מקצועית'));

    return chapters.slice(0,7);
  }

  function buildTakeaways(book,chapters){
    const c=content(book);
    const ideas=arr(c.ideas);
    const topics=arr(c.topics);
    const out=[];
    const add=value=>{const v=str(value);if(v&&!out.includes(v))out.push(v);};
    ideas.slice(0,3).forEach(add);
    topics.slice(0,2).forEach(topic=>add(`נושא שכדאי להמשיך לעקוב אחריו: ${topic}`));
    (chapters||[]).slice(0,3).forEach(ch=>add(ch&&ch.deep&&ch.deep.takeaway));
    add(`המבחן החשוב של ${str(book&&book.title)||'הספר'} הוא מה משתנה בפעולה אחרי הקריאה, לא כמה משפטים זוכרים.`);
    return out.slice(0,7);
  }

  return {buildReadingChapters,buildTakeaways};
});
