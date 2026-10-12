import test from 'node:test';
import assert from 'node:assert/strict';
import { projectWorldToCinematicStage } from '../../crazy-family/cinematic-projection.js';

const bounds={minX:-6,maxX:6,minZ:-4.6,maxZ:4.6};

test('near world positions render lower and larger than far positions',()=>{
  const far=projectWorldToCinematicStage({x:0,y:0,z:-4.6},{bounds});
  const near=projectWorldToCinematicStage({x:0,y:0,z:4.6},{bounds});
  assert.ok(near.y<far.y);
  assert.ok(near.scale>far.scale);
  assert.ok(near.z>far.z);
});

test('left and right world positions preserve their screen side',()=>{
  const left=projectWorldToCinematicStage({x:-4,y:0,z:0},{bounds});
  const right=projectWorldToCinematicStage({x:4,y:0,z:0},{bounds});
  assert.ok(left.x<0);
  assert.ok(right.x>0);
  assert.ok(Math.abs(left.x+right.x)<1e-9);
});

test('jump raises character on screen without changing floor depth or horizontal placement',()=>{
  const floor=projectWorldToCinematicStage({x:1.2,y:0,z:1},{bounds});
  const jump=projectWorldToCinematicStage({x:1.2,y:1,z:1},{bounds});
  assert.equal(jump.x,floor.x);
  assert.equal(jump.z,floor.z);
  assert.equal(jump.scale,floor.scale);
  assert.ok(jump.y>floor.y);
});

test('projection keeps room extremes within 16 by 9 cinematic stage',()=>{
  for(const point of [
    {x:-6,y:0,z:-4.6},{x:6,y:0,z:-4.6},{x:-6,y:0,z:4.6},{x:6,y:0,z:4.6},
  ]){
    const projected=projectWorldToCinematicStage(point,{bounds});
    assert.ok(projected.x>=-7.5&&projected.x<=7.5);
    assert.ok(projected.y>=-3.7&&projected.y<=2.5);
  }
});
