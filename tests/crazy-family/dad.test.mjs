import test from 'node:test';
import assert from 'node:assert/strict';
import { createDadController, stepDad } from '../../crazy-family/dad.js';
import { LIBI_MOVEMENT_DEFAULTS } from '../../crazy-family/movement.js';

const world={
  bounds:{minX:-5,maxX:5,minZ:-4,maxZ:4},
  navBlockers:[],
  resolveCharacterMove(_from,to){return to;},
};

test('Dad accelerates and brakes more heavily than Libi',()=>{
  const dad=createDadController({position:{x:0,y:0,z:0}});
  assert.ok(dad.acceleration<LIBI_MOVEMENT_DEFAULTS.acceleration);
  assert.ok(dad.braking<LIBI_MOVEMENT_DEFAULTS.braking);
  assert.ok(dad.maxSpeed<LIBI_MOVEMENT_DEFAULTS.maxSpeed);
});

test('pant yawn and sneeze interrupt chase without erasing goal',()=>{
  for(const state of ['pant','yawn','sneeze']){
    const dad=createDadController({position:{x:0,y:0,z:0}});
    dad.goal={x:3,z:2};
    const frame=stepDad(dad,{player:{position:{x:4,y:0,z:0}},world,retainedState:{dad:{state}},dt:.1,now:1000});
    assert.equal(frame.state,state);
    assert.deepEqual(dad.goal,{x:3,z:2});
    assert.ok(Math.hypot(frame.velocity.x,frame.velocity.z)<.5);
  }
});

test('Dad chases player and keeps a path goal',()=>{
  const dad=createDadController({position:{x:-3,y:0,z:0}});
  const frame=stepDad(dad,{player:{position:{x:3,y:0,z:0}},world,retainedState:{dad:{state:'idle'}},dt:.2,now:1000});
  assert.equal(frame.state,'chase');
  assert.ok(dad.goal.x>2.5);
  assert.ok(frame.velocity.x>0);
});

test('blocked path forces an earlier repath',()=>{
  const dad=createDadController({position:{x:-3,y:0,z:0},repathInterval:10});
  dad.nextRepathAt=999999;
  dad.path=[{x:-3,z:0},{x:-2,z:0}];
  dad.pathIndex=1;
  const blockedWorld={...world,resolveCharacterMove(from,to){return {...from};}};
  stepDad(dad,{player:{position:{x:3,y:0,z:0}},world:blockedWorld,retainedState:{dad:{state:'idle'}},dt:.2,now:1000});
  assert.ok(dad.nextRepathAt<=1000);
});
