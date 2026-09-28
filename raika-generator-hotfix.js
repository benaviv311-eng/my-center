(function(){
  'use strict';

  var currentIdeas=[];
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
  function generatorRequest(){
    var mode=(document.getElementById('rg-mode')||{}).value||'surprise';
    var count=Math.max(1,Math.min(5,Number((document.getElementById('rg-count')||{}).value||3)));
    var characters=mode==='emotion'
      ? [selectedId('rg-character')].filter(Boolean)
      : [selectedId('rg-a'),selectedId('rg-b')].filter(Boolean);
    var filterMap={
      interaction:'dialogue',conflict:'plotline',comedy:'comedy',quiet:'dialogue',
      training:'all',family:'all',flashback:'flashback',secret:'secret',
      school:'all',journey:'plotline',legacy:'all',surprise:'new',emotion:'dialogue'
    };
    return {
      mode:mode,
      count:count,
      filterType:filterMap[mode]||'all',
      characters:characters,
      character_names:characters.map(function(id){
        return (window.RAIKA_DATA?.characters||[]).find(function(ch){return ch.id===id;})?.title||id;
      }),
      note:mode==='emotion'?selectedText('rg-feeling'):selectedText('rg-note')
    };
  }
  function semanticText(card){
    return [card.card_type,...(card.characters||[]),card.plot_family,card.title,card.body].filter(Boolean).join(' ');
  }
  function rankForRequest(cards,req){
    var noteWords=String(req.note||'').toLowerCase().split(/s+/).filter(function(x){return x.length>2;});
    return (cards||[]).map(function(card,index){
      var score=0;
      var chars=Array.isArray(card.characters)?card.characters:[];
      req.characters.forEach(function(id){if(chars.includes(id))score+=6;});
      var txt=semanticText(card).toLowerCase();
      noteWords.forEach(function(w){if(txt.includes(w))score+=1;});
      if(req.filterType!=='all'&&req.filterType!=='new'&&String(card.card_type||'')===req.filterType)score+=3;
      if(card.source_type==='dynamic')score+=1;
      return {card:card,score:score,index:index};
    }).sort(function(a,b){return b.score-a.score||a.index-b.index;}).map(function(x){return x.card;});
  }
  function normalizeIdea(card,index){
    var id=card.id||card.idea_id||('shared-fallback-'+Date.now()+'-'+index);
    return Object.assign({},card,{
      id:String(id),
      title:String(card.title||'רעיון חדש').replace(/^d+.s*/,''),
      body:String(card.body||card.summary||''),
      characters:Array.isArray(card.characters)?card.characters:[]
    });
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
    var who=names.join(' ו')||idea.title.split('—')[0].trim()||'ראיקה';
    var locations=['דוג׳ו אינאזומה','בית המשפחה בכפר סאקורה','בית הספר','שביל מחוץ לכפר','שוק הכפר','חדר תה שקט'];
    var times=['ערב, אחרי יום ארוך','בוקר לפני האימון','אחר הצהריים, רגע לפני שהכפר נרגע','לילה, אחרי שכולם כבר הלכו לישון'];
    var location=locations[variant%locations.length];
    var time=times[variant%times.length];
    return {
      title:'סצנה מוצעת — '+idea.title,
      location:location,time:time,participants:who,
      opening:'הסצנה נפתחת ב'+location+'. '+who+' נמצאים בתוך פעולה יומיומית, ואז הרעיון מתחיל לחדור אל השיחה: '+idea.body,
      beats:[
        'הפתיחה נשארת קטנה וקונקרטית; אחת הדמויות עסוקה בפעולה פשוטה.',
        'משפט, מבט או טעות קטנה מכניסים את הקונפליקט בלי להסביר אותו ישירות.',
        'אחת הדמויות מנסה להחזיר את הרגע לשגרה, אבל דווקא חושפת יותר.',
        'העימות הופך אישי דרך בחירה או משפט מדויק, לא דרך נאום.',
        'מגיעה תפנית: אחת הדמויות מבינה שהיא פירשה לא נכון את המטרה של האחרת.',
        'הסצנה מסתיימת בהחלטה קטנה שמייצרת פעולה חדשה להמשך.'
      ],
      dialogue:[
        (names[0]||'ראיקה')+': ״זה לא מה שהתכוונתי שיקרה.״',
        (names[1]||'הדמות שמולה')+': ״אבל זה מה שקרה.״',
        (names[0]||'ראיקה')+': ״אז מה אתה רוצה שאעשה?״',
        (names[1]||'הדמות שמולה')+': ״קודם תפסיקי לנסות לנצח את השיחה.״',
        (names[0]||'ראיקה')+': ״אני לא מנסה לנצח.״',
        (names[1]||'הדמות שמולה')+': ״אז תישארי.״'
      ],
      emotional_turn:'התפנית הרגשית מגיעה כשהדמות המתגוננת מבינה שהצד השני אינו מנסה להביס אותה אלא להישאר איתה בתוך הקושי.',
      ending:'אחת הדמויות כבר פונה לצאת, נעצרת ואומרת משפט קצר שמבהיר שהקשר השתנה — אפילו אם הבעיה עוד לא נפתרה.',
      placement:idea.suggested_placement||'מתאים כסצנת ביניים לפני בחירה, עימות או משימה שבה השינוי הרגשי יקבל מבחן.',
      source:'local',editing:false,draftText:''
    };
  }
  function sceneFromProposal(idea,proposal,fallback){
    if(!proposal||typeof proposal!=='object')return fallback;
    return Object.assign({},fallback,{
      title:proposal.title||fallback.title,
      opening:proposal.opening||fallback.opening,
      beats:Array.isArray(proposal.beats)&&proposal.beats.length?proposal.beats:fallback.beats,
      dialogue:Array.isArray(proposal.dialogue)?proposal.dialogue:
        (typeof proposal.dialogue==='string'?proposal.dialogue.split('\n').filter(Boolean):fallback.dialogue),
      emotional_turn:proposal.turning_point||proposal.emotional_turn||fallback.emotional_turn,
      ending:proposal.ending||fallback.ending,
      placement:proposal.placement||fallback.placement,
      participants:characterNames(proposal.characters?.length?proposal.characters:idea.characters).join(' ו')||fallback.participants,
      source:'ai'
    });
  }
  function sceneStructuredText(scene){
    if(scene.draftText)return scene.draftText;
    return [
      scene.title,'מיקום / זמן: '+scene.location+' · '+scene.time,'משתתפים: '+scene.participants,'',
      'פתיח:',scene.opening,'','מהלך הסצנה:',
      ...(scene.beats||[]).map(function(x,i){return (i+1)+'. '+x;}),'',
      'דיאלוג לדוגמה:',...(scene.dialogue||[]),'','תפנית רגשית:',scene.emotional_turn,'',
      'שורת סיום:',scene.ending,'','מיקום בעלילה:',scene.placement
    ].join('\n');
  }
  function scenePanelHtml(index){
    if(expandedIndex!==index)return '';
    if(sceneLoading===index)return '<div class="rg-scene-panel" data-rg-scene-panel="'+index+'"><div class="rg-scene-loading">🎬 בונה סצנה…</div></div>';
    var scene=sceneCache[index];
    if(!scene)return '';
    var body=scene.editing
      ? '<textarea class="search rg-scene-editor" rows="22" data-rg-scene-editor="'+index+'">'+esc(sceneStructuredText(scene))+'</textarea>'
      : '<div class="rg-scene-grid"><div><b>מיקום / זמן</b><p>'+esc(scene.location)+' · '+esc(scene.time)+'</p></div><div><b>משתתפים</b><p>'+esc(scene.participants)+'</p></div><div class="rg-scene-wide"><b>פתיח</b><p>'+esc(scene.opening)+'</p></div><div class="rg-scene-wide"><b>מהלך הסצנה</b><ol>'+scene.beats.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div><div class="rg-scene-wide"><b>דיאלוג לדוגמה</b><div class="rg-scene-dialogue">'+scene.dialogue.map(function(x){return '<p>'+esc(x)+'</p>';}).join('')+'</div></div><div class="rg-scene-wide"><b>תפנית רגשית</b><p>'+esc(scene.emotional_turn)+'</p></div><div class="rg-scene-wide"><b>שורת סיום</b><p>'+esc(scene.ending)+'</p></div><div class="rg-scene-wide"><b>מיקום בעלילה</b><p>'+esc(scene.placement)+'</p></div></div>';
    return '<section class="rg-scene-panel" data-rg-scene-panel="'+index+'"><div class="rg-scene-head"><div><span class="meta">'+(scene.source==='ai'?'✨ סצנה מותאמת':'🛟 סצנת fallback')+'</span><h3>'+esc(scene.title)+'</h3></div><button class="btn small" type="button" data-rg-scene-close="'+index+'">✕ סגור</button></div>'+body+'<div class="card-actions rg-scene-actions"><button class="btn small" type="button" data-rg-scene-save="'+index+'">🎬 שמור כסצנה</button><button class="btn small" type="button" data-rg-scene-refresh="'+index+'">🔄 רענן סצנה</button><button class="btn small" type="button" data-rg-scene-edit="'+index+'">'+(scene.editing?'✓ סיים עריכה':'✏️ פתח לעריכה')+'</button></div><div class="meta">💡 הצעה בלבד — לא קאנון.</div></section>';
  }
  function renderIdeas(scrollFirst){
    var host=document.getElementById('rg-result');
    if(!host)return;
    var html=currentIdeas.map(function(idea,i){
      var source=idea.source_type==='dynamic'?' · חדש':'';
      var card='<article class="rg-result-card" data-rg-hotfix-card="'+i+'"><span class="meta">'+esc(idea.card_type||'רעיון')+source+'</span><h3>'+(i+1)+'. '+esc(idea.title)+'</h3><p>'+esc(idea.body)+'</p><div class="card-actions"><button class="btn small" type="button" data-rg-hotfix-save="'+i+'">💾 שמור</button><button class="btn small" type="button" data-rg-hotfix-expand="'+i+'">🎬 הרחב לסצנה</button></div>'+scenePanelHtml(i)+'</article>';
      if(i===2)card+=stickyRefreshHtml();
      return card;
    }).join('');
    if(currentIdeas.length<3)html+=stickyRefreshHtml();
    host.innerHTML='<div class="canon-note"><b>מנוע מאוחד:</b> ההצעות מגיעות מאותו מאגר והיסטוריה של פיד ראיקה.</div>'+html;
    if(scrollFirst){
      var first=host.querySelector('[data-rg-hotfix-card="0"]');
      if(first){first.style.scrollMarginTop='120px';first.scrollIntoView({behavior:'smooth',block:'start'});}
    }
  }
  function sharedFallback(req){
    var seen=window.RaikaIdeaHistory?.recentSignatures?.(240)||[];
    var raw=window.RaikaFeedContext?.buildLocalFallbackCards(window.RAIKA_DATA||{},{
      count:Math.max(req.count*5,16),seen:seen
    })||[];
    var fresh=window.RaikaIdeaHistory?.filterFresh?.(raw)||raw;
    return rankForRequest(fresh,req).slice(0,req.count);
  }
  async function generateIdeas(scrollFirst){
    var req=generatorRequest();
    var status=document.getElementById('rg-status');
    var btn=document.getElementById('rg-generate');
    if(status)status.textContent='מכין רעיונות חדשים מאותו מנוע של חדר הכותבים…';
    if(btn){btn.disabled=true;btn.textContent='יוצר…';}
    var cards=[];
    try{
      if(window.RaikaPrivate?.authorized&&window.RaikaFeedClient?.refreshAll){
        var requested=Math.min(24,Math.max(req.count*4,12));
        var response=await window.RaikaFeedClient.refreshAll({
          count:requested,
          filterType:req.filterType,
          recentSignatures:window.RaikaIdeaHistory?.recentSignatures?.(240)||[],
          generatorContext:req
        });
        var fresh=window.RaikaIdeaHistory?.filterFresh?.(response.cards||[])||response.cards||[];
        cards=rankForRequest(fresh,req).slice(0,req.count);
      }
    }catch(err){
      if(status)status.textContent='השרת לא זמין כרגע; משתמש ב־fallback המשותף בלי לחזור על מה שכבר ראית.';
    }
    if(cards.length<req.count){
      var fallback=sharedFallback(req);
      var used=new Set(cards.map(function(x){return x.signature||x.id;}));
      fallback.forEach(function(card){if(cards.length<req.count&&!used.has(card.signature||card.id)){used.add(card.signature||card.id);cards.push(card);}});
    }
    currentIdeas=cards.map(normalizeIdea);
    window.RaikaIdeaHistory?.rememberCards?.(currentIdeas);
    expandedIndex=-1;sceneCache={};sceneRounds={};sceneLoading=-1;
    renderIdeas(Boolean(scrollFirst));
    if(status)status.textContent=currentIdeas.length?'ההצעות נוצרו — בלי בנק רעיונות נפרד.':'לא נשארו כרגע הצעות טריות. נסה שוב בעוד רגע.';
    if(btn){btn.disabled=false;btn.textContent='צור הצעות';}
  }
  async function saveIdea(index,button){
    var idea=currentIdeas[index];if(!idea)return;
    if(!window.RaikaPrivate?.authorized||!window.RaikaWorkspaceClient?.save){if(typeof toast==='function')toast('כדי לשמור צריך להתחבר.');return;}
    button.disabled=true;button.textContent='שומר…';
    try{
      await window.RaikaWorkspaceClient.save({
        id:'generator-'+idea.id,type:'idea',status:'idea',
        title:idea.title,summary:idea.body,characters:idea.characters||[],
        tags:['generator','proposal',idea.card_type||'idea'],saved:true
      });
      button.textContent='נשמר ✓';
      if(typeof toast==='function')toast('הרעיון נשמר.');
    }catch(err){button.disabled=false;button.textContent='💾 שמור';if(typeof toast==='function')toast('השמירה נכשלה.');}
  }
  async function expandScene(index,forceRefresh){
    var idea=currentIdeas[index];if(!idea)return;
    expandedIndex=index;
    if(forceRefresh)sceneRounds[index]=(sceneRounds[index]||0)+1;
    var variant=sceneRounds[index]||0;
    sceneLoading=index;renderIdeas(false);
    var fallback=buildLocalScene(idea,variant);
    try{
      if(!idea.fallback&&window.RaikaPrivate?.authorized&&window.RaikaFeedClient?.expandScene){
        var response=await window.RaikaFeedClient.expandScene(idea.id);
        sceneCache[index]=sceneFromProposal(idea,response?.proposal,fallback);
      }else sceneCache[index]=fallback;
    }catch(err){
      sceneCache[index]=fallback;
      if(typeof toast==='function')toast('ה־AI לא זמין; יצרתי סצנה מקומית מלאה.');
    }finally{
      sceneLoading=-1;renderIdeas(false);
      var panel=document.querySelector('[data-rg-scene-panel="'+index+'"]');
      if(panel){panel.style.scrollMarginTop='110px';panel.scrollIntoView({behavior:'smooth',block:'start'});}
    }
  }
  async function saveScene(index,button){
    var idea=currentIdeas[index],scene=sceneCache[index];if(!idea||!scene)return;
    if(!window.RaikaPrivate?.authorized||!window.RaikaWorkspaceClient?.save){if(typeof toast==='function')toast('כדי לשמור סצנה צריך להתחבר.');return;}
    button.disabled=true;button.textContent='שומר סצנה…';
    try{
      await window.RaikaWorkspaceClient.save({
        id:'scene-'+idea.id+'-'+Date.now(),type:'scene',status:'developing',
        title:scene.title,summary:sceneStructuredText(scene),placement:scene.placement||'',
        characters:idea.characters||[],tags:['generator','scene-proposal'],saved:true
      });
      button.textContent='הסצנה נשמרה ✓';
      if(typeof toast==='function')toast('הסצנה נשמרה במצב פיתוח.');
    }catch(err){button.disabled=false;button.textContent='🎬 שמור כסצנה';if(typeof toast==='function')toast('שמירת הסצנה נכשלה.');}
  }
  function toggleSceneEdit(index){
    var scene=sceneCache[index];if(!scene)return;
    if(scene.editing){
      var editor=document.querySelector('[data-rg-scene-editor="'+index+'"]');
      if(editor)scene.draftText=editor.value;
    }
    scene.editing=!scene.editing;renderIdeas(false);
  }
  function closeScene(index){if(expandedIndex===index)expandedIndex=-1;renderIdeas(false);}
  function handle(e){
    var sceneSave=e.target?.closest?.('[data-rg-scene-save]');
    if(sceneSave){e.preventDefault();e.stopPropagation();saveScene(Number(sceneSave.dataset.rgSceneSave),sceneSave);return;}
    var sceneRefresh=e.target?.closest?.('[data-rg-scene-refresh]');
    if(sceneRefresh){e.preventDefault();e.stopPropagation();expandScene(Number(sceneRefresh.dataset.rgSceneRefresh),true);return;}
    var sceneEdit=e.target?.closest?.('[data-rg-scene-edit]');
    if(sceneEdit){e.preventDefault();e.stopPropagation();toggleSceneEdit(Number(sceneEdit.dataset.rgSceneEdit));return;}
    var sceneClose=e.target?.closest?.('[data-rg-scene-close]');
    if(sceneClose){e.preventDefault();e.stopPropagation();closeScene(Number(sceneClose.dataset.rgSceneClose));return;}
    var expand=e.target?.closest?.('[data-rg-hotfix-expand]');
    if(expand){e.preventDefault();e.stopPropagation();expandScene(Number(expand.dataset.rgHotfixExpand),false);return;}
    var save=e.target?.closest?.('[data-rg-hotfix-save]');
    if(save){e.preventDefault();e.stopPropagation();saveIdea(Number(save.dataset.rgHotfixSave),save);return;}
    var refresh=e.target?.closest?.('[data-rg-hotfix-refresh]');
    if(refresh){e.preventDefault();e.stopPropagation();generateIdeas(true);return;}
    var btn=e.target?.closest?.('#rg-generate');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    generateIdeas(true);
  }
  document.addEventListener('input',function(e){
    var editor=e.target?.closest?.('[data-rg-scene-editor]');
    if(!editor)return;
    var index=Number(editor.dataset.rgSceneEditor);
    if(sceneCache[index])sceneCache[index].draftText=editor.value;
  },true);
  document.addEventListener('click',handle,true);
  function ready(){
    var status=document.getElementById('rg-status');
    if(document.getElementById('rg-generate')&&status&&!status.textContent)status.textContent='המחולל המאוחד מוכן.';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();