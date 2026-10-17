import test from 'node:test';
import assert from 'node:assert/strict';
import { createCameraController, stepCamera, orbitCamera } from '../../crazy-family/camera.js';

const clearWorld={cameraBlockers:[],traceCameraSegment(){return null;}};
const rel=(pose,player)=>({x:pose.position.x-player.position.x,y:pose.position.y-player.position.y,z:pose.position.z-player.position.z});
const rounded=value=>Object.fromEntries(Object.entries(value).map(([key,n])=>[key,Math.round(n*1000)/1000]));

test('stable open-world camera keeps framing across speed and gameplay modes',()=>{
  const player={position:{x:1,y:0,z:-2}},dad={position:{x:-3,y:0,z:3}};
  const make=(mode,speed)=>stepCamera(createCameraController({stableOpenWorld:true}),{player,dad,world:clearWorld,mode,speed,dt:1});
  const explore=make('explore',0),chase=make('chase',8),interaction=make('interaction',4);
  assert.deepEqual(rounded(rel(chase,player)),rounded(rel(explore,player)));
  assert.deepEqual(rounded(rel(interaction,player)),rounded(rel(explore,player)));
  assert.equal(chase.fov,explore.fov);
  assert.equal(interaction.fov,explore.fov);
  assert.equal(chase.target.x,player.position.x);
  assert.equal(chase.target.z,player.position.z);
});

test('stable open-world camera preserves manual orbit instead of auto-resetting',()=>{
  const player={position:{x:0,y:0,z:0}},controller=createCameraController({stableOpenWorld:true});
  orbitCamera(controller,{yawDelta:.7,pitchDelta:-.2});
  const before=stepCamera(controller,{player,world:clearWorld,mode:'explore',speed:0,dt:1});
  const yaw=controller.yaw,pitch=controller.pitch;
  const after=stepCamera(controller,{player,world:clearWorld,mode:'chase',speed:8,dt:1});
  assert.equal(controller.yaw,yaw);
  assert.equal(controller.pitch,pitch);
  assert.equal(after.fov,before.fov);
});
