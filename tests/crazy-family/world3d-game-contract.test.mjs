import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { cameraLookDelta } from '../../crazy-family/input.js';

test('camera look delta uses exact default sensitivities',()=>{
  const delta=cameraLookDelta({dx:10,dy:-5});
  assert.deepEqual(delta,{yawDelta:.04,pitchDelta:.015});
  assert.ok(Number.isFinite(delta.yawDelta)&&Number.isFinite(delta.pitchDelta));
});

test('game selects world3d renderer without forking retained gameplay',async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/resolveRendererMode/);
  assert.match(source,/createLivingRoom3DScene/);
  assert.match(source,/rendererMode\s*===\s*['"]world3d['"]/);
  assert.match(source,/projectPosition:\s*sceneHandle\.renderPosition/);
  assert.match(source,/screenStage:\s*sceneHandle\.screenStage/);
  assert.match(source,/rig:\s*world3d\s*\?\s*['"]third-person['"]\s*:\s*['"]cinematic['"]/);
  assert.match(source,/createLivingRoomScene/,'cinematic renderer must remain available');
});

test('world3d presentation uses logical position and unit visual scale',async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/function applyWorldCharacter/);
  assert.match(source,/visual\.mesh\.scale\.set\([^\n]*1[^\n]*1/);
  assert.match(source,/visual\.faceCamera\(camera\.position\)/);
});
