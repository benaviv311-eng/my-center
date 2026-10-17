import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const characters = await readFile(new URL('../../crazy-family/characters.js', import.meta.url), 'utf8');

test('canonical character assets remain the source of truth', () => {
  assert.match(characters, /assets\/libi-sprites-v025\.png/);
  assert.match(characters, /assets\/crazy-family\/dad-sprites-v028\.png/);
});

test('world3d uses a volumetric canonical character path instead of a camera-facing plane', () => {
  assert.match(characters, /world3d-stage/);
  assert.match(characters, /canonical.*3d|BoxGeometry|ExtrudeGeometry/i);
  assert.match(characters, /depth/i);
});

test('cinematic sprite fallback remains available', () => {
  assert.match(characters, /PlaneGeometry/);
});
