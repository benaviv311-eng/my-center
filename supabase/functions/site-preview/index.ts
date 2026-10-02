import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SUPABASE_SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SITE_EDITOR_INTERNAL_SECRET=Deno.env.get("SITE_EDITOR_INTERNAL_SECRET")||"";
const admin=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      "content-type":"application/json",
      "Cache-Control":"no-store",
      "X-Robots-Tag":"noindex, nofollow"
    }
  });
}

async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

function decodeBase64(value:string){
  const binary=atob(value.replace(/\s+/g,""));
  const out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
  return out;
}

function mime(path:string){
  const lower=path.toLowerCase();
  if(lower.endsWith(".html")||lower.endsWith(".htm"))return "text/html; charset=utf-8";
  if(lower.endsWith(".css"))return "text/css; charset=utf-8";
  if(lower.endsWith(".js")||lower.endsWith(".mjs"))return "text/javascript; charset=utf-8";
  if(lower.endsWith(".json"))return "application/json; charset=utf-8";
  if(lower.endsWith(".svg"))return "image/svg+xml";
  if(lower.endsWith(".png"))return "image/png";
  if(lower.endsWith(".jpg")||lower.endsWith(".jpeg"))return "image/jpeg";
  if(lower.endsWith(".webp"))return "image/webp";
  if(lower.endsWith(".gif"))return "image/gif";
  if(lower.endsWith(".webmanifest"))return "application/manifest+json";
  return "application/octet-stream";
}

function parsePreviewPath(req:Request){
  const url=new URL(req.url);
  const marker="/site-preview/";
  const at=url.pathname.indexOf(marker);
  if(at<0)return null;
  const tail=url.pathname.slice(at+marker.length);
  const parts=tail.split("/").filter(Boolean);
  if(!parts.length)return null;
  const token=decodeURIComponent(parts.shift()||"");
  const path=parts.length?parts.map(decodeURIComponent).join("/"):"index.html";
  return {token,path,url};
}

function injectPreviewHtml(html:string,basePath:string){
  const rewritten=html
    .replace(/(["'])\/my-center\//g,(match,quote)=>quote+basePath)
    .replace(/(["'])https:\/\/benaviv311-eng\.github\.io\/my-center\//g,(match,quote)=>quote+basePath);
  const guard=`<base href="${basePath}"><meta name="robots" content="noindex,nofollow"><script>(function(){try{if("serviceWorker" in navigator&&navigator.serviceWorker){navigator.serviceWorker.register=async function(){return {unregister:async function(){return true}}};}}catch(e){}})();</script>`;
  if(/<head[^>]*>/i.test(rewritten))return rewritten.replace(/<head([^>]*)>/i,`<head$1>${guard}`);
  return guard+rewritten;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="GET")return json({error:"Not found"},404);
  if(!SITE_EDITOR_INTERNAL_SECRET||!SUPABASE_SERVICE_ROLE_KEY)return json({error:"Preview unavailable"},503);

  const parsed=parsePreviewPath(req);
  if(!parsed?.token)return json({error:"Not found"},404);
  if(parsed.path==="sw.js")return json({error:"Not found"},404);

  const tokenHash=await sha256Hex(parsed.token);
  const q=await admin.from("site_edit_previews")
    .select("request_id,expires_at,revoked_at")
    .eq("token_hash",tokenHash)
    .maybeSingle();
  if(q.error)return json({error:"Preview unavailable"},503);
  if(!q.data)return json({error:"Not found"},404);
  if(q.data.revoked_at||Date.parse(q.data.expires_at)<=Date.now())return json({error:"Preview expired"},410);

  const editor=await fetch(`${SUPABASE_URL}/functions/v1/site-editor`,{
    method:"POST",
    headers:{
      Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey:SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type":"application/json",
      "x-site-editor-internal-secret":SITE_EDITOR_INTERNAL_SECRET
    },
    body:JSON.stringify({action:"preview_read",request_id:q.data.request_id,path:parsed.path})
  });
  const data=await editor.json().catch(()=>({}));
  if(!editor.ok){
    if(editor.status===404)return json({error:"Not found"},404);
    if(editor.status===409)return json({error:"Preview changed"},410);
    return json({error:"Preview unavailable"},503);
  }
  if(typeof data?.content_base64!=="string")return json({error:"Preview unavailable"},503);

  let bytes=decodeBase64(data.content_base64);
  const contentType=mime(parsed.path);
  if(contentType.startsWith("text/html")){
    const text=new TextDecoder().decode(bytes);
    const basePath=`${parsed.url.origin}/functions/v1/site-preview/${encodeURIComponent(parsed.token)}/`;
    bytes=new TextEncoder().encode(injectPreviewHtml(text,basePath));
  }

  return new Response(bytes,{
    status:200,
    headers:{
      "Content-Type":contentType,
      "Cache-Control":"no-store",
      "Pragma":"no-cache",
      "X-Robots-Tag":"noindex, nofollow",
      "Referrer-Policy":"no-referrer"
    }
  });
});
