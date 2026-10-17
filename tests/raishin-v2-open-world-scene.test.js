const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const scenePath=path.join(root,'raishin-legacy','src','scenes','DojoScene.js');
const source=fs.readFileSync(scenePath,'utf8');

for(const dep of ['WorldModel','WorldPlane','CollisionMap','InteractionSystem','CameraRig','DepthSystem'])assert.ok(source.includes(dep),`open-world scene must consume ${dep}`);
assert.match(source,/WorldModel\.create\(DojoLayout\)/,'scene must create authoritative WorldModel');
assert.match(source,/CollisionMap\.create\(this\.worldModel\)/,'collision must consume WorldModel, not compatibility bounds');
assert.match(source,/PlayerController\.createPlayerController\(\{spawn:this\.worldModel\.spawn/,'player must spawn from world model');
assert.match(source,/InteractionSystem\.create\(this\.worldModel\s*,\s*this\.worldPlane\)/,'interactions must consume world-space model');
assert.match(source,/HERO_BASE_HEIGHT\s*=\s*300/,'single hero height calibration must be 300px before perspective scale');
assert.doesNotMatch(source,/355\s*\/\s*this\.frameHeight/,'old oversized 355px character calibration must be gone');
assert.match(source,/this\.environmentLayers\s*=\s*\{/,'scene must create named environment layers');
for(const layer of ['rear','floor','props','foreground'])assert.ok(source.includes(`${layer}:`),`environment layer ${layer} must exist`);
assert.match(source,/worldModel\.renderObjects/,'scene must compose semantic world render objects');
assert.match(source,/drawFloor/,'walkable floor must render as its own projected layer');
assert.match(source,/createWorldProp/,'world props must render independently from background art');
assert.match(source,/DepthSystem\.depthFor\(/,'world props/player must use planted-ground depth');
assert.match(source,/DepthSystem\.fixedBand\(['"]background['"]\)/,'rear architecture must use fixed background band');
assert.match(source,/DepthSystem\.fixedBand\(['"]floor['"]\)/,'floor must use fixed floor band');
assert.match(source,/DepthSystem\.fixedBand\(['"]foreground['"]\)/,'permanent foreground architecture must use foreground band');
assert.match(source,/setBounds\(this\.worldModel\.renderBounds\.x/,'Phaser camera bounds must come from world render bounds');
assert.doesNotMatch(source,/add\.image\(800\s*,\s*450\s*,\s*['"]dojo-bg['"]\)/,'single-screen 1600x900 stage image must be removed');
assert.doesNotMatch(source,/setDisplaySize\(1600\s*,\s*900\)/,'world must not be represented as a 1600x900 screenshot');
assert.doesNotMatch(source,/bobY|contactCorrectionPx|findDenseFootContact/,'open-world scene must not reintroduce legacy grounding offsets');

const heroRatio=(300*.986)/900;
assert.ok(heroRatio>=.28&&heroRatio<=.36,'spawn hero calibration must land in the 28-36% viewport target');
console.log('PASS: Raishin v2 layered scrolling Inazuma scene contract');
