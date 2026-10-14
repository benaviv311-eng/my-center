function segmentIntersectsRect(camera,actor,proxy){
  const minX=proxy.x-proxy.width/2,maxX=proxy.x+proxy.width/2;
  const minZ=proxy.z-proxy.depth/2,maxZ=proxy.z+proxy.depth/2;
  const dx=actor.x-camera.x,dz=actor.z-camera.z;
  let t0=0,t1=1;
  for(const [p,q] of [[-dx,camera.x-minX],[dx,maxX-camera.x],[-dz,camera.z-minZ],[dz,maxZ-camera.z]]){
    if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
    const r=q/p;
    if(p<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}
  }
  return t0<=t1 && t1>0.02 && t0<0.98;
}

export function resolveCinematicOcclusion({camera,actor,actorRadius=0,occluders=[]}={}){
  const active=new Set();
  if(!camera||!actor)return active;
  const padding=Math.max(0,Number(actorRadius)||0);
  for(const proxy of occluders){
    if(!proxy||proxy.kind==='background'||proxy.kind==='light'||!Number.isFinite(proxy.width)||!Number.isFinite(proxy.depth))continue;
    const paddedProxy=padding?{...proxy,width:proxy.width+padding*2,depth:proxy.depth+padding*2}:proxy;
    if(segmentIntersectsRect(camera,actor,paddedProxy))active.add(proxy.id);
  }
  return active;
}

function setDepthMode(object,active){
  if(!object)return;
  object.userData ||= {};
  object.userData.actorOccluderActive=active;
  const base=Number(object.userData.baseRenderOrder)||0;
  object.renderOrder=active?Math.max(50,base+40):base;
  if(Number.isFinite(object.userData.inactiveZ)){
    object.position.z=active
      ? (Number.isFinite(object.userData.activeOccluderZ)?object.userData.activeOccluderZ:-2.35)
      : object.userData.inactiveZ;
  }
  object.traverse?.(node=>{
    if(!node?.material)return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    for(const material of materials){
      if(!material)continue;
      material.depthTest=true;
      material.depthWrite=false;
      material.needsUpdate=true;
    }
  });
}

export function applyCinematicOcclusion(cinematicSet,activeIds=new Set()){
  const active=activeIds instanceof Set?activeIds:new Set(activeIds||[]);
  for(const proxy of cinematicSet?.occluders||[])setDepthMode(proxy.object,active.has(proxy.id));
  cinematicSet && (cinematicSet.activeOccluderIds=new Set(active));
  return active;
}
