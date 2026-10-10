const DEFAULTS = Object.freeze({
  exploreOffset: { x: 1.35, y: 1.45, z: 2.75 },
  chaseOffset: { x: 1.7, y: 1.72, z: 3.4 },
  interactionOffset: { x: 1.05, y: 1.3, z: 2.3 },
  cinematicOffset: { x: -1.5, y: 1.65, z: 3.05 },
  targetHeight: 0.68,
  exploreFov: 49,
  chaseFov: 53,
  interactionFov: 46,
  cinematicFov: 47,
  smoothing: 7.5,
  collisionPadding: 0.1,
});

function copy(v){ return {x:v.x,y:v.y,z:v.z}; }
function mix(a,b,t){ return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}; }

export function createCameraController(config = {}) {
  return {
    config: { ...DEFAULTS, ...config },
    position: null,
    target: null,
    fov: null,
    mode: 'explore',
  };
}

function modeSettings(config, mode){
  switch(mode){
    case 'chase': return {offset:config.chaseOffset,fov:config.chaseFov};
    case 'interaction': return {offset:config.interactionOffset,fov:config.interactionFov};
    case 'cinematic': return {offset:config.cinematicOffset,fov:config.cinematicFov};
    default: return {offset:config.exploreOffset,fov:config.exploreFov};
  }
}

function desiredTarget(player, dad, mode, height){
  const p=player?.position || player || {x:0,y:0,z:0};
  if(mode==='chase' && dad?.position){
    const d=dad.position;
    return {x:p.x+(d.x-p.x)*0.14,y:p.y+height,z:p.z+(d.z-p.z)*0.14};
  }
  return {x:p.x,y:p.y+height,z:p.z};
}

function shortenedByHit(target, desired, hit, padding){
  if(!hit || !Number.isFinite(hit.fraction)) return desired;
  const fraction=Math.max(0.12,Math.min(1,hit.fraction-padding));
  return {
    x:target.x+(desired.x-target.x)*fraction,
    y:target.y+(desired.y-target.y)*fraction,
    z:target.z+(desired.z-target.z)*fraction,
  };
}

export function stepCamera(controller,{player,dad=null,world,mode='explore',dt=0.016}){
  const config=controller.config;
  const selected=modeSettings(config,mode);
  const target=desiredTarget(player,dad,mode,config.targetHeight);
  let desired={x:target.x+selected.offset.x,y:target.y+selected.offset.y,z:target.z+selected.offset.z};
  const hit=world?.traceCameraSegment?.(target,desired,world.cameraBlockers || []);
  desired=shortenedByHit(target,desired,hit,config.collisionPadding);
  const t=controller.position ? 1-Math.exp(-config.smoothing*Math.max(0,dt)) : 1;
  controller.position=controller.position?mix(controller.position,desired,t):copy(desired);
  controller.target=controller.target?mix(controller.target,target,t):copy(target);
  controller.fov=controller.fov==null?selected.fov:controller.fov+(selected.fov-controller.fov)*t;
  controller.mode=mode;
  return {position:copy(controller.position),target:copy(controller.target),fov:controller.fov};
}

function segmentIntersectsRect2D(camera,target,o){
  const minX=o.x-o.width/2,maxX=o.x+o.width/2,minZ=o.z-o.depth/2,maxZ=o.z+o.depth/2;
  const dx=target.x-camera.x,dz=target.z-camera.z;
  let t0=0,t1=1;
  for(const [p,q] of [[-dx,camera.x-minX],[dx,maxX-camera.x],[-dz,camera.z-minZ],[dz,maxZ-camera.z]]){
    if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
    const r=q/p;
    if(p<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}
  }
  return t0<=t1 && t1>0.02 && t0<0.98;
}

export function chooseOccluders({camera,target,occluders=[]}){
  return occluders
    .filter(o=>o && o.kind!=='wall' && !String(o.id||'').includes('wall'))
    .filter(o=>Number.isFinite(o.width)&&Number.isFinite(o.depth))
    .filter(o=>segmentIntersectsRect2D(camera,target,o))
    .map(o=>o.id);
}
