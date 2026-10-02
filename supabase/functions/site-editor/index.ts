import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwner, serviceClient } from "../_shared/site-editor/auth.ts";
import { EditorError, safeEditorError } from "../_shared/site-editor/errors.ts";
import {
  githubBranchHead,
  githubChecksForRef,
  githubCommitFiles,
  githubCreateEditBranch,
  githubCreateOrUpdatePR,
  githubDispatchWorkflow,
  githubMergePR,
  githubPagesRunForSha,
  githubCommitChangedPaths,
  githubReadFile,
  githubReadFileBase64,
  githubReadFileMaybe,
  githubTree,
  githubWorkflowRunForSha
} from "../_shared/site-editor/github.ts";
import { applyOperations, writesToArray } from "../_shared/site-editor/operations.ts";
import { assertSafePath, riskAtMost, validateEditPlan } from "../_shared/site-editor/policy.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SUPABASE_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")||"";
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const SITE_EDITOR_MODEL_STRONG=Deno.env.get("SITE_EDITOR_MODEL_STRONG")||"";
const SITE_EDITOR_MODEL_FAST=Deno.env.get("SITE_EDITOR_MODEL_FAST")||"";
const SITE_EDITOR_INTERNAL_SECRET=Deno.env.get("SITE_EDITOR_INTERNAL_SECRET")||"";
const SUPABASE_DEPLOY_WORKFLOW="site-editor-supabase-deploy.yml";
const admin=serviceClient();

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=origin==="https://benaviv311-eng.github.io"||origin.startsWith("http://localhost")||origin.startsWith("http://127.0.0.1");
  return {
    "Access-Control-Allow-Origin":allowed?origin:"https://benaviv311-eng.github.io",
    "Access-Control-Allow-Headers":"authorization, content-type, apikey",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}
function out(req:Request,body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors(req),"Content-Type":"application/json"}});
}
function asObject(v:unknown):Record<string,unknown>{
  return v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
function text(v:unknown,max=12000){
  return typeof v==="string"?v.trim().slice(0,max):"";
}
function answerText(r:any){
  if(typeof r?.output_text==="string")return r.output_text.trim();
  const parts:string[]=[];
  for(const o of r?.output||[])for(const c of o?.content||[])if(c?.type==="output_text"&&c?.text)parts.push(c.text);
  return parts.join("\n").trim();
}
function safeSlug(value:string){
  const s=value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,32);
  return s||"change";
}
function pagePath(pageContext:Record<string,unknown>){
  let p=text(pageContext.pathname,400).replace(/^https?:\/\/[^/]+/i,"").replace(/^\/+|\/+$/g,"");
  if(p.startsWith("my-center/"))p=p.slice("my-center/".length);
  return p||"index.html";
}
function linkedAssets(html:string){
  const set=new Set<string>();
  const re=/(?:src|href)=["']([^"'?#]+\.(?:js|css|html))[^"']*["']/gi;
  for(const match of html.matchAll(re)){
    let p=match[1].replace(/^\.\//,"").replace(/^\/+/, "");
    if(p.startsWith("my-center/"))p=p.slice("my-center/".length);
    if(p&&!p.startsWith("http"))set.add(p);
  }
  return [...set];
}
function relevantPathScore(path:string,prompt:string){
  const lower=path.toLowerCase(),q=prompt.toLowerCase();
  let score=0;
  for(const token of q.split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=3)){
    if(lower.includes(token))score++;
  }
  return score;
}
async function collectRelevantFiles(prompt:string,pageContext:Record<string,unknown>,baseRef:string){
  const tree=await githubTree(baseRef);
  const blobs=new Map(tree.filter(x=>x.type==="blob").map(x=>[x.path,x.sha]));
  const wanted:string[]=[];
  const add=(p:string)=>{if(blobs.has(p)&&!wanted.includes(p)){try{assertSafePath(p);wanted.push(p)}catch{}}};
  const page=pagePath(pageContext);
  add(page);
  if(blobs.has(page)){
    const f=await githubReadFile(page,baseRef);
    for(const asset of linkedAssets(f.content))add(asset);
  }
  for(const common of ["app.js","styles.css","site-chat.js","site-chat.css"])add(common);
  const broad=/כל האתר|בכל האתר|site[- ]?wide|global layout/i.test(prompt);
  const ranked=tree.filter(x=>x.type==="blob").map(x=>({path:x.path,score:relevantPathScore(x.path,prompt)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  for(const item of ranked.slice(0,broad?16:8))add(item.path);
  if(broad)for(const item of tree.filter(x=>x.type==="blob"&&/^[^/]+\.html$/.test(x.path)).slice(0,12))add(item.path);
  const limited=wanted.slice(0,24);
  const files:Record<string,{sha:string;content:string}>={};
  for(const path of limited){
    const f=await githubReadFile(path,baseRef);
    files[path]={sha:f.sha,content:f.content.slice(0,90000)};
  }
  return files;
}

const EDIT_PLAN_SCHEMA={
  type:"object",
  additionalProperties:false,
  required:["summary","risk_level","operations","tests"],
  properties:{
    summary:{type:"string"},
    risk_level:{type:"string",enum:["low","medium","high"]},
    tests:{type:"array",items:{type:"string"}},
    operations:{
      type:"array",minItems:1,maxItems:30,
      items:{
        type:"object",additionalProperties:false,
        required:["operation_type","path","expected_sha","payload","diff_summary"],
        properties:{
          operation_type:{type:"string",enum:["replace_text","replace_file","create_file","delete_file"]},
          path:{type:"string"},
          expected_sha:{type:["string","null"]},
          diff_summary:{type:"string"},
          payload:{
            type:"object",additionalProperties:false,
            required:["old_text","new_text","new_content","content","expected_occurrences"],
            properties:{
              old_text:{type:["string","null"]},
              new_text:{type:["string","null"]},
              new_content:{type:["string","null"]},
              content:{type:["string","null"]},
              expected_occurrences:{type:["integer","null"]}
            }
          }
        }
      }
    }
  }
};

function normalizeModelPlan(raw:any){
  const operations=(raw?.operations||[]).map((op:any)=>({
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:op.expected_sha,
    diff_summary:op.diff_summary||"",
    payload:{
      old_text:op.payload?.old_text??undefined,
      new_text:op.payload?.new_text??undefined,
      new_content:op.payload?.new_content??undefined,
      content:op.payload?.content??undefined,
      expected_occurrences:op.payload?.expected_occurrences??undefined
    }
  }));
  return {summary:text(raw?.summary,1200),risk_level:raw?.risk_level,tests:Array.isArray(raw?.tests)?raw.tests.map((x:any)=>text(x,240)).filter(Boolean):[],operations};
}

async function callPlanner(prompt:string,pageContext:Record<string,unknown>,files:Record<string,{sha:string;content:string}>){
  if(!OPENAI_API_KEY)throw new EditorError("editor_unavailable",503);
  if(!SITE_EDITOR_MODEL_STRONG||!SITE_EDITOR_MODEL_FAST)throw new EditorError("editor_model_missing",503);
  const fileContext=Object.entries(files).map(([path,f])=>`--- ${path} (sha ${f.sha}) ---\n${f.content}`).join("\n\n");
  const instruction=`You are a careful source-code editor for one static GitHub Pages site.
Return only a structured edit plan. Never claim execution.
Use only files supplied below. Prefer replace_text for localized changes. Use replace_file only when truly necessary.
For every existing file operation, expected_sha must exactly equal the supplied SHA. create_file uses null expected_sha.
old_text must be an exact substring and expected_occurrences must match the intended exact count.
Never edit secrets, credentials, .git, private keys, or files not required by the request.
User goal:
${prompt}

Current page context:
${JSON.stringify(pageContext).slice(0,18000)}

Relevant repository files:
${fileContext.slice(0,260000)}`;
  const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:SITE_EDITOR_MODEL_STRONG,
      input:[{role:"user",content:[{type:"input_text",text:instruction}]}],
      reasoning:{effort:"medium"},
      text:{format:{type:"json_schema",name:"site_edit_plan",strict:true,schema:EDIT_PLAN_SCHEMA}}
    })
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    console.error("site-editor planner failed",{status:response.status,code:data?.error?.code||null});
    throw new EditorError("editor_unavailable",503);
  }
  const output=answerText(data);
  if(!output)throw new EditorError("editor_unavailable",503);
  try{return normalizeModelPlan(JSON.parse(output))}
  catch{throw new EditorError("editor_unavailable",503)}
}

async function callRepairPlanner(
  request:any,
  approvedOperations:any[],
  files:Record<string,{sha:string;content:string}>,
  failures:Array<{name:string;conclusion:string|null}>
){
  if(!OPENAI_API_KEY||!SITE_EDITOR_MODEL_STRONG)throw new EditorError("editor_unavailable",503);
  const fileContext=Object.entries(files).map(([path,file])=>`--- ${path} (sha ${file.sha}) ---\n${file.content}`).join("\n\n");
  const prompt=`Repair a previously approved site edit after automated validation failed.
Do not broaden the user's goal. Do not add product features.
You may modify only the supplied files. Prefer the originally approved paths; test files may be adjusted only when the existing test is genuinely coupled to the approved change.
Return the same strict edit-plan JSON schema.

User goal:
${request.prompt}

Original deterministic risk ceiling: ${request.risk_level}

Approved operations:
${JSON.stringify(approvedOperations).slice(0,30000)}

Validation failures:
${JSON.stringify(failures).slice(0,12000)}

Current branch files:
${fileContext.slice(0,260000)}`;
  const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:SITE_EDITOR_MODEL_STRONG,
      input:[{role:"user",content:[{type:"input_text",text:prompt}]}],
      reasoning:{effort:"medium"},
      text:{format:{type:"json_schema",name:"site_edit_repair",strict:true,schema:EDIT_PLAN_SCHEMA}}
    })
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new EditorError("editor_unavailable",503);
  const output=answerText(data);
  if(!output)throw new EditorError("editor_unavailable",503);
  try{return normalizeModelPlan(JSON.parse(output))}
  catch{throw new EditorError("editor_unavailable",503)}
}

