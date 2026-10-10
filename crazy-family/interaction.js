function pointOf(player){ return player?.position || player || {x:0,y:0,z:0}; }

export function resolveInteraction({player,interactables=[],maxDistance=1}){
  const p=pointOf(player);
  const candidates=[];
  for(const item of interactables){
    if(!item?.enabled) continue;
    const dx=(Number(item.x)||0)-p.x;
    const dz=(Number(item.z)||0)-p.z;
    const distance=Math.hypot(dx,dz);
    const allowed=Math.min(maxDistance,Number(item.radius)||maxDistance);
    if(distance>allowed) continue;
    candidates.push({id:item.id,action:item.action,label:item.label,distance,priority:Number(item.priority)||0,source:item});
  }
  candidates.sort((a,b)=>b.priority-a.priority || a.distance-b.distance || String(a.id).localeCompare(String(b.id)));
  return candidates[0] || null;
}

export function executeInteraction(candidate,context={}){
  if(!candidate) return {ok:false,reason:'no-candidate'};
  const {id,action}=candidate;
  if(action==='take'){
    const collected=context.legacyAdapter?.collectItem?.(id);
    if(!collected) return {ok:false,reason:'collect-rejected',id,action};
    context.world?.setInteractableEnabled?.(id,false);
    context.scene?.setObjectVisible?.(id,false);
    context.onAction?.(action,id,candidate);
    return {ok:true,id,action};
  }
  if(['climb','push','open','talk'].includes(action)){
    context.onAction?.(action,id,candidate);
    return {ok:true,id,action};
  }
  return {ok:false,reason:'unsupported-action',id,action};
}
