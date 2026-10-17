import test from 'node:test';
import assert from 'node:assert/strict';
import { OVERHEAD_ROOM_CAMERA, createOverheadCameraPose } from '../../crazy-family/overhead-camera.js';

const finitePose = (pose) => [
  pose.position.x, pose.position.y, pose.position.z,
  pose.target.x, pose.target.y, pose.target.z,
  pose.fov,
].every(Number.isFinite);

const length = (v) => Math.hypot(v.x, v.y, v.z);
const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

test('overhead camera uses the approved fixed room pose on desktop', () => {
  const pose = createOverheadCameraPose({ width: 960, height: 600 });
  assert.deepEqual(pose.position, { x: 7.2, y: 11.5, z: 8.0 });
  assert.deepEqual(pose.target, { x: 0, y: 0.45, z: 0 });
  assert.equal(pose.fov, 48);
  assert.equal(OVERHEAD_ROOM_CAMERA.desktopAspect, 1.35);
});

test('overhead camera ignores gameplay inputs because it consumes viewport only', () => {
  const a = createOverheadCameraPose({ width: 960, height: 600, player: { x: 4 }, sprinting: true });
  const b = createOverheadCameraPose({ width: 960, height: 600, dad: { state: 'sing' }, interaction: true });
  assert.deepEqual(a, b);
});

test('portrait resize moves only along the same view ray', () => {
  const desktop = createOverheadCameraPose({ width: 960, height: 600 });
  const portrait = createOverheadCameraPose({ width: 390, height: 844 });
  assert.deepEqual(portrait.target, desktop.target);
  assert.equal(portrait.fov, desktop.fov);
  const a = subtract(desktop.position, desktop.target);
  const b = subtract(portrait.position, portrait.target);
  const scale = length(b) / length(a);
  assert.ok(scale > 1 && scale <= 1.45);
  const ax = a.x / length(a), ay = a.y / length(a), az = a.z / length(a);
  const bx = b.x / length(b), by = b.y / length(b), bz = b.z / length(b);
  assert.ok(Math.abs(ax - bx) < 1e-9 && Math.abs(ay - by) < 1e-9 && Math.abs(az - bz) < 1e-9);
});

test('zero and tiny dimensions stay finite', () => {
  for (const dims of [{ width: 0, height: 0 }, { width: 1, height: 1 }, { width: 320, height: 1 }]) {
    const pose = createOverheadCameraPose(dims);
    assert.equal(finitePose(pose), true);
    assert.deepEqual(pose.target, { x: 0, y: 0.45, z: 0 });
    assert.equal(pose.fov, 48);
  }
});
