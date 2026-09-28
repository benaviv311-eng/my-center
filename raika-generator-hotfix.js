(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function selectedText(id){var el=document.getElementById(id);if(!el)return '';if(el.tagName==='SELECT')return (el.options&&el.options[el.selectedIndex]&&el.options[el.selectedIndex].text)||el.value||'';return el.value||'';}
  function ideas(mode,a,b,note,count){
    var who=[a,b].filter(Boolean).join(' ו')||'ראיקה';
    var bank={
      interaction:['שיחה רגילה הופכת למבחן אמון כשאחת הדמויות מסתירה פרט קטן.','משימה פשוטה מאלצת את הדמויות לבחור מי מוביל ומי מוותר.','טעות מצחיקה חושפת מתח שלא נאמר קודם.'],
      conflict:['שתיהן רוצות להגן על אותו אדם, אבל בדרכים הפוכות.','ויכוח על עיקרון קטן מתברר כוויכוח על אמון.','הצלחה של אחת הדמויות פוגעת בנקודה רגישה אצל האחרת.'],
      comedy:['תחרות קטנה יוצאת משליטה ומכריחה את כולם לשתף פעולה.','ניסיון להסתיר טעות רק הופך אותה ליותר בולטת.','בדיחה פנימית מקבלת משמעות חדשה ברגע הלא נכון.'],
      quiet:['מעט מילים ומחווה קטנה משנות את היחסים יותר מנאום.','שתיקה משותפת אחרי יום קשה חושפת מי באמת מבין את מי.','שאלה אחת נשארת בלי תשובה ומשפיעה על ההמשך.'],
      training:['תרגיל קל חושף חולשה מפתיעה דווקא אצל הדמות החזקה.','האימון מצליח טכנית אבל נכשל במטרה האמיתית שלו.','שינוי קטן בכללים מאלץ את הדמות לוותר על הרגל קבוע.'],
      family:['הרגל ביתי קטן חושף אהבה שלא נאמרת במילים.','ויכוח משפחתי מסתיים במחווה במקום בהסבר.','זיכרון ישן מקבל פרשנות שונה אצל שני בני משפחה.'],
      flashback:['זיכרון ילדות מסביר בחירה שמתרחשת בהווה.','אירוע מהעבר נראה אחרת כשמספרים אותו מנקודת מבט נוספת.','טעות ישנה של מבוגר הופכת לשיעור שהוא מלמד היום.'],
      secret:['חפץ ישן חושף רמז לסוד אבל לא את התשובה המלאה.','מישהו יודע יותר ממה שהוא מוכן לומר ומנסה להסיט את השיחה.','הסוד מתברר כשייך לדמות אחרת מזו שחשדו בה.'],
      school:['מצב חברתי קטן קשה לראיקה יותר מקרב.','פרויקט קבוצתי מחבר בין דמויות שבדרך כלל לא בוחרות זו בזו.','רגע מביך הופך להזדמנות לחברות חדשה.'],
      journey:['עצירה בדרך יוצרת שיחה שלא הייתה מתרחשת בבית.','מכשול פשוט חושף הבדל עמוק בגישה בין הדמויות.','לילה בדרך מכריח שתי דמויות לחלוק משהו אישי.'],
      legacy:['חפץ משפחתי חשוב בגלל הסיפור שלו ולא בגלל כוח מיוחד.','שני דורות מפרשים את אותה מסורת אחרת.','הדמות מבינה שמורשת היא בחירה ולא חיקוי.'],
      surprise:['מי שנראה חלש מחזיק דווקא בפתרון.','ניצחון קטן יוצר בעיה חדשה.','דמות צדדית יודעת פרט שאף אחד לא ציפה שתדע.']
    };
    var pool=bank[mode]||bank.surprise,out=[];
    for(var i=0;i<count;i++){var p=pool[i%pool.length];out.push({title:(i+1)+'. '+who+' — '+p.split('.')[0],body:p+' '+(note?'דגש: '+note+'. ':'')+'הכיוון נשאר הצעה בלבד ואינו משנה קאנון בלי אישור.'});}
    return out;
  }
  function renderLocal(){
    var host=document.getElementById('rg-result'),status=document.getElementById('rg-status');if(!host)return;
    var mode=(document.getElementById('rg-mode')||{}).value||'surprise';
    var a=selectedText(mode==='emotion'?'rg-character':'rg-a');
    var b=mode==='emotion'?'':selectedText('rg-b');
    var note=mode==='emotion'?selectedText('rg-feeling'):selectedText('rg-note');
    var count=Math.max(1,Math.min(5,Number((document.getElementById('rg-count')||{}).value||3)));
    var list=ideas(mode,a,b,note,count);
    host.innerHTML='<div class="canon-note"><b>🛠️ מצב יציב:</b> נוצרו הצעות מקומיות כדי שהמחולל יעבוד גם אם שירות ה־AI או קוד אחר נכשל.</div>'+list.map(function(x){return '<article class="rg-result-card"><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p><span class="meta">💡 הצעה בלבד</span></article>';}).join('');
    if(status)status.textContent='נוצרו הצעות מקומיות והן מופיעות כאן למטה.';
    var btn=document.getElementById('rg-generate');if(btn){btn.disabled=false;btn.textContent='צור הצעות';}
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function handle(e){var btn=e.target&&e.target.closest&&e.target.closest('#rg-generate');if(!btn)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();var status=document.getElementById('rg-status');if(status)status.textContent='קיבלתי את הלחיצה — יוצר הצעות…';btn.disabled=true;btn.textContent='יוצר…';try{renderLocal();}catch(err){if(status)status.textContent='המחולל נתקל בשגיאה. רענן את הדף ונסה שוב.';btn.disabled=false;btn.textContent='צור הצעות';}}
  document.addEventListener('click',handle,true);
  function ready(){var btn=document.getElementById('rg-generate'),status=document.getElementById('rg-status');if(btn&&status&&!status.textContent)status.textContent='המחולל מוכן.';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();