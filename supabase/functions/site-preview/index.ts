import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SUPABASE_SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const GITHUB_REPO_OWNER=Deno.env.get("GITHUB_REPO_OWNER")||"";
const GITHUB_REPO_NAME=Deno.env.get("GITHUB_REPO_NAME")||"";
const admin=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store",
      "X-Robots-Tag":"noindex, nofollow"
    }
  });
}

function base64Url(bytes:Uint8Array){
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function sha256(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

function safePath(value:string){
  const path=value.replace(/^\/+/, "");
  if(!path||path.includes("\0")||path.split("/").some(part=>part===".."||part==="."))return null;
  const lower=path.toLowerCase();
  if(
    lower.startsWith(".git/")||
    lower.startsWith(".github/")||
    lower.startsWith("supabase/")||
    lower.startsWith("scripts/")||
    lower.startsWith("tests/")||
    lower.startsWith("docs/")||
    /(^|\/)\.env(?:\.|$)/.test(lower)||
    /\.(?:pem|key|p12|pfx)$/i.test(lower)
  )return null;
  return path;
}

function mime(path:string){
  const ext=path.toLowerCase().split(".").pop()||"";
  const map:Record<string,string>={
    html:"text/html; charset=utf-8",
    htm:"text/html; charset=utf-8",
    css:"text/css; charset=utf-8",
    js:"text/javascript; charset=utf-8",
    mjs:"text/javascript; charset=utf-8",
    json:"application/json; charset=utf-8",
    svg:"image/svg+xml",
    png:"image/png",
    jpg:"image/jpeg",
    jpeg:"image/jpeg",
    webp:"image/webp",
    gif:"image/gif",
    webmanifest:"application/manifest+json",
    ico:"image/x-icon",
    txt:"text/plain; charset=utf-8"
  };
  return map[ext]||"application/octet-stream";
}

function previewBase(origin:string,token:string){
  return `${origin}/functions/v1/site-preview/${encodeURIComponent(token)}/`;
}

function transformHtml(html:string,origin:string,token:string){
  const base=previewBase(origin,token);
  const safeBase=base.replace(/&/g,"&amp;").replace(/"/g,"&quot;");
  const guard=`<base href="${safeBase}"><meta name="robots" content="noindex,nofollow"><script>(function(){try{if("serviceWorker" in navigator){navigator.serviceWorker.register=function(){return Promise.reject(new Error("Service worker disabled in preview"));};}}catch(_){}})();</script>`;
  let out=html.replace(/(["'=])\/my-center\//g,(_m,prefix)=>prefix+base);
  if(/<head[^>]*>/i.test(out))out=out.replace(/<head([^>]*)>/i,`<head$1>${guard}`);
  else out=guard+out;
  return out;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return json({error:"Method not allowed"},405);
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY||!GITHUB_REPO_OWNER||!GITHUB_REPO_NAME)return json({error:"Preview unavailable"},503);

  try{
    const url=new URL(req.url);
    const marker="/functions/v1/site-preview/";
    const index=url.pathname.indexOf(marker);
    if(index<0)return json({error:"Not found"},404);
    const tail=url.pathname.slice(index+marker.length);
    const parts=tail.split("/").filter(Boolean).map(x=>decodeURIComponent(x));
    const token=parts.shift()||"";
    if(token.length<20)return json({error:"Not found"},404);
    const path=safePath(parts.join("/")||"index.html");
    if(!path)return json({error:"Not found"},404);

    const tokenHash=await sha256(token);
    const preview=await admin.from("site_edit_previews")
      .select("id,request_id,head_sha,expires_at,revoked_at")
      .eq("token_hash",tokenHash)
      .maybeSingle();
    if(preview.error||!preview.data)return json({error:"Not found"},404);
    if(preview.data.revoked_at)return json({error:"Preview revoked"},410);
    if(Date.parse(preview.data.expires_at)<=Date.now())return json({error:"Preview expired"},410);

    const request=await admin.from("site_edit_requests")
      .select("id,status,head_sha")
      .eq("id",preview.data.request_id)
      .maybeSingle();
    if(request.error||!request.data)return json({error:"Not found"},404);
    if(!["preview_ready","awaiting_publish_approval"].includes(request.data.status))return json({error:"Preview unavailable"},409);
    if(!request.data.head_sha||request.data.head_sha!==preview.data.head_sha)return json({error:"Preview stale"},409);

    const rawPath=path.split("/").map(encodeURIComponent).join("/");
    const rawUrl=`https://raw.githubusercontent.com/${encodeURIComponent(GITHUB_REPO_OWNER)}/${encodeURIComponent(GITHUB_REPO_NAME)}/${encodeURIComponent(preview.data.head_sha)}/${rawPath}`;
    const upstream=await fetch(rawUrl,{headers:{"User-Agent":"my-center-site-preview"}});
    if(!upstream.ok)return json({error:"File not found"},upstream.status===404?404:502);

    const contentType=mime(path);
    const headers={
      "Content-Type":contentType,
      "Cache-Control":"no-store, max-age=0",
      "Pragma":"no-cache",
      "X-Robots-Tag":"noindex, nofollow",
      "X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer"
    };

    if(contentType.startsWith("text/html")){
      const html=await upstream.text();
      return new Response(transformHtml(html,url.origin,token),{status:200,headers});
    }

    return new Response(await upstream.arrayBuffer(),{status:200,headers});
  }catch(error){
    console.error("site-preview error",error instanceof Error?error.message:"unknown");
    return json({error:"Preview unavailable"},500);
  }
});
