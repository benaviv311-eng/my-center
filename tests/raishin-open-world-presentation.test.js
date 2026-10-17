const assert=require('assert');
const path=require('path');
const movement=require(path.join(__dirname,'..','raishin-legacy','movement.js'));
const effects=require(path.join(__dirname,'..','raishin-legacy','dojo-effects.js'));
const baseDepth=movement.scaleForDepth(690,365,830);
const baseCamera=effects.updateCamera({x:0,y:0},{x:1200,y:760},.05,{centerX:800,centerY:650,deadZoneX:180,deadZoneY:90,maxX:48,maxY:28,followStrength:6});
const presentation=require(path.join(__dirname,'..','raishin-legacy','open-world-presentation.js'));
presentation.install(movement,effects);

assert.ok(presentation.PROFILE.playerScale>=1.15&&presentation.PROFILE.playerScale<=1.25,'open-world profile should enlarge Raika without distorting the world');
assert.ok(presentation.PROFILE.contactCorrectionPx>=4&&presentation.PROFILE.contactCorrectionPx<=9,'ground contact correction should be deliberate and subtle');

const tunedDepth=movement.scaleForDepth(690,365,830);
assert.ok(tunedDepth>baseDepth*1.14,'Raika should read larger relative to the dojo');

const idle=effects.groundingMotion(0,false,0,tunedDepth*1.08);
assert.ok(idle.bobY>=4,'front/back legacy frames should be lowered to the floor contact line');
assert.ok(idle.shadowAlpha>=.38,'contact shadow should visually carry body weight');
assert.ok(idle.shadowScaleX>=1.03,'contact shadow should stay broad enough to prevent a floating read');

const tunedCamera=effects.updateCamera({x:0,y:0},{x:1200,y:760},.05,{centerX:800,centerY:650,deadZoneX:180,deadZoneY:90,maxX:48,maxY:28,followStrength:6});
assert.ok(Math.abs(tunedCamera.x)>Math.abs(baseCamera.x),'open-world camera should follow horizontal travel more actively');
assert.ok(Math.abs(tunedCamera.y)>Math.abs(baseCamera.y),'open-world camera should follow depth travel more actively');

console.log('PASS: Raishin open-world presentation profile');
