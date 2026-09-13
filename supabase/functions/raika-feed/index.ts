import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
import {
  buildFeedPrompt,
  buildFeedSchema,
  dedupeCards,
  mapOpenAIError,
  normalizeFeedRequest,
  summarizeFeedback,
} from '../_shared/raika-feed-core.mjs';

const url=Deno.env.get('SUPABASE_URL')||'';
const anon=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'';
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const allowedOrigins=new Set(['https://benaviv311-eng.github.io','http://localhost:8000','http://127.0.0.1:8000']);
const feedbackActions=new Set(['shown','liked','saved','more_like','less_like','discussed','developed','converted_scene','hidden']);

function cors(req:Request){
  const origin=req.headers.get('origin')||'';
  return {
    'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://benaviv311-eng.github.io',
    'Access-Control-Allow-Headers':'authorization, apikey, content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Vary':'Origin',
  };
}
function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(req),'Content-Type':'application/json; charset=utf-8'}});}
function text(v:unknown,max=6000){return typeof v==='string'?v.trim().slice(0,max):String(v??'').trim().slice(0,max);}
function object(v:unknown,max=6000){
  if(!v||typeof v!=='object'||Array.isArray(v))return {};
  try{const s=JSON.stringify(v);return JSON.parse(s.slice(0,max));}catch{return {};}
}
function answerText(r:any){
  if(typeof r?.output_text==='string')return r.output_text.trim();
  const parts:string[]=[];
  for(const o of r?.output||[])for(const c of o?.content||[])if(c?.type==='output_text'&&c?.text)parts.push(c.text);
  return parts.join('\n').trim();
}
async function authorizedUser(req:Request){
  const auth=req.headers.get('authorization')||'';
  const token=auth.replace(/^Bearer\s+/i,'');
  if(!token)return null;
  const client=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await client.auth.getUser(token);
  if(userError||!userData.user)return null;
  const {data:allow,error:allowError}=await client.from('raika_authorized_users').select('email_hash').limit(1);
  if(allowError||!allow?.length)return null;
  return userData.user;
}
async function openAI(req:Request,apiKey:string,body:Record<string,unknown>){
  let response:Response;
  try{
    response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),
    });
  }catch(e){
    return {error:json(req,{error:'OpenAI network request failed',code:'openai_network',detail:e instanceof Error?e.message:'network error'},502)};
  }
  const raw=await response.json().catch(()=>({}));
  if(!response.ok)return {error:json(req,{error:'OpenAI request failed',code:mapOpenAIError(response.status),detail:raw?.error?.message||raw?.error?.code||'unknown'},502)};
  const output=answerText(raw);
  if(!output)return {error:json(req,{error:'Empty AI response',code:'openai_empty'},502)};
  return {output};
}
function sceneSchema(){return {
  type:'object',additionalProperties:false,
  required:['title','opening','trigger','beats','dialogue','turning_point','ending','placement','why','opens','characters','tags'],
  properties:{
    title:{type:'string'},opening:{type:'string'},trigger:{type:'string'},beats:{type:'array',items:{type:'string'}},
    dialogue:{type:'string'},turning_point:{type:'string'},ending:{type:'string'},placement:{type:'string'},why:{type:'string'},opens:{type:'string'},
    characters:{type:'array',items:{type:'string'}},tags:{type:'array',items:{type:'string'}},
  }
};}
function cleanRecentCard(row:any){return {
  id:row.id,card_type:row.card_type,title:row.title,body:row.body,signature:row.signature,
  creativity_distance:row.creativity_distance,...(row.structured_payload&&typeof row.structured_payload==='object'?row.structured_payload:{}),
};}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
  const user=await authorizedUser(req);
  if(!user)return json(req,{error:'Not authorized',code:'not_authorized'},403);
  let raw:any={};try{raw=await req.json();}catch{return json(req,{error:'Invalid JSON',code:'invalid_json'},400);}
  let requestData;try{requestData=normalizeFeedRequest(raw);}catch(e){return json(req,{error:e instanceof Error?e.message:'Invalid feed request',code:'invalid_request'},400);}

  if(requestData.action==='feedback'){
    const cardId=text(raw.card_id,80),feedbackAction=text(raw.feedback_action,40),promotedItemId=text(raw.promoted_item_id,180);
    if(!cardId||!feedbackActions.has(feedbackAction))return json(req,{error:'Invalid feedback',code:'invalid_feedback'},400);
    const {data:card,error:cardError}=await admin.from('raika_feed_cards').select('id,card_type').eq('id',cardId).eq('user_id',user.id).maybeSingle();
    if(cardError)return json(req,{error:cardError.message,code:'card_lookup_failed'},500);
    if(!card)return json(req,{error:'Feed card not found',code:'card_not_found'},404);
    const metadata={...object(raw.metadata,5000),card_type:card.card_type};
    const {error:feedbackError}=await admin.from('raika_feed_feedback').insert({user_id:user.id,card_id:card.id,action:feedbackAction,metadata});
    if(feedbackError)return json(req,{error:feedbackError.message,code:'feedback_save_failed'},500);
    const patch:any={};
    if(feedbackAction==='hidden')patch.hidden_at=new Date().toISOString();
    if(promotedItemId)patch.promoted_item_id=promotedItemId;
    if(Object.keys(patch).length){
      const {error:patchError}=await admin.from('raika_feed_cards').update(patch).eq('id',card.id).eq('user_id',user.id);
      if(patchError)return json(req,{error:patchError.message,code:'card_update_failed'},500);
    }
    return json(req,{ok:true});
  }

  const [{data:workspace,error:workspaceError},{data:recentRows,error:recentError},{data:feedback,error:feedbackError}]=await Promise.all([
    admin.from('raika_item_edits').select('item_type,item_id,status,payload,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(80),
    admin.from('raika_feed_cards').select('id,card_type,title,body,signature,creativity_distance,structured_payload,context_refs,created_at,hidden_at,promoted_item_id').eq('user_id',user.id).order('created_at',{ascending:false}).limit(80),
    admin.from('raika_feed_feedback').select('action,metadata,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(200),
  ]);
  if(workspaceError||recentError||feedbackError)return json(req,{error:(workspaceError||recentError||feedbackError)?.message||'Context load failed',code:'context_load_failed'},500);
  const recentCards=(recentRows||[]).map(cleanRecentCard);
  let seedCard:any=null;
  if(requestData.action==='more_like'||requestData.action==='expand_scene'){
    seedCard=recentCards.find((c:any)=>String(c.id)===requestData.seed_card_id)||null;
    if(!seedCard&&requestData.seed_card_id){
      const {data,error}=await admin.from('raika_feed_cards').select('id,card_type,title,body,signature,creativity_distance,structured_payload,context_refs').eq('id',requestData.seed_card_id).eq('user_id',user.id).maybeSingle();
      if(error)return json(req,{error:error.message,code:'seed_lookup_failed'},500);
      seedCard=data?cleanRecentCard(data):null;
    }
    if(!seedCard)return json(req,{error:'Seed card not found',code:'seed_not_found'},404);
  }

  const apiKey=Deno.env.get('OPENAI_API_KEY');
  if(!apiKey)return json(req,{error:'AI is not configured yet',code:'ai_not_configured'},503);

  if(requestData.action==='expand_scene'){
    const prompt=`אתה שותף כתיבה בעולם ראיקה. הפוך את כרטיס הפיד הבא להצעת סצנה מפורטת בעברית. זו הצעה בלבד, לא קאנון. אל תסתור קאנון קיים; אם הכרטיס מציע המצאה חדשה, שמור עליה כהצעה.\n\nכרטיס:\n${JSON.stringify(seedCard).slice(0,8000)}\n\nהקשר עולם:\n${JSON.stringify(requestData.base_context).slice(0,22000)}\n\nחומר פרטי רלוונטי:\n${JSON.stringify(workspace||[]).slice(0,12000)}`;
    const result=await openAI(req,apiKey,{
      model:'gpt-5.6-sol',input:prompt,reasoning:{effort:'medium'},
      text:{format:{type:'json_schema',name:'raika_scene_proposal',strict:true,schema:sceneSchema()}},
    });
    if(result.error)return result.error;
    let proposal;try{proposal=JSON.parse(result.output!);}catch{return json(req,{error:'Invalid structured AI response',code:'openai_invalid_json'},502);}
    return json(req,{ok:true,proposal});
  }

  const preferences=summarizeFeedback(feedback||[]);
  const prompt=buildFeedPrompt({count:requestData.count,baseContext:requestData.base_context,workspace:workspace||[],recentCards,preferences,seedCard});
  const result=await openAI(req,apiKey,{
    model:'gpt-5.6-sol',input:prompt,reasoning:{effort:'medium'},
    text:{format:{type:'json_schema',name:'raika_feed_batch',strict:true,schema:buildFeedSchema(requestData.count)}},
  });
  if(result.error)return result.error;
  let parsed:any;try{parsed=JSON.parse(result.output!);}catch{return json(req,{error:'Invalid structured AI response',code:'openai_invalid_json'},502);}
  const requestSignatureRows=requestData.recent_signatures.map((signature:string)=>({signature}));
  let accepted;
  if(requestData.action==='more_like'){
    const nonSeedRecent=[...recentCards.filter((c:any)=>String(c.id)!==String(seedCard.id)),...requestSignatureRows];
    accepted=dedupeCards(parsed?.cards||[],nonSeedRecent,{allowSeedVariation:false});
    accepted=dedupeCards(accepted,[seedCard],{allowSeedVariation:true});
  }else{
    accepted=dedupeCards(parsed?.cards||[],[...recentCards,...requestSignatureRows],{allowSeedVariation:false});
  }
  if(!accepted.length)return json(req,{error:'No fresh feed cards returned',code:'empty_feed_batch'},502);
  const batchId=crypto.randomUUID();
  const rows=accepted.map((card:any)=>({
    user_id:user.id,card_type:card.card_type,title:card.title,body:card.body,
    structured_payload:{status:'proposal',characters:card.characters,entities:card.entities,suggested_placement:card.suggested_placement,why_it_may_work:card.why_it_may_work,tags:card.tags},
    context_refs:card.context_refs,creativity_distance:card.creativity_distance,signature:card.signature,batch_id:batchId,
  }));
  const {data:inserted,error:insertError}=await admin.from('raika_feed_cards').insert(rows).select('id,card_type,title,body,structured_payload,context_refs,creativity_distance,signature,batch_id,created_at,hidden_at,promoted_item_id');
  if(insertError)return json(req,{error:insertError.message,code:'feed_save_failed'},500);
  const cards=(inserted||[]).map(cleanRecentCard);
  return json(req,{ok:true,cards});
});
