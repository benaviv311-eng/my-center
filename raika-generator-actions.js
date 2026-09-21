const RG={current:null,last:null,saved:false};
function rgChar(id){return window.RAIKA_DATA?.characters?.find(c=>c.id===id);}
function rgEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rgRender(){const host=document.getElementById('rg-result');if(!host||!RG.current)return;const source=RG.current.source==='local'?'<span class="meta">🛟 נוצר מקומית מהקאנון כי שירות ה־AI לא היה זמין. אפשר לערוך ולנסות שוב.</span>':'<span class="meta">✨ נוצר בעזרת יועץ הכתיבה</span>';host.innerHTML=`<article class="rg-result-card"><h3>${rgEsc(RG.current.title)}</h3><textarea id="rg-text" class="search" rows="18">${rgEsc(RG.current.summary)}</textarea><div class="card-actions"><button class="btn small" data-rg="save">💾 שמור</button><button class="btn small" data-rg="retry">🔄 נסה שוב</button><button class="btn small" data-rg="approve">✅ אשר</button><button class="btn small" data-rg="delete">🗑️ מחק</button></div>${source}<br><span class="meta">💡 הצעה בלבד עד אישור מפורש</span></article>`;document.getElementById('rg-text').addEventListener('input',e=>{RG.current.summary=e.target.value;});}
function rgModeTitle(mode,a,b,note){const labels={related:'דמויות קשורות',relationship:'קשר',theme:'נושא',conflict:'קונפליקט',comedy:'רגע קומי',flashback:'פלאשבק',secret:'סוד / גילוי',family:'רגע משפחתי',mentor:'מנטור ותלמיד',rivalry:'יריבות',dilemma:'דילמה',quiet:'רגע שקט',training:'אימון ושיעור',aftermath:'אחרי האירוע',misunderstanding:'אי־הבנה',promise:'הבטחה',foreshadow:'רמז לעתיד',school:'בית ספר',journey:'מסע',villain:'נקודת מבט של יריב',legacy:'מורשת',surprise:'הפתעה'};return `${labels[mode]||'סצנה'}: ${a}${b?` × ${b}`:''}${note?` — ${note}`:''}`;}
function rgShowError(e){const box=document.getElementById('rg-error');if(!box)return;let text='ה־AI לא הצליח להחזיר תשובה.';if(e?.code==='ai_not_configured')text='שירות ה־AI לא מוגדר כרגע; המחולל עבר אוטומטית למצב מקומי.';else if(e?.code==='openai_401')text='מפתח ה־AI בשרת אינו תקף; המחולל עבר למצב מקומי.';else if(e?.code==='openai_429')text='שירות ה־AI הגיע למכסה; המחולל עבר למצב מקומי.';else if(e?.message)text=e.message;box.textContent=`ℹ️ ${text}`;box.classList.remove('hidden');}
function rgClearError(){const box=document.getElementById('rg-error');if(box){box.textContent='';box.classList.add('hidden');}}
function rgLocalIdeas(mode,a,b,note,count){
  const ca=rgChar(a)||{},cb=rgChar(b)||{};
  const A=ca.title||a||'ראיקה',B=cb.title||b||'';
  const hint=note?` דגש: ${note}.`:'';
  const flavors={
    interaction:['שיחה שנקטעת בפעולה','משימה קטנה שחושפת פער','רגע שבו אחד מהם מפתיע את האחר','בחירה משותפת עם מחיר','רגע יומיומי שמקבל משמעות'],
    emotion:['הרגש מופיע לפני שהדמות מוכנה להודות בו','הרגש מתבטא דרך פעולה ולא דרך וידוי','מישהו מבחין ברגש למרות ניסיון להסתירו','הרגש גורם לבחירה שגויה ואז לתיקון','הרגע השקט שאחרי הרגש'],
    conflict:['שניהם רוצים דבר טוב אבל בדרך הפוכה','ויכוח על ערך ולא על אגו','החלטה אחת שרק אחד מהם יכול לקבל','חוסר אמון שמכריח פעולה משותפת','הצלחה של אחד פוגעת בנקודה רגישה אצל האחר'],
    comedy:['תחרות קטנה שיוצאת משליטה','ניסיון להיראות בשליטה שנכשל','בדיחה על המצב שהופכת לאתגר','טעות תמימה שחושפת אופי','רגע משפחתי או חברי שבו כולם מכירים את החולשה'],
    quiet:['מעט מילים והרבה הבחנה','שתיקה משותפת אחרי יום קשה','מחווה קטנה במקום שיחה','שאלה אחת שאין עליה תשובה מיידית','רגע שבו פשוט נשארים יחד'],
    training:['תרגיל פשוט שחושף חולשה לא צפויה','התלמיד מצליח מסיבה לא נכונה','המאמן מסרב לתקן מיד','שינוי קטן בכללים שמפרק את הביטחון','שיעור שנראה פיזי אבל מתברר כמנטלי'],
    family:['הרגל ביתי קטן שחושף אהבה','ויכוח שנגמר במחווה ולא בנאום','זיכרון משפחתי שלא כולם זוכרים אותו אותו דבר','אח או הורה רואה משהו שהדמות מנסה להסתיר','רגע רגיל שמקבל משקל בגלל המסע המתקרב'],
    flashback:['זיכרון שסותר את האגדה המשפחתית','כישלון מוקדם שמסביר הרגל בהווה','פעם ראשונה שבה נולד ערך מרכזי','רגע מצחיק מן העבר שמאניש דמות מיתית','בחירה קטנה שהתבררה כגורלית'],
    legacy:['המורשת מוצגת דרך טעות ולא הישג','חפץ ישן מספר סיפור אחר','שני דורות מפרשים אותו ערך אחרת','סיפור משפחתי מקבל משמעות חדשה','הדמות מבינה שמורשת היא בחירה ולא חיקוי'],
    rivalry:['ניצחון קטן שמדליק יריבות','היריב נותן מחמאה שאי אפשר לקבל בנוחות','תחרות שבה שניהם משתפרים','עקיצה שמסתירה כבוד','רגע שבו היריב הוא היחיד שמבין את המאמץ'],
    dilemma:['שתי אפשרויות נכונות עם מחירים שונים','נאמנות מול אמת','הגנה על אדם אחד מול אחריות לקבוצה','ציות מול ערך אישי','ניצחון מהיר מול דרך נכונה'],
    school:['מצב חברתי שראיקה יודעת להתמודד איתו פחות מקרב','כדורעף חושף דינמיקה חדשה','אירוע כיתתי מכריח שיתוף פעולה לא צפוי','רגע מביך שהופך לקרבה','בחירה בין אימון לחוויה חברתית'],
    journey:['עצירה בדרך חושפת שיחה שלא הייתה מתרחשת בבית','מזג אוויר או דרך מכריחים שיתוף פעולה','סימן קטן בשטח פותח ויכוח','לילה במחנה משנה קשר','מכשול פשוט חושף הבדל בגישות'],
    surprise:['דמות שנראית חלשה מלמדת משהו חשוב','רגע קומי מסתיים בגילוי קטן','ניצחון מתברר כבעיה חדשה','מי שאמור להוביל מבקש עזרה','חפץ או מקום מוכר מקבל משמעות חדשה']
  };
  const base=flavors[mode]||flavors.surprise;
  const out=[];
  for(let i=0;i<count;i++){
    const f=base[i%base.length];
    const title=`${i+1}. ${A}${B?` ו${B}`:''} — ${f}`;
    let premise=`סצנה שבה ${A}${B?` ו${B}`:''} נכנסים למצב של ${f}. המטרה היא שהשינוי ייצא מהאופי ומהיחסים שכבר קיימים, בלי להוסיף עובדה קאנונית חדשה.`;
    if(mode==='emotion')premise=`הסצנה בונה את הרגש דרך התנהגות, גוף ובחירה: ${f}. לא מסבירים את הרגש ישירות לפני שהוא מורגש.`;
    if(mode==='training')premise+=` בסוף השיעור אין נאום ארוך; ההבנה מגיעה מתוך מה שנכשל ומה שהדמות עושה בניסיון הבא.`;
    if(mode==='quiet')premise+=` השינוי הוא רגשי או ביחסים, לא אירוע עלילתי גדול.`;
    out.push(`${title}\nרעיון: ${premise}${hint}\nתפנית רגשית: מה שנראה בתחילה כמו בעיה חיצונית חושף צורך פנימי של אחת הדמויות.\nשורת דיאלוג אפשרית: ״לא ביקשתי שתפתור לי את זה. רק שתישאר.״\nמיקום מוצע: בין שתי סצנות פעילות, כדי לתת לתוצאה להשפיע על הבחירה הבאה.\nבדיקת קאנון: הצעה בלבד; יש להשוות לסצנות הקיימות לפני אישור.`);
  }
  return out.join('\n\n──────────\n\n');
}
function rgBuildLocal(mode,title,ids,count,note=''){
  const a=ids[0]||'',b=ids[1]||'';
  const text=rgLocalIdeas(mode,a,b,note,count);
  const p=generatedProposal({mode,title:count>1?`${title} — ${count} הצעות`:title,text,characters:ids});
  p.source='local';
  return p;
}
async function rgGenerate(){
  rgClearError();
  const mode=document.getElementById('rg-mode')?.value||'related';
  const count=Math.max(1,Math.min(5,Number(document.getElementById('rg-count')?.value||3)));
  let prompt,title,ids,note='';
  if(mode==='interaction'){
    const a=document.getElementById('rg-a')?.value||'',b=document.getElementById('rg-b')?.value||'';note=document.getElementById('rg-note')?.value.trim()||'';const ca=rgChar(a),cb=rgChar(b);prompt=buildInteractionPrompt(ca?.title||a,cb?.title||b,note);title=`אינטראקציה: ${ca?.title||a} × ${cb?.title||b}`;ids=[a,b];RG.last={mode,a,b,note,count};
  }else if(mode==='emotion'){
    const c=document.getElementById('rg-character')?.value||'',feeling=document.getElementById('rg-feeling')?.value.trim()||'';if(!feeling){toast('כתוב רגש.');return;}const ch=rgChar(c);prompt=buildEmotionPrompt(ch?.title||c,feeling);title=`סצנה: ${ch?.title||c} — ${feeling}`;ids=[c];note=feeling;RG.last={mode,c,feeling,count};
  }else{
    const a=document.getElementById('rg-a')?.value||'',b=document.getElementById('rg-b')?.value||'';note=document.getElementById('rg-note')?.value.trim()||'';const ca=rgChar(a),cb=rgChar(b);prompt=buildSceneIdeaPrompt(mode,ca?.title||a,cb?.title||b,note);title=rgModeTitle(mode,ca?.title||a,cb?.title||b,note);ids=[a,b].filter(Boolean);RG.last={mode,a,b,note,count};
  }
  if(count>1)prompt+=` Return exactly ${count} distinct scene ideas, clearly numbered, with genuinely different dramatic directions. Do not repeat the same premise.`;
  const btn=document.getElementById('rg-generate');if(btn){btn.disabled=true;btn.textContent='יוצר…';}
  const canAI=Boolean(window.RaikaPrivate?.authorized&&typeof window.raiCall==='function');
  try{
    if(!canAI){RG.current=rgBuildLocal(mode,title,ids,count,note);RG.saved=false;rgShowError({message:'לא מחובר לשירות ה־AI; נוצרו הצעות מקומיות מתוך הקאנון.'});rgRender();return;}
    const existingScenes=(window.RAIKA_DATA?.scenes||[]).filter(s=>s.status==='canon'||s.status==='developing').map(s=>({title:s.title,summary:s.summary,characters:s.characters,status:s.status}));
    const context={rule:'כל תוצאה היא הצעה בלבד. אל תחזור על סצנה קיימת או סצנה שבפיתוח.',characters:ids.map(rgChar).filter(Boolean),existingScenes};
    const r=await raiCall({action:'ask',item_type:'idea',item_id:`generator-${mode}`,message:prompt,context});
    RG.current=generatedProposal({mode,title:count>1?`${title} — ${count} הצעות`:title,text:r.message?.content||'',characters:ids});RG.current.source='ai';RG.saved=false;rgRender();
  }catch(e){
    RG.current=rgBuildLocal(mode,title,ids,count,note);RG.saved=false;rgShowError(e);rgRender();
  }finally{if(btn){btn.disabled=false;btn.textContent='צור הצעות';}}
}
document.addEventListener('click',async e=>{if(e.target.id==='rg-generate'){await rgGenerate();return;}const b=e.target.closest('[data-rg]');if(!b||!RG.current)return;try{if(b.dataset.rg==='save'){if(!window.RaikaPrivate?.authorized){toast('כדי לשמור צריך להתחבר לחדר הכותבים.');return;}RG.current.saved=true;await RaikaWorkspaceClient.save(RG.current);RG.saved=true;toast('נשמר בעמוד השמורים.');}else if(b.dataset.rg==='retry'){await rgGenerate();}else if(b.dataset.rg==='approve'){if(!window.RaikaPrivate?.authorized){toast('כדי לאשר לקאנון צריך להתחבר.');return;}if(confirm('להפוך את ההצעה הזאת לקאנון?')){await RaikaWorkspaceActions.approve(RG.current);RG.current.status='canon';toast('אושר כקאנון.');}}else if(b.dataset.rg==='delete'){if(RG.saved&&window.RaikaPrivate?.authorized)await RaikaWorkspaceRemove(RG.current);RG.current=null;document.getElementById('rg-result').innerHTML='';toast('הוסר.');}}catch{toast('הפעולה נכשלה.');}});
window.RaikaGeneratorState=RG;
