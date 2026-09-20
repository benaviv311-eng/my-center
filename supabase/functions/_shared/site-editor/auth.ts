import { createClient } from "npm:@supabase/supabase-js@2";
import { EditorError } from "./errors.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SUPABASE_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")||"";
const SUPABASE_SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";

function bearer(req:Request){
  const header=req.headers.get("authorization")||"";
  const match=header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]||"";
}

function serviceClient(){
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY) throw new EditorError("editor_unavailable",500);
  return createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}

export async function requireOwner(req:Request):Promise<{id:string,email?:string}>{
  const token=bearer(req);
  if(!token) throw new EditorError("auth_required",401);

  if(!SUPABASE_URL||!SUPABASE_ANON_KEY) throw new EditorError("editor_unavailable",500);
  const userClient=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{
    global:{headers:{Authorization:`Bearer ${token}`}},
    auth:{persistSession:false,autoRefreshToken:false}
  });

  const {data:{user},error:userError}=await userClient.auth.getUser(token);
  if(userError||!user) throw new EditorError("auth_required",401);

  const admin=serviceClient();
  const {data:owner,error:ownerError}=await admin
    .from("app_owners")
    .select("user_id")
    .eq("user_id",user.id)
    .maybeSingle();

  if(ownerError) throw new EditorError("editor_unavailable",500);
  if(!owner) throw new EditorError("owner_required",403);

  return {id:user.id,email:user.email||undefined};
}

export { serviceClient };
