(function(){
  'use strict';

  const THREAD_KEY='raika-writers-chat-thread-v1';
  const state={messages:[],loading:false,threadId:'',started:false};

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function currentThreadId(){
    if(state.threadId)return state.threadId;
    try{state.threadId=localStorage.getItem(THREAD_KEY)||'';}catch(_){}
    if(!state.threadId){
      state.threadId='writers-live-'+Date.now().toString(36);
      try{localStorage.setItem(THREAD_KEY,state.threadId);}catch(_){}
    }
    return state.threadId;
  }
  function newConversation(){
    state.threadId='writers-live-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
    state.messages=[];
    try{localStorage.setItem(THREAD_KEY,state.threadId);}catch(_){}
    render();
    const input=document.getElementById('rwc-input');
    if(input)input.focus();
  }
  function trimItems(items,max){
    return (items||[]).slice(0,max).map(x=>({
      id:x.id,title:x.title,summary:x.summary||'',status:x.status,type:x.type,
      characters:Array.isArray(x.characters)?x.characters:[],
      tags:Array.isArray(x.tags)?x.tags:[]
    }));
  }
  function buildCanonContext(){
    const d=window.RAIKA_DATA||{};
    return {
      rule:'כל יצירה בשיחה היא הצעה בלבד ואינה קאנון בלי אישור מפורש. אין לסתור עובדות קאנוניות קיימות.',
      conversation_mode:'חדר כותבים חי. המשתמש יכול להמשיך בהתייחסות לתשובה הקודמת כגון "עוד אחד", "יותר אפל", "פתח את השלישי". שמור על הקשר השיחה.',
      characters:trimItems(d.characters,60),
      scenes:trimItems((d.scenes||[]).filter(x=>x.status==='canon'||x.status==='developing').slice(-80),80),
      plotlines:trimItems(d.plotlines,50),
      history:trimItems(d.history,40),
      world:trimItems(d.world,40),
      relationships:trimItems(d.relationships,40),
      current_ideas:trimItems((d.ideas||[]).filter(x=>x.status!=='archived').slice(-50),50)
    };
  }
  function messageText(m){return String(m?.content??m?.text??'').trim();}
  function titleFrom(text,prefix){
    const clean=String(text||'').replace(/^#+\s*/,'').trim();
    const first=clean.split(/\n+/)[0].replace(/^[-*•\d.()\s]+/,'').trim();
    return (first||prefix||'רעיון מחדר הכותבים').slice(0,180);
  }
  function render(){
    const box=document.getElementById('rwc-messages');
    if(!box)return;
    if(!state.messages.length){
      box.innerHTML='<div class="rwc-empty"><b>💬 חדר הכתיבה פתוח</b><p>כתוב מה שאתה רוצה ליצור עכשיו. למשל: „תן לי קו עלילה חדש על קאמינארי”, „צור סצנה בין ראיקה לטומו”, או „תפתח את הרעיון האחרון למשהו יותר אפל”.</p><div class="rwc-prompts"><button type="button" class="btn small" data-rwc-prompt="תן לי 3 רעיונות חדשים שלא חזרנו עליהם עדיין">3 רעיונות חדשים</button><button type="button" class="btn small" data-rwc-prompt="צור לי סצנה חדשה בעולם ראיקה, עם דיאלוג ממשי ותפנית רגשית">צור סצנה</button><button type="button" class="btn small" data-rwc-prompt="תציע קו עלילה לא קאנוני חדש ומפורט">קו עלילה חדש</button></div></div>';
      return;
    }
    box.innerHTML=state.messages.map((m,i)=>{
      const role=m.role==='assistant'?'assistant':'user';
      const actions=role==='assistant'?'<div class="rwc-answer-actions"><button class="btn small" type="button" data-rwc-copy="'+i+'">📋 העתק</button><button class="btn small" type="button" data-rwc-save="idea" data-rwc-index="'+i+'">💾 שמור כרעיון</button><button class="btn small" type="button" data-rwc-save="scene" data-rwc-index="'+i+'">🎬 שמור כסצנה</button><button class="btn small" type="button" data-rwc-save="plotline" data-rwc-index="'+i+'">🧭 שמור כקו עלילה לא קאנוני</button></div>':'';
      return '<article class="rwc-message '+role+'"><div class="rwc-role">'+(role==='assistant'?'✨ חדר הכותבים':'אתה')+'</div><div class="rwc-text">'+esc(messageText(m)).replace(/\n/g,'<br>')+'</div>'+actions+'</article>';
    }).join('');
    box.scrollTop=box.scrollHeight;
  }
  async function loadHistory(){
    if(!window.RaikaPrivate?.authorized||typeof window.raiCall!=='function')return;
    const box=document.getElementById('rwc-messages');
    if(box)box.innerHTML='<div class="meta">טוען את השיחה…</div>';
    try{
      const r=await window.raiCall({action:'history',item_type:'idea',item_id:currentThreadId(),context:buildCanonContext()});
      state.messages=(r.messages||[]).filter(m=>m?.role==='user'||m?.role==='assistant');
    }catch(_){
      state.messages=[];
    }
    render();
  }
  async function ask(question){
    const q=String(question||'').trim();
    if(!q||state.loading)return;
    if(!window.RaikaPrivate?.authorized||typeof window.raiCall!=='function'){
      if(typeof toast==='function')toast('כדי להשתמש בצ׳אט החי צריך להתחבר לחדר הכותבים.');
      return;
    }
    state.loading=true;
    state.messages.push({id:'local-'+Date.now(),role:'user',content:q});
    render();
    const input=document.getElementById('rwc-input');
    const submit=document.querySelector('#rwc-form button[type="submit"]');
    if(input){input.value='';input.disabled=true;}
    if(submit){submit.disabled=true;submit.textContent='חושב…';}
    try{
      const r=await window.raiCall({
        action:'ask',
        item_type:'idea',
        item_id:currentThreadId(),
        message:q,
        context:buildCanonContext()
      });
      if(r?.message)state.messages.push(r.message);
      else state.messages.push({id:'answer-'+Date.now(),role:'assistant',content:'לא התקבלה תשובה. נסה שוב.'});
    }catch(err){
      state.messages.push({id:'error-'+Date.now(),role:'assistant',content:err?.message||'הצ׳אט לא זמין כרגע.'});
    }finally{
      state.loading=false;
      if(input){input.disabled=false;input.focus();}
      if(submit){submit.disabled=false;submit.textContent='שלח';}
      render();
    }
  }
  async function saveMessage(index,type,button){
    const m=state.messages[Number(index)];
    const content=messageText(m);
    if(!content||m?.role!=='assistant')return;
    if(!window.RaikaPrivate?.authorized||!window.RaikaWorkspaceClient?.save){
      if(typeof toast==='function')toast('כדי לשמור צריך להתחבר.');
      return;
    }
    const now=Date.now();
    let item;
    if(type==='scene'){
      item={id:'chat-scene-'+now,type:'scene',status:'developing',title:titleFrom(content,'סצנה מחדר הכותבים'),summary:content,placement:'',why:'נוצרה בצ׳אט החי של חדר הכותבים.',opens:'',characters:[],tags:['צ׳אט חי','הצעת סצנה'],saved:true};
    }else if(type==='plotline'){
      item={id:'chat-plotline-'+now,type:'plotline',status:'idea',title:titleFrom(content,'קו עלילה לא קאנוני'),summary:content,placement:'',why:'נוצר בצ׳אט החי. לא קאנון.',opens:'',characters:[],tags:['צ׳אט חי','לא קאנון','קו עלילה'],saved:true};
    }else{
      item={id:'chat-idea-'+now,type:'idea',status:'idea',title:titleFrom(content,'רעיון מחדר הכותבים'),summary:content,placement:'',why:'נוצר בצ׳אט החי של חדר הכותבים.',opens:'',characters:[],tags:['צ׳אט חי','הצעה'],saved:true};
    }
    const old=button?.textContent;
    if(button){button.disabled=true;button.textContent='שומר…';}
    try{
      await window.RaikaWorkspaceClient.save(item);
      if(button)button.textContent='נשמר ✓';
      if(typeof toast==='function')toast(type==='scene'?'הסצנה נשמרה בפיתוח.':type==='plotline'?'קו העלילה נשמר כלא קאנוני.':'הרעיון נשמר.');
    }catch(_){
      if(button){button.disabled=false;button.textContent=old;}
      if(typeof toast==='function')toast('השמירה נכשלה.');
    }
  }
  function init(){
    if(state.started)return;
    const root=document.getElementById('raika-writers-chat');
    if(!root)return;
    state.started=true;
    const form=document.getElementById('rwc-form');
    form?.addEventListener('submit',e=>{e.preventDefault();ask(document.getElementById('rwc-input')?.value||'');});
    root.addEventListener('click',async e=>{
      const prompt=e.target.closest('[data-rwc-prompt]');
      if(prompt){await ask(prompt.dataset.rwcPrompt);return;}
      const fresh=e.target.closest('[data-rwc-new]');
      if(fresh){newConversation();return;}
      const copy=e.target.closest('[data-rwc-copy]');
      if(copy){const m=state.messages[Number(copy.dataset.rwcCopy)];if(m){await navigator.clipboard.writeText(messageText(m));if(typeof toast==='function')toast('הועתק.');}return;}
      const save=e.target.closest('[data-rwc-save]');
      if(save){await saveMessage(save.dataset.rwcIndex,save.dataset.rwcSave,save);return;}
    });
    if(window.RaikaPrivate?.authorized)loadHistory();
    else{
      render();
      document.addEventListener('raika:private-ready',loadHistory,{once:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.RaikaWritersChat={init,ask,newConversation,currentThreadId,buildCanonContext,state};
})();