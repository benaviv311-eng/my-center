import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const admin=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=origin==="https://benaviv311-eng.github.io"||origin.startsWith("http://localhost")||origin.startsWith("http://127.0.0.1");
  return {
    "Content-Type":"application/json",
    "Access-Control-Allow-Origin":allowed?origin:"https://benaviv311-eng.github.io",
    "Access-Control-Allow-Headers":"authorization, content-type, apikey",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function out(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors(req)})}
function text(v:unknown,max=12000){return typeof v==="string"?v.trim().slice(0,max):""}
function asObject(v:unknown):Record<string,unknown>{return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{}}

async function authUser(req:Request){
  const auth=req.headers.get("authorization")||"";
  const token=auth.replace(/^Bearer\s+/i,"");
  if(!token)return null;
  const client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:{user},error}=await client.auth.getUser(token);
  return error?null:user;
}

function answerText(r:any){
  if(typeof r?.output_text==="string")return r.output_text.trim();
  const parts:string[]=[];
  for(const o of r?.output||[])for(const c of o?.content||[])if(c?.type==="output_text"&&c?.text)parts.push(c.text);
  return parts.join("\n").trim();
}

async function callOpenAI(model:string,input:string){
  if(!OPENAI_API_KEY)throw new Error("AI is not configured");
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model,input,reasoning:{effort:model==="gpt-5.6-sol"?"medium":"low"}})});
  const raw=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(raw?.error?.message||`OpenAI ${response.status}`);
  const answer=answerText(raw);
  if(!answer)throw new Error("Empty AI response");
  return answer;
}

function chooseModel(question:string,pageContext:Record<string,unknown>){
  const complex=/תנתח|תכנון|תכנן|השווה|לעומק|קאנון|סצנה|מחקר|אסטרטג|מבנה|rewrite|analy|compare|research/i.test(question);
  const long=question.length>420||JSON.stringify(pageContext).length>10000;
  return complex||long?"gpt-5.6-sol":"gpt-5.6-luna";
}

async function getThread(userId:string,scopeKind:string,scopeKey:string,threadId?:string,title?:string){
  if(threadId){
    const q=await admin.from("site_chat_threads").select("*").eq("id",threadId).eq("user_id",userId).maybeSingle();
    if(q.data)return q.data;
  }
  const existing=await admin.from("site_chat_threads").select("*").eq("user_id",userId).eq("scope_kind",scopeKind).eq("scope_key",scopeKey).eq("archived",false).order("updated_at",{ascending:false}).limit(1).maybeSingle();
  if(existing.data)return existing.data;
  const created=await admin.from("site_chat_threads").insert({user_id:userId,scope_kind:scopeKind,scope_key:scopeKey,title:title||null}).select("*").single();
  if(created.error)throw created.error;
  return created.data;
}

async function listMemories(userId:string,area:string,limit=80){
  let q=admin.from("site_chat_memories").select("id,area,topic,content,importance,pinned,created_at,updated_at").eq("user_id",userId).order("pinned",{ascending:false}).order("importance",{ascending:false}).order("updated_at",{ascending:false}).limit(Math.min(Math.max(limit,1),250));
  if(area!=="all"&&area!=="global")q=q.in("area",["global",area]);
  if(area==="global")q=q.eq("area","global");
  const {data,error}=await q;if(error)throw error;return data||[];
}

function tokens(s:string){return [...new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=3))].slice(0,18)}
async function relevantSiteContent(userId:string,question:string){
  const {data,error}=await admin.from("content_items").select("id,item_type,slug,title,content,status,canon_status,visibility,created_by,updated_at").in("status",["published","draft"]).limit(120);
  if(error)return [];
  const tt=tokens(question);
  return (data||[]).filter((x:any)=>x.visibility==="public"||x.created_by===userId).map((x:any)=>{
    const hay=(x.title+" "+JSON.stringify(x.content)).toLowerCase();
    const score=tt.reduce((n,t)=>n+(hay.includes(t)?1:0),0)+(x.title&&question.includes(x.title)?3:0);
    return {x,score};
  }).filter((r:any)=>r.score>0).sort((a:any,b:any)=>b.score-a.score).slice(0,8).map((r:any)=>r.x);
}

