const assert=require('assert'),path=require('path');
const world=require(path.join(__dirname,'..','raishin-legacy','dojo-world.js'));

assert.strictEqual(typeof world.floorBackEdgeAtX,'function','floorBackEdgeAtX must exist');
assert.strictEqual(world.isWalkable({x:800,y:650},24),true,'main floor center must stay walkable');
assert.strictEqual(world.isWalkable({x:800,y:540},24),false,'Raika must never walk onto the rear wall');
assert.strictEqual(world.isWalkable({x:650,y:520},24),false,'weapon shelves/rear wall must be outside the floor plane');
assert.ok(world.floorBackEdgeAtX(800)>=560,'rear floor edge must stay below the wall shelves');

let p={x:800,y:650};
for(let i=0;i<120;i++)p=world.resolvePlayerMotion(p,{x:p.x,y:p.y-4},24);
assert.ok(p.y>=world.floorBackEdgeAtX(p.x)+20,'holding Up must stop Raika at the rear floor edge');
assert.ok(p.y<650,'holding Up should still move Raika into floor depth');

const leftRear={x:390,y:575};
assert.strictEqual(world.isWalkable(leftRear,24),false,'rear-left perspective boundary must block wall climbing');
const rightRear={x:1210,y:575};
assert.strictEqual(world.isWalkable(rightRear,24),false,'rear-right perspective boundary must block wall climbing');

console.log('PASS: physical dojo floor plane v2');