async function callRollbackPlanner(
  original:any,
  snapshots:any[],
  currentFiles:Record<string,{sha:string;content:string}>
){
  if(!OPENAI_API_KEY||!SITE_EDITOR_MODEL_STRONG)throw new EditorError("editor_unavailable",503);
  const prompt=`Create a safe rollback proposal for a previously deployed site edit.
The goal is to restore the intent and content that existed before the original request while preserving unrelated later changes.
Only touch paths listed in the snapshots. If a file was changed later, make the smallest compatible rollback.
Return the same strict edit-plan JSON schema.

Original request:
${JSON.stringify({id:original.id,summary:original.summary,prompt:original.prompt,risk_level:original.risk_level}).slice(0,16000)}

Snapshots (before original change, published result, current main):
${JSON.stringify(snapshots).slice(0,220000)}

Current file SHAs:
${JSON.stringify(Object.fromEntries(Object.entries(currentFiles).map(([path,file])=>[path,file.sha])))}`;
  const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model:SITE_EDITOR_MODEL_STRONG,
      input:[{role:"user",content:[{type:"input_text",text:prompt}]}],
      reasoning:{effort:"medium"},
      text:{format:{type:"json_schema",name:"site_edit_rollback",strict:true,schema:EDIT_PLAN_SCHEMA}}
    })
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new EditorError("editor_unavailable",503);
  const output=answerText(data);
  if(!output)throw new EditorError("editor_unavailable",503);
  try{return normalizeModelPlan(JSON.parse(output))}
  catch{throw new EditorError("editor_unavailable",503)}
}

async function insertEvent(requestId:string,userId:string,eventType:string,details:Record<string,unknown>={}){
  const r=await admin.from("site_edit_events").insert({request_id:requestId,user_id:userId,event_type:eventType,details});
  if(r.error)throw new EditorError("editor_unavailable",500);
}
async function ownedRequest(userId:string,id:string){
  const q=await admin.from("site_edit_requests").select("*").eq("id",id).eq("user_id",userId).maybeSingle();
  if(q.error)throw new EditorError("editor_unavailable",500);
  if(!q.data)throw new EditorError("bad_request",404,"request_not_found");
  return q.data;
}
async function requestOperations(id:string){
  const q=await admin.from("site_edit_operations").select("*").eq("request_id",id).order("sequence",{ascending:true});
  if(q.error)throw new EditorError("editor_unavailable",500);
  return q.data||[];
}
async function requestView(userId:string,id:string){
  const request=await ownedRequest(userId,id);
  const operations=await requestOperations(id);
  const runs=await admin.from("site_edit_runs").select("*").eq("request_id",id).order("started_at",{ascending:false}).limit(30);
  return {...request,operations,runs:runs.data||[],requires_preview:request.risk_level!=="low"};
}