async function signature(value:string){
  const bytes=new TextEncoder().encode(value.trim().toLowerCase().replace(/\s+/g," "));
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

function parseBlocks(raw:string){
  let clean=raw;
  let action:any=null,memories:any[]=[];
  const a=raw.match(/<ACTION_JSON>([\s\S]*?)<\/ACTION_JSON>/i);
  if(a){try{action=JSON.parse(a[1].trim())}catch{}clean=clean.replace(a[0],"")}
  const m=raw.match(/<MEMORY_JSON>([\s\S]*?)<\/MEMORY_JSON>/i);
  if(m){try{const parsed=JSON.parse(m[1].trim());if(Array.isArray(parsed))memories=parsed}catch{}clean=clean.replace(m[0],"")}
  return {answer:clean.trim(),action,memories};
}

async function storeMemories(userId:string,threadId:string,messageId:string,defaultArea:string,items:any[]){
  const kept=[];
  for(const raw of items.slice(0,3)){
    const content=text(raw?.content,800);if(!content)continue;
    const row={user_id:userId,area:text(raw?.area,80)||defaultArea||"global",topic:text(raw?.topic,120)||"כללי",content,importance:Math.min(5,Math.max(1,Number(raw?.importance)||3)),pinned:false,source_thread_id:threadId,source_message_id:messageId,signature:await signature(content),updated_at:new Date().toISOString()};
    const {data,error}=await admin.from("site_chat_memories").upsert(row,{onConflict:"user_id,signature"}).select("id,area,topic,content,importance").single();
    if(!error&&data)kept.push(data);
  }
  return kept;
}

const ALLOWED_ACTIONS=new Set(["content_create","content_update","memory_create","memory_update","memory_delete","raika_edit_upsert"]);
async function queueAction(userId:string,threadId:string,action:any){
  if(!action||!ALLOWED_ACTIONS.has(String(action.kind)))return null;
  const label=text(action.label,260)||"שינוי באתר";
  const {data,error}=await admin.from("site_chat_actions").insert({user_id:userId,thread_id:threadId,kind:String(action.kind),label,target:asObject(action.target),payload:asObject(action.payload),status:"pending"}).select("id,kind,label,target,payload,status").single();
  if(error)throw error;return data;
}

async function revision(userId:string,actionId:string|null,entityType:string,entityId:string,before:any,after:any){
  await admin.from("site_chat_revisions").insert({user_id:userId,action_id:actionId,entity_type:entityType,entity_id:entityId,before_data:before??null,after_data:after??null});
}

async function executeAction(userId:string,a:any){
  const target=asObject(a.target),payload=asObject(a.payload);
  if(a.kind==="memory_create"){
    const content=text(payload.content,800);if(!content)throw new Error("Memory content missing");
    const row={user_id:userId,area:text(payload.area,80)||"global",topic:text(payload.topic,120)||"כללי",content,importance:Math.min(5,Math.max(1,Number(payload.importance)||3)),pinned:Boolean(payload.pinned),signature:await signature(content)};
    const r=await admin.from("site_chat_memories").upsert(row,{onConflict:"user_id,signature"}).select("*").single();if(r.error)throw r.error;return r.data;
  }
  if(a.kind==="memory_update"){
    const id=text(target.id,80);if(!id)throw new Error("Memory id missing");
    const changes:any={updated_at:new Date().toISOString()};if(typeof payload.content==="string")changes.content=text(payload.content,800);if(typeof payload.topic==="string")changes.topic=text(payload.topic,120);if(typeof payload.pinned==="boolean")changes.pinned=payload.pinned;
    const r=await admin.from("site_chat_memories").update(changes).eq("id",id).eq("user_id",userId).select("*").single();if(r.error)throw r.error;return r.data;
  }
  if(a.kind==="memory_delete"){
    const id=text(target.id,80);if(!id)throw new Error("Memory id missing");
    const before=await admin.from("site_chat_memories").select("*").eq("id",id).eq("user_id",userId).maybeSingle();
    const r=await admin.from("site_chat_memories").delete().eq("id",id).eq("user_id",userId);if(r.error)throw r.error;await revision(userId,a.id,"memory",id,before.data,null);return {deleted:true};
  }
  if(a.kind==="content_create"){
    const row:any={item_type:text(payload.item_type,80)||"note",slug:text(payload.slug,160)||`chat-${crypto.randomUUID()}`,title:text(payload.title,220)||"פריט חדש",content:asObject(payload.content),status:["draft","published","archived"].includes(String(payload.status))?payload.status:"draft",visibility:["public","private"].includes(String(payload.visibility))?payload.visibility:"private",created_by:userId,updated_by:userId};
    const r=await admin.from("content_items").insert(row).select("*").single();if(r.error)throw r.error;await revision(userId,a.id,"content_item",r.data.id,null,r.data);return r.data;
  }
  if(a.kind==="content_update"){
    const id=text(target.item_id||target.id,80);if(!id)throw new Error("Content item id missing");
    const before=await admin.from("content_items").select("*").eq("id",id).maybeSingle();if(!before.data)throw new Error("Content item not found");
    const changes:any={updated_by:userId,updated_at:new Date().toISOString()};
    if(typeof payload.title==="string")changes.title=text(payload.title,220);
    if(payload.content&&typeof payload.content==="object")changes.content=payload.content;
    if(["draft","published","archived"].includes(String(payload.status)))changes.status=payload.status;
    if(["public","private"].includes(String(payload.visibility)))changes.visibility=payload.visibility;
    if(["final","building","undefined","archive",null].includes(payload.canon_status as any))changes.canon_status=payload.canon_status;
    const r=await admin.from("content_items").update(changes).eq("id",id).select("*").single();if(r.error)throw r.error;await revision(userId,a.id,"content_item",id,before.data,r.data);return r.data;
  }
  if(a.kind==="raika_edit_upsert"){
    const itemType=text(target.item_type,80),itemId=text(target.item_id,160);if(!itemType||!itemId)throw new Error("Raika target missing");
    const current=await admin.from("raika_item_edits").select("*").eq("user_id",userId).eq("item_type",itemType).eq("item_id",itemId).maybeSingle();
    if(current.data)await admin.from("raika_item_versions").insert({user_id:userId,edit_id:current.data.id,item_type:itemType,item_id:itemId,status:current.data.status,payload:current.data.payload});
    const row={user_id:userId,item_type:itemType,item_id:itemId,status:text(payload.status,80)||"developing",payload:asObject(payload.payload),updated_at:new Date().toISOString()};
    const r=await admin.from("raika_item_edits").upsert(row,{onConflict:"user_id,item_type,item_id"}).select("*").single();if(r.error)throw r.error;await revision(userId,a.id,"raika_item",`${itemType}:${itemId}`,current.data,r.data);return r.data;
  }
  throw new Error("Unsupported action");
}

function systemPrompt(scopeKey:string,consultOnly:boolean){
  return `אתה העוזר האישי בתוך האתר "המרכז שלי". ענה בעברית, בצורה טבעית, ישירה ושימושית.
הקשר האזור הנוכחי: ${scopeKey}.
בכל אזור התאם את עצמך: raika=שותף כתיבה וקאנון; coach=אימון, פסיכולוגיה ומדע; volleyball=כדורעף מקצועי; library=ספרים ורעיונות; languages=מורה לשפות; music=למידה ותרגול.
השתמש קודם בהקשר העמוד, אחר כך בזיכרונות הרלוונטיים ובתוכן האתר שנמצא עבורך. אם חסר מידע, אמור זאת.
בעולם ראיקה כל רעיון חדש הוא הצעה בלבד עד אישור מפורש לקאנון.
לעולם אל תטען ששינית את האתר אם לא בוצעה פעולה מאושרת.
${consultOnly?"מצב ייעוץ בלבד פעיל: אל תציע ACTION_JSON בכלל.":"אם המשתמש מבקש לשמור/לערוך/למחוק תוכן באתר, תן תשובה קצרה שמסבירה מה עומד להשתנות והוסף בסוף ACTION_JSON אחד בלבד. הפעולה חייבת להיות אחת מ: content_create, content_update, memory_create, memory_update, memory_delete, raika_edit_upsert. אין לבצע שינויי קוד מקור מתוך הצ׳אט החי."}
בכל תשובה הוסף בסוף בלוק MEMORY_JSON עם מערך JSON של עד 3 זיכרונות ארוכי טווח שעולים במפורש מדברי המשתמש בהודעה הנוכחית בלבד. אל תסיק מידע אישי חדש ואל תשמור שיחת חולין. לכל פריט: {"area":"global או האזור","topic":"נושא","content":"העובדה/ההחלטה","importance":1-5}. אם אין מה לזכור החזר [].
פורמט פעולה, רק כשצריך:
<ACTION_JSON>{"kind":"content_update","label":"תיאור ברור בעברית","target":{"item_id":"uuid"},"payload":{"title":"..."}}</ACTION_JSON>
פורמט זיכרון:
<MEMORY_JSON>[]</MEMORY_JSON>`;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return out(req,{error:"Method not allowed"},405);
  const user=await authUser(req);if(!user)return out(req,{error:"Not authorized",code:"not_authorized"},401);
  let b:Record<string,unknown>;try{b=await req.json()}catch{return out(req,{error:"Invalid JSON"},400)}
  const action=String(b.action||"ask");
  const scopeKind=b.scope_kind==="area"?"area":"global";
  const scopeKey=scopeKind==="global"?"global":text(b.scope_key,80)||"home";

  try{
    if(action==="threads"){
      const q=await admin.from("site_chat_threads").select("id,title,scope_kind,scope_key,created_at,updated_at").eq("user_id",user.id).eq("scope_kind",scopeKind).eq("scope_key",scopeKey).eq("archived",false).order("updated_at",{ascending:false}).limit(50);
      if(q.error)throw q.error;return out(req,{ok:true,threads:q.data||[]});
    }
    if(action==="new_thread"){
      const q=await admin.from("site_chat_threads").insert({user_id:user.id,scope_kind:scopeKind,scope_key:scopeKey,title:"שיחה חדשה"}).select("id").single();if(q.error)throw q.error;return out(req,{ok:true,thread_id:q.data.id});
    }
    if(action==="memories"){
      const area=text(b.area,80)||scopeKey;return out(req,{ok:true,memories:await listMemories(user.id,area,Number(b.limit)||80)});
    }
    if(action==="memory_update"){
      const id=text(b.memory_id,80);if(!id)return out(req,{error:"Memory id required"},400);
      const changes:any={updated_at:new Date().toISOString()};if(typeof b.content==="string"){changes.content=text(b.content,800);changes.signature=await signature(changes.content)}if(typeof b.pinned==="boolean")changes.pinned=b.pinned;if(typeof b.topic==="string")changes.topic=text(b.topic,120);
      const q=await admin.from("site_chat_memories").update(changes).eq("id",id).eq("user_id",user.id).select("*").single();if(q.error)throw q.error;return out(req,{ok:true,memory:q.data});
    }
    if(action==="memory_delete"){
      const id=text(b.memory_id,80);if(!id)return out(req,{error:"Memory id required"},400);
      const before=await admin.from("site_chat_memories").select("*").eq("id",id).eq("user_id",user.id).maybeSingle();
      const q=await admin.from("site_chat_memories").delete().eq("id",id).eq("user_id",user.id);if(q.error)throw q.error;await revision(user.id,null,"memory",id,before.data,null);return out(req,{ok:true});
    }
    if(action==="approve_action"||action==="cancel_action"){
      const id=text(b.action_id,80);const q=await admin.from("site_chat_actions").select("*").eq("id",id).eq("user_id",user.id).maybeSingle();if(!q.data)return out(req,{error:"Action not found"},404);if(q.data.status!=="pending")return out(req,{ok:true,message:"הפעולה כבר טופלה.",action:q.data});
      if(action==="cancel_action"){const u=await admin.from("site_chat_actions").update({status:"cancelled",decided_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id).select("*").single();if(u.error)throw u.error;return out(req,{ok:true,message:"הפעולה בוטלה.",action:u.data});}
      await admin.from("site_chat_actions").update({status:"approved",decided_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);
      try{const result=await executeAction(user.id,q.data);const u=await admin.from("site_chat_actions").update({status:"executed",executed_at:new Date().toISOString(),result}).eq("id",id).eq("user_id",user.id).select("*").single();if(u.error)throw u.error;return out(req,{ok:true,message:"בוצע ונשמר.",action:u.data,result})}
      catch(e){await admin.from("site_chat_actions").update({status:"failed",result:{error:e instanceof Error?e.message:"failed"}}).eq("id",id).eq("user_id",user.id);throw e}
    }

    const thread=await getThread(user.id,scopeKind,scopeKey,text(b.thread_id,80)||undefined);
    if(action==="history"){
      const q=await admin.from("site_chat_messages").select("id,role,content,model,created_at,pending_action_id").eq("user_id",user.id).eq("thread_id",thread.id).order("created_at",{ascending:true}).limit(150);if(q.error)throw q.error;
      const ids=(q.data||[]).map((m:any)=>m.pending_action_id).filter(Boolean);let actions:any[]=[];
      if(ids.length){const a=await admin.from("site_chat_actions").select("id,kind,label,target,payload,status").eq("user_id",user.id).in("id",ids);actions=a.data||[]}
      const amap=new Map(actions.map((a:any)=>[a.id,a]));
      return out(req,{ok:true,thread_id:thread.id,messages:(q.data||[]).map((m:any)=>({...m,pending_action:m.pending_action_id&&amap.get(m.pending_action_id)?.status==="pending"?amap.get(m.pending_action_id):null}))});
    }

    const question=text(b.message,8000);if(!question)return out(req,{error:"Message required"},400);
    const pageContext=asObject(b.page_context),consultOnly=Boolean(b.consult_only);
    const inserted=await admin.from("site_chat_messages").insert({thread_id:thread.id,user_id:user.id,role:"user",content:question,context_snapshot:pageContext}).select("id").single();if(inserted.error)throw inserted.error;
    const recent=await admin.from("site_chat_messages").select("role,content").eq("user_id",user.id).eq("thread_id",thread.id).order("created_at",{ascending:false}).limit(14);
    const memories=await listMemories(user.id,scopeKey,30);
    const site=await relevantSiteContent(user.id,question);
    const prompt=`${systemPrompt(scopeKey,consultOnly)}

הקשר העמוד הנוכחי:
${JSON.stringify(pageContext).slice(0,22000)}

זיכרונות רלוונטיים:
${JSON.stringify(memories).slice(0,16000)}

תוכן רלוונטי משאר האתר:
${JSON.stringify(site).slice(0,22000)}

שיחה אחרונה:
${(recent.data||[]).reverse().map((m:any)=>`${m.role}: ${m.content}`).join("\n\n").slice(0,22000)}

הודעת המשתמש:
${question}`;
    let model=chooseModel(question,pageContext),raw:string;
    try{raw=await callOpenAI(model,prompt)}catch(e){if(model==="gpt-5.6-luna"){model="gpt-5.6-sol";raw=await callOpenAI(model,prompt)}else throw e}
    const parsed=parseBlocks(raw);
    const queued=consultOnly?null:await queueAction(user.id,thread.id,parsed.action);
    const assistant=await admin.from("site_chat_messages").insert({thread_id:thread.id,user_id:user.id,role:"assistant",content:parsed.answer||"מוכן.",model,context_snapshot:pageContext,pending_action_id:queued?.id||null}).select("id,role,content,model,created_at,pending_action_id").single();if(assistant.error)throw assistant.error;
    const saved=await storeMemories(user.id,thread.id,inserted.data.id,scopeKey,parsed.memories);
    if(!thread.title||thread.title==="שיחה חדשה")await admin.from("site_chat_threads").update({title:question.slice(0,72),updated_at:new Date().toISOString()}).eq("id",thread.id).eq("user_id",user.id);else await admin.from("site_chat_threads").update({updated_at:new Date().toISOString()}).eq("id",thread.id).eq("user_id",user.id);
    return out(req,{ok:true,thread_id:thread.id,message:assistant.data,pending_action:queued,memory_updates:saved,model});
  }catch(e){
    console.error(e);
    return out(req,{error:e instanceof Error?e.message:"Server error",code:"site_chat_error"},500);
  }
});