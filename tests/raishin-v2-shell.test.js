const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const dir=path.join(root,'raishin-legacy');
const v2HtmlPath=path.join(dir,'v2.html');
const v2GamePath=path.join(dir,'v2-game.js');
const liveHtml=fs.readFileSync(path.join(dir,'index.html'),'utf8');

assert.ok(fs.existsSync(v2HtmlPath),'v2 preview html must exist');
assert.ok(fs.existsSync(v2GamePath),'v2 bootstrap must exist');

const html=fs.readFileSync(v2HtmlPath,'utf8');
const js=fs.readFileSync(v2GamePath,'utf8');
const phaser='https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js';
const phaserIndex=html.indexOf(phaser);
assert.ok(phaserIndex>=0,'preview must load pinned Phaser 4.2.1');
assert.ok(phaserIndex<html.indexOf('./v2-game.js'),'Phaser must load before the v2 bootstrap');
assert.match(html,/data-game-aspect="16:9"/,'preview must preserve 16:9 shell');
assert.match(html,/id="phaserGame"/,'preview must expose Phaser mount point');
assert.match(html,/inazuma-main-hall-clean\.png/,'preview must reference the approved dojo background');
assert.match(html,/raika-walk-4dir-8f\.png/,'preview must reference the existing Raika movement sheet');
for(const modulePath of ['./src/world/WorldModel.js','./src/systems/CameraRig.js','./src/systems/DepthSystem.js'])assert.ok(html.includes(modulePath),`v2 shell missing world-core module ${modulePath}`);
assert.doesNotMatch(html,/\.\/src\/systems\/CameraFollow\.js/,'v2 preview must not load legacy tiny-camera adapter');
for(const name of ['WorldModel','CameraRig','DepthSystem'])assert.ok(js.includes(`'${name}'`),`v2 bootstrap must require ${name}`);
for(const marker of ['Health','Raihatsu','Objective','Jump','Dodge','Interact','minimap']) assert.ok(html.includes(marker),`missing HUD marker: ${marker}`);
assert.doesNotMatch(`${html}\n${js}`,/image_gen|generated.*sprite|new.*asset/i,'preview must not create or request new visual art');

const buildTag='raishin-world-core-v1';
const cacheBusted=[
  './styles.css',
  './src/world/dojo-layout.js','./src/world/WorldModel.js','./src/world/WorldPlane.js','./src/world/CollisionMap.js',
  './src/player/PlayerController.js','./src/systems/InteractionSystem.js','./src/systems/CameraRig.js','./src/systems/DepthSystem.js',
  './src/player/raika-animation-data.js','./src/player/PlayerAnimator.js','./src/player/PlayerView.js','./src/scenes/DojoScene.js','./v2-game.js'
];
for(const asset of cacheBusted)assert.ok(html.includes(`${asset}?v=${buildTag}`),`v2 preview must cache-bust ${asset}`);

assert.match(liveHtml,/\.\/movement\.js[\s\S]*\.\/dojo-world\.js[\s\S]*\.\/dojo-effects\.js[\s\S]*\.\/game\.js/,'live route must remain on legacy engine until v2 visual approval');
console.log('PASS: isolated cache-busted Raishin world-core v2 preview with legacy migration guard');
