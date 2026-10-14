import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { buildGrayboxDescriptors } from '../../crazy-family/graybox-layout.js';

test('graybox descriptors expose canonical room geometry in world coordinates', () => {
  const descriptors=buildGrayboxDescriptors(createLivingRoomWorld());
  const ids=descriptors.map(d=>d.id);
  for(const id of ['floor','wall-north','wall-south','wall-east','wall-west','sofa','coffee-table','rug','side-table','doorway']) assert.ok(ids.includes(id),id);
  for(const d of descriptors){
    for(const key of ['x','y','z','width','depth','height']) assert.ok(Number.isFinite(d[key]),`${d.id}.${key}`);
  }
  const floor=descriptors.find(d=>d.id==='floor');
  assert.ok(Math.abs((floor.y+floor.height/2)-0)<1e-9,'floor top must align with logical ground Y=0');
});

test('true 3d scene uses PerspectiveCamera and no cinematic projection', async () => {
  const source=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
  assert.match(source,/new THREE\.PerspectiveCamera\(50\s*,/);
  assert.doesNotMatch(source,/cinematic-projection/);
  assert.match(source,/visualMode:\s*['"]world3d['"]/);
  assert.match(source,/screenStage:\s*false/);
});

test('cinematic scene exposes renderPosition alias without removing projectWorld', async () => {
  const source=await fs.readFile(new URL('../../crazy-family/scene.js',import.meta.url),'utf8');
  assert.match(source,/renderPosition\s*:\s*projectWorld/);
  assert.match(source,/projectWorld/);
});