async function propose(user:{id:string},b:Record<string,unknown>){
  const prompt=text(b.prompt,10000);
  if(!prompt)throw new EditorError("bad_request",400);
  const area=text(b.area,80)||"global";
  const pageContext=asObject(b.page_context);
  const selectedElement=asObject(b.selected_element);
  const threadId=text(b.thread_id,80)||null;
  const baseSha=await githubBranchHead("main");
  const files=await collectRelevantFiles(prompt,pageContext,baseSha);
  if(!Object.keys(files).length)throw new EditorError("bad_request",400,"no_relevant_files");
  const modelPlan=await callPlanner(prompt,{...pageContext,selected_element:selectedElement},files);
  const validated=validateEditPlan(modelPlan,new Map(Object.entries(files)));
  const row=await admin.from("site_edit_requests").insert({
    user_id:user.id,
    thread_id:threadId,
    prompt,
    area,
    page_context:pageContext,
    selected_element:Object.keys(selectedElement).length?selectedElement:null,
    summary:modelPlan.summary||prompt.slice(0,300),
    risk_level:validated.risk_level,
    status:"awaiting_plan_approval",
    base_sha:baseSha,
    deploy_status:"not_started"
  }).select("*").single();
  if(row.error)throw new EditorError("editor_unavailable",500);
  const request=row.data;
  const opRows=validated.operations.map((op:any,index:number)=>({
    request_id:request.id,
    sequence:index,
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:op.expected_sha||null,
    payload:op.payload||{},
    diff_summary:op.diff_summary||"",
    status:"pending"
  }));
  const saved=await admin.from("site_edit_operations").insert(opRows).select("*");
  if(saved.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"proposal_created",{base_sha:baseSha,tests:modelPlan.tests||[],risk_level:validated.risk_level});
  return {...request,operations:saved.data||[],tests:modelPlan.tests||[],requires_preview:validated.risk_level!=="low"};
}

async function approvePlan(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);
  if(request.status!=="awaiting_plan_approval")throw new EditorError("bad_request",409,"request_not_awaiting_approval");
  const operations=await requestOperations(request.id);
  const currentMain=await githubBranchHead("main");
  const fileMap=new Map<string,{sha:string;content:string}>();

  for(const op of operations){
    if(op.operation_type==="create_file"){
      const tree=await githubTree(currentMain);
      if(tree.some(x=>x.type==="blob"&&x.path===op.path)){
        await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id);
        await insertEvent(request.id,user.id,"plan_stale",{path:op.path});
        throw new EditorError("stale_plan",409);
      }
      continue;
    }
    if(op.operation_type==="publish_asset")continue;
    let current;
    try{current=await githubReadFile(op.path,currentMain)}catch{
      await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id);
      throw new EditorError("stale_plan",409);
    }
    if(!op.expected_sha||current.sha!==op.expected_sha){
      await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id);
      await insertEvent(request.id,user.id,"plan_stale",{path:op.path,expected_sha:op.expected_sha,current_sha:current.sha});
      throw new EditorError("stale_plan",409);
    }
    fileMap.set(op.path,{sha:current.sha,content:current.content});
  }

  const normalized=operations.map((op:any)=>({
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:op.expected_sha,
    payload:op.payload,
    diff_summary:op.diff_summary
  }));
  const writes=applyOperations(fileMap,normalized,request.id);
  const branchName=`site-edit/${request.id.slice(0,8)}/${safeSlug(request.summary||request.prompt)}-${crypto.randomUUID().slice(0,8)}`;
  const approval=await admin.from("site_edit_approvals").insert({
    request_id:request.id,user_id:user.id,stage:"plan",decision:"approved",approved_head_sha:null
  }).select("id").single();
  if(approval.error)throw new EditorError("editor_unavailable",500);
  await admin.from("site_edit_requests").update({status:"applying",base_sha:currentMain,branch_name:branchName,updated_at:new Date().toISOString()}).eq("id",request.id);
  try{
    await githubCreateEditBranch(branchName,currentMain);
    const commit=await githubCommitFiles(branchName,currentMain,`site-edit: ${request.summary||"approved change"} [req ${request.id.slice(0,8)}]`,writesToArray(writes));
    const exactApproval=await admin.from("site_edit_approvals").update({approved_head_sha:commit.commitSha}).eq("id",approval.data.id);
    if(exactApproval.error)throw new EditorError("editor_unavailable",500);
    const update=await admin.from("site_edit_requests").update({
      status:"testing",head_sha:commit.commitSha,branch_name:branchName,base_sha:currentMain,updated_at:new Date().toISOString()
    }).eq("id",request.id).select("*").single();
    if(update.error)throw new EditorError("editor_unavailable",500);
    await admin.from("site_edit_operations").update({status:"applied"}).eq("request_id",request.id);
    await insertEvent(request.id,user.id,"branch_committed",{branch_name:branchName,head_sha:commit.commitSha});
    return requestView(user.id,request.id);
  }catch(error){
    if(error instanceof EditorError&&error.code==="stale_plan"){
      await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id);
    }else{
      await admin.from("site_edit_requests").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",request.id);
    }
    throw error;
  }
}

async function latestApproval(requestId:string,stage:"plan"|"publish"){
  const q=await admin.from("site_edit_approvals")
    .select("approved_head_sha,created_at")
    .eq("request_id",requestId)
    .eq("stage",stage)
    .eq("decision","approved")
    .order("created_at",{ascending:false})
    .limit(1)
    .maybeSingle();
  if(q.error)throw new EditorError("editor_unavailable",500);
  return q.data;
}

async function safeRepairChainEndsAt(requestId:string,startSha:string,targetSha:string){
  if(startSha===targetSha)return true;
  const q=await admin.from("site_edit_events")
    .select("details,created_at")
    .eq("request_id",requestId)
    .eq("event_type","repair_committed")
    .order("created_at",{ascending:true});
  if(q.error)throw new EditorError("editor_unavailable",500);
  let cursor=startSha;
  for(const event of q.data||[]){
    const details=asObject(event.details);
    if(details.parent_head_sha===cursor&&typeof details.new_head_sha==="string")cursor=details.new_head_sha;
  }
  return cursor===targetSha;
}

async function validationState(request:any,currentHead:string){
  if(currentHead!==request.head_sha)throw new EditorError("stale_plan",409);
  const planApproval=await latestApproval(request.id,"plan");
  if(!planApproval?.approved_head_sha)throw new EditorError("stale_plan",409);
  if(planApproval.approved_head_sha!==currentHead){
    const safeRepair=await safeRepairChainEndsAt(request.id,planApproval.approved_head_sha,currentHead);
    if(!safeRepair)throw new EditorError("stale_plan",409);
  }
  const checks=await githubChecksForRef(currentHead);
  const required=checks.filter(check=>check.name==="validate"||/site editor validation/i.test(check.name));
  const pending=!required.length||required.some(check=>check.status!=="completed");
  const failed=required.some(check=>check.status==="completed"&&check.conclusion!=="success");
  const green=required.length>0&&!pending&&!failed;
  return {checks,required,pending,failed,green};
}

