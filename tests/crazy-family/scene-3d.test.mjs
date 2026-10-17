import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createLivingRoomWorld } from '../../crazy-family/world.js';
import { buildGrayboxDescriptors } from '../../crazy-family/scene-3d-descriptors.js';

test('descriptor compatibility still covers the real room shell and major furniture',()=>{
 const descriptors=buildGrayboxDescriptors(createLivingRoomWorld());
 const ids=descriptors.map(d=>d.id);
 for(const id of ['floor','wall-north','wall-south','wall-east','wall-west','sofa','coffee-table','rug','side-table','doorway']) assert.ok(ids.includes(id),id);
 for(const d of descriptors) for(const key of ['x','y','z','width','height','depth']) assert.ok(Number.isFinite(d[key]),`${d.id}.${key}`);
});

test('world3d scene delegates room visuals to final-art materials registry and lighting',async()=>{
 const source=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
 assert.match(source,/createLivingRoomMaterialSystem/);
 assert.match(source,/createLivingRoomArt/);
 assert.match(source,/createLivingRoomLighting/);
 assert.doesNotMatch(source,/buildGrayboxDescriptors/);
 assert.doesNotMatch(source,/function boxMesh/);
 assert.match(source,/await createLivingRoomArt/);
 assert.match(source,/art\.objectsById/);
});

test('3d scene keeps perspective renderer and existing world3d contract',async()=>{
 const source=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
 assert.match(source,/PerspectiveCamera\(50,/);
 assert.doesNotMatch(source,/cinematic-projection/);
 assert.match(source,/visualMode:\s*'world3d'/);
 assert.match(source,/screenStage:\s*false/);
 assert.match(source,/ACESFilmicToneMapping/);
 assert.match(source,/PCFSoftShadowMap/);
 assert.match(source,/Math\.min\(globalThis\.devicePixelRatio\|\|1,2\)/);
 assert.match(source,/objectsById/);
 assert.match(source,/projectObject/);
 assert.match(source,/applyReactiveTransforms/);
});

test('3d scene exposes a dedicated native character layer', async()=>{
 const source=await fs.readFile(new URL('../../crazy-family/scene-3d.js',import.meta.url),'utf8');
 assert.match(source,/const characterLayer=new THREE\.Group\(\)/);
 assert.match(source,/characterLayer\.name='world3d-characters'/);
 assert.match(source,/visualStage\.add\(characterLayer\)/);
 assert.match(source,/characterLayer,/);
});

test('cinematic scene exposes shared renderPosition alias',async()=>{
 const source=await fs.readFile(new URL('../../crazy-family/scene.js',import.meta.url),'utf8');
 assert.match(source,/renderPosition/);
});
