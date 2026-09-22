import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwner, serviceClient } from "../_shared/site-editor/auth.ts";
import { EditorError, safeEditorError } from "../_shared/site-editor/errors.ts";
import {
  githubActionsRunsForHeadSha,
  githubBranchHead,
  githubChecksForRef,
  githubCommitFiles,
  githubCreateEditBranch,
  githubMergeBranchIntoMain,
  githubReadFile,
  githubTree
} from "../_shared/site-editor/github.ts";
import { applyOperations, writesToArray } from "../_shared/site-editor/operations.ts";
import { assertSafePath, validateEditPlan } from "../_shared/site-editor/policy.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SUPABASE_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")||"";
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const SITE_EDITOR_MODEL_STRONG=Deno.env.get("SITE_EDITOR_MODEL_STRONG")||"";
const SITE_EDITOR_MODEL_FAST=Deno.env.get("SITE_EDITOR_MODEL_FAST")||"";
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
function tokenBase64Url(bytes:Uint8Array){
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function tokenHash(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
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
  const branchName=`site-edit/${request.id.slice(0,8)}/${safeSlug(request.summary||request.prompt)}`;
  const approval=await admin.from("site_edit_approvals").insert({
    request_id:request.id,user_id:user.id,stage:"plan",decision:"approved",approved_head_sha:currentMain
  });
  if(approval.error)throw new EditorError("editor_unavailable",500);
  await admin.from("site_edit_requests").update({status:"applying",base_sha:currentMain,branch_name:branchName,updated_at:new Date().toISOString()}).eq("id",request.id);
  try{
    await githubCreateEditBranch(branchName,currentMain);
    const commit=await githubCommitFiles(branchName,currentMain,`site-edit: ${request.summary||"approved change"} [req ${request.id.slice(0,8)}]`,writesToArray(writes));
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

const PASSING_CHECK_CONCLUSIONS=new Set(["success","neutral","skipped"]);
const FAILING_CHECK_CONCLUSIONS=new Set(["failure","cancelled","timed_out","action_required","startup_failure"]);

async function approvePublish(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);
  if(!["preview_ready","awaiting_publish_approval"].includes(request.status)){
    throw new EditorError("bad_request",409,"request_not_publishable");
  }
  if(!request.branch_name||!request.head_sha||!request.base_sha){
    throw new EditorError("bad_request",409,"request_not_publishable");
  }

  const branchHead=await githubBranchHead(request.branch_name);
  const mainHead=await githubBranchHead("main");
  if(branchHead!==request.head_sha||mainHead!==request.base_sha){
    await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id).eq("user_id",user.id);
    await insertEvent(request.id,user.id,"publish_stale",{expected_head_sha:request.head_sha,current_head_sha:branchHead,expected_main_sha:request.base_sha,current_main_sha:mainHead});
    throw new EditorError("stale_plan",409);
  }

  const checks=await githubChecksForRef(request.head_sha);
  const pending=checks.length===0||checks.some(check=>check.status!=="completed");
  const failed=checks.some(check=>check.status==="completed"&&check.conclusion&&FAILING_CHECK_CONCLUSIONS.has(check.conclusion));
  const allPassed=checks.length>0&&!pending&&!failed&&checks.every(check=>!check.conclusion||PASSING_CHECK_CONCLUSIONS.has(check.conclusion));
  if(!allPassed)throw new EditorError("bad_request",409,"validation_not_ready");

  const approval=await admin.from("site_edit_approvals").insert({
    request_id:request.id,
    user_id:user.id,
    stage:"publish",
    decision:"approved",
    approved_head_sha:request.head_sha
  });
  if(approval.error)throw new EditorError("editor_unavailable",500);

  const merging=await admin.from("site_edit_requests").update({
    status:"merging",
    deploy_status:"not_started",
    updated_at:new Date().toISOString()
  }).eq("id",request.id).eq("user_id",user.id);
  if(merging.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"publish_approved",{head_sha:request.head_sha,base_sha:request.base_sha});

  try{
    const merged=await githubMergeBranchIntoMain(request.branch_name,request.head_sha,request.base_sha);
    const updated=await admin.from("site_edit_requests").update({
      status:"deploying",
      merge_commit_sha:merged.sha,
      deploy_status:"pending",
      updated_at:new Date().toISOString()
    }).eq("id",request.id).eq("user_id",user.id);
    if(updated.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,"merged",{head_sha:request.head_sha,merge_commit_sha:merged.sha});
    return requestView(user.id,request.id);
  }catch(error){
    const stale=error instanceof EditorError&&error.code==="stale_plan";
    await admin.from("site_edit_requests").update({
      status:stale?"needs_replan":"failed",
      deploy_status:stale?"not_started":"failed",
      updated_at:new Date().toISOString()
    }).eq("id",request.id).eq("user_id",user.id);
    if(stale)await insertEvent(request.id,user.id,"publish_stale",{head_sha:request.head_sha,base_sha:request.base_sha});
    throw error;
  }
}

async function refreshStatus(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);

  if(request.status==="deploying"){
    if(!request.merge_commit_sha)throw new EditorError("bad_request",409,"deployment_missing_merge_sha");
    const runs=await githubActionsRunsForHeadSha(request.merge_commit_sha);
    const pagesRun=runs.find(run=>run.name==="pages build and deployment"||run.path.includes("pages-build-deployment"));

    const cleared=await admin.from("site_edit_runs").delete().eq("request_id",request.id).eq("kind","deployment");
    if(cleared.error)throw new EditorError("editor_unavailable",500);

    if(pagesRun){
      const saved=await admin.from("site_edit_runs").insert({
        request_id:request.id,
        kind:"deployment",
        provider_run_id:pagesRun.id,
        status:pagesRun.status,
        url:pagesRun.url,
        details:{name:pagesRun.name,path:pagesRun.path,conclusion:pagesRun.conclusion,head_sha:request.merge_commit_sha},
        started_at:pagesRun.created_at||new Date().toISOString(),
        finished_at:pagesRun.status==="completed"?(pagesRun.updated_at||new Date().toISOString()):null
      });
      if(saved.error)throw new EditorError("editor_unavailable",500);

      if(pagesRun.status==="completed"&&pagesRun.conclusion==="success"){
        const now=new Date().toISOString();
        const updated=await admin.from("site_edit_requests").update({
          status:"deployed",
          deploy_status:"success",
          published_at:now,
          updated_at:now
        }).eq("id",request.id).eq("user_id",user.id);
        if(updated.error)throw new EditorError("editor_unavailable",500);
        await insertEvent(request.id,user.id,"deployed",{merge_commit_sha:request.merge_commit_sha,run_id:pagesRun.id});
      }else if(pagesRun.status==="completed"&&pagesRun.conclusion&&FAILING_CHECK_CONCLUSIONS.has(pagesRun.conclusion)){
        const updated=await admin.from("site_edit_requests").update({
          status:"failed",
          deploy_status:"failed",
          updated_at:new Date().toISOString()
        }).eq("id",request.id).eq("user_id",user.id);
        if(updated.error)throw new EditorError("editor_unavailable",500);
        await insertEvent(request.id,user.id,"deployment_failed",{merge_commit_sha:request.merge_commit_sha,run_id:pagesRun.id,conclusion:pagesRun.conclusion});
      }else{
        await admin.from("site_edit_requests").update({
          deploy_status:pagesRun.status,
          updated_at:new Date().toISOString()
        }).eq("id",request.id).eq("user_id",user.id);
      }
    }

    return requestView(user.id,request.id);
  }

  if(!["testing","repairing"].includes(request.status))return requestView(user.id,request.id);
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_not_testable");

  const currentHead=await githubBranchHead(request.branch_name);
  if(currentHead!==request.head_sha){
    await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id).eq("user_id",user.id);
    await insertEvent(request.id,user.id,"validation_stale",{expected_head_sha:request.head_sha,current_head_sha:currentHead});
    throw new EditorError("stale_plan",409);
  }

  const checks=await githubChecksForRef(currentHead);
  const cleared=await admin.from("site_edit_runs").delete().eq("request_id",request.id).eq("kind","validation");
  if(cleared.error)throw new EditorError("editor_unavailable",500);

  if(checks.length){
    const rows=checks.map(check=>({
      request_id:request.id,
      kind:"validation",
      provider_run_id:check.id,
      status:check.status,
      url:check.url,
      details:{name:check.name,conclusion:check.conclusion,head_sha:currentHead},
      started_at:check.started_at||new Date().toISOString(),
      finished_at:check.completed_at||null
    }));
    const saved=await admin.from("site_edit_runs").insert(rows);
    if(saved.error)throw new EditorError("editor_unavailable",500);
  }

  const failed=checks.some(check=>check.status==="completed"&&check.conclusion&&FAILING_CHECK_CONCLUSIONS.has(check.conclusion));
  const pending=checks.length===0||checks.some(check=>check.status!=="completed");
  const allPassed=checks.length>0&&!pending&&checks.every(check=>!check.conclusion||PASSING_CHECK_CONCLUSIONS.has(check.conclusion));
  let nextStatus=request.status;
  if(failed)nextStatus="failed";
  else if(allPassed)nextStatus="preview_ready";

  if(nextStatus!==request.status){
    const updated=await admin.from("site_edit_requests").update({status:nextStatus,updated_at:new Date().toISOString()}).eq("id",request.id).eq("user_id",user.id);
    if(updated.error)throw new EditorError("editor_unavailable",500);
    await insertEvent(request.id,user.id,nextStatus==="preview_ready"?"validation_passed":"validation_failed",{head_sha:currentHead,checks:checks.map(x=>({name:x.name,status:x.status,conclusion:x.conclusion}))});
  }

  return requestView(user.id,request.id);
}

