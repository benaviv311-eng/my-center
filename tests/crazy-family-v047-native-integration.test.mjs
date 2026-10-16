import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const gamePath=new URL('../crazy-family/game-3d.js',import.meta.url);
const gameSource=await fs.readFile(gamePath,'utf8');

for(const required of [
  "from './movement.js'",
  "from './world.js'",
  "from './scenario.js'",
  "from './dad.js'",
  "from './attacks.js'",
  "from './interaction.js'",
  "from './audio.js'",
  "from './characters-3d.js'",
  "from './scene-3d.js'",
]) assert.match(gameSource,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`game-3d must reuse ${required}`);

assert.doesNotMatch(gameSource,/cinematic-projection|projectWorldToCinematicStage|projectWorld\(/,'native actors may not use cinematic projection');
assert.match(gameSource,/createCharacter3D\(\{\s*scene:\s*sceneHandle\.characterLayer,\s*kind:\s*'libi'/);
assert.match(gameSource,/createCharacter3D\(\{\s*scene:\s*sceneHandle\.characterLayer,\s*kind:\s*'dad'/);
assert.match(gameSource,/playerVisual\.setTransform\(\{[\s\S]*position:\s*player\.position/);
assert.match(gameSource,/dadVisual\.setTransform\(\{[\s\S]*position:\s*dadFrame\.position/);

for(const retainedCall of ['updateStamina','applyDadSongExposure','damagePlayer','useItem','setWorldPose','setDadWorldDistance','tickRetainedSystems']){
  assert.match(gameSource,new RegExp(`legacyAdapter\\?\\.${retainedCall}`),`native loop must preserve ${retainedCall}`);
}
assert.match(gameSource,/createAttackVisualSystem\([^,]+,\{\s*projectPosition:\s*\(position\)=>position,\s*screenStage:false\s*\}\)/,'attacks must stay in world space');
assert.match(gameSource,/stepCamera\(cameraController,\{player,dad:dadFrame,world,mode:cameraMode,dt\}\)/,'native camera must consume the existing world-space controller');

const cameraSource=await fs.readFile(new URL('../crazy-family/camera.js',import.meta.url),'utf8');
const encoded=Buffer.from(cameraSource).toString('base64');
const camera=await import(`data:text/javascript;base64,${encoded}`);
const world={cameraBlockers:[],traceCameraSegment(){return null;}};
const player={position:{x:0,y:0,z:0}};
const dad={position:{x:1,y:0,z:-1}};
const exploreController=camera.createCameraController();
const explore=camera.stepCamera(exploreController,{player,dad,world,mode:'explore',dt:1});
assert.ok(explore.position.y>player.position.y,'camera must stay above Libi');
assert.ok(explore.position.z>player.position.z,'camera must stay behind the default forward view');
assert.ok(Number.isFinite(explore.fov)&&explore.fov>0);
const chaseController=camera.createCameraController();
const chase=camera.stepCamera(chaseController,{player,dad,world,mode:'chase',dt:1});
const exploreDistance=Math.hypot(explore.position.x-explore.target.x,explore.position.z-explore.target.z);
const chaseDistance=Math.hypot(chase.position.x-chase.target.x,chase.position.z-chase.target.z);
assert.ok(chaseDistance>exploreDistance,'chase camera must pull farther back');

let traced=false;
const blockedWorld={cameraBlockers:[{id:'wall'}],traceCameraSegment(target,desired){traced=true;return {fraction:.5};}};
const blockedController=camera.createCameraController();
const blocked=camera.stepCamera(blockedController,{player,dad,world:blockedWorld,mode:'explore',dt:1});
assert.equal(traced,true,'camera collision trace must still run');
assert.ok(blocked.position.z<explore.position.z,'camera collision must shorten the desired offset');

console.log('v0.47 native integration tests passed');
