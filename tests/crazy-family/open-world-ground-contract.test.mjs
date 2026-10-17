import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('world3d ground keeps warm textured wood and rug through the final-art material system',async()=>{
  const sceneSource=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
  const materialSource=await fs.readFile(new URL('../../crazy-family/living-room-materials.js',import.meta.url),'utf8');
  const artSource=await fs.readFile(new URL('../../crazy-family/living-room-art.js',import.meta.url),'utf8');
  assert.match(sceneSource,/createLivingRoomMaterialSystem/);
  assert.match(materialSource,/DataTexture/);
  assert.match(materialSource,/final-art-wood/);
  assert.match(materialSource,/final-art-rug/);
  assert.match(materialSource,/floorWood/);
  assert.match(materialSource,/\['rug',/);
  assert.match(artSource,/buildFloor/);
  assert.match(artSource,/buildRug/);
  assert.doesNotMatch(sceneSource,/floor:0xb98c70/);
  assert.doesNotMatch(sceneSource,/surface:0xc7776f/);
});
