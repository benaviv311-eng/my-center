import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getCharacter3DCanon } from '../../crazy-family/character-3d-canon.js';

const source = await readFile(new URL('../../crazy-family/characters-3d.js', import.meta.url), 'utf8');

test('3d canon preserves Libi and Dad identity cues and proportions', () => {
  const libi = getCharacter3DCanon('libi');
  const dad = getCharacter3DCanon('dad');
  assert.equal(libi.height, 1.18);
  assert.equal(dad.height, 1.78);
  assert.ok(dad.height > libi.height);
  assert.equal(libi.colors.hair, 0x5a3828);
  assert.equal(libi.colors.flower, 0xff78ad);
  assert.equal(libi.colors.top, 0xf07f87);
  assert.equal(libi.colors.overalls, 0x2d9ba7);
  assert.equal(libi.colors.shoes, 0xf35c95);
  assert.equal(dad.colors.hair, 0x3a251d);
  assert.equal(dad.colors.overshirt, 0x2f7f7c);
  assert.equal(dad.colors.undershirt, 0xf0e8d5);
  assert.equal(dad.colors.slippers, 0x7b5037);
  assert.equal(libi.markers.pigtails, true);
  assert.equal(libi.markers.stripedSocks, true);
  assert.equal(dad.markers.stubble, true);
  assert.equal(dad.markers.pajamaPants, true);
});

test('native actor source is volumetric and never billboards', () => {
  assert.match(source, /new THREE\.Group/);
  assert.match(source, /(BoxGeometry|SphereGeometry|CylinderGeometry|CapsuleGeometry)/);
  assert.doesNotMatch(source, /PlaneGeometry/);
  assert.doesNotMatch(source, /faceCamera/);
  assert.doesNotMatch(source, /lookAt\s*\(/);
  assert.doesNotMatch(source, /cinematic-projection/);
  assert.doesNotMatch(source, /TextureLoader/);
  assert.doesNotMatch(source, /scale\.x\s*=/);
});

test('native actor transform uses world position and Y rotation', () => {
  assert.match(source, /root\.position\.set\(position\.x,\s*position\.y,\s*position\.z\)/);
  assert.match(source, /root\.rotation\.y/);
  assert.match(source, /lastHeading/);
});

test('unknown 3d character kind is rejected', () => {
  assert.throws(() => getCharacter3DCanon('other'), /Unknown 3D character kind/);
});
