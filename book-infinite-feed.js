(function(root,factory){
  const api=factory(root&&root.LibraryDiscovery);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.BookInfiniteFeed=api;
})(typeof window!=='undefined'?window:globalThis,function(discovery){
  'use strict';

  const LOGICAL_FALLACIES=[
    {id:'straw-man',title:'איש קש',englishTitle:'Straw Man',definition:'עיוות הטענה של הצד השני לגרסה חלשה או קיצונית יותר, ואז תקיפה של הגרסה המעוותת.',example:'מישהו מציע להפחית אימונים ביום עמוס, ועונים לו: “אז אתה רוצה שלא נתאמן בכלל.”'},
    {id:'ad-hominem',title:'אד הומינם',englishTitle:'Ad Hominem',definition:'תקיפת האדם במקום התייחסות לטענה שלו.',example:'“העצה שלו על משמעת לא שווה כי הוא בעצמו לא מסודר.”'},
    {id:'false-dilemma',title:'דילמה כוזבת',englishTitle:'False Dilemma',definition:'הצגת מצב כאילו קיימות רק שתי אפשרויות, כשבפועל יש אפשרויות נוספות.',example:'“או שאתה מאמן קשוח, או שהקבוצה לא תקשיב לך.”'},
    {id:'slippery-slope',title:'מדרון חלקלק',englishTitle:'Slippery Slope',definition:'טענה שצעד קטן יוביל בהכרח לרצף קיצוני של תוצאות בלי להראות את הקשר הנדרש ביניהן.',example:'“אם נוותר פעם אחת על מטלה, בקרוב אף אחד לא יעשה שום דבר.”'},
    {id:'appeal-to-authority',title:'פנייה לסמכות',englishTitle:'Appeal to Authority',definition:'קבלת טענה כנכונה רק מפני שאדם בעל סמכות אמר אותה, בלי לבדוק את הראיות והתחום שבו הוא מומחה.',example:'“מאמן מפורסם אמר שזה התרגיל הכי טוב, לכן אין צורך לבדוק אם הוא מתאים לקבוצה שלנו.”'},
    {id:'appeal-to-emotion',title:'פנייה לרגש',englishTitle:'Appeal to Emotion',definition:'שימוש ברגש כתחליף לנימוק או לראיה.',example:'“אם באמת אכפת לך מהקבוצה, אתה חייב להסכים איתי.”'},
    {id:'hasty-generalization',title:'הכללה חפוזה',englishTitle:'Hasty Generalization',definition:'הסקת מסקנה רחבה ממספר קטן מדי של מקרים.',example:'“שני שחקנים איחרו השבוע, אז הדור הזה חסר אחריות.”'},
    {id:'post-hoc',title:'אחרי זה, לכן בגלל זה',englishTitle:'Post Hoc',definition:'הנחה שאם אירוע אחד התרחש לפני אירוע אחר, הוא בהכרח גרם לו.',example:'“החלפנו שיטת חימום וניצחנו, אז החימום החדש הוא הסיבה לניצחון.”'},
    {id:'red-herring',title:'הסחת דעת',englishTitle:'Red Herring',definition:'הסטת הדיון לנושא אחר שאינו עונה לטענה המקורית.',example:'שואלים למה התוכנית לא עמדה ביעד, והתשובה עוברת לדבר על כמה הצוות עבד קשה.'},
    {id:'circular-reasoning',title:'טיעון מעגלי',englishTitle:'Circular Reasoning',definition:'הנחת המסקנה בתוך ההנחות עצמן, כך שאין למעשה ראיה עצמאית לטענה.',example:'“השיטה הזאת טובה כי זו שיטה מצוינת.”'},
    {id:'bandwagon',title:'פנייה לרוב',englishTitle:'Bandwagon',definition:'הנחה שטענה נכונה או פעולה טובה מפני שהרבה אנשים מאמינים בה או עושים אותה.',example:'“כולם משתמשים בשיטה הזאת, אז היא חייבת להיות הטובה ביותר.”'},
    {id:'false-cause',title:'סיבה כוזבת',englishTitle:'False Cause',definition:'ייחוס קשר סיבתי בלי מספיק ראיות לכך שאחד המשתנים באמת גורם לאחר.',example:'“מאז שהחלפנו חולצות הקבוצה מצליחה יותר, אז הצבע החדש משפר ביצועים.”'},
    {id:'cherry-picking',title:'בחירת ראיות נוחה',englishTitle:'Cherry Picking',definition:'בחירת רק הנתונים שתומכים בעמדה והתעלמות מנתונים שסותרים אותה.',example:'מציגים שני משחקים מוצלחים של שיטה ומתעלמים מחמישה שבהם היא לא עבדה.'},
    {id:'moving-goalposts',title:'הזזת השערים',englishTitle:'Moving the Goalposts',definition:'שינוי הקריטריון להצלחה לאחר שהראיות כבר עמדו בקריטריון המקורי.',example:'אחרי ששחקן עומד ביעד שנקבע, אומרים שהיעד האמיתי היה בעצם גבוה יותר.'}
  ];

  const FALLACY_KEYWORDS={
    'straw-man':['ויכוח','טענה','תקשורת','דעה'],
    'ad-hominem':['שיפוט','מנהיגות','תקשורת','קבוצה'],
    'false-dilemma':['החלטה','בחירה','מנהיגות','דילמה'],
    'slippery-slope':['סיכון','פחד','שינוי','החלטה'],
    'appeal-to-authority':['סמכות','מנהיגות','מומחה','ידע'],
    'appeal-to-emotion':['רגש','שכנוע','מוטיבציה','פחד'],
    'hasty-generalization':['הכללה','שיפוט','למידה','נתונים'],
    'post-hoc':['סיבה','תוצאה','מחקר','החלטה'],
    'red-herring':['ויכוח','דיון','תקשורת','שכנוע'],
    'circular-reasoning':['טענה','היגיון','אמונה','הסבר'],
    'bandwagon':['קבוצה','חברה','נורמה','פופולריות'],
    'false-cause':['סיבה','תוצאה','מחקר','נתונים'],
    'cherry-picking':['ראיות','נתונים','הטיה','מחקר'],
    'moving-goalposts':['מטרה','הצלחה','ביצוע','מדידה']
  };

  const str=v=>String(v==null?'':v);
  function hash(input){let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function bookText(book){const c=book&&book.content?book.content:{};return [book&&book.title,c.category,c.summary,...(c.ideas||[]),...(c.topics||[]),...(c.feed_posts||[])].map(str).join(' ').toLowerCase()}
  function pick(arr,seed){return arr.length?arr[hash(seed)%arr.length]:null}
  function topicFor(book,seed){const c=book&&book.content?book.content:{};const topics=[...(c.topics||[]),...(c.ideas||[])].filter(Boolean);return pick(topics,seed)||c.category||book.title||'הנושא של הספר'}
  function matchedConcepts(book){
    if(discovery&&typeof discovery.matchConcepts==='function'){
      const found=discovery.matchConcepts(book,10);if(found&&found.length)return found;
    }
    const c=book&&book.content?book.content:{};
    return (c.topics||[]).slice(0,6).map((title,index)=>({id:`topic-${index}`,title:str(title),type:'🧩 מונח',explanation:`מושג מרכזי ללמידה מתוך עולם התוכן של הספר: ${title}.`,application:`בדוק איך ${title} מופיע במקרה אמיתי מחייך.`}));
  }
  function matchedFallacies(book){
    const text=bookText(book);
    const scored=LOGICAL_FALLACIES.map(f=>({f,score:(FALLACY_KEYWORDS[f.id]||[]).reduce((n,k)=>n+(text.includes(k)?1:0),0)}));
    scored.sort((a,b)=>b.score-a.score||hash(str(book&&book.slug)+a.f.id)-hash(str(book&&book.slug)+b.f.id));
    return scored.map(x=>x.f);
  }
  function item(book,kind,index,title,text,extra){
    const slug=str(book&&book.slug||book&&book.id||'book');
    return Object.assign({id:`${slug}|${kind}|${index}|${hash(title+text)}`,kind,title,text,sourceLabel:'הרחבה מקצועית',typeLabel:'למידה'},extra||{});
  }
  function makePool(book,seed){
    const c=book&&book.content?book.content:{};
    const topics=(c.topics||[]).filter(Boolean),ideas=(c.ideas||[]).filter(Boolean),posts=(c.feed_posts||[]).filter(Boolean),concepts=matchedConcepts(book),fallacies=matchedFallacies(book);
    const pool=[];
    posts.concat(ideas).forEach((text,i)=>pool.push(item(book,'book',i,'רעיון מתוך עולם הספר',str(text),{sourceLabel:'מתוך חומר הספר',typeLabel:'📖 מתוך הספר'})));
    concepts.forEach((concept,i)=>{
      const name=str(concept.title||`מושג ${i+1}`),explanation=str(concept.explanation||`מושג שמתחבר לנושאי הספר.`),application=str(concept.application||`נסה לזהות את ${name} במקרה אמיתי.`);
      pool.push(item(book,'term',i,`🧩 מונח: ${name}`,explanation,{typeLabel:'מונח',conceptId:concept.id}));
      pool.push(item(book,'definition',i,`📘 הגדרה: ${name}`,`במילים פשוטות: ${explanation}`,{typeLabel:'הגדרה',conceptId:concept.id}));
      pool.push(item(book,'application',i,`🛠️ יישום: ${name}`,application,{typeLabel:'יישום',conceptId:concept.id,deepText:`שאל את עצמך מה הפעולה הקטנה ביותר שתאפשר לבדוק את העיקרון הזה היום.`}));
      pool.push(item(book,'question',i,`❓ שאלה על ${name}`,`איפה בחיים שלך ${name} מופיע בצורה ברורה, ומה משתנה כשמזהים אותו בזמן?`,{typeLabel:'שאלה',conceptId:concept.id,deepText:`נסה לענות דרך דוגמה אחת קונקרטית ולא דרך תשובה כללית.`}));
    });
    const suggestionTopics=(topics.length?topics:ideas).slice(0,10);
    suggestionTopics.forEach((topic,i)=>pool.push(item(book,'suggestion',i,'💡 לאן להעמיק מכאן',`כדאי להעמיק בנושא “${topic}” ולבדוק אילו תיאוריות, מחקרים או גישות נוספות מסבירים אותו.`,{typeLabel:'הצעה',deepText:`חפש גם נקודת מבט שמאתגרת את הדרך שבה הספר מציג את ${topic}.`})));
    fallacies.forEach((f,i)=>{
      const topic=topicFor(book,`${seed}|fallacy|${i}`);
      pool.push(item(book,'fallacy',i,`⚠️ ${f.title}`,f.definition,{englishTitle:f.englishTitle,typeLabel:'כשל לוגי',example:f.example,deepText:`חיבור לספר: בזמן שחושבים על “${topic}”, בדוק האם הטיעון נשען על ראיות או מחליק אל ${f.title}.`}));
    });
    topics.forEach((topic,i)=>{
      pool.push(item(book,'question',100+i,'❓ בדוק את עצמך',`איך היית מסביר את “${topic}” למישהו שלא מכיר את הספר, בלי להשתמש במונחים של הספר עצמו?`,{typeLabel:'שאלה'}));
      pool.push(item(book,'suggestion',100+i,'✨ הצעה לניסוי קטן',`בחר סיטואציה אחת היום שבה “${topic}” רלוונטי, רשום מה אתה מצפה שיקרה ואז השווה למה שקרה בפועל.`,{typeLabel:'הצעה'}));
    });
    if(!pool.length) pool.push(item(book,'question',0,'❓ שאלה ראשונה',`איזה רעיון מרכזי היית רוצה להבין טוב יותר מתוך ${book.title||'הספר'}?`,{typeLabel:'שאלה'}));
    return pool;
  }
  function buildBookFeedBatch(book,options){
    options=options||{};
    const seed=str(options.seed||'feed'),offset=Math.max(0,Number(options.offset)||0),count=Math.max(1,Number(options.count)||12),filter=str(options.filter||'all');
    let pool=makePool(book,seed);
    if(filter!=='all') pool=pool.filter(x=>x.kind===filter);
    if(!pool.length) pool=makePool(book,seed);
    const ordered=pool.slice().sort((a,b)=>hash(`${seed}|${a.id}`)-hash(`${seed}|${b.id}`));
    const out=[];
    for(let i=0;i<count;i++){
      const base=ordered[(offset+i)%ordered.length];
      out.push(Object.assign({},base,{id:`${base.id}|${offset+i}`}));
    }
    return out;
  }

  return {LOGICAL_FALLACIES,buildBookFeedBatch,hash};
});
