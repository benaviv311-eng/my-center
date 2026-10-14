import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function loadSourceModule(relativePath) {
  const url = new URL(`../${relativePath}`, import.meta.url);
  const source = await fs.readFile(url, 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const projection = await loadSourceModule('crazy-family/cinematic-projection.js');
const occlusion = await loadSourceModule('crazy-family/cinematic-occlusion.js');

const bounds = { minX: -6, maxX: 6, minZ: -4.6, maxZ: 4.6 };
const back = projection.projectWorldToCinematicStage({ x: 0, y: 0, z: bounds.minZ }, { bounds });
const front = projection.projectWorldToCinematicStage({ x: 0, y: 0, z: bounds.maxZ }, { bounds });
assert.ok(back.scale >= 1.42, `back-of-room actor is too small: ${back.scale}`);
assert.ok(front.scale <= 2.35, `front-of-room actor grows too aggressively: ${front.scale}`);
assert.ok(front.scale > back.scale, 'actors should still grow as they approach the camera');

const grounded = projection.projectWorldToCinematicStage({ x: 0, y: 0, z: 0 }, { bounds });
const jumped = projection.projectWorldToCinematicStage({ x: 0, y: 1, z: 0 }, { bounds });
assert.equal(typeof grounded.groundY, 'number', 'projection must expose the planted-foot ground anchor');
assert.equal(grounded.y, grounded.groundY, 'a grounded actor must sit exactly on the floor anchor');
assert.ok(Math.abs((jumped.y - jumped.groundY) - 0.94) < 1e-9, 'jump height must be added above the same ground anchor');

const proxy = { id: 'coffee-table', kind: 'furniture', x: 0, z: 0, width: 2, depth: 1 };
const nearEdgeActor = { x: 1.8, y: 0, z: -2 };
const active = occlusion.resolveCinematicOcclusion({
  camera: { x: 0, y: 2, z: 5 },
  actor: nearEdgeActor,
  occluders: [proxy],
});
assert.equal(active.has('coffee-table'), true, 'default actor body padding should keep near-edge furniture occlusion stable');

console.log('v0.44 character integration tests passed');
