import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const characters = await readFile(new URL('../../crazy-family/characters.js', import.meta.url), 'utf8');

test('world3d adds depth without bypassing the locked character canon', () => {
  assert.match(characters, /from '\.\/character-canon\.js'/);
  assert.match(characters, /getCanonicalCharacter\(kind\)/);
  assert.match(characters, /world3d-stage/);
  assert.match(characters, /canonical-3d-stack/);
  assert.match(characters, /BoxGeometry/);
  assert.match(characters, /canonicalReveal/);
  assert.match(characters, /Math\.atan2/);
});

test('cinematic fallback keeps the canonical sprite path', () => {
  assert.match(characters, /PlaneGeometry/);
  assert.match(characters, /canonical-sprite/);
});
