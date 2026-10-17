const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const scenePath=path.join(root,'raishin-legacy','src','scenes','DojoScene.js');
const bootstrapPath=path.join(root,'raishin-legacy','v2-game.js');
const htmlPath=path.join(root,'raishin-legacy','v2.html');
const source=fs.readFileSync(scenePath,'utf8');
const bootstrap=fs.readFileSync(bootstrapPath,'utf8');
const html=fs.readFileSync(htmlPath,'utf8');

assert.match(source,/function\s+createDojoScene\s*\(Phaser\s*,\s*deps\)/);
assert.match(source,/class\s+DojoScene\s+extends\s+Phaser\.Scene/);
for(const dep of ['WorldPlane','PlayerController','CollisionMap','PlayerAnimator','PlayerView','DepthSystem','CameraRig','RaikaAnimationData','DojoLayout'])assert.ok(source.includes(dep),`scene must use ${dep}`);
assert.doesNotMatch(source,/CameraFollow/,'v2 scene must stop using the tiny CameraFollow adapter');
assert.match(source,/CameraRig\.create\(/,'scene must create the real scrolling CameraRig');
assert.match(source,/cameraRig\.reset\(/,'scene must initialize camera scroll from Raika ground projection');
assert.match(source,/cameraRig\.update\(/,'scene must update the real camera from ground projection and velocity');
assert.match(source,/cameras\.main\.setScroll\(/,'scene must apply CameraRig scroll to Phaser camera');
assert.match(source,/cameras\.main\.setZoom\(/,'scene must apply CameraRig zoom to Phaser camera');
assert.match(source,/DepthSystem\.depthFor\(projection\s*,\s*1\)/);
assert.match(source,/DepthSystem\.depthFor\(projection\s*,\s*-1\)/);
assert.doesNotMatch(source,/view\.depth|view\.shadowDepth/);

assert.match(html,/src="\.\/src\/systems\/CameraRig\.js\?v=raishin-world-core-v1"/,'v2 shell must load cache-busted CameraRig');
assert.doesNotMatch(html,/src="\.\/src\/systems\/CameraFollow\.js/,'v2 shell must no longer load CameraFollow');
assert.match(bootstrap,/['"]CameraRig['"]/,'v2 bootstrap must require CameraRig');
assert.doesNotMatch(bootstrap,/['"]CameraFollow['"]/,'v2 bootstrap must not require old CameraFollow');
assert.match(html,/src="\.\/src\/scenes\/DojoScene\.js\?v=raishin-world-core-v1"[\s\S]*src="\.\/v2-game\.js\?v=raishin-world-core-v1"/);

const controllerIndex=source.indexOf('controller.step');
const projectIndex=source.indexOf('worldPlane.project',controllerIndex);
const animatorIndex=source.indexOf('animator.update',projectIndex);
const viewIndex=source.indexOf('PlayerView.compute',animatorIndex);
const cameraIndex=source.indexOf('cameraRig.update',viewIndex);
assert.ok(controllerIndex>=0&&projectIndex>controllerIndex&&animatorIndex>projectIndex&&viewIndex>animatorIndex&&cameraIndex>viewIndex,'update order must end with camera after ground projection/view');
for(const forbidden of ['requestAnimationFrame','getImageData','findDenseFootContact','buildUpGroundingMetrics','buildLeftGroundingMetrics','upFootContactOffsets'])assert.ok(!source.includes(forbidden),`DojoScene must reject legacy path: ${forbidden}`);
console.log('PASS: Phaser DojoScene uses cache-busted CameraRig world core and shared depth');
