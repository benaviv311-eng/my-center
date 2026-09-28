(function(){
  'use strict';

  var currentIdeas=[];
  var refreshRound=0;

  function esc(v){
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function selectedText(id){
    var el=document.getElementById(id);
    if(!el)return '';
    if(el.tagName==='SELECT')return (el.options&&el.options[el.selectedIndex]&&el.options[el.selectedIndex].text)||el.value||'';
    return el.value||'';
  }

  function selectedId(id){
    var el=document.getElementById(id);
    return el&&el.value?String(el.value):'';
  }

  function ideas(mode,a,b,note,count){
    var who=[a,b].filter(Boolean).join(' ו')||'ראיקה';
    var bank={
      interaction:[
        'שיחה רגילה הופכת למבחן אמון כשאחת הדמויות מסתירה פרט קטן.',
        'משימה פשוטה מאלצת את הדמויות לבחור מי מוביל ומי מוותר.',
        'טעות מצחיקה חושפת מתח שלא נאמר קודם.',
        'אחד מהם מבקש עזרה דווקא בנושא שבו הוא בדרך כלל עצמאי.',
        'החלטה קטנה בדרך גורמת להם לראות זה את זה אחרת.',
        'משימה משותפת מצליחה, אבל מסיבה שאף אחד מהם לא ציפה לה.'
      ],
      conflict:[
        'שתיהן רוצות להגן על אותו אדם, אבל בדרכים הפוכות.',
        'ויכוח על עיקרון קטן מתברר כוויכוח על אמון.',
        'הצלחה של אחת הדמויות פוגעת בנקודה רגישה אצל האחרת.',
        'הן מסכימות על המטרה אך לא על המחיר שמותר לשלם.',
        'אחת הדמויות מפרשת שתיקה כבגידה והשנייה כהגנה.',
        'העימות נפתר רק כששתיהן מוותרות על ניצחון אישי.'
      ],
      comedy:[
        'תחרות קטנה יוצאת משליטה ומכריחה את כולם לשתף פעולה.',
        'ניסיון להסתיר טעות רק הופך אותה ליותר בולטת.',
        'בדיחה פנימית מקבלת משמעות חדשה ברגע הלא נכון.',
        'משימה ביתית פשוטה הופכת למבחן סבלנות.',
        'דמות אחת מנסה להרשים ומסתבכת בכל צעד.',
        'כולם מבינים מה קרה חוץ ממי שגרם לזה.'
      ],
      quiet:[
        'מעט מילים ומחווה קטנה משנות את היחסים יותר מנאום.',
        'שתיקה משותפת אחרי יום קשה חושפת מי באמת מבין את מי.',
        'שאלה אחת נשארת בלי תשובה ומשפיעה על ההמשך.',
        'חפץ קטן עובר מיד ליד ומקבל משמעות חדשה.',
        'אחת הדמויות כמעט אומרת משהו חשוב ובוחרת לחכות.',
        'הן נשארות יחד בלי לפתור את הבעיה, וזה מספיק כרגע.'
      ],
      training:[
        'תרגיל קל חושף חולשה מפתיעה דווקא אצל הדמות החזקה.',
        'האימון מצליח טכנית אבל נכשל במטרה האמיתית שלו.',
        'שינוי קטן בכללים מאלץ את הדמות לוותר על הרגל קבוע.',
        'המאמן מסרב לתת פתרון ומכריח את התלמיד לגלות אותו.',
        'כישלון חוזר הופך ליתרון כשמגיע תרגיל אחר.',
        'התרגיל מסתיים לפני שהדמות מרגישה מוכנה ומכריח אותה לחשוב.'
      ],
      family:[
        'הרגל ביתי קטן חושף אהבה שלא נאמרת במילים.',
        'ויכוח משפחתי מסתיים במחווה במקום בהסבר.',
        'זיכרון ישן מקבל פרשנות שונה אצל שני בני משפחה.',
        'ארוחה רגילה נקטעת בשאלה שאיש לא ציפה לה.',
        'אח קטן מבחין במשהו שהמבוגרים מפספסים.',
        'בדיחה משפחתית חושפת רגש שמישהו ניסה להסתיר.'
      ],
      flashback:[
        'זיכרון ילדות מסביר בחירה שמתרחשת בהווה.',
        'אירוע מהעבר נראה אחרת כשמספרים אותו מנקודת מבט נוספת.',
        'טעות ישנה של מבוגר הופכת לשיעור שהוא מלמד היום.',
        'רגע מצחיק מן העבר משנה את הדרך שבה רואים דמות מיתית.',
        'הבטחה ישנה מקבלת משמעות חדשה שנים אחר כך.',
        'פרט קטן מהעבר מסביר פחד שאף פעם לא נאמר במפורש.'
      ],
      secret:[
        'חפץ ישן חושף רמז לסוד אבל לא את התשובה המלאה.',
        'מישהו יודע יותר ממה שהוא מוכן לומר ומנסה להסיט את השיחה.',
        'הסוד מתברר כשייך לדמות אחרת מזו שחשדו בה.',
        'רמז נכון מופיע במקום הלא נכון וגורם למסקנה שגויה.',
        'הדמות שמגלה את הסוד בוחרת לא לחשוף אותו מיד.',
        'הגילוי פותר שאלה אחת אבל יוצר שתיים חדשות.'
      ],
      school:[
        'מצב חברתי קטן קשה לראיקה יותר מקרב.',
        'פרויקט קבוצתי מחבר בין דמויות שבדרך כלל לא בוחרות זו בזו.',
        'רגע מביך הופך להזדמנות לחברות חדשה.',
        'תחרות בית ספרית גורמת לדמות רגועה להפוך לתחרותית.',
        'שמועה קטנה מתפתחת לפני שמישהו בודק אם היא נכונה.',
        'משימה בכיתה חושפת כישרון שלא קשור ללחימה.'
      ],
      journey:[
        'עצירה בדרך יוצרת שיחה שלא הייתה מתרחשת בבית.',
        'מכשול פשוט חושף הבדל עמוק בגישה בין הדמויות.',
        'לילה בדרך מכריח שתי דמויות לחלוק משהו אישי.',
        'סטייה קטנה מהמסלול מובילה למקום עם משמעות מהעבר.',
        'הדרך הקצרה מסוכנת והדרך הבטוחה גובה מחיר אחר.',
        'מפגש מקרי בדרך משאיר שאלה שממשיכה איתם.'
      ],
      legacy:[
        'חפץ משפחתי חשוב בגלל הסיפור שלו ולא בגלל כוח מיוחד.',
        'שני דורות מפרשים את אותה מסורת אחרת.',
        'הדמות מבינה שמורשת היא בחירה ולא חיקוי.',
        'סיפור משפחתי מפורסם מתברר כפחות מושלם מהאגדה.',
        'דמות צעירה בוחרת לשמור ערך ישן בדרך חדשה.',
        'המורשת מתגלה דווקא דרך טעות שהדור הקודם עשה.'
      ],
      surprise:[
        'מי שנראה חלש מחזיק דווקא בפתרון.',
        'ניצחון קטן יוצר בעיה חדשה.',
        'דמות צדדית יודעת פרט שאף אחד לא ציפה שתדע.',
        'היריב מסכים לעזור מסיבה שלא נראית אמינה.',
        'הבעיה הגדולה נפתרת, אבל פרט קטן הופך למסוכן יותר.',
        'מי שאמור להוביל מבקש שמישהו אחר יקבל את ההחלטה.'
      ]
    };
    var angles=[
      'המחיר האמיתי הוא אמון בין הדמויות.',
      'ההשלכה החשובה מתגלה רק בסוף הסצנה.',
      'דמות צדדית נכנסת לרגע ומשנה את הכיוון.',
      'הרגע מתחיל קליל ומסתיים בהחלטה רצינית.',
      'אחת הדמויות מפרשת לא נכון את מה שקרה.',
      'הפתרון דורש ויתור קטן שמרגיש גדול לדמות.',
      'המידע שנחשף נשאר חלקי ומשאיר מקום להמשך.',
      'הצלחה בסצנה יוצרת בעיה חדשה להמשך העלילה.'
    ];
    var pool=bank[mode]||bank.surprise;
    var out=[];
    for(var i=0;i<count;i++){
      var baseIndex=(i+(refreshRound*2))%pool.length;
      var angleIndex=(i*3+refreshRound)%angles.length;
      var p=pool[baseIndex];
      var angle=angles[angleIndex];
      out.push({
        id:'generator-hotfix-'+Date.now()+'-'+refreshRound+'-'+(i+1),
        title:(i+1)+'. '+who+' — '+p.split('.')[0],
        body:p+' '+angle+' '+(note?'דגש: '+note+'. ':'')+'הכיוון נשאר הצעה בלבד ואינו משנה קאנון בלי אישור.'
      });
    }
    return out;
  }

  function stickyRefreshHtml(){
    return '<div class="rg-sticky-refresh"><button class="btn primary" type="button" data-rg-hotfix-refresh>🔄 רענן רעיונות</button></div>';
  }

  function renderLocal(){
    var host=document.getElementById('rg-result');
    var status=document.getElementById('rg-status');
    if(!host)return;

    var mode=(document.getElementById('rg-mode')||{}).value||'surprise';
    var a=selectedText(mode==='emotion'?'rg-character':'rg-a');
    var b=mode==='emotion'?'':selectedText('rg-b');
    var note=mode==='emotion'?selectedText('rg-feeling'):selectedText('rg-note');
    var count=Math.max(1,Math.min(5,Number((document.getElementById('rg-count')||{}).value||3)));
    var characterIds=mode==='emotion'
      ? [selectedId('rg-character')].filter(Boolean)
      : [selectedId('rg-a'),selectedId('rg-b')].filter(Boolean);

    currentIdeas=ideas(mode,a,b,note,count).map(function(idea){
      idea.characters=characterIds.slice();
      return idea;
    });

    var cardsHtml=currentIdeas.map(function(x,i){
      var card='<article class="rg-result-card" data-rg-hotfix-card="'+i+'"><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p><div class="card-actions"><button class="btn small" type="button" data-rg-hotfix-save="'+i+'">💾 שמור</button></div><span class="meta">💡 הצעה בלבד</span></article>';
      if(i===2)card+=stickyRefreshHtml();
      return card;
    }).join('');

    if(currentIdeas.length<3)cardsHtml+=stickyRefreshHtml();

    host.innerHTML='<div class="canon-note"><b>🛠️ מצב יציב:</b> ההצעות נוצרו וניתן לשמור כל רעיון בנפרד.</div>'+cardsHtml;

    if(status)status.textContent='ההצעות נוצרו ומופיעות כאן למטה.';
    var btn=document.getElementById('rg-generate');
    if(btn){btn.disabled=false;btn.textContent='צור הצעות';}

    var first=host.querySelector('[data-rg-hotfix-card="0"]');
    if(first){
      first.style.scrollMarginTop='120px';
      first.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  async function saveIdea(index,button){
    var idea=currentIdeas[index];
    if(!idea)return;
    if(!window.RaikaPrivate?.authorized||!window.RaikaWorkspaceClient?.save){
      if(typeof toast==='function')toast('כדי לשמור צריך להתחבר לחדר הכותבים.');
      return;
    }
    button.disabled=true;
    button.textContent='שומר…';
    try{
      await window.RaikaWorkspaceClient.save({
        id:idea.id,
        type:'idea',
        status:'idea',
        title:idea.title.replace(/^\d+\.\s*/,''),
        summary:idea.body,
        characters:idea.characters||[],
        tags:['generator','proposal'],
        saved:true
      });
      button.textContent='נשמר ✓';
      if(typeof toast==='function')toast('הרעיון נשמר.');
    }catch(err){
      button.disabled=false;
      button.textContent='💾 שמור';
      if(typeof toast==='function')toast('השמירה נכשלה.');
    }
  }

  function generateAgain(){
    refreshRound+=1;
    var status=document.getElementById('rg-status');
    if(status)status.textContent='מרענן רעיונות…';
    renderLocal();
  }

  function handle(e){
    var save=e.target&&e.target.closest&&e.target.closest('[data-rg-hotfix-save]');
    if(save){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      saveIdea(Number(save.dataset.rgHotfixSave),save);
      return;
    }

    var refresh=e.target&&e.target.closest&&e.target.closest('[data-rg-hotfix-refresh]');
    if(refresh){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      generateAgain();
      return;
    }

    var btn=e.target&&e.target.closest&&e.target.closest('#rg-generate');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    var status=document.getElementById('rg-status');
    if(status)status.textContent='קיבלתי את הלחיצה — יוצר הצעות…';
    btn.disabled=true;
    btn.textContent='יוצר…';
    try{
      refreshRound+=1;
      renderLocal();
    }catch(err){
      if(status)status.textContent='המחולל נתקל בשגיאה. רענן את הדף ונסה שוב.';
      btn.disabled=false;
      btn.textContent='צור הצעות';
    }
  }

  document.addEventListener('click',handle,true);

  function ready(){
    var btn=document.getElementById('rg-generate');
    var status=document.getElementById('rg-status');
    if(btn&&status&&!status.textContent)status.textContent='המחולל מוכן.';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();