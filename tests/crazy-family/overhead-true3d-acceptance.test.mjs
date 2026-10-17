import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap = await readFile(new URL('../../crazy-family/bootstrap.js', import.meta.url), 'utf8');
const game = await readFile(new URL('../../crazy-family/game.js', import.meta.url), 'utf8');
const scene3d = await readFile(new URL('../../crazy-family/scene-3d.js', import.meta.url), 'utf8');
const roomArt = await readFile(new URL('../../crazy-family/living-room-art.js', import.meta.url), 'utf8');
const nativeActors = await readFile(new URL('../../crazy-family/characters-3d.js', import.meta.url), 'utf8');
const canon3d = await readFile(new URL('../../crazy-family/character-3d-canon.js', import.meta.url), 'utf8');
const lockWorkflow = await readFile(new URL('../../.github/workflows/crazy-family-character-lock.yml', import.meta.url), 'utf8');

test('v0.48 publishes fixed overhead true3d with Living Room Final Art v1', () => {
  assert.match(bootstrap, /CRAZY_FAMILY_VERSION = 'v0\.48'/);
  assert.match(game, /createOverheadCameraPose/);
  assert.match(game, /createCharacter3D/);
  assert.match(scene3d, /createLivingRoomArt/);
  assert.match(scene3d, /createLivingRoomLighting/);
  assert.match(roomArt, /stylized-final-v1/);
  assert.doesNotMatch(nativeActors, /PlaneGeometry/);
  assert.doesNotMatch(nativeActors, /faceCamera/);
});

test('3d character canon participates in the repository character lock', () => {
  assert.match(canon3d, /height: 1\.18/);
  assert.match(canon3d, /height: 1\.78/);
  assert.match(lockWorkflow, /crazy-family\/character-3d-canon\.js/);
  assert.match(lockWorkflow, /crazy-family\/characters-3d\.js/);
  assert.match(lockWorkflow, /tests\/crazy-family\/characters-3d\.test\.mjs/);
});
