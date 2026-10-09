import { buildNavigationGrid, findPath } from './navigation.js';

function approach(current,target,maxDelta){if(current<target)return Math.min(target,current+maxDelta);if(current>target)return Math.max(target,current-maxDelta);return target;}

export function createDadController({position,maxSpeed=3.15,acceleration=6.2,braking=7.8,clearance=.55,repathInterval=.45}={}){
  return {
    position:{x:position?.x??2.7,y:position?.y??0,z:position?.z??-.35},
    velocity:{x:0,y:0,z:0},
    maxSpeed,acceleration,braking,clearance,repathInterval,
    state:'idle',goal:null,path:[],pathIndex:0,nextRepathAt:0,grid:null,gridSignature:'',facing:-1,
  };
}

function gridSignature(world,clearance){
  return JSON.stringify([world.bounds,clearance,(world.navBlockers||[]).map(b=>[b.id,b.x,b.z,b.width,b.depth])]);
}

function ensureGrid(controller,world){
  const signature=gridSignature(world,controller.clearance);
  if(controller.grid&&controller.gridSignature===signature)return controller.grid;
  controller.grid=buildNavigationGrid({bounds:world.bounds,blockers:world.navBlockers||[],cellSize:.34,clearance:controller.clearance});
  controller.gridSignature=signature;
  controller.path=[];controller.pathIndex=0;controller.nextRepathAt=0;
  return controller.grid;
}

function frame(controller,cameraModeHint='explore'){
  return {position:{...controller.position},velocity:{...controller.velocity},facing:controller.facing,state:controller.state,cameraModeHint};
}

export function stepDad(controller,{player,world,retainedState={},dt=.016,now=0}){
  const retained=retainedState?.dad||{};
  const interrupt=['pant','yawn','sneeze'].includes(retained.state)?retained.state:null;
  if(interrupt){
    controller.state=interrupt;
    controller.velocity.x=approach(controller.velocity.x,0,controller.braking*dt);
    controller.velocity.z=approach(controller.velocity.z,0,controller.braking*dt);
    return frame(controller,'explore');
  }

  const target=player?.position||player||controller.position;
  controller.goal={x:target.x,z:target.z};
  controller.state='chase';
  const grid=ensureGrid(controller,world);
  const mustRepath=!controller.path.length||controller.pathIndex>=controller.path.length||now>=controller.nextRepathAt;
  if(mustRepath){
    controller.path=findPath(grid,controller.position,controller.goal);
    controller.pathIndex=controller.path.length>1?1:0;
    controller.nextRepathAt=now+controller.repathInterval*1000;
  }

  let waypoint=controller.path[controller.pathIndex]||controller.goal;
  let dx=waypoint.x-controller.position.x,dz=waypoint.z-controller.position.z,dist=Math.hypot(dx,dz);
  if(dist<.26&&controller.pathIndex<controller.path.length-1){controller.pathIndex++;waypoint=controller.path[controller.pathIndex];dx=waypoint.x-controller.position.x;dz=waypoint.z-controller.position.z;dist=Math.hypot(dx,dz);}
  const dirX=dist>1e-6?dx/dist:0,dirZ=dist>1e-6?dz/dist:0;
  const targetVX=dirX*controller.maxSpeed,targetVZ=dirZ*controller.maxSpeed;
  controller.velocity.x=approach(controller.velocity.x,targetVX,(dist>.08?controller.acceleration:controller.braking)*dt);
  controller.velocity.z=approach(controller.velocity.z,targetVZ,(dist>.08?controller.acceleration:controller.braking)*dt);
  const desired={x:controller.position.x+controller.velocity.x*dt,y:0,z:controller.position.z+controller.velocity.z*dt};
  const resolved=world.resolveCharacterMove(controller.position,desired,{radius:controller.clearance,height:1.85})||desired;
  const intended=Math.hypot(desired.x-controller.position.x,desired.z-controller.position.z);
  const actual=Math.hypot(resolved.x-controller.position.x,resolved.z-controller.position.z);
  controller.position={x:resolved.x,y:0,z:resolved.z};
  if(Math.abs(controller.velocity.x)>.05)controller.facing=controller.velocity.x<0?-1:1;
  if(intended>.015&&actual<intended*.2){controller.nextRepathAt=now;controller.path=[];controller.pathIndex=0;controller.velocity.x*=.25;controller.velocity.z*=.25;}
  return frame(controller,retained.singing?'chase':'chase');
}