async function createPreview(user:{id:string},requestId:string){
  const request=await ownedRequest(user.id,requestId);
  if(!["preview_ready","awaiting_publish_approval"].includes(request.status))throw new EditorError("bad_request",409,"request_not_previewable");
  if(!request.branch_name||!request.head_sha)throw new EditorError("bad_request",409,"request_not_previewable");
  const currentHead=await githubBranchHead(request.branch_name);
  if(currentHead!==request.head_sha){
    await admin.from("site_edit_requests").update({status:"needs_replan",updated_at:new Date().toISOString()}).eq("id",request.id).eq("user_id",user.id);
    await insertEvent(request.id,user.id,"preview_stale",{expected_head_sha:request.head_sha,current_head_sha:currentHead});
    throw new EditorError("stale_plan",409);
  }

  const tokenBytes=crypto.getRandomValues(new Uint8Array(32));
  const token=tokenBase64Url(tokenBytes);
  const hash=await tokenHash(token);
  const now=new Date();
  const expiresAt=new Date(now.getTime()+60*60*1000).toISOString();
  const revoked=await admin.from("site_edit_previews").update({revoked_at:now.toISOString()}).eq("request_id",request.id).is("revoked_at",null);
  if(revoked.error)throw new EditorError("editor_unavailable",500);
  const saved=await admin.from("site_edit_previews").insert({request_id:request.id,token_hash:hash,head_sha:currentHead,expires_at:expiresAt});
  if(saved.error)throw new EditorError("editor_unavailable",500);
  await insertEvent(request.id,user.id,"preview_created",{head_sha:currentHead,expires_at:expiresAt});
  return {
    request:await requestView(user.id,request.id),
    preview_url:`${SUPABASE_URL}/functions/v1/site-preview/${encodeURIComponent(token)}/index.html`,
    expires_at:expiresAt
  };
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

async function requestRevision(user:{id:string},requestId:string,instructions:string){
  const request=await ownedRequest(user.id,requestId);
  if(!["awaiting_plan_approval","needs_replan"].includes(request.status)){
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
    const user=await requireOwner(req);
    let b:Record<string,unknown>;
    try{b=await req.json()}catch{throw new EditorError("bad_request",400)}
    const action=String(b.action||"");

    if(action==='propose')return out(req,{ok:true,request:await propose(user,b)});
    if(action==='list_requests'){
      return out(req,{ok:true,requests:await listRequests(user.id)});
    }
    if(action==='get'||action==='get_request'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await requestView(user.id,id)});
    }
    if(action==='refresh_status'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await refreshStatus(user,id)});
    }
    if(action==='create_preview'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      const preview=await createPreview(user,id);
      return out(req,{ok:true,...preview});
    }
    if(action==='approve_plan'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await approvePlan(user,id)});
    }
    if(action==='approve_publish'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await approvePublish(user,id)});
    }
    if(action==='request_revision'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      return out(req,{ok:true,request:await requestRevision(user,id,text(b.instructions,8000))});
    }
    if(action==='cancel'){
      const id=text(b.request_id,80);if(!id)throw new EditorError("bad_request",400);
      const request=await ownedRequest(user.id,id);
      if(["merging","deploying","deployed","rolled_back"].includes(request.status))throw new EditorError("bad_request",409);
      const q=await admin.from("site_edit_requests").update({status:"cancelled",updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id).select("*").single();
      if(q.error)throw new EditorError("editor_unavailable",500);
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
