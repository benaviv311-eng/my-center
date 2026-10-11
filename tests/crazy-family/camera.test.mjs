import test from 'node:test';
import assert from 'node:assert/strict';
import { createCameraController, stepCamera, chooseOccluders } from '../../crazy-family/camera.js';

const clearWorld = {
  cameraBlockers: [],
  traceCameraSegment(){ return null; },
};

function distance(a,b){ return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z); }

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

test('visual envelope shortens camera before exposing unauthored set edge',()=>{
  const player={position:{x:5.2,y:0,z:3.8}};
  const envelope={minX:-5.8,maxX:5.8,minY:.2,maxY:4.1,minZ:-4.4,maxZ:4.25};
  const pose=stepCamera(createCameraController(),{player,world:clearWorld,mode:'chase',dt:1,visualEnvelope:envelope});
  assert.ok(pose.position.x<=envelope.maxX);
  assert.ok(pose.position.z<=envelope.maxZ);
  assert.ok(pose.position.y<=envelope.maxY);
});

test('visual envelope does not clamp player movement',()=>{
  const player={position:{x:5.65,y:0,z:4.1}};
  const before={...player.position};
  stepCamera(createCameraController(),{player,world:clearWorld,mode:'explore',dt:1,visualEnvelope:{minX:-5,maxX:5,minY:.2,maxY:4,minZ:-4,maxZ:4}});
  assert.deepEqual(player.position,before);
});

test('chase framing remains wider than explore inside cinematic envelope',()=>{
  const envelope={minX:-5.8,maxX:5.8,minY:.2,maxY:4.2,minZ:-4.45,maxZ:4.35};
  const player={position:{x:0,y:0,z:0}},dad={position:{x:1.5,y:0,z:-1.5}};
  const explore=stepCamera(createCameraController(),{player,dad,world:clearWorld,mode:'explore',dt:1,visualEnvelope:envelope});
  const chase=stepCamera(createCameraController(),{player,dad,world:clearWorld,mode:'chase',dt:1,visualEnvelope:envelope});
  assert.ok(chase.fov>explore.fov);
  assert.ok(distance(chase.position,chase.target)>=distance(explore.position,explore.target)*.9);
});
