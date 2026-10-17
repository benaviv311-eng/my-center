import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('world3d ground restores warm wood and canonical rug as textured walkable surfaces',async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
  assert.match(source,/CanvasTexture/);
  assert.match(source,/canonical-wood/);
  assert.match(source,/canonical-rug/);
  assert.doesNotMatch(source,/floor:0xb98c70/);
  assert.doesNotMatch(source,/surface:0xc7776f/);
});