async function storeValidationRuns(requestId:string,headSha:string,checks:any[]){
  const cleared=await admin.from("site_edit_runs").delete().eq("request_id",requestId).eq("kind","validation");
  if(cleared.error)throw new EditorError("editor_unavailable",500);
  if(!checks.length)return;
  const rows=checks.map(check=>({
    request_id:requestId,
    kind:"validation",
    provider_run_id:check.providerRunId,
    status:check.status,
    url:check.url,
    details:{name:check.name,conclusion:check.conclusion,head_sha:headSha},
    finished_at:check.status==="completed"?new Date().toISOString():null
  }));
  const saved=await admin.from("site_edit_runs").insert(rows);
  if(saved.error)throw new EditorError("editor_unavailable",500);
}

async function ensurePullRequest(request:any,userId:string){
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_has_no_branch");
  const pr=await githubCreateOrUpdatePR(
    request.branch_name,
    `Site edit: ${request.summary||request.id}`,
    `Automated Site Editor change.\n\nRequest: ${request.id}\nRisk: ${request.risk_level}\nApproved head: ${request.head_sha}`,
    "main"
  );
  if(Number(request.pr_number)!==pr.number){
    const update=await admin.from("site_edit_requests").update({pr_number:pr.number,updated_at:new Date().toISOString()}).eq("id",request.id);
    if(update.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,userId,"pull_request_ready",{pr_number:pr.number,url:pr.url,head_sha:request.head_sha});
  }
  return pr;
}

async function approvePublish(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);
  if(!["preview_ready","awaiting_publish_approval"].includes(request.status)){
    throw new EditorError("bad_request",409,"request_not_publishable");
  }
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_has_no_branch");
  const currentHead=await githubBranchHead(request.branch_name);
  const validation=await validationState(request,currentHead);
  if(!validation.green)throw new EditorError("bad_request",409,"validation_not_green");
  await ensurePullRequest(request,user.id);
  const inserted=await admin.from("site_edit_approvals").insert({
    request_id:request.id,
    user_id:user.id,
    stage:"publish",
    decision:"approved",
    approved_head_sha:currentHead
  });
  if(inserted.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"publish_approved",{approved_head_sha:currentHead});
  return requestView(user.id,request.id);
}

async function requestTouchesMigrations(requestId:string){
  const operations=await requestOperations(requestId);
  return operations.some((op:any)=>String(op.path||"").startsWith("supabase/migrations/"));
}

async function dispatchDbDeployment(user:{id:string},request:any,currentHead:string){
  if(request.risk_level!=="high")throw new EditorError("unsafe_plan",409,"migration_requires_high_risk");
  const runId=await githubDispatchWorkflow(SUPABASE_DEPLOY_WORKFLOW,request.branch_name,{
    request_id:request.id,
    branch:request.branch_name,
    head_sha:currentHead
  });
  const cleared=await admin.from("site_edit_runs").delete().eq("request_id",request.id).eq("kind","db_deploy");
  if(cleared.error)throw new EditorError("editor_unavailable",500);
  const saved=await admin.from("site_edit_runs").insert({
    request_id:request.id,
    kind:"db_deploy",
    provider_run_id:runId?String(runId):null,
    status:"queued",
    details:{workflow:SUPABASE_DEPLOY_WORKFLOW,branch:request.branch_name,head_sha:currentHead}
  });
  if(saved.error)throw new EditorError("editor_unavailable",500);
  const update=await admin.from("site_edit_requests").update({
    status:"deploying",
    deploy_status:"db_pending",
    updated_at:new Date().toISOString()
  }).eq("id",request.id);
  if(update.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"db_deploy_dispatched",{workflow:SUPABASE_DEPLOY_WORKFLOW,head_sha:currentHead,run_id:runId||null});
  return requestView(user.id,request.id);
}

async function refreshDbDeployment(user:{id:string},request:any){
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_has_no_branch");
  const currentHead=await githubBranchHead(request.branch_name);
  if(currentHead!==request.head_sha)throw new EditorError("stale_plan",409);
  const run=await githubWorkflowRunForSha(SUPABASE_DEPLOY_WORKFLOW,request.branch_name,currentHead);
  if(!run)return requestView(user.id,request.id);

  const cleared=await admin.from("site_edit_runs").delete().eq("request_id",request.id).eq("kind","db_deploy");
  if(cleared.error)throw new EditorError("editor_unavailable",500);
  const saved=await admin.from("site_edit_runs").insert({
    request_id:request.id,
    kind:"db_deploy",
    provider_run_id:String(run.id),
    status:run.status,
    url:run.url,
    details:{workflow:SUPABASE_DEPLOY_WORKFLOW,head_sha:currentHead,conclusion:run.conclusion},
    finished_at:run.status==="completed"?new Date().toISOString():null
  });
  if(saved.error)throw new EditorError("editor_unavailable",500);

  if(run.status!=="completed")return requestView(user.id,request.id);
  if(run.conclusion!=="success"){
    const failed=await admin.from("site_edit_requests").update({
      status:"failed",
      deploy_status:"db_failed",
      updated_at:new Date().toISOString()
    }).eq("id",request.id);
    if(failed.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"db_deploy_failed",{run_id:run.id,conclusion:run.conclusion});
    return requestView(user.id,request.id);
  }

  const health=await admin.from("site_edit_requests").select("id").limit(1);
  if(health.error){
    const failed=await admin.from("site_edit_requests").update({status:"failed",deploy_status:"db_health_failed",updated_at:new Date().toISOString()}).eq("id",request.id);
    if(failed.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"db_health_failed",{run_id:run.id});
    return requestView(user.id,request.id);
  }

  const ready=await admin.from("site_edit_requests").update({
    status:"awaiting_publish_approval",
    deploy_status:"db_success",
    updated_at:new Date().toISOString()
  }).eq("id",request.id);
  if(ready.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"db_deploy_succeeded",{run_id:run.id,head_sha:currentHead});
  return publishRequest(user,request.id,false);
}

async function publishRequest(user:{id:string},requestId:string,auto=false){
  const request=await ownedRequest(user.id,requestId);
  if(!["preview_ready","awaiting_publish_approval"].includes(request.status)){
    throw new EditorError("bad_request",409,"request_not_publishable");
  }
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_has_no_branch");
  const currentHead=await githubBranchHead(request.branch_name);
  const validation=await validationState(request,currentHead);
  if(!validation.green)throw new EditorError("bad_request",409,"validation_not_green");

  if(request.risk_level!=="low"){
    const publishApproval=await latestApproval(request.id,"publish");
    if(publishApproval?.approved_head_sha!==currentHead)throw new EditorError("stale_plan",409);
  }else if(!auto){
    const planApproval=await latestApproval(request.id,"plan");
    if(planApproval?.approved_head_sha!==currentHead)throw new EditorError("stale_plan",409);
  }

  const migrations=await requestTouchesMigrations(request.id);
  if(migrations&&request.deploy_status!=="db_success"){
    return dispatchDbDeployment(user,request,currentHead);
  }

  const pr=await ensurePullRequest(request,user.id);
  const merging=await admin.from("site_edit_requests").update({status:"merging",updated_at:new Date().toISOString()}).eq("id",request.id);
  if(merging.error)throw new EditorError("editor_unavailable",500);
  const merged=await githubMergePR(pr.number,currentHead);
  const deployed=await admin.from("site_edit_requests").update({
    status:"deploying",
    merge_commit_sha:merged.mergeCommitSha,
    deploy_status:"pending",
    updated_at:new Date().toISOString()
  }).eq("id",request.id);
  if(deployed.error)throw new EditorError("editor_unavailable",500);
  await admin.from("site_edit_previews").update({revoked_at:new Date().toISOString()}).eq("request_id",request.id).is("revoked_at",null);
  await insertEvent(request.id,user.id,"merged",{pr_number:pr.number,merge_commit_sha:merged.mergeCommitSha,auto});
  return requestView(user.id,request.id);
}

