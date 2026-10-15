import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { buildGrayboxDescriptors } from '../../crazy-family/scene-3d-descriptors.js';

test('graybox descriptors cover the real room shell and major furniture',()=>{
 const descriptors=buildGrayboxDescriptors(createLivingRoomWorld());
 const ids=descriptors.map(d=>d.id);
 for(const id of ['floor','wall-north','wall-south','wall-east','wall-west','sofa','coffee-table','rug','side-table','doorway']) assert.ok(ids.includes(id),id);
 for(const d of descriptors) for(const key of ['x','y','z','width','height','depth']) assert.ok(Number.isFinite(d[key]),`${d.id}.${key}`);
});

test('3d scene uses perspective camera and no cinematic projection',async()=>{
 const source=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
 assert.match(source,/PerspectiveCamera\(50,/);
 assert.doesNotMatch(source,/cinematic-projection/);
 assert.match(source,/visualMode:\s*'world3d'/);
 assert.match(source,/screenStage:\s*false/);
});

test('cinematic scene exposes shared renderPosition alias',async()=>{
 const source=await fs.readFile(new URL('../../crazy-family/scene.js',import.meta.url),'utf8');
 assert.match(source,/renderPosition/);
});
