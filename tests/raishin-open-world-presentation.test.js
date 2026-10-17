const assert=require('assert');
const path=require('path');
const movement=require(path.join(__dirname,'..','raishin-legacy','movement.js'));
const effects=require(path.join(__dirname,'..','raishin-legacy','dojo-effects.js'));
const baseDepth=movement.scaleForDepth(690,365,830);
const baseCamera=effects.updateCamera({x:0,y:0},{x:1200,y:760},.05,{centerX:800,centerY:650,deadZoneX:180,deadZoneY:90,maxX:48,maxY:28,followStrength:6});
const presentation=require(path.join(__dirname,'..','raishin-legacy','open-world-presentation.js'));
presentation.install(movement,effects);

assert.ok(presentation.PROFILE.playerScale>=1.35&&presentation.PROFILE.playerScale<=1.55,'open-world v2 should make Raika unmistakably larger relative to the dojo');
assert.ok(presentation.PROFILE.contactCorrectionPx>=12&&presentation.PROFILE.contactCorrectionPx<=18,'open-world v2 should visibly plant legacy frames on the floor');

const tunedDepth=movement.scaleForDepth(690,365,830);
assert.ok(tunedDepth>baseDepth*1.34,'Raika should read as a third-person hero rather than a small map token');

const idle=effects.groundingMotion(0,false,0,tunedDepth*1.08);
assert.ok(idle.bobY>=12,'front/back legacy frames should be lowered decisively to the floor contact line');
assert.ok(idle.shadowAlpha>=.44,'contact shadow should visibly carry body weight');
assert.ok(idle.shadowScaleX>=1.07,'contact shadow should remain broad enough to prevent a floating read');
assert.strictEqual(idle.footPlant,1,'presentation layer must keep the feet planted instead of adding vertical walk bounce');

const tunedCamera=effects.updateCamera({x:0,y:0},{x:1200,y:760},.05,{centerX:800,centerY:650,deadZoneX:180,deadZoneY:90,maxX:48,maxY:28,followStrength:6});
assert.ok(Math.abs(tunedCamera.x)>Math.abs(baseCamera.x),'open-world camera should follow horizontal travel more actively');
assert.ok(Math.abs(tunedCamera.y)>Math.abs(baseCamera.y),'open-world camera should follow depth travel more actively');

console.log('PASS: Raishin open-world presentation v2 profile');
