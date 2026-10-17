const path=require('path');
const assert=require('assert');

const root=path.resolve(__dirname,'..');
const PlayerController=require(path.join(root,'raishin-legacy','src','player','PlayerController.js'));
const PlayerView=require(path.join(root,'raishin-legacy','src','player','PlayerView.js'));

const identity=(current,proposed)=>proposed;
const step=(controller,input,count=1,dt=.05)=>{
  let state;
  for(let i=0;i<count;i++)state=controller.step({input,dt,resolveMotion:identity});
  return state;
};

const accel=PlayerController.createPlayerController();
const first=step(accel,{x:1,y:0});
assert.ok(first.speed>0&&first.speedRatio<.5,'first movement frame should start accelerating, not jump to full speed');
const at200ms=step(accel,{x:1,y:0},3);
assert.ok(at200ms.speedRatio>=.9&&at200ms.speedRatio<=1,'Raika should be near full walking speed after about 0.2s');

const diagonal=PlayerController.createPlayerController();
const diagState=step(diagonal,{x:1,y:1},20);
assert.ok(diagState.speed<=diagonal.maxSpeed+1e-9,'diagonal speed must not exceed straight-line max speed');
assert.ok(Math.abs(Math.abs(diagState.vx)-Math.abs(diagState.vy))<1e-6,'45-degree diagonal should split velocity evenly');

const coast=PlayerController.createPlayerController();
let coastState=step(coast,{x:1,y:0},20);
const fullSpeed=coastState.speed;
coastState=step(coast,{x:0,y:0});
assert.ok(coastState.speed>0&&coastState.speed<fullSpeed,'release should decelerate progressively');
assert.equal(coastState.turning,false);

const reverse=PlayerController.createPlayerController();
let reverseState=step(reverse,{x:1,y:0},20);
assert.ok(reverseState.vx>0);
reverseState=step(reverse,{x:-1,y:0});
assert.equal(reverseState.turning,true,'hard reversal should enter a brief turning/braking state');
assert.ok(reverseState.vx>0,'first reversal frame should brake existing momentum instead of snapping instantly backward');
reverseState=step(reverse,{x:-1,y:0},8);
assert.ok(reverseState.vx<0,'continued opposite input should complete the turn and move backward');

const facing=PlayerController.createPlayerController();
let facingState=step(facing,{x:1,y:.86},6);
assert.equal(facingState.facing,'right');
facingState=step(facing,{x:.92,y:1},1);
assert.equal(facingState.facing,'right','small diagonal noise should keep the previous dominant facing');
facingState=step(facing,{x:.55,y:1},2);
assert.equal(facingState.facing,'down','clear vertical intent should switch facing');

const blocked=PlayerController.createPlayerController();
const blockedState=blocked.step({input:{x:0,y:-1},dt:.05,resolveMotion:(current)=>current});
assert.equal(blockedState.movedDistance,0);
assert.equal(blockedState.totalDistance,0);

const projection={x:720,y:610,scale:.9,depth:610};
const pivot={x:.5,y:.99};
const leaned=PlayerView.compute({projection,pivot,motion:{vx:220,vy:0,speedRatio:.8}});
assert.equal(leaned.x,projection.x);
assert.equal(leaned.y,projection.y);
assert.equal(leaned.shadowX,projection.x);
assert.equal(leaned.shadowY,projection.y);
assert.ok(leaned.rotation>0&&leaned.rotation<=.035,'lean should be visible but restrained to about two degrees');
const neutral=PlayerView.compute({projection,pivot,motion:{vx:0,vy:0,speedRatio:0}});
assert.equal(neutral.rotation,0);

console.log('PASS: Raishin v2 professional player movement feel');
