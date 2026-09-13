import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {validateAction,validateStatus,sanitizeWorkspacePayload} from '../_shared/raika-workspace-core.mjs';

const url=Deno.env.get('SUPABASE_URL')||'';
const anon=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'';
const allowedOrigins=new Set(['https://benaviv311-eng.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const itemFields='id,item_type,item_id,status,payload,sheet_sync_status,sheet_synced_at,sheet_sync_error,sheet_sync_attempted_at,created_at,updated_at';
function cors(req:Request){const origin=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://benaviv311-eng.github.io','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(req),'Content-Type':'application/json; charset=utf-8'}});}
function cleanId(v:unknown,max=160){return typeof v==='string'?v.trim().slice(0,max):'';}
function syncPatch(status:string){const pending=status==='canon'||status==='archived';return {sheet_sync_status:pending?'pending':'not_needed',sheet_synced_at:pending?null:null,sheet_sync_error:null,sheet_sync_attempted_at:null};}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
  const auth=req.headers.get('authorization')||'';
  const token=auth.replace(/^Bearer\s+/i,'');
  if(!token)return json(req,{error:'Authentication required'},401);
  const db=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await db.auth.getUser(token);
  const user=userData.user;
  if(userError||!user)return json(req,{error:'Invalid session'},401);
  let body:any={};
  try{body=await req.json();}catch{return json(req,{error:'Invalid JSON'},400);}
  let action='';
  try{action=validateAction(body.action);}catch(e){return json(req,{error:(e as Error).message},400);}
  const itemType=cleanId(body.item_type,50);
  const itemId=cleanId(body.item_id,160);

  if(action==='list'){
    const {data,error}=await db.from('raika_item_edits').select(itemFields).eq('user_id',user.id).order('updated_at',{ascending:false});
    return error?json(req,{error:error.message},400):json(req,{ok:true,items:data||[]});
  }
  if(action==='versions'){
    if(!itemType||!itemId)return json(req,{error:'Item required'},400);
    const {data,error}=await db.from('raika_item_versions').select('id,edit_id,item_type,item_id,status,payload,created_at').eq('user_id',user.id).eq('item_type',itemType).eq('item_id',itemId).order('created_at',{ascending:false}).limit(100);
    return error?json(req,{error:error.message},400):json(req,{ok:true,versions:data||[]});
  }
  if(!itemType||!itemId)return json(req,{error:'Item required'},400);

  const {data:current,error:currentError}=await db.from('raika_item_edits').select(itemFields).eq('user_id',user.id).eq('item_type',itemType).eq('item_id',itemId).maybeSingle();
  if(currentError)return json(req,{error:currentError.message},400);

  if(action==='delete'){
    if(current?.status==='canon'||current?.status==='archived')return json(req,{error:'Approved items must be archived'},409);
    if(!current)return json(req,{ok:true,deleted:false});
    const {error}=await db.from('raika_item_edits').delete().eq('id',current.id).eq('user_id',user.id);
    return error?json(req,{error:error.message},400):json(req,{ok:true,deleted:true,item_id:itemId});
  }

  if(action==='restore'){
    const versionId=cleanId(body.version_id,80);
    if(!versionId)return json(req,{error:'Version required'},400);
    const {data:version,error:versionError}=await db.from('raika_item_versions').select('id,status,payload').eq('id',versionId).eq('user_id',user.id).eq('item_type',itemType).eq('item_id',itemId).single();
    if(versionError||!version)return json(req,{error:'Version not found'},404);
    if(current){const {error:snapError}=await db.from('raika_item_versions').insert({user_id:user.id,edit_id:current.id,item_type:itemType,item_id:itemId,status:current.status,payload:current.payload});if(snapError)return json(req,{error:snapError.message},400);}
    const row={user_id:user.id,item_type:itemType,item_id:itemId,status:version.status,payload:version.payload,updated_at:new Date().toISOString(),...syncPatch(version.status)};
    const {data,error}=await db.from('raika_item_edits').upsert(row,{onConflict:'user_id,item_type,item_id'}).select(itemFields).single();
    return error?json(req,{error:error.message},400):json(req,{ok:true,item:data});
  }

  let status='idea';
  try{status=validateStatus(action==='approve'?'canon':action==='archive'?'archived':body.status||(current?.status||'idea'));}catch(e){return json(req,{error:(e as Error).message},400);}
  const payload=sanitizeWorkspacePayload(body.payload||(current?.payload||{}));
  if(!payload.title)return json(req,{error:'Title required'},400);

  if(action!=='autosave'&&current){
    const {error:snapError}=await db.from('raika_item_versions').insert({user_id:user.id,edit_id:current.id,item_type:itemType,item_id:itemId,status:current.status,payload:current.payload});
    if(snapError)return json(req,{error:snapError.message},400);
  }
  const row={user_id:user.id,item_type:itemType,item_id:itemId,status,payload,updated_at:new Date().toISOString(),...syncPatch(status)};
  const {data,error}=await db.from('raika_item_edits').upsert(row,{onConflict:'user_id,item_type,item_id'}).select(itemFields).single();
  return error?json(req,{error:error.message},400):json(req,{ok:true,item:data});
});
