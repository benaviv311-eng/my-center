const RaikaPrivate={client:null,user:null,authorized:false,base:null,edits:new Map()};
function rpKey(type,id){return `${type}:${id}`}
function rpClone(v){return JSON.parse(JSON.stringify(v))}
function rpCollection(type){return ({character:'characters',scene:'scenes',plotline:'plotlines',history:'history',world:'world',relationship:'relationships',idea:'ideas',conversation:'ideas',comedy:'ideas',flashback:'ideas',philosophy:'ideas',worldbuilding:'ideas',thought:'ideas',desire:'ideas',heritage:'ideas'})[type]||'ideas'}
function rpNotice(text){if(typeof toast==='function')toast(text)}
function rpFind(type,id){return window.RAIKA_DATA?.[rpCollection(type)]?.find(x=>x.id===id)}
function rpLoginPanel(){
  if(document.getElementById('raika-private-panel'))return;
  const host=document.querySelector('.raika-hub');if(!host)return;
  host.insertAdjacentHTML('beforeend','<div id="raika-private-panel" class="raika-private-panel card"><div class="rp-public"><b>🔐 חדר כותבים פרטי</b><p class="meta">התחבר במייל כדי לערוך, לשמור גרסאות ולהתייעץ איתי.</p><form id="rp-login"><input id="rp-email" class="search" type="email" autocomplete="email" placeholder="כתובת המייל שלך" required><button class="btn" type="submit">שלח קישור כניסה</button></form></div><div class="rp-owner hidden"><b>🔓 מצב עריכה פרטי פעיל</b> <button id="rp-logout" class="btn small" type="button">התנתק</button></div></div>');
  document.getElementById('rp-login').addEventListener('submit',rpLogin);
  document.getElementById('rp-logout').addEventListener('click',async()=>{await RaikaPrivate.client.auth.signOut();location.reload()});
}
async function rpLogin(e){
  e.preventDefault();const email=document.getElementById('rp-email').value.trim();if(!email)return;
  const {error}=await RaikaPrivate.client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});
  if(error){rpNotice('לא ניתן לשלוח קישור. ייתכן שהחשבון עדיין לא נוצר.');return}rpNotice('קישור כניסה נשלח למייל.')
}
async function rpAuthorize(session){
  RaikaPrivate.user=session?.user||null;RaikaPrivate.authorized=false;document.body.classList.remove('raika-private-authorized');
  if(!RaikaPrivate.user)return;
  const {data}=await RaikaPrivate.client.from('raika_authorized_users').select('email_hash').limit(1);
  if(!data?.length){rpNotice('החשבון אינו מורשה לחדר הכותבים.');return}
  RaikaPrivate.authorized=true;document.body.classList.add('raika-private-authorized');
  document.querySelector('.rp-public')?.classList.add('hidden');document.querySelector('.rp-owner')?.classList.remove('hidden');
  await rpReloadEdits();document.dispatchEvent(new CustomEvent('raika:private-ready'));
}
async function rpReloadEdits(){
  if(!RaikaPrivate.authorized)return;
  const {data,error}=await RaikaPrivate.client.from('raika_item_edits').select('id,item_type,item_id,status,payload,created_at,updated_at').eq('user_id',RaikaPrivate.user.id);
  if(error){rpNotice('לא הצלחתי לטעון את העריכות.');return}
  RaikaPrivate.edits=new Map((data||[]).map(x=>[rpKey(x.item_type,x.item_id),x]));
  const next=rpClone(RaikaPrivate.base);
  for(const edit of data||[]){const col=rpCollection(edit.item_type);let item=next[col]?.find(x=>x.id===edit.item_id);if(item)Object.assign(item,edit.payload,{status:edit.status,_private:true});else if(col==='ideas')next.ideas.push({id:edit.item_id,type:'idea',status:edit.status,...edit.payload,_private:true})}
  window.RAIKA_DATA=next;if(typeof renderAll==='function')renderAll();document.dispatchEvent(new CustomEvent('raika:private-rendered'));
}
async function rpSave(type,id,status,payload){
  const cur=RaikaPrivate.edits.get(rpKey(type,id));
  if(cur){const {error:vErr}=await RaikaPrivate.client.from('raika_item_versions').insert({user_id:RaikaPrivate.user.id,edit_id:cur.id,item_type:type,item_id:id,status:cur.status,payload:cur.payload});if(vErr)return vErr}
  const {error}=await RaikaPrivate.client.from('raika_item_edits').upsert({user_id:RaikaPrivate.user.id,item_type:type,item_id:id,status,payload,updated_at:new Date().toISOString()},{onConflict:'user_id,item_type,item_id'});if(!error)await rpReloadEdits();return error
}
async function rpInit(){
  rpLoginPanel();RaikaPrivate.base=rpClone(window.RAIKA_DATA);
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');RaikaPrivate.client=createClient(BANK_URL,BANK_PUBLISHABLE_KEY);
  const {data:{session}}=await RaikaPrivate.client.auth.getSession();await rpAuthorize(session);
  RaikaPrivate.client.auth.onAuthStateChange((_e,s)=>setTimeout(()=>rpAuthorize(s),0));
  window.RaikaPrivate=RaikaPrivate;window.RaikaPrivateAPI={find:rpFind,key:rpKey,collection:rpCollection,reload:rpReloadEdits,save:rpSave};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rpInit);else rpInit();