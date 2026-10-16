import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingRoomWorld } from '../../crazy-family/world.js';

test('world exposes four finite room-shell walls and unique renderables',()=>{
 const world=createLivingRoomWorld();
 assert.equal(world.roomShell.length,4);
 for(const wall of world.roomShell) for(const key of ['x','y','z','width','depth','height']) assert.ok(Number.isFinite(wall[key]),`${wall.id}.${key}`);
 const ids=world.renderables.map(o=>o.id);
 for(const id of ['floor','sofa','coffee-table','rug','side-table','doorway','wall-north','wall-south','wall-east','wall-west']) assert.ok(ids.includes(id),id);
 assert.equal(new Set(ids).size,ids.length);
});

test('camera trace hits nearest wall and honors larger padding',()=>{
 const world=createLivingRoomWorld();
 const start={x:0,y:1,z:0},end={x:0,y:1,z:8};
 const normal=world.traceCameraSegment(start,end,world.cameraBlockers,.12);
 const padded=world.traceCameraSegment(start,end,world.cameraBlockers,.5);
 assert.equal(normal.id,'wall-north');
 assert.ok(padded.fraction<=normal.fraction);
});

test('diagonal character move remains inside room and outside sofa',()=>{
 const world=createLivingRoomWorld();
 const result=world.resolveCharacterMove({x:-1.6,y:0,z:2},{x:-4,y:0,z:.55},{radius:.32});
 assert.ok(result.x>=world.bounds.minX+.32 && result.x<=world.bounds.maxX-.32);
 const sofa=world.colliders.find(o=>o.id==='sofa');
 const inside=Math.abs(result.x-sofa.x)<sofa.width/2+.32 && Math.abs(result.z-sofa.z)<sofa.depth/2+.32;
 assert.equal(inside,false);
});
