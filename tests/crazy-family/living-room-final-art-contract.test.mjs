import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { OVERHEAD_ROOM_CAMERA } from '../../crazy-family/overhead-camera.js';

test('living room gameplay collider geometry remains locked during final art work', () => {
  const world = createLivingRoomWorld();
  const snapshot = world.colliders.map(({ id, x, z, width, depth, height }) => [id, x, z, width, depth, height]);
  assert.deepEqual(snapshot, [
    ['sofa', -3.35, 0.55, 3.15, 1.25, 1.05],
    ['coffee-table', -0.25, 0.55, 2.15, 1.2, 0.52],
    ['side-table', -5.05, 0.38, 0.85, 0.75, 0.68],
  ]);
});

test('living room interaction contract remains locked during final art work', () => {
  const world = createLivingRoomWorld();
  const snapshot = world.interactables.map(({ id, action, radius }) => [id, action, radius]);
  assert.deepEqual(snapshot, [
    ['headphones', 'take', 0.9],
    ['sofa', 'climb', 1.15],
    ['toy-ball', 'push', 0.9],
    ['doorway', 'open', 1.2],
  ]);
});

test('approved fixed overhead camera stays locked during final art work', () => {
  assert.deepEqual(OVERHEAD_ROOM_CAMERA.position, { x: 7.2, y: 11.5, z: 8 });
  assert.deepEqual(OVERHEAD_ROOM_CAMERA.target, { x: 0, y: 0.45, z: 0 });
  assert.equal(OVERHEAD_ROOM_CAMERA.fov, 48);
});
