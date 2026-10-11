function pick(list,rng){
  if(!list?.length)throw new Error('scenario spawn catalog is empty');
  const value=Math.max(0,Math.min(.999999,Number(rng?.())||0));
  return list[Math.floor(value*list.length)];
}

function cloneSpawn(point){
  return {
    spawnId:point.id,
    zone:point.zone,
    surfaceId:point.surfaceId||null,
    position:{x:point.x,y:point.y,z:point.z},
    rotationY:point.rotationY||0,
  };
}

function pointInsideCollider(point,collider,padding=.08){
  return point.x>=collider.x-collider.width/2-padding&&
    point.x<=collider.x+collider.width/2+padding&&
    point.z>=collider.z-collider.depth/2-padding&&
    point.z<=collider.z+collider.depth/2+padding;
}

export function scenarioSpawnIsValid(world,spawn){
  const point=spawn?.position||spawn;
  if(!point||![point.x,point.y,point.z].every(Number.isFinite))return false;
  const bounds=world?.bounds;
  if(bounds&&(point.x<bounds.minX+.2||point.x>bounds.maxX-.2||point.z<bounds.minZ+.2||point.z>bounds.maxZ-.2))return false;
  for(const collider of world?.colliders||[]){
    if(!pointInsideCollider(point,collider))continue;
    const sitsOnOwnSurface=spawn?.surfaceId===collider.id&&point.y>=collider.height-.06;
    if(!sitsOnOwnSurface)return false;
  }
  return true;
}

function pickValid(world,list,rng){
  const start=pick(list,rng);
  const startIndex=list.indexOf(start);
  for(let offset=0;offset<list.length;offset++){
    const point=list[(startIndex+offset)%list.length];
    const candidate=cloneSpawn(point);
    if(scenarioSpawnIsValid(world,candidate))return candidate;
  }
  throw new Error('no valid scenario spawn point');
}

export function createScenario({world,rng=Math.random,itemId='headphones'}={}){
  if(!world?.scenarioSpawns)throw new Error('world has no scenario spawn catalog');
  const item=pickValid(world,world.scenarioSpawns.item,rng);
  const dad=pickValid(world,world.scenarioSpawns.dad,rng);
  item.id=itemId;
  dad.id='dad';
  return {
    id:`home-${item.spawnId}-${dad.spawnId}`,
    item,
    dad,
  };
}

export function applyScenarioToWorld(world,scenario){
  const item=world?.interactables?.find(entry=>entry.id===scenario?.item?.id);
  if(!item)throw new Error(`missing interactable for ${scenario?.item?.id||'scenario item'}`);
  const {x,y,z}=scenario.item.position;
  Object.assign(item,{x,y,z,enabled:true,spawnId:scenario.item.spawnId});
  world.activeScenario=scenario;
  return world;
}
