export function buildGrayboxDescriptors(world){
  const source=world?.renderables || [...(world?.objects||[]),...(world?.roomShell||[])];
  const seen=new Set();
  const out=[];
  for(const def of source){
    if(!def?.id||seen.has(def.id))continue;
    seen.add(def.id);
    const width=Math.max(.02,Number(def.width)||.02),height=Math.max(.02,Number(def.height)||.02),depth=Math.max(.02,Number(def.depth)||.02);
    out.push({id:def.id,kind:def.kind||'object',x:Number(def.x)||0,y:Number(def.y)||height/2,z:Number(def.z)||0,width,height,depth,color:def.color,material:def.material});
  }
  return out;
}
