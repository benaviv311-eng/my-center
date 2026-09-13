function rfText(v,max=2400){return String(v??'').trim().slice(0,max);}
function rfPick(x={}){return {
  id:rfText(x.id,120),title:rfText(x.title,220),summary:rfText(x.summary,1600),status:rfText(x.status,40),saved:Boolean(x.saved),
  characters:Array.isArray(x.characters)?x.characters.slice(0,12).map(v=>rfText(v,100)):[],
  tags:Array.isArray(x.tags)?x.tags.slice(0,12).map(v=>rfText(v,100)):[],
  placement:rfText(x.placement,600),why:rfText(x.why,900),opens:rfText(x.opens,900)
};}
function buildFeedBaseContext(data={}){
  return {
    characters:(data.characters||[]).slice(0,40).map(rfPick),
    scenes:(data.scenes||[]).slice(0,50).map(rfPick),
    plotlines:(data.plotlines||[]).slice(0,20).map(rfPick),
    relationships:(data.relationships||[]).slice(0,24).map(rfPick),
    history:(data.history||[]).slice(0,20).map(rfPick),
    world:(data.world||[]).slice(0,20).map(rfPick),
    ideas:(data.ideas||[]).filter(x=>x.status==='idea'||x.status==='developing'||x.status==='parked'||x.saved).slice(0,30).map(rfPick),
  };
}
function rfHash(s=''){let h=2166136261;for(const ch of String(s)){h^=ch.codePointAt(0)||0;h=Math.imul(h,16777619);}return h>>>0;}
function rfSignature(card={}){return [card.card_type,...(card.characters||[]),...(card.entities||[]),card.title,card.body].join('|').toLowerCase().replace(/[^\p{L}\p{N}|]+/gu,' ').replace(/\s+/g,' ').trim().slice(0,1400);}
function rfCard(input){const card={status:'proposal',fallback:true,card_type:'idea',title:'רעיון לכתיבה',body:'',creativity_distance:'natural',characters:[],entities:[],suggested_placement:'',why_it_may_work:'',context_refs:[],tags:[],...input};card.signature=rfSignature(card);card.id=`fallback-${rfHash(card.signature).toString(36)}`;return card;}
function buildLocalFallbackCards(data={},opts={}){
  const count=Math.max(1,Math.min(12,Number(opts.count)||8));
  const seen=new Set(Array.isArray(opts.seen)?opts.seen.map(String):[]);
  const chars=data.characters||[],scenes=data.scenes||[],plots=data.plotlines||[],world=data.world||[],history=data.history||[];
  const fallbackChar={id:'raika',title:'ראיקה'};
  const c=i=>chars.length?chars[((i%chars.length)+chars.length)%chars.length]:fallbackChar;
  const s=i=>scenes.length?scenes[((i%scenes.length)+scenes.length)%scenes.length]:null;
  const p=i=>plots.length?plots[((i%plots.length)+plots.length)%plots.length]:null;
  const w=i=>world.length?world[((i%world.length)+world.length)%world.length]:null;
  const h=i=>history.length?history[((i%history.length)+history.length)%history.length]:null;
  const a=c(0),b=c(1),underused=c(chars.length-1),scene=s(0),scene2=s(1),plot=p(0),worldItem=w(0),historyItem=h(0);
  const templates=[
    ()=>rfCard({card_type:'relationship',title:'חיבור שעוד לא בדקנו',body:`מה יקרה אם ${a.title} תצטרך לבקש מ${b.title} עזרה דווקא בנושא שהיא מעדיפה להסתיר?`,characters:[a.id,b.id],why_it_may_work:'מכריח שתי דמויות קיימות לחשוף צד חדש בקשר ביניהן.',context_refs:[`character:${a.id}`,`character:${b.id}`],tags:['יחסים']}),
    ()=>rfCard({card_type:'consequence',title:'המחיר של מה שכבר קרה',body:scene?`איזו תוצאה מאוחרת של „${scene.title}” יכולה להופיע רק כמה סצנות אחר כך ולתפוס את הדמויות לא מוכנות?`:'איזה ניצחון קודם בעולם ראיקה יכול להתגלות כבעל מחיר מאוחר?',creativity_distance:'close',characters:scene?.characters||[a.id],context_refs:scene?[`scene:${scene.id}`]:[],tags:['השלכה']}),
    ()=>rfCard({card_type:'secret',title:'סוד קטן עם השפעה גדולה',body:`תן ל${a.title} סוד שלא משנה את הקאנון שכבר נקבע, אבל משנה את הדרך שבה אנחנו מבינים החלטה עתידית שלה. מהו הסוד ומי כמעט מגלה אותו?`,characters:[a.id],tags:['סוד','דמות']}),
    ()=>rfCard({card_type:'comedy',title:'רגע נורמלי מדי',body:`שים את ${a.title} ו${b.title} בבעיה יומיומית קטנה ומגוחכת שבה הכישורים הגדולים שלהם דווקא לא עוזרים.`,characters:[a.id,b.id],tags:['קומדיה','יום-יום']}),
    ()=>rfCard({card_type:'missing_beat',title:'מה חסר בין הרגעים?',body:scene&&scene2?`בין „${scene.title}” ל„${scene2.title}” חסר רגע קצר שמסביר שינוי רגשי. איזו שיחה או פעולה שקטה יכולה למלא אותו?`:'חפש מעבר בעלילה שבו שינוי רגשי קורה מהר מדי, והצע רגע קטן שמגשר עליו.',creativity_distance:'close',context_refs:[scene&&`scene:${scene.id}`,scene2&&`scene:${scene2.id}`].filter(Boolean),tags:['מבנה','סצנה']}),
    ()=>rfCard({card_type:'underused_character',title:'לתת במה לדמות שקטה',body:`מה קורה אם ${underused.title} מקבלת לרגע מטרה משלה שאינה קשורה ישירות לראיקה, ורק אחר כך העלילה הראשית מצטלבת איתה?`,characters:[underused.id],why_it_may_work:'מעמיק את העולם ומונע מכל קו עלילה להסתובב רק סביב הגיבורה.',tags:['דמות','קו משנה']}),
    ()=>rfCard({card_type:'worldbuilding',title:'פרט קטן שעושה עולם גדול',body:worldItem?`קח את „${worldItem.title}” והמצא מנהג יומיומי קטן שנובע ממנו — משהו שילד בכפר מכיר כמובן מאליו אבל קורא חדש ילמד דרך סצנה.`:'המצא מנהג קטן בכפר סאקורה שנובע מההיסטוריה או האמונות של המקום ונראה בתוך פעולה, לא בהסבר.',entities:worldItem?[worldItem.id]:[],context_refs:worldItem?[`world:${worldItem.id}`]:[],tags:['עולם','תרבות']}),
    ()=>rfCard({card_type:'legacy',title:'מה ירשו בלי לדעת?',body:historyItem?`איזו השפעה של „${historyItem.title}” יכולה לעבור לדור הנוכחי לא כחפץ אלא כהרגל, פחד או משפט משפחתי?`:`איזה הרגל של ${a.title} יכול להתברר בעתיד כמשהו שעבר אליה מדור קודם בלי שהבינה?`,characters:[a.id],context_refs:historyItem?[`history:${historyItem.id}`]:[],tags:['מורשת','עבר']}),
    ()=>rfCard({card_type:'antagonist',title:'היריב צודק בדבר אחד',body:plot?`אם יריב יתקוף את נקודת התורפה של „${plot.title}”, באיזו טענה אחת הוא יכול להיות צודק — גם אם הדרך שלו פסולה?`:'תן לאנטגוניסט טענה אחת אמיתית ומטרידה שהגיבורים לא יכולים לבטל בקלות.',creativity_distance:'natural',context_refs:plot?[`plotline:${plot.id}`]:[],tags:['אנטגוניסט','קונפליקט']}),
    ()=>rfCard({card_type:'school',title:'החיים הרגילים לוחצים בחזרה',body:`איזו בעיה בבית הספר יכולה להיות זעירה ביחס לסכנות הגדולות של ${a.title}, אבל להרגיש לה קשה יותר דווקא משום שאי אפשר לפתור אותה בכוח?`,characters:[a.id],tags:['בית ספר','שייכות']}),
    ()=>rfCard({card_type:'training',title:'האימון שמלמד את הדבר הלא נכון',body:`בנה אימון שבו ${a.title} מצליחה טכנית — אבל ${b.title} מבין שההצלחה חשפה הרגל מסוכן או שיעור שהיא פירשה לא נכון.`,characters:[a.id,b.id],tags:['אימון','שיעור']}),
    ()=>rfCard({card_type:'wild_card',title:'דמות חדשה שנכנסת מהצד',body:'המצא דמות חדשה שאינה נבל ואינה מנטור. היא מגיעה עם צורך אישי קטן, אבל עצם הנוכחות שלה מחברת במקרה שני קווי עלילה שלא היו קשורים.',creativity_distance:'wild',tags:['דמות חדשה','רעיון פרוע']}),
    ()=>rfCard({card_type:'dialogue',title:'משפט שאסור היה להיאמר',body:`באמצע שיחה רגועה ${b.title} אומר ל${a.title} משפט אחד מדויק מדי. מה המשפט, למה הוא פוגע, ומה שניהם עושים במקום לדבר עליו ישירות?`,characters:[a.id,b.id],tags:['דיאלוג','רגש']}),
    ()=>rfCard({card_type:'perspective',title:'אותו אירוע, אמת אחרת',body:scene?`ספר רגע מתוך „${scene.title}” מנקודת המבט של דמות צדדית. איזה פרט היא ראתה שהגיבורים פספסו — בלי לשנות את מה שכבר קרה?`:'בחר אירוע קאנוני והצע פרט חדש שרק דמות צדדית הבחינה בו.',creativity_distance:'close',characters:scene?.characters||[],context_refs:scene?[`scene:${scene.id}`]:[],tags:['נקודת מבט']}),
    ()=>rfCard({card_type:'plot_seed',title:'קו עלילה שנולד ממשהו קטן',body:plot?`איזה פרט זניח בתוך „${plot.title}” יכול להפוך, שלוש או ארבע סצנות מאוחר יותר, לבעיה עצמאית שדורשת קו עלילה משלה?`:'קח פרט שולי מאחת הסצנות והפוך אותו לזרע של עלילת משנה שלא תוכננה מראש.',context_refs:plot?[`plotline:${plot.id}`]:[],tags:['עלילה','זרע']}),
    ()=>rfCard({card_type:'what_if',title:'מה אם כולם פירשו נכון — חוץ מדבר אחד?',body:`בחר הנחה שמובנת מאליה ל${a.title}. אל תהפוך אותה לשקר מוחלט; שנה רק פרט אחד קטן, וראה איזה קונפליקט חדש נוצר.`,characters:[a.id],creativity_distance:'wild',tags:['מה אם','רעיון פרוע']})
  ];
  const candidates=templates.map(fn=>fn());
  const start=rfHash([...seen].sort().join('|'))%candidates.length;
  const ordered=[...candidates.slice(start),...candidates.slice(0,start)];
  return ordered.filter(card=>!seen.has(card.signature)).slice(0,count);
}
const api={buildFeedBaseContext,buildLocalFallbackCards};
if(typeof window!=='undefined')window.RaikaFeedContext=api;
if(typeof module!=='undefined')module.exports=api;
