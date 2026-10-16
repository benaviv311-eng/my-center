import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { cameraLookDelta } from '../../crazy-family/input.js';

test('camera look delta uses stable default sensitivities',()=>{
  assert.deepEqual(cameraLookDelta({dx:10,dy:-5}),{yawDelta:.04,pitchDelta:.015});
  assert.deepEqual(cameraLookDelta({}),{yawDelta:0,pitchDelta:0});
});

test('game selects world3d without forking retained gameplay',async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/resolveRendererMode/);
  assert.match(source,/createLivingRoom3DScene/);
  assert.match(source,/rendererMode\s*===\s*['"]world3d['"]/);
  assert.match(source,/projectPosition:\s*sceneHandle\.renderPosition/);
  assert.match(source,/screenStage:\s*sceneHandle\.screenStage/);
  assert.match(source,/orbitCamera/);
  assert.match(source,/stepCharacter\(player,\s*moveIntent,\s*dt,\s*world,\s*\{\s*crouching,\s*sprinting\s*\}\)/);
  assert.match(source,/speed:\s*playerSpeed/);
  assert.match(source,/createLivingRoomScene/,'cinematic fallback import must remain');
});

test('world3d actor presentation avoids cinematic perspective scaling',async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/if\s*\(sceneHandle\.screenStage\)/);
  assert.match(source,/visual\.mesh\.scale\.set\(\(facing<0\?-1:1\),1,1\)/);
  assert.match(source,/visual\.faceCamera\(sceneHandle\.camera\.position\)/);
});
