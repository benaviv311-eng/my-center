const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const controllerPath=path.join(root,'raishin-legacy','src','player','PlayerController.js');
assert.ok(fs.existsSync(controllerPath),'PlayerController module must exist');
const PlayerController=require(controllerPath);
for(const name of ['inputFromKeys','normalizeInput','createPlayerController'])assert.equal(typeof PlayerController[name],'function',`${name} must exist`);

assert.deepStrictEqual(PlayerController.inputFromKeys(new Set(['KeyW'])),{x:0,y:-1});
assert.deepStrictEqual(PlayerController.inputFromKeys(new Set(['ArrowDown','KeyD'])),{x:1,y:1});
assert.deepStrictEqual(PlayerController.inputFromKeys(new Set(['KeyA','ArrowRight'])),{x:0,y:0});
assert.deepStrictEqual(PlayerController.inputFromKeys(new Set(['KeyW','KeyS'])),{x:0,y:0});
const diagonal=PlayerController.normalizeInput({x:1,y:1});
assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-9,'diagonal input must normalize to unit length');
assert.deepStrictEqual(PlayerController.normalizeInput({x:0,y:0}),{x:0,y:0});

const identity=(current,proposed)=>proposed;
const controller=PlayerController.createPlayerController();
let s=controller.snapshot();
assert.deepStrictEqual({x:s.worldX,y:s.worldY},{x:500,y:420});
assert.equal(s.facing,'down');
assert.equal(s.moving,false);

s=controller.step({input:{x:1,y:0},dt:.05,resolveMotion:identity});
assert.ok(s.vx>0&&s.vx<=50.000001,'acceleration must be capped by 1000 world units/s²');
assert.equal(s.vy,0);
assert.equal(s.facing,'right');
for(let i=0;i<20;i++)s=controller.step({input:{x:1,y:0},dt:.05,resolveMotion:identity});
assert.ok(Math.hypot(s.vx,s.vy)<=300.000001,'speed must not exceed maxSpeed');
const beforeSlow=s.vx;
s=controller.step({input:{x:0,y:0},dt:.05,resolveMotion:identity});
assert.ok(s.vx<beforeSlow&&s.vx>=0,'idle input must decelerate');
const idleFacing=s.facing;
for(let i=0;i<20;i++)s=controller.step({input:{x:0,y:0},dt:.05,resolveMotion:identity});
assert.equal(s.moving,false);
assert.equal(s.facing,idleFacing,'facing must remain stable while idle');

const clampController=PlayerController.createPlayerController();
const clamped=clampController.step({input:{x:1,y:0},dt:1,resolveMotion:identity});
assert.ok(clamped.vx<=50.000001,'dt must clamp to .05 seconds');

const upController=PlayerController.createPlayerController();
const startY=upController.snapshot().worldY;
let up;
for(let i=0;i<40;i++)up=upController.step({input:{x:0,y:-1},dt:.05,resolveMotion:identity});
assert.equal(up.facing,'up');
assert.ok(up.worldY<startY-100,'held UP must substantially decrease logical worldY');
assert.ok(up.totalDistance>100,'distance must accumulate from resolved world displacement');
assert.ok(up.movedDistance>0);

const blockedController=PlayerController.createPlayerController();
const blocked=blockedController.step({input:{x:0,y:-1},dt:.05,resolveMotion:(current)=>current});
assert.equal(blocked.movedDistance,0,'blocked motion must report zero real distance');
assert.equal(blocked.totalDistance,0);
assert.doesNotMatch(fs.readFileSync(controllerPath,'utf8'),/screen|sprite|scale|Phaser/i,'controller must know only world simulation');
console.log('PASS: Raishin v2 player simulation lives in World Space');