async function refreshDeployment(user:{id:string},request:any){
  if(!request.merge_commit_sha)throw new EditorError("bad_request",409,"missing_merge_sha");
  const run=await githubPagesRunForSha(request.merge_commit_sha);
  const cleared=await admin.from("site_edit_runs").delete().eq("request_id",request.id).eq("kind","pages");
  if(cleared.error)throw new EditorError("editor_unavailable",500);
  if(run){
    const saved=await admin.from("site_edit_runs").insert({
      request_id:request.id,
      kind:"pages",
      provider_run_id:run.id,
      status:run.status,
      url:run.url,
      details:{name:run.name,conclusion:run.conclusion,head_sha:request.merge_commit_sha},
      finished_at:run.status==="completed"?new Date().toISOString():null
    });
    if(saved.error)throw new EditorError("editor_unavailable",500);
  }
  if(!run||run.status!=="completed"){
    if(request.status!=="deploying"){
      await admin.from("site_edit_requests").update({status:"deploying",deploy_status:"pending",updated_at:new Date().toISOString()}).eq("id",request.id);
    }
    return requestView(user.id,request.id);
  }
  if(run.conclusion==="success"){
    const now=new Date().toISOString();
    const update=await admin.from("site_edit_requests").update({status:"deployed",deploy_status:"success",published_at:now,updated_at:now}).eq("id",request.id);
    if(update.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"deployed",{merge_commit_sha:request.merge_commit_sha,pages_run_id:run.id});
  }else{
    const update=await admin.from("site_edit_requests").update({status:"failed",deploy_status:run.conclusion||"failed",updated_at:new Date().toISOString()}).eq("id",request.id);
    if(update.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"deployment_failed",{merge_commit_sha:request.merge_commit_sha,pages_run_id:run.id,conclusion:run.conclusion});
  }
  return requestView(user.id,request.id);
}

async function replanAfterUnsafeRepair(
  user:{id:string},
  request:any,
  failures:Array<{name:string;conclusion:string|null}>
){
  const currentMain=await githubBranchHead("main");
  const combinedPrompt=`${request.prompt}\n\nAutomated validation failed. Prepare a revised proposal that addresses these failures without assuming the previous branch can be published:\n${JSON.stringify(failures)}`;
  const files=await collectRelevantFiles(combinedPrompt,asObject(request.page_context),currentMain);
  const modelPlan=await callPlanner(combinedPrompt,{...asObject(request.page_context),selected_element:asObject(request.selected_element)},files);
  const validated=validateEditPlan(modelPlan,new Map(Object.entries(files)));

  const cleared=await admin.from("site_edit_operations").delete().eq("request_id",request.id);
  if(cleared.error)throw new EditorError("editor_unavailable",500);
  const rows=validated.operations.map((op:any,index:number)=>({
    request_id:request.id,
    sequence:index,
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:op.expected_sha||null,
    payload:op.payload||{},
    diff_summary:op.diff_summary||"",
    status:"pending"
  }));
  const saved=await admin.from("site_edit_operations").insert(rows);
  if(saved.error)throw new EditorError("editor_unavailable",500);
  await admin.from("site_edit_previews").update({revoked_at:new Date().toISOString()}).eq("request_id",request.id).is("revoked_at",null);
  const updated=await admin.from("site_edit_requests").update({
    prompt:combinedPrompt,
    summary:modelPlan.summary||request.summary,
    risk_level:validated.risk_level,
    status:"awaiting_plan_approval",
    base_sha:currentMain,
    branch_name:null,
    head_sha:null,
    pr_number:null,
    updated_at:new Date().toISOString()
  }).eq("id",request.id);
  if(updated.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"repair_requires_approval",{failures});
  return requestView(user.id,request.id);
}

async function attemptRepair(
  user:{id:string},
  request:any,
  currentHead:string,
  failures:Array<{name:string;conclusion:string|null}>
){
  const countQuery=await admin.from("site_edit_events")
    .select("id",{count:"exact",head:true})
    .eq("request_id",request.id)
    .eq("event_type","repair_attempt");
  if(countQuery.error)throw new EditorError("editor_unavailable",500);
  const repair_pass=countQuery.count||0;
  if(repair_pass>=2){
    const update=await admin.from("site_edit_requests").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",request.id);
    if(update.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"repair_exhausted",{repair_pass,failures});
    return requestView(user.id,request.id);
  }

  await insertEvent(request.id,user.id,"repair_attempt",{repair_pass:repair_pass+1,head_sha:currentHead,failures});
  const approvedOperations=await requestOperations(request.id);
  const approvedPaths=new Set(approvedOperations.map((op:any)=>String(op.path)));
  const tree=await githubTree(request.branch_name);
  const candidatePaths=[
    ...approvedPaths,
    ...tree.filter(item=>item.type==="blob"&&/^tests\/.*\.test\.js$/.test(item.path)).map(item=>item.path)
  ];
  const uniquePaths=[...new Set(candidatePaths)].slice(0,40);
  const files:Record<string,{sha:string;content:string}>={};
  for(const path of uniquePaths){
    try{
      const file=await githubReadFile(path,request.branch_name);
      files[path]={sha:file.sha,content:file.content.slice(0,90000)};
    }catch{}
  }
  if(!Object.keys(files).length){
    return replanAfterUnsafeRepair(user,request,failures);
  }

  let modelPlan;
  try{
    modelPlan=await callRepairPlanner(request,approvedOperations,files,failures);
  }catch{
    return replanAfterUnsafeRepair(user,request,failures);
  }

  let validated;
  try{
    validated=validateEditPlan(modelPlan,new Map(Object.entries(files)));
  }catch{
    return replanAfterUnsafeRepair(user,request,failures);
  }

  const broadened=validated.operations.some((op:any)=>!approvedPaths.has(op.path)&&!/^tests\/.*\.test\.js$/.test(op.path));
  if(broadened||!riskAtMost(validated.risk_level,request.risk_level)){
    return replanAfterUnsafeRepair(user,request,failures);
  }

  const fileMap=new Map<string,{sha:string;content:string}>();
  for(const [path,file] of Object.entries(files))fileMap.set(path,file);
  const writes=applyOperations(fileMap,validated.operations,request.id);
  const commit=await githubCommitFiles(
    request.branch_name,
    currentHead,
    `site-edit: bounded repair ${repair_pass+1} [req ${request.id.slice(0,8)}]`,
    writesToArray(writes)
  );
  const update=await admin.from("site_edit_requests").update({
    status:"testing",
    head_sha:commit.commitSha,
    updated_at:new Date().toISOString()
  }).eq("id",request.id);
  if(update.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"repair_committed",{
    repair_pass:repair_pass+1,
    parent_head_sha:currentHead,
    new_head_sha:commit.commitSha,
    risk_level:validated.risk_level,
    paths:validated.operations.map((op:any)=>op.path)
  });
  return requestView(user.id,request.id);
}

