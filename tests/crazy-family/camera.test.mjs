import test from 'node:test';
import assert from 'node:assert/strict';
import { createCameraController, stepCamera, chooseOccluders, orbitCamera } from '../../crazy-family/camera.js';

const clearWorld = {
  cameraBlockers: [],
  traceCameraSegment(){ return null; },
};

function distance(a,b){ return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z); }
function finitePose(pose){return [...Object.values(pose.position),...Object.values(pose.target),pose.fov].every(Number.isFinite);}

test('explore camera stays above and behind Libi at a 3/4 angle', () => {
  const controller = createCameraController();
  const player = {position:{x:0,y:0,z:0}};
  const pose = stepCamera(controller,{player,dad:null,world:clearWorld,mode:'explore',dt:1});
  assert.ok(pose.position.y > pose.target.y);
  assert.ok(pose.position.z > pose.target.z);
  assert.ok(Math.abs(pose.position.x-pose.target.x) > 0.1);
});

test('chase mode widens framing without unbounded zoom', () => {
  const player = {position:{x:0,y:0,z:0}};
  const dad = {position:{x:2,y:0,z:-2}};
  const explore = stepCamera(createCameraController(),{player,dad,world:clearWorld,mode:'explore',dt:1});
  const chase = stepCamera(createCameraController(),{player,dad,world:clearWorld,mode:'chase',dt:1});
  assert.ok(distance(chase.position,chase.target) > distance(explore.position,explore.target));
  assert.ok(chase.fov > explore.fov);
  assert.ok(chase.fov <= 58);
});

test('camera wall hit shortens boom instead of crossing blocker', () => {
  const world = {
    cameraBlockers:[{id:'wall'}],
    traceCameraSegment(target,desired){
      return {id:'wall', point:{x:(target.x+desired.x)*.5,y:(target.y+desired.y)*.5,z:(target.z+desired.z)*.5}, fraction:.5};
    },
  };
  const controller=createCameraController();
  const player={position:{x:0,y:0,z:0}};
  const clear=stepCamera(createCameraController(),{player,world:clearWorld,mode:'explore',dt:1});
  const blocked=stepCamera(controller,{player,world,mode:'explore',dt:1});
  assert.ok(distance(blocked.position,blocked.target) < distance(clear.position,clear.target));
});

test('chooseOccluders returns only objects intersecting camera-to-target line', () => {
  const occluders=[
    {id:'sofa',x:0,z:2,width:3,depth:1,height:1.1},
    {id:'side-table',x:4,z:0,width:1,depth:1,height:.7},
  ];
  const ids=chooseOccluders({camera:{x:0,y:2,z:5},target:{x:0,y:.7,z:0},occluders});
  assert.deepEqual(ids,['sofa']);
});

test('unrelated walls are never selected for transparency', () => {
  const occluders=[
    {id:'back-wall',x:0,z:-4.6,width:12,depth:.2,height:3.7,kind:'wall'},
    {id:'sofa',x:0,z:2,width:3,depth:1,height:1.1},
  ];
  const ids=chooseOccluders({camera:{x:0,y:2,z:5},target:{x:0,y:.7,z:0},occluders});
  assert.deepEqual(ids,['sofa']);
  assert.equal(ids.includes('back-wall'),false);
});

test('default cinematic rig ignores orbit and preserves fixed-offset pose', () => {
  const player={position:{x:0,y:0,z:0}};
  const base=stepCamera(createCameraController(),{player,world:clearWorld,mode:'explore',dt:1});
  const controller=createCameraController();
  orbitCamera(controller,{yawDelta:1.1,pitchDelta:.2});
  const after=stepCamera(controller,{player,world:clearWorld,mode:'explore',dt:1,speed:8});
  assert.deepEqual(after,base);
});

test('orbitCamera changes yaw and clamps pitch', () => {
  const controller=createCameraController();
  const startYaw=controller.yaw;
  orbitCamera(controller,{yawDelta:.5,pitchDelta:2});
  assert.notEqual(controller.yaw,startYaw);
  assert.equal(controller.pitch,.32);
  orbitCamera(controller,{pitchDelta:-5});
  assert.equal(controller.pitch,-.55);
});

test('yaw orbit moves explore camera around player while target height stays stable', () => {
  const player={position:{x:0,y:0,z:0}};
  const baseController=createCameraController();
  const base=stepCamera(baseController,{player,world:clearWorld,mode:'explore',dt:1});
  const orbitController=createCameraController();
  orbitCamera(orbitController,{yawDelta:Math.PI/2});
  const orbited=stepCamera(orbitController,{player,world:clearWorld,mode:'explore',dt:1,rig:'third-person'});
  assert.notDeepEqual({x:orbited.position.x,z:orbited.position.z},{x:base.position.x,z:base.position.z});
  assert.equal(orbited.target.y,base.target.y);
});

test('higher speed increases follow distance within limits', () => {
  const player={position:{x:0,y:0,z:0}};
  const slow=stepCamera(createCameraController(),{player,world:clearWorld,mode:'explore',dt:1,speed:0,rig:'third-person'});
  const fast=stepCamera(createCameraController(),{player,world:clearWorld,mode:'explore',dt:1,speed:8,rig:'third-person'});
  assert.ok(distance(fast.position,fast.target)>distance(slow.position,slow.target));
  assert.ok(distance(fast.position,fast.target)<5);
});

test('blocker keeps camera outside a 0.45 minimum target distance and passes collision radius', () => {
  let receivedPadding=null;
  const world={cameraBlockers:[{id:'wall'}],traceCameraSegment(target,desired,blockers,padding){receivedPadding=padding;return {id:'wall',fraction:.3};}};
  const pose=stepCamera(createCameraController(),{player:{position:{x:0,y:0,z:0}},world,dt:1,rig:'third-person'});
  assert.ok(distance(pose.position,pose.target)>.45);
  assert.equal(receivedPadding,.22);
});

test('extremely close blocker wins over minimum camera distance', () => {
  const world={cameraBlockers:[{id:'wall'}],traceCameraSegment(){return {id:'wall',fraction:.08};}};
  const pose=stepCamera(createCameraController(),{player:{position:{x:0,y:0,z:0}},world,dt:1,rig:'third-person'});
  assert.ok(distance(pose.position,pose.target)<.45,'camera must not be forced through a blocker just to preserve boom length');
  assert.equal(finitePose(pose),true);
});

test('repeated small dt converges smoothly instead of teleporting', () => {
  const controller=createCameraController();
  const player={position:{x:0,y:0,z:0}};
  stepCamera(controller,{player,world:clearWorld,dt:1,rig:'third-person'});
  player.position.x=3;
  const first=stepCamera(controller,{player,world:clearWorld,dt:.016,rig:'third-person'});
  const firstGap=Math.abs(first.target.x-player.position.x);
  assert.ok(firstGap>0);
  let pose=first;
  for(let i=0;i<90;i++) pose=stepCamera(controller,{player,world:clearWorld,dt:.016,rig:'third-person'});
  assert.ok(Math.abs(pose.target.x-player.position.x)<firstGap);
});

test('dt zero keeps camera pose finite', () => {
  const pose=stepCamera(createCameraController(),{player:{position:{x:0,y:0,z:0}},world:clearWorld,dt:0,rig:'third-person'});
  assert.equal(finitePose(pose),true);
});
