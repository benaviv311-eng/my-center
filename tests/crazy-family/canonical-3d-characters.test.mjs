import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const characters = await readFile(new URL('../../crazy-family/characters.js', import.meta.url), 'utf8');

test('world3d keeps a stable canonical root and upgrades from stack fallback to segmented rig', () => {
  assert.match(characters, /from '\.\/character-canon\.js'/);
  assert.match(characters, /from '\.\/character-rig\.js'/);
  assert.match(characters, /getCanonicalCharacter\(kind\)/);
  assert.match(characters, /world3d-stage/);
  assert.match(characters, /canonical-3d-stack/);
  assert.match(characters, /createCanonicalSegmentedRig/);
  assert.match(characters, /canonical-segmented-rig/);
  assert.match(characters, /const stableRoot = new THREE\.Group\(\)/);
  assert.match(characters, /stableRoot\.userData\.renderMode\s*=\s*'canonical-3d-stack'/);
  assert.match(characters, /stableRoot\.userData\.renderMode\s*=\s*'canonical-segmented-rig'/);
  assert.match(characters, /ready/);
});

test('world3d rig failure leaves the locked canonical stack active', () => {
  assert.match(characters, /console\.warn/);
  assert.match(characters, /Crazy Family segmented rig/);
  assert.match(characters, /canonical-3d-stack/);
  assert.match(characters, /requestedAsset[\s\S]*canonical\.asset/);
  assert.match(characters, /Character canon is locked/);
});

test('cinematic fallback keeps the canonical sprite path unchanged', () => {
  assert.match(characters, /PlaneGeometry/);
  assert.match(characters, /canonical-sprite/);
  assert.match(characters, /texture\.offset/);
});

test('world3d visual API still exposes pose frame camera visibility and disposal hooks', () => {
  for (const method of ['setPose','setFrame','faceCamera','setVisible','dispose']) {
    assert.match(characters, new RegExp(`${method}\\s*\\(`));
  }
});
