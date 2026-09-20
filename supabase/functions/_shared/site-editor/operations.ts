import { EditorError } from "./errors.ts";
import type { EditOperation } from "./policy.ts";

export type RepoFile={sha:string;content:string};
export type FileWrite={path:string;content:string|null};

function countOccurrences(haystack:string,needle:string){
  if(!needle)return 0;
  let count=0,index=0;
  while(true){
    const found=haystack.indexOf(needle,index);
    if(found<0)return count;
    count++;
    index=found+needle.length;
  }
}

function payloadString(payload:Record<string,unknown>|undefined,key:string){
  const value=payload?.[key];
  return typeof value==="string"?value:"";
}

export function applyOperations(
  filesByPath:Map<string,RepoFile>,
  operations:EditOperation[],
  requestId?:string
):Map<string,string|null>{
  const writes=new Map<string,string|null>();

  for(const op of operations){
    const existing=filesByPath.get(op.path);

    if(op.operation_type==="create_file"){
      if(existing||writes.has(op.path))throw new EditorError("unsafe_plan",400,"create_file_exists");
      const content=payloadString(op.payload,"content");
      writes.set(op.path,content);
      filesByPath.set(op.path,{sha:"__created__",content});
      continue;
    }

    if(op.operation_type==="publish_asset"){
      const prefix=requestId?`assets/uploads/${requestId}/`:"assets/uploads/";
      if(!op.path.startsWith(prefix))throw new EditorError("unsafe_plan",400,"blocked_path");
      if(existing||writes.has(op.path))throw new EditorError("unsafe_plan",400,"asset_exists");
      const content=payloadString(op.payload,"content");
      if(!content)throw new EditorError("unsafe_plan",400,"asset_content_missing");
      writes.set(op.path,content);
      filesByPath.set(op.path,{sha:"__created__",content});
      continue;
    }

    if(!existing)throw new EditorError("stale_plan",409);
    if(!op.expected_sha||existing.sha!==op.expected_sha)throw new EditorError("stale_plan",409);

    if(op.operation_type==="delete_file"){
      writes.set(op.path,null);
      filesByPath.delete(op.path);
      continue;
    }

    if(op.operation_type==="replace_file"){
      const content=payloadString(op.payload,"new_content");
      writes.set(op.path,content);
      filesByPath.set(op.path,{sha:existing.sha,content});
      continue;
    }

    if(op.operation_type==="replace_text"){
      const oldText=payloadString(op.payload,"old_text");
      const newText=payloadString(op.payload,"new_text");
      const expectedRaw=op.payload?.expected_occurrences;
      const expectedOccurrences=typeof expectedRaw==="number"?expectedRaw:Number(expectedRaw);
      if(!oldText||!Number.isInteger(expectedOccurrences)||expectedOccurrences<1){
        throw new EditorError("unsafe_plan",400,"invalid_replace_text");
      }
      const actual=countOccurrences(existing.content,oldText);
      if(actual!==expectedOccurrences)throw new EditorError("stale_plan",409);
      const content=existing.content.split(oldText).join(newText);
      writes.set(op.path,content);
      filesByPath.set(op.path,{sha:existing.sha,content});
      continue;
    }

    throw new EditorError("unsafe_plan",400,"unknown_operation");
  }
  return writes;
}

export function writesToArray(writes:Map<string,string|null>):FileWrite[]{
  return [...writes.entries()].map(([path,content])=>({path,content}));
}