async function refreshStatus(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);
  if(request.status==="deploying"){
    if(!request.merge_commit_sha&&String(request.deploy_status||"").startsWith("db_"))return refreshDbDeployment(user,request);
    return refreshDeployment(user,request);
  }
  if(["deployed","cancelled","rolled_back"].includes(request.status))return requestView(user.id,request.id);
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_has_no_branch");

  const currentHead=await githubBranchHead(request.branch_name);
  let validation;
  try{
    validation=await validationState(request,currentHead);
  }catch(error){
    if(error instanceof EditorError&&error.code==="stale_plan"){
      await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id);
      await insertEvent(request.id,user.id,"validation_head_stale",{expected_head_sha:request.head_sha,current_head_sha:currentHead});
    }
    throw error;
  }

  await storeValidationRuns(request.id,currentHead,validation.checks);
  if(validation.failed){
    const repairing=await admin.from("site_edit_requests").update({status:"repairing",updated_at:new Date().toISOString()}).eq("id",request.id);
    if(repairing.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"validation_status",{status:"repairing",head_sha:currentHead,failures:validation.required.map(check=>({name:check.name,conclusion:check.conclusion}))});
    return attemptRepair(user,{...request,status:"repairing"},currentHead,validation.required.map(check=>({name:check.name,conclusion:check.conclusion})));
  }
  if(!validation.green){
    if(request.status!=="testing"){
      await admin.from("site_edit_requests").update({status:"testing",updated_at:new Date().toISOString()}).eq("id",request.id);
    }
    return requestView(user.id,request.id);
  }

  await ensurePullRequest(request,user.id);
  if(request.risk_level==="low"){
    const ready=await admin.from("site_edit_requests").update({status:"preview_ready",updated_at:new Date().toISOString()}).eq("id",request.id);
    if(ready.error)throw new EditorError("editor_unavailable",500);
    return publishRequest(user,request.id,true);
  }

  if(request.status!=="awaiting_publish_approval"){
    const update=await admin.from("site_edit_requests").update({status:"awaiting_publish_approval",updated_at:new Date().toISOString()}).eq("id",request.id);
    if(update.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"validation_status",{status:"awaiting_publish_approval",head_sha:currentHead});
  }
  return requestView(user.id,request.id);
}

function randomToken(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

async function createPreview(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);
  if(!["preview_ready","awaiting_publish_approval"].includes(request.status)){
    throw new EditorError("bad_request",409,"preview_not_ready");
  }
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_has_no_branch");
  const currentHead=await githubBranchHead(request.branch_name);
  if(currentHead!==request.head_sha)throw new EditorError("stale_plan",409);

  const token=randomToken();
  const tokenHash=await sha256Hex(token);
  const expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  const revoked=await admin.from("site_edit_previews")
    .update({revoked_at:new Date().toISOString()})
    .eq("request_id",request.id)
    .is("revoked_at",null);
  if(revoked.error)throw new EditorError("editor_unavailable",500);
  const inserted=await admin.from("site_edit_previews").insert({
    request_id:request.id,
    token_hash:tokenHash,
    expires_at:expiresAt
  });
  if(inserted.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"preview_created",{head_sha:currentHead,expires_at:expiresAt});
  const previewUrl=`${SUPABASE_URL}/functions/v1/site-preview/${token}/index.html`;
  return {request:await requestView(user.id,request.id),preview_url:previewUrl,expires_at:expiresAt};
}

async function previewReadInternal(req:Request,b:Record<string,unknown>){
  const supplied=req.headers.get("x-site-editor-internal-secret")||"";
  if(!SITE_EDITOR_INTERNAL_SECRET||supplied!==SITE_EDITOR_INTERNAL_SECRET){
    throw new EditorError("auth_required",401);
  }
  const requestId=text(b.request_id,80);
  const path=text(b.path,800)||"index.html";
  if(!requestId)throw new EditorError("bad_request",400);
  assertSafePath(path);
  if(path==="sw.js")throw new EditorError("bad_request",404,"preview_service_worker_blocked");

  const q=await admin.from("site_edit_requests")
    .select("id,branch_name,head_sha,status")
    .eq("id",requestId)
    .maybeSingle();
  if(q.error)throw new EditorError("editor_unavailable",500);
  if(!q.data||!["preview_ready","awaiting_publish_approval"].includes(q.data.status)){
    throw new EditorError("bad_request",404,"preview_not_available");
  }
  if(!q.data.branch_name||!q.data.head_sha)throw new EditorError("bad_request",404,"preview_not_available");
  const currentHead=await githubBranchHead(q.data.branch_name);
  if(currentHead!==q.data.head_sha)throw new EditorError("stale_plan",409);
  const file=await githubReadFileBase64(path,q.data.branch_name);
  return {path:file.path,head_sha:currentHead,content_base64:file.contentBase64};
}

async function listRequests(userId:string){
  const requests=await admin.from("site_edit_requests")
    .select("*")
    .eq("user_id",userId)
    .order("updated_at",{ascending:false})
    .limit(50);
  if(requests.error)throw new EditorError("editor_unavailable",500);
  const rows=requests.data||[];
  if(!rows.length)return [];
  const ids=rows.map((row:any)=>row.id);
  const operations=await admin.from("site_edit_operations")
    .select("*")
    .in("request_id",ids)
    .order("sequence",{ascending:true});
  if(operations.error)throw new EditorError("editor_unavailable",500);
  const grouped=new Map<string,any[]>();
  for(const op of operations.data||[]){
    if(!grouped.has(op.request_id))grouped.set(op.request_id,[]);
    grouped.get(op.request_id)!.push(op);
  }
  return rows.map((request:any)=>({
    ...request,
    operations:grouped.get(request.id)||[],
    requires_preview:request.risk_level!=="low"
  }));
}

