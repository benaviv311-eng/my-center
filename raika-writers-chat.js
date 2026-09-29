(function(){
  'use strict';

  const KEY='raika-writers-chat-v1';
  const MAX_MESSAGES=60;
  const state={messages:[],sending:false};

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      const data=raw?JSON.parse(raw):[];
      state.messages=Array.isArray(data)?data.slice(-MAX_MESSAGES):[];
    }catch{state.messages=[];}
  }
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(state.messages.slice(-MAX_MESSAGES)));}catch{}
  }
  function itemLabel(kind){
    return ({idea:'💡 רעיון',scene:'🎬 סצנה',plotline:'🧭 קו עלילה לא־קאנוני',verse:'📖 פסוק / השראה'})[kind]||'💡 הצעה';
  }
  function saveLabel(kind){
    return ({idea:'💾 שמור כרעיון',scene:'🎬 שמור כסצנה',plotline:'🧭 שמור כקו לא־קאנוני',verse:'📖 שמור בפסוקים'})[kind]||'💾 שמור';
  }
  function itemHtml(item,msgIndex,itemIndex){
    return '<article class="rwc-item" data-rwc-item="'+itemIndex+'">'+
      '<div class="rwc-item-head"><span class="status-badge status-idea">'+itemLabel(item.kind)+'</span><span class="meta">הצעה בלבד</span></div>'+
      '<h4>'+esc(item.title)+'</h4>'+
      '<div class="rwc-item-body">'+esc(item.body).replace(/\n/g,'<br>')+'</div>'+
      '<div class="card-actions"><button class="btn small" type="button" data-rwc-save="'+esc(item.kind)+'" data-rwc-msg="'+msgIndex+'" data-rwc-item-index="'+itemIndex+'">'+saveLabel(item.kind)+'</button></div>'+
    '</article>';
  }
  function messageHtml(message,index){
    const mine=message.role==='user';
    const items=!mine&&Array.isArray(message.items)&&message.items.length
      ? '<div class="rwc-items">'+message.items.map((item,i)=>itemHtml(item,index,i)).join('')+'</div>'
      :'';
    return '<div class="rwc-message '+(mine?'is-user':'is-assistant')+'">'+
      '<div class="rwc-role">'+(mine?'אתה':'חדר הכותבים')+'</div>'+
      '<div class="rwc-bubble">'+esc(message.content||'').replace(/\n/g,'<br>')+'</div>'+
      items+
    '</div>';
  }
  function render(){
    const host=document.getElementById('rwc-messages');
    if(!host)return;
    if(!state.messages.length){
      host.innerHTML='<div class="rwc-empty"><b>כתוב לי כמו בצ׳אט רגיל.</b><p>למשל: „תן לי 4 סודות חדשים על קאמינארי”, „צור סצנה בין ראיקה לטומו”, או „פתח את הרעיון השלישי”.</p></div>';
      return;
    }
    host.innerHTML=state.messages.map(messageHtml).join('');
    requestAnimationFrame(()=>{host.scrollTop=host.scrollHeight;});
  }
  function history(){
    return state.messages.slice(-20).map(message=>{
      let content=String(message.content||'');
      if(message.role==='assistant'&&Array.isArray(message.items)&&message.items.length){
        content+='\n\nפריטים שהצעתי בתשובה הזו:\n'+message.items.map((item,i)=>
          (i+1)+'. ['+item.kind+'] '+item.title+' — '+item.body
        ).join('\n');
      }
      return {role:message.role,content:content.slice(0,10000)};
    });
  }
  function context(){
    return window.RaikaFeedContext?.buildFeedBaseContext?.(window.RAIKA_DATA||{})||{};
  }
  function status(textValue,isError=false){
    const el=document.getElementById('rwc-status');
    if(!el)return;
    el.textContent=textValue||'';
    el.classList.toggle('rwc-error',Boolean(isError));
  }
  async function call(message){
    const {data:{session}}=await window.RaikaPrivate.client.auth.getSession();
    if(!session)throw new Error('צריך להתחבר לחדר הכותבים.');
    const r=await fetch(BANK_URL+'/functions/v1/raika-writers-chat',{
      method:'POST',
      headers:{apikey:BANK_PUBLISHABLE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({message,history:history(),base_context:context()})
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok){
      const e=new Error(j.detail||j.error||'הצ׳אט לא הצליח להשיב.');
      e.code=j.code||'';
      throw e;
    }
    return j;
  }
  async function send(raw){
    const input=document.getElementById('rwc-input');
    const message=String(raw??input?.value??'').trim();
    if(!message||state.sending)return;
    state.sending=true;
    if(input)input.value='';
    state.messages.push({role:'user',content:message});
    persist();render();status('חושב וכותב…');
    const btn=document.getElementById('rwc-send');
    if(btn)btn.disabled=true;
    try{
      const result=await call(message);
      state.messages.push({
        role:'assistant',
        content:String(result.reply||''),
        items:Array.isArray(result.items)?result.items:[]
      });
      state.messages=state.messages.slice(-MAX_MESSAGES);
      persist();render();status('');
    }catch(e){
      state.messages.push({role:'assistant',content:'⚠️ '+(e?.message||'לא הצלחתי לענות כרגע.'),items:[]});
      persist();render();status(e?.message||'הצ׳אט נכשל.',true);
    }finally{
      state.sending=false;
      if(btn)btn.disabled=false;
      input?.focus();
    }
  }
  function workspaceItem(item){
    const base={
      id:'writers-'+item.kind+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
      title:String(item.title||'הצעה מחדר הכותבים'),
      summary:String(item.body||''),
      characters:Array.isArray(item.characters)?item.characters:[],
      saved:true
    };
    if(item.kind==='scene'){
      return {...base,type:'scene',status:'developing',tags:['writers-chat','scene-proposal',...(item.tags||[])]};
    }
    if(item.kind==='plotline'){
      return {...base,type:'idea',status:'idea',tags:['writers-chat','noncanon-plotline','קו עלילה לא קאנוני',...(item.tags||[])]};
    }
    if(item.kind==='verse'){
      return {...base,type:'philosophy',status:'idea',tags:['writers-chat','writers-verse','פסוק',...(item.tags||[])]};
    }
    return {...base,type:'idea',status:'idea',tags:['writers-chat','idea-proposal',...(item.tags||[])]};
  }
  async function saveItem(button){
    const msgIndex=Number(button.dataset.rwcMsg);
    const itemIndex=Number(button.dataset.rwcItemIndex);
    const item=state.messages[msgIndex]?.items?.[itemIndex];
    if(!item)return;
    if(!window.RaikaPrivate?.authorized||!window.RaikaWorkspaceClient?.save){
      if(typeof toast==='function')toast('כדי לשמור צריך להתחבר לחדר הכותבים.');
      return;
    }
    button.disabled=true;
    const original=button.textContent;
    button.textContent='שומר…';
    try{
      await window.RaikaWorkspaceClient.save(workspaceItem(item));
      button.textContent='נשמר ✓';
      if(typeof toast==='function')toast('נשמר בחדר הכותבים.');
    }catch{
      button.disabled=false;
      button.textContent=original;
      if(typeof toast==='function')toast('השמירה נכשלה.');
    }
  }
  function newChat(){
    if(state.messages.length&&!confirm('לפתוח צ׳אט חדש? ההיסטוריה הנוכחית תימחק מהמכשיר הזה.'))return;
    state.messages=[];
    persist();render();status('');
    document.getElementById('rwc-input')?.focus();
  }
  function init(){
    if(!document.getElementById('raika-live-chat'))return;
    load();render();
    document.getElementById('rwc-send')?.addEventListener('click',()=>send());
    document.getElementById('rwc-new-chat')?.addEventListener('click',newChat);
    document.getElementById('rwc-input')?.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}
    });
    document.getElementById('raika-live-chat')?.addEventListener('click',e=>{
      const save=e.target.closest('[data-rwc-save]');
      if(save){e.preventDefault();saveItem(save);return;}
      const prompt=e.target.closest('[data-rwc-prompt]');
      if(prompt){e.preventDefault();send(prompt.dataset.rwcPrompt||'');}
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();

  window.RaikaWritersChat={send,newChat,state};
})();