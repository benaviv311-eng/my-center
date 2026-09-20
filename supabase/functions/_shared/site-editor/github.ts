import { EditorError } from "./errors.ts";

const GITHUB_APP_ID=Deno.env.get("GITHUB_APP_ID")||"";
const GITHUB_APP_INSTALLATION_ID=Deno.env.get("GITHUB_APP_INSTALLATION_ID")||"";
const GITHUB_APP_PRIVATE_KEY=(Deno.env.get("GITHUB_APP_PRIVATE_KEY")||"").replace(/\\n/g,"\n");
const GITHUB_REPO_OWNER=Deno.env.get("GITHUB_REPO_OWNER")||"";
const GITHUB_REPO_NAME=Deno.env.get("GITHUB_REPO_NAME")||"";
const GITHUB_API="https://api.github.com";
const GITHUB_API_VERSION="2022-11-28";

let cachedToken:{token:string;expiresAt:number}|null=null;

function requireConfig(){
  if(!GITHUB_APP_ID||!GITHUB_APP_INSTALLATION_ID||!GITHUB_APP_PRIVATE_KEY||!GITHUB_REPO_OWNER||!GITHUB_REPO_NAME){
    throw new EditorError("github_unavailable",503);
  }
}

function base64Url(bytes:Uint8Array){
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

function base64UrlText(value:string){
  return base64Url(new TextEncoder().encode(value));
}

function pemDer(pem:string){
  const clean=pem
    .replace(/-----BEGIN [^-]+-----/g,"")
    .replace(/-----END [^-]+-----/g,"")
    .replace(/\s+/g,"");
  if(!clean)throw new EditorError("github_unavailable",503);
  let binary="";
  try{binary=atob(clean)}catch{throw new EditorError("github_unavailable",503)}
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}

function derLength(length:number){
  if(length<0x80)return new Uint8Array([length]);
  const bytes:number[]=[];
  let value=length;
  while(value>0){bytes.unshift(value&0xff);value>>>=8}
  return new Uint8Array([0x80|bytes.length,...bytes]);
}

function concatBytes(...parts:Uint8Array[]){
  const size=parts.reduce((n,p)=>n+p.length,0);
  const out=new Uint8Array(size);
  let offset=0;
  for(const part of parts){out.set(part,offset);offset+=part.length}
  return out;
}

function derWrap(tag:number,content:Uint8Array){
  return concatBytes(new Uint8Array([tag]),derLength(content.length),content);
}

function pkcs1ToPkcs8(pkcs1:Uint8Array){
  const version=new Uint8Array([0x02,0x01,0x00]);
  const rsaAlgorithm=new Uint8Array([
    0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,
    0xf7,0x0d,0x01,0x01,0x01,0x05,0x00
  ]);
  const wrappedKey=derWrap(0x04,pkcs1);
  return derWrap(0x30,concatBytes(version,rsaAlgorithm,wrappedKey));
}

function pemPkcs8(pem:string){
  const der=pemDer(pem);
  return pem.includes("RSA PRIVATE KEY")?pkcs1ToPkcs8(der).buffer:der.buffer;
}

async function appJwt(){
  requireConfig();
  const now=Math.floor(Date.now()/1000);
  const header=base64UrlText(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=base64UrlText(JSON.stringify({iat:now-30,exp:now+540,iss:GITHUB_APP_ID}));
  const unsigned=`${header}.${payload}`;
  const key=await crypto.subtle.importKey(
    "pkcs8",
    pemPkcs8(GITHUB_APP_PRIVATE_KEY),
    {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},
    false,
    ["sign"]
  );
  const signature=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function installationToken(){
  requireConfig();
  if(cachedToken && cachedToken.expiresAt-Date.now()>60_000)return cachedToken.token;
  const jwt=await appJwt();
  const response=await fetch(
    `${GITHUB_API}/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method:"POST",
      headers:{
        Authorization:`Bearer ${jwt}`,
        Accept:"application/vnd.github+json",
        "X-GitHub-Api-Version":GITHUB_API_VERSION
      }
    }
  );
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data?.token)throw new EditorError("github_unavailable",503);
  const expiresAt=Date.parse(data.expires_at||"");
  cachedToken={token:data.token,expiresAt:Number.isFinite(expiresAt)?expiresAt:Date.now()+50*60_000};
  return cachedToken.token;
}

async function githubRequest(path:string,init:RequestInit={}){
  const token=await installationToken();
  const response=await fetch(`${GITHUB_API}${path}`,{
    ...init,
    headers:{
      Authorization:`Bearer ${token}`,
      Accept:"application/vnd.github+json",
      "X-GitHub-Api-Version":GITHUB_API_VERSION,
      ...(init.body?{"Content-Type":"application/json"}:{}),
      ...(init.headers||{})
    }
  });
  const data=response.status===204?null:await response.json().catch(()=>null);
  if(!response.ok){
    if(response.status===409||response.status===422)throw new EditorError("stale_plan",409);
    throw new EditorError("github_unavailable",503);
  }
  return data;
}

function repoPath(path:string){
  return `/repos/${encodeURIComponent(GITHUB_REPO_OWNER)}/${encodeURIComponent(GITHUB_REPO_NAME)}${path}`;
}

function refPath(branch:string){
  return branch.split("/").map(encodeURIComponent).join("/");
}

function decodeBase64Utf8(value:string){
  const binary=atob(value.replace(/\n/g,""));
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function githubReadFile(path:string,ref:string):Promise<{path:string;sha:string;content:string}>{
  const encoded=path.split("/").map(encodeURIComponent).join("/");
  const data=await githubRequest(repoPath(`/contents/${encoded}?ref=${encodeURIComponent(ref)}`));
  if(!data||Array.isArray(data)||data.type!=="file"||typeof data.content!=="string")throw new EditorError("github_unavailable",503);
  return {path:data.path,sha:data.sha,content:decodeBase64Utf8(data.content)};
}

export async function githubTree(ref:string):Promise<Array<{path:string;type:string;sha:string}>>{
  const data=await githubRequest(repoPath(`/git/trees/${encodeURIComponent(ref)}?recursive=1`));
  return (data?.tree||[]).filter((x:any)=>typeof x.path==="string"&&typeof x.sha==="string").map((x:any)=>({path:x.path,type:x.type,sha:x.sha}));
}

export async function githubBranchHead(branch:string):Promise<string>{
  const data=await githubRequest(repoPath(`/git/ref/heads/${refPath(branch)}`));
  const sha=data?.object?.sha;
  if(typeof sha!=="string")throw new EditorError("github_unavailable",503);
  return sha;
}

export type GithubCheckRun={
  id:string;
  name:string;
  status:string;
  conclusion:string|null;
  url:string|null;
  started_at:string|null;
  completed_at:string|null;
};

export async function githubChecksForRef(sha:string):Promise<GithubCheckRun[]>{
  const data=await githubRequest(repoPath(`/commits/${encodeURIComponent(sha)}/check-runs?per_page=100`));
  return (data?.check_runs||[]).map((run:any)=>({
    id:String(run?.id||""),
    name:typeof run?.name==="string"?run.name:"check",
    status:typeof run?.status==="string"?run.status:"queued",
    conclusion:typeof run?.conclusion==="string"?run.conclusion:null,
    url:typeof run?.details_url==="string"?run.details_url:null,
    started_at:typeof run?.started_at==="string"?run.started_at:null,
    completed_at:typeof run?.completed_at==="string"?run.completed_at:null
  })).filter((run:GithubCheckRun)=>Boolean(run.id));
}

export async function githubCreateEditBranch(name:string,baseSha:string):Promise<void>{
  await githubRequest(repoPath("/git/refs"),{
    method:"POST",
    body:JSON.stringify({ref:`refs/heads/${name}`,sha:baseSha})
  });
}

export type GithubFileWrite={path:string;content:string|null};

export async function githubCommitFiles(
  branch:string,
  parentSha:string,
  message:string,
  files:GithubFileWrite[]
):Promise<{commitSha:string}>{
  const current=await githubBranchHead(branch);
  if(current!==parentSha)throw new EditorError("stale_plan",409);

  const parent=await githubRequest(repoPath(`/git/commits/${encodeURIComponent(parentSha)}`));
  const baseTree=parent?.tree?.sha;
  if(typeof baseTree!=="string")throw new EditorError("github_unavailable",503);

  const entries:any[]=[];
  for(const file of files){
    if(file.content===null){
      entries.push({path:file.path,mode:"100644",type:"blob",sha:null});
      continue;
    }
    const blob=await githubRequest(repoPath("/git/blobs"),{
      method:"POST",
      body:JSON.stringify({content:file.content,encoding:"utf-8"})
    });
    entries.push({path:file.path,mode:"100644",type:"blob",sha:blob.sha});
  }

  const tree=await githubRequest(repoPath("/git/trees"),{
    method:"POST",
    body:JSON.stringify({base_tree:baseTree,tree:entries})
  });
  const commit=await githubRequest(repoPath("/git/commits"),{
    method:"POST",
    body:JSON.stringify({message,tree:tree.sha,parents:[parentSha]})
  });

  const beforeUpdate=await githubBranchHead(branch);
  if(beforeUpdate!==parentSha)throw new EditorError("stale_plan",409);

  await githubRequest(repoPath(`/git/refs/heads/${refPath(branch)}`),{
    method:"PATCH",
    body:JSON.stringify({sha:commit.sha})
  });
  return {commitSha:commit.sha};
}