function sameSnapshot(a:any,b:any){
  if(!a&&!b)return true;
  if(!a||!b)return false;
  return a.content===b.content;
}

async function createCompensatingMigrationRollback(user:{id:string},original:any,originalOperations:any[],currentMain:string){
  const migrationOps=originalOperations.filter((op:any)=>String(op.path||"").startsWith("supabase/migrations/"));
  if(!migrationOps.length)throw new EditorError("bad_request",409,"rollback_has_no_migrations");

  const tree=await githubTree(currentMain);
  const recentMigrationPaths=tree
    .filter((item:any)=>item.type==="blob"&&String(item.path||"").startsWith("supabase/migrations/")&&String(item.path).endsWith(".sql"))
    .map((item:any)=>String(item.path))
    .sort()
    .slice(-12);

  const contextFiles:Record<string,{sha:string;content:string}>={};
  for(const path of [...new Set([...migrationOps.map((op:any)=>String(op.path)),...recentMigrationPaths])]){
    const current=await githubReadFileMaybe(path,currentMain);
    if(current)contextFiles[path]={sha:current.sha,content:current.content};
  }

  const stamp=new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14);
  const targetPath=`supabase/migrations/${stamp}_compensating_${safeSlug(original.summary||"rollback")}.sql`;
  if(tree.some((item:any)=>item.type==="blob"&&item.path===targetPath))throw new EditorError("stale_plan",409);

  const originalMigrationText=migrationOps.map((op:any)=>{
    const file=contextFiles[String(op.path)];
    return `Migration: ${op.path}\n${file?.content||JSON.stringify(op.payload||{})}`;
  }).join("\n\n");

  const prompt=`Create a compensating migration for a previously deployed database change.
This is a database rollback, but it MUST NOT reverse SQL automatically or remove schema objects destructively.
Produce exactly one create_file operation at this exact path:
${targetPath}

The SQL must be additive/backward-compatible and safe under the repository migration policy. If true reversal would require DROP, TRUNCATE, destructive ALTER, automatic data deletion, or another unsafe operation, create a forward-compatible compensating change instead and document the limitation in SQL comments.

Original deployed request:
${original.summary||original.id}

Original migration context:
${originalMigrationText.slice(0,120000)}

Recent migration files are supplied as repository context. Do not modify existing migration files.`;

  const modelPlan=await callPlanner(prompt,{area:original.area||"global",rollback_kind:"compensating"},contextFiles);
  const operations=Array.isArray(modelPlan.operations)?modelPlan.operations:[];
  if(
    operations.length!==1||
    operations[0]?.operation_type!=="create_file"||
    String(operations[0]?.path)!==targetPath||
    typeof operations[0]?.payload?.content!=="string"||
    !operations[0].payload.content.trim()
  ){
    throw new EditorError("unsafe_plan",409,"compensating_migration_required");
  }

  const validated=validateEditPlan(
    {summary:modelPlan.summary||`Compensating migration: ${original.summary||original.id}`,risk_level:"high",operations},
    new Map(Object.entries(contextFiles))
  );
  if(validated.risk_level!=="high")throw new EditorError("unsafe_plan",409,"migration_requires_high_risk");

  const created=await admin.from("site_edit_requests").insert({
    user_id:user.id,
    thread_id:original.thread_id||null,
    prompt:`Create compensating migration for deployed request ${original.id}: ${original.prompt}`,
    area:original.area||"global",
    page_context:original.page_context||{},
    selected_element:null,
    summary:modelPlan.summary||`Compensating migration: ${original.summary||original.id}`,
    risk_level:"high",
    status:"awaiting_plan_approval",
    base_sha:currentMain,
    undo_of_request_id:original.id,
    deploy_status:"not_started"
  }).select("*").single();
  if(created.error)throw new EditorError("editor_unavailable",500);

  const op=validated.operations[0];
  const inserted=await admin.from("site_edit_operations").insert({
    request_id:created.data.id,
    sequence:0,
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:null,
    payload:op.payload||{},
    diff_summary:op.diff_summary||"Add a compensating migration for the deployed database change.",
    status:"pending"
  });
  if(inserted.error)throw new EditorError("editor_unavailable",500);

  await insertEvent(created.data.id,user.id,"compensating_migration_proposed",{
    undo_of_request_id:original.id,
    base_sha:currentMain,
    target_path:targetPath
  });
  return requestView(user.id,created.data.id);
}

