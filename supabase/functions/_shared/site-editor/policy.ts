import { EditorError } from "./errors.ts";

export type RiskLevel="low"|"medium"|"high";
export type OperationType="replace_text"|"replace_file"|"create_file"|"delete_file"|"publish_asset";

export type EditOperation={
  operation_type:OperationType;
  path:string;
  expected_sha?:string|null;
  payload?:Record<string,unknown>;
  diff_summary?:string;
};

const SUPPORTED_OPERATIONS=new Set<OperationType>([
  "replace_text","replace_file","create_file","delete_file","publish_asset"
]);

const HIGH_RISK_PREFIXES=[
  "supabase/migrations/",
  "supabase/functions/",
  ".github/workflows/"
];

const MEDIUM_EXTENSIONS=new Set([".js",".mjs",".cjs",".ts",".tsx",".jsx"]);

function rank(risk:RiskLevel){return risk==="high"?3:risk==="medium"?2:1}
export function maxRisk(a:RiskLevel,b:RiskLevel):RiskLevel{return rank(a)>=rank(b)?a:b}

function ext(path:string){
  const i=path.lastIndexOf(".");
  return i>=0?path.slice(i).toLowerCase():"";
}

export function assertSafePath(path:string){
  if(!path||path.startsWith("/")||path.includes("\\")||path.split("/").includes("..")){
    throw new EditorError("unsafe_plan",400,"blocked_path");
  }
  const lower=path.toLowerCase();
  const base=lower.split("/").pop()||lower;
  if(
    lower.startsWith(".git/")||
    base===".env"||
    base.startsWith(".env.")||
    base.endsWith(".pem")||
    base.endsWith(".key")||
    base.startsWith("id_rsa")||
    /(^|[._-])(credentials?|secrets?)([._-]|$)/.test(base)
  ){
    throw new EditorError("unsafe_plan",400,"blocked_path");
  }
}

export function classifyRisk(operations:EditOperation[]):RiskLevel{
  if(operations.length>10)return "high";
  let risk:RiskLevel=operations.length>3?"medium":"low";
  for(const op of operations){
    if(!SUPPORTED_OPERATIONS.has(op.operation_type)){
      throw new EditorError("unsafe_plan",400,"unknown_operation");
    }
    assertSafePath(op.path);
    const path=op.path;
    const lower=path.toLowerCase();

    if(
      op.operation_type==="delete_file"||
      HIGH_RISK_PREFIXES.some(prefix=>path.startsWith(prefix))||
      path==="sw.js"||
      /(^|\/)auth[^/]*\.(js|ts|sql)$/i.test(path)||
      /(^|\/)rls[^/]*\.(js|ts|sql)$/i.test(path)
    ){
      risk="high";
      continue;
    }

    if(
      MEDIUM_EXTENSIONS.has(ext(lower))||
      /(^|\/)(nav|navigation|router|routes?)([._/-]|$)/i.test(lower)||
      op.operation_type==="replace_file"
    ){
      risk=maxRisk(risk,"medium");
    }
  }
  return risk;
}

export function validateEditPlan(
  plan:{risk_level?:RiskLevel;operations?:unknown[]},
  repoFiles:Map<string,{sha:string;content?:string}>|Record<string,{sha:string;content?:string}>
){
  if(!plan||!Array.isArray(plan.operations)||plan.operations.length<1){
    throw new EditorError("unsafe_plan",400,"invalid_plan");
  }
  const operations=plan.operations.map((raw:any,index)=>{
    const operation_type=String(raw?.operation_type||"") as OperationType;
    const path=String(raw?.path||"").trim();
    if(!SUPPORTED_OPERATIONS.has(operation_type))throw new EditorError("unsafe_plan",400,"unknown_operation");
    assertSafePath(path);
    const op:EditOperation={
      operation_type,
      path,
      expected_sha:raw?.expected_sha==null?null:String(raw.expected_sha),
      payload:raw?.payload&&typeof raw.payload==="object"?raw.payload:{},
      diff_summary:String(raw?.diff_summary||"")
    };
    if(operation_type!=="create_file"&&operation_type!=="publish_asset"&&!op.expected_sha){
      throw new EditorError("unsafe_plan",400,`missing_expected_sha_${index}`);
    }
    const existing=repoFiles instanceof Map?repoFiles.get(path):repoFiles[path];
    if(operation_type==="create_file"&&existing)throw new EditorError("unsafe_plan",400,"create_file_exists");
    if(operation_type!=="create_file"&&operation_type!=="publish_asset"&&!existing)throw new EditorError("stale_plan",409);
    return op;
  });
  const deterministic=classifyRisk(operations);
  const modelRisk=(["low","medium","high"] as RiskLevel[]).includes(plan.risk_level as RiskLevel)?plan.risk_level as RiskLevel:"low";
  return {operations,risk_level:maxRisk(modelRisk,deterministic)};
}
