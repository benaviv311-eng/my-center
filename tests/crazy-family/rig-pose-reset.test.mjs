import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../crazy-family/character-rig.js', import.meta.url), 'utf8');

test('segmented rig pose application resets part positions instead of accumulating offsets', () => {
  const start = source.indexOf('function applyPoseToRig');
  assert.ok(start >= 0, 'applyPoseToRig must exist');
  const end = source.indexOf('\n  let lastMovementYaw', start);
  const section = source.slice(start, end > start ? end : undefined);
  assert.doesNotMatch(section, /position\.y\s*\+=/,'pose offsets must not accumulate across frames');
  assert.match(section, /neutralPosition/,'pose application must restore a neutral part position before offsets');
});