async function createRollbackRequest(user:{id:string},requestId:string){
  const original=await ownedRequest(user.id,requestId);
  if(original.status!=="deployed"||!original.merge_commit_sha||!original.base_sha){
    throw new EditorError("bad_request",409,"rollback_requires_deployed_request");
  }

  const existing=await admin.from("site_edit_requests")
    .select("id,status")
    .eq("user_id",user.id)
    .eq("undo_of_request_id",original.id)
    .not("status","in","(cancelled,rolled_back)")
    .order("created_at",{ascending:false})
    .limit(1)
    .maybeSingle();
  if(existing.error)throw new EditorError("editor_unavailable",500);
  if(existing.data)return requestView(user.id,existing.data.id);

  const currentMain=await githubBranchHead("main");
  const originalOperations=await requestOperations(original.id);
  if(originalOperations.some((op:any)=>String(op.path||"").startsWith("supabase/migrations/"))){
    return createCompensatingMigrationRollback(user,original,originalOperations,currentMain);
  }
  const changedPaths=new Set(await githubCommitChangedPaths(original.merge_commit_sha));
  const operationPaths=[...new Set(originalOperations.map((op:any)=>String(op.path)).filter(Boolean))];
  const paths=operationPaths.filter(path=>changedPaths.size===0||changedPaths.has(path));
  if(!paths.length)throw new EditorError("bad_request",409,"rollback_has_no_paths");

  const snapshots:any[]=[];
  const currentFiles:Record<string,{sha:string;content:string}>={};
  for(const path of paths){
    const [before,published,current]=await Promise.all([
      githubReadFileMaybe(path,original.base_sha),
      githubReadFileMaybe(path,original.merge_commit_sha),
      githubReadFileMaybe(path,currentMain)
    ]);
    if(current)currentFiles[path]={sha:current.sha,content:current.content};
    snapshots.push({
      path,
      before:before?{sha:before.sha,content:before.content}:null,
      published:published?{sha:published.sha,content:published.content}:null,
      current:current?{sha:current.sha,content:current.content}:null
    });
  }

  const unchanged=snapshots.every(snapshot=>sameSnapshot(snapshot.current,snapshot.published));
  let plan:any;
  if(unchanged){
    const operations:any[]=[];
    for(const snapshot of snapshots){
      if(snapshot.current&&snapshot.before){
        operations.push({
          operation_type:"replace_file",
          path:snapshot.path,
          expected_sha:snapshot.current.sha,
          payload:{new_content:snapshot.before.content},
          diff_summary:"Restore the file content from before the original request."
        });
      }else if(snapshot.current&&!snapshot.before){
        operations.push({
          operation_type:"delete_file",
          path:snapshot.path,
          expected_sha:snapshot.current.sha,
          payload:{},
          diff_summary:"Remove the file created by the original request."
        });
      }else if(!snapshot.current&&snapshot.before){
        operations.push({
          operation_type:"create_file",
          path:snapshot.path,
          expected_sha:null,
          payload:{content:snapshot.before.content},
          diff_summary:"Restore the file deleted by the original request."
        });
      }
    }
    if(!operations.length)throw new EditorError("bad_request",409,"rollback_already_effective");
    plan={summary:`Rollback: ${original.summary||original.id}`,risk_level:original.risk_level,operations};
  }else{
    const modelPlan=await callRollbackPlanner(original,snapshots,currentFiles);
    const allowed=new Set(paths);
    if((modelPlan.operations||[]).some((op:any)=>!allowed.has(String(op.path)))){
      throw new EditorError("unsafe_plan",409,"rollback_broadened_paths");
    }
    plan=modelPlan;
  }

  const validated=validateEditPlan(plan,new Map(Object.entries(currentFiles)));
  const created=await admin.from("site_edit_requests").insert({
    user_id:user.id,
    thread_id:original.thread_id||null,
    prompt:`Rollback deployed request ${original.id}: ${original.prompt}`,
    area:original.area||"global",
    page_context:original.page_context||{},
    selected_element:null,
    summary:plan.summary||`Rollback: ${original.summary}`,
    risk_level:validated.risk_level,
    status:"awaiting_plan_approval",
    base_sha:currentMain,
    undo_of_request_id:original.id,
    deploy_status:"not_started"
  }).select("*").single();
  if(created.error)throw new EditorError("editor_unavailable",500);

  const rows=validated.operations.map((op:any,index:number)=>({
    request_id:created.data.id,
    sequence:index,
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:op.expected_sha||null,
    payload:op.payload||{},
    diff_summary:op.diff_summary||"",
    status:"pending"
  }));
  const inserted=await admin.from("site_edit_operations").insert(rows);
  if(inserted.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(created.data.id,user.id,"rollback_proposed",{undo_of_request_id:original.id,base_sha:currentMain,source_merge_sha:original.merge_commit_sha});
  return requestView(user.id,created.data.id);
}

async function requestRevision(user:{id:string},requestId:string,instructions:string){
  const request=await ownedRequest(user.id,requestId);
  if(!["awaiting_plan_approval","needs_replan","preview_ready","awaiting_publish_approval"].includes(request.status)){
    throw new EditorError("bad_request",409,"request_not_revisable");
  }
  const note=text(instructions,8000);
  if(!note)throw new EditorError("bad_request",400);
  const currentMain=await githubBranchHead("main");
  const pageContext=asObject(request.page_context);
  const selectedElement=asObject(request.selected_element);
  const combinedPrompt=`${request.prompt}\n\nRevision requested:\n${note}`;
  const files=await collectRelevantFiles(combinedPrompt,pageContext,currentMain);
  if(!Object.keys(files).length)throw new EditorError("bad_request",400,"no_relevant_files");
  const modelPlan=await callPlanner(combinedPrompt,{...pageContext,selected_element:selectedElement},files);
  const validated=validateEditPlan(modelPlan,new Map(Object.entries(files)));

  const cleared=await admin.from("site_edit_operations").delete().eq("request_id",request.id);
  if(cleared.error)throw new EditorError("editor_unavailable",500);
  const opRows=validated.operations.map((op:any,index:number)=>({
    request_id:request.id,
    sequence:index,
    operation_type:op.operation_type,
    path:op.path,
    expected_sha:op.expected_sha||null,
    payload:op.payload||{},
    diff_summary:op.diff_summary||"",
    status:"pending"
  }));
  const saved=await admin.from("site_edit_operations").insert(opRows);
  if(saved.error)throw new EditorError("editor_unavailable",500);

  await admin.from("site_edit_previews").update({revoked_at:new Date().toISOString()}).eq("request_id",request.id).is("revoked_at",null);
  const updated=await admin.from("site_edit_requests").update({
    prompt:combinedPrompt,
    summary:modelPlan.summary||request.summary,
    risk_level:validated.risk_level,
    status:"awaiting_plan_approval",
    base_sha:currentMain,
    branch_name:null,
    head_sha:null,
    updated_at:new Date().toISOString()
  }).eq("id",request.id).eq("user_id",user.id);
  if(updated.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"revision_requested",{instructions:note.slice(0,1200),base_sha:currentMain});
  return requestView(user.id,request.id);
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="POST")return out(req,{code:"bad_request",error:"Method not allowed"},405);
  try{
    let b:Record<string,unknown>;
    try{b=await req.json()}catch{throw new EditorError("bad_request",400)}
    const action=String(b.action||"");

    if(action==='preview_read'){
      return out(req,{ok:true,...await previewReadInternal(req,b)});
    }

    const user=await requireOwner(req);

    if(action==='propose')return out(req,{ok:true,request:await propose(user,b)});
    if(action==='list_requests'){
      return out(req,{ok:true,requests:await listRequests(user.id)});
    }
    if(action==='get'||action==='get_request'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await requestView(user.id,id)});
    }
    if(action==='approve_plan'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await approvePlan(user,id)});
    }
    if(action==='refresh_status'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await refreshStatus(user,id)});
    }
    if(action==='create_preview'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,...await createPreview(user,id)});
    }
    if(action==='approve_publish'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await approvePublish(user,id)});
    }
    if(action==='publish'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await publishRequest(user,id,false)});
    }
    if(action==='request_revision'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await requestRevision(user,id,text(b.instructions,8000))});
    }
    if(action==='create_rollback'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await createRollbackRequest(user,id)});
    }
    if(action==='cancel'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      const request=await ownedRequest(user.id,id);
      if(["merging","deploying","deployed","rolled_back"].includes(request.status))throw new EditorError("bad_request",409);
      const q=await admin.from("site_edit_requests").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id).select("*").single();
      if(q.error)throw new EditorError("editor_unavailable",500);
      await admin.from("site_edit_previews").update({revoked_at:new Date().toISOString()}).eq("request_id",id).is("revoked_at",null);
      await insertEvent(id,user.id,"cancelled",{});
      return out(req,{ok:true,request:q.data});
    }
    throw new EditorError("bad_request",400);
  }catch(error){
    console.error("site-editor error",error instanceof EditorError?{code:error.code,status:error.status}:{kind:"unexpected"});
    const safe=safeEditorError(error);
    return out(req,safe.body,safe.status);
  }
});
