(function(){
  'use strict';

  var currentIdeas=[];
  var refreshRound=0;
  var expandedIndex=-1;
  var sceneCache={};
  var sceneRounds={};
  var sceneLoading=-1;

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

  function characterNames(ids){
    return (ids||[]).map(function(id){
      var found=(window.RAIKA_DATA?.characters||[]).find(function(ch){return ch.id===id;});
      return found?.title||id;
    }).filter(Boolean);
  }

  function buildLocalScene(idea,variant){
    var names=characterNames(idea.characters);
    var who=names.join(' ו')||idea.title.replace(/^\d+\.\s*/,'').split('—')[0].trim()||'ראיקה';
    var locations=['דוג׳ו אינאזומה','בית המשפחה בכפר סאקורה','בית הספר','שביל מחוץ לכפר','שוק הכפר','חדר תה שקט'];
    var times=['ערב, אחרי יום ארוך','בוקר לפני האימון','אחר הצהריים, רגע לפני שהכפר נרגע','לילה, אחרי שכולם כבר הלכו לישון'];
    var location=locations[variant%locations.length];
    var time=times[variant%times.length];
    var premise=idea.body.replace(/הכיוון נשאר הצעה בלבד.*$/,'').trim();
    var opener='הסצנה נפתחת ב'+location+'. '+who+' כבר נמצא/ים בתוך פעולה קטנה ושגרתית, אבל '+premise;
    var beats=[
      'הפתיחה נראית רגילה: אחת הדמויות עסוקה במשימה פשוטה והאחרת נכנסת בלי טקס.',
      'משפט קצר או טעות קטנה מכניסים את המתח של הרעיון לחדר, בלי להסביר אותו במפורש.',
      'אחת הדמויות מנסה להחזיר את המצב לשגרה, אבל הבחירה שלה רק חושפת יותר ממה שהתכוונה.',
      'העימות נעשה אישי: לא צעקה גדולה, אלא משפט מדויק שנוגע בפחד, בגאווה או באמון.',
      'מגיעה תפנית: מי שנראה עד עכשיו כצודק מבין שהוא פספס משהו חשוב אצל האחר.',
      'הסצנה מסתיימת בהחלטה קטנה שמשנה את הפעולה הבאה — לא פתרון מלא, אלא כיוון חדש.'
    ];
    var dialogue=[
      (names[0]||'ראיקה')+': ״לא ביקשתי ממך לפתור את זה.״',
      (names[1]||'הדמות שמולה')+': ״אז למה באת אליי?״',
      (names[0]||'ראיקה')+': ״כי ידעתי שלא תיתן לי לברוח מזה.״',
      (names[1]||'הדמות שמולה')+': ״אני לא עוצר אותך. אני רק שואל לאן את בורחת.״',
      (names[0]||'ראיקה')+': ״זה לא אותו דבר.״',
      (names[1]||'הדמות שמולה')+': ״נכון. בגלל זה עדיין נשארת.״'
    ];
    return {
      title:'סצנה מוצעת — '+idea.title.replace(/^\d+\.\s*/,''),
      location:location,
      time:time,
      participants:who,
      opening:opener,
      beats:beats,
      dialogue:dialogue,
      emotional_turn:'התפנית הרגשית מגיעה כשהדמות שמנסה להגן על עצמה מבינה שהצד השני אינו מנסה לנצח אותה — אלא להישאר איתה בתוך הקושי.',
      ending:'בסיום, אף אחד לא אומר שהכול הסתדר. אחת הדמויות מתחילה ללכת, נעצרת לשנייה ואומרת: ״מחר. באותה שעה.״ השנייה רק מהנהנת.',
      placement:'מתאים כסצנת ביניים אחרי כישלון, ויכוח או החלטה קשה, ולפני סצנה שבה הבחירה החדשה מקבלת מבחן ממשי.',
      source:'local',
      editing:false,
      draftText:''
    };
  }

  function sceneFromAiResponse(idea,raw,fallback){
    var text=String(raw||'').trim();
    if(!text)return fallback;
    return Object.assign({},fallback,{
      source:'ai',
      fullText:text,
      title:'🎬 '+idea.title.replace(/^\d+\.\s*/,''),
      editing:false,
      draftText:''
    });
  }

  function sceneStructuredText(scene){
    if(scene.fullText)return scene.fullText;
    return [
      scene.title,
      'מיקום / זמן: '+scene.location+' · '+scene.time,
      'משתתפים: '+scene.participants,
      '',
      'פתיח:',
      scene.opening,
      '',
      'מהלך הסצנה:',
      ...(scene.beats||[]).map(function(x,i){return (i+1)+'. '+x;}),
      '',
      'דיאלוג לדוגמה:',
      ...(scene.dialogue||[]),
      '',
      'תפנית רגשית:',
      scene.emotional_turn,
      '',
      'שורת סיום:',
      scene.ending,
      '',
      'מיקום בעלילה:',
      scene.placement
    ].join('\n');
  }

  function scenePanelHtml(index){
    if(expandedIndex!==index)return '';
    if(sceneLoading===index)return '<div class="rg-scene-panel" data-rg-scene-panel="'+index+'"><div class="rg-scene-loading">🎬 בונה סצנה ממשית מהרעיונות והדמויות…</div></div>';
    var scene=sceneCache[index];
    if(!scene)return '';
    var body;
    if(scene.editing){
      body='<textarea class="search rg-scene-editor" rows="22" data-rg-scene-editor="'+index+'">'+esc(scene.draftText||sceneStructuredText(scene))+'</textarea>';
    }else if(scene.fullText){
      body='<div class="rg-scene-ai-text">'+esc(scene.draftText||scene.fullText).replace(/\n/g,'<br>')+'</div>';
    }else{
      body='<div class="rg-scene-grid">'+
        '<div><b>מיקום / זמן</b><p>'+esc(scene.location)+' · '+esc(scene.time)+'</p></div>'+
        '<div><b>משתתפים</b><p>'+esc(scene.participants)+'</p></div>'+
        '<div class="rg-scene-wide"><b>פתיח</b><p>'+esc(scene.opening)+'</p></div>'+
        '<div class="rg-scene-wide"><b>מהלך הסצנה</b><ol>'+scene.beats.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div>'+
        '<div class="rg-scene-wide"><b>דיאלוג לדוגמה</b><div class="rg-scene-dialogue">'+scene.dialogue.map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'</div></div>'+
        '<div class="rg-scene-wide"><b>תפנית רגשית</b><p>'+esc(scene.emotional_turn)+'</p></div>'+
        '<div class="rg-scene-wide"><b>שורת סיום</b><p>'+esc(scene.ending)+'</p></div>'+
        '<div class="rg-scene-wide"><b>מיקום בעלילה</b><p>'+esc(scene.placement)+'</p></div>'+
      '</div>';
    }
    var source=scene.source==='ai'?'✨ הותאם בעזרת יועץ ראיקה':'🛟 נוצר מקומית לפי הרעיון והדמויות';
    return '<section class="rg-scene-panel" data-rg-scene-panel="'+index+'">'+
      '<div class="rg-scene-head"><div><span class="meta">'+source+'</span><h3>'+esc(scene.title)+'</h3></div><button class="btn small" type="button" data-rg-scene-close="'+index+'">✕ סגור</button></div>'+
      body+
      '<div class="card-actions rg-scene-actions">'+
        '<button class="btn small" type="button" data-rg-scene-save="'+index+'">🎬 שמור כסצנה</button>'+
        '<button class="btn small" type="button" data-rg-scene-refresh="'+index+'">🔄 רענן סצנה</button>'+
        '<button class="btn small" type="button" data-rg-scene-edit="'+index+'">'+(scene.editing?'✓ סיים עריכה':'✏️ פתח לעריכה')+'</button>'+
        '<button class="btn small" type="button" data-rg-scene-close="'+index+'">סגור</button>'+
      '</div><div class="meta">💡 הסצנה היא הצעה בלבד ואינה קאנון עד אישור מפורש.</div>'+
    '</section>';
  }

  function renderIdeas(scrollFirst){
    var host=document.getElementById('rg-result');
    if(!host)return;
    var cardsHtml=currentIdeas.map(function(x,i){
      var card='<article class="rg-result-card" data-rg-hotfix-card="'+i+'"><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p><div class="card-actions"><button class="btn small" type="button" data-rg-hotfix-save="'+i+'">💾 שמור</button><button class="btn small" type="button" data-rg-hotfix-expand="'+i+'">🎬 הרחב לסצנה</button></div><span class="meta">💡 הצעה בלבד</span>'+scenePanelHtml(i)+'</article>';
      if(i===2)card+=stickyRefreshHtml();
      return card;
    }).join('');
    if(currentIdeas.length<3)cardsHtml+=stickyRefreshHtml();
    host.innerHTML='<div class="canon-note"><b>🛠️ מצב יציב:</b> ההצעות נוצרו וניתן לשמור או להרחיב כל רעיון לסצנה.</div>'+cardsHtml;
    if(scrollFirst){
      var first=host.querySelector('[data-rg-hotfix-card="0"]');
      if(first){first.style.scrollMarginTop='120px';first.scrollIntoView({behavior:'smooth',block:'start'});}
    }
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

    expandedIndex=-1;
    sceneCache={};
    sceneRounds={};
    sceneLoading=-1;
    renderIdeas(true);

    if(status)status.textContent='ההצעות נוצרו ומופיעות כאן למטה.';
    var btn=document.getElementById('rg-generate');
    if(btn){btn.disabled=false;btn.textContent='צור הצעות';}
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

  async function expandScene(index,forceRefresh){
    var idea=currentIdeas[index];
    if(!idea)return;
    expandedIndex=index;
    if(forceRefresh)sceneRounds[index]=(sceneRounds[index]||0)+1;
    var variant=sceneRounds[index]||0;
    sceneLoading=index;
    renderIdeas(false);
    var panel=document.querySelector('[data-rg-scene-panel="'+index+'"]');
    if(panel){panel.style.scrollMarginTop='110px';panel.scrollIntoView({behavior:'smooth',block:'start'});}
    var fallback=buildLocalScene(idea,variant);
    try{
      if(window.RaikaPrivate?.authorized&&typeof window.raiCall==='function'){
        var prompt='פתח את הרעיון הבא לסצנה ממשית בעברית, לא רק תקציר. שמור על הקאנון הקיים והצג אותה כהצעה בלבד.\n\nרעיון: '+idea.title+'\n'+idea.body+'\n\nכתוב במבנה ברור: כותרת; מיקום וזמן; פתיח קונקרטי; מהלך הסצנה ב-4 עד 6 ביטים; דיאלוג ממשי של לפחות 6 שורות; תפנית רגשית; שורת סיום; איפה הסצנה יכולה להשתלב בעלילה. תן פעולות, תגובות ודיאלוג שאפשר ממש לדמיין כסצנה.';
        var response=await window.raiCall({
          action:'ask',
          item_type:'idea',
          item_id:idea.id,
          message:prompt,
          context:{idea:idea,characters:idea.characters||[],rule:'הצעה בלבד; אין לשנות קאנון ללא אישור.'}
        });
        var raw=response?.message?.content||response?.message||'';
        sceneCache[index]=sceneFromAiResponse(idea,raw,fallback);
      }else{
        sceneCache[index]=fallback;
      }
    }catch(err){
      sceneCache[index]=fallback;
      if(typeof toast==='function')toast('ה־AI לא היה זמין; יצרתי סצנה מקומית מלאה.');
    }finally{
      sceneLoading=-1;
      renderIdeas(false);
      var readyPanel=document.querySelector('[data-rg-scene-panel="'+index+'"]');
      if(readyPanel){readyPanel.style.scrollMarginTop='110px';readyPanel.scrollIntoView({behavior:'smooth',block:'start'});}
    }
  }

  async function saveScene(index,button){
    var idea=currentIdeas[index],scene=sceneCache[index];
    if(!idea||!scene)return;
    if(!window.RaikaPrivate?.authorized||!window.RaikaWorkspaceClient?.save){
      if(typeof toast==='function')toast('כדי לשמור סצנה צריך להתחבר לחדר הכותבים.');
      return;
    }
    button.disabled=true;button.textContent='שומר סצנה…';
    try{
      await window.RaikaWorkspaceClient.save({
        id:'scene-'+idea.id+'-'+Date.now(),
        type:'scene',
        status:'developing',
        title:scene.title.replace(/^🎬\s*/,''),
        summary:scene.draftText||sceneStructuredText(scene),
        placement:scene.placement||'',
        characters:idea.characters||[],
        tags:['generator','scene-proposal'],
        saved:true
      });
      button.textContent='הסצנה נשמרה ✓';
      if(typeof toast==='function')toast('הסצנה נשמרה במצב פיתוח.');
    }catch(err){
      button.disabled=false;button.textContent='🎬 שמור כסצנה';
      if(typeof toast==='function')toast('שמירת הסצנה נכשלה.');
    }
  }

  function toggleSceneEdit(index){
    var scene=sceneCache[index];if(!scene)return;
    if(scene.editing){
      var editor=document.querySelector('[data-rg-scene-editor="'+index+'"]');
      if(editor)scene.draftText=editor.value;
    }
    scene.editing=!scene.editing;
    renderIdeas(false);
  }

  function closeScene(index){
    if(expandedIndex===index)expandedIndex=-1;
    renderIdeas(false);
  }

  function generateAgain(){
    refreshRound+=1;
    expandedIndex=-1;
    sceneCache={};
    sceneRounds={};
    var status=document.getElementById('rg-status');
    if(status)status.textContent='מרענן רעיונות…';
    renderLocal();
  }

  function handle(e){
    var sceneSave=e.target&&e.target.closest&&e.target.closest('[data-rg-scene-save]');
    if(sceneSave){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();saveScene(Number(sceneSave.dataset.rgSceneSave),sceneSave);return;}

    var sceneRefresh=e.target&&e.target.closest&&e.target.closest('[data-rg-scene-refresh]');
    if(sceneRefresh){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();expandScene(Number(sceneRefresh.dataset.rgSceneRefresh),true);return;}

    var sceneEdit=e.target&&e.target.closest&&e.target.closest('[data-rg-scene-edit]');
    if(sceneEdit){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();toggleSceneEdit(Number(sceneEdit.dataset.rgSceneEdit));return;}

    var sceneClose=e.target&&e.target.closest&&e.target.closest('[data-rg-scene-close]');
    if(sceneClose){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();closeScene(Number(sceneClose.dataset.rgSceneClose));return;}

    var expand=e.target&&e.target.closest&&e.target.closest('[data-rg-hotfix-expand]');
    if(expand){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();expandedIndex=Number(expand.dataset.rgHotfixExpand);expandScene(expandedIndex,false);return;}

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

  document.addEventListener('input',function(e){
    var editor=e.target&&e.target.closest&&e.target.closest('[data-rg-scene-editor]');
    if(!editor)return;
    var index=Number(editor.dataset.rgSceneEditor);
    if(sceneCache[index])sceneCache[index].draftText=editor.value;
  },true);

  document.addEventListener('click',handle,true);

  function ready(){
    var btn=document.getElementById('rg-generate');
    var status=document.getElementById('rg-status');
    if(btn&&status&&!status.textContent)status.textContent='המחולל מוכן.';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();