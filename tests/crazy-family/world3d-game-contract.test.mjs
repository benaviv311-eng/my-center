import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { cameraLookDelta } from '../../crazy-family/input.js';

test('camera look delta remains available for legacy/cinematic callers',()=>{
  assert.deepEqual(cameraLookDelta({dx:10,dy:-5}),{yawDelta:.04,pitchDelta:.015});
  assert.deepEqual(cameraLookDelta({}),{yawDelta:0,pitchDelta:0});
});

test('world3d uses volumetric actors and the room-anchored overhead camera', async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/from '\.\/characters-3d\.js'/);
  assert.match(source,/from '\.\/overhead-camera\.js'/);
  assert.match(source,/createCharacter3D\(\{scene:sceneHandle\.characterLayer,kind:'libi'\}\)/);
  assert.match(source,/createCharacter3D\(\{scene:sceneHandle\.characterLayer,kind:'dad'\}\)/);
  assert.match(source,/heading:player\.heading/);
  assert.match(source,/Math\.atan2\(dadFrame\.velocity\.x,-dadFrame\.velocity\.z\)/);
  assert.match(source,/playerVisual\.update\(dt,now\)/);
  assert.match(source,/dadVisual\.update\(dt,now\)/);
});

test('world3d overhead framing responds to the real viewport rather than the fixed stage aspect', async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/framingWidth\s*=\s*globalThis\.innerWidth\s*\|\|\s*width/);
  assert.match(source,/framingHeight\s*=\s*globalThis\.innerHeight\s*\|\|\s*height/);
  assert.match(source,/createOverheadCameraPose\(\{width:framingWidth,height:framingHeight\}\)/);
  assert.match(source,/sceneHandle\.resize\(width,height\)/,'renderer still sizes to the actual game root');
});

test('world3d no longer uses billboard or player-follow camera presentation', async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/visual\.faceCamera/);
  assert.doesNotMatch(source,/playerVisual\.faceCamera/);
  assert.doesNotMatch(source,/dadVisual\.faceCamera/);
  assert.doesNotMatch(source,/orbitCamera/);
  assert.doesNotMatch(source,/lookPointerId/);
  assert.match(source,/rendererMode==='world3d'\?createOverheadCameraPose/);
  assert.match(source,/if\(rendererMode==='cinematic'\).*stepCamera/s);
});

test('cinematic fallback and retained gameplay stay in the shared coordinator', async()=>{
  const source=await fs.readFile(new URL('../../crazy-family/game.js',import.meta.url),'utf8');
  assert.match(source,/createLivingRoomScene/);
  assert.match(source,/createCharacterVisual/);
  assert.match(source,/APPROVED_LIBI_ASSET/);
  assert.match(source,/APPROVED_DAD_ASSET/);
  assert.match(source,/stepCharacter\(player,moveIntent,dt,world,\{crouching,sprinting\}\)/);
  assert.match(source,/stepDad\(dadController/);
  assert.match(source,/applyDadSongExposure/);
  assert.match(source,/tickRetainedSystems/);
  assert.match(source,/resolveInteraction/);
});
