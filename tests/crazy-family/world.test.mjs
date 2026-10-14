import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingRoomWorld } from '../../crazy-family/world.js';

function insideExpanded(point, collider, radius) {
  return point.x > collider.x - collider.width / 2 - radius &&
    point.x < collider.x + collider.width / 2 + radius &&
    point.z > collider.z - collider.depth / 2 - radius &&
    point.z < collider.z + collider.depth / 2 + radius;
}

test('living room exposes four finite room-shell wall blockers', () => {
  const world = createLivingRoomWorld();
  assert.equal(world.roomShell.length, 4);
  assert.deepEqual(world.roomShell.map(w => w.id).sort(), ['wall-east','wall-north','wall-south','wall-west']);
  for (const wall of world.roomShell) {
    for (const key of ['x','y','z','width','depth','height']) assert.ok(Number.isFinite(wall[key]), `${wall.id}.${key}`);
    assert.equal(wall.kind, 'wall');
    assert.equal(wall.cameraBlocker, true);
  }
});

test('renderables contain canonical furniture plus room shell with unique ids', () => {
  const world = createLivingRoomWorld();
  const ids = world.renderables.map(o => o.id);
  for (const id of ['floor','sofa','coffee-table','rug','side-table','doorway','wall-north','wall-south','wall-east','wall-west']) assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length);
});

test('camera trace hits the nearest room wall from center', () => {
  const world = createLivingRoomWorld();
  const hit = world.traceCameraSegment({x:0,y:1,z:0},{x:8,y:1,z:0});
  assert.equal(hit.id, 'wall-east');
  assert.ok(hit.fraction > 0 && hit.fraction < 1);
});

test('larger camera padding collides no later than default padding', () => {
  const world = createLivingRoomWorld();
  const start = {x:0,y:1,z:3.5};
  const end = {x:-3.35,y:1,z:0.55};
  const normal = world.traceCameraSegment(start,end,world.cameraBlockers,0.12);
  const padded = world.traceCameraSegment(start,end,world.cameraBlockers,0.35);
  assert.ok(normal && padded);
  assert.ok(padded.fraction < normal.fraction, `${padded.fraction} !< ${normal.fraction}`);
});

test('swept diagonal capsule move stays in room and outside sofa', () => {
  const world = createLivingRoomWorld();
  const radius = 0.32;
  const sofa = world.colliders.find(c => c.id === 'sofa');
  const from = {x:-1.2,y:0,z:2.25};
  const to = {x:-5.5,y:0,z:-1.0};
  const resolved = world.resolveCharacterMove(from,to,{radius,height:1.15});
  assert.ok(resolved.x >= world.bounds.minX + radius && resolved.x <= world.bounds.maxX - radius);
  assert.ok(resolved.z >= world.bounds.minZ + radius && resolved.z <= world.bounds.maxZ - radius);
  assert.equal(insideExpanded(resolved,sofa,radius), false, JSON.stringify(resolved));
  assert.notDeepEqual({x:resolved.x,z:resolved.z},{x:to.x,z:to.z},'move tunneled through sofa unchanged');
});
