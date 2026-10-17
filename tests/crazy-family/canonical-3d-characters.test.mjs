import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fallback = await readFile(new URL('../../crazy-family/characters.js', import.meta.url), 'utf8');
const native = await readFile(new URL('../../crazy-family/characters-3d.js', import.meta.url), 'utf8');

test('cinematic fallback keeps the locked canonical sprite renderer', () => {
  assert.match(fallback, /from '\.\/character-canon\.js'/);
  assert.match(fallback, /getCanonicalCharacter\(kind\)/);
  assert.match(fallback, /canonical-sprite/);
  assert.match(fallback, /PlaneGeometry/);
});

test('world3d actors live in a separate true volumetric module', () => {
  assert.match(native, /createCharacter3D/);
  assert.match(native, /new THREE\.Group/);
  assert.doesNotMatch(native, /PlaneGeometry/);
  assert.doesNotMatch(native, /canonical-3d-stack/);
  assert.doesNotMatch(native, /faceCamera/);
});
